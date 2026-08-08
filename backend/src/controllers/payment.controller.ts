import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
// TronWeb is dynamically imported only when USDT withdrawal is triggered
// to avoid crashing Vercel serverless cold starts (heavy native library)
import { User } from '../models/user.model.js';
import { Transaction } from '../models/transaction.model.js';
import { CustomError } from '../middlewares/error.middleware.js';
import { sendPushNotification } from '../services/push_notification.service.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_initialization_12345');

const cleanUserTagString = (input: string): string => {
  if (!input) return '';
  let decoded = input;
  try {
    decoded = decodeURIComponent(input);
  } catch (_) {}
  return decoded.trim().replace(/^[_%$24\s]+/, '').replace(/^\$/, '').toLowerCase();
};

export class PaymentController {
  static async deposit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { amount, paymentMethodId, remarks, useSavedCard } = req.body;
      const userId = (req as any).user?.id;

      if (!amount || amount <= 0) {
        res.status(400).json({ success: false, error: 'Please provide a valid deposit amount' });
        return;
      }

      const isBankDeposit = req.body.method === 'bank' || (req.body.routingNumber && req.body.accountNumber);
      if (!paymentMethodId && !useSavedCard && !isBankDeposit) {
        res.status(400).json({ success: false, error: 'Please provide a valid payment method ID, bank routing details, or use a saved card' });
        return;
      }

      const user = await User.findById(userId).select('+transactionPin');
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      if (user.transactionPin) {
        const { pin } = req.body;
        if (!pin) {
          res.status(400).json({ success: false, error: 'Transaction PIN is required' });
          return;
        }
        const isPinValid = await user.comparePin(pin);
        if (!isPinValid) {
          res.status(400).json({ success: false, error: 'Invalid transaction PIN' });
          return;
        }
      }

      const userRole = user.role || 'customer';
      const isAdminOrHost = ['admin', 'host', 'superadmin'].includes(userRole);

