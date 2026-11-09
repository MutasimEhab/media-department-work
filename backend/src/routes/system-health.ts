import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/require-auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (request: AuthenticatedRequest, response) => {
  if (request.authUser!.roleCode !== 'system_admin' && !request.permissions?.includes('view_system_health')) {
    response.status(403).json({ message: 'لا تملك صلاحية عرض صحة النظام.' });
    return;
  }
  try {
    const result = await db.query<{
      active_users: string; work_logs: string; assignments: string; projects: string;
      notifications: string; unread_notifications: string; latest_activity: Date | null; database_time: Date;
    }>(
      `SELECT
        (SELECT count(*) FROM users WHERE is_active = true)::text AS active_users,
        (SELECT count(*) FROM work_logs)::text AS work_logs,
        (SELECT count(*) FROM assignments)::text AS assignments,
        (SELECT count(*) FROM projects)::text AS projects,
        (SELECT count(*) FROM notifications)::text AS notifications,
        (SELECT count(*) FROM notifications WHERE read_at IS NULL)::text AS unread_notifications,
        (SELECT max(created_at) FROM audit_logs) AS latest_activity,
        now() AS database_time`,
    );
    const row = result.rows[0]!;
    response.json({
      status: 'ok',
      database: 'connected',
      metrics: {
        activeUsers: Number(row.active_users),
        workLogs: Number(row.work_logs),
        assignments: Number(row.assignments),
        projects: Number(row.projects),
        notifications: Number(row.notifications),
        unreadNotifications: Number(row.unread_notifications),
        latestActivity: row.latest_activity,
        databaseTime: row.database_time,
      },
    });
  } catch {
    response.status(503).json({ status: 'unavailable', database: 'disconnected', message: 'تعذر قراءة مؤشرات النظام من قاعدة البيانات.' });
  }
});

export default router;
