import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

let isConnected = false;

export const connectDB = async (): Promise<void> => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    return;
  }

  const mongoUri = process.env.MONGODB_URI || (process.env.VERCEL ? '' : 'mongodb://localhost:27017/wallet');

  if (!mongoUri) {
    const msg = 'MONGODB_URI is not defined. Please add MONGODB_URI in Vercel Dashboard -> Settings -> Environment Variables.';
    console.error(`[DB Error] ${msg}`);
    throw new Error(msg);
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // 5s timeout
    });
    isConnected = true;
    console.log('MongoDB Connected successfully.');
  } catch (error: any) {
    console.error('MongoDB connection error:', error);
    throw new Error(`MongoDB connection failed: ${error.message || 'Invalid URI or Network IP Blocked'}`);
  }
};
