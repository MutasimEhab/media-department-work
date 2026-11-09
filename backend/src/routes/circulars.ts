import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/require-auth.js';

const router = Router();
const audienceToDb: Record<string, string> = {
  EVERYONE: 'all', EMPLOYEES_ONLY: 'employees_only', MANAGEMENT_ONLY: 'management_only', SPECIFIC: 'selected',
};
const audienceToUi: Record<string, 'EVERYONE' | 'EMPLOYEES_ONLY' | 'MANAGEMENT_ONLY' | 'SPECIFIC'> = {
  all: 'EVERYONE', employees_only: 'EMPLOYEES_ONLY', management_only: 'MANAGEMENT_ONLY', selected: 'SPECIFIC',
};

function mapCircularRows(rows: Array<Record<string, any>>) {
  const circulars = new Map<string, Record<string, any>>();
  for (const row of rows) {
    let circular = circulars.get(row.id);
    if (!circular) {
      circular = {
        id: row.id, titleAr: row.title_ar, titleEn: row.title_ar,
        contentAr: row.body_ar, contentEn: row.body_ar,
        issuerId: row.issued_by, issuerNameAr: row.issuer_name, issuerNameEn: row.issuer_name,
        issuedAt: row.published_at ?? row.created_at, targetAudience: audienceToUi[row.audience_type] ?? 'EVERYONE',
        isDraft: row.status === 'draft', parentId: row.parent_id ?? undefined,
        emailDelivery: row.notify_email, smsDelivery: row.notify_sms, recipients: [],
      };
      circulars.set(row.id, circular);
    }
    if (row.recipient_id) {
      circular.recipients.push({
        userId: row.recipient_user_id, userNameAr: row.recipient_name, userNameEn: row.recipient_name,
        hasAcknowledged: Boolean(row.acknowledged_at),
        acknowledgedAt: row.acknowledged_at ? new Date(row.acknowledged_at).toLocaleString('en-GB', { timeZone: 'Asia/Gaza' }) : undefined,
        reminderCount: row.reminder_count,
      });
    }
  }
  return [...circulars.values()];
}

const circularSelect = `SELECT c.id, c.issued_by, c.title_ar, c.body_ar, c.audience_type, c.status,
       c.published_at, c.created_at, c.parent_id, c.notify_email, c.notify_sms,
       issuer.full_name_ar AS issuer_name, cr.user_id AS recipient_user_id,
       cr.user_id AS recipient_id, recipient.full_name_ar AS recipient_name,
       cr.acknowledged_at, cr.reminder_count
  FROM circulars c JOIN users issuer ON issuer.id = c.issued_by
  LEFT JOIN circular_recipients cr ON cr.circular_id = c.id
  LEFT JOIN users recipient ON recipient.id = cr.user_id`;

router.use(requireAuth);

router.get('/', async (request: AuthenticatedRequest, response) => {
  const actor = request.authUser!;
  const mayViewDepartment = actor.roleCode === 'system_admin'
    || (['department_manager', 'deputy_manager'].includes(actor.roleCode)
      && (request.permissions?.includes('view_circulars') || request.permissions?.includes('manage_circulars')
        || request.permissions?.includes('track_circulars')));
  if (!mayViewDepartment && !request.permissions?.includes('view_circulars')) {
    response.status(403).json({ message: 'لا تملك صلاحية عرض التعاميم.' });
    return;
  }
  try {
    const result = await db.query(
      `${circularSelect}
       WHERE ($1::text = 'system_admin' OR ($4::boolean AND c.department_id = $2)
              OR c.issued_by = $3
              OR cr.user_id = $3)
       ORDER BY COALESCE(c.published_at, c.created_at) DESC, recipient.full_name_ar`,
      [actor.roleCode, actor.departmentId, actor.id, mayViewDepartment],
    );
    response.json({ circulars: mapCircularRows(result.rows) });
  } catch {
    response.status(503).json({ message: 'تعذر تحميل التعاميم من قاعدة البيانات.' });
  }
});

