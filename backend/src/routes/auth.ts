import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { Router, type Request, type Response } from 'express';
import { db } from '../db.js';

const router = Router();
const SESSION_COOKIE = 'media_dept_session';
const SESSION_LIFETIME_MS = 12 * 60 * 60 * 1000;
const IDLE_TIMEOUT_MINUTES = 30;
const BCRYPT_ROUNDS = 12;

type RoleCode = 'system_admin' | 'department_manager' | 'deputy_manager' | 'employee';

interface UserRow {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  full_name_ar: string;
  job_title_ar: string;
  mobile: string | null;
  is_active: boolean;
  department_id: string | null;
  department_name_ar: string | null;
  role_code: RoleCode;
}

const roleNames: Record<RoleCode, 'ADMIN' | 'MANAGER' | 'DEPUTY' | 'EMPLOYEE'> = {
  system_admin: 'ADMIN',
  department_manager: 'MANAGER',
  deputy_manager: 'DEPUTY',
  employee: 'EMPLOYEE',
};

const dummyPasswordHash = bcrypt.hash(randomBytes(32).toString('hex'), BCRYPT_ROUNDS);

function hashValue(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function readSessionToken(request: Request): string | undefined {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return undefined;
  const entry = cookieHeader.split(';').map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  if (!entry) return undefined;
  try {
    return decodeURIComponent(entry.slice(SESSION_COOKIE.length + 1));
  } catch {
    return undefined;
  }
}

function setSessionCookie(response: Response, token: string): void {
  response.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_LIFETIME_MS,
  });
}

