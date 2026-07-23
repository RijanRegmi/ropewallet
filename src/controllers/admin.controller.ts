import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Admin } from '../models/admin.model.js';
import { User } from '../models/user.model.js';
import { Transaction } from '../models/transaction.model.js';
import { P2PAccount } from '../models/p2p_account.model.js';
import { CustomError } from '../middlewares/error.middleware.js';
import crypto from 'crypto';
import bcryptjs from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforwalletapp12345';

export class AdminController {

  // ─── Authentication ─────────────────────────────────────────────
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ success: false, error: 'Email and password are required' });
        return;
      }

      const admin = await User.findOne({ email, role: { $in: ['admin', 'superadmin'] } }).select('+password');
      if (!admin || admin.isFrozen) {
        res.status(401).json({ success: false, error: 'Invalid credentials' });
        return;
      }

      const isMatch = await admin.comparePassword(password);
      if (!isMatch) {
        res.status(401).json({ success: false, error: 'Invalid credentials' });
        return;
      }

      const token = jwt.sign(
        { id: admin._id, role: admin.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Set httpOnly cookie for web portal + return token for API
      res.cookie('admin_token', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      res.json({ success: true, token, admin: { id: admin._id, email: admin.email, fullName: admin.fullName, role: admin.role } });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    res.clearCookie('admin_token');
    res.redirect('/admin');
  }

  static async getCurrentAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = (req as any).admin.id;
      const admin = await User.findById(adminId);
      if (!admin) {
        res.status(404).json({ success: false, error: 'Admin not found' });
        return;
      }
      res.json({ success: true, admin: { id: admin._id, email: admin.email, fullName: admin.fullName, role: admin.role } });
    } catch (error) {
      next(error);
    }
  }

  // ─── Dashboard Stats ───────────────────────────────────────────
  static async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const creatorRole = (req as any).admin?.role;
      if (creatorRole !== 'superadmin') {
        res.status(403).json({ success: false, error: 'Superadmin access required' });
        return;
      }

      const [
        totalUsers,
        frozenUsers,
        pendingDeposits,
        completedTransactions,
        revenueAgg,
        recentTransactions,
        monthlyRevenue,
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isFrozen: true }),
        Transaction.countDocuments({ status: 'pending', type: 'p2p_deposit' }),
        Transaction.countDocuments({ status: 'completed' }),
        Transaction.aggregate([
          { $match: { status: 'completed' } },
          {
            $group: {
              _id: null,
              totalCashFlow: { $sum: '$amount' },
              totalPlatformFee: { $sum: '$platformFee' },
              totalStripeFee: { $sum: '$stripeFee' },
              totalNetProfit: { $sum: '$netProfit' },
              totalFees: { $sum: '$fee' },
            },
          },
        ]),
        Transaction.find()
          .sort({ createdAt: -1 })
          .limit(20)
          .populate('receiver', 'fullName email userTag')
          .populate('sender', 'fullName email userTag'),
        // Monthly revenue for chart (last 12 months)
        Transaction.aggregate([
          { $match: { status: 'completed', createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
              revenue: { $sum: '$platformFee' },
              volume: { $sum: '$amount' },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

      const revenue = revenueAgg[0] || { totalCashFlow: 0, totalPlatformFee: 0, totalStripeFee: 0, totalNetProfit: 0, totalFees: 0 };

      res.json({
        success: true,
        data: {
          totalUsers,
          frozenUsers,
          activeUsers: totalUsers - frozenUsers,
          pendingDeposits,
          completedTransactions,
          totalCashFlow: revenue.totalCashFlow,
          totalPlatformFee: revenue.totalPlatformFee,
          totalStripeFee: revenue.totalStripeFee,
          totalNetProfit: revenue.totalNetProfit,
          recentTransactions,
          monthlyRevenue,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // ─── User Management ───────────────────────────────────────────
  static async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const search = (req.query.search as string) || '';
      const sortBy = (req.query.sortBy as string) || 'createdAt';
      const sortOrder = (req.query.sortOrder as string) === 'asc' ? 1 : -1;

      const adminObj = (req as any).admin || (req as any).user;
      const creatorId = adminObj?.id;
      let creatorRole = adminObj?.role;

      if (!creatorRole && creatorId) {
        const caller = await User.findById(creatorId).select('role');
        if (caller) {
          creatorRole = caller.role;
        }
      }

      // Filter for user accounts
      const userFilter: any = {};

      // If caller is NOT a superadmin (i.e. regular admin), strictly scope to their created users
      if (creatorRole === 'admin') {
        userFilter.role = 'user';
        if (creatorId) {
          const objId = mongoose.Types.ObjectId.isValid(creatorId) ? new mongoose.Types.ObjectId(creatorId) : creatorId;
          userFilter.createdBy = { $in: [creatorId, objId] };
        }
      }

      if (search) {
        const searchConditions = [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { userTag: { $regex: search, $options: 'i' } },
          { phoneNumber: { $regex: search, $options: 'i' } },
        ];

        if (creatorRole === 'admin') {
          userFilter.$and = [
            { role: 'user' },
            { createdBy: { $in: [creatorId, mongoose.Types.ObjectId.isValid(creatorId) ? new mongoose.Types.ObjectId(creatorId) : creatorId] } },
            { $or: searchConditions },
          ];
          delete userFilter.role;
          delete userFilter.createdBy;
        } else {
          userFilter.$or = searchConditions;
        }
      }

      // Filter for admins list (only superadmin sees admins list)
      const adminFilter: any = creatorRole === 'superadmin'
        ? { role: { $in: ['admin', 'superadmin'] } }
        : { _id: null };

      if (search && creatorRole === 'superadmin') {
        adminFilter.$or = [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { userTag: { $regex: search, $options: 'i' } },
          { phoneNumber: { $regex: search, $options: 'i' } },
        ];
      }

      const [admins, users, totalUsers] = await Promise.all([
        User.find(adminFilter).sort({ createdAt: -1 }).select('-savedCard'),
        User.find(userFilter)
          .sort({ [sortBy]: sortOrder } as any)
          .skip((page - 1) * limit)
          .limit(limit)
          .select('-savedCard'),
        User.countDocuments(userFilter),
      ]);

      res.json({
        success: true,
        data: {
          admins,
          users,
          pagination: {
            page,
            limit,
            total: totalUsers,
            totalPages: Math.ceil(totalUsers / limit),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const creatorId = (req as any).admin?.id;
      const creatorRole = (req as any).admin?.role;

      const user = await User.findById(req.params.id).select('-savedCard.cardNumber -savedCard.cvc');
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      if (creatorRole !== 'superadmin' && (!user.createdBy || user.createdBy.toString() !== creatorId)) {
        res.status(403).json({ success: false, error: 'Not authorized to access this user details' });
        return;
      }

      // Get user's recent transactions
      const transactions = await Transaction.find({
        $or: [{ sender: user._id }, { receiver: user._id }],
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('receiver', 'fullName userTag')
        .populate('sender', 'fullName userTag');

      res.json({ success: true, data: { user, transactions } });
    } catch (error) {
      next(error);
    }
  }

  static async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { firstName, lastName, middleName, email, phoneNumber, userTag, password, role } = req.body;
      const creatorId = (req as any).admin?.id;
      const creatorRole = (req as any).admin?.role || 'admin';

      if (!firstName || !lastName || !email || !phoneNumber || !password) {
        res.status(400).json({ success: false, error: 'First name, last name, email, phone number, and password are required' });
        return;
      }

      const targetRole = role || 'user';

      if (!['user', 'admin', 'superadmin'].includes(targetRole)) {
        res.status(400).json({ success: false, error: 'Invalid user role specified' });
        return;
      }

      // Admins can ONLY create 'user' role accounts. Only Super Admins can create 'admin' or 'superadmin' accounts.
      if (creatorRole !== 'superadmin' && targetRole !== 'user') {
        res.status(403).json({ success: false, error: 'Admins can only create regular user accounts' });
        return;
      }

      const emailNorm = email.toLowerCase().trim();
      const phoneNorm = phoneNumber.trim();

      // Check existing email or phone
      const existingEmailOrPhone = await User.findOne({ $or: [{ email: emailNorm }, { phoneNumber: phoneNorm }] });
      if (existingEmailOrPhone) {
        res.status(400).json({ success: false, error: 'User with this email or phone number already exists' });
        return;
      }

      // Generate or validate userTag
      let finalTag = userTag ? userTag.trim().toLowerCase() : '';
      if (finalTag) {
        if (!finalTag.startsWith('$')) {
          finalTag = `$${finalTag}`;
        }
        const existingTag = await User.findOne({ userTag: finalTag });
        if (existingTag) {
          res.status(400).json({ success: false, error: 'User tag already taken' });
          return;
        }
      } else {
        // Auto-generate tag
        let isUnique = false;
        let attempts = 0;
        const cleanFirst = firstName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        while (!isUnique && attempts < 100) {
          const randomNum = Math.floor(100 + Math.random() * 900);
          finalTag = `$${cleanFirst}${randomNum}`;
          const existing = await User.findOne({ userTag: finalTag });
          if (!existing) isUnique = true;
          attempts++;
        }
      }

      const qrCodeData = finalTag;

      const newUser = await User.create({
        firstName: firstName.trim(),
        middleName: middleName?.trim() || undefined,
        lastName: lastName.trim(),
        email: emailNorm,
        phoneNumber: phoneNorm,
        userTag: finalTag,
        password,
        role: targetRole,
        createdBy: creatorId,
        qrCodeData,
      });

      res.status(201).json({
        success: true,
        message: `${targetRole.toUpperCase()} account created successfully`,
        data: {
          id: newUser._id.toString(),
          fullName: newUser.fullName,
          email: newUser.email,
          userTag: newUser.userTag,
          role: newUser.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async editUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { firstName, lastName, middleName, email, phoneNumber, walletBalance, createdAt } = req.body;
      const creatorId = (req as any).admin?.id;
      const creatorRole = (req as any).admin?.role;

      const user = await User.findById(req.params.id);
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      if (creatorRole !== 'superadmin' && (!user.createdBy || user.createdBy.toString() !== creatorId)) {
        res.status(403).json({ success: false, error: 'Not authorized to edit this user' });
        return;
      }

      if (firstName !== undefined) user.firstName = firstName;
      if (lastName !== undefined) user.lastName = lastName;
      if (middleName !== undefined) user.middleName = middleName;
      if (email !== undefined) user.email = email;
      if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
      if (walletBalance !== undefined) user.walletBalance = walletBalance;
      if (createdAt !== undefined) user.createdAt = new Date(createdAt);

      await user.save();

      res.json({ success: true, data: { user } });
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const creatorId = (req as any).admin?.id;
      const creatorRole = (req as any).admin?.role;

      if (creatorRole !== 'superadmin') {
        res.status(403).json({ success: false, error: 'Only Super Admins can delete accounts' });
        return;
      }

      if (req.params.id === creatorId) {
        res.status(400).json({ success: false, error: 'Super Admin cannot delete their own logged-in account' });
        return;
      }

      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }
      res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async freezeUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = (req as any).admin.id;
      const creatorRole = (req as any).admin.role;

      const user = await User.findById(req.params.id);
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      if (creatorRole !== 'superadmin' && (!user.createdBy || user.createdBy.toString() !== adminId)) {
        res.status(403).json({ success: false, error: 'Not authorized to freeze this account' });
        return;
      }

      user.isFrozen = true;
      user.frozenAt = new Date();
      user.frozenBy = adminId;
      await user.save({ validateBeforeSave: false });

      res.json({ success: true, message: `Account for ${user.fullName} has been frozen` });
    } catch (error) {
      next(error);
    }
  }

  static async unfreezeUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = (req as any).admin.id;
      const creatorRole = (req as any).admin.role;

      const user = await User.findById(req.params.id);
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      if (creatorRole !== 'superadmin' && (!user.createdBy || user.createdBy.toString() !== adminId)) {
        res.status(403).json({ success: false, error: 'Not authorized to unfreeze this account' });
        return;
      }

      user.isFrozen = false;
      user.frozenAt = undefined;
      user.frozenBy = undefined;
      await user.save({ validateBeforeSave: false });

      res.json({ success: true, message: `Account for ${user.fullName} has been unfrozen` });
    } catch (error) {
      next(error);
    }
  }

  static async updateUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { role } = req.body;
      const creatorId = (req as any).admin?.id;
      const creatorRole = (req as any).admin?.role;

      if (creatorRole !== 'superadmin') {
        res.status(403).json({ success: false, error: 'Only Super Admins can change user roles' });
        return;
      }

      if (!role || !['user', 'admin', 'superadmin'].includes(role)) {
        res.status(400).json({ success: false, error: 'Invalid role. Must be user, admin or superadmin' });
        return;
      }

      const user = await User.findById(req.params.id);
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      if (user._id.toString() === creatorId) {
        res.status(400).json({ success: false, error: 'You cannot change your own superadmin role' });
        return;
      }

      user.role = role;
      await user.save({ validateBeforeSave: false });

      res.json({ success: true, message: `User role updated to ${role}`, data: { user } });
    } catch (error) {
      next(error);
    }
  }

  // ─── Pending Deposit Approval ──────────────────────────────────
  static async listPendingDeposits(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 25;
      const status = (req.query.status as string) || 'pending';

      const filter: any = { type: 'p2p_deposit' };
      if (status !== 'all') filter.status = status;

      const [deposits, total] = await Promise.all([
        Transaction.find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate('receiver', 'fullName email userTag'),
        Transaction.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: {
          deposits,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async approveDeposit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = (req as any).admin.id;
      const txn = await Transaction.findById(req.params.id);

      if (!txn) {
        res.status(404).json({ success: false, error: 'Transaction not found' });
        return;
      }
      if (txn.status !== 'pending') {
        res.status(400).json({ success: false, error: 'This transaction is not pending' });
        return;
      }

      // Calculate fees
      const platformFee = txn.amount * 0.15;
      const netAmount = txn.amount - platformFee;

      // Credit user wallet
      const user = await User.findById(txn.receiver);
      if (!user) {
        res.status(404).json({ success: false, error: 'Recipient user not found' });
        return;
      }

      user.walletBalance += netAmount;
      await user.save({ validateBeforeSave: false });

      // Update transaction
      txn.status = 'completed';
      txn.fee = platformFee;
      txn.platformFee = platformFee;
      txn.netAmount = netAmount;
      txn.netProfit = platformFee; // no stripe fee for manual P2P
      txn.approvedBy = adminId as any;
      txn.approvedAt = new Date();
      await txn.save();

      res.json({
        success: true,
        message: `Approved $${txn.amount} deposit for ${user.fullName}. $${netAmount.toFixed(2)} credited to wallet.`,
        data: { transaction: txn },
      });
    } catch (error) {
      next(error);
    }
  }

  static async declineDeposit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reason } = req.body;
      const txn = await Transaction.findById(req.params.id);

      if (!txn) {
        res.status(404).json({ success: false, error: 'Transaction not found' });
        return;
      }
      if (txn.status !== 'pending') {
        res.status(400).json({ success: false, error: 'This transaction is not pending' });
        return;
      }

      txn.status = 'declined';
      txn.declinedReason = reason || 'Declined by admin';
      await txn.save();

      res.json({ success: true, message: 'Deposit declined', data: { transaction: txn } });
    } catch (error) {
      next(error);
    }
  }

  // ─── P2P Account Management ────────────────────────────────────
  static async listP2PAccounts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const accounts = await P2PAccount.find().sort({ platform: 1 });
      res.json({ success: true, data: { accounts } });
    } catch (error) {
      next(error);
    }
  }

  static async addP2PAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { platform, handle, displayName, email, appPassword, directPayUrl, isAutoVerifyEnabled } = req.body;
      if (!platform || !handle || !displayName) {
        res.status(400).json({ success: false, error: 'Platform, handle, and display name are required' });
        return;
      }

      const account = await P2PAccount.create({ 
        platform, 
        handle, 
        displayName,
        email: email || undefined,
        appPassword: appPassword || undefined,
        directPayUrl: directPayUrl || undefined,
        isAutoVerifyEnabled: isAutoVerifyEnabled === true
      });
      res.status(201).json({ success: true, data: { account } });
    } catch (error) {
      next(error);
    }
  }

  static async editP2PAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { handle, displayName, isActive, email, appPassword, directPayUrl, isAutoVerifyEnabled } = req.body;
      const account = await P2PAccount.findById(req.params.id);
      if (!account) {
        res.status(404).json({ success: false, error: 'P2P account not found' });
        return;
      }

      if (handle !== undefined) account.handle = handle;
      if (displayName !== undefined) account.displayName = displayName;
      if (isActive !== undefined) account.isActive = isActive;
      if (email !== undefined) account.email = email;
      if (appPassword !== undefined) account.appPassword = appPassword;
      if (directPayUrl !== undefined) account.directPayUrl = directPayUrl;
      if (isAutoVerifyEnabled !== undefined) account.isAutoVerifyEnabled = isAutoVerifyEnabled;
      await account.save();

      res.json({ success: true, data: { account } });
    } catch (error) {
      next(error);
    }
  }

  static async deleteP2PAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const account = await P2PAccount.findByIdAndDelete(req.params.id);
      if (!account) {
        res.status(404).json({ success: false, error: 'P2P account not found' });
        return;
      }
      res.json({ success: true, message: 'P2P account deleted' });
    } catch (error) {
      next(error);
    }
  }

  // ─── Transaction Export (CSV) ──────────────────────────────────
  static async exportTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate, type, status } = req.query;

      const filter: any = {};
      if (type) filter.type = type;
      if (status) filter.status = status;
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate as string);
        if (endDate) filter.createdAt.$lte = new Date(endDate as string);
      }

      const transactions = await Transaction.find(filter)
        .sort({ createdAt: -1 })
        .populate('receiver', 'fullName email userTag')
        .populate('sender', 'fullName email userTag');

      // Build CSV
      const headers = 'Date,Type,Status,Amount,Fee,Net Amount,Platform Fee,Stripe Fee,Net Profit,Payment Method,Sender,Receiver,Remarks\n';
      const rows = transactions.map((t: any) => {
        return [
          t.createdAt.toISOString(),
          t.type,
          t.status,
          t.amount,
          t.fee,
          t.netAmount,
          t.platformFee,
          t.stripeFee,
          t.netProfit,
          t.paymentMethod || '',
          t.sender?.fullName || 'External',
          t.receiver?.fullName || '',
          `"${(t.remarks || '').replace(/"/g, '""')}"`,
        ].join(',');
      }).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=ropewallet_transactions_${Date.now()}.csv`);
      res.send(headers + rows);
    } catch (error) {
      next(error);
    }
  }

  // ─── Admin Page Renderers (Server-Rendered HTML) ───────────────

  static async renderLoginPage(req: Request, res: Response): Promise<void> {
    // Check if already logged in
    if (req.cookies?.admin_token) {
      try {
        const decoded = jwt.verify(req.cookies.admin_token, JWT_SECRET) as any;
        const admin = await User.findOne({ _id: decoded.id, role: { $in: ['admin', 'superadmin'] } });
        if (admin && !admin.isFrozen) {
          res.redirect('/admin/dashboard');
          return;
        }
      } catch { /* token expired or user not found, show login */ }
    }

    res.send(AdminController.loginPageHTML());
  }

  static async renderDashboardPage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Fetch all data server-side
      const [
        totalUsers,
        frozenUsers,
        pendingDeposits,
        revenueAgg,
        recentTxns,
        monthlyRevenue,
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isFrozen: true }),
        Transaction.countDocuments({ status: 'pending', type: 'p2p_deposit' }),
        Transaction.aggregate([
          { $match: { status: 'completed' } },
          {
            $group: {
              _id: null,
              totalCashFlow: { $sum: '$amount' },
              totalPlatformFee: { $sum: '$platformFee' },
              totalStripeFee: { $sum: '$stripeFee' },
              totalNetProfit: { $sum: '$netProfit' },
            },
          },
        ]),
        Transaction.find().sort({ createdAt: -1 }).limit(15)
          .populate('receiver', 'fullName userTag')
          .populate('sender', 'fullName userTag'),
        Transaction.aggregate([
          { $match: { status: 'completed', createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
              revenue: { $sum: '$platformFee' },
              volume: { $sum: '$amount' },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

      const rev = revenueAgg[0] || { totalCashFlow: 0, totalPlatformFee: 0, totalStripeFee: 0, totalNetProfit: 0 };

      res.send(AdminController.dashboardPageHTML({
        totalUsers,
        frozenUsers,
        activeUsers: totalUsers - frozenUsers,
        pendingDeposits,
        ...rev,
        recentTxns: JSON.stringify(recentTxns),
        monthlyRevenue: JSON.stringify(monthlyRevenue),
      }));
    } catch (error) {
      next(error);
    }
  }

  static async renderUsersPage(req: Request, res: Response): Promise<void> {
    const adminId = (req as any).admin?.id || '';
    res.send(AdminController.usersPageHTML(adminId));
  }

  static async renderDepositsPage(req: Request, res: Response): Promise<void> {
    res.send(AdminController.depositsPageHTML());
  }

  static async renderP2PAccountsPage(req: Request, res: Response): Promise<void> {
    res.send(AdminController.p2pAccountsPageHTML());
  }

  // ═══════════════════════════════════════════════════════════════
  //  HTML TEMPLATES
  // ═══════════════════════════════════════════════════════════════

  private static adminShell(title: string, activeTab: string, content: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | RopeWallet Admin</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root {
      --bg: #0B0F1A;
      --surface: #111827;
      --surface-2: #1F2937;
      --surface-3: #374151;
      --border: #1F2937;
      --text: #F9FAFB;
      --text-secondary: #9CA3AF;
      --primary: #6366F1;
      --primary-hover: #818CF8;
      --success: #10B981;
      --warning: #F59E0B;
      --danger: #EF4444;
      --info: #3B82F6;
    }
    body {
      font-family: 'Inter', sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
    }

    /* Sidebar */
    .sidebar {
      width: 260px;
      background: var(--surface);
      border-right: 1px solid var(--border);
      padding: 24px 0;
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 0;
      bottom: 0;
      z-index: 100;
    }
    .sidebar-logo {
      padding: 0 24px 24px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 16px;
    }
    .sidebar-logo h1 {
      font-size: 20px;
      font-weight: 800;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .sidebar-logo span {
      font-size: 11px;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 24px;
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
      border-left: 3px solid transparent;
    }
    .nav-item:hover { color: var(--text); background: var(--surface-2); }
    .nav-item.active {
      color: var(--primary);
      background: rgba(99, 102, 241, 0.08);
      border-left-color: var(--primary);
    }
    .nav-item .icon { font-size: 18px; width: 24px; text-align: center; }
    .nav-badge {
      margin-left: auto;
      background: var(--danger);
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 10px;
    }
    .sidebar-footer {
      margin-top: auto;
      padding: 16px 24px;
      border-top: 1px solid var(--border);
    }

    /* Main Content */
    .main {
      margin-left: 260px;
      flex: 1;
      padding: 32px;
      min-height: 100vh;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
    }
    .page-header h2 {
      font-size: 24px;
      font-weight: 700;
    }
    .page-header p {
      font-size: 14px;
      color: var(--text-secondary);
      margin-top: 4px;
    }

    /* Cards */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }
    .stat-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.3);
    }
    .stat-card .label {
      font-size: 13px;
      color: var(--text-secondary);
      font-weight: 500;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .stat-card .value {
      font-size: 28px;
      font-weight: 800;
    }
    .stat-card .change {
      font-size: 12px;
      margin-top: 8px;
      color: var(--success);
    }
    .stat-card.success .value { color: var(--success); }
    .stat-card.warning .value { color: var(--warning); }
    .stat-card.danger .value { color: var(--danger); }
    .stat-card.info .value { color: var(--info); }

    /* Tables */
    .table-container {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      overflow: hidden;
    }
    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border);
    }
    .table-header h3 { font-size: 16px; font-weight: 600; }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      text-align: left;
      padding: 12px 24px;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid var(--border);
      background: var(--surface-2);
    }
    td {
      padding: 14px 24px;
      font-size: 14px;
      border-bottom: 1px solid var(--border);
    }
    tr:hover td { background: rgba(99,102,241,0.04); }

    /* Badges */
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge-success { background: rgba(16,185,129,0.15); color: var(--success); }
    .badge-warning { background: rgba(245,158,11,0.15); color: var(--warning); }
    .badge-danger { background: rgba(239,68,68,0.15); color: var(--danger); }
    .badge-info { background: rgba(59,130,246,0.15); color: var(--info); }
    .badge-neutral { background: var(--surface-3); color: var(--text-secondary); }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
      font-family: inherit;
    }
    .btn-primary { background: var(--primary); color: #fff; }
    .btn-primary:hover { background: var(--primary-hover); }
    .btn-success { background: var(--success); color: #fff; }
    .btn-success:hover { opacity: 0.9; }
    .btn-danger { background: var(--danger); color: #fff; }
    .btn-danger:hover { opacity: 0.9; }
    .btn-ghost {
      background: transparent;
      color: var(--text-secondary);
      border: 1px solid var(--border);
    }
    .btn-ghost:hover { color: var(--text); border-color: var(--text-secondary); }
    .btn-sm { padding: 6px 14px; font-size: 13px; }

    /* Icon Buttons */
    .btn-icon {
      width: 34px;
      height: 34px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
      text-decoration: none;
    }
    .btn-icon-primary { background: rgba(99, 102, 241, 0.1); color: #818CF8; }
    .btn-icon-primary:hover { background: #6366F1; color: #fff; }
    .btn-icon-success { background: rgba(16, 185, 129, 0.1); color: #10B981; }
    .btn-icon-success:hover { background: #10B981; color: #fff; }
    .btn-icon-danger { background: rgba(239, 68, 68, 0.1); color: #EF4444; }
    .btn-icon-danger:hover { background: #EF4444; color: #fff; }
    .btn-icon-warning { background: rgba(245, 158, 11, 0.1); color: #F59E0B; }
    .btn-icon-warning:hover { background: #F59E0B; color: #fff; }
    .btn-icon-ghost { background: rgba(156, 163, 175, 0.1); color: #9CA3AF; }
    .btn-icon-ghost:hover { background: #9CA3AF; color: #fff; }

    /* Forms */
    .form-group { margin-bottom: 16px; }
    .form-group label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-secondary);
      margin-bottom: 6px;
    }
    .form-input {
      width: 100%;
      padding: 10px 14px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 10px;
      color: var(--text);
      font-size: 14px;
      font-family: inherit;
      transition: border-color 0.2s;
    }
    .form-input:focus { outline: none; border-color: var(--primary); }
    select.form-input { cursor: pointer; }

    /* Search */
    .search-bar {
      position: relative;
      width: 320px;
    }
    .search-bar input {
      width: 100%;
      padding: 10px 14px 10px 40px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 10px;
      color: var(--text);
      font-size: 14px;
      font-family: inherit;
    }
    .search-bar input:focus { outline: none; border-color: var(--primary); }
    .search-bar .search-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-secondary);
    }

    /* Modal */
    .modal-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(4px);
      z-index: 1000;
      justify-content: center;
      align-items: center;
    }
    .modal-overlay.active { display: flex; }
    .modal {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 32px;
      width: 100%;
      max-width: 520px;
      max-height: 80vh;
      overflow-y: auto;
      animation: modalIn 0.25s ease-out;
    }
    @keyframes modalIn {
      from { opacity: 0; transform: scale(0.95) translateY(10px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .modal-header h3 { font-size: 18px; font-weight: 700; }
    .modal-close {
      background: none;
      border: none;
      color: var(--text-secondary);
      font-size: 24px;
      cursor: pointer;
    }

    /* Pagination */
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      padding: 20px;
    }
    .pagination button {
      padding: 8px 14px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--surface-2);
      color: var(--text);
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .pagination button:hover { border-color: var(--primary); }
    .pagination button.active { background: var(--primary); border-color: var(--primary); }
    .pagination button:disabled { opacity: 0.4; cursor: not-allowed; }

    /* Toast */
    .toast-container {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 2000;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .toast {
      padding: 14px 20px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
      animation: slideIn 0.3s ease-out;
      min-width: 300px;
    }
    .toast-success { background: rgba(16,185,129,0.95); color: #fff; }
    .toast-error { background: rgba(239,68,68,0.95); color: #fff; }
    @keyframes slideIn {
      from { opacity: 0; transform: translateX(100px); }
      to { opacity: 1; transform: translateX(0); }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .sidebar { width: 200px; }
      .main { margin-left: 200px; padding: 16px; }
      .stats-grid { grid-template-columns: 1fr 1fr; }
    }

    /* Loading Overlay */
    .loading-overlay {
      position: fixed;
      inset: 0;
      background: rgba(11, 15, 26, 0.7);
      backdrop-filter: blur(4px);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }
    .loading-overlay.active {
      display: flex;
    }
    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid rgba(99, 102, 241, 0.1);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
  <script>
    function showToast(message, type = 'success') {
      const container = document.getElementById('toastContainer');
      const toast = document.createElement('div');
      toast.className = 'toast toast-' + type;
      toast.textContent = message;
      container.appendChild(toast);
      setTimeout(() => toast.remove(), 4000);
    }
    async function api(url, method = 'GET', body = null) {
      const loader = document.getElementById('loadingOverlay');
      if (loader) loader.classList.add('active');
      try {
        const opts = { method, headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin' };
        if (body) opts.body = JSON.stringify(body);
        const res = await fetch(url, opts);
        return await res.json();
      } catch (err) {
        console.error('API Error:', err);
        return { success: false, error: err.message };
      } finally {
        if (loader) loader.classList.remove('active');
      }
    }
  </script>
</head>
<body>
  <div class="loading-overlay" id="loadingOverlay">
    <div class="spinner"></div>
  </div>
  <aside class="sidebar">
    <div class="sidebar-logo">
      <h1>RopeWallet</h1>
      <span>Admin Portal</span>
    </div>
    <a href="/admin/dashboard" class="nav-item ${activeTab === 'dashboard' ? 'active' : ''}">
      <span class="icon">📊</span> Dashboard
    </a>
    <a href="/admin/users" class="nav-item ${activeTab === 'users' ? 'active' : ''}">
      <span class="icon">👥</span> Users
    </a>
    <a href="/admin/deposits" class="nav-item ${activeTab === 'deposits' ? 'active' : ''}">
      <span class="icon">💰</span> Pending Deposits
    </a>
    <a href="/admin/p2p-accounts" class="nav-item ${activeTab === 'p2p' ? 'active' : ''}">
      <span class="icon">🔗</span> P2P Accounts
    </a>
    <a href="/admin/export" class="nav-item ${activeTab === 'export' ? 'active' : ''}">
      <span class="icon">📥</span> Export Data
    </a>
    <div class="sidebar-footer">
      <a href="/admin/logout" class="btn btn-ghost" style="width:100%;justify-content:center;">
        Logout
      </a>
    </div>
  </aside>
  <main class="main">
    ${content}
  </main>
  <div class="toast-container" id="toastContainer"></div>
</body>
</html>`;
  }

  private static loginPageHTML(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login | RopeWallet Admin</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      background: #0B0F1A;
      color: #F9FAFB;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    .login-container {
      width: 100%;
      max-width: 420px;
    }
    .login-card {
      background: #111827;
      border: 1px solid #1F2937;
      border-radius: 24px;
      padding: 40px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
    }
    .logo {
      text-align: center;
      margin-bottom: 32px;
    }
    .logo h1 {
      font-size: 28px;
      font-weight: 800;
      background: linear-gradient(135deg, #6366F1, #8B5CF6, #A855F7);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .logo p {
      color: #9CA3AF;
      font-size: 14px;
      margin-top: 6px;
    }
    .form-group {
      margin-bottom: 20px;
    }
    .form-group label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #9CA3AF;
      margin-bottom: 8px;
    }
    .form-group input {
      width: 100%;
      padding: 14px 16px;
      background: #1F2937;
      border: 1px solid #374151;
      border-radius: 12px;
      color: #F9FAFB;
      font-size: 15px;
      font-family: inherit;
      transition: border-color 0.2s;
    }
    .form-group input:focus {
      outline: none;
      border-color: #6366F1;
    }
    .btn-login {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      color: #fff;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      transition: opacity 0.2s;
      font-family: inherit;
    }
    .btn-login:hover { opacity: 0.9; }
    .btn-login:disabled { opacity: 0.5; cursor: not-allowed; }
    .error-msg {
      background: rgba(239,68,68,0.1);
      color: #EF4444;
      padding: 12px;
      border-radius: 10px;
      font-size: 14px;
      margin-bottom: 16px;
      display: none;
      text-align: center;
    }
    .forgot-link {
      display: block;
      text-align: right;
      font-size: 13px;
      color: #818CF8;
      text-decoration: none;
      margin-top: 6px;
      font-weight: 500;
      cursor: pointer;
    }
    .forgot-link:hover { text-decoration: underline; }
    
    /* Modal styles */
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.75);
      backdrop-filter: blur(4px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 16px;
    }
    .modal-box {
      background: #111827;
      border: 1px solid #1F2937;
      border-radius: 20px;
      padding: 32px;
      max-width: 400px;
      width: 100%;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
      position: relative;
    }
    .modal-close {
      position: absolute;
      top: 16px; right: 16px;
      background: transparent;
      border: none;
      color: #9CA3AF;
      font-size: 20px;
      cursor: pointer;
    }
    .success-msg {
      background: rgba(16,185,129,0.1);
      color: #10B981;
      padding: 12px;
      border-radius: 10px;
      font-size: 14px;
      margin-bottom: 16px;
      display: none;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="login-container">
    <div class="login-card">
      <div class="logo">
        <h1>🔐 RopeWallet</h1>
        <p>Admin Portal</p>
      </div>
      <div class="error-msg" id="errorMsg"></div>
      <form id="loginForm">
        <div class="form-group">
          <label>Email Address</label>
          <input type="email" id="email" placeholder="admin@ropewallet.com" required autofocus>
        </div>
        <div class="form-group" style="margin-bottom: 8px;">
          <label>Password</label>
          <input type="password" id="password" placeholder="Enter your password" required>
        </div>
        <div style="margin-bottom: 20px;">
          <a class="forgot-link" onclick="openForgotModal()">Forgot Password?</a>
        </div>
        <button type="submit" class="btn-login" id="loginBtn">Sign In</button>
      </form>
    </div>
    <div class="branding">&copy; ${new Date().getFullYear()} RopeWallet. All rights reserved.</div>
  </div>

  <!-- Forgot Password Modal -->
  <div class="modal-backdrop" id="forgotModal">
    <div class="modal-box">
      <button class="modal-close" onclick="closeForgotModal()">&times;</button>
      <div style="text-align: center; margin-bottom: 20px;">
        <h3 style="font-size: 20px; font-weight: 800; color: #F9FAFB;">🔑 Reset Password</h3>
        <p style="font-size: 13px; color: #9CA3AF; margin-top: 4px;">Enter your registered email to receive an OTP code</p>
      </div>

      <div class="error-msg" id="forgotErrorMsg"></div>
      <div class="success-msg" id="forgotSuccessMsg"></div>

      <!-- Step 1: Send OTP -->
      <form id="sendOtpForm">
        <div class="form-group">
          <label>Email Address</label>
          <input type="email" id="forgotEmail" placeholder="your-email@example.com" required>
        </div>
        <button type="submit" class="btn-login" id="sendOtpBtn">Send Verification OTP</button>
      </form>

      <!-- Step 2: Verify OTP & Reset Password -->
      <form id="resetPassForm" style="display: none;">
        <div class="form-group">
          <label>6-Digit OTP Code</label>
          <input type="text" id="otpCode" placeholder="123456" maxlength="6" required style="letter-spacing: 4px; font-size: 18px; text-align: center;">
        </div>
        <div class="form-group">
          <label>New Password</label>
          <input type="password" id="newPassword" placeholder="Minimum 6 characters" required minlength="6">
        </div>
        <button type="submit" class="btn-login" id="resetPassBtn">Update Password</button>
      </form>
    </div>
  </div>

  <script>
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('loginBtn');
      const errEl = document.getElementById('errorMsg');
      btn.disabled = true;
      btn.textContent = 'Signing in...';
      errEl.style.display = 'none';
      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
          }),
          credentials: 'same-origin',
        });
        const data = await res.json();
        if (data.success) {
          window.location.href = '/admin/dashboard';
        } else {
          errEl.textContent = data.error || 'Invalid credentials';
          errEl.style.display = 'block';
        }
      } catch (err) {
        errEl.textContent = 'Network error. Please try again.';
        errEl.style.display = 'block';
      }
      btn.disabled = false;
      btn.textContent = 'Sign In';
    });

    function openForgotModal() {
      document.getElementById('forgotModal').style.display = 'flex';
      document.getElementById('sendOtpForm').style.display = 'block';
      document.getElementById('resetPassForm').style.display = 'none';
      document.getElementById('forgotErrorMsg').style.display = 'none';
      document.getElementById('forgotSuccessMsg').style.display = 'none';
    }

    function closeForgotModal() {
      document.getElementById('forgotModal').style.display = 'none';
    }

    let resetEmail = '';

    document.getElementById('sendOtpForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('forgotEmail').value.trim();
      const btn = document.getElementById('sendOtpBtn');
      const errEl = document.getElementById('forgotErrorMsg');
      const succEl = document.getElementById('forgotSuccessMsg');
      
      btn.disabled = true;
      btn.textContent = 'Sending OTP...';
      errEl.style.display = 'none';
      succEl.style.display = 'none';

      try {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (data.success) {
          resetEmail = email;
          succEl.textContent = 'OTP sent! Please check your email inbox.';
          succEl.style.display = 'block';
          document.getElementById('sendOtpForm').style.display = 'none';
          document.getElementById('resetPassForm').style.display = 'block';
        } else {
          errEl.textContent = data.error || 'Failed to send OTP';
          errEl.style.display = 'block';
        }
      } catch (err) {
        errEl.textContent = 'Network error. Please try again.';
        errEl.style.display = 'block';
      }
      btn.disabled = false;
      btn.textContent = 'Send Verification OTP';
    });

    document.getElementById('resetPassForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const otpCode = document.getElementById('otpCode').value.trim();
      const newPassword = document.getElementById('newPassword').value;
      const btn = document.getElementById('resetPassBtn');
      const errEl = document.getElementById('forgotErrorMsg');
      const succEl = document.getElementById('forgotSuccessMsg');

      btn.disabled = true;
      btn.textContent = 'Updating password...';
      errEl.style.display = 'none';
      succEl.style.display = 'none';

      try {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: resetEmail, otpCode, newPassword }),
        });
        const data = await res.json();
        if (data.success) {
          succEl.textContent = 'Password reset successfully! You can now log in.';
          succEl.style.display = 'block';
          setTimeout(() => {
            closeForgotModal();
          }, 2000);
        } else {
          errEl.textContent = data.error || 'Failed to reset password';
          errEl.style.display = 'block';
        }
      } catch (err) {
        errEl.textContent = 'Network error. Please try again.';
        errEl.style.display = 'block';
      }
      btn.disabled = false;
      btn.textContent = 'Update Password';
    });
  </script>
