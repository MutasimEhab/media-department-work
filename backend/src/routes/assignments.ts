import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/require-auth.js';

const router = Router();
const statusToUi: Record<string, 'RECEIVED' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'RETURNED_FOR_REVISION'> = {
  assigned: 'RECEIVED', received: 'RECEIVED', in_progress: 'IN_PROGRESS', submitted: 'SUBMITTED',
  approved: 'APPROVED', returned: 'RETURNED_FOR_REVISION', returned_for_revision: 'RETURNED_FOR_REVISION',
};

function formatDeadline(value: Date | string | null): string {
  if (!value) return '';
  const date = new Date(value);
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Gaza', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
  const time = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Gaza', hour: '2-digit', minute: '2-digit', hour12: true }).format(date);
  return `${day} ${time}`;
}

function mapRows(rows: Array<Record<string, any>>) {
  const tasks = new Map<string, Record<string, any>>();
  for (const row of rows) {
    let task = tasks.get(row.id);
    if (!task) {
      task = {
        id: row.id, titleAr: row.title_ar, titleEn: row.title_ar,
        descriptionAr: row.description_ar, descriptionEn: row.description_ar,
        creatorId: row.created_by, creatorNameAr: row.creator_name, creatorNameEn: row.creator_name,
        priority: String(row.priority).toUpperCase(), type: row.kind === 'social_media' ? 'SOCIAL_MEDIA' : 'NORMAL',
        deadline: formatDeadline(row.deadline), createdAt: row.created_at,
        isDraft: row.status === 'draft', projectId: row.project_id ?? undefined,
        referenceUrl: row.reference_url ?? undefined, reminderOptions: row.reminder_options ?? [],
        emailDelivery: row.notify_email, smsDelivery: row.notify_sms,
        recipients: [], isOverdue: row.deadline ? new Date(row.deadline).getTime() < Date.now() && row.status === 'active' : false,
      };
      tasks.set(row.id, task);
    }
    if (row.assignee_id) {
      task.recipients.push({
        userId: row.assignee_user_id, userNameAr: row.assignee_name, userNameEn: row.assignee_name,
        status: statusToUi[row.assignee_status] ?? 'RECEIVED',
        statusUpdatedAt: row.status_updated_at, submissionLinks: row.submission_links ?? [],
        submissionLink: row.submission_links?.[0], submissionNote: row.delivery_note_ar ?? undefined,
        reviewedBy: row.reviewed_by_name ?? undefined, reviewNote: row.review_note_ar ?? undefined,
        firstSubmittedAt: row.first_submitted_at ? new Date(row.first_submitted_at).toLocaleString('ar-PS', { timeZone: 'Asia/Gaza', dateStyle: 'medium', timeStyle: 'short', hour12: true, numberingSystem: 'latn' }) : undefined,
      });
    }
  }
  return [...tasks.values()];
}