async function saveCircular(request: AuthenticatedRequest, response: import('express').Response, id?: string) {
  const actor = request.authUser!;
  if (actor.roleCode !== 'system_admin' && !request.permissions?.includes('manage_circulars')) {
    response.status(403).json({ message: 'لا تملك صلاحية إنشاء التعاميم.' });
    return;
  }
  const body = request.body ?? {};
  const title = typeof body.titleAr === 'string' ? body.titleAr.trim() : '';
  const content = typeof body.contentAr === 'string' ? body.contentAr.trim() : '';
  const audience = typeof body.targetAudience === 'string' ? audienceToDb[body.targetAudience] : '';
  const publish = body.publish === true;
  const requested = Array.isArray(body.recipientIds)
    ? [...new Set<string>(body.recipientIds.filter((value: unknown): value is string => typeof value === 'string'))]
    : [];
  const parentId = typeof body.parentId === 'string' ? body.parentId : null;
  if (!title || title.length > 200 || !content || content.length > 30000 || !audience
    || (publish && audience === 'selected' && requested.length === 0) || requested.length > 500) {
    response.status(400).json({ message: 'أدخل عنوان التعميم ومحتواه وحدد الجمهور بشكل صحيح.' });
    return;
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const departmentResult = await client.query<{ department_id: string | null }>(
      'SELECT department_id FROM users WHERE id = $1', [actor.id],
    );
    const departmentId = departmentResult.rows[0]?.department_id ?? null;
    if (!departmentId) {
      await client.query('ROLLBACK');
      response.status(400).json({ message: 'حسابك غير مرتبط بدائرة.' });
      return;
    }

    let selectedRecipients = requested;
    if (audience !== 'selected') {
      const roles = audience === 'employees_only' ? ['employee'] : audience === 'management_only'
        ? ['system_admin', 'department_manager', 'deputy_manager']
        : ['system_admin', 'department_manager', 'deputy_manager', 'employee'];
      const eligible = await client.query<{ id: string }>(
        `SELECT id FROM users WHERE is_active = true AND department_id = $1 AND role_code = ANY($2::text[]) ORDER BY full_name_ar`,
        [departmentId, roles],
      );
      selectedRecipients = eligible.rows.map(row => row.id);
    } else if (requested.length) {
      const eligible = await client.query<{ id: string }>(
        `SELECT id FROM users WHERE id = ANY($1::uuid[]) AND is_active = true AND department_id = $2`,
        [requested, departmentId],
      );
      if (eligible.rows.length !== requested.length) {
        await client.query('ROLLBACK');
        response.status(400).json({ message: 'اختر مستلمين نشطين من دائرتك فقط.' });
        return;
      }
    }

    let circularId = id;
    if (id) {
      const updated = await client.query(
        `UPDATE circulars SET title_ar = $3, body_ar = $4, audience_type = $5,
             status = $6, published_at = CASE WHEN $6 = 'published' THEN now() ELSE NULL END,
             notify_email = $7, notify_sms = $8
           WHERE id = $1 AND issued_by = $2 AND status = 'draft' RETURNING id`,
        [id, actor.id, title, content, audience, publish ? 'published' : 'draft', body.notifyEmail === true, body.notifySms === true],
      );
      if (!updated.rows[0]) {
        await client.query('ROLLBACK');
        response.status(404).json({ message: 'المسودة غير موجودة أو لم تعد قابلة للتعديل.' });
        return;
      }
      await client.query('DELETE FROM circular_recipients WHERE circular_id = $1', [id]);
    } else {
      const created = await client.query<{ id: string }>(
        `INSERT INTO circulars (department_id, issued_by, title_ar, body_ar, audience_type, status,
                                published_at, parent_id, notify_email, notify_sms)
         VALUES ($1, $2, $3, $4, $5, $6, CASE WHEN $6 = 'published' THEN now() ELSE NULL END, $7, $8, $9)
         RETURNING id`,
        [departmentId, actor.id, title, content, audience, publish ? 'published' : 'draft', parentId,
          body.notifyEmail === true, body.notifySms === true],
      );
      circularId = created.rows[0]!.id;
    }

    for (const userId of selectedRecipients) {
      await client.query('INSERT INTO circular_recipients (circular_id, user_id) VALUES ($1, $2)', [circularId, userId]);
      if (publish) {
        await client.query(
          `INSERT INTO notifications (user_id, type, title_ar, body_ar, entity_type, entity_id, action_url)
           VALUES ($1, 'CIRCULAR_PUBLISHED', 'تعميم جديد', $2, 'circular', $3, $4)`,
          [userId, title, circularId, `/app/circulars/${circularId}`],
        );
      }
    }
    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, 'circulars', $3, $4::jsonb)`,
      [actor.id, publish ? 'circular.publish' : 'circular.draft.save', circularId,
        JSON.stringify({ audience, recipientCount: selectedRecipients.length, parentId })],
    );
    await client.query('COMMIT');
    const saved = await db.query(`${circularSelect} WHERE c.id = $1 ORDER BY recipient.full_name_ar`, [circularId]);
    response.status(id ? 200 : 201).json({ circular: mapCircularRows(saved.rows)[0] });
  } catch {
    await client.query('ROLLBACK');
    response.status(503).json({ message: 'تعذر حفظ التعميم حالياً.' });
  } finally {
    client.release();
  }
}

router.post('/', (request: AuthenticatedRequest, response) => saveCircular(request, response));
router.put('/:circularId', (request: AuthenticatedRequest, response) => {
  const id = request.params.circularId;
  return saveCircular(request, response, Array.isArray(id) ? id[0] : id);
});

router.patch('/:circularId/acknowledge', async (request: AuthenticatedRequest, response) => {
  const actor = request.authUser!;
  if (!request.permissions?.includes('view_circulars')) {
    response.status(403).json({ message: 'لا تملك صلاحية عرض التعاميم.' });
    return;
  }
  const id = request.params.circularId;
  const circularId = Array.isArray(id) ? id[0] : id;
  try {
    const result = await db.query(
      `UPDATE circular_recipients cr SET acknowledged_at = COALESCE(acknowledged_at, now())
         FROM circulars c
        WHERE cr.circular_id = c.id AND cr.circular_id = $1 AND cr.user_id = $2 AND c.status = 'published'
        RETURNING cr.acknowledged_at`,
      [circularId, actor.id],
    );
    if (!result.rows[0]) {
      response.status(404).json({ message: 'التعميم غير موجّه إلى حسابك أو غير منشور.' });
      return;
    }
    await db.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'circular.acknowledge', 'circulars', $2, '{}'::jsonb)`, [actor.id, circularId],
    );
    response.json({ acknowledgedAt: result.rows[0].acknowledged_at });
  } catch {
    response.status(503).json({ message: 'تعذر حفظ إقرار القراءة.' });
  }
});

