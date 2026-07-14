import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Admin } from '../models/admin.model.js';
import { CustomError } from './error.middleware.js';

interface AdminJwtPayload {
  id: string;
  role: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforwalletapp12345';

/**
 * Middleware to protect admin-only routes.
 * Verifies admin JWT from either:
 *   - Authorization: Bearer <token> header (API calls)
 *   - admin_token cookie (web portal)
 */
export const adminProtect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  // Check Authorization header first
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Fallback to cookie for web portal
  if (!token && req.cookies?.admin_token) {
    token = req.cookies.admin_token;
  }

  if (!token) {
    if (req.originalUrl.startsWith('/api')) {
      next(new CustomError('Admin authentication required', 401));
      return;
    }
    res.redirect('/admin');
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminJwtPayload;

    const admin = await Admin.findById(decoded.id);
    if (!admin || !admin.isActive) {
      if (req.originalUrl.startsWith('/api')) {
        next(new CustomError('Admin account not found or inactive', 401));
        return;
      }
      res.redirect('/admin');
      return;
    }

    // Attach admin info to request
    (req as any).admin = { id: decoded.id, role: decoded.role };
    next();
  } catch (error) {
    if (req.originalUrl.startsWith('/api')) {
      next(new CustomError('Invalid admin token', 401));
      return;
    }
    res.redirect('/admin');
  }
};

/**
 * Middleware to restrict access to superadmin only.
 * Must be used AFTER adminProtect.
 */
export const superAdminOnly = (req: Request, res: Response, next: NextFunction): void => {
  const admin = (req as any).admin;
  if (!admin || admin.role !== 'superadmin') {
    if (req.originalUrl.startsWith('/api')) {
      next(new CustomError('Superadmin access required', 403));
      return;
    }
    res.status(403).send('Access denied: Superadmin only');
    return;
  }
  next();
};
