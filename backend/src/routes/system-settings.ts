import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/require-auth.js';

const router = Router();
const SETTINGS_KEY = 'institutional';
const workdays = new Set(['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']);
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

router.use(requireAuth);

router.get('/', async (_request, response) => {
  try {
    const result = await db.query<{ value: Record<string, unknown> }>(
      'SELECT value FROM system_settings WHERE key = $1', [SETTINGS_KEY],
    );
    response.json({ settings: result.rows[0]?.value ?? null });
  } catch {
    response.status(503).json({ message: 'تعذر تحميل إعدادات النظام.' });
  }
});

router.put('/', async (request: AuthenticatedRequest, response) => {
  if (request.authUser!.roleCode !== 'system_admin' || !request.permissions?.includes('manage_system_settings')) {
    response.status(403).json({ message: 'إعدادات النظام متاحة لمدير النظام فقط.' });
    return;
  }
  const value = request.body?.settings;
  const valid = value && typeof value === 'object' && !Array.isArray(value)
    && typeof value.institution === 'string' && value.institution.trim().length > 0 && value.institution.length <= 200
    && typeof value.department === 'string' && value.department.trim().length > 0 && value.department.length <= 160
    && ['Asia/Gaza', 'Asia/Jerusalem', 'UTC'].includes(value.timezone)
    && Array.isArray(value.workdays) && value.workdays.length > 0 && value.workdays.every((day: unknown) => typeof day === 'string' && workdays.has(day))
    && timePattern.test(value.startTime) && timePattern.test(value.endTime) && value.startTime < value.endTime
    && value.weights && ['completion', 'timeliness', 'communication'].every(key => Number.isInteger(value.weights[key]) && value.weights[key] >= 0 && value.weights[key] <= 100)
    && value.weights.completion + value.weights.timeliness + value.weights.communication === 100
    && Array.isArray(value.taskReminderHours) && value.taskReminderHours.every((hours: unknown) => typeof hours === 'number' && Number.isInteger(hours) && hours >= 1 && hours <= 720)
    && typeof value.missingWorkAlertsEnabled === 'boolean' && timePattern.test(value.missingWorkAlertTime)
    && value.smsNotificationsEnabled === false
    && Number.isInteger(value.sessionMinutes) && value.sessionMinutes >= 5 && value.sessionMinutes <= 240
    && value.language === 'ar';
  if (!valid) {
    response.status(400).json({ message: 'تحقق من بيانات الإعدادات وقيم الدوام والتقييم والتنبيهات.' });
    return;
  }
  try {
    const result = await db.query(
      `INSERT INTO system_settings (key, value, updated_by) VALUES ($1, $2::jsonb, $3)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = now()
       RETURNING value`,
      [SETTINGS_KEY, JSON.stringify({ ...value, workdays: [...new Set(value.workdays)], taskReminderHours: [...new Set(value.taskReminderHours)] }), request.authUser!.id],
    );
    await db.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, metadata)
       VALUES ($1, 'system.settings.update', 'system_settings', $2::jsonb)`,
      [request.authUser!.id, JSON.stringify({ key: SETTINGS_KEY })],
    );
    response.json({ settings: result.rows[0].value });
  } catch {
    response.status(503).json({ message: 'تعذر حفظ إعدادات النظام.' });
  }
});

export default router;