function parseDeadline(value: unknown): { date: string; time: string } | null {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^(\d{4}-\d{2}-\d{2})\s+(0?[1-9]|1[0-2]):([0-5]\d)\s*(AM|PM)$/i);
  if (!match) return null;
  let hour = Number(match[2]);
  if (match[4]!.toUpperCase() === 'PM' && hour !== 12) hour += 12;
  if (match[4]!.toUpperCase() === 'AM' && hour === 12) hour = 0;
  const date = new Date(`${match[1]}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== match[1]) return null;
  return { date: match[1], time: `${String(hour).padStart(2, '0')}:${match[3]}:00` };
}

router.use(requireAuth);

router.get('/', async (request: AuthenticatedRequest, response) => {
  const actor = request.authUser!;
  const mayViewDepartment = actor.roleCode === 'system_admin'
    || (['department_manager', 'deputy_manager'].includes(actor.roleCode)
      && (request.permissions?.includes('view_assignments') || request.permissions?.includes('manage_assignments')
        || request.permissions?.includes('review_assignments')));
  if (!mayViewDepartment && !request.permissions?.includes('view_assignments')) {
    response.status(403).json({ message: 'لا تملك صلاحية عرض التكليفات.' });
    return;
  }
  try {
    const result = await db.query(
      `SELECT a.id, a.created_by, a.title_ar, a.description_ar, a.priority, a.kind, a.status,
              a.deadline, a.created_at, a.project_id, a.reference_url, a.reminder_options,
              a.notify_email, a.notify_sms, creator.full_name_ar AS creator_name,
              aa.id AS assignee_id, aa.user_id AS assignee_user_id, assignee.full_name_ar AS assignee_name,
              aa.status AS assignee_status, aa.status_updated_at, aa.first_submitted_at, aa.delivery_note_ar,
              aa.review_note_ar, reviewer.full_name_ar AS reviewed_by_name,
              COALESCE((SELECT json_agg(d.drive_url ORDER BY d.created_at)
                          FROM assignment_deliveries d WHERE d.assignee_id = aa.id), '[]'::json) AS submission_links
         FROM assignments a
         JOIN users creator ON creator.id = a.created_by
         LEFT JOIN assignment_assignees aa ON aa.assignment_id = a.id
         LEFT JOIN users assignee ON assignee.id = aa.user_id
         LEFT JOIN users reviewer ON reviewer.id = aa.reviewed_by
        WHERE ($1::text = 'system_admin'
               OR ($4::boolean AND a.department_id = $2)
               OR aa.user_id = $3)
          AND (a.status <> 'draft' OR a.created_by = $3
               OR ($4::boolean AND a.department_id = $2))
        ORDER BY a.created_at DESC, aa.created_at ASC`,
      [actor.roleCode, actor.departmentId, actor.id, mayViewDepartment],
    );
    response.json({ tasks: mapRows(result.rows) });
  } catch {
    response.status(503).json({ message: 'تعذر تحميل التكليفات من قاعدة البيانات.' });
  }
});

async function saveAssignment(request: AuthenticatedRequest, response: import('express').Response, id?: string) {
  const actor = request.authUser!;
  if (actor.roleCode !== 'system_admin' && !request.permissions?.includes('manage_assignments')) {
    response.status(403).json({ message: 'لا تملك صلاحية إنشاء التكليفات أو إدارتها.' });
    return;
  }
  const body = request.body ?? {};
  const title = typeof body.titleAr === 'string' ? body.titleAr.trim() : '';
  const description = typeof body.descriptionAr === 'string' ? body.descriptionAr.trim() : '';
  const priority = typeof body.priority === 'string' ? body.priority.toLowerCase() : '';
  const kind = body.type === 'SOCIAL_MEDIA' ? 'social_media' : body.type === 'NORMAL' ? 'normal' : '';
  const draft = body.isDraft === true;
  const deadline = parseDeadline(body.deadline);
  const assigneeIds = Array.isArray(body.assigneeIds)
    ? [...new Set(body.assigneeIds.filter((value: unknown): value is string => typeof value === 'string'))]
    : [];
  const referenceUrl = typeof body.referenceUrl === 'string' ? body.referenceUrl.trim() : '';
  const reminderOptions = Array.isArray(body.reminderOptions)
    ? body.reminderOptions.filter((value: unknown): value is string => ['24h', '2h', 'daily'].includes(String(value)))
    : [];

  if (!title || title.length > 200 || (!draft && !description) || description.length > 10000
    || !['low', 'medium', 'high', 'urgent'].includes(priority) || !kind || !deadline
    || (!draft && assigneeIds.length === 0)
    || (referenceUrl && !/^https:\/\/drive\.google\.com\//.test(referenceUrl))) {
    response.status(400).json({ message: 'تحقق من العنوان والوصف والأولوية والموعد والمستلمين ورابط Google Drive.' });
    return;
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    let departmentId = actor.departmentId;
    if (assigneeIds.length) {
      const selected = await client.query<{ id: string; department_id: string }>(
        `SELECT id, department_id FROM users WHERE id = ANY($1::uuid[]) AND role_code = 'employee' AND is_active = true`,
        [assigneeIds],
      );
      const departments = new Set(selected.rows.map(row => row.department_id));
      if (selected.rows.length !== assigneeIds.length || departments.size !== 1) {
        await client.query('ROLLBACK');
        response.status(400).json({ message: 'اختر موظفين نشطين من دائرة واحدة فقط.' });
        return;
      }
      const selectedDepartment = selected.rows[0]!.department_id;
      if (actor.roleCode !== 'system_admin' && selectedDepartment !== actor.departmentId) {
        await client.query('ROLLBACK');
        response.status(403).json({ message: 'يمكنك تكليف موظفي دائرتك فقط.' });
        return;
      }
      departmentId = selectedDepartment;
    }
    if (!departmentId) {
      await client.query('ROLLBACK');
      response.status(400).json({ message: 'حدد موظفاً من الدائرة أو اربط الحساب بدائرة أولاً.' });
      return;
    }

    let assignmentId = id;
    if (id) {
      const updated = await client.query(
        `UPDATE assignments
            SET title_ar = $3, description_ar = $4, priority = $5, kind = $6,
                status = $7, deadline = ($8::date + $9::time) AT TIME ZONE 'Asia/Gaza',
                reference_url = $10, reminder_options = $11::jsonb,
                notify_email = $12, notify_sms = $13, updated_at = now()
          WHERE id = $1 AND created_by = $2 AND status = 'draft'
          RETURNING id`,
        [id, actor.id, title, description, priority, kind, draft ? 'draft' : 'active', deadline.date, deadline.time,
          referenceUrl || null, JSON.stringify(reminderOptions), body.emailDelivery === true, body.smsDelivery === true],
      );
      if (!updated.rows[0]) {
        await client.query('ROLLBACK');
        response.status(404).json({ message: 'المسودة غير موجودة أو لم تعد قابلة للتعديل.' });
        return;
      }
      await client.query('DELETE FROM assignment_assignees WHERE assignment_id = $1', [id]);
    } else {
      const created = await client.query<{ id: string }>(
        `INSERT INTO assignments (department_id, created_by, title_ar, description_ar, priority, kind,
                                 status, deadline, reference_url, reminder_options, notify_email, notify_sms)
         VALUES ($1, $2, $3, $4, $5, $6, $7, ($8::date + $9::time) AT TIME ZONE 'Asia/Gaza', $10, $11::jsonb, $12, $13)
         RETURNING id`,
        [departmentId, actor.id, title, description, priority, kind, draft ? 'draft' : 'active', deadline.date, deadline.time,
          referenceUrl || null, JSON.stringify(reminderOptions), body.emailDelivery === true, body.smsDelivery === true],
      );
      assignmentId = created.rows[0]!.id;
    }

    if (assigneeIds.length) {
      for (const userId of assigneeIds) {
        const assignee = await client.query<{ id: string }>(
          `INSERT INTO assignment_assignees (assignment_id, user_id, status)
           VALUES ($1, $2, 'assigned') RETURNING id`, [assignmentId, userId],
        );
        await client.query(
          `INSERT INTO assignment_events (assignment_id, assignee_id, actor_id, event_type, payload)
           VALUES ($1, $2, $3, $4, $5::jsonb)`,
          [assignmentId, assignee.rows[0]!.id, actor.id, draft ? 'draft_assignee_added' : 'assignment_sent', JSON.stringify({ title })],
        );
        if (!draft) {
          await client.query(
            `INSERT INTO notifications (user_id, type, title_ar, body_ar, entity_type, entity_id)
             VALUES ($1, 'TASK_ASSIGNED', 'تكليف عمل جديد', $2, 'assignment', $3)`,
            [userId, `تم إسناد تكليف جديد إليك: ${title}`, assignmentId],
          );
        }
      }
    }
    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, 'assignments', $3, $4::jsonb)`,
      [actor.id, draft ? 'assignment.draft.save' : 'assignment.send', assignmentId, JSON.stringify({ recipientCount: assigneeIds.length })],
    );
    await client.query('COMMIT');

    const saved = await db.query(
      `SELECT a.id, a.created_by, a.title_ar, a.description_ar, a.priority, a.kind, a.status,
              a.deadline, a.created_at, a.project_id, a.reference_url, a.reminder_options,
              a.notify_email, a.notify_sms, creator.full_name_ar AS creator_name,
              aa.id AS assignee_id, aa.user_id AS assignee_user_id, assignee.full_name_ar AS assignee_name,
              aa.status AS assignee_status, aa.status_updated_at, aa.first_submitted_at, aa.delivery_note_ar,
              aa.review_note_ar, reviewer.full_name_ar AS reviewed_by_name,
              COALESCE((SELECT json_agg(d.drive_url ORDER BY d.created_at)
                          FROM assignment_deliveries d WHERE d.assignee_id = aa.id), '[]'::json) AS submission_links
         FROM assignments a JOIN users creator ON creator.id = a.created_by
         LEFT JOIN assignment_assignees aa ON aa.assignment_id = a.id
         LEFT JOIN users assignee ON assignee.id = aa.user_id
         LEFT JOIN users reviewer ON reviewer.id = aa.reviewed_by
        WHERE a.id = $1 ORDER BY aa.created_at ASC`, [assignmentId],
    );
    response.status(id ? 200 : 201).json({ task: mapRows(saved.rows)[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    response.status(503).json({ message: 'تعذر حفظ التكليف في قاعدة البيانات.' });
  } finally {
    client.release();
  }
}

router.post('/', (request: AuthenticatedRequest, response) => saveAssignment(request, response));
router.put('/:assignmentId', (request: AuthenticatedRequest, response) => {
  const assignmentId = request.params.assignmentId;
  return saveAssignment(request, response, Array.isArray(assignmentId) ? assignmentId[0] : assignmentId);
});

router.patch('/:assignmentId/recipients/:userId', async (request: AuthenticatedRequest, response) => {
  const actor = request.authUser!;
  const assignmentId = request.params.assignmentId;
  const userId = request.params.userId;
  const taskId = Array.isArray(assignmentId) ? assignmentId[0] : assignmentId;
  const targetUserId = Array.isArray(userId) ? userId[0] : userId;
  const nextStatus = String(request.body?.status ?? '');
  const links: string[] = Array.isArray(request.body?.submissionLinks)
    ? [...new Set<string>(request.body.submissionLinks.filter((value: unknown): value is string => typeof value === 'string'))]
    : [];
  const note = typeof request.body?.submissionNote === 'string' ? request.body.submissionNote.trim() : '';
  const reviewNote = typeof request.body?.reviewNote === 'string' ? request.body.reviewNote.trim() : '';
  if (!['IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'RETURNED_FOR_REVISION'].includes(nextStatus)
    || links.length > 10 || links.some(link => !/^https:\/\/drive\.google\.com\//.test(link))
    || note.length > 2000 || reviewNote.length > 2000) {
    response.status(400).json({ message: 'تحقق من حالة التكليف وروابط Google Drive والملاحظات.' });
    return;
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const lookup = await client.query<{
      assignee_id: string; current_status: string; assignment_status: string;
      department_id: string; created_by: string; full_name_ar: string;
    }>(
      `SELECT aa.id AS assignee_id, aa.status AS current_status, a.status AS assignment_status,
              a.department_id, a.created_by, u.full_name_ar
         FROM assignments a JOIN assignment_assignees aa ON aa.assignment_id = a.id
         JOIN users u ON u.id = aa.user_id
        WHERE a.id = $1 AND aa.user_id = $2 FOR UPDATE OF aa`,
      [taskId, targetUserId],
    );
    const recipient = lookup.rows[0];
    if (!recipient || recipient.assignment_status !== 'active') {
      await client.query('ROLLBACK');
      response.status(404).json({ message: 'المكلف غير موجود أو التكليف غير نشط.' });
      return;
    }

    const isOwner = actor.id === targetUserId && actor.roleCode === 'employee';
    const canReview = actor.roleCode === 'system_admin'
      || (actor.departmentId === recipient.department_id
        && request.permissions?.includes('review_assignments'));
    const ownerTransition = (nextStatus === 'IN_PROGRESS' && ['assigned', 'received'].includes(recipient.current_status))
      || (nextStatus === 'SUBMITTED'
        && ['in_progress', 'returned', 'returned_for_revision'].includes(recipient.current_status) && links.length > 0);
    const reviewTransition = recipient.current_status === 'submitted'
      && ['APPROVED', 'RETURNED_FOR_REVISION'].includes(nextStatus)
      && (nextStatus !== 'RETURNED_FOR_REVISION' || Boolean(reviewNote));
    if (!(isOwner && ownerTransition) && !(canReview && reviewTransition)) {
      await client.query('ROLLBACK');
      response.status(403).json({ message: 'لا تسمح صلاحياتك أو حالة التكليف بهذا الإجراء.' });
      return;
    }

    const dbStatus: Record<string, string> = {
      IN_PROGRESS: 'in_progress', SUBMITTED: 'submitted', APPROVED: 'approved', RETURNED_FOR_REVISION: 'returned_for_revision',
    };
    const updated = await client.query<{ id: string }>(
      `UPDATE assignment_assignees
          SET status = $2, status_updated_at = now(),
              delivery_note_ar = CASE WHEN $2 = 'submitted' THEN $3 ELSE delivery_note_ar END,
              submitted_at = CASE WHEN $2 = 'submitted' THEN now() ELSE submitted_at END,
              delivered_at = CASE WHEN $2 = 'submitted' THEN now() ELSE delivered_at END,
              first_submitted_at = CASE WHEN $2 = 'submitted' THEN COALESCE(first_submitted_at, now()) ELSE first_submitted_at END,
              reviewed_by = CASE WHEN $2 IN ('approved', 'returned_for_revision') THEN $4 ELSE reviewed_by END,
              review_note_ar = CASE WHEN $2 IN ('approved', 'returned_for_revision') THEN $5 ELSE review_note_ar END,
              return_count = CASE WHEN $2 = 'returned_for_revision' THEN return_count + 1 ELSE return_count END
        WHERE id = $1 RETURNING id`,
      [recipient.assignee_id, dbStatus[nextStatus], note || null, canReview ? actor.id : null, reviewNote || null],
    );
    if (nextStatus === 'SUBMITTED') {
      for (const link of links) {
        await client.query('INSERT INTO assignment_deliveries (assignee_id, drive_url) VALUES ($1, $2)', [recipient.assignee_id, link]);
      }
    }
    const eventType = nextStatus === 'SUBMITTED' ? 'work_submitted'
      : nextStatus === 'APPROVED' ? 'work_approved'
        : nextStatus === 'RETURNED_FOR_REVISION' ? 'work_returned' : 'status_changed';
    await client.query(
      `INSERT INTO assignment_events (assignment_id, assignee_id, actor_id, event_type, payload)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [taskId, updated.rows[0]!.id, actor.id, eventType, JSON.stringify({ status: nextStatus, linkCount: links.length })],
    );
    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, 'assignment_assignees', $3, $4::jsonb)`,
      [actor.id, `assignment.${eventType}`, updated.rows[0]!.id, JSON.stringify({ assignmentId: taskId, userId: targetUserId })],
    );
    if (['SUBMITTED', 'APPROVED', 'RETURNED_FOR_REVISION'].includes(nextStatus)) {
      const notifyUser = nextStatus === 'SUBMITTED' ? recipient.created_by : targetUserId;
      const title = nextStatus === 'SUBMITTED' ? 'تسليم تكليف للمراجعة'
        : nextStatus === 'APPROVED' ? 'تم اعتماد تسليم التكليف' : 'أعيد تسليم التكليف للمراجعة';
      const body = nextStatus === 'SUBMITTED' ? `قدّم ${recipient.full_name_ar} تسليماً جديداً للمراجعة.`
        : nextStatus === 'APPROVED' ? 'تم اعتماد تسليمك.' : `يرجى مراجعة الملاحظة: ${reviewNote}`;
      await client.query(
        `INSERT INTO notifications (user_id, type, title_ar, body_ar, entity_type, entity_id)
         VALUES ($1, $2, $3, $4, 'assignment', $5)`,
        [notifyUser, nextStatus === 'SUBMITTED' ? 'TASK_SUBMITTED' : 'TASK_ASSIGNED', title, body, taskId],
      );
    }
    await client.query('COMMIT');
    response.json({ ok: true, status: nextStatus });
  } catch {
    await client.query('ROLLBACK');
    response.status(503).json({ message: 'تعذر حفظ تحديث التكليف حالياً.' });
  } finally {
    client.release();
  }
});

export default router;
