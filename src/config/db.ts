import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let isConnected = false;

export const connectDB = async (): Promise<void> => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    return;
  }
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/wallet';
    await mongoose.connect(mongoUri);
    isConnected = true;
    console.log('MongoDB Connected successfully.');

    // Migration: Convert legacy 'admin' to 'host' and 'user' to 'customer'
    try {
      const db = mongoose.connection.db;
      if (db) {
        const usersCollection = db.collection('users');
        await usersCollection.updateMany({ role: 'admin' }, { $set: { role: 'host' } });
        await usersCollection.updateMany({ role: 'user' }, { $set: { role: 'customer' } });
        await usersCollection.updateMany({ role: { $exists: false } }, { $set: { role: 'customer' } });
      }
    } catch (migErr) {
      console.warn('Role migration notice:', migErr);
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};