</body>
</html>`;
  }

  private static dashboardPageHTML(data: any): string {
    const content = `
    <div class="page-header">
      <div>
        <h2>Dashboard</h2>
        <p>Overview of your platform performance</p>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="label">📈 Total Cash Flow</div>
        <div class="value">$${Number(data.totalCashFlow || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
      </div>
      <div class="stat-card success">
        <div class="label">💵 Platform Revenue (15%)</div>
        <div class="value">$${Number(data.totalPlatformFee || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
      </div>
      <div class="stat-card danger">
        <div class="label">💳 Stripe Fees Paid</div>
        <div class="value">$${Number(data.totalStripeFee || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
      </div>
      <div class="stat-card info">
        <div class="label">✨ Net Profit</div>
        <div class="value">$${Number(data.totalNetProfit || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
      </div>
      <div class="stat-card">
        <div class="label">👥 Total Users</div>
        <div class="value">${data.totalUsers}</div>
      </div>
      <div class="stat-card">
        <div class="label">✅ Active Users</div>
        <div class="value">${data.activeUsers}</div>
      </div>
      <div class="stat-card warning">
        <div class="label">⏳ Pending Deposits</div>
        <div class="value">${data.pendingDeposits}</div>
      </div>
      <div class="stat-card danger">
        <div class="label">🔒 Frozen Accounts</div>
        <div class="value">${data.frozenUsers}</div>
      </div>
    </div>

    <!-- Revenue Chart -->
    <div class="table-container" style="margin-bottom:24px;padding:24px;">
      <h3 style="margin-bottom:16px;">Monthly Revenue</h3>
      <canvas id="revenueChart" height="80"></canvas>
    </div>

    <!-- Recent Transactions -->
    <div class="table-container">
      <div class="table-header">
        <h3>Recent Transactions</h3>
      </div>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Status</th>
            <th>Amount</th>
            <th>Fee</th>
            <th>User</th>
          </tr>
        </thead>
        <tbody id="recentTxnBody"></tbody>
      </table>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script>
    <script>
      const recentTxns = ${data.recentTxns};
      const monthlyRevenue = ${data.monthlyRevenue};

      // Populate table
      const tbody = document.getElementById('recentTxnBody');
      recentTxns.forEach(t => {
        const statusClass = t.status === 'completed' ? 'badge-success' : t.status === 'pending' ? 'badge-warning' : 'badge-danger';
        const typeLabel = t.type.replace('_', ' ').replace(/\\b\\w/g, c => c.toUpperCase());
        const user = t.receiver?.fullName || t.receiver?.userTag || '-';
        tbody.innerHTML += \`<tr>
          <td>\${new Date(t.createdAt).toLocaleDateString()}</td>
          <td><span class="badge badge-info">\${typeLabel}</span></td>
          <td><span class="badge \${statusClass}">\${t.status}</span></td>
          <td>$\${Number(t.amount).toFixed(2)}</td>
          <td>$\${Number(t.fee || 0).toFixed(2)}</td>
          <td>\${user}</td>
        </tr>\`;
      });

      // Chart
      if (monthlyRevenue.length > 0) {
        new Chart(document.getElementById('revenueChart'), {
          type: 'bar',
          data: {
            labels: monthlyRevenue.map(m => m._id),
            datasets: [{
              label: 'Revenue ($)',
              data: monthlyRevenue.map(m => m.revenue),
              backgroundColor: 'rgba(99,102,241,0.6)',
              borderColor: '#6366F1',
              borderWidth: 1,
              borderRadius: 6,
            }, {
              label: 'Volume ($)',
              data: monthlyRevenue.map(m => m.volume),
              backgroundColor: 'rgba(16,185,129,0.3)',
              borderColor: '#10B981',
              borderWidth: 1,
              borderRadius: 6,
            }],
          },
          options: {
            responsive: true,
            plugins: { legend: { labels: { color: '#9CA3AF' } } },
            scales: {
              x: { ticks: { color: '#9CA3AF' }, grid: { color: '#1F2937' } },
              y: { ticks: { color: '#9CA3AF' }, grid: { color: '#1F2937' } },
            },
          },
        });
      }
    </script>`;

    return AdminController.adminShell('Dashboard', 'dashboard', content);
  }

  private static usersPageHTML(currentAdminId?: string): string {
    const content = `
    <div class="page-header">
      <div>
        <h2>User Management</h2>
        <p>Create, edit, freeze, and delete user accounts</p>
      </div>
      <div style="display:flex;gap:12px;align-items:center;">
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input type="text" id="searchInput" placeholder="Search users..." oninput="loadUsers()">
        </div>
        <button class="btn btn-primary" onclick="openCreateModal()">+ New User</button>
      </div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Tag</th>
            <th>Balance</th>
            <th>Status</th>
            <th>Role</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="usersBody"></tbody>
      </table>
      <div class="pagination" id="pagination"></div>
    </div>

    <!-- Create/Edit User Modal -->
    <div class="modal-overlay" id="userModal">
      <div class="modal">
        <div class="modal-header">
          <h3 id="modalTitle">Create User</h3>
          <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <form id="userForm">
          <input type="hidden" id="editUserId">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>First Name *</label>
              <input class="form-input" id="uFirstName" oninput="autoGenerateTag()" required>
            </div>
            <div class="form-group">
              <label>Last Name *</label>
              <input class="form-input" id="uLastName" oninput="autoGenerateTag()" required>
            </div>
          </div>
          <div class="form-group">
            <label>Middle Name</label>
            <input class="form-input" id="uMiddleName">
          </div>
          <div class="form-group">
            <label>Email *</label>
            <input class="form-input" type="email" id="uEmail" required>
          </div>
          <div class="form-group">
            <label>Phone Number *</label>
            <input class="form-input" id="uPhone" required>
          </div>
          <div class="form-group">
            <label>User Tag *</label>
            <input class="form-input" id="uTag" required>
          </div>
          <div class="form-group" id="passwordGroup">
            <label>Password *</label>
            <input class="form-input" type="password" id="uPassword" minlength="6">
          </div>
          <div class="form-group" id="balanceGroup" style="display:none;">
            <label>Wallet Balance</label>
            <input class="form-input" type="number" id="uBalance" step="0.01" min="0">
          </div>
          <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:24px;">
            <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" id="submitBtn">Create User</button>
          </div>
        </form>
      </div>
    </div>

    <script>
      let currentPage = 1;

      async function loadUsers(page = 1) {
        currentPage = page;
        const search = document.getElementById('searchInput').value;
        const data = await api('/api/admin/users?page=' + page + '&limit=15&search=' + encodeURIComponent(search));
        if (!data.success) return;

        const tbody = document.getElementById('usersBody');
        tbody.innerHTML = '';
        data.data.users.forEach(u => {
          const statusBadge = u.isFrozen
            ? '<span class="badge badge-danger">Frozen</span>'
            : '<span class="badge badge-success">Active</span>';
          const freezeBtn = u.isFrozen
            ? '<button class="btn-icon btn-icon-success" onclick="toggleFreeze(\\'' + u._id + '\\', false)" title="Unfreeze Account"><i class="fas fa-lock-open"></i></button>'
            : '<button class="btn-icon btn-icon-warning" onclick="toggleFreeze(\\'' + u._id + '\\', true)" title="Freeze Account"><i class="fas fa-lock"></i></button>';

          const roleSelect = '<select style="background:#1F2937;color:#F9FAFB;border:1px solid #374151;border-radius:8px;padding:5px 10px;font-size:12px;font-weight:600;cursor:pointer;outline:none;" onchange="toggleRole(\'' + u._id + '\', this.value)">' +
                '<option value="user"' + (u.role === 'user' ? ' selected' : '') + '>User</option>' +
                '<option value="admin"' + (u.role === 'admin' ? ' selected' : '') + '>Admin</option>' +
                '<option value="superadmin"' + (u.role === 'superadmin' ? ' selected' : '') + '>Superadmin</option>' +
              '</select>';

          tbody.innerHTML += '<tr>' +
            '<td><strong>' + (u.fullName || u.firstName + ' ' + u.lastName) + '</strong></td>' +
            '<td>' + u.email + '</td>' +
            '<td>@' + u.userTag + '</td>' +
            '<td>$' + Number(u.walletBalance).toFixed(2) + '</td>' +
            '<td>' + statusBadge + '</td>' +
            '<td>' + roleSelect + '</td>' +
            '<td>' + new Date(u.createdAt).toLocaleDateString() + '</td>' +
            '<td style="display:flex;gap:8px;">' +
              '<button class="btn-icon btn-icon-primary" onclick="openEditModal(\\'' + u._id + '\\')" title="Edit User"><i class="fas fa-edit"></i></button>' +
              freezeBtn +
              '<button class="btn-icon btn-icon-danger" onclick="deleteUser(\\'' + u._id + '\\')" title="Delete User"><i class="fas fa-trash"></i></button>' +
            '</td>' +
          '</tr>';
        });

        // Pagination
        const { pagination } = data.data;
        const pagEl = document.getElementById('pagination');
        pagEl.innerHTML = '';
        for (let i = 1; i <= pagination.totalPages; i++) {
          pagEl.innerHTML += '<button class="' + (i === pagination.page ? 'active' : '') + '" onclick="loadUsers(' + i + ')">' + i + '</button>';
        }
      }

      function autoGenerateTag() {
        const isEdit = !!document.getElementById('editUserId').value;
        if (isEdit) return;
        const first = document.getElementById('uFirstName').value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        const last = document.getElementById('uLastName').value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        const name = first || last || 'user';
        const tagEl = document.getElementById('uTag');
        let currentVal = tagEl.value;
        let numMatch = currentVal.match(/\d+$/);
        let num = numMatch ? numMatch[0] : Math.floor(100 + Math.random() * 900);
        tagEl.value = '$' + name + num;
      }

      function openCreateModal() {
        document.getElementById('modalTitle').textContent = 'Create User';
        document.getElementById('submitBtn').textContent = 'Create User';
        document.getElementById('editUserId').value = '';
        document.getElementById('passwordGroup').style.display = 'block';
        document.getElementById('balanceGroup').style.display = 'none';
        document.getElementById('userForm').reset();
        document.getElementById('uTag').value = '$user' + Math.floor(100 + Math.random() * 900);
        document.getElementById('userModal').classList.add('active');
      }

      async function openEditModal(id) {
        const data = await api('/api/admin/users/' + id);
        if (!data.success) return;
        const u = data.data.user;
        document.getElementById('modalTitle').textContent = 'Edit User';
        document.getElementById('submitBtn').textContent = 'Save Changes';
        document.getElementById('editUserId').value = id;
        document.getElementById('passwordGroup').style.display = 'none';
        document.getElementById('balanceGroup').style.display = 'block';
        document.getElementById('uFirstName').value = u.firstName || '';
        document.getElementById('uLastName').value = u.lastName || '';
        document.getElementById('uMiddleName').value = u.middleName || '';
        document.getElementById('uEmail').value = u.email || '';
        document.getElementById('uPhone').value = u.phoneNumber || '';
        document.getElementById('uTag').value = u.userTag || '';
        document.getElementById('uBalance').value = u.walletBalance || 0;
        document.getElementById('userModal').classList.add('active');
      }

      function closeModal() {
        document.getElementById('userModal').classList.remove('active');
      }

      document.getElementById('userForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editUserId').value;
        const body = {
          firstName: document.getElementById('uFirstName').value,
          lastName: document.getElementById('uLastName').value,
          middleName: document.getElementById('uMiddleName').value,
          email: document.getElementById('uEmail').value,
          phoneNumber: document.getElementById('uPhone').value,
          userTag: document.getElementById('uTag').value,
        };
        if (id) {
          body.walletBalance = parseFloat(document.getElementById('uBalance').value) || 0;
          const res = await api('/api/admin/users/' + id, 'PUT', body);
          showToast(res.success ? 'User updated' : res.error, res.success ? 'success' : 'error');
        } else {
          body.password = document.getElementById('uPassword').value;
          const res = await api('/api/admin/users', 'POST', body);
          showToast(res.success ? 'User created' : res.error, res.success ? 'success' : 'error');
        }
        closeModal();
        loadUsers(currentPage);
      });

      async function toggleFreeze(id, freeze) {
        const url = freeze ? '/api/admin/users/' + id + '/freeze' : '/api/admin/users/' + id + '/unfreeze';
        const res = await api(url, 'PUT');
        showToast(res.success ? res.message : res.error, res.success ? 'success' : 'error');
        loadUsers(currentPage);
      }

      async function toggleRole(id, role) {
        if (!confirm('Change role of this account to ' + role + '?')) {
          loadUsers(currentPage);
          return;
        }
        const res = await api('/api/admin/users/' + id + '/role', 'PUT', { role });
        showToast(res.success ? (res.message || 'Role updated') : res.error, res.success ? 'success' : 'error');
        loadUsers(currentPage);
      }

      async function deleteUser(id) {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
        const res = await api('/api/admin/users/' + id, 'DELETE');
        showToast(res.success ? 'User deleted' : res.error, res.success ? 'success' : 'error');
        loadUsers(currentPage);
      }

      loadUsers();
    </script>`;

    return AdminController.adminShell('Users', 'users', content);
  }

  private static depositsPageHTML(): string {
    const content = `
    <div class="page-header">
      <div>
        <h2>Pending Deposits</h2>
        <p>Approve or decline P2P deposit confirmations</p>
      </div>
      <div>
        <select class="form-input" id="statusFilter" onchange="loadDeposits()" style="width:160px;">
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="declined">Declined</option>
          <option value="all">All</option>
        </select>
      </div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Payer</th>
            <th>Platform</th>
            <th>Amount</th>
            <th>Recipient</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="depositsBody"></tbody>
      </table>
      <div class="pagination" id="depPagination"></div>
    </div>

    <!-- Decline Reason Modal -->
    <div class="modal-overlay" id="declineModal">
      <div class="modal" style="max-width:400px;">
        <div class="modal-header">
          <h3>Decline Deposit</h3>
          <button class="modal-close" onclick="document.getElementById('declineModal').classList.remove('active')">&times;</button>
        </div>
        <div class="form-group">
          <label>Reason (optional)</label>
          <input class="form-input" id="declineReason" placeholder="Why is this being declined?">
        </div>
        <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:16px;">
          <button class="btn btn-ghost" onclick="document.getElementById('declineModal').classList.remove('active')">Cancel</button>
          <button class="btn btn-danger" onclick="confirmDecline()">Decline</button>
        </div>
      </div>
    </div>

    <script>
      let declineTargetId = '';

      async function loadDeposits(page = 1) {
        const status = document.getElementById('statusFilter').value;
        const data = await api('/api/admin/deposits?page=' + page + '&status=' + status);
        if (!data.success) return;

        const tbody = document.getElementById('depositsBody');
        tbody.innerHTML = '';
        data.data.deposits.forEach(d => {
          const statusClass = d.status === 'completed' ? 'badge-success' : d.status === 'pending' ? 'badge-warning' : 'badge-danger';
          const payer = d.payerInfo ? (d.payerInfo.name || d.payerInfo.email || 'Unknown') : 'Unknown';
          const platform = d.paymentMethod || d.payerInfo?.platform || '-';
          const user = d.receiver?.fullName || d.receiver?.userTag || '-';
          let actions = '';
          if (d.status === 'pending') {
            actions = '<button class="btn btn-sm btn-success" onclick="approveDeposit(\\'' + d._id + '\\')">✓ Approve</button>' +
              '<button class="btn btn-sm btn-danger" onclick="openDecline(\\'' + d._id + '\\')">✗ Decline</button>';
          }
          tbody.innerHTML += '<tr>' +
            '<td>' + new Date(d.createdAt).toLocaleString() + '</td>' +
            '<td>' + payer + '</td>' +
            '<td><span class="badge badge-info">' + platform + '</span></td>' +
            '<td><strong>$' + Number(d.amount).toFixed(2) + '</strong></td>' +
            '<td>' + user + '</td>' +
            '<td><span class="badge ' + statusClass + '">' + d.status + '</span></td>' +
            '<td style="display:flex;gap:6px;">' + actions + '</td>' +
          '</tr>';
        });
      }

      async function approveDeposit(id) {
        if (!confirm('Approve this deposit? The user\\'s wallet will be credited.')) return;
        const res = await api('/api/admin/deposits/' + id + '/approve', 'PUT');
        showToast(res.success ? res.message : res.error, res.success ? 'success' : 'error');
        loadDeposits();
      }

      function openDecline(id) {
        declineTargetId = id;
        document.getElementById('declineReason').value = '';
        document.getElementById('declineModal').classList.add('active');
      }

      async function confirmDecline() {
        const reason = document.getElementById('declineReason').value;
        const res = await api('/api/admin/deposits/' + declineTargetId + '/decline', 'PUT', { reason });
        showToast(res.success ? 'Deposit declined' : res.error, res.success ? 'success' : 'error');
        document.getElementById('declineModal').classList.remove('active');
        loadDeposits();
      }

      loadDeposits();
    </script>`;

    return AdminController.adminShell('Pending Deposits', 'deposits', content);
  }

  private static p2pAccountsPageHTML(): string {
    const content = `
    <div class="page-header">
      <div>
        <h2>P2P Payment Accounts</h2>
        <p>Manage Chime, Venmo, and Cash App handles for receiving guest payments</p>
      </div>
      <button class="btn btn-primary" onclick="openAddModal()">+ Add Account</button>
    </div>

    <div class="stats-grid" id="accountsGrid"></div>

    <!-- Add/Edit P2P Account Modal -->
    <div class="modal-overlay" id="p2pModal">
      <div class="modal" style="max-width:420px;">
        <div class="modal-header">
          <h3 id="p2pModalTitle">Add P2P Account</h3>
          <button class="modal-close" onclick="document.getElementById('p2pModal').classList.remove('active')">&times;</button>
        </div>
        <form id="p2pForm">
          <input type="hidden" id="p2pEditId">
          <div class="form-group">
            <label>Platform</label>
            <select class="form-input" id="p2pPlatform" required>
              <option value="chime">Chime</option>
              <option value="venmo">Venmo</option>
              <option value="cashapp">Cash App</option>
            </select>
          </div>
          <div class="form-group">
            <label>Handle / Username</label>
            <input class="form-input" id="p2pHandle" placeholder="@username or email" required>
          </div>
          <div class="form-group">
            <label>Display Name</label>
            <input class="form-input" id="p2pDisplayName" placeholder="Friendly name shown to payers" required>
          </div>
          <div class="form-group">
            <label>Direct Pay / App URL (Optional)</label>
            <input class="form-input" id="p2pDirectPayUrl" placeholder="https://venmo.com/your-username">
          </div>
          <div class="form-group">
            <label>Automation Gmail (Optional)</label>
            <input class="form-input" id="p2pEmail" type="email" placeholder="example@gmail.com">
          </div>
          <div class="form-group">
            <label>Gmail App Password (Optional)</label>
            <input class="form-input" id="p2pAppPassword" type="password" placeholder="xxxx xxxx xxxx xxxx">
          </div>
          <div class="form-group" style="display:flex;align-items:center;gap:8px;margin-top:12px;margin-bottom:12px;">
            <input type="checkbox" id="p2pIsAutoVerifyEnabled" style="width:auto;margin:0;">
            <label for="p2pIsAutoVerifyEnabled" style="margin-bottom:0;cursor:pointer;user-select:none;">Enable Auto Email Verification</label>
          </div>
          <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:20px;">
            <button type="button" class="btn btn-ghost" onclick="document.getElementById('p2pModal').classList.remove('active')">Cancel</button>
            <button type="submit" class="btn btn-primary" id="p2pSubmitBtn">Add Account</button>
          </div>
        </form>
      </div>
    </div>

    <script>
      const platformIcons = { chime: '🏦', venmo: '💜', cashapp: '💚' };
      const platformColors = { chime: '#00D54B', venmo: '#3D95CE', cashapp: '#00D632' };

      async function loadAccounts() {
        const data = await api('/api/admin/p2p-accounts');
        if (!data.success) return;

        const grid = document.getElementById('accountsGrid');
        grid.innerHTML = '';
        data.data.accounts.forEach(a => {
          const icon = platformIcons[a.platform] || '💳';
          const color = platformColors[a.platform] || '#6366F1';
          const statusBadge = a.isActive
            ? '<span class="badge badge-success">Active</span>'
            : '<span class="badge badge-danger">Inactive</span>';
          const autoBadge = a.isAutoVerifyEnabled
            ? ' <span class="badge badge-success" style="font-size:10px;background:#059669;">Auto Verify</span>'
            : '';
          grid.innerHTML += '<div class="stat-card" style="border-left:3px solid ' + color + ';">' +
            '<div class="label">' + icon + ' ' + a.platform.charAt(0).toUpperCase() + a.platform.slice(1) + ' ' + statusBadge + autoBadge + '</div>' +
            '<div class="value" style="font-size:20px;color:' + color + ';">' + a.handle + '</div>' +
            '<div style="color:var(--text-secondary);font-size:13px;margin-top:4px;">' + a.displayName + '</div>' +
            (a.directPayUrl ? '<div style="color:var(--text-secondary);font-size:11px;margin-top:4px;word-break:break-all;">🔗 ' + a.directPayUrl + '</div>' : '') +
            '<div style="display:flex;gap:8px;margin-top:16px;">' +
              '<button class="btn btn-sm btn-primary" onclick="openEditP2P(\\'' + a._id + '\\',\\'' + a.platform + '\\',\\'' + a.handle + '\\',\\'' + a.displayName + '\\',\\'' + (a.email || '') + '\\',\\'' + (a.appPassword || '') + '\\',\\'' + (a.directPayUrl || '') + '\\',' + (a.isAutoVerifyEnabled || false) + ')">Edit</button>' +
              '<button class="btn btn-sm btn-danger" onclick="deleteP2P(\\'' + a._id + '\\')">Delete</button>' +
            '</div>' +
          '</div>';
        });

        if (data.data.accounts.length === 0) {
          grid.innerHTML = '<div style="text-align:center;color:var(--text-secondary);padding:40px;">No P2P accounts configured yet. Add one to start receiving payments.</div>';
        }
      }

      function openAddModal() {
        document.getElementById('p2pModalTitle').textContent = 'Add P2P Account';
        document.getElementById('p2pSubmitBtn').textContent = 'Add Account';
        document.getElementById('p2pEditId').value = '';
        document.getElementById('p2pForm').reset();
        document.getElementById('p2pEmail').value = '';
        document.getElementById('p2pAppPassword').value = '';
        document.getElementById('p2pDirectPayUrl').value = '';
        document.getElementById('p2pIsAutoVerifyEnabled').checked = false;
        document.getElementById('p2pModal').classList.add('active');
      }

      function openEditP2P(id, platform, handle, displayName, email, appPassword, directPayUrl, isAutoVerifyEnabled) {
        document.getElementById('p2pModalTitle').textContent = 'Edit P2P Account';
        document.getElementById('p2pSubmitBtn').textContent = 'Save Changes';
        document.getElementById('p2pEditId').value = id;
        document.getElementById('p2pPlatform').value = platform;
        document.getElementById('p2pHandle').value = handle;
        document.getElementById('p2pDisplayName').value = displayName;
        document.getElementById('p2pEmail').value = email || '';
        document.getElementById('p2pAppPassword').value = appPassword || '';
        document.getElementById('p2pDirectPayUrl').value = directPayUrl || '';
        document.getElementById('p2pIsAutoVerifyEnabled').checked = isAutoVerifyEnabled === true || isAutoVerifyEnabled === 'true';
        document.getElementById('p2pModal').classList.add('active');
      }

      document.getElementById('p2pForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('p2pEditId').value;
        const body = {
          platform: document.getElementById('p2pPlatform').value,
          handle: document.getElementById('p2pHandle').value,
          displayName: document.getElementById('p2pDisplayName').value,
          email: document.getElementById('p2pEmail').value,
          appPassword: document.getElementById('p2pAppPassword').value,
          directPayUrl: document.getElementById('p2pDirectPayUrl').value,
          isAutoVerifyEnabled: document.getElementById('p2pIsAutoVerifyEnabled').checked,
        };
        const res = id
          ? await api('/api/admin/p2p-accounts/' + id, 'PUT', body)
          : await api('/api/admin/p2p-accounts', 'POST', body);
        showToast(res.success ? 'Account saved' : res.error, res.success ? 'success' : 'error');
        document.getElementById('p2pModal').classList.remove('active');
        loadAccounts();
      });

      async function deleteP2P(id) {
        if (!confirm('Delete this P2P account?')) return;
        const res = await api('/api/admin/p2p-accounts/' + id, 'DELETE');
        showToast(res.success ? 'Account deleted' : res.error, res.success ? 'success' : 'error');
        loadAccounts();
      }

      loadAccounts();
    </script>`;

    return AdminController.adminShell('P2P Accounts', 'p2p', content);
  }
}
