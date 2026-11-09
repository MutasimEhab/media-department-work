import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/require-auth.js';

const router = Router();
const roles = ['system_admin', 'department_manager', 'deputy_manager', 'employee'] as const;
const featurePermissions = [
  'view_management_dashboard', 'view_employee_dashboard', 'create_work_log', 'view_own_work_logs',
  'manage_own_work_logs', 'view_department_work_logs', 'view_assignments', 'manage_assignments',
  'review_assignments', 'view_projects', 'manage_projects', 'view_circulars', 'manage_circulars',
  'track_circulars', 'view_notifications', 'receive_missing_work_alerts', 'view_own_exceptions',
  'view_own_report', 'view_department_reports', 'manage_users', 'manage_system_settings',
  'manage_work_exceptions', 'view_audit_log', 'view_system_health',
] as const;
const roleToFrontend: Record<typeof roles[number], 'ADMIN' | 'MANAGER' | 'DEPUTY' | 'EMPLOYEE'> = {
  system_admin: 'ADMIN', department_manager: 'MANAGER', deputy_manager: 'DEPUTY', employee: 'EMPLOYEE',
};
const frontendToRole: Record<string, typeof roles[number]> = Object.fromEntries(
  Object.entries(roleToFrontend).map(([code, role]) => [role, code]),
) as Record<string, typeof roles[number]>;
const adminOnlyPermissions = new Set(['manage_system_settings', 'view_audit_log', 'view_system_health']);
const employeeRestrictedPermissions = new Set([
  'view_management_dashboard', 'view_department_work_logs', 'view_department_reports',
  'manage_users', 'manage_work_exceptions',
]);

router.use(requireAuth);

router.get('/', async (_request, response) => {
  try {
    const result = await db.query<{ role_code: string; permission_code: typeof featurePermissions[number] }>(
      `SELECT role_code, permission_code FROM role_permissions
        WHERE permission_code = ANY($1::text[]) ORDER BY role_code, permission_code`,
      [featurePermissions],
    );
    const permissions: Record<string, string[]> = result.rows.reduce<Record<string, string[]>>((grouped, row) => {
        const key = roleToFrontend[row.role_code as typeof roles[number]] || row.role_code;
        (grouped[key] ||= []).push(row.permission_code);
        return grouped;
      }, {});
    for (const role of roles) permissions[roleToFrontend[role]] ||= [];
    response.json({ rolePermissions: permissions });
  } catch {
    response.status(503).json({ message: 'تعذر تحميل مصفوفة الصلاحيات.' });
  }
});

router.put('/:roleCode', async (request: AuthenticatedRequest, response) => {
  if (request.authUser!.roleCode !== 'system_admin') {
    response.status(403).json({ message: 'تعديل مصفوفة الأدوار متاح لمدير النظام فقط.' });
    return;
  }
  const roleCode = request.params.roleCode;
  const requestedRole = Array.isArray(roleCode) ? roleCode[0] : roleCode;
  const role = frontendToRole[requestedRole || ''] || requestedRole;
  const found = role ? await db.query<{ base_role_code: string; is_system: boolean }>(
    'SELECT base_role_code, is_system FROM roles WHERE code = $1', [role],
  ) : { rows: [] };
  const accountType = found.rows[0];
  if (!role || !accountType || role === 'system_admin') {
    response.status(400).json({ message: 'الدور المحدد غير قابل للتعديل.' });
    return;
  }
  const requested: unknown = request.body?.permissionCodes;
  if (!Array.isArray(requested) || requested.some(code => typeof code !== 'string' || !featurePermissions.includes(code as typeof featurePermissions[number]))) {
    response.status(400).json({ message: 'قائمة الصلاحيات غير صالحة.' });
    return;
  }
  const codes = [...new Set(requested as string[])];
  const roleSpecificForbidden = codes.some(code => adminOnlyPermissions.has(code)
    || (accountType.base_role_code === 'employee' && employeeRestrictedPermissions.has(code)));
  if (roleSpecificForbidden) {
    response.status(400).json({ message: 'إحدى الصلاحيات لا تُمنح لهذا الدور.' });
    return;
  }
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'DELETE FROM role_permissions WHERE role_code = $1 AND permission_code = ANY($2::text[])',
      [role, featurePermissions],
    );
    for (const code of codes) {
      await client.query('INSERT INTO role_permissions (role_code, permission_code) VALUES ($1, $2)', [role, code]);
    }
    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, metadata)
       VALUES ($1, 'role.permissions.update', 'roles', $2::jsonb)`,
      [request.authUser!.id, JSON.stringify({ roleCode: role, permissionCodes: codes })],
    );
    await client.query('COMMIT');
    response.json({ role: roleToFrontend[role as typeof roles[number]] || role, permissionCodes: codes });
  } catch {
    await client.query('ROLLBACK');
    response.status(503).json({ message: 'تعذر حفظ مصفوفة الصلاحيات.' });
  } finally {
    client.release();
  }
});

export default router;
