import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { CustomError } from './error.middleware.js';

interface JwtPayload {
  id: string;
  sessionToken?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforwalletapp12345';

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    next(new CustomError('Not authorized to access this resource', 401));
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    const user = await User.findById(decoded.id).select('isFrozen freezeReason activeDeviceId activeSessionToken');
    if (!user) {
      next(new CustomError('User belonging to this token no longer exists', 401));
      return;
    }

    // Block frozen accounts from all API operations
    if (user.isFrozen) {
      const reasonMsg = (user as any).freezeReason ? ` Reason: ${(user as any).freezeReason}` : '';
      next(new CustomError(`Your account has been frozen.${reasonMsg}`, 403));
      return;
    }

    // Single Device Security Check:
    // If account was bound to a new device or session, terminate access for older devices
    const incomingDeviceId = req.headers['x-device-id'] as string;
    if (user.activeSessionToken && decoded.sessionToken && decoded.sessionToken !== user.activeSessionToken) {
      res.status(401).json({
        success: false,
        error: 'Session terminated: Your account was logged into on another device.',
        isDeviceRevoked: true,
      });
      return;
    }

    if (user.activeDeviceId && incomingDeviceId && incomingDeviceId !== user.activeDeviceId) {
      res.status(401).json({
        success: false,
        error: 'Session terminated: Your account was logged into on another device.',
        isDeviceRevoked: true,
      });
      return;
    }

    // Attach decoded user information to request
    (req as any).user = { id: decoded.id };
    next();
  } catch (error) {
    next(new CustomError('Not authorized to access this resource', 401));
  }
};
