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

const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
};

export class AuthService {
  static async checkUsernameAvailability(username: string): Promise<boolean> {
    const existing = await User.findOne({ username: username.toLowerCase().trim() });
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

    // 4. Auto-generate Chime-style unique tag ($firstName123)
    let generatedTag = '';
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 100) {
      const randomNum = Math.floor(100 + Math.random() * 900); // 3 digits
      const cleanFirst = data.firstName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      generatedTag = `$${cleanFirst}${randomNum}`;
      const existing = await User.findOne({ username: generatedTag });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }
    if (!isUnique) {
      generatedTag = `$${data.firstName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // 5. Generate unique wallet QR data using this tag!
    const qrCodeData = generatedTag;

    // 6. Create user
    const newUser = await User.create({
      firstName: data.firstName.trim(),
      middleName: data.middleName?.trim() || undefined,
      lastName: data.lastName.trim(),
      username: generatedTag,
      email: emailNorm,
      password: data.password,
      phoneNumber: data.phoneNumber.trim(),
      transactionPin: data.transactionPin.trim(),
      qrCodeData,
      walletBalance: 1000.00, // Pre-fund with $1000 for simulation / testing
    });

    const token = generateToken(newUser._id.toString());

    return {
      token,
      user: {
        id: newUser._id.toString(),
        firstName: newUser.firstName,
        middleName: newUser.middleName,
        lastName: newUser.lastName,
        username: newUser.username,
        fullName: newUser.fullName,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        walletBalance: newUser.walletBalance,
        qrCodeData: newUser.qrCodeData,
        createdAt: newUser.createdAt,
        hasPin: !!newUser.transactionPin,
        profileImage: newUser.profileImage,
      },
    };
  }

  static async login(data: LoginDTO): Promise<AuthResponse> {
    const user = await User.findOne({ email: data.email.toLowerCase().trim() }).select('+password +transactionPin');
    if (!user) {
      throw new CustomError('Invalid email or password', 401);
    }

    const isMatch = await user.comparePassword(data.password);
    if (!isMatch) {
      throw new CustomError('Invalid email or password', 401);
    }

    const token = generateToken(user._id.toString());

    return {
      token,
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        walletBalance: user.walletBalance,
        qrCodeData: user.qrCodeData,
        createdAt: user.createdAt,
        hasPin: !!user.transactionPin,
        profileImage: user.profileImage,
      },
    };
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

  static async verifyPin(userId: string, pin: string): Promise<boolean> {
    const user = await User.findById(userId).select('+transactionPin');
    if (!user) {
      throw new CustomError('User not found', 404);
    }
    if (!user.transactionPin) {
      return false;
    }
    return user.comparePin(pin);
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
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      walletBalance: user.walletBalance,
      qrCodeData: user.qrCodeData,
      createdAt: user.createdAt,
      hasPin: !!user.transactionPin,
      profileImage: user.profileImage,
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

  static async sendUpdateOtp(userId: string): Promise<void> {
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
      await EmailService.sendOtpEmail(user.email, code);
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
