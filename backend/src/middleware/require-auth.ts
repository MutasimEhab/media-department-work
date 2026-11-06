import type { NextFunction, Request, Response } from 'express';
import { authenticateRequest, getEffectivePermissions, type AuthenticatedUser } from '../routes/auth.js';

export interface AuthenticatedRequest extends Request {
  authUser?: AuthenticatedUser;
  permissions?: string[];
}

export async function requireAuth(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      response.status(401).json({ code: 'UNAUTHENTICATED', message: 'يرجى تسجيل الدخول للمتابعة.' });
      return;
    }
    request.authUser = user;
    request.permissions = await getEffectivePermissions(user.id, user.roleCode);
    next();
  } catch {
    response.status(503).json({ code: 'AUTH_UNAVAILABLE', message: 'تعذر التحقق من الجلسة حالياً.' });
  }
}
