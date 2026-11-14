import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/require-auth.js';

const router = Router();
const areaToRegion: Record<string, 'north_gaza' | 'south_gaza'> = {
  'شمال قطاع غزة': 'north_gaza',
  'جنوب قطاع غزة': 'south_gaza',
};
const regionToArea: Record<string, string> = {
  north_gaza: 'شمال قطاع غزة',
  south_gaza: 'جنوب قطاع غزة',
};

function todayInGaza(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Gaza', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function mapWorkLog(row: Record<string, any>) {
  const date = String(row.work_date).slice(0, 10);
  const time = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Gaza', hour: '2-digit', minute: '2-digit', hour12: true,
  }).format(new Date(row.created_at));
  return {
    id: row.id,
    userId: row.user_id,
    userNameAr: row.full_name_ar,
    userNameEn: row.full_name_ar,
    date,
    time,
    activityAr: row.description_ar,
    activityEn: row.description_ar,
    descriptionAr: row.description_ar,
    location: row.work_mode === 'field' ? 'FIELD' : 'OFFICE',
    area: regionToArea[row.work_region] ?? row.work_region,
    outputLink: row.output_link ?? undefined,
    isException: date < todayInGaza(),
  };
}

router.use(requireAuth);

router.get('/mine', async (request: AuthenticatedRequest, response) => {
  if (!request.permissions?.includes('view_own_work_logs')) {
    response.status(403).json({ message: 'لا تملك صلاحية عرض سجل العمل الشخصي.' });
    return;
  }
  try {
    const result = await db.query(
      `SELECT log.id, log.user_id, log.work_date, log.work_nature, log.work_region,
              log.work_mode, log.description_ar, log.output_link, log.created_at,
              u.full_name_ar
         FROM work_logs log JOIN users u ON u.id = log.user_id
        WHERE log.user_id = $1
        ORDER BY log.work_date DESC, log.created_at DESC`,
      [request.authUser!.id],
    );
    response.json({ workLogs: result.rows.map(mapWorkLog) });
  } catch {
    response.status(503).json({ message: 'تعذر تحميل سجل أعمالك من قاعدة البيانات.' });
  }
});

router.get('/department', async (request: AuthenticatedRequest, response) => {
  const actor = request.authUser!;
  if (actor.roleCode !== 'system_admin' && !request.permissions?.includes('view_department_work_logs')) {
    response.status(403).json({ message: 'سجلات الموظفين متاحة للقراءة لمدير النظام ومدير القسم ونائبه.' });
    return;
  }
  try {
    const result = await db.query(
      `SELECT log.id, log.user_id, log.work_date, log.work_nature, log.work_region,
              log.work_mode, log.description_ar, log.output_link, log.created_at, u.full_name_ar
         FROM work_logs log JOIN users u ON u.id = log.user_id
        WHERE ($1::text = 'system_admin' OR u.department_id = $2::uuid)
        ORDER BY log.work_date DESC, log.created_at DESC`,
      [actor.roleCode, actor.departmentId],
    );
    response.json({ workLogs: result.rows.map(mapWorkLog) });
  } catch {
    response.status(503).json({ message: 'تعذر تحميل سجلات القسم حالياً.' });
  }
});

