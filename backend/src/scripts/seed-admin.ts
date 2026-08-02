/**
 * Admin Seed Script
 * Run: npx ts-node --esm src/scripts/seed-admin.ts
 *
 * Creates the default superadmin account if it doesn't exist.
 */
import { connectDB } from '../config/db.js';
import { User } from '../models/user.model.js';
import dotenv from 'dotenv';

dotenv.config();

async function seedAdmin() {
  try {
    await connectDB();

    const existing = await User.findOne({ email: 'admin@ropewallet.com' });
    if (existing) {
      console.log('✅ Admin account already exists:', existing.email);
      process.exit(0);
    }

    const admin = await User.create({
      firstName: 'RopeWallet',
      lastName: 'Admin',
      userTag: 'admin',
      email: 'admin@ropewallet.com',
      password: 'RopeAdmin@2024',
      phoneNumber: '0000000000',
      qrCodeData: 'admin-qr',
      role: 'superadmin',
      isFrozen: false,
    });

    console.log('✅ Superadmin created successfully!');
    console.log('   Email:', admin.email);
    console.log('   Password: RopeAdmin@2024');
    console.log('   Role:', admin.role);
    console.log('\n⚠️  IMPORTANT: Change this password immediately after first login!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  }
}

seedAdmin();
