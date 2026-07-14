import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { User } from '../models/user.model.js';

export class AuthController {
  static async checkUserTag(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userTag } = req.query;
      if (!userTag) {
        res.status(400).json({ success: false, error: 'Please provide a user tag to check' });
        return;
      }
      const available = await AuthService.checkUserTagAvailability(userTag as string);
      res.status(200).json({ success: true, available });
    } catch (error) {
      next(error);
    }
  }

  static async sendRegisterOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ success: false, error: 'Please provide email' });
        return;
      }
      await AuthService.sendRegisterOtp(email);
      res.status(200).json({ success: true, message: 'Verification OTP sent to your email' });
    } catch (error) {
      next(error);
    }
  }

  static async verifyRegisterOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otpCode } = req.body;
      if (!email || !otpCode) {
        res.status(400).json({ success: false, error: 'Please provide email and verification code' });
        return;
      }
      const isValid = await AuthService.verifyOtp(email, otpCode);
      if (!isValid) {
        res.status(400).json({ success: false, error: 'Invalid or expired verification code' });
        return;
      }
      res.status(200).json({ success: true, message: 'Verification code is valid' });
    } catch (error) {
      next(error);
    }
  }

  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { firstName, middleName, lastName, userTag, email, password, phoneNumber, otpCode, transactionPin } = req.body;
      
      if (!firstName || !lastName || !userTag || !email || !password || !phoneNumber || !otpCode || !transactionPin) {
        res.status(400).json({ success: false, error: 'Please provide all required fields, including the OTP code and Transaction PIN' });
        return;
      }

      if (transactionPin.length !== 6 || isNaN(Number(transactionPin))) {
        res.status(400).json({ success: false, error: 'Transaction PIN must be a 6-digit number' });
        return;
      }

      const result = await AuthService.register({
        firstName,
        middleName,
        lastName,
        userTag,
        email,
        password,
        phoneNumber,
        otpCode,
        transactionPin,
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

  static async verifyForgotPasswordOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otpCode } = req.body;
      if (!email || !otpCode) {
        res.status(400).json({ success: false, error: 'Please provide email and verification code' });
        return;
      }
      const isValid = await AuthService.verifyOtp(email, otpCode);
      if (!isValid) {
        res.status(400).json({ success: false, error: 'Invalid or expired verification code' });
        return;
      }
      res.status(200).json({ success: true, message: 'Verification code is valid' });
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
      if (!pin || pin.length !== 6 || isNaN(Number(pin))) {
        res.status(400).json({ success: false, error: 'PIN must be a 6-digit number' });
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

  static async updateProfileImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { profileImage } = req.body;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Not authorized' });
        return;
      }
      if (!profileImage) {
        res.status(400).json({ success: false, error: 'Please provide profileImage URL' });
        return;
      }
      await AuthService.updateProfileImage(userId, profileImage);
      res.status(200).json({ success: true, message: 'Profile image updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async sendUpdateOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Not authorized' });
        return;
      }
      await AuthService.sendUpdateOtp(userId);
      res.status(200).json({ success: true, message: 'Verification OTP sent to your registered email' });
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { otpCode, newPassword } = req.body;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Not authorized' });
        return;
      }
      if (!otpCode || !newPassword) {
        res.status(400).json({ success: false, error: 'Please provide otpCode and newPassword' });
        return;
      }
      await AuthService.changePassword(userId, otpCode, newPassword);
      res.status(200).json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async changePin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { otpCode, newPin } = req.body;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Not authorized' });
        return;
      }
      if (!otpCode || !newPin || newPin.length !== 6 || isNaN(Number(newPin))) {
        res.status(400).json({ success: false, error: 'Please provide otpCode and a valid 6-digit newPin' });
        return;
      }
      await AuthService.changePin(userId, otpCode, newPin);
      res.status(200).json({ success: true, message: 'Transaction PIN changed successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async saveCard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const {
        cardholderName,
        cardNumber,
        expMonth,
        expYear,
        cvc,
        zipCode,
        country,
        addressLine1,
        differentInvoiceName,
        invoiceName,
        taxId
      } = req.body;
      
      if (!userId) {
        res.status(401).json({ success: false, error: 'Not authorized' });
        return;
      }

      if (!cardholderName || !cardNumber || !expMonth || !expYear || !cvc || !zipCode || !country || !addressLine1) {
        res.status(400).json({ success: false, error: 'Please provide complete card details, country, and address' });
        return;
      }
      
      const cleanCard = cardNumber.replace(/\s+/g, '');
      const last4 = cleanCard.substring(cleanCard.length - 4);
      let cardBrand = 'Debit Card';
      if (cleanCard.startsWith('4')) {
        cardBrand = 'Visa';
      } else if (cleanCard.startsWith('5')) {
        cardBrand = 'Mastercard';
      } else if (cleanCard.startsWith('34') || cleanCard.startsWith('37')) {
        cardBrand = 'American Express';
      } else if (cleanCard.startsWith('6')) {
        cardBrand = 'Discover';
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      user.savedCard = {
        cardholderName,
        cardNumber: cleanCard,
        expMonth,
        expYear,
        cvc,
        zipCode,
        country,
        cardBrand,
        last4,
        addressLine1,
        differentInvoiceName: !!differentInvoiceName,
        invoiceName: invoiceName || '',
        taxId: taxId || '',
      };

      await user.save();

      res.status(200).json({
        success: true,
        message: 'Card saved successfully',
        data: {
          savedCard: user.toObject({ getters: true }).savedCard,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteCard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Not authorized' });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      user.savedCard = undefined;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Card deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