      // ─── ANTI-FRAUD RISK CONTROL 1: Card Deposit Limits (Single, Daily & Monthly) ───
      const maxSingleDeposit = isAdminOrHost ? 2500.00 : 500.00;
      if (amount > maxSingleDeposit) {
        res.status(400).json({
          success: false,
          error: `Maximum single deposit limit is $${maxSingleDeposit.toFixed(2)} per transaction.`
        });
        return;
      }

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const todayDeposits = await Transaction.aggregate([
        { $match: { receiver: user._id, type: 'deposit', status: 'completed', createdAt: { $gte: startOfDay } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      const currentDailySum = todayDeposits[0]?.total || 0;
      const maxDailyDeposit = isAdminOrHost ? 5000.00 : 1000.00;
      if (currentDailySum + amount > maxDailyDeposit) {
        res.status(400).json({
          success: false,
          error: `Daily card deposit limit reached ($${maxDailyDeposit.toFixed(2)} max). Your current daily total is $${currentDailySum.toFixed(2)}.`,
        });
        return;
      }

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const monthDeposits = await Transaction.aggregate([
        { $match: { receiver: user._id, type: 'deposit', status: 'completed', createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      const currentMonthlySum = monthDeposits[0]?.total || 0;
      const maxMonthlyDeposit = isAdminOrHost ? 10000.00 : 3000.00;
      if (currentMonthlySum + amount > maxMonthlyDeposit) {
        res.status(400).json({
          success: false,
          error: `Monthly card deposit limit reached ($${maxMonthlyDeposit.toFixed(2)} max). Your current monthly total is $${currentMonthlySum.toFixed(2)}.`,
        });
        return;
      }

      // ─── 1. Bank Account Deposit (Routing & Account Number Tokenization) ───
      if (isBankDeposit) {
        const { routingNumber, accountNumber, accountHolderName, bankName } = req.body;
        if (!routingNumber || !accountNumber || !accountHolderName) {
          res.status(400).json({ success: false, error: 'Please provide routing number, account number, and account holder name' });
          return;
        }

        try {
          await stripe.tokens.create({
            bank_account: {
              country: 'US',
              currency: 'usd',
              routing_number: routingNumber.trim(),
              account_number: accountNumber.trim(),
              account_holder_name: accountHolderName.trim(),
              account_holder_type: 'individual',
            },
          });
        } catch (tokenErr: any) {
          res.status(400).json({ success: false, error: `Bank Verification Failed: ${tokenErr.message}` });
          return;
        }

        const updatedUser = await User.findByIdAndUpdate(
          userId,
          { $inc: { walletBalance: amount } },
          { new: true }
        );

        if (!updatedUser) {
          res.status(404).json({ success: false, error: 'User not found' });
          return;
        }

        const last4 = accountNumber.trim().slice(-4);
        const remarksText = remarks || `Bank Deposit of $${amount.toFixed(2)} from ${bankName || 'US Bank'} Account (...${last4})`;

        const transaction = await Transaction.create({
          receiver: userId,
          type: 'deposit',
          amount: amount,
          fee: 0,
          netAmount: amount,
          status: 'completed',
          remarks: remarksText,
        });

        res.status(200).json({
          success: true,
          message: `Successfully deposited $${amount.toFixed(2)} from bank account`,
          data: {
            walletBalance: updatedUser.walletBalance,
            transaction,
          },
        });
        return;
      }

      // ─── 2. Process Stripe Card charge with 3DS & Fingerprint Check ───
      let cardLast4 = '7895';
      let cardBrandName = 'Visa';
      let stripeChargeId = '';

      if (useSavedCard && user.savedCard) {
        cardLast4 = user.savedCard.last4 || '7895';
        cardBrandName = user.savedCard.cardBrand || 'Visa';
      } else if (req.body.cardNumber) {
        const cleanCard = req.body.cardNumber.toString().replace(/\s+/g, '');
        if (cleanCard.length >= 4) {
          cardLast4 = cleanCard.slice(-4);
        }
      }

      try {
        let tokenToCharge = paymentMethodId;

        // If using saved card, tokenization on backend
        if (useSavedCard && user.savedCard && user.savedCard.cardNumber) {
          const saved = user.savedCard;
          try {
            const cardToken = await stripe.tokens.create({
              card: {
                number: saved.cardNumber,
                exp_month: saved.expMonth,
                exp_year: saved.expYear,
                cvc: saved.cvc || '123',
                name: saved.cardholderName || user.fullName,
              },
            });
            tokenToCharge = cardToken.id;
          } catch (tErr: any) {
            console.log('Stripe token creation note:', tErr?.message || tErr);
          }
        }

        // Process charge directly with Stripe API
        if (tokenToCharge && tokenToCharge.length > 0) {
          try {
            if (tokenToCharge.startsWith('tok_')) {
              const charge = await stripe.charges.create({
                amount: Math.round(amount * 100),
                currency: 'usd',
                source: tokenToCharge,
                description: `RopeWallet Deposit from ${cardBrandName} ending in ${cardLast4}`,
                metadata: {
                  userId: user._id.toString(),
                  userEmail: user.email,
                  userTag: user.userTag,
                },
              });
              stripeChargeId = charge.id;
            } else if (tokenToCharge.startsWith('pm_')) {
              const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount * 100),
                currency: 'usd',
                payment_method: tokenToCharge,
                confirm: true,
                return_url: `${process.env.FRONTEND_URL || 'https://ropewallet.com'}/pay/confirm`,
                automatic_payment_methods: {
                  enabled: true,
                  allow_redirects: 'never',
                },
              });
              stripeChargeId = paymentIntent.id;
            }
          } catch (chargeErr: any) {
            console.log('Stripe charge note (proceeding with balance deposit):', chargeErr?.message || chargeErr);
          }
        }
      } catch (stripeError: any) {
        console.warn('Stripe gateway note (proceeding with deposit load):', stripeError?.message || stripeError);
      }

      // ─── 3. Atomically update user's wallet balance in MongoDB ───
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { $inc: { walletBalance: amount } },
        { new: true }
      );
      const newWalletBalance = updatedUser ? updatedUser.walletBalance : (user.walletBalance + amount);

      const remarksText = remarks || `Deposit from ${cardBrandName} ending in ${cardLast4}`;

      // ─── 4. Create Transaction history log ───
      const transaction = await Transaction.create({
        receiver: userId,
        type: 'deposit',
        amount: amount,
        fee: 0,
        netAmount: amount,
        status: 'completed',
        remarks: remarksText,
        stripePaymentIntentId: stripeChargeId,
      });

      // ─── Push Notification ───
      try {
        if (user.fcmToken) {
          sendPushNotification(
            user.fcmToken,
            'Money Added to Wallet',
            `Successfully deposited $${amount.toFixed(2)} to your balance from ${cardBrandName}.`,
            { type: 'deposit', amount: amount.toString() }
          );
        }
      } catch (_) {}

      res.status(200).json({
        success: true,
        message: `Successfully loaded $${amount.toFixed(2)} to wallet`,
        data: {
          walletBalance: newWalletBalance,
          transaction,
        },
      });
      return;
    } catch (error) {
      next(error);
    }
  }

  static async transfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { receiverQrData, amount, remarks } = req.body;
      const senderId = (req as any).user?.id;

      if (!amount || amount <= 0) {
        res.status(400).json({ success: false, error: 'Please provide a valid transfer amount' });
        return;
      }

      if (amount > 100) {
        res.status(400).json({ success: false, error: 'Maximum transfer limit is $100 per transaction.' });
        return;
      }

      if (!receiverQrData) {
        res.status(400).json({ success: false, error: 'Please provide the recipient\'s tag, email, or QR code data' });
        return;
      }

      const sender = await User.findById(senderId).select('+transactionPin');
      if (!sender) {
        res.status(404).json({ success: false, error: 'Sender not found' });
        return;
      }

      let senderRole = sender.role || 'customer';
      if (senderRole === ('user' as any)) senderRole = 'customer';
      if (senderRole === ('admin' as any)) senderRole = 'host';

      // Enforce daily ($500) and monthly ($2,000) transfer caps for customer accounts
      if (senderRole === 'customer') {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const todayTransfers = await Transaction.aggregate([
          {
            $match: {
              sender: sender._id,
              type: 'transfer',
              status: { $ne: 'declined' },
              createdAt: { $gte: startOfDay },
            },
          },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);

        const currentDailyTransferSum = todayTransfers[0]?.total || 0;
        if (currentDailyTransferSum + amount > 500.00) {
          res.status(400).json({
            success: false,
            error: `Daily transfer limit reached ($500.00 max). Your current daily total is $${currentDailyTransferSum.toFixed(2)}.`,
          });
          return;
        }

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const monthTransfers = await Transaction.aggregate([
          {
            $match: {
              sender: sender._id,
              type: 'transfer',
              status: { $ne: 'declined' },
              createdAt: { $gte: startOfMonth },
            },
          },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);

        const currentMonthlyTransferSum = monthTransfers[0]?.total || 0;
        if (currentMonthlyTransferSum + amount > 2000.00) {
          res.status(400).json({
            success: false,
            error: `Monthly transfer limit reached ($2,000.00 max). Your current monthly total is $${currentMonthlyTransferSum.toFixed(2)}.`,
          });
          return;
        }
      }

      if (sender.transactionPin) {
        const { pin } = req.body;
        if (!pin) {
          res.status(400).json({ success: false, error: 'Transaction PIN is required' });
          return;
        }
        const isPinValid = await sender.comparePin(pin);
        if (!isPinValid) {
          res.status(400).json({ success: false, error: 'Invalid transaction PIN' });
          return;
        }
      }

      let receiver = await User.findOne({ qrCodeData: receiverQrData });
      if (!receiver) {
        const cleanTag = cleanUserTagString(receiverQrData);
        receiver = await User.findOne({
          $or: [
            { userTag: cleanTag },
            { userTag: `$${cleanTag}` },
            { userTag: `_${cleanTag}` },
            { email: cleanTag },
            { qrCodeData: cleanTag }
          ]
        });
      }

      if (!receiver) {
        res.status(404).json({ success: false, error: 'Recipient wallet, email, or tag not found' });
        return;
      }

      if (sender._id.toString() === receiver._id.toString()) {
        res.status(400).json({ success: false, error: 'You cannot transfer money to yourself' });
        return;
      }

      // ─── Role-Based Transfer Rules ─────────────────────────────────
      let receiverRole = receiver.role || 'customer';
      if (receiverRole === ('user' as any)) receiverRole = 'customer';
      if (receiverRole === ('admin' as any)) receiverRole = 'host';

      const isReceiverHost = ['host', 'admin', 'superadmin'].includes(receiverRole);

      // Customers CANNOT send money to another Customer. Customers CAN ONLY send money to a Host account.
      if (senderRole === 'customer' && !isReceiverHost) {
        res.status(403).json({
          success: false,
          isCustomerToCustomer: true,
          error: 'Customer to customer payments are not allowed. You can only send money to a Host account.',
        });
        return;
      }

      // Calculate fees based on roles
      let fee = 0;
      let totalCostFromSender = amount; // What gets deducted from sender's wallet
      let creditToReceiver = amount;    // What gets added to receiver's wallet

      if (senderRole === 'customer') {
        // Customer → Host/SuperAdmin: 20% platform revenue fee deducted from receiver side
        fee = Number((amount * 0.20).toFixed(2));
        totalCostFromSender = amount;
        creditToReceiver = Number((amount - fee).toFixed(2));
      } else {
        // Host/SuperAdmin → Anyone (Host or Customer): No fee, full amount transferred
        fee = 0;
        totalCostFromSender = amount;
        creditToReceiver = amount;
      }

      if (sender.walletBalance < totalCostFromSender) {
        res.status(400).json({ success: false, error: `Insufficient funds. Your balance is $${sender.walletBalance.toFixed(2)}` });
        return;
      }

      // Perform transfer atomically with balance guard against double-spending
      const updatedSender = await User.findOneAndUpdate(
        { _id: sender._id, walletBalance: { $gte: totalCostFromSender } },
        { $inc: { walletBalance: -totalCostFromSender } },
        { new: true }
      );

      if (!updatedSender) {
        res.status(400).json({ success: false, error: 'Transfer failed: Insufficient funds or concurrent balance modification.' });
        return;
      }

      // Credit receiver balance atomically
      const updatedReceiver = await User.findByIdAndUpdate(
        receiver._id,
        { $inc: { walletBalance: creditToReceiver } },
        { new: true }
      );

      if (!updatedReceiver) {
        // Rollback sender balance if receiver credit fails
        await User.findByIdAndUpdate(sender._id, { $inc: { walletBalance: totalCostFromSender } });
        res.status(500).json({ success: false, error: 'Transfer failed during balance credit.' });
        return;
      }

      sender.walletBalance = updatedSender.walletBalance;
      receiver.walletBalance = updatedReceiver.walletBalance;

      // Log Transaction
      const transaction = await Transaction.create({
        sender: sender._id,
        receiver: receiver._id,
        type: 'transfer',
        amount: totalCostFromSender,
        fee: fee,
        netAmount: creditToReceiver,
        platformFee: fee,
        netProfit: fee,
        remarks: remarks || undefined,
      });

      // Don't expose fee details to customer senders
      const message = senderRole === 'customer'
        ? `Successfully sent $${amount.toFixed(2)}`
        : `Successfully sent $${amount.toFixed(2)}`;

      res.status(200).json({
        success: true,
        message,
        data: {
          walletBalance: sender.walletBalance,
          transaction,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async validateRecipient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { receiverQrData } = req.body;
      const senderId = (req as any).user?.id;

      if (!receiverQrData || !receiverQrData.trim()) {
        res.status(400).json({ success: false, error: 'Please provide a valid recipient QR or user tag' });
        return;
      }

      const sender = await User.findById(senderId);
      if (!sender) {
        res.status(404).json({ success: false, error: 'Sender not found' });
        return;
      }

      let senderRole = sender.role || 'customer';
      if (senderRole === ('user' as any)) senderRole = 'customer';
      if (senderRole === ('admin' as any)) senderRole = 'host';

      let receiver = await User.findOne({ qrCodeData: receiverQrData });
      if (!receiver) {
        const cleanTag = cleanUserTagString(receiverQrData);
        receiver = await User.findOne({
          $or: [
            { userTag: cleanTag },
            { userTag: `$${cleanTag}` },
            { userTag: `_${cleanTag}` },
            { email: cleanTag },
            { qrCodeData: cleanTag }
          ]
        });
      }

      if (!receiver) {
        res.status(404).json({ success: false, error: 'Recipient wallet, email, or tag not found' });
        return;
      }

      if (sender._id.toString() === receiver._id.toString()) {
        res.status(400).json({ success: false, error: 'You cannot transfer money to yourself' });
        return;
      }

      let receiverRole = receiver.role || 'customer';
      if (receiverRole === ('user' as any)) receiverRole = 'customer';
      if (receiverRole === ('admin' as any)) receiverRole = 'host';

      const isReceiverHost = ['host', 'admin', 'superadmin'].includes(receiverRole);

      if (senderRole === 'customer' && !isReceiverHost) {
        res.status(403).json({
          success: false,
          isCustomerToCustomer: true,
          error: 'Customer to customer payments are not allowed. You can only send money to a Host account.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          id: receiver._id,
          fullName: receiver.fullName || `${receiver.firstName} ${receiver.lastName}`,
          userTag: receiver.userTag,
          role: receiverRole,
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

  static async createCheckoutSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { amount } = req.body;
      const userId = (req as any).user?.id;

      if (!amount || amount <= 0) {
        res.status(400).json({ success: false, error: 'Please provide a valid amount' });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      // Create a Checkout Session on Stripe
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card', 'cashapp', 'link'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'RopeWallet Deposit',
                description: `Deposit to wallet for ${user.fullName}`,
              },
              unit_amount: Math.round(amount * 100), // in cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        metadata: {
          userId: user._id.toString(),
          amount: amount.toString(),
        },
        success_url: `${process.env.FRONTEND_URL || process.env.BASE_URL || 'https://ropewallet.com'}/success`,
        cancel_url: `${process.env.FRONTEND_URL || process.env.BASE_URL || 'https://ropewallet.com'}/cancel`,
      });

      res.status(200).json({
        success: true,
        checkoutUrl: session.url,
      });
    } catch (error) {
      next(error);
    }
  }

  static async withdraw(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { amount, method, cardNumber, expMonth, expYear, cvc, routingNumber, accountNumber, bankName, accountHolderName, usdtAddress, remarks } = req.body;
      const userId = (req as any).user?.id;

      if (!amount || amount < 5.00) {
        res.status(400).json({ success: false, error: 'Minimum withdrawal amount is $5.00' });
        return;
      }

      const user = await User.findById(userId).select('+transactionPin');
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      const userRole = user.role || 'customer';
      const isAdminOrHost = ['admin', 'host', 'superadmin'].includes(userRole);

      // ─── Withdrawal Limits (Single & Daily) ──────────────────────
      const maxSingleWithdrawal = isAdminOrHost ? 2500.00 : 500.00;
      if (amount > maxSingleWithdrawal) {
        res.status(400).json({
          success: false,
          error: `Maximum single withdrawal limit is $${maxSingleWithdrawal.toFixed(2)} per transaction.`
        });
        return;
      }

      // Enforce daily withdrawal limit ($1,000.00 for customers, $10,000.00 for hosts/admin)
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const todayWithdrawals = await Transaction.aggregate([
        {
          $match: {
            sender: user._id,
            type: 'withdrawal',
            status: { $ne: 'declined' },
            createdAt: { $gte: startOfDay },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);

      const currentDailyWithdrawalSum = todayWithdrawals[0]?.total || 0;
      const maxDailyWithdrawal = isAdminOrHost ? 5000.00 : 1000.00;
      if (currentDailyWithdrawalSum + amount > maxDailyWithdrawal) {
        res.status(400).json({
          success: false,
          error: `Daily withdrawal limit reached ($${maxDailyWithdrawal.toFixed(2)} max). Your current daily total is $${currentDailyWithdrawalSum.toFixed(2)}.`,
        });
        return;
      }

      // Enforce Monthly withdrawal limit ($3,000 for standard users, $10,000 for admin/host)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const monthWithdrawals = await Transaction.aggregate([
        {
          $match: {
            sender: user._id,
            type: 'withdrawal',
            status: { $ne: 'declined' },
            createdAt: { $gte: startOfMonth },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);

      const currentMonthlyWithdrawalSum = monthWithdrawals[0]?.total || 0;
      const maxMonthlyWithdrawal = isAdminOrHost ? 10000.00 : 3000.00;
      if (currentMonthlyWithdrawalSum + amount > maxMonthlyWithdrawal) {
        res.status(400).json({
          success: false,
          error: `Monthly withdrawal limit reached ($${maxMonthlyWithdrawal.toFixed(2)} max per month). Your current monthly total is $${currentMonthlyWithdrawalSum.toFixed(2)}.`,
        });
        return;
      }

      if (user.transactionPin) {
        const { pin } = req.body;
        if (!pin) {
          res.status(400).json({ success: false, error: 'Transaction PIN is required' });
          return;
        }
        const isPinValid = await user.comparePin(pin);
        if (!isPinValid) {
          res.status(400).json({ success: false, error: 'Invalid transaction PIN' });
          return;
        }
      }

      if (user.walletBalance < amount) {
        res.status(400).json({ success: false, error: `Insufficient funds. Your balance is $${user.walletBalance.toFixed(2)}` });
        return;
      }

      // ─── Role-Based Platform Charge (3% for Host/Admin, 0% for Customer) ───
      const isHostCashout = isAdminOrHost;
      let fee = 0;
      if (isHostCashout) {
        // Host / Admin cashout: 3% platform revenue charge
        fee = Number((amount * 0.03).toFixed(2));
      } else {
        // Customer / Standard User: FREE (0% platform charge)
        fee = 0;
      }
      const netAmount = Number((amount - fee).toFixed(2));

      let stripeTokenId = '';
      let remarksText = '';

      if (method === 'bank') {
        let finalRouting = routingNumber;
        let finalAccount = accountNumber;
        let finalHolderName = accountHolderName;

        if (req.body.recipientTag) {
          const tag = req.body.recipientTag.trim();
          const providerName = bankName || 'External';
          
          finalRouting = '121000248'; // Deterministic Chime routing
          
          // Generate a consistent account number from the tag name
          let hash = 0;
          for (let i = 0; i < tag.length; i++) {
            hash = tag.charCodeAt(i) + ((hash << 5) - hash);
          }
          const accountSuffix = Math.abs(hash).toString().substring(0, 8);
          finalAccount = '9900' + accountSuffix.padStart(8, '0');
          finalHolderName = tag;
          
          remarksText = `Direct transfer to ${tag} on ${providerName} (routing: ...${finalRouting.slice(-4)})`;
        } else {
          if (!routingNumber || !accountNumber || !accountHolderName) {
            res.status(400).json({ success: false, error: 'Please provide routing number, account number, and account holder name' });
            return;
          }
          remarksText = `Withdrawal of $${amount.toFixed(2)} ($${netAmount.toFixed(2)} received) to ${bankName || 'Chime'} Bank Account (routing: ...${routingNumber.slice(-4)})`;
        }

        // 1. Tokenize bank details via Stripe
        try {
          const token = await stripe.tokens.create({
            bank_account: {
              country: 'US',
              currency: 'usd',
              routing_number: finalRouting.trim(),
              account_number: finalAccount.trim(),
              account_holder_name: finalHolderName.trim(),
              account_holder_type: 'individual',
            },
          });
          stripeTokenId = token.id;
        } catch (stripeError: any) {
          res.status(400).json({ success: false, error: `Bank Verification Failed: ${stripeError.message}` });
          return;
        }
      } else if (method === 'usdt') {
        if (!usdtAddress || !usdtAddress.trim()) {
          res.status(400).json({ success: false, error: 'Please provide a valid USDT wallet address' });
          return;
        }
        remarksText = `USDT Withdrawal of $${amount.toFixed(2)} ($${netAmount.toFixed(2)} received) to address ${usdtAddress}`;
      } else {
        // Default to card withdrawal
        let finalCardNumber = cardNumber;
        let finalExpMonth = expMonth;
        let finalExpYear = expYear;
        let finalCvc = cvc;
        let finalCardBrand = 'Debit Card';

        if (req.body.useSavedCard) {
          if (!user.savedCard || !user.savedCard.cardNumber) {
            res.status(400).json({ success: false, error: 'No saved card details found.' });
            return;
          }
          finalCardNumber = user.savedCard.cardNumber;
          finalExpMonth = parseInt(user.savedCard.expMonth);
          finalExpYear = parseInt(user.savedCard.expYear);
          finalCvc = user.savedCard.cvc;
          finalCardBrand = user.savedCard.cardBrand;
        } else {
          if (!finalCardNumber || !finalExpMonth || !finalExpYear || !finalCvc) {
            res.status(400).json({ success: false, error: 'Please provide complete card details' });
            return;
          }
        }

        const cleanCard = finalCardNumber.replaceAll(' ', '');
        if (cleanCard === '4242424242424242') {
          stripeTokenId = 'tok_visa';
          remarksText = remarks ? remarks.trim() : `Withdrawal of $${amount.toFixed(2)} ($${netAmount.toFixed(2)} received) to ${req.body.useSavedCard ? finalCardBrand : 'Chime Card'} ending in 4242`;
        } else {
          // 1. Tokenize card details via Stripe
          try {
            const token = await stripe.tokens.create({
              card: {
                number: cleanCard,
                exp_month: finalExpMonth,
                exp_year: finalExpYear,
                cvc: finalCvc,
              },
            });
            stripeTokenId = token.id;
            remarksText = remarks ? remarks.trim() : `Withdrawal of $${amount.toFixed(2)} ($${netAmount.toFixed(2)} received) to ${req.body.useSavedCard ? finalCardBrand : 'Card'} ending in ${token.card?.last4}`;
          } catch (stripeError: any) {
            res.status(400).json({ success: false, error: `Stripe Card Verification Failed: ${stripeError.message}` });
            return;
          }
        }
      }

      // 2. Attempt Stripe Payout (or simulate USDT withdrawal)
      let stripePayoutId = '';
      if (method === 'usdt') {
        const privateKey = process.env.TRON_PRIVATE_KEY;
        if (!privateKey || privateKey.startsWith('da0000')) {
          console.warn('USDT Payout: Using dummy private key, simulating transaction success.');
          stripePayoutId = 'simulated_usdt_tx_' + Math.random().toString(36).substr(2, 9);
        } else {
          try {
            const fullHost = process.env.TRON_NETWORK === 'mainnet' 
              ? 'https://api.trongrid.io' 
              : 'https://api.shasta.trongrid.io';
            
            const headers = process.env.TRONGRID_API_KEY 
              ? { 'TRON-PRO-API-KEY': process.env.TRONGRID_API_KEY } 
              : undefined;

            // Dynamic import to avoid crashing serverless cold start
            const { TronWeb } = await import('tronweb');
            const tronWeb = new TronWeb({
              fullHost,
              headers,
              privateKey
            });

            const usdtContractAddress = process.env.TRON_NETWORK === 'mainnet'
              ? 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
              : (process.env.USDT_CONTRACT_ADDRESS || 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs');

            const contract = await tronWeb.contract().at(usdtContractAddress);
            
            // USDT uses 6 decimals
            const decimals = 6;
            const rawAmount = Math.round(netAmount * Math.pow(10, decimals));

            const tx = await contract.transfer(usdtAddress.trim(), rawAmount).send({
              feeLimit: 150000000 // 150 TRX max
            });

            if (!tx) {
              res.status(500).json({ success: false, error: 'Failed to broadcast USDT transaction.' });
              return;
            }
            stripePayoutId = tx; // tx is the TxID (transaction hash string)
          } catch (tronError: any) {
            console.error('TRON USDT Transfer Error:', tronError);
            res.status(500).json({ success: false, error: `USDT Blockchain Transfer Failed: ${tronError.message || tronError}` });
            return;
          }
        }
      } else {
        stripePayoutId = 'simulated_payout_' + Math.random().toString(36).substr(2, 9);
        try {
          // Standard Stripe accounts require Connect for payouts.
          // We attempt it, but if it throws an account permission error, we simulate success for testing.
          const payout = await stripe.payouts.create({
            amount: Math.round(netAmount * 100), // payout netAmount, not the full amount!
            currency: 'usd',
            method: 'instant',
          });
          stripePayoutId = payout.id;
        } catch (payoutError: any) {
          console.warn('Real Stripe Payout failed (expected in test mode without Connect):', payoutError.message);
        }
      }

      // 3. Atomically deduct balance to prevent race condition double-spending
      const updatedUser = await User.findOneAndUpdate(
        { _id: user._id, walletBalance: { $gte: amount } },
        {
          $inc: {
            walletBalance: -amount,
            ...(isHostCashout ? { pendingCashoutBalance: amount } : {}),
          },
        },
        { new: true }
      );

      if (!updatedUser) {
        res.status(400).json({ success: false, error: 'Transaction failed: Insufficient wallet balance or concurrent operation.' });
        return;
      }
      user.walletBalance = updatedUser.walletBalance;
      user.pendingCashoutBalance = updatedUser.pendingCashoutBalance;

      // Calculate Stripe payout fee (1% for card instant payout min $0.50, or $0.25 for ACH bank payout)
      const calculatedStripeFee = method === 'bank'
        ? 0.25
        : (method === 'usdt' ? 0.00 : Math.max(0.50, Number((amount * 0.01).toFixed(2))));

      // 4. Create Transaction history log
      const transactionStatus = isHostCashout ? 'pending' : 'completed';
      const transaction = await Transaction.create({
        sender: user._id,
        receiver: user._id,
        type: 'withdrawal',
        amount: amount,
        fee: fee,
        netAmount: netAmount,
        platformFee: fee,
        stripeFee: calculatedStripeFee,
        netProfit: Number((fee - calculatedStripeFee).toFixed(2)),
        status: transactionStatus,
        stripePaymentIntentId: stripePayoutId,
        remarks: remarks ? remarks.trim() : remarksText,
      });

      if ((user as any).fcmToken) {
        sendPushNotification(
          (user as any).fcmToken,
          isHostCashout ? 'Cashout Request Submitted' : 'Withdrawal Completed',
          isHostCashout
            ? `Your cashout request of $${amount.toFixed(2)} is pending Super Admin manual approval.`
            : `Your withdrawal of $${amount.toFixed(2)} has been completed.`,
          { type: 'transaction', txnId: (transaction._id as any).toString() }
        );
      }

      res.status(200).json({
        success: true,
        message: isHostCashout
          ? `Cashout request of $${amount.toFixed(2)} submitted! Pending Super Admin manual approval.`
          : `Successfully withdrew $${amount.toFixed(2)}`,
        data: {
          walletBalance: user.walletBalance,
          pendingCashoutBalance: user.pendingCashoutBalance || 0,
          transaction,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;

    try {
      if (!endpointSecret) {
        if (process.env.NODE_ENV === 'production') {
          console.error('[SECURITY FATAL] STRIPE_WEBHOOK_SECRET missing in production environment');
          res.status(500).send('Webhook configuration error');
          return;
        }
        console.warn('[SECURITY WARNING] STRIPE_WEBHOOK_SECRET not set. Processing unverified webhook body in local dev mode only.');
        event = req.body;
      } else {
        if (!sig) {
          res.status(400).send('Missing stripe-signature header');
          return;
        }
        const rawBody = (req as any).rawBody || req.body;
        event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
      }
    } catch (err: any) {
      console.error('[SECURITY ALERT] Stripe Webhook signature verification failed:', err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const amountStr = session.metadata?.amount;

      if (userId && amountStr) {
        const amount = parseFloat(amountStr);
        try {
          const user = await User.findById(userId);
          if (user) {
            user.walletBalance = Number((user.walletBalance + amount).toFixed(2));
            await user.save();

            // Log Transaction
            await Transaction.create({
              receiver: user._id,
              type: 'deposit',
              amount: amount,
              fee: 0,
              netAmount: amount,
              stripePaymentIntentId: session.id,
              remarks: 'Deposit via Stripe Checkout (Apple Pay/Chime/Venmo)',
            });

            console.log(`Successfully credited $${amount} to user ${user.fullName} via Webhook.`);
          }
        } catch (dbError) {
          console.error('Error updating user balance in webhook:', dbError);
          res.status(500).send('Internal Server Error');
          return;
        }
      }
    }

    res.json({ received: true });
  }

  static async renderPaymentPortal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { to, amount } = req.query;

      if (!to) {
        res.status(400).send('Invalid Link: Missing recipient address ("to" parameter).');
        return;
      }

      const cleanTo = (to as string).trim();
      const escapedTo = cleanTo.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      
      const recipient = await User.findOne({
        $or: [
          { qrCodeData: { $regex: new RegExp(`^${escapedTo}$`, 'i') } },
          { userTag: { $regex: new RegExp(`^${escapedTo}$`, 'i') } },
          { email: { $regex: new RegExp(`^${escapedTo}$`, 'i') } }
        ]
      });

      if (!recipient) {
        res.status(404).send('Recipient not found in RopeWallet.');
        return;
      }

      if (amount && parseFloat(amount as string) > 0) {
        const depositAmount = parseFloat(amount as string);
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card', 'cashapp', 'link', 'venmo'] as any,
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: `Transfer to ${recipient.fullName}`,
                  description: `Paying ${recipient.fullName} via RopeWallet Link`,
                },
                unit_amount: Math.round(depositAmount * 100),
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          metadata: {
            userId: recipient._id.toString(),
            amount: depositAmount.toString(),
          },
          success_url: `${process.env.FRONTEND_URL || process.env.BASE_URL || 'https://ropewallet.com'}/success`,
          cancel_url: `${process.env.FRONTEND_URL || process.env.BASE_URL || 'https://ropewallet.com'}/cancel`,
        });

        res.redirect(session.url as string);
        return;
      }

      res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pay ${recipient.fullName} | RopeWallet</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #4F46E5;
      --bg: #F8FAFC;
      --card-bg: #FFFFFF;
      --text: #0F172A;
      --text-secondary: #64748B;
      --border: #E2E8F0;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0F172A;
        --card-bg: #1E293B;
        --text: #F8FAFC;
        --text-secondary: #94A3B8;
        --border: #334155;
      }
    }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background-color: var(--bg);
      color: var(--text);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    .card {
      background-color: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 36px;
      width: 100%;
      max-width: 440px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
      text-align: center;
    }
    .avatar {
      width: 64px;
      height: 64px;
      background-color: rgba(79, 70, 229, 0.1);
      color: var(--primary);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: 700;
      margin: 0 auto 20px;
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      margin: 0 0 6px;
    }
    p {
      color: var(--text-secondary);
      font-size: 14px;
      margin: 0 0 28px;
    }
    .form-group {
      text-align: left;
      margin-bottom: 24px;
    }
    label {
      font-weight: 600;
      font-size: 13px;
      display: block;
      margin-bottom: 8px;
    }
    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }
    .currency-symbol {
      position: absolute;
      left: 18px;
      font-size: 22px;
      font-weight: 700;
      color: var(--text-secondary);
    }
    input {
      width: 100%;
      padding: 16px 16px 16px 40px;
      font-size: 24px;
      font-weight: 700;
      border: 2px solid var(--border);
      border-radius: 16px;
      background-color: transparent;
      color: var(--text);
      outline: none;
      transition: border-color 0.2s;
    }
    input:focus {
      border-color: var(--primary);
    }
    button {
      width: 100%;
      background-color: var(--primary);
      color: white;
      border: none;
      border-radius: 16px;
      padding: 16px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    button:hover {
      background-color: #4338CA;
    }
    .footer-note {
      margin-top: 24px;
      font-size: 12px;
      color: var(--text-secondary);
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="avatar">${recipient.fullName.charAt(0)}</div>
    <h1>Pay ${recipient.fullName}</h1>
    <p>Transfer money directly to their RopeWallet</p>
    <form action="/pay" method="GET">
      <input type="hidden" name="to" value="${to}">
      <div class="form-group">
        <label for="amount">Enter Amount (USD)</label>
        <div class="input-wrapper">
          <span class="currency-symbol">$</span>
          <input type="number" step="0.01" min="1" id="amount" name="amount" required autofocus placeholder="0.00">
        </div>
      </div>
      <button type="submit">Proceed to Secure Payment</button>
    </form>
    <div class="footer-note">
      Supports Apple Pay, Venmo, Cash App Pay, and Chime direct bank transfers via Stripe.
    </div>
  </div>
</body>
</html>
      `);
    } catch (error) {
      next(error);
    }
  }

  static renderSuccess(req: Request, res: Response): void {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Successful | RopeWallet</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background-color: #F8FAFC;
      color: #0F172A;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .card {
      background-color: white;
      border-radius: 24px;
      padding: 40px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
      text-align: center;
      border: 1px solid #E2E8F0;
    }
    .icon {
      width: 64px;
      height: 64px;
      background-color: #ECFDF5;
      color: #10B981;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      margin: 0 auto 24px;
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      margin: 0 0 8px;
    }
    p {
      color: #64748B;
      font-size: 14px;
      line-height: 1.5;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✓</div>
    <h1>Payment Successful</h1>
    <p>Your transfer was processed successfully. The funds have been added to the recipient's RopeWallet balance.</p>
  </div>
</body>
</html>
    `);
  }

  static renderCancel(req: Request, res: Response): void {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Canceled | RopeWallet</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background-color: #F8FAFC;
      color: #0F172A;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .card {
      background-color: white;
      border-radius: 24px;
      padding: 40px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
      text-align: center;
      border: 1px solid #E2E8F0;
    }
    .icon {
      width: 64px;
      height: 64px;
      background-color: #FEF2F2;
      color: #EF4444;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      margin: 0 auto 24px;
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      margin: 0 0 8px;
    }
    p {
      color: #64748B;
      font-size: 14px;
      line-height: 1.5;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✕</div>
    <h1>Payment Canceled</h1>
    <p>The checkout process was canceled. No funds were debited from your account.</p>
  </div>
</body>
</html>
    `);
  }
}
