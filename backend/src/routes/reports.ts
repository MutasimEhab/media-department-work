import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/require-auth.js';

const router = Router();
router.use(requireAuth);

router.get('/monthly', async (request: AuthenticatedRequest, response) => {
  const actor = request.authUser!;
  const department = request.query.scope === 'department';
  const month = typeof request.query.month === 'string' ? request.query.month : '';
  const userId = typeof request.query.userId === 'string' ? request.query.userId : '';
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    response.status(400).json({ message: 'حدد شهراً صحيحاً بصيغة YYYY-MM.' });
    return;
  }
  if (department) {
    if (actor.roleCode !== 'system_admin' && !request.permissions?.includes('view_department_reports')) {
      response.status(403).json({ message: 'لا تملك صلاحية عرض تقارير الدائرة.' });
      return;
    }
  } else if (!request.permissions?.includes('view_own_report')) {
    response.status(403).json({ message: 'لا تملك صلاحية عرض تقريرك.' });
    return;
  }

  try {
    const selectedUserId = department ? userId : actor.id;
    if (selectedUserId && department) {
      const allowedUser = await db.query(
        `SELECT 1 FROM users WHERE id = $1::uuid AND ($2::text = 'system_admin' OR department_id = $3::uuid)`,
        [selectedUserId, actor.roleCode, actor.departmentId],
      );
      if (!allowedUser.rowCount) {
        response.status(404).json({ message: 'المستخدم غير موجود ضمن نطاق التقرير.' });
        return;
      }
    }

    const logs = await db.query<{
      id: string; user_id: string; full_name_ar: string; work_date: string; created_at: Date;
      work_mode: string; work_region: string; description_ar: string;
    }>(
      `SELECT l.id, l.user_id, u.full_name_ar, l.work_date, l.created_at,
              l.work_mode, l.work_region, l.description_ar
         FROM work_logs l JOIN users u ON u.id = l.user_id
        WHERE l.work_date >= ($1 || '-01')::date
          AND l.work_date < (($1 || '-01')::date + interval '1 month')
          AND ($2::text = 'system_admin' OR u.department_id = $3::uuid)
          AND ($4::uuid IS NULL OR l.user_id = $4::uuid)
        ORDER BY l.work_date DESC, l.created_at DESC`,
      [month, actor.roleCode, actor.departmentId, selectedUserId || null],
    );
    const assignmentStats = await db.query<{ status: string; total: string; on_time: string }>(
      `SELECT aa.status, count(*)::text AS total,
              count(*) FILTER (WHERE aa.submitted_at IS NOT NULL AND (a.deadline IS NULL OR aa.submitted_at <= a.deadline))::text AS on_time
         FROM assignment_assignees aa JOIN assignments a ON a.id = aa.assignment_id
         JOIN users u ON u.id = aa.user_id
        WHERE a.status <> 'draft' AND a.created_at >= ($1 || '-01')::date
          AND a.created_at < (($1 || '-01')::date + interval '1 month')
          AND ($2::text = 'system_admin' OR u.department_id = $3::uuid)
          AND ($4::uuid IS NULL OR aa.user_id = $4::uuid)
        GROUP BY aa.status`,
      [month, actor.roleCode, actor.departmentId, selectedUserId || null],
    );
    const workLogs = logs.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      userNameAr: row.full_name_ar,
      date: String(row.work_date).slice(0, 10),
      time: new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Gaza', hour: '2-digit', minute: '2-digit', hour12: true }).format(row.created_at),
      activityAr: row.description_ar,
      location: row.work_mode === 'field' ? 'FIELD' : 'OFFICE',
      area: row.work_region === 'north_gaza' ? 'شمال قطاع غزة' : 'جنوب قطاع غزة',
    }));
    const assignments = Object.fromEntries(assignmentStats.rows.map(row => [row.status, { total: Number(row.total), onTime: Number(row.on_time) }]));
    response.json({ month, workLogs, summary: {
      workLogCount: workLogs.length,
      officeCount: workLogs.filter(row => row.location === 'OFFICE').length,
      fieldCount: workLogs.filter(row => row.location === 'FIELD').length,
      assignments,
    } });
  } catch {
    response.status(503).json({ message: 'تعذر تحميل التقرير من قاعدة البيانات.' });
  }
});

export default router;
