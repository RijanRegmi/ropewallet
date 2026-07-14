import { connectDB } from '../config/db.js';
import { User } from '../models/user.model.js';
import dotenv from 'dotenv';

dotenv.config();

async function test() {
  await connectDB();
  const users = await User.find().select('-savedCard');
  console.log('Users in DB:', JSON.stringify(users, null, 2));
  process.exit(0);
}

test();
