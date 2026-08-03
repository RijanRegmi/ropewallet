import { Request, Response, NextFunction } from 'express';
import { P2POrder } from '../models/p2p_order.model.js';
import { P2PAccount } from '../models/p2p_account.model.js';
import { User } from '../models/user.model.js';
import crypto from 'crypto';

export class P2POrderController {
  /**
   * Get host public info for payment page header (/pay/[userTag])
   */
  static async getHostInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userTag } = req.params;
      const cleanTag = userTag.replace(/^\$/, '').toLowerCase();

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

      res.json({
        success: true,
        data: {
          id: host._id,
          name: host.fullName || `${host.firstName || ''} ${host.lastName || ''}`.trim() || host.userTag,
          userTag: host.userTag,
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

      const order = await P2POrder.create({
        orderNo,
        hostId: host._id,
        gameUserId: gameUserId || '',
        payerTag: payerTag || '',
        payerName: payerName || '',
        paymentMethod,
        amount: parsedAmount,
        assignedHandle,
        assignedP2PAccountId,
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

      // Direct pay link generator based on platform
      let directPayUrl = '';
      if (order.paymentMethod === 'chime') {
        directPayUrl = `https://app.chime.com/link/qr?handle=${encodeURIComponent(order.assignedHandle)}`;
      } else if (order.paymentMethod === 'cashapp') {
        const cleanTag = order.assignedHandle.replace(/^\$/, '');
        directPayUrl = `https://cash.app/$${cleanTag}/${order.amount}`;
      } else if (order.paymentMethod === 'venmo') {
        const cleanVenmo = order.assignedHandle.replace(/^@/, '');
        directPayUrl = `https://venmo.com/${cleanVenmo}?txn=pay&amount=${order.amount}`;
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
}
