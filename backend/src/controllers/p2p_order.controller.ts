import { Request, Response, NextFunction } from 'express';
import { P2POrder } from '../models/p2p_order.model.js';
import { P2PAccount } from '../models/p2p_account.model.js';
import { User } from '../models/user.model.js';
import { Transaction } from '../models/transaction.model.js';
import { HostRequest } from '../models/host_request.model.js';
import crypto from 'crypto';

export class P2POrderController {
  /**
   * Get host public info for payment page header (/pay/[userTag])
   */
  static async getHostInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userTag } = req.params;
      const tagStr = Array.isArray(userTag) ? userTag[0] : (userTag || '');
      const cleanTag = tagStr.replace(/^\$/, '').toLowerCase();

      const host = await User.findOne({
        $or: [
          { userTag: cleanTag },
          { userTag: `$${cleanTag}` },
          { email: cleanTag },
        ],
      }).select('firstName lastName fullName userTag email role');

      if (!host) {
        res.status(404).json({ success: false, error: 'Host user account not found' });
        return;
      }

      let hostRole = host.role || 'customer';
      if (hostRole === ('user' as any)) hostRole = 'customer';
      if (hostRole === ('admin' as any)) hostRole = 'host';

      const isHost = ['host', 'superadmin'].includes(hostRole);
      if (!isHost) {
        res.status(400).json({
          success: false,
          error: 'Customer to customer payments are not allowed. You can only send money to Host accounts.',
        });
        return;
      }

      // Fetch active P2P payment methods/accounts configured in system
      const activeAccounts = await P2PAccount.find({ isActive: true }).select('platform handle displayName directPayUrl');
      const activePlatforms = Array.from(new Set(activeAccounts.map(a => a.platform.toLowerCase())));

      res.json({
        success: true,
        data: {
          id: host._id,
          name: host.fullName || `${host.firstName || ''} ${host.lastName || ''}`.trim() || host.userTag,
          userTag: host.userTag,
          activeAccounts,
          activePlatforms: activePlatforms.length > 0 ? activePlatforms : ['chime'], // fallback to chime if none explicitly marked
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new P2P Order Gateway Link (/api/pay/create-order)
   */
  static async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userTag, gameUserId, payerTag, payerName, paymentMethod, amount } = req.body;

      if (!userTag || !paymentMethod || !amount) {
        res.status(400).json({ success: false, error: 'userTag, paymentMethod, and amount are required' });
        return;
      }

      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount < 1) {
        res.status(400).json({ success: false, error: 'Amount must be a valid number of at least $1.00' });
        return;
      }

      const cleanTag = userTag.replace(/^\$/, '').toLowerCase();
      const host = await User.findOne({
        $or: [
          { userTag: cleanTag },
          { userTag: `$${cleanTag}` },
          { email: cleanTag },
        ],
      });

      if (!host) {
        res.status(404).json({ success: false, error: 'Host user not found' });
        return;
      }

      let hostRole = host.role || 'customer';
      if (hostRole === ('user' as any)) hostRole = 'customer';
      if (hostRole === ('admin' as any)) hostRole = 'host';

      const isHost = ['host', 'superadmin'].includes(hostRole);
      if (!isHost) {
        res.status(403).json({
          success: false,
          error: 'Customer to customer payments are not allowed. Customers can only send money to Host accounts.',
        });
        return;
      }

      // Find an active P2P Account handle from the pool for this platform
      const p2pAccounts = await P2PAccount.find({
        platform: paymentMethod,
        isActive: true,
      });

      let assignedHandle = '$ropeadmin';
      let assignedP2PAccountId = undefined;

      if (p2pAccounts.length > 0) {
        // Pick active handle from pool
        const selected = p2pAccounts[Math.floor(Math.random() * p2pAccounts.length)];
        assignedHandle = selected.handle;
        assignedP2PAccountId = selected._id as any;
      } else {
        // Fallback default admin handle
        const defaultAccount = await P2PAccount.findOne({ isActive: true });
        if (defaultAccount) {
          assignedHandle = defaultAccount.handle;
          assignedP2PAccountId = defaultAccount._id as any;
        }
      }

      // Generate unique Order Number e.g. S2028...
      const timestampStr = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
      const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
      const orderNo = `S${timestampStr}${randomHex}`;

      // 20-minute validity countdown window
      const expiresAt = new Date(Date.now() + 20 * 60 * 1000);

      const order: any = await P2POrder.create({
        orderNo,
        hostId: host._id as any,
        gameUserId: gameUserId || '',
        payerTag: payerTag || '',
        payerName: payerName || '',
        paymentMethod,
        amount: parsedAmount,
        assignedHandle,
        assignedP2PAccountId: assignedP2PAccountId as any,
        status: 'pending',
        expiresAt,
      });

      res.status(201).json({
        success: true,
        data: {
          orderId: order._id,
          orderNo: order.orderNo,
          amount: order.amount,
          assignedHandle: order.assignedHandle,
          expiresAt: order.expiresAt,
          status: order.status,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Order details & live status for Gateway Hub (/api/pay/order/:orderId)
   */
  static async getOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderId } = req.params;

      const order = await P2POrder.findById(orderId).populate('hostId', 'firstName lastName fullName userTag email');
      if (!order) {
        res.status(404).json({ success: false, error: 'Order not found' });
        return;
      }

      // Auto-expire order if time ran out and status is still pending
      const now = new Date();
      if (order.status === 'pending' && now > order.expiresAt) {
        order.status = 'expired';
        await order.save();
      }

      const remainingSeconds = Math.max(0, Math.floor((order.expiresAt.getTime() - now.getTime()) / 1000));

      // Direct pay link generator based on platform & account configuration
      let directPayUrl = '';
      
      // 1. First check if the assigned P2P account has a directPayUrl configured
      if (order.assignedP2PAccountId) {
        const p2pAcc = await P2PAccount.findById(order.assignedP2PAccountId);
        if (p2pAcc && p2pAcc.directPayUrl && p2pAcc.directPayUrl.trim()) {
          directPayUrl = p2pAcc.directPayUrl.trim();
        }
      }

      // 2. Direct pay link generator based on platform
      if (!directPayUrl) {
        if (order.paymentMethod === 'chime') {
          directPayUrl = `https://app.chime.com/link/qr?handle=${encodeURIComponent(order.assignedHandle)}`;
        } else if (order.paymentMethod === 'cashapp') {
          const cleanTag = order.assignedHandle.replace(/^[$@]/, '');
          directPayUrl = `https://cash.app/$${cleanTag}/${order.amount}`;
        } else if (order.paymentMethod === 'venmo') {
          const cleanVenmo = order.assignedHandle.replace(/^[@]/, '');
          directPayUrl = `https://venmo.com/${cleanVenmo}?txn=pay&amount=${order.amount}`;
        }
      }

      const hostObj: any = order.hostId;
      const hostName = hostObj ? (hostObj.fullName || `${hostObj.firstName || ''} ${hostObj.lastName || ''}`.trim() || hostObj.userTag) : 'RopeWallet Host';

      res.json({
        success: true,
        data: {
          id: order._id,
          orderNo: order.orderNo,
          hostName,
          gameUserId: order.gameUserId,
          payerTag: order.payerTag,
          payerName: order.payerName,
          paymentMethod: order.paymentMethod,
          amount: order.amount,
          assignedHandle: order.assignedHandle,
          directPayUrl,
          status: order.status,
          expiresAt: order.expiresAt,
          remainingSeconds,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all flagged / pending manual review orders (/api/pay/flagged-orders)
   */
  static async getFlaggedOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const flaggedOrders = await P2POrder.find({
        status: 'flagged_pending_manual',
      })
        .sort({ createdAt: -1 })
        .populate('hostId', 'firstName lastName fullName userTag email');

      res.json({
        success: true,
        data: flaggedOrders,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Super Admin Manual Approval & Transfer (/api/pay/manual-approve/:orderId)
   */
  static async manualApproveOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderId } = req.params;
      const { targetHostUserTag } = req.body;

      const order = await P2POrder.findById(orderId);
      if (!order) {
        res.status(404).json({ success: false, error: 'Order not found' });
        return;
      }

      if (!order.proofOfPayment || !order.proofOfPayment.verifiedAt) {
        res.status(400).json({ success: false, error: 'CRITICAL SECURITY ERROR: Money must be received and verified via email receipt before manual approval.' });
        return;
      }

      if (order.status === 'completed') {
        res.status(400).json({ success: false, error: 'Order has already been completed and credited.' });
        return;
      }

      // Find target host user
      let targetUserTag = targetHostUserTag;
      if (!targetUserTag && order.hostId) {
        const h = await User.findById(order.hostId);
        if (h) targetUserTag = h.userTag;
      }

      if (!targetUserTag) {
        res.status(400).json({ success: false, error: 'Target host userTag is required for transfer' });
        return;
      }

      const host = await User.findOne({
        $or: [
          { userTag: targetUserTag.replace(/^\$/, '').toLowerCase() },
          { userTag: targetUserTag },
        ],
      });

      if (!host) {
        res.status(404).json({ success: false, error: `Host user ${targetUserTag} not found` });
        return;
      }

      // Calculate fees: 20% platform commission, 80% net host split
      const platformFee = order.amount * 0.20;
      const netHostCredit = order.amount - platformFee;

      // Credit Host Wallet Balance
      host.walletBalance = (host.walletBalance || 0) + netHostCredit;
      await host.save({ validateBeforeSave: false });

      // Update Order Status
      order.status = 'completed';
      order.hostId = host._id as any;
      order.completedAt = new Date();
      await order.save();

      // Create Ledger Transaction Entry
      await Transaction.create({
        sender: host._id as any,
        receiver: host._id as any,
        amount: order.amount,
        netAmount: netHostCredit,
        fee: 0,
        platformFee,
        netProfit: platformFee,
        type: 'p2p_deposit',
        status: 'completed',
        paymentMethod: order.paymentMethod as any,
        remarks: `Super Admin Manual Transfer: Order #${order.orderNo} (${order.payerName || 'Verified Payer'})`,
        payerInfo: {
          name: order.payerName || 'Verified Payer',
          platform: order.paymentMethod,
        },
        approvedAt: new Date(),
      } as any);

      res.json({
        success: true,
        message: `Successfully credited $${netHostCredit.toFixed(2)} to host ${host.fullName} (${host.userTag}) with $${platformFee.toFixed(2)} platform fee retained.`,
        data: {
          orderId: order._id,
          netHostCredit,
          platformFee,
          hostUserTag: host.userTag,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Public: Become a Host Request (/api/pay/become-host-request)
   */
  static async createHostRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fullName, email, phone, telegramOrWhatsapp, notes } = req.body;

      if (!fullName || !email) {
        res.status(400).json({ success: false, error: 'Full Name and Email Address are required.' });
        return;
      }

      const hostReq = await HostRequest.create({
        fullName,
        email,
        phone,
        telegramOrWhatsapp,
        notes,
        status: 'pending',
      });

      res.status(201).json({
        success: true,
        message: 'Your Become a Host connection request has been securely submitted to Super Admin!',
        data: hostReq,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Get all Become a Host Requests (/api/pay/host-requests)
   */
  static async getHostRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requests = await HostRequest.find().sort({ createdAt: -1 });
      res.json({
        success: true,
        data: requests,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Update Host Request Status (/api/pay/host-requests/:id/status)
   */
  static async updateHostRequestStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const hostReq = await HostRequest.findById(id);
      if (!hostReq) {
        res.status(404).json({ success: false, error: 'Host request not found' });
        return;
      }

      hostReq.status = status;
      await hostReq.save();

      res.json({
        success: true,
        message: `Updated request status to ${status}`,
        data: hostReq,
      });
    } catch (error) {
      next(error);
    }
  }
}
