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
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/wallet';
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging 30s
    });
    isConnected = true;
    console.log('MongoDB Connected successfully.');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};
