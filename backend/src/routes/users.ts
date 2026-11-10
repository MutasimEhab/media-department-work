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
const appPermissionCodes = [
  'view_management_dashboard','view_employee_dashboard','create_work_log','view_own_work_logs','manage_own_work_logs',
  'view_department_work_logs','view_assignments','manage_assignments','review_assignments','view_projects','manage_projects',
  'view_circulars','manage_circulars','track_circulars','view_notifications','receive_missing_work_alerts',
  'view_own_exceptions','view_own_report','view_department_reports','manage_users','manage_system_settings',
  'manage_work_exceptions','view_audit_log','view_system_health',
];
const protectedUserPermissions = new Set([
  'manage_users','manage_system_settings','manage_work_exceptions','view_department_work_logs',
  'view_department_reports','view_audit_log','view_system_health',
]);

function publicUser(row: Record<string, unknown>) {
  return {
    id: row.id,
    username: row.username,
    arabicName: row.full_name_ar,
    role: codeToRole[String(row.role_code)] ?? 'EMPLOYEE',
    accountTypeCode: String(row.account_type_code ?? row.role_code),
    accountTypeNameAr: String(row.account_type_name_ar ?? row.role_name_ar ?? ''),
    jobTitleAr: row.job_title_ar,
    employeeNumber: row.employee_number ?? undefined,
    avatar: row.avatar_data ?? undefined,
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
    || Boolean(request.permissions?.includes('manage_users'));
}

function routeUserId(request: AuthenticatedRequest): string {
  const value = request.params.userId;
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

async function findManageableTarget(request: AuthenticatedRequest, userId: string) {
  const result = await db.query<{ id: string; role_code: string; account_type_code: string; department_id: string | null }>(
    'SELECT id, role_code, account_type_code, department_id FROM users WHERE id = $1',
    [userId],
  );
  const target = result.rows[0];
  if (!target) return { target: null, allowed: false };
  const actor = request.authUser!;
  const targetIsDepartmentEmployee = target.role_code === 'employee';
  const managerCanManageDeputy = actor.roleCode === 'department_manager' && target.role_code === 'deputy_manager';
  const allowed = actor.roleCode === 'system_admin'
    || (['department_manager', 'deputy_manager'].includes(actor.roleCode)
      && Boolean(request.permissions?.includes('manage_users'))
      && (targetIsDepartmentEmployee || managerCanManageDeputy)
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

router.get('/account-types', async (request: AuthenticatedRequest, response) => {
  if (!canManageUsers(request)) {
    response.status(403).json({ message: 'لا تملك صلاحية عرض أنواع الحسابات.' });
    return;
  }
  try {
    const result = await db.query<{ code: string; name_ar: string; base_role_code: string; is_system: boolean }>(
      `SELECT code, name_ar, base_role_code, is_system FROM roles
        WHERE base_role_code <> 'system_admin' ORDER BY is_system DESC, name_ar`,
    );
    response.json({ accountTypes: result.rows.map((row) => ({
      code: row.code, nameAr: row.name_ar, baseRoleCode: row.base_role_code, isSystem: row.is_system,
    })) });
  } catch {
    console.error('Failed to load account types from the database.');
    response.status(503).json({ message: 'تعذر قراءة أنواع الحسابات من قاعدة البيانات؛ أعد تشغيل الخادم ثم حدّث الصفحة.' });
  }
});

router.get('/report-employees', async (request: AuthenticatedRequest, response) => {
  if (!request.permissions?.includes('view_department_reports') && request.authUser?.roleCode !== 'system_admin') {
    response.status(403).json({ message: 'لا تملك صلاحية عرض أسماء الموظفين في التقارير.' });
    return;
  }
  const actor = request.authUser!;
  const result = await db.query<{ id: string; full_name_ar: string; employee_number: string | null; job_title_ar: string }>(
    `SELECT id, full_name_ar, employee_number, job_title_ar FROM users
      WHERE role_code = 'employee' AND is_active = true
        AND ($1::text = 'system_admin' OR department_id = $2)
      ORDER BY full_name_ar`,
    [actor.roleCode, actor.departmentId],
  );
  response.json({ employees: result.rows.map((row) => ({
    id: row.id, arabicName: row.full_name_ar,
    employeeNumber: row.employee_number ?? undefined, jobTitleAr: row.job_title_ar,
  })) });
});

router.get('/job-titles', async (request: AuthenticatedRequest, response) => {
  const actor = request.authUser!;
  const result = await db.query<{ id: string; name_ar: string; department_id: string | null }>(
    `SELECT id, name_ar, department_id FROM job_titles
      WHERE department_id IS NULL OR department_id = $1
      ORDER BY name_ar`,
    [actor.departmentId],
  );
  response.json({ jobTitles: result.rows.map((row) => ({ id: row.id, nameAr: row.name_ar, departmentId: row.department_id ?? undefined })) });
});

router.post('/job-titles', async (request: AuthenticatedRequest, response) => {
  const actor = request.authUser!;
  const nameAr = typeof request.body?.nameAr === 'string' ? request.body.nameAr.trim() : '';
  if (!nameAr || nameAr.length > 120) {
    response.status(400).json({ message: 'اكتب مسمى وظيفياً من 1 إلى 120 حرفاً.' });
    return;
  }
  if (actor.roleCode !== 'system_admin' && (!request.permissions?.includes('manage_users') || !actor.departmentId)) {
    response.status(403).json({ message: 'لا تملك صلاحية إدارة المسميات الوظيفية.' });
    return;
  }
  const departmentId = actor.roleCode === 'system_admin' ? null : actor.departmentId;
  try {
    const result = await db.query<{ id: string; name_ar: string; department_id: string | null }>(
      `INSERT INTO job_titles (name_ar, department_id, created_by) VALUES ($1, $2, $3)
       RETURNING id, name_ar, department_id`,
      [nameAr, departmentId, actor.id],
    );
    const createdTitle = result.rows[0]!;
    await db.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'job_title.create', 'job_titles', $2, $3::jsonb)`,
      [actor.id, createdTitle.id, JSON.stringify({ nameAr })],
    );
    response.status(201).json({ jobTitle: { id: createdTitle.id, nameAr: createdTitle.name_ar, departmentId: createdTitle.department_id ?? undefined } });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
      response.status(409).json({ message: 'هذا المسمى الوظيفي موجود مسبقاً.' });
      return;
    }
    response.status(503).json({ message: 'تعذر إضافة المسمى الوظيفي.' });
  }
});

router.patch('/job-titles/:titleId', async (request: AuthenticatedRequest, response) => {
  const actor = request.authUser!;
  const nameAr = typeof request.body?.nameAr === 'string' ? request.body.nameAr.trim() : '';
  if (!nameAr || nameAr.length > 120) {
    response.status(400).json({ message: 'اكتب مسمى وظيفياً من 1 إلى 120 حرفاً.' });
    return;
  }
  if (actor.roleCode !== 'system_admin' && (!request.permissions?.includes('manage_users') || !actor.departmentId)) {
    response.status(403).json({ message: 'لا تملك صلاحية تعديل المسميات الوظيفية.' });
    return;
  }
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const found = await client.query<{ id: string; name_ar: string; department_id: string | null }>(
      `SELECT id, name_ar, department_id FROM job_titles WHERE id = $1 FOR UPDATE`,
      [request.params.titleId],
    );
    const current = found.rows[0];
    if (!current || (actor.roleCode !== 'system_admin' && current.department_id !== actor.departmentId)) {
      await client.query('ROLLBACK');
      response.status(404).json({ message: 'المسمى الوظيفي غير موجود في دائرتك.' });
      return;
    }
    await client.query('UPDATE job_titles SET name_ar = $2 WHERE id = $1', [current.id, nameAr]);
    await client.query(
      `UPDATE users SET job_title_ar = $2, updated_at = now()
        WHERE job_title_ar = $1 AND ($3::uuid IS NULL OR department_id = $3)`,
      [current.name_ar, nameAr, current.department_id],
    );
    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'job_title.rename', 'job_titles', $2, $3::jsonb)`,
      [actor.id, current.id, JSON.stringify({ from: current.name_ar, to: nameAr })],
    );
    await client.query('COMMIT');
    response.json({ jobTitle: { id: current.id, nameAr, departmentId: current.department_id ?? undefined } });
  } catch (error) {
    await client.query('ROLLBACK');
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
      response.status(409).json({ message: 'يوجد مسمى مطابق بالفعل في هذه القائمة.' });
      return;
    }
    response.status(503).json({ message: 'تعذر تعديل المسمى الوظيفي.' });
  } finally {
    client.release();
  }
});

router.patch('/me/profile', async (request: AuthenticatedRequest, response) => {
  const fullNameAr = typeof request.body?.arabicName === 'string' ? request.body.arabicName.trim() : '';
  const mobile = typeof request.body?.mobile === 'string' ? request.body.mobile.trim() : '';
  const avatar = request.body?.avatar;
  if (!fullNameAr || fullNameAr.length > 120 || mobile.length > 40
    || (avatar !== null && avatar !== undefined && (typeof avatar !== 'string'
      || avatar.length > 350_000
      || !/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(avatar)))) {
    response.status(400).json({ message: 'تحقق من الاسم ورقم الاتصال والصورة؛ حجم الصورة يجب أن يكون صغيراً.' });
    return;
  }
  try {
    const updated = await db.query(
      `UPDATE users SET full_name_ar = $2, mobile = $3,
          avatar_data = CASE WHEN $4::boolean THEN $5 ELSE avatar_data END,
          updated_at = now()
        WHERE id = $1
        RETURNING id, username, email, full_name_ar, job_title_ar, employee_number,
                  avatar_data, mobile, role_code, is_active, department_id, last_login_at`,
      [request.authUser!.id, fullNameAr, mobile || null, avatar !== undefined, avatar ?? null],
    );
    if (!updated.rowCount) {
      response.status(404).json({ message: 'الحساب غير موجود.' });
      return;
    }
    await db.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'user.own_profile.update', 'users', $2, $3::jsonb)`,
      [request.authUser!.id, request.authUser!.id, JSON.stringify({ hasAvatar: avatar !== undefined })],
    );
    const department = await db.query<{ name_ar: string }>(
      'SELECT name_ar FROM departments WHERE id = $1', [updated.rows[0].department_id],
    );
    response.json({ user: publicUser({ ...updated.rows[0], department_name_ar: department.rows[0]?.name_ar ?? '' }) });
  } catch {
    response.status(503).json({ message: 'تعذر حفظ الملف الشخصي حالياً.' });
  }
});

router.patch('/:userId/status', async (request: AuthenticatedRequest, response) => {
  const { target, allowed } = await findManageableTarget(request, routeUserId(request));
  if (!target) {
    response.status(404).json({ message: 'المستخدم غير موجود.' });
    return;
  }
  if (!allowed) {
    response.status(403).json({ message: 'لا تملك صلاحية تغيير حالة هذا الحساب.' });
    return;
  }
  const isActive = request.body?.isActive;
  if (typeof isActive !== 'boolean') {
    response.status(400).json({ message: 'حالة الحساب غير صالحة.' });
    return;
  }
  if (target.id === request.authUser!.id && !isActive) {
    response.status(409).json({ message: 'لا يمكنك إيقاف حسابك الحالي.' });
    return;
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    if (!isActive && target.role_code === 'system_admin') {
      await client.query('SELECT pg_advisory_xact_lock(97412026)');
      const activeAdmins = await client.query<{ count: string }>(
        `SELECT count(*)::text AS count FROM users
          WHERE role_code = 'system_admin' AND is_active = true`,
      );
      if (Number(activeAdmins.rows[0]?.count ?? 0) <= 1) {
        await client.query('ROLLBACK');
        response.status(409).json({ message: 'لا يمكن إيقاف آخر حساب نشط لمدير النظام.' });
        return;
      }
    }
    await client.query(
      'UPDATE users SET is_active = $2, updated_at = now() WHERE id = $1',
      [target.id, isActive],
    );
    if (!isActive) {
      await client.query(
        'UPDATE login_sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL',
        [target.id],
      );
    }
    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, 'users', $3, $4::jsonb)`,
      [request.authUser!.id, isActive ? 'user.activate' : 'user.deactivate', target.id, JSON.stringify({ isActive })],
    );
    await client.query('COMMIT');
    response.json({ userId: target.id, isActive });
  } catch {
    await client.query('ROLLBACK');
    response.status(503).json({ message: 'تعذر تغيير حالة الحساب حالياً.' });
  } finally {
    client.release();
  }
});