router.post('/:circularId/recipients/:userId/reminder', async (request: AuthenticatedRequest, response) => {
  const actor = request.authUser!;
  const cId = request.params.circularId;
  const uId = request.params.userId;
  const circularId = Array.isArray(cId) ? cId[0] : cId;
  const userId = Array.isArray(uId) ? uId[0] : uId;
  const manager = actor.roleCode === 'system_admin' || request.permissions?.includes('track_circulars');
  if (!manager) {
    response.status(403).json({ message: 'لا تملك صلاحية متابعة مستلمي التعميم.' });
    return;
  }
  try {
    const result = await db.query(
      `UPDATE circular_recipients cr SET reminder_count = reminder_count + 1
         FROM circulars c
        WHERE cr.circular_id = c.id AND cr.circular_id = $1 AND cr.user_id = $2
          AND cr.acknowledged_at IS NULL AND c.status = 'published'
          AND ($3::text = 'system_admin' OR c.department_id = $4)
        RETURNING cr.reminder_count`,
      [circularId, userId, actor.roleCode, actor.departmentId],
    );
    if (!result.rows[0]) {
      response.status(404).json({ message: 'المستلم غير موجود أو أقرّ بقراءة التعميم.' });
      return;
    }
    await db.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'circular.reminder.record', 'circulars', $2, $3::jsonb)`,
      [actor.id, circularId, JSON.stringify({ userId, reminderCount: result.rows[0].reminder_count, delivery: 'simulated' })],
    );
    response.json({ reminderCount: result.rows[0].reminder_count, delivery: 'simulated' });
  } catch {
    response.status(503).json({ message: 'تعذر حفظ محاولة التذكير.' });
  }
});

export default router;
