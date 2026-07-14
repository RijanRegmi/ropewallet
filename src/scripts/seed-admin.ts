/**
 * Admin Seed Script
 * Run: npx ts-node --esm src/scripts/seed-admin.ts
 *
 * Creates the default superadmin account if it doesn't exist.
 */
import { connectDB } from '../config/db.js';
import { Admin } from '../models/admin.model.js';
import dotenv from 'dotenv';

dotenv.config();

async function seedAdmin() {
  try {
    await connectDB();

    const existing = await Admin.findOne({ email: 'admin@ropewallet.com' });
    if (existing) {
      console.log('✅ Admin account already exists:', existing.email);
      process.exit(0);
    }

    const admin = await Admin.create({
      email: 'admin@ropewallet.com',
      password: 'RopeAdmin@2024',
      fullName: 'RopeWallet Admin',
      role: 'superadmin',
      isActive: true,
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
