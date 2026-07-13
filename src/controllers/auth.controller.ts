import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';

export class AuthController {
  static async checkUsername(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username } = req.query;
      if (!username) {
        res.status(400).json({ success: false, error: 'Please provide a username to check' });
        return;
      }
      const available = await AuthService.checkUsernameAvailability(username as string);
      res.status(200).json({ success: true, available });
    } catch (error) {
      next(error);
    }
  }

  static async sendRegisterOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, username } = req.body;
      if (!email || !username) {
        res.status(400).json({ success: false, error: 'Please provide email and username' });
        return;
      }
      await AuthService.sendRegisterOtp(email, username);
      res.status(200).json({ success: true, message: 'Verification OTP sent to your email' });
    } catch (error) {
      next(error);
    }
  }

  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { firstName, middleName, lastName, username, email, password, phoneNumber, otpCode } = req.body;
      
      if (!firstName || !lastName || !username || !email || !password || !phoneNumber || !otpCode) {
        res.status(400).json({ success: false, error: 'Please provide all required fields, including the OTP code' });
        return;
      }

      const result = await AuthService.register({
        firstName,
        middleName,
        lastName,
        username,
        email,
        password,
        phoneNumber,
        otpCode,
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ success: false, error: 'Please provide email and password' });
        return;
      }

      const result = await AuthService.login({ email, password });
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ success: false, error: 'Please provide your email' });
        return;
      }
      await AuthService.sendForgotPasswordOtp(email);
      res.status(200).json({ success: true, message: 'Verification OTP sent to your email' });
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otpCode, newPassword } = req.body;
      if (!email || !otpCode || !newPassword) {
        res.status(400).json({ success: false, error: 'Please provide email, otpCode, and newPassword' });
        return;
      }
      await AuthService.resetPassword(email, otpCode, newPassword);
      res.status(200).json({ success: true, message: 'Password has been reset successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async setPin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { pin } = req.body;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Not authorized to access this route' });
        return;
      }
      if (!pin || pin.length !== 4 || isNaN(Number(pin))) {
        res.status(400).json({ success: false, error: 'PIN must be a 4-digit number' });
        return;
      }
      await AuthService.setPin(userId, pin);
      res.status(200).json({ success: true, message: 'Transaction PIN set successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async verifyPin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { pin } = req.body;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Not authorized to access this route' });
        return;
      }
      if (!pin) {
        res.status(400).json({ success: false, error: 'PIN is required' });
        return;
      }
      const isValid = await AuthService.verifyPin(userId, pin);
      res.status(200).json({ success: true, valid: isValid });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Not authorized to access this route' });
        return;
      }

      const user = await AuthService.getMe(userId);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}
