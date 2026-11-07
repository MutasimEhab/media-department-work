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

router.use(requireAuth);

router.get('/departments', async (_request, response) => {
  const result = await db.query<{ id: string; name_ar: string }>(
    'SELECT id, name_ar FROM departments ORDER BY name_ar',
  );
  response.json({ departments: result.rows.map((row) => ({ id: row.id, nameAr: row.name_ar })) });
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
