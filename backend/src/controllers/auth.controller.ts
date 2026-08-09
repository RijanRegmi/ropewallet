import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { AuthService } from '../services/auth.service.js';
import { User } from '../models/user.model.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_initialization_12345');

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

  static async checkEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.query;
      if (!email) {
        res.status(400).json({ success: false, error: 'Please provide an email to check' });
        return;
      }
      const available = await AuthService.checkEmailAvailability(email as string);
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
      
      if (!firstName || !lastName || !email || !password || !phoneNumber || !otpCode || !transactionPin) {
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
      const { email, password, deviceId } = req.body;
      const headerDeviceId = (req.headers['x-device-id'] as string) || deviceId;

      if (!email || !password) {
        res.status(400).json({ success: false, error: 'Please provide email and password' });
        return;
      }

      const result = await AuthService.login({ email, password, deviceId: headerDeviceId });
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyNewDevice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tempToken, otpCode, deviceId } = req.body;
      const headerDeviceId = (req.headers['x-device-id'] as string) || deviceId;

      if (!tempToken || !otpCode) {
        res.status(400).json({ success: false, error: 'Please provide verification code' });
        return;
      }

      const result = await AuthService.verifyNewDevice(tempToken, otpCode, headerDeviceId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async resendDeviceOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tempToken } = req.body;
      if (!tempToken) {
        res.status(400).json({ success: false, error: 'Verification session token required' });
        return;
      }

      await AuthService.resendNewDeviceOtp(tempToken);
      res.status(200).json({ success: true, message: 'New verification code sent to your email.' });
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
        paymentMethodId, // pm_xxx from Stripe SDK client-side tokenization
        cardholderName,
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

      if (!paymentMethodId || !cardholderName || !zipCode || !country || !addressLine1) {
        res.status(400).json({ success: false, error: 'Please provide payment method ID, cardholder name, country, and address' });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      // 1. Create or retrieve Stripe Customer
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          name: cardholderName,
          email: user.email,
          metadata: { userId: user._id.toString(), userTag: user.userTag },
        });
        stripeCustomerId = customer.id;
        user.stripeCustomerId = stripeCustomerId;
      }

      // 2. Detach old PaymentMethod if one exists
      if (user.savedCard?.stripePaymentMethodId) {
        try {
          await stripe.paymentMethods.detach(user.savedCard.stripePaymentMethodId);
        } catch (_) {
          // Ignore if already detached or invalid
        }
      }

      // 3. Attach the new PaymentMethod to the Customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomerId,
      });

      // 4. Set as default payment method for the customer
      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });

      // 5. Retrieve card details from the PaymentMethod for display
      const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
      const cardDetails = pm.card;
      const last4 = cardDetails?.last4 || '****';
      const expMonth = String(cardDetails?.exp_month || '');
      const expYear = String(cardDetails?.exp_year || '');
      let cardBrand = 'Debit Card';
      if (cardDetails?.brand) {
        const brandMap: Record<string, string> = {
          visa: 'Visa',
          mastercard: 'Mastercard',
          amex: 'American Express',
          discover: 'Discover',
          diners: 'Diners Club',
          jcb: 'JCB',
          unionpay: 'UnionPay',
        };
        cardBrand = brandMap[cardDetails.brand] || cardDetails.brand;
      }

      // 6. Store only Stripe references + display fields (NO raw card data)
      user.savedCard = {
        cardholderName,
        stripePaymentMethodId: paymentMethodId,
        expMonth,
        expYear,
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

  static async updateFcmToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      const { fcmToken } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      if (fcmToken && fcmToken.trim().length > 0) {
        const cleanToken = fcmToken.trim();
        // Remove this token from all other user accounts so only the active user on this device receives push notifications
        await User.updateMany(
          { fcmToken: cleanToken, _id: { $ne: userId } },
          { $set: { fcmToken: '' } }
        );
        await User.findByIdAndUpdate(userId, { fcmToken: cleanToken });
      } else {
        await User.findByIdAndUpdate(userId, { fcmToken: '' });
      }

      res.status(200).json({
        success: true,
        message: 'FCM push token updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      if (userId) {
        await User.findByIdAndUpdate(userId, { fcmToken: '' });
      }
      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
