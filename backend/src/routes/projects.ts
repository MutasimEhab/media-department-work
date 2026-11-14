import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/require-auth.js';

const router = Router();
const uiStatusToDb: Record<string, string> = {
  IN_PROGRESS: 'in_progress', COMPLETED: 'completed', CLOSED: 'closed', ON_HOLD: 'paused',
};
const dbStatusToUi: Record<string, string> = {
  planned: 'IN_PROGRESS', active: 'IN_PROGRESS', in_progress: 'IN_PROGRESS',
  completed: 'COMPLETED', closed: 'CLOSED', paused: 'ON_HOLD', on_hold: 'ON_HOLD', cancelled: 'CLOSED',
};

function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function mapProject(row: Record<string, any>, stages: Array<Record<string, any>>) {
  return {
    id: row.id, titleAr: row.title_ar, titleEn: row.title_ar,
    descriptionAr: row.description_ar, descriptionEn: row.description_ar,
    ownerId: row.owner_id, ownerNameAr: row.owner_name, ownerNameEn: row.owner_name,
    status: dbStatusToUi[row.status] ?? 'IN_PROGRESS',
    expectedEndDate: row.expected_end_date ? String(row.expected_end_date).slice(0, 10) : undefined,
    startedAt: row.start_date ? String(row.start_date).slice(0, 10) : undefined,
    relatedTaskId: row.assignment_id ?? undefined,
    memberIds: row.member_ids ?? [],
    stages: stages.map(stage => ({
      id: Number(stage.sort_order), titleAr: stage.title_ar, titleEn: stage.title_ar,
      isCompleted: stage.status === 'completed',
      dueDate: stage.due_date ? String(stage.due_date).slice(0, 10) : undefined,
      completedAt: stage.completed_at ?? undefined, driveLink: stage.drive_link ?? undefined,
    })),
  };
}

router.use(requireAuth);

router.get('/', async (request: AuthenticatedRequest, response) => {
  const actor = request.authUser!;
  const mayViewDepartment = actor.roleCode === 'system_admin'
    || (['department_manager', 'deputy_manager'].includes(actor.roleCode)
      && (request.permissions?.includes('view_projects') || request.permissions?.includes('manage_projects')));
  if (!mayViewDepartment && !request.permissions?.includes('view_projects')) {
    response.status(403).json({ message: 'لا تملك صلاحية عرض المشاريع.' });
    return;
  }
  try {
    const result = await db.query(
      `SELECT p.id, p.title_ar, p.description_ar, p.status, p.start_date, p.expected_end_date,
              p.assignment_id, p.owner_id, owner.full_name_ar AS owner_name,
              COALESCE((SELECT json_agg(pm.user_id) FROM project_members pm WHERE pm.project_id = p.id), '[]'::json) AS member_ids
         FROM projects p JOIN users owner ON owner.id = p.owner_id
        WHERE ($1::text = 'system_admin' OR ($4::boolean AND p.department_id = $2)
               OR p.owner_id = $3
               OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = $3))
        ORDER BY p.updated_at DESC, p.created_at DESC`,
      [actor.roleCode, actor.departmentId, actor.id, mayViewDepartment],
    );
    const projectIds = result.rows.map(row => row.id);
    const stages = projectIds.length ? await db.query(
      `SELECT id, project_id, title_ar, status, sort_order, due_date, completed_at, drive_link
         FROM project_stages WHERE project_id = ANY($1::uuid[]) ORDER BY project_id, sort_order`, [projectIds],
    ) : { rows: [] };
    const grouped = new Map<string, Array<Record<string, any>>>();
    for (const stage of stages.rows) grouped.set(stage.project_id, [...(grouped.get(stage.project_id) ?? []), stage]);
    response.json({ projects: result.rows.map(row => mapProject(row, grouped.get(row.id) ?? [])) });
  } catch {
    response.status(503).json({ message: 'تعذر تحميل المشاريع من قاعدة البيانات.' });
  }
});