router.delete('/:userId', async (request: AuthenticatedRequest, response) => {
  const { target, allowed } = await findManageableTarget(request, routeUserId(request));
  if (!target) {
    response.status(404).json({ message: 'المستخدم غير موجود.' });
    return;
  }
  if (!allowed) {
    response.status(403).json({ message: 'لا تملك صلاحية حذف هذا الحساب.' });
    return;
  }
  if (target.id === request.authUser!.id || target.role_code === 'system_admin') {
    response.status(409).json({ message: 'لا يمكن حذف حساب مدير النظام أو حسابك الحالي.' });
    return;
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const user = await client.query<{ full_name_ar: string; role_code: string }>(
      'SELECT full_name_ar, role_code FROM users WHERE id = $1 FOR UPDATE',
      [target.id],
    );
    if (!user.rowCount) {
      await client.query('ROLLBACK');
      response.status(404).json({ message: 'المستخدم غير موجود.' });
      return;
    }
    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'user.delete', 'users', $2, $3::jsonb)`,
      [request.authUser!.id, target.id, JSON.stringify(user.rows[0])],
    );
    await client.query('DELETE FROM users WHERE id = $1', [target.id]);
    await client.query('COMMIT');
    response.json({ userId: target.id, deleted: true });
  } catch (error) {
    await client.query('ROLLBACK');
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23503') {
      response.status(409).json({ message: 'لا يمكن حذف الحساب لأنه مرتبط بسجلات. أوقفه بدلاً من ذلك للحفاظ على البيانات.' });
      return;
    }
    response.status(503).json({ message: 'تعذر حذف الحساب حالياً.' });
  } finally {
    client.release();
  }
});

router.patch('/:userId/profile', async (request: AuthenticatedRequest, response) => {
  const { target, allowed } = await findManageableTarget(request, routeUserId(request));
  if (!target) {
    response.status(404).json({ message: 'المستخدم غير موجود.' });
    return;
  }
  if (!allowed) {
    response.status(403).json({ message: 'لا تملك صلاحية تعديل بيانات هذا الحساب.' });
    return;
  }
  const jobTitleAr = typeof request.body?.jobTitleAr === 'string' ? request.body.jobTitleAr.trim() : '';
  const employeeNumber = typeof request.body?.employeeNumber === 'string' ? request.body.employeeNumber.trim() : '';
  if (!jobTitleAr || jobTitleAr.length > 120 || employeeNumber.length > 40) {
    response.status(400).json({ message: 'المسمى الوظيفي مطلوب، والرقم الوظيفي اختياري وحتى 40 خانة.' });
    return;
  }
  try {
    const updated = await db.query(
      `UPDATE users SET job_title_ar = $2, employee_number = $3, updated_at = now()
        WHERE id = $1
        RETURNING id, username, email, full_name_ar, job_title_ar, employee_number, mobile,
                  role_code, is_active, department_id, last_login_at`,
      [target.id, jobTitleAr, employeeNumber || null],
    );
    await db.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'user.profile.update', 'users', $2, $3::jsonb)`,
      [request.authUser!.id, target.id, JSON.stringify({ jobTitleAr, employeeNumber })],
    );
    const department = await db.query<{ name_ar: string }>('SELECT name_ar FROM departments WHERE id = $1', [target.department_id]);
    response.json({ user: publicUser({ ...updated.rows[0], department_name_ar: department.rows[0]?.name_ar ?? '' }) });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
      response.status(409).json({ message: 'الرقم الوظيفي مستخدم لحساب آخر.' });
      return;
    }
    response.status(503).json({ message: 'تعذر حفظ بيانات الحساب حالياً.' });
  }
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
      WHERE p.code = ANY($3::text[]) ORDER BY p.name_ar`,
    [target.account_type_code, target.id, appPermissionCodes],
  );
  const restricted = request.authUser!.roleCode !== 'system_admin';
  const permissions = result.rows.filter((permission) => !restricted
    || !protectedUserPermissions.has(permission.code));
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
  const restricted = request.authUser!.roleCode !== 'system_admin';
  const forbidden = requested.some((code) => !appPermissionCodes.includes(code)
    || (restricted && protectedUserPermissions.has(code)));
  if (forbidden || target.role_code === 'system_admin') {
    response.status(400).json({ message: 'لا يمكن منح هذه الصلاحية لهذا الحساب.' });
    return;
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO user_permission_overrides (user_id, permission_code, is_granted, changed_by)
       SELECT $1, p.code, p.code = ANY($2::text[]), $3 FROM permissions p WHERE p.code = ANY($4::text[])
       ON CONFLICT (user_id, permission_code) DO UPDATE
         SET is_granted = EXCLUDED.is_granted, changed_by = EXCLUDED.changed_by, changed_at = now()`,
      [target.id, requested, request.authUser!.id, appPermissionCodes],
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
    `SELECT u.id, u.username, u.email, u.full_name_ar, u.job_title_ar, u.employee_number, u.mobile,
            u.role_code, u.account_type_code, at.name_ar AS account_type_name_ar,
            u.is_active, u.department_id, u.last_login_at,
            d.name_ar AS department_name_ar
       FROM users u
       LEFT JOIN departments d ON d.id = u.department_id
       LEFT JOIN roles at ON at.code = u.account_type_code
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
  const accountTypeCode = typeof body.accountTypeCode === 'string' ? body.accountTypeCode : '';
  const requestedRole = typeof body.role === 'string' ? roleToCode[body.role as keyof typeof roleToCode] : undefined;
  const fullNameAr = typeof body.arabicName === 'string' ? body.arabicName.trim() : '';
  const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
  const emailValue = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const email = emailValue || null;
  const jobTitleAr = typeof body.jobTitleAr === 'string' ? body.jobTitleAr.trim() : '';
  const employeeNumber = typeof body.employeeNumber === 'string' ? body.employeeNumber.trim() : '';
  const mobile = typeof body.mobile === 'string' ? body.mobile.trim() : null;
  const password = typeof body.password === 'string' ? body.password : '';

  if (!fullNameAr || !username || !jobTitleAr || jobTitleAr.length > 120 || employeeNumber.length > 40
    || (email !== null && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    response.status(400).json({ message: 'أدخل الاسم العربي واسم المستخدم والمسمى، وتحقق من البريد أو الرقم إن أُدخلا.' });
    return;
  }
  const typeResult = accountTypeCode
    ? await db.query<{ code: string; name_ar: string; base_role_code: string }>(
      `SELECT code, name_ar, base_role_code FROM roles WHERE code = $1 AND base_role_code <> 'system_admin'`, [accountTypeCode],
    )
    : requestedRole
      ? await db.query<{ code: string; name_ar: string; base_role_code: string }>(
        `SELECT code, name_ar, base_role_code FROM roles WHERE code = $1`, [requestedRole],
      )
      : { rows: [] };
  const accountType = typeResult.rows[0];
  const targetRole = accountType?.base_role_code;
  if (!accountType || !targetRole || targetRole === 'system_admin') {
    response.status(400).json({ message: 'نوع الحساب المحدد غير مسموح.' });
    return;
  }
  if (password.length < 9 || Buffer.byteLength(password, 'utf8') > 72) {
    response.status(400).json({ message: 'كلمة المرور يجب أن تكون 9 أحرف أو أرقام على الأقل ولا تتجاوز 72 بايتاً.' });
    return;
  }

  const actor = request.authUser!;
  const actorIsAdmin = actor.roleCode === 'system_admin';
  const allowed = actorIsAdmin
    || (actor.roleCode === 'department_manager' && request.permissions?.includes('manage_users') && ['deputy_manager', 'employee'].includes(targetRole))
    || (actor.roleCode === 'deputy_manager' && request.permissions?.includes('manage_users') && targetRole === 'employee');
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
      `INSERT INTO users (department_id, role_code, account_type_code, username, email, password_hash,
                          full_name_ar, job_title_ar, employee_number, mobile, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, username, email, full_name_ar, job_title_ar, mobile,
                 employee_number, role_code, account_type_code, is_active, department_id, last_login_at`,
      [departmentId, targetRole, accountType.code, username, email, passwordHash, fullNameAr, jobTitleAr, employeeNumber || null, mobile || null, actor.id],
    );
    const department = await db.query<{ name_ar: string }>('SELECT name_ar FROM departments WHERE id = $1', [departmentId]);
    response.status(201).json({ user: publicUser({ ...created.rows[0], account_type_name_ar: accountType.name_ar, department_name_ar: department.rows[0]?.name_ar ?? '' }) });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
      response.status(409).json({ message: 'اسم المستخدم أو البريد أو الرقم الوظيفي مستخدم مسبقاً.' });
      return;
    }
    response.status(503).json({ message: 'تعذر إنشاء الحساب حالياً.' });
  }
});

export default router;
