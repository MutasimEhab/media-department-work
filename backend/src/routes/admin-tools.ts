import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/require-auth.js';

const router = Router();
const SETTINGS_KEY = 'admin_tools';
const fieldTypes = new Set(['نص قصير', 'نص طويل', 'رقم', 'تاريخ', 'قائمة منسدلة', 'رابط']);

router.use(requireAuth);

function canManage(request: AuthenticatedRequest): boolean {
  return Boolean(request.permissions?.includes('manage_system_settings'));
}

router.get('/', async (request: AuthenticatedRequest, response) => {
  if (!canManage(request)) {
    response.status(403).json({ message: 'لا تملك صلاحية عرض إعدادات الإدارة.' });
    return;
  }
  try {
    const result = await db.query<{ value: Record<string, unknown> }>(
      'SELECT value FROM system_settings WHERE key = $1', [SETTINGS_KEY],
    );
    response.json({ settings: result.rows[0]?.value ?? null });
  } catch {
    response.status(503).json({ message: 'تعذر تحميل إعدادات الإدارة المشتركة.' });
  }
});

router.put('/', async (request: AuthenticatedRequest, response) => {
  if (!canManage(request)) {
    response.status(403).json({ message: 'لا تملك صلاحية تعديل إعدادات الإدارة.' });
    return;
  }
  const settings = request.body?.settings;
  const workflowSteps = settings?.workflowSteps;
  const customFields = settings?.customFields;
  const validWorkflow = Array.isArray(workflowSteps)
    && workflowSteps.length >= 1 && workflowSteps.length <= 30
    && workflowSteps.every((item: unknown) => typeof item === 'string' && item.trim().length >= 1 && item.trim().length <= 80)
    && new Set(workflowSteps.map((item: string) => item.trim())).size === workflowSteps.length;
  const validFields = Array.isArray(customFields) && customFields.length <= 100
    && customFields.every((field: unknown) => {
      if (!field || typeof field !== 'object' || Array.isArray(field)) return false;
      const item = field as Record<string, unknown>;
      return typeof item.id === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(item.id)
        && typeof item.name === 'string' && item.name.trim().length >= 1 && item.name.trim().length <= 100
        && typeof item.type === 'string' && fieldTypes.has(item.type)
        && typeof item.required === 'boolean';
    }) && new Set(customFields.map((item: { id: string }) => item.id)).size === customFields.length;

  if (!validWorkflow || !validFields) {
    response.status(400).json({ message: 'تحقق من أسماء حالات سير العمل والخانات الإضافية.' });
    return;
  }

  const normalized = {
    workflowSteps: workflowSteps.map((item: string) => item.trim()),
    customFields: customFields.map((item: { id: string; name: string; type: string; required: boolean }) => ({
      id: item.id,
      name: item.name.trim(),
      type: item.type,
      required: item.required,
    })),
  };

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO system_settings (key, value, updated_by) VALUES ($1, $2::jsonb, $3)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = now()`,
      [SETTINGS_KEY, JSON.stringify(normalized), request.authUser!.id],
    );
    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, metadata)
       VALUES ($1, 'system.admin_tools.update', 'system_settings', $2::jsonb)`,
      [request.authUser!.id, JSON.stringify({ workflowStepCount: normalized.workflowSteps.length, customFieldCount: normalized.customFields.length })],
    );
    await client.query('COMMIT');
    response.json({ settings: normalized, message: 'تم حفظ الإعدادات المشتركة.' });
  } catch {
    await client.query('ROLLBACK');
    response.status(503).json({ message: 'تعذر حفظ إعدادات الإدارة المشتركة.' });
  } finally {
    client.release();
  }
});

export default router;
