import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/require-auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (request: AuthenticatedRequest, response) => {
  const actor = request.authUser!;
  if (actor.roleCode !== 'system_admin' && !request.permissions?.includes('view_audit_log')) {
    response.status(403).json({ message: 'لا تملك صلاحية عرض سجل التدقيق.' });
    return;
  }
  const query = typeof request.query.q === 'string' ? request.query.q.trim().slice(0, 120) : '';
  const parsedOffset = Number.parseInt(String(request.query.offset ?? '0'), 10);
  const offset = Number.isFinite(parsedOffset) ? Math.max(0, Math.min(parsedOffset, 100_000)) : 0;
  const limit = 30;
  try {
    const result = await db.query<{
      id: string; actor_id: string | null; actor_name: string | null; username: string | null;
      action: string; entity_type: string; entity_id: string | null; metadata: Record<string, unknown>; created_at: Date;
    }>(
      `SELECT al.id, al.actor_id, actor.full_name_ar AS actor_name, actor.username,
              al.action, al.entity_type, al.entity_id, al.metadata, al.created_at
         FROM audit_logs al
         LEFT JOIN users actor ON actor.id = al.actor_id
        WHERE ($1::text = 'system_admin' OR al.actor_id = $2 OR actor.department_id = $3)
          AND ($4::text = '' OR concat_ws(' ', actor.full_name_ar, actor.username, al.action,
               al.entity_type, al.entity_id::text, al.metadata::text) ILIKE '%' || $4 || '%')
        ORDER BY al.created_at DESC, al.id DESC
        LIMIT $5 OFFSET $6`,
      [actor.roleCode, actor.id, actor.departmentId, query, limit + 1, offset],
    );
    const hasMore = result.rows.length > limit;
    const events = result.rows.slice(0, limit).map(row => ({
      id: row.id,
      actorId: row.actor_id,
      actorNameAr: row.actor_name ?? 'حساب محذوف',
      username: row.username,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      metadata: row.metadata,
      createdAt: row.created_at,
    }));
    response.json({ events, nextOffset: hasMore ? offset + limit : null });
  } catch {
    response.status(503).json({ message: 'تعذر تحميل سجل التدقيق من قاعدة البيانات.' });
  }
});

router.delete('/', async (request: AuthenticatedRequest, response) => {
  const actor = request.authUser!;
  if (actor.roleCode !== 'system_admin') {
    response.status(403).json({ message: 'الحذف النهائي لسجل التدقيق متاح لمدير النظام فقط.' });
    return;
  }

  const rawIds: unknown = request.body?.ids;
  const ids = Array.isArray(rawIds) ? [...new Set(rawIds.filter((id): id is string => typeof id === 'string'))] : [];
  if (!ids.length || ids.length > 500 || ids.some(id => !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))) {
    response.status(400).json({ message: 'حدد سجلاً واحداً على الأقل، وبحد أقصى 500 سجل في المرة الواحدة.' });
    return;
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const deleted = await client.query<{ id: string }>(
      'DELETE FROM audit_logs WHERE id = ANY($1::uuid[]) RETURNING id',
      [ids],
    );
    if (!deleted.rowCount) {
      await client.query('ROLLBACK');
      response.status(404).json({ message: 'لم يتم العثور على السجلات المحددة.' });
      return;
    }
    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, metadata)
       VALUES ($1, 'audit_logs.delete', 'audit_logs', $2::jsonb)`,
      [actor.id, JSON.stringify({ deletedCount: deleted.rowCount, deletedIds: deleted.rows.map(row => row.id) })],
    );
    await client.query('COMMIT');
    response.json({ deletedCount: deleted.rowCount });
  } catch {
    await client.query('ROLLBACK');
    response.status(503).json({ message: 'تعذر حذف السجلات المحددة.' });
  } finally {
    client.release();
  }
});

export default router;
