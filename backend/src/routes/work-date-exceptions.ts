import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/require-auth.js';

const router = Router();
const MANAGE_PERMISSION = 'work_exceptions.manage_department';

function canManage(request: AuthenticatedRequest): boolean {
  return request.authUser?.roleCode === 'system_admin'
    || Boolean(request.permissions?.includes(MANAGE_PERMISSION));
}

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

router.use(requireAuth);

router.get('/', async (request: AuthenticatedRequest, response) => {
  const actor = request.authUser!;
  if (actor.roleCode !== 'system_admin' && actor.roleCode !== 'employee' && !canManage(request)) {
    response.status(403).json({ message: 'لا تملك صلاحية عرض استثناءات العمل.' });
    return;
  }

  try {
    const result = await db.query(
      `SELECT e.id, e.user_id, e.work_date, e.granted_by, e.reason_ar, e.created_at, e.revoked_at,
              target.full_name_ar AS employee_name_ar,
              granter.full_name_ar AS granter_name_ar
         FROM work_date_exceptions e
         JOIN users target ON target.id = e.user_id
         JOIN users granter ON granter.id = e.granted_by
        WHERE ($1::text = 'system_admin'
            OR ($1::text = 'employee' AND e.user_id = $2::uuid)
            OR ($3::boolean AND target.department_id = $4::uuid))
        ORDER BY e.work_date DESC, e.created_at DESC`,
      [actor.roleCode, actor.id, canManage(request), actor.departmentId],
    );

    let employees: { id: string; arabicName: string }[] = [];
    if (canManage(request)) {
      const employeeResult = await db.query<{ id: string; arabic_name: string }>(
        `SELECT id, full_name_ar AS arabic_name FROM users
          WHERE role_code = 'employee' AND is_active = true
            AND ($1::text = 'system_admin' OR department_id = $2::uuid)
          ORDER BY full_name_ar`,
        [actor.roleCode, actor.departmentId],
      );
      employees = employeeResult.rows.map((row) => ({ id: row.id, arabicName: row.arabic_name }));
    }

    response.json({
      exceptions: result.rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        dates: [String(row.work_date).slice(0, 10)],
        grantedBy: row.granted_by,
        createdAt: row.created_at,
        reason: row.reason_ar,
        revokedAt: row.revoked_at ?? undefined,
        employeeNameAr: row.employee_name_ar,
        granterNameAr: row.granter_name_ar,
      })),
      employees,
    });
  } catch {
    response.status(503).json({ message: 'تعذر تحميل الاستثناءات من قاعدة البيانات.' });
  }
});

router.post('/', async (request: AuthenticatedRequest, response) => {
  const actor = request.authUser!;
  if (!canManage(request)) {
    response.status(403).json({ message: 'إصدار استثناءات العمل متاح لمدير النظام ومدير الدائرة ونائبه.' });
    return;
  }

  const userId = typeof request.body?.userId === 'string' ? request.body.userId : '';
  const workDate = request.body?.workDate;
  const reason = typeof request.body?.reason === 'string' ? request.body.reason.trim() : '';
  if (!userId || !validDate(workDate) || workDate >= todayInGaza() || !reason || reason.length > 1000) {
    response.status(400).json({ message: 'اختر موظفاً وتاريخاً سابقاً صحيحاً، واكتب سبباً لا يتجاوز 1000 حرف.' });
    return;
  }

  try {
    const targetResult = await db.query<{ id: string; department_id: string | null; full_name_ar: string }>(
      `SELECT id, department_id, full_name_ar FROM users
        WHERE id = $1 AND role_code = 'employee' AND is_active = true`,
      [userId],
    );
    const target = targetResult.rows[0];
    if (!target || (actor.roleCode !== 'system_admin' && target.department_id !== actor.departmentId)) {
      response.status(404).json({ message: 'الموظف غير موجود ضمن نطاق إدارتك.' });
      return;
    }

    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const created = await client.query<{ id: string; user_id: string; work_date: string; granted_by: string; reason_ar: string; created_at: Date }>(
        `INSERT INTO work_date_exceptions (user_id, work_date, granted_by, reason_ar)
         VALUES ($1, $2::date, $3, $4)
         RETURNING id, user_id, work_date, granted_by, reason_ar, created_at`,
        [target.id, workDate, actor.id, reason],
      );
      const entry = created.rows[0];
      if (!entry) throw new Error('Exception insert returned no row.');
      await client.query(
        `INSERT INTO notifications (user_id, type, title_ar, body_ar, entity_type, entity_id)
         VALUES ($1, 'WORK_DATE_EXCEPTION', 'اعتماد استثناء تاريخ عمل', $2, 'work_date_exception', $3)`,
        [target.id, `تم اعتماد تسجيل العمل عن تاريخ ${workDate}. السبب: ${reason}`, entry.id],
      );
      await client.query(
        `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
         VALUES ($1, 'work_date_exception.grant', 'work_date_exceptions', $2, $3::jsonb)`,
        [actor.id, entry.id, JSON.stringify({ userId: target.id, workDate, reason })],
      );
      await client.query('COMMIT');
      response.status(201).json({
        exception: {
          id: entry.id,
          userId: entry.user_id,
          dates: [String(entry.work_date).slice(0, 10)],
          grantedBy: entry.granted_by,
          createdAt: entry.created_at,
          reason: entry.reason_ar,
          employeeNameAr: target.full_name_ar,
          granterNameAr: actor.fullNameAr,
        },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
        response.status(409).json({ message: 'يوجد استثناء ساري لهذا الموظف في التاريخ المحدد.' });
        return;
      }
      response.status(503).json({ message: 'تعذر حفظ الاستثناء حالياً.' });
    } finally {
      client.release();
    }
  } catch {
    response.status(503).json({ message: 'تعذر التحقق من الموظف حالياً.' });
  }
});

router.delete('/:exceptionId', async (request: AuthenticatedRequest, response) => {
  const actor = request.authUser!;
  if (!canManage(request)) {
    response.status(403).json({ message: 'لا تملك صلاحية إلغاء استثناءات العمل.' });
    return;
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const revoked = await client.query<{ id: string; user_id: string; department_id: string | null }>(
      `UPDATE work_date_exceptions e SET revoked_at = now()
         FROM users target
        WHERE e.id = $1 AND e.user_id = target.id AND e.revoked_at IS NULL
          AND ($2::text = 'system_admin' OR target.department_id = $3::uuid)
        RETURNING e.id, e.user_id, target.department_id`,
      [request.params.exceptionId, actor.roleCode, actor.departmentId],
    );
    const entry = revoked.rows[0];
    if (!entry) {
      await client.query('ROLLBACK');
      response.status(404).json({ message: 'الاستثناء غير موجود أو تم إلغاؤه مسبقاً.' });
      return;
    }
    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'work_date_exception.revoke', 'work_date_exceptions', $2, $3::jsonb)`,
      [actor.id, entry.id, JSON.stringify({ userId: entry.user_id })],
    );
    await client.query('COMMIT');
    response.json({ exceptionId: entry.id, revoked: true });
  } catch {
    await client.query('ROLLBACK');
    response.status(503).json({ message: 'تعذر إلغاء الاستثناء حالياً.' });
  } finally {
    client.release();
  }
});

export default router;
