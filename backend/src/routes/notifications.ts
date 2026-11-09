import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/require-auth.js';

const router = Router();
router.use(requireAuth);

function mapNotification(row: Record<string, any>) {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    titleAr: row.title_ar,
    titleEn: row.title_ar,
    messageAr: row.body_ar,
    messageEn: row.body_ar,
    timestamp: row.created_at,
    isRead: Boolean(row.read_at),
    actionUrl: row.action_url || '',
  };
}

router.get('/', async (request: AuthenticatedRequest, response) => {
  if (!request.permissions?.includes('view_notifications')) {
    response.status(403).json({ message: 'لا تملك صلاحية عرض الإشعارات.' });
    return;
  }
  try {
    const result = await db.query(
      `SELECT id, user_id, type, title_ar, body_ar, action_url, read_at, created_at
         FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 500`,
      [request.authUser!.id],
    );
    response.json({ notifications: result.rows.map(mapNotification) });
  } catch {
    response.status(503).json({ message: 'تعذر تحميل الإشعارات.' });
  }
});

router.patch('/:notificationId/read', async (request: AuthenticatedRequest, response) => {
  if (!request.permissions?.includes('view_notifications')) {
    response.status(403).json({ message: 'لا تملك صلاحية تحديث الإشعارات.' });
    return;
  }
  const id = request.params.notificationId;
  try {
    const result = await db.query(
      `UPDATE notifications SET read_at = COALESCE(read_at, now())
        WHERE id = $1 AND user_id = $2 RETURNING id, read_at`,
      [Array.isArray(id) ? id[0] : id, request.authUser!.id],
    );
    if (!result.rows[0]) {
      response.status(404).json({ message: 'الإشعار غير موجود في حسابك.' });
      return;
    }
    response.json({ ok: true });
  } catch {
    response.status(503).json({ message: 'تعذر تحديث حالة الإشعار.' });
  }
});

router.post('/read-all', async (request: AuthenticatedRequest, response) => {
  if (!request.permissions?.includes('view_notifications')) {
    response.status(403).json({ message: 'لا تملك صلاحية تحديث الإشعارات.' });
    return;
  }
  try {
    const result = await db.query(
      'UPDATE notifications SET read_at = COALESCE(read_at, now()) WHERE user_id = $1 AND read_at IS NULL',
      [request.authUser!.id],
    );
    response.json({ ok: true, updatedCount: result.rowCount || 0 });
  } catch {
    response.status(503).json({ message: 'تعذر تحديث الإشعارات.' });
  }
});

export default router;
