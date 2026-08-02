import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { CustomError } from './error.middleware.js';

interface JwtPayload {
  id: string;
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

    const user = await User.findById(decoded.id).select('isFrozen');
    if (!user) {
      next(new CustomError('User belonging to this token no longer exists', 401));
      return;
    }

    // Block frozen accounts from all API operations
    if (user.isFrozen) {
      next(new CustomError('Your account has been frozen. Please contact support.', 403));
      return;
    }

    // Attach decoded user information to request
    (req as any).user = { id: decoded.id };
    next();
  } catch (error) {
    next(new CustomError('Not authorized to access this resource', 401));
  }
};
