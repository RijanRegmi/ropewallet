import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/user.model.js';
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
  static async register(data: RegisterDTO): Promise<AuthResponse> {
    const existingUser = await User.findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
      throw new CustomError('Email already registered', 400);
    }

    // Generate unique wallet QR data
    const qrCodeData = `wallet-uid-${crypto.randomUUID()}`;

    const newUser = await User.create({
      fullName: data.fullName,
      email: data.email,
      password: data.password,
      qrCodeData,
      walletBalance: 1000.00, // Pre-fund with $1000 for simulation / testing
    });

    const token = generateToken(newUser._id.toString());

    return {
      token,
      user: {
        id: newUser._id.toString(),
        fullName: newUser.fullName,
        email: newUser.email,
        walletBalance: newUser.walletBalance,
        qrCodeData: newUser.qrCodeData,
        createdAt: newUser.createdAt,
      },
    };
  }

  static async login(data: LoginDTO): Promise<AuthResponse> {
    // Select password field explicitly since select: false
    const user = await User.findOne({ email: data.email.toLowerCase() }).select('+password');
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
        fullName: user.fullName,
        email: user.email,
        walletBalance: user.walletBalance,
        qrCodeData: user.qrCodeData,
        createdAt: user.createdAt,
      },
    };
  }

  static async getMe(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new CustomError('User not found', 404);
    }
    return {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      walletBalance: user.walletBalance,
      qrCodeData: user.qrCodeData,
      createdAt: user.createdAt,
    };
  }
}
