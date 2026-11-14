import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/require-auth.js';

const router = Router();
const baseRoles = new Set(['department_manager', 'deputy_manager', 'employee']);
router.use(requireAuth);

function isSystemAdmin(request: AuthenticatedRequest) {
  return request.authUser?.roleCode === 'system_admin';
}

router.post('/', async (request: AuthenticatedRequest, response) => {
  if (!isSystemAdmin(request)) {
    response.status(403).json({ message: 'إضافة أنواع الحسابات متاحة لمدير النظام فقط.' });
    return;
  }
  const nameAr = typeof request.body?.nameAr === 'string' ? request.body.nameAr.trim() : '';
  const baseRoleCode = typeof request.body?.baseRoleCode === 'string' ? request.body.baseRoleCode : '';
  if (!nameAr || nameAr.length > 80 || !baseRoles.has(baseRoleCode)) {
    response.status(400).json({ message: 'أدخل اسماً صالحاً واختر نوعاً أساسياً من مدير القسم أو نائبه أو الموظف.' });
    return;
  }
  const code = `custom_${randomUUID().replaceAll('-', '')}`;
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('INSERT INTO roles (code, name_ar, base_role_code, is_system) VALUES ($1, $2, $3, false)', [code, nameAr, baseRoleCode]);
    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, metadata)
       VALUES ($1, 'account_type.create', 'roles', $2::jsonb)`,
      [request.authUser!.id, JSON.stringify({ code, nameAr, baseRoleCode, initialPermissions: [] })],
    );
    await client.query('COMMIT');
    response.status(201).json({ accountType: { code, nameAr, baseRoleCode, isSystem: false } });
  } catch {
    await client.query('ROLLBACK');
    response.status(503).json({ message: 'تعذر إضافة نوع الحساب.' });
  } finally {
    client.release();
  }
});

router.patch('/:code', async (request: AuthenticatedRequest, response) => {
  if (!isSystemAdmin(request)) {
    response.status(403).json({ message: 'تعديل أنواع الحسابات متاح لمدير النظام فقط.' });
    return;
  }
  const code = Array.isArray(request.params.code) ? request.params.code[0] : request.params.code;
  const nameAr = typeof request.body?.nameAr === 'string' ? request.body.nameAr.trim() : '';
  if (!code?.startsWith('custom_') || !nameAr || nameAr.length > 80) {
    response.status(400).json({ message: 'النوع أو الاسم غير صالح.' });
    return;
  }
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query<{ code: string; name_ar: string; base_role_code: string }>(
      `UPDATE roles SET name_ar = $2 WHERE code = $1 AND is_system = false RETURNING code, name_ar, base_role_code`,
      [code, nameAr],
    );
    if (!result.rowCount) {
      await client.query('ROLLBACK');
      response.status(404).json({ message: 'نوع الحساب غير موجود.' });
      return;
    }
    const renamed = result.rows[0]!;
    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, metadata)
       VALUES ($1, 'account_type.rename', 'roles', $2::jsonb)`,
      [request.authUser!.id, JSON.stringify({ code, nameAr })],
    );
    await client.query('COMMIT');
    response.json({ accountType: { code, nameAr: renamed.name_ar, baseRoleCode: renamed.base_role_code, isSystem: false } });
  } catch {
    await client.query('ROLLBACK');
    response.status(503).json({ message: 'تعذر تعديل نوع الحساب.' });
  } finally {
    client.release();
  }
});

router.delete('/:code', async (request: AuthenticatedRequest, response) => {
  if (!isSystemAdmin(request)) {
    response.status(403).json({ message: 'حذف أنواع الحسابات متاح لمدير النظام فقط.' });
    return;
  }
  const code = Array.isArray(request.params.code) ? request.params.code[0] : request.params.code;
  if (!code?.startsWith('custom_')) {
    response.status(400).json({ message: 'لا يمكن حذف نوع حساب أساسي.' });
    return;
  }
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const found = await client.query<{ name_ar: string }>('SELECT name_ar FROM roles WHERE code = $1 AND is_system = false FOR UPDATE', [code]);
    if (!found.rowCount) {
      await client.query('ROLLBACK');
      response.status(404).json({ message: 'نوع الحساب غير موجود.' });
      return;
    }
    const accountType = found.rows[0]!;
    const users = await client.query<{ count: string }>('SELECT count(*)::text AS count FROM users WHERE account_type_code = $1', [code]);
    if (Number(users.rows[0]?.count ?? 0) > 0) {
      await client.query('ROLLBACK');
      response.status(409).json({ message: 'لا يمكن حذف النوع لأنه مرتبط بحسابات. غيّر نوع حساباتها أولاً.' });
      return;
    }
    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, metadata)
       VALUES ($1, 'account_type.delete', 'roles', $2::jsonb)`,
      [request.authUser!.id, JSON.stringify({ code, nameAr: accountType.name_ar })],
    );
    await client.query('DELETE FROM roles WHERE code = $1', [code]);
    await client.query('COMMIT');
    response.json({ deleted: true, code });
  } catch {
    await client.query('ROLLBACK');
    response.status(503).json({ message: 'تعذر حذف نوع الحساب.' });
  } finally {
    client.release();
  }
});

export default router;
