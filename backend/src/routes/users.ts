import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/require-auth.js';

const router = Router();
const roleToCode = {
  ADMIN: 'system_admin',
  MANAGER: 'department_manager',
  DEPUTY: 'deputy_manager',
  EMPLOYEE: 'employee',
} as const;
const codeToRole = Object.fromEntries(Object.entries(roleToCode).map(([role, code]) => [code, role])) as Record<string, keyof typeof roleToCode>;

function publicUser(row: Record<string, unknown>) {
  return {
    id: row.id,
    username: row.username,
    arabicName: row.full_name_ar,
    role: codeToRole[String(row.role_code)] ?? 'EMPLOYEE',
    jobTitleAr: row.job_title_ar,
    email: row.email,
    mobile: row.mobile ?? undefined,
    isActive: row.is_active,
    departmentId: row.department_id ?? undefined,
    departmentAr: row.department_name_ar ?? '',
    lastSignIn: row.last_login_at ?? undefined,
  };
}

function canManageUsers(request: AuthenticatedRequest): boolean {
  return request.authUser?.roleCode === 'system_admin'
    || Boolean(request.permissions?.includes('users.create_employee'));
}

function routeUserId(request: AuthenticatedRequest): string {
  const value = request.params.userId;
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

async function findManageableTarget(request: AuthenticatedRequest, userId: string) {
  const result = await db.query<{ id: string; role_code: string; department_id: string | null }>(
    'SELECT id, role_code, department_id FROM users WHERE id = $1',
    [userId],
  );
  const target = result.rows[0];
  if (!target) return { target: null, allowed: false };
  const actor = request.authUser!;
  const allowed = actor.roleCode === 'system_admin'
    || (['department_manager', 'deputy_manager'].includes(actor.roleCode)
      && target.role_code === 'employee'
      && target.department_id === actor.departmentId);
  return { target, allowed };
}

router.use(requireAuth);

router.get('/departments', async (_request, response) => {
  const result = await db.query<{ id: string; name_ar: string }>(
    'SELECT id, name_ar FROM departments ORDER BY name_ar',
  );
  response.json({ departments: result.rows.map((row) => ({ id: row.id, nameAr: row.name_ar })) });
});

router.get('/:userId/permissions', async (request: AuthenticatedRequest, response) => {
  const { target, allowed } = await findManageableTarget(request, routeUserId(request));
  if (!target) {
    response.status(404).json({ message: 'المستخدم غير موجود.' });
    return;
  }
  if (!allowed) {
    response.status(403).json({ message: 'تستطيع إدارة صلاحيات موظفي دائرتك فقط.' });
    return;
  }
  const result = await db.query<{ code: string; name_ar: string; enabled: boolean }>(
    `SELECT p.code, p.name_ar,
            COALESCE(upo.is_granted, rp.permission_code IS NOT NULL) AS enabled
       FROM permissions p
       LEFT JOIN role_permissions rp ON rp.permission_code = p.code AND rp.role_code = $1
       LEFT JOIN user_permission_overrides upo ON upo.permission_code = p.code AND upo.user_id = $2
      ORDER BY p.name_ar`,
    [target.role_code, target.id],
  );
  const restricted = request.authUser!.roleCode !== 'system_admin';
  const permissions = result.rows.filter((permission) => !restricted
    || !['users.', 'permissions.', 'system.'].some((prefix) => permission.code.startsWith(prefix)));
  response.json({ permissions });
});

router.put('/:userId/permissions', async (request: AuthenticatedRequest, response) => {
  const { target, allowed } = await findManageableTarget(request, routeUserId(request));
  if (!target) {
    response.status(404).json({ message: 'المستخدم غير موجود.' });
    return;
  }
  if (!allowed) {
    response.status(403).json({ message: 'تستطيع إدارة صلاحيات موظفي دائرتك فقط.' });
    return;
  }
  if (!Array.isArray(request.body?.permissionCodes)
    || request.body.permissionCodes.some((code: unknown) => typeof code !== 'string')) {
    response.status(400).json({ message: 'قائمة الصلاحيات غير صالحة.' });
    return;
  }
  const requested = [...new Set(request.body.permissionCodes as string[])];
  const result = await db.query<{ code: string }>('SELECT code FROM permissions');
  const known = new Set(result.rows.map((row) => row.code));
  const restricted = request.authUser!.roleCode !== 'system_admin';
  const forbidden = requested.some((code) => !known.has(code)
    || (restricted && ['users.', 'permissions.', 'system.'].some((prefix) => code.startsWith(prefix))));
  if (forbidden || target.role_code === 'system_admin') {
    response.status(400).json({ message: 'لا يمكن منح هذه الصلاحية لهذا الحساب.' });
    return;
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO user_permission_overrides (user_id, permission_code, is_granted, changed_by)
       SELECT $1, p.code, p.code = ANY($2::text[]), $3 FROM permissions p
       ON CONFLICT (user_id, permission_code) DO UPDATE
         SET is_granted = EXCLUDED.is_granted, changed_by = EXCLUDED.changed_by, changed_at = now()`,
      [target.id, requested, request.authUser!.id],
    );
    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'user.permissions.update', 'users', $2, $3::jsonb)`,
      [request.authUser!.id, target.id, JSON.stringify({ permissionCodes: requested })],
    );
    await client.query('COMMIT');
    response.json({ permissionCodes: requested });
  } catch {
    await client.query('ROLLBACK');
    response.status(503).json({ message: 'تعذر حفظ الصلاحيات حالياً.' });
  } finally {
    client.release();
  }
});

