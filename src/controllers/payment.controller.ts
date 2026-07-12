import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { User } from '../models/user.model.js';
import { Transaction } from '../models/transaction.model.js';
import { CustomError } from '../middlewares/error.middleware.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export class PaymentController {
  static async deposit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { amount, paymentMethodId } = req.body;
      const userId = (req as any).user?.id;

      if (!amount || amount <= 0) {
        res.status(400).json({ success: false, error: 'Please provide a valid deposit amount' });
        return;
      }

      if (!paymentMethodId) {
        res.status(400).json({ success: false, error: 'Please provide a valid payment method ID' });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      // 1. Process Stripe charge
      let paymentIntent;
      try {
        paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // convert to cents
          currency: 'usd',
          payment_method: paymentMethodId,
          confirm: true,
          automatic_payment_methods: {
            enabled: true,
            allow_redirects: 'never',
          },
        });
      } catch (stripeError: any) {
        console.error('Stripe charge error:', stripeError);
        res.status(400).json({ success: false, error: `Stripe Payment Failed: ${stripeError.message}` });
        return;
      }

      if (paymentIntent.status !== 'succeeded') {
        res.status(400).json({ success: false, error: `Payment failed with status: ${paymentIntent.status}` });
        return;
      }

      // 2. Update user's wallet balance
      user.walletBalance = Number((user.walletBalance + amount).toFixed(2));
      await user.save();

      // 3. Create Transaction history log
      const transaction = await Transaction.create({
        receiver: user._id,
        type: 'deposit',
        amount: amount,
        fee: 0,
        netAmount: amount,
        stripePaymentIntentId: paymentIntent.id,
      });

      res.status(200).json({
        success: true,
        message: 'Funds deposited successfully',
        data: {
          walletBalance: user.walletBalance,
          transaction,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async transfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { receiverQrData, amount } = req.body;
      const senderId = (req as any).user?.id;

      if (!amount || amount <= 0) {
        res.status(400).json({ success: false, error: 'Please provide a valid transfer amount' });
        return;
      }

      if (!receiverQrData) {
        res.status(400).json({ success: false, error: 'Please provide the recipient\'s QR code data' });
        return;
      }

      const sender = await User.findById(senderId);
      if (!sender) {
        res.status(404).json({ success: false, error: 'Sender not found' });
        return;
      }

      if (sender.walletBalance < amount) {
        res.status(400).json({ success: false, error: `Insufficient funds. Your balance is $${sender.walletBalance.toFixed(2)}` });
        return;
      }

      const receiver = await User.findOne({ qrCodeData: receiverQrData });
      if (!receiver) {
        res.status(404).json({ success: false, error: 'Recipient wallet not found' });
        return;
      }

      if (sender._id.toString() === receiver._id.toString()) {
        res.status(400).json({ success: false, error: 'You cannot transfer money to yourself' });
        return;
      }

      // Calculate 15% fee cut
      const fee = Number((amount * 0.15).toFixed(2));
      const netAmount = Number((amount - fee).toFixed(2));

      // Perform transfer (update balances)
      sender.walletBalance = Number((sender.walletBalance - amount).toFixed(2));
      receiver.walletBalance = Number((receiver.walletBalance + netAmount).toFixed(2));

      await sender.save();
      await receiver.save();

      // Log Transaction
      const transaction = await Transaction.create({
        sender: sender._id,
        receiver: receiver._id,
        type: 'transfer',
        amount: amount,
        fee: fee,
        netAmount: netAmount,
      });

      res.status(200).json({
        success: true,
        message: `Successfully sent $${amount.toFixed(2)} ($${netAmount.toFixed(2)} received after 15% platform fee)`,
        data: {
          walletBalance: sender.walletBalance,
          transaction,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      const transactions = await Transaction.find({
        $or: [{ sender: userId }, { receiver: userId }],
      })
        .populate('sender', 'fullName email')
        .populate('receiver', 'fullName email')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      next(error);
    }
  }
}
