import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcryptjs from 'bcryptjs';
import { User } from '../models/user.model.js';
import { Otp } from '../models/otp.model.js';
import { EmailService } from './email.service.js';
import { RegisterDTO, LoginDTO, AuthResponse } from '../types/auth.dto.js';
import { CustomError } from '../middlewares/error.middleware.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforwalletapp12345';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateToken = (userId: string, sessionToken?: string): string => {
  return jwt.sign({ id: userId, sessionToken }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
};

export class AuthService {
  static async checkUserTagAvailability(userTag: string): Promise<boolean> {
    const existing = await User.findOne({ userTag: userTag.toLowerCase().trim() });
    return !existing;
  }

  static async checkEmailAvailability(email: string): Promise<boolean> {
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    return !existing;
  }

  static async verifyOtp(email: string, code: string): Promise<boolean> {
    const emailNorm = email.toLowerCase().trim();
    const otpRecord = await Otp.findOne({ email: emailNorm });
    return otpRecord !== null && otpRecord.code === code.trim();
  }

  static async sendRegisterOtp(email: string): Promise<void> {
    // 1. Check if email already registered
    const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      throw new CustomError('Email already registered', 400);
    }

    // 2. Generate 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Save to OTP collection (TTL auto-expires in 5 mins)
    await Otp.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { code, createdAt: new Date() },
      { upsert: true, new: true }
    );

    // 4. Send email via SMTP
    try {
      await EmailService.sendOtpEmail(email.toLowerCase().trim(), code);
    } catch (err: any) {
      console.error('SMTP Delivery error:', err);
      throw new CustomError(`Failed to send verification email: ${err.message}`, 500);
    }
  }

  static async register(data: RegisterDTO): Promise<AuthResponse> {
    const emailNorm = data.email.toLowerCase().trim();

    // 1. Verify OTP code
    const otpRecord = await Otp.findOne({ email: emailNorm });
    if (!otpRecord || otpRecord.code !== data.otpCode.trim()) {
      throw new CustomError('Invalid or expired OTP verification code', 400);
    }

    // 2. Double check availability
    const existingUser = await User.findOne({ email: emailNorm });
    if (existingUser) {
      throw new CustomError('Email already registered', 400);
    }
    const existingPhone = await User.findOne({ phoneNumber: data.phoneNumber.trim() });
    if (existingPhone) {
      throw new CustomError('Phone number already registered to another user', 400);
    }

    // 3. Delete OTP record so it can't be re-used
    await Otp.deleteOne({ email: emailNorm });

    // 4. Auto-generate RopeWallet unique tag ($firstName-xxxx e.g. $test-c290)
    let generatedTag = '';
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 100) {
      const cleanFirst = data.firstName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'user';
      const randomChars = Math.random().toString(36).substring(2, 6).toLowerCase(); // 4 random alphanumeric chars
      generatedTag = `$${cleanFirst}-${randomChars}`;
      const existing = await User.findOne({ userTag: generatedTag });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }
    if (!isUnique) {
      const cleanFirst = data.firstName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'user';
      const fallbackSuffix = Math.random().toString(36).substring(2, 6).toLowerCase();
      generatedTag = `$${cleanFirst}-${fallbackSuffix}`;
    }

    // 5. Generate unique wallet QR data using this tag!
    const qrCodeData = generatedTag;

    // 6. Create user with activeDeviceId bound upon registration
    const deviceIdNorm = data.deviceId?.trim();
    const newUser = await User.create({
      firstName: data.firstName.trim(),
      middleName: data.middleName?.trim() || undefined,
      lastName: data.lastName.trim(),
      userTag: generatedTag,
      email: emailNorm,
      password: data.password,
      phoneNumber: data.phoneNumber.trim(),
      transactionPin: data.transactionPin.trim(),
      qrCodeData,
      walletBalance: 0.00, // Initial balance set to 0.00 for live accounts
      activeDeviceId: deviceIdNorm || undefined,
    });

    if (deviceIdNorm) {
      // 1 Device = 1 Account: Unbind this deviceId from any previous accounts
      await User.updateMany(
        { activeDeviceId: deviceIdNorm, _id: { $ne: newUser._id } },
        { $set: { activeDeviceId: null } }
      );
    }

    const token = generateToken(newUser._id.toString());

    return {
      token,
      user: {
        id: newUser._id.toString(),
        firstName: newUser.firstName,
        middleName: newUser.middleName,
        lastName: newUser.lastName,
        userTag: newUser.userTag,
        fullName: newUser.fullName,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        walletBalance: newUser.walletBalance,
        pendingCashoutBalance: newUser.pendingCashoutBalance || 0,
        qrCodeData: newUser.qrCodeData,
        role: newUser.role,
        createdAt: newUser.createdAt,
        hasPin: !!newUser.transactionPin,
        profileImage: newUser.profileImage,
        savedCard: newUser.toObject({ getters: true }).savedCard,
      },
    };
  }

  static async login(data: LoginDTO): Promise<AuthResponse> {
    const input = data.email.toLowerCase().trim();
    const cleanTag = input.replace(/^[\s$_]+/, '');

    const user = await User.findOne({
      $or: [
        { email: input },
        { userTag: input },
        { userTag: `$${cleanTag}` },
        { userTag: `_${cleanTag}` },
        { userTag: cleanTag },
        { phoneNumber: input },
      ]
    }).select('+password +transactionPin');

    if (!user) {
      throw new CustomError('Invalid credentials. Please check your email/tag and password.', 401);
    }

    const isMatch = await user.comparePassword(data.password);
    if (!isMatch) {
      throw new CustomError('Invalid credentials. Please check your email/tag and password.', 401);
    }

    if (user.isFrozen) {
      const reasonText = user.freezeReason ? `\n\nReason: ${user.freezeReason}` : '';
      throw new CustomError(`Your account has been frozen by Administrator.${reasonText}\n\nPlease contact Support for assistance.`, 403);
    }

    const deviceId = data.deviceId?.trim();

    // 1 Device = 1 Account Security Guard:
    // Check if this device is NOT currently bound to this user
    const isDeviceAlreadyBoundToUser = deviceId && user.activeDeviceId === deviceId;

    if (deviceId && !isDeviceAlreadyBoundToUser) {
      // Trigger Email OTP Verification for New Device Sign-In / Account Switching
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const tempToken = crypto.randomBytes(32).toString('hex');

      user.newDeviceOtp = {
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 mins
        tempToken,
        deviceId,
      };
      await user.save();

      // Send OTP code to user's registered email
      try {
        await EmailService.sendNewDeviceOtpEmail(user.email, code);
      } catch (err) {
        console.error('Failed to send new device OTP email:', err);
      }

      return {
        requiresDeviceVerification: true,
        tempToken,
        message: 'Device verification required. A 6-digit verification code has been sent to your email.',
      };
    }

    // Same device login: Bind activeDeviceId & activeSessionToken
    const newSessionToken = crypto.randomBytes(32).toString('hex');
    if (deviceId) {
      // Unbind this device from any other user accounts so 1 device = 1 account at a time
      await User.updateMany(
        { activeDeviceId: deviceId, _id: { $ne: user._id } },
        { $set: { activeDeviceId: null } }
      );
      user.activeDeviceId = deviceId;
    }
    user.activeSessionToken = newSessionToken;
    user.newDeviceOtp = undefined;
    await user.save();

    const token = generateToken(user._id.toString(), newSessionToken);

    return {
      token,
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        userTag: user.userTag,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        walletBalance: user.walletBalance,
        pendingCashoutBalance: user.pendingCashoutBalance || 0,
        qrCodeData: user.qrCodeData,
        role: user.role,
        createdAt: user.createdAt,
        hasPin: !!user.transactionPin,
        profileImage: user.profileImage,
        savedCard: user.toObject({ getters: true }).savedCard,
      },
    };
  }

  static async verifyNewDevice(tempToken: string, otpCode: string, deviceId?: string): Promise<AuthResponse> {
    const user = await User.findOne({ 'newDeviceOtp.tempToken': tempToken }).select('+transactionPin');
    if (!user || !user.newDeviceOtp || !user.newDeviceOtp.code) {
      throw new CustomError('Invalid or expired device verification session.', 400);
    }

    if (user.newDeviceOtp.expiresAt && user.newDeviceOtp.expiresAt.getTime() < Date.now()) {
      throw new CustomError('Verification code has expired. Please request a new code.', 400);
    }

    if (user.newDeviceOtp.code.trim() !== otpCode.trim()) {
      throw new CustomError('Invalid verification code. Please check your email and try again.', 400);
    }

    // OTP Verified! Bind new device exclusively to this user and invalidate all previous device sessions!
    const boundDeviceId = deviceId || user.newDeviceOtp.deviceId;
    const newSessionToken = crypto.randomBytes(32).toString('hex');

    if (boundDeviceId) {
      // 1 Device = 1 Account: Unlink this deviceId from all other accounts
      await User.updateMany(
        { activeDeviceId: boundDeviceId, _id: { $ne: user._id } },
        { $set: { activeDeviceId: null } }
      );
      user.activeDeviceId = boundDeviceId;
    }

    user.activeSessionToken = newSessionToken;
    user.newDeviceOtp = undefined;
    await user.save();

    const token = generateToken(user._id.toString(), newSessionToken);

    return {
      token,
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        userTag: user.userTag,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        walletBalance: user.walletBalance,
        pendingCashoutBalance: user.pendingCashoutBalance || 0,
        qrCodeData: user.qrCodeData,
        role: user.role,
        createdAt: user.createdAt,
        hasPin: !!user.transactionPin,
        profileImage: user.profileImage,
        savedCard: user.toObject({ getters: true }).savedCard,
      },
    };
  }

  static async resendNewDeviceOtp(tempToken: string): Promise<void> {
    const user = await User.findOne({ 'newDeviceOtp.tempToken': tempToken });
    if (!user || !user.newDeviceOtp) {
      throw new CustomError('Invalid or expired verification session.', 400);
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.newDeviceOtp.code = code;
    user.newDeviceOtp.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await EmailService.sendNewDeviceOtpEmail(user.email, code);
  }

  static async sendForgotPasswordOtp(email: string): Promise<void> {
    const emailNorm = email.toLowerCase().trim();

    // 1. Check if user exists
    const user = await User.findOne({ email: emailNorm });
    if (!user) {
      throw new CustomError('No account found with this email address', 404);
    }

    // 2. Generate 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Save to OTP collection
    await Otp.findOneAndUpdate(
      { email: emailNorm },
      { code, createdAt: new Date() },
      { upsert: true, new: true }
    );

    // 4. Send email
    try {
      await EmailService.sendForgotPasswordEmail(emailNorm, code);
    } catch (err: any) {
      console.error('SMTP Delivery error:', err);
      throw new CustomError(`Failed to send verification email: ${err.message}`, 500);
    }
  }

  static async resetPassword(email: string, otpCode: string, newPassword: string): Promise<void> {
    const emailNorm = email.toLowerCase().trim();

    // 1. Verify OTP code
    const otpRecord = await Otp.findOne({ email: emailNorm });
    if (!otpRecord || otpRecord.code !== otpCode.trim()) {
      throw new CustomError('Invalid or expired verification code', 400);
    }

    // 2. Find user
    const user = await User.findOne({ email: emailNorm });
    if (!user) {
      throw new CustomError('User not found', 404);
    }

    // 3. Update password
    user.password = newPassword;
    await user.save();

    // 4. Delete OTP record
    await Otp.deleteOne({ email: emailNorm });
  }

  static async setPin(userId: string, pin: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new CustomError('User not found', 404);
    }
    user.transactionPin = pin;
    await user.save();
  }

  static async verifyPin(userId: string, pin: string | number): Promise<boolean> {
    const user = await User.findById(userId).select('+transactionPin');
    if (!user || !user.transactionPin) {
      return false;
    }
    const cleanPin = String(pin).trim();
    return user.comparePin(cleanPin);
  }

  static async getMe(userId: string) {
    const user = await User.findById(userId).select('+transactionPin');
    if (!user) {
      throw new CustomError('User not found', 404);
    }
    return {
      id: user._id.toString(),
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
      userTag: user.userTag,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      walletBalance: user.walletBalance,
      pendingCashoutBalance: user.pendingCashoutBalance || 0,
      qrCodeData: user.qrCodeData,
      role: user.role,
      createdAt: user.createdAt,
      hasPin: !!user.transactionPin,
      profileImage: user.profileImage,
      savedCard: user.toObject({ getters: true }).savedCard,
    };
  }

  static async updateProfileImage(userId: string, profileImage: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new CustomError('User not found', 404);
    }
    user.profileImage = profileImage;
    await user.save();
  }

  static async sendUpdateOtp(userId: string, type?: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new CustomError('User not found', 404);
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.findOneAndUpdate(
      { email: user.email.toLowerCase().trim() },
      { code, createdAt: new Date() },
      { upsert: true, new: true }
    );

    try {
      if (type === 'pin') {
        await EmailService.sendPinChangeOtpEmail(user.email, code);
      } else if (type === 'password') {
        await EmailService.sendPasswordChangeOtpEmail(user.email, code);
      } else {
        await EmailService.sendPinChangeOtpEmail(user.email, code);
      }
    } catch (err: any) {
      console.error('SMTP Delivery error:', err);
      throw new CustomError(`Failed to send verification email: ${err.message}`, 500);
    }
  }

  static async changePassword(userId: string, otpCode: string, newPassword: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new CustomError('User not found', 404);
    }

    const emailNorm = user.email.toLowerCase().trim();
    const otpRecord = await Otp.findOne({ email: emailNorm });
    if (!otpRecord || otpRecord.code !== otpCode.trim()) {
      throw new CustomError('Invalid or expired verification code', 400);
    }

    user.password = newPassword;
    await user.save();

    await Otp.deleteOne({ email: emailNorm });
  }

  static async changePin(userId: string, otpCode: string, newPin: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new CustomError('User not found', 404);
    }

    const emailNorm = user.email.toLowerCase().trim();
    const otpRecord = await Otp.findOne({ email: emailNorm });
    if (!otpRecord || otpRecord.code !== otpCode.trim()) {
      throw new CustomError('Invalid or expired verification code', 400);
    }

    user.transactionPin = newPin;
    await user.save();

    await Otp.deleteOne({ email: emailNorm });
  }
}
