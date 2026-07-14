import { Schema, model } from 'mongoose';
import bcryptjs from 'bcryptjs';
import { IUser } from '../types/user.interface.js';
import { encrypt, decrypt } from '../utils/crypto.js';

const userSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    middleName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    userTag: {
      type: String,
      required: [true, 'User tag is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    fullName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Don't return password by default
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
    },
    transactionPin: {
      type: String,
      select: false, // Don't return PIN by default for safety
    },
    profileImage: {
      type: String,
      default: '',
    },
    walletBalance: {
      type: Number,
      default: 0.00,
    },
    qrCodeData: {
      type: String,
      unique: true,
      required: true,
    },
    savedCard: {
      cardholderName: { type: String, default: '' },
      cardNumber: {
        type: String,
        default: '',
        get: decrypt,
        set: encrypt,
      },
      expMonth: { type: String, default: '' },
      expYear: { type: String, default: '' },
      cvc: {
        type: String,
        default: '',
        get: decrypt,
        set: encrypt,
      },
      zipCode: { type: String, default: '' },
      country: { type: String, default: '' },
      cardBrand: { type: String, default: '' },
      last4: { type: String, default: '' },
      addressLine1: {
        type: String,
        default: '',
        get: decrypt,
        set: encrypt,
      },
      differentInvoiceName: { type: Boolean, default: false },
      invoiceName: { type: String, default: '' },
      taxId: {
        type: String,
        default: '',
        get: decrypt,
        set: encrypt,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// Auto-compile fullName before validation/save
userSchema.pre('save', function (next) {
  if (this.isModified('firstName') || this.isModified('lastName') || this.isModified('middleName')) {
    const middle = this.middleName ? ` ${this.middleName}` : '';
    this.fullName = `${this.firstName}${middle} ${this.lastName}`;
  }
  next();
});

// Hash password before saving if it has been modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password!, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Hash PIN before saving if it has been modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('transactionPin') || !this.transactionPin) {
    return next();
  }
  try {
    const salt = await bcryptjs.genSalt(10);
    this.transactionPin = await bcryptjs.hash(this.transactionPin, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare candidate password with stored password
userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcryptjs.compare(password, this.password);
};

// Method to compare transaction PIN
userSchema.methods.comparePin = async function (pin: string): Promise<boolean> {
  if (!this.transactionPin) return false;
  return bcryptjs.compare(pin, this.transactionPin);
};

export const User = model<IUser>('User', userSchema);