router.get('/department/today', async (request: AuthenticatedRequest, response) => {
  const actor = request.authUser!;
  const mayMonitor = actor.roleCode === 'system_admin'
    || request.permissions?.includes('view_department_work_logs')
    || request.permissions?.includes('receive_missing_work_alerts');
  if (!mayMonitor) {
    response.status(403).json({ message: 'لا تملك صلاحية متابعة تسجيل العمل اليومي.' });
    return;
  }
  try {
    const result = await db.query(
      `WITH current_day AS (
         SELECT (now() AT TIME ZONE 'Asia/Gaza')::date AS work_date
       ), scoped_employees AS (
         SELECT u.id, u.full_name_ar, u.employee_number, u.job_title_ar
           FROM users u
          WHERE u.role_code = 'employee' AND u.is_active = true
            AND ($1::text = 'system_admin' OR u.department_id = $2::uuid)
       ), today_logs AS (
         SELECT l.id, l.user_id, l.work_date, l.created_at, l.work_mode,
                l.work_region, l.description_ar, u.full_name_ar
           FROM work_logs l JOIN users u ON u.id = l.user_id CROSS JOIN current_day d
          WHERE l.work_date = d.work_date
            AND ($1::text = 'system_admin' OR u.department_id = $2::uuid)
       )
       SELECT json_build_object(
         'date', (SELECT work_date::text FROM current_day),
         'workLogs', COALESCE((SELECT json_agg(json_build_object(
           'id', id, 'userId', user_id, 'userNameAr', full_name_ar,
           'date', work_date::text,
           'time', to_char(created_at AT TIME ZONE 'Asia/Gaza', 'HH12:MI AM'),
           'activityAr', description_ar,
           'location', CASE WHEN work_mode = 'field' THEN 'FIELD' ELSE 'OFFICE' END,
           'area', CASE WHEN work_region = 'north_gaza' THEN 'شمال قطاع غزة'
                        WHEN work_region = 'south_gaza' THEN 'جنوب قطاع غزة' ELSE work_region END
         ) ORDER BY created_at DESC) FROM today_logs), '[]'::json),
         'missingEmployees', COALESCE((SELECT json_agg(json_build_object(
           'id', e.id, 'arabicName', e.full_name_ar, 'employeeNumber', e.employee_number,
           'jobTitleAr', e.job_title_ar
         ) ORDER BY e.full_name_ar) FROM scoped_employees e
           WHERE NOT EXISTS (SELECT 1 FROM today_logs l WHERE l.user_id = e.id)), '[]'::json)
       ) AS snapshot`,
      [actor.roleCode, actor.departmentId],
    );
    response.json(result.rows[0]?.snapshot ?? { date: todayInGaza(), workLogs: [], missingEmployees: [] });
  } catch {
    response.status(503).json({ message: 'تعذر تحديث متابعة العمل اليومي.' });
  }
});

router.post('/', async (request: AuthenticatedRequest, response) => {
  const actor = request.authUser!;
  if (!request.permissions?.includes('create_work_log')) {
    response.status(403).json({ message: 'لا تملك صلاحية تسجيل العمل من هذا الحساب.' });
    return;
  }
  if (request.body?.userId && request.body.userId !== actor.id) {
    response.status(403).json({ message: 'يسجل كل مستخدم عمله بنفسه؛ لا يمكن تسجيل العمل نيابةً عن موظف.' });
    return;
  }

  const workDate = request.body?.workDate;
  const area = typeof request.body?.area === 'string' ? request.body.area.trim() : '';
  const region = areaToRegion[area];
  const workMode = request.body?.workMode === 'FIELD' ? 'field'
    : request.body?.workMode === 'OFFICE' ? 'office' : null;
  const description = typeof request.body?.description === 'string' ? request.body.description.trim() : '';
  const outputLink = typeof request.body?.outputLink === 'string' ? request.body.outputLink.trim() : '';

  if (!validDate(workDate) || !region || !workMode || !description || description.length > 300
    || (outputLink && !/^https:\/\/drive\.google\.com\/(?:file\/d\/[^/]+\/view|drive\/folders\/[^/?]+)(?:\?.*)?$/.test(outputLink))) {
    response.status(400).json({ message: 'تحقق من التاريخ والمنطقة ونمط العمل والتفاصيل ورابط Google Drive.' });
    return;
  }
  if (workDate > todayInGaza()) {
    response.status(400).json({ message: 'لا يمكن تسجيل عمل بتاريخ مستقبلي.' });
    return;
  }

  try {
    if (workDate < todayInGaza()) {
      const exception = await db.query(
        `SELECT 1 FROM work_date_exceptions
          WHERE user_id = $1 AND work_date = $2::date AND revoked_at IS NULL
            AND (expires_at IS NULL OR expires_at > now())`,
        [actor.id, workDate],
      );
      if (!exception.rowCount) {
        response.status(403).json({ message: 'التاريخ السابق يحتاج إلى استثناء ساري معتمد لحسابك.' });
        return;
      }
    }

    const created = await db.query(
      `INSERT INTO work_logs (user_id, work_date, work_nature, work_region, work_mode, description_ar, output_link)
       VALUES ($1, $2::date, $3, $4, $5, $6, $7)
       RETURNING id, user_id, work_date, work_nature, work_region, work_mode, description_ar, output_link, created_at`,
      [actor.id, workDate, workMode, region, workMode, description, outputLink || null],
    );
    const row = created.rows[0];
    if (!row) {
      response.status(503).json({ message: 'تعذر تأكيد حفظ سجل العمل.' });
      return;
    }
    response.status(201).json({ workLog: mapWorkLog({ ...row, full_name_ar: actor.fullNameAr }) });
  } catch {
    response.status(503).json({ message: 'تعذر حفظ سجل العمل في قاعدة البيانات.' });
  }
});