function clearSessionCookie(response: Response): void {
  response.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

async function findUser(identifier: string): Promise<UserRow | undefined> {
  const result = await db.query<UserRow>(
    `SELECT u.id, u.username, u.email, u.password_hash, u.full_name_ar,
            u.job_title_ar, u.mobile, u.is_active, u.department_id,
            d.name_ar AS department_name_ar, u.role_code
       FROM users u
       LEFT JOIN departments d ON d.id = u.department_id
      WHERE lower(u.username) = $1 OR lower(u.email) = $1
      LIMIT 1`,
    [identifier],
  );
  return result.rows[0];
}

async function recordFailure(identifierHash: string): Promise<Date | null> {
  const result = await db.query<{ locked_until: Date | null }>(
    `INSERT INTO login_attempts (identifier_hash, failure_count, window_started_at, locked_until)
     VALUES ($1, 1, now(), NULL)
     ON CONFLICT (identifier_hash) DO UPDATE SET
       failure_count = CASE
         WHEN login_attempts.window_started_at < now() - interval '15 minutes' THEN 1
         ELSE least(login_attempts.failure_count + 1, 5)
       END,
       window_started_at = CASE
         WHEN login_attempts.window_started_at < now() - interval '15 minutes' THEN now()
         ELSE login_attempts.window_started_at
       END,
       locked_until = CASE
         WHEN login_attempts.window_started_at < now() - interval '15 minutes' THEN NULL
         WHEN login_attempts.failure_count >= 4 THEN now() + interval '15 minutes'
         ELSE NULL
       END,
       updated_at = now()
     RETURNING locked_until`,
    [identifierHash],
  );
  return result.rows[0]?.locked_until ?? null;
}

function publicUser(user: UserRow) {
  return {
    id: user.id,
    username: user.username,
    arabicName: user.full_name_ar,
    role: roleNames[user.role_code],
    jobTitleAr: user.job_title_ar,
    email: user.email,
    mobile: user.mobile ?? undefined,
    isActive: user.is_active,
    departmentId: user.department_id ?? undefined,
    departmentAr: user.department_name_ar ?? '',
  };
}

export interface AuthenticatedUser {
  id: string;
  roleCode: RoleCode;
  departmentId: string | null;
  username: string;
  email: string;
  fullNameAr: string;
}

export async function authenticateRequest(request: Request): Promise<AuthenticatedUser | null> {
  const token = readSessionToken(request);
  if (!token || token.length > 200) return null;
  const tokenHash = hashValue(token);
  const result = await db.query<AuthenticatedUser & { session_id: string }>(
    `UPDATE login_sessions s
        SET last_seen_at = now()
       FROM users u
      WHERE s.token_hash = $1
        AND s.user_id = u.id
        AND s.revoked_at IS NULL
        AND s.expires_at > now()
        AND s.last_seen_at > now() - ($2::text || ' minutes')::interval
        AND u.is_active = true
      RETURNING u.id, u.role_code AS "roleCode", u.department_id AS "departmentId",
                u.username, u.email, u.full_name_ar AS "fullNameAr", s.id AS session_id`,
    [tokenHash, IDLE_TIMEOUT_MINUTES],
  );
  const row = result.rows[0];
  return row ? {
    id: row.id,
    roleCode: row.roleCode,
    departmentId: row.departmentId,
    username: row.username,
    email: row.email,
    fullNameAr: row.fullNameAr,
  } : null;
}

export async function getEffectivePermissions(userId: string, roleCode: RoleCode): Promise<string[]> {
  const result = await db.query<{ code: string }>(
    `SELECT p.code
       FROM permissions p
       LEFT JOIN role_permissions rp
         ON rp.permission_code = p.code AND rp.role_code = $2
       LEFT JOIN user_permission_overrides upo
         ON upo.permission_code = p.code AND upo.user_id = $1
      WHERE COALESCE(upo.is_granted, rp.permission_code IS NOT NULL) = true
      ORDER BY p.code`,
    [userId, roleCode],
  );
  return result.rows.map((row) => row.code);
}

router.post('/login', async (request, response) => {
  const identifier = typeof request.body?.identifier === 'string'
    ? request.body.identifier.trim().toLowerCase()
    : '';
  const password = typeof request.body?.password === 'string' ? request.body.password : '';

  if (!identifier || identifier.length > 254 || !password || Buffer.byteLength(password, 'utf8') > 72) {
    response.status(400).json({ code: 'INVALID_INPUT', message: 'أدخل اسم المستخدم أو البريد وكلمة المرور.' });
    return;
  }

  const user = await findUser(identifier);
  const lockKey = user ? `user:${user.id}` : `unknown:${identifier}`;
  const identifierHash = hashValue(lockKey);
  const lock = await db.query<{ locked_until: Date | null }>(
    'SELECT locked_until FROM login_attempts WHERE identifier_hash = $1',
    [identifierHash],
  );
  const lockedUntil = lock.rows[0]?.locked_until;
  if (lockedUntil && new Date(lockedUntil).getTime() > Date.now()) {
    response.status(423).json({ code: 'ACCOUNT_TEMPORARILY_LOCKED', message: 'تم إيقاف محاولات الدخول مؤقتاً؛ حاول بعد 15 دقيقة.' });
    return;
  }

  const passwordMatches = user
    ? await bcrypt.compare(password, user.password_hash)
    : await bcrypt.compare(password, await dummyPasswordHash);

  if (!user || !passwordMatches) {
    const newLock = await recordFailure(identifierHash);
    if (newLock && new Date(newLock).getTime() > Date.now()) {
      response.status(423).json({ code: 'ACCOUNT_TEMPORARILY_LOCKED', message: 'تم إيقاف محاولات الدخول مؤقتاً؛ حاول بعد 15 دقيقة.' });
      return;
    }
    response.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'اسم المستخدم أو البريد الإلكتروني أو كلمة المرور غير صحيحة.' });
    return;
  }

  if (!user.is_active) {
    response.status(403).json({ code: 'ACCOUNT_INACTIVE', message: 'هذا الحساب غير نشط؛ راجع مسؤول النظام.' });
    return;
  }

  await db.query('DELETE FROM login_attempts WHERE identifier_hash = $1', [identifierHash]);

  const token = randomBytes(32).toString('base64url');
  const tokenHash = hashValue(token);
  await db.query(
    `INSERT INTO login_sessions (user_id, token_hash, expires_at)
     VALUES ($1, $2, now() + interval '12 hours')`,
    [user.id, tokenHash],
  );
  await db.query('UPDATE users SET last_login_at = now() WHERE id = $1', [user.id]);
  setSessionCookie(response, token);
  const permissions = await getEffectivePermissions(user.id, user.role_code);
  response.json({ user: publicUser(user), permissions });
});

router.get('/me', async (request, response) => {
  const user = await authenticateRequest(request);
  if (!user) {
    clearSessionCookie(response);
    response.status(401).json({ code: 'UNAUTHENTICATED', message: 'يرجى تسجيل الدخول للمتابعة.' });
    return;
  }
  const dbUser = await findUser(user.username);
  if (!dbUser) {
    clearSessionCookie(response);
    response.status(401).json({ code: 'UNAUTHENTICATED', message: 'يرجى تسجيل الدخول للمتابعة.' });
    return;
  }
  response.json({ user: publicUser(dbUser), permissions: await getEffectivePermissions(user.id, user.roleCode) });
});

router.post('/logout', async (request, response) => {
  const token = readSessionToken(request);
  if (token && token.length <= 200) {
    await db.query(
      'UPDATE login_sessions SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL',
      [hashValue(token)],
    );
  }
  clearSessionCookie(response);
  response.json({ message: 'تم تسجيل الخروج.' });
});

export default router;