router.get('/', async (request: AuthenticatedRequest, response) => {
  if (!canManageUsers(request)) {
    response.status(403).json({ message: 'لا تملك صلاحية إدارة المستخدمين.' });
    return;
  }
  const { roleCode, departmentId } = request.authUser!;
  const result = await db.query(
    `SELECT u.id, u.username, u.email, u.full_name_ar, u.job_title_ar, u.mobile,
            u.role_code, u.is_active, u.department_id, u.last_login_at,
            d.name_ar AS department_name_ar
       FROM users u
       LEFT JOIN departments d ON d.id = u.department_id
      WHERE ($1::text = 'system_admin' OR u.department_id = $2)
      ORDER BY u.full_name_ar, u.created_at`,
    [roleCode, departmentId],
  );
  response.json({ users: result.rows.map(publicUser) });
});

router.post('/', async (request: AuthenticatedRequest, response) => {
  if (!canManageUsers(request)) {
    response.status(403).json({ message: 'لا تملك صلاحية إنشاء الحسابات.' });
    return;
  }

  const body = request.body ?? {};
  const role = String(body.role ?? '');
  const targetRole = roleToCode[role as keyof typeof roleToCode];
  const fullNameAr = typeof body.arabicName === 'string' ? body.arabicName.trim() : '';
  const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const jobTitleAr = typeof body.jobTitleAr === 'string' ? body.jobTitleAr.trim() : '';
  const mobile = typeof body.mobile === 'string' ? body.mobile.trim() : null;
  const password = typeof body.password === 'string' ? body.password : '';

  if (!fullNameAr || !username || !jobTitleAr || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    response.status(400).json({ message: 'أدخل الاسم العربي واسم المستخدم والبريد والمسمى الوظيفي بشكل صحيح.' });
    return;
  }
  if (!targetRole || targetRole === 'system_admin') {
    response.status(400).json({ message: 'نوع الحساب المحدد غير مسموح.' });
    return;
  }
  if (password.length < 10 || Buffer.byteLength(password, 'utf8') > 72) {
    response.status(400).json({ message: 'كلمة المرور يجب أن تكون 10 أحرف على الأقل ولا تتجاوز 72 بايتاً.' });
    return;
  }

  const actor = request.authUser!;
  const actorIsAdmin = actor.roleCode === 'system_admin';
  const allowed = actorIsAdmin
    || (actor.roleCode === 'department_manager' && ['deputy_manager', 'employee'].includes(targetRole))
    || (actor.roleCode === 'deputy_manager' && targetRole === 'employee');
  if (!allowed) {
    response.status(403).json({ message: 'لا تملك صلاحية إنشاء هذا الدور.' });
    return;
  }

  const requestedDepartment = typeof body.departmentId === 'string' ? body.departmentId : '';
  const departmentId = actorIsAdmin ? requestedDepartment : actor.departmentId;
  if (!departmentId) {
    response.status(400).json({ message: 'يجب تحديد الدائرة للحساب الجديد.' });
    return;
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const created = await db.query(
      `INSERT INTO users (department_id, role_code, username, email, password_hash,
                          full_name_ar, job_title_ar, mobile, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, username, email, full_name_ar, job_title_ar, mobile,
                 role_code, is_active, department_id, last_login_at`,
      [departmentId, targetRole, username, email, passwordHash, fullNameAr, jobTitleAr, mobile || null, actor.id],
    );
    const department = await db.query<{ name_ar: string }>('SELECT name_ar FROM departments WHERE id = $1', [departmentId]);
    response.status(201).json({ user: publicUser({ ...created.rows[0], department_name_ar: department.rows[0]?.name_ar ?? '' }) });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
      response.status(409).json({ message: 'اسم المستخدم أو البريد الإلكتروني مستخدم مسبقاً.' });
      return;
    }
    response.status(503).json({ message: 'تعذر إنشاء الحساب حالياً.' });
  }
});

export default router;