router.patch('/:logId', async (request: AuthenticatedRequest, response) => {
  const actor = request.authUser!;
  if (!request.permissions?.includes('manage_own_work_logs')) {
    response.status(403).json({ message: 'تعديل سجل العمل متاح لصاحبه فقط.' });
    return;
  }
  const area = typeof request.body?.area === 'string' ? request.body.area.trim() : '';
  const region = areaToRegion[area];
  const workMode = request.body?.workMode === 'FIELD' ? 'field'
    : request.body?.workMode === 'OFFICE' ? 'office' : null;
  const description = typeof request.body?.description === 'string' ? request.body.description.trim() : '';
  const outputLink = typeof request.body?.outputLink === 'string' ? request.body.outputLink.trim() : '';
  if (!region || !workMode || !description || description.length > 300
    || (outputLink && !/^https:\/\/drive\.google\.com\/(?:file\/d\/[^/]+\/view|drive\/folders\/[^/?]+)(?:\?.*)?$/.test(outputLink))) {
    response.status(400).json({ message: 'تحقق من المنطقة ونمط العمل والتفاصيل ورابط Google Drive.' });
    return;
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const updated = await client.query(
      `UPDATE work_logs SET work_nature = $3, work_region = $4, work_mode = $3,
              description_ar = $5, output_link = $6, updated_at = now()
        WHERE id = $1 AND user_id = $2
        RETURNING id, user_id, work_date, work_nature, work_region, work_mode, description_ar, output_link, created_at`,
      [request.params.logId, actor.id, workMode, region, description, outputLink || null],
    );
    const row = updated.rows[0];
    if (!row) {
      await client.query('ROLLBACK');
      response.status(404).json({ message: 'السجل غير موجود ضمن سجلات حسابك.' });
      return;
    }
    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'work_log.update', 'work_logs', $2, $3::jsonb)`,
      [actor.id, row.id, JSON.stringify({ workDate: String(row.work_date).slice(0, 10) })],
    );
    await client.query('COMMIT');
    response.json({ workLog: mapWorkLog({ ...row, full_name_ar: actor.fullNameAr }) });
  } catch {
    await client.query('ROLLBACK');
    response.status(503).json({ message: 'تعذر حفظ تعديل سجل العمل.' });
  } finally {
    client.release();
  }
});

router.delete('/:logId', async (request: AuthenticatedRequest, response) => {
  const actor = request.authUser!;
  if (!request.permissions?.includes('manage_own_work_logs')) {
    response.status(403).json({ message: 'حذف سجل العمل متاح لصاحبه فقط.' });
    return;
  }
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const owned = await client.query<{ id: string; work_date: string }>(
      'SELECT id, work_date FROM work_logs WHERE id = $1 AND user_id = $2 FOR UPDATE',
      [request.params.logId, actor.id],
    );
    const row = owned.rows[0];
    if (!row) {
      await client.query('ROLLBACK');
      response.status(404).json({ message: 'السجل غير موجود ضمن سجلات حسابك.' });
      return;
    }
    await client.query('DELETE FROM work_logs WHERE id = $1 AND user_id = $2', [row.id, actor.id]);
    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'work_log.delete', 'work_logs', $2, $3::jsonb)`,
      [actor.id, row.id, JSON.stringify({ workDate: String(row.work_date).slice(0, 10), permanentlyDeleted: true })],
    );
    await client.query('COMMIT');
    response.json({ workLogId: row.id, deleted: true });
  } catch {
    await client.query('ROLLBACK');
    response.status(503).json({ message: 'تعذر حذف سجل العمل حالياً.' });
  } finally {
    client.release();
  }
});

export default router;