router.post('/', async (request: AuthenticatedRequest, response) => {
  const actor = request.authUser!;
  if (actor.roleCode !== 'system_admin' && !request.permissions?.includes('manage_projects')) {
    response.status(403).json({ message: 'لا تملك صلاحية إنشاء مشروع.' });
    return;
  }
  const body = request.body ?? {};
  const title = typeof body.titleAr === 'string' ? body.titleAr.trim() : '';
  const description = typeof body.descriptionAr === 'string' ? body.descriptionAr.trim() : '';
  const ownerId = typeof body.ownerId === 'string' ? body.ownerId : '';
  const startDate = validDate(body.startDate) ? body.startDate : null;
  const endDate = body.expectedEndDate === '' || body.expectedEndDate == null ? null : validDate(body.expectedEndDate) ? body.expectedEndDate : 'invalid';
  const assignmentId = typeof body.relatedTaskId === 'string' && body.relatedTaskId ? body.relatedTaskId : null;
  if (!title || title.length > 200 || description.length > 10000 || !ownerId || endDate === 'invalid'
    || (startDate && endDate && endDate < startDate)) {
    response.status(400).json({ message: 'أدخل اسم المشروع وتحقق من الوصف والمالك والتواريخ.' });
    return;
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const ownerResult = await client.query<{ department_id: string | null; full_name_ar: string; role_code: string; is_active: boolean }>(
      'SELECT department_id, full_name_ar, role_code, is_active FROM users WHERE id = $1 FOR SHARE', [ownerId],
    );
    const owner = ownerResult.rows[0];
    if (!owner || owner.role_code !== 'employee' || !owner.is_active
      || (actor.roleCode !== 'system_admin' && owner.department_id !== actor.departmentId)) {
      await client.query('ROLLBACK');
      response.status(400).json({ message: 'اختر موظفاً نشطاً من قسمك ليكون مسؤول المشروع.' });
      return;
    }
    if (!owner.department_id) {
      await client.query('ROLLBACK');
      response.status(400).json({ message: 'حساب الموظف غير مرتبط بقسم.' });
      return;
    }
    if (assignmentId) {
      const linked = await client.query('SELECT id FROM assignments WHERE id = $1 AND department_id = $2', [assignmentId, owner.department_id]);
      if (!linked.rows[0]) {
        await client.query('ROLLBACK');
        response.status(400).json({ message: 'التكليف المرتبط غير موجود ضمن قسم المشروع.' });
        return;
      }
    }
    const created = await client.query<{ id: string }>(
      `INSERT INTO projects (department_id, created_by, owner_id, assignment_id, title_ar, description_ar, status, start_date, expected_end_date)
       VALUES ($1, $2, $3, $4, $5, $6, 'in_progress', $7, $8) RETURNING id`,
      [owner.department_id, actor.id, ownerId, assignmentId, title, description, startDate, endDate],
    );
    const projectId = created.rows[0]!.id;
    await client.query('INSERT INTO project_members (project_id, user_id, added_by) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [projectId, ownerId, actor.id]);
    await client.query(
      `INSERT INTO notifications (user_id, type, title_ar, body_ar, entity_type, entity_id, action_url)
       VALUES ($1, 'PROJECT_ASSIGNED', 'مشروع جديد', $2, 'project', $3, $4)`,
      [ownerId, `تم تكليفك بمسؤولية مشروع «${title}». افتح المشروع للاطلاع على التفاصيل والمراحل.`, projectId, `/app/projects/${projectId}`],
    );
    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'project.create', 'projects', $2, $3::jsonb)`,
      [actor.id, projectId, JSON.stringify({ ownerId, title })],
    );
    await client.query('COMMIT');
    response.status(201).json({ project: {
      id: projectId, titleAr: title, titleEn: title, descriptionAr: description, descriptionEn: description,
      ownerId, ownerNameAr: owner.full_name_ar, ownerNameEn: owner.full_name_ar, status: 'IN_PROGRESS',
      startedAt: startDate ?? undefined, expectedEndDate: endDate ?? undefined, relatedTaskId: assignmentId ?? undefined,
      memberIds: [ownerId], stages: [],
    } });
  } catch (error) {
    await client.query('ROLLBACK');
    response.status(503).json({ message: 'تعذر حفظ المشروع حالياً.' });
  } finally {
    client.release();
  }
});

router.patch('/:projectId', async (request: AuthenticatedRequest, response) => {
  const actor = request.authUser!;
  const projectId = Array.isArray(request.params.projectId) ? request.params.projectId[0] : request.params.projectId;
  const body = request.body ?? {};
  const title = typeof body.titleAr === 'string' ? body.titleAr.trim() : '';
  const description = typeof body.descriptionAr === 'string' ? body.descriptionAr.trim() : '';
  const uiStatus = String(body.status ?? '');
  const nextStatus = uiStatusToDb[uiStatus];
  const startDate = body.startDate == null || body.startDate === '' ? null : validDate(body.startDate) ? body.startDate : 'invalid';
  const endDate = body.expectedEndDate == null || body.expectedEndDate === '' ? null : validDate(body.expectedEndDate) ? body.expectedEndDate : 'invalid';
  const stages = Array.isArray(body.stages) ? body.stages as Array<Record<string, unknown>> : null;
  if (!title || title.length > 200 || description.length > 10000 || !nextStatus || startDate === 'invalid' || endDate === 'invalid'
    || (startDate && endDate && endDate < startDate) || !stages || stages.length > 100
    || stages.some(stage => typeof stage.titleAr !== 'string' || !String(stage.titleAr).trim() || String(stage.titleAr).length > 200
      || (stage.dueDate != null && stage.dueDate !== '' && !validDate(stage.dueDate)))) {
    response.status(400).json({ message: 'تحقق من بيانات المشروع ومراحله وتواريخه.' });
    return;
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const found = await client.query<{ department_id: string; owner_id: string; status: string; assignment_id: string | null }>(
      'SELECT department_id, owner_id, status, assignment_id FROM projects WHERE id = $1 FOR UPDATE', [projectId],
    );
    const project = found.rows[0];
    if (!project) {
      await client.query('ROLLBACK');
      response.status(404).json({ message: 'المشروع غير موجود.' });
      return;
    }
    const manager = actor.roleCode === 'system_admin'
      || (actor.departmentId === project.department_id && request.permissions?.includes('manage_projects'));
    const owner = actor.id === project.owner_id;
    if (!manager && !owner) {
      await client.query('ROLLBACK');
      response.status(403).json({ message: 'لا تملك صلاحية تعديل هذا المشروع.' });
      return;
    }
    if (uiStatus === 'CLOSED' && !manager) {
      await client.query('ROLLBACK');
      response.status(403).json({ message: 'إغلاق المشروع متاح للإدارة المخولة.' });
      return;
    }
    if (project.status === 'closed' && uiStatus !== 'CLOSED' && actor.roleCode !== 'system_admin') {
      await client.query('ROLLBACK');
      response.status(403).json({ message: 'إعادة فتح المشروع متاحة لمدير النظام فقط.' });
      return;
    }
    await client.query(
      `UPDATE projects SET title_ar = $2, description_ar = $3, status = $4, start_date = $5,
                           expected_end_date = $6, updated_at = now() WHERE id = $1`,
      [projectId, title, description, nextStatus, startDate, endDate],
    );
    await client.query('DELETE FROM project_stages WHERE project_id = $1', [projectId]);
    for (const [index, stage] of stages.entries()) {
      const completed = stage.isCompleted === true;
      await client.query(
        `INSERT INTO project_stages (project_id, title_ar, status, sort_order, due_date, completed_at, drive_link)
         VALUES ($1, $2, $3, $4, $5, CASE WHEN $3 = 'completed' THEN COALESCE($6::timestamptz, now()) ELSE NULL END, $7)`,
        [projectId, String(stage.titleAr).trim(), completed ? 'completed' : 'pending', index + 1,
          typeof stage.dueDate === 'string' && stage.dueDate ? stage.dueDate : null,
          typeof stage.completedAt === 'string' ? stage.completedAt : null,
          typeof stage.driveLink === 'string' ? stage.driveLink : null],
      );
    }
    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'project.update', 'projects', $2, $3::jsonb)`,
      [actor.id, projectId, JSON.stringify({ status: nextStatus, stageCount: stages.length })],
    );
    await client.query('COMMIT');
    response.json({ ok: true });
  } catch {
    await client.query('ROLLBACK');
    response.status(503).json({ message: 'تعذر حفظ تحديث المشروع حالياً.' });
  } finally {
    client.release();
  }
});

export default router;
