import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import crypto from 'crypto';
import { User } from '../models/user.model.js';
import { Transaction } from '../models/transaction.model.js';
import { PaymentRequest } from '../models/payment_request.model.js';
import { P2PAccount } from '../models/p2p_account.model.js';
import { CustomError } from '../middlewares/error.middleware.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const PLATFORM_FEE_RATE = 0.0; // 0% Deposit Fee (User gets 100% of deposited amount)
const STRIPE_FEE_RATE = 0.029;  // 2.9%
const STRIPE_FEE_FIXED = 0.30;  // $0.30

export class P2PController {

  // ─── Get Active P2P Accounts (Authenticated User) ──────────────
  static async getActiveP2PAccounts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const p2pAccounts = await P2PAccount.find({ isActive: true }).select('platform handle displayName');
      res.status(200).json({
        success: true,
        data: p2pAccounts,
      });
    } catch (error) {
      next(error);
    }
  }

  // ─── Create Payment Request (Authenticated User) ──────────────
  static async createPaymentRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { amount, note } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      const token = crypto.randomUUID().replace(/-/g, '');
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      const paymentRequest = await PaymentRequest.create({
        token,
        receiver: userId,
        amount: amount || undefined,
        note: note || undefined,
        status: 'active',
        expiresAt,
      });

      const baseUrl = process.env.BASE_URL || 'https://ropewallet.com';
      const paymentLink = `${baseUrl}/pay?token=${token}`;

      res.status(201).json({
        success: true,
        data: {
          paymentRequest,
          paymentLink,
          expiresAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // ─── Get Payment Request (Public) ─────────────────────────────
  static async getPaymentRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;

      const paymentRequest = await PaymentRequest.findOne({ token }).populate('receiver', 'fullName userTag profileImage');
      if (!paymentRequest) {
        res.status(404).json({ success: false, error: 'Payment link not found or expired' });
        return;
      }

      if (paymentRequest.status !== 'active') {
        res.status(400).json({ success: false, error: `This payment request is ${paymentRequest.status}` });
        return;
      }

      if (new Date() > paymentRequest.expiresAt) {
        paymentRequest.status = 'expired';
        await paymentRequest.save();
        res.status(400).json({ success: false, error: 'This payment link has expired' });
        return;
      }

      // Get available P2P accounts
      const p2pAccounts = await P2PAccount.find({ isActive: true });

      res.json({
        success: true,
        data: {
          paymentRequest,
          p2pAccounts,
          feeRate: PLATFORM_FEE_RATE,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // ─── Confirm P2P Sent (Chime/Venmo - creates pending tx) ─────
  static async confirmP2PSent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, amount, platform, payerName, payerEmail } = req.body;

      if (!token || !amount || !platform) {
        res.status(400).json({ success: false, error: 'Token, amount, and platform are required' });
        return;
      }

      const paymentRequest = await PaymentRequest.findOne({ token, status: 'active' });
      if (!paymentRequest) {
        res.status(404).json({ success: false, error: 'Payment request not found or expired' });
        return;
      }

      if (new Date() > paymentRequest.expiresAt) {
        paymentRequest.status = 'expired';
        await paymentRequest.save();
        res.status(400).json({ success: false, error: 'This payment link has expired' });
        return;
      }

      const platformFee = amount * PLATFORM_FEE_RATE;
      const netAmount = amount - platformFee;

      // Create a PENDING transaction (admin must approve)
      const transaction = await Transaction.create({
        receiver: paymentRequest.receiver,
        type: 'p2p_deposit',
        amount,
        fee: platformFee,
        netAmount,
        platformFee,
        stripeFee: 0, // No Stripe fee for manual P2P
        netProfit: platformFee,
        status: 'pending',
        paymentMethod: platform,
        paymentRequestToken: token,
        payerInfo: {
          name: payerName || 'Anonymous',
          email: payerEmail || '',
          platform,
        },
        remarks: paymentRequest.note || `P2P deposit via ${platform}`,
      });

      res.json({
        success: true,
        message: 'Payment confirmation received. The recipient will be credited once verified.',
        data: { transaction },
      });
    } catch (error) {
      next(error);
    }
  }

  // ─── Stripe Checkout for P2P (Apple Pay, Google Pay, Card) ────
  static async createStripeP2PCheckout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, amount, platform } = req.body;

      if (!token || !amount) {
        res.status(400).json({ success: false, error: 'Token and amount are required' });
        return;
      }

      const paymentRequest = await PaymentRequest.findOne({ token, status: 'active' }).populate('receiver', 'fullName userTag');
      if (!paymentRequest) {
        res.status(404).json({ success: false, error: 'Payment request not found or expired' });
        return;
      }

      if (new Date() > paymentRequest.expiresAt) {
        paymentRequest.status = 'expired';
        await paymentRequest.save();
        res.status(400).json({ success: false, error: 'This payment link has expired' });
        return;
      }

      const receiver = paymentRequest.receiver as any;
      const amountCents = Math.round(amount * 100);

      // Build payment method types based on selected platform
      const paymentMethodTypes: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] = ['card'];
      if (platform === 'applepay' || platform === 'googlepay') {
        // Apple Pay and Google Pay are auto-enabled with 'card' when wallet is available
      } else if (platform === 'cashapp') {
        paymentMethodTypes.push('cashapp');
      }

      const baseUrl = process.env.BASE_URL || 'https://ropewallet.com';

      const session = await stripe.checkout.sessions.create({
        payment_method_types: paymentMethodTypes,
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Payment to ${receiver.fullName || receiver.userTag}`,
              description: paymentRequest.note || 'RopeWallet P2P Transfer',
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        }],
        mode: 'payment',
        metadata: {
          paymentRequestToken: token,
          receiverId: String(paymentRequest.receiver._id || paymentRequest.receiver),
          platform: platform || 'card',
          amount: String(amount),
        },
        success_url: `${baseUrl}/pay/success?token=${token}`,
        cancel_url: `${baseUrl}/pay?token=${token}&cancelled=true`,
      });

      res.json({
        success: true,
        data: {
          sessionId: session.id,
          url: session.url,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // ─── Stripe Webhook for P2P Checkouts ─────────────────────────
  static async handleP2PWebhook(req: Request, res: Response): Promise<void> {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent((req as any).rawBody, sig, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const meta = session.metadata || {};

      if (meta.paymentRequestToken) {
        try {
          const amount = parseFloat(meta.amount || '0');
          const platformFee = amount * PLATFORM_FEE_RATE;
          const stripeFee = amount * STRIPE_FEE_RATE + STRIPE_FEE_FIXED;
          const netAmount = amount - platformFee;
          const netProfit = platformFee - stripeFee;

          // Create a completed transaction (auto-approved because Stripe confirmed payment)
          await Transaction.create({
            receiver: meta.receiverId,
            type: 'p2p_deposit',
            amount,
            fee: platformFee,
            netAmount,
            platformFee,
            stripeFee,
            netProfit,
            status: 'completed',
            paymentMethod: meta.platform || 'stripe',
            stripeSessionId: session.id,
            stripePaymentIntentId: session.payment_intent as string,
            paymentRequestToken: meta.paymentRequestToken,
            remarks: `P2P deposit via ${meta.platform || 'Stripe'}`,
            payerInfo: {
              email: session.customer_details?.email || '',
              name: session.customer_details?.name || '',
              platform: meta.platform || 'stripe',
            },
          });

          // Credit user wallet
          await User.findByIdAndUpdate(meta.receiverId, {
            $inc: { walletBalance: netAmount },
          });

          // Mark payment request as completed
          await PaymentRequest.findOneAndUpdate(
            { token: meta.paymentRequestToken },
            { status: 'completed' }
          );

          console.log(`P2P deposit completed: $${amount} → ${meta.receiverId} (net: $${netAmount.toFixed(2)})`);
        } catch (err) {
          console.error('Error processing P2P webhook:', err);
        }
      }
    }

    res.status(200).json({ received: true });
  }

  // ─── Get Receiver Profile by Tag (generates token on the fly) ────
  static async getReceiverProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let tag = req.params.tag.trim();
      const { amount, note } = req.query;

      let cleanBase = tag;
      if (cleanBase.startsWith('%24')) {
        cleanBase = cleanBase.substring(3);
      }
      if (cleanBase.startsWith('$')) {
        cleanBase = cleanBase.substring(1);
      }

      const cleanTagWithDollar = `$${cleanBase.toLowerCase()}`;
      const cleanTagWithoutDollar = cleanBase.toLowerCase();
      
      const user = await User.findOne({
        $or: [
          { userTag: cleanTagWithDollar },
          { userTag: cleanTagWithoutDollar },
          { qrCodeData: cleanTagWithDollar },
          { qrCodeData: cleanTagWithoutDollar },
          { userTag: tag },
          { qrCodeData: tag }
        ]
      }).select('fullName userTag profileImage');
      
      if (!user) {
        res.status(404).json({ success: false, error: 'Recipient not found' });
        return;
      }

      // Generate a temporary PaymentRequest token on the fly
      const token = crypto.randomUUID().replace(/-/g, '');
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes expiration

      const paymentRequest = await PaymentRequest.create({
        token,
        receiver: user._id,
        amount: amount ? parseFloat(amount as string) : undefined,
        note: note ? String(note) : 'Direct P2P Transfer',
        status: 'active',
        expiresAt,
      });

      // Get active platform P2P accounts
      const p2pAccounts = await P2PAccount.find({ isActive: true });

      res.json({
        success: true,
        data: {
          paymentRequest,
          p2pAccounts,
          receiver: user,
          feeRate: PLATFORM_FEE_RATE,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // ─── Render P2P Payment Page ──────────────────────────────────
  static async renderPaymentPage(req: Request, res: Response): Promise<void> {
    const { token, to, amount, method } = req.query;

    if (!token && to) {
      try {
        let tag = (to as string).trim();
        
        let cleanBase = tag;
        if (cleanBase.startsWith('%24')) {
          cleanBase = cleanBase.substring(3);
        }
        if (cleanBase.startsWith('$')) {
          cleanBase = cleanBase.substring(1);
        }

        const cleanTagWithDollar = `$${cleanBase.toLowerCase()}`;
        const cleanTagWithoutDollar = cleanBase.toLowerCase();
        
        const user = await User.findOne({
          $or: [
            { userTag: cleanTagWithDollar },
            { userTag: cleanTagWithoutDollar },
            { qrCodeData: cleanTagWithDollar },
            { qrCodeData: cleanTagWithoutDollar },
            { userTag: tag },
            { qrCodeData: tag }
          ]
        });
        
        if (!user) {
          res.status(404).send(P2PController.errorPageHTML('Recipient Not Found', `No user found matching "${to}"`));
          return;
        }

        // Create temporary token on the fly
        const newToken = crypto.randomUUID().replace(/-/g, '');
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes expiration

        await PaymentRequest.create({
          token: newToken,
          receiver: user._id,
          amount: amount ? parseFloat(amount as string) : undefined,
          note: 'Direct P2P Transfer',
          status: 'active',
          expiresAt,
        });

        // Redirect to standard token URL
        const redirectParams = new URLSearchParams();
        redirectParams.set('token', newToken);
        if (method) redirectParams.set('method', method as string);
        
        res.redirect(`/pay?${redirectParams.toString()}`);
        return;
      } catch (err: any) {
        console.error('Error generating direct payment link:', err);
        res.status(500).send(P2PController.errorPageHTML('Server Error', 'Failed to generate payment request.'));
        return;
      }
    }

    if (!token) {
      res.status(400).send(P2PController.errorPageHTML('Invalid Link', 'No payment token provided.'));
      return;
    }

    const paymentRequest = await PaymentRequest.findOne({ token: token as string })
      .populate('receiver', 'fullName userTag profileImage');

    if (!paymentRequest) {
      res.status(404).send(P2PController.errorPageHTML('Link Not Found', 'This payment link does not exist or has expired.'));
      return;
    }

    if (paymentRequest.status !== 'active') {
      res.status(400).send(P2PController.errorPageHTML('Link Inactive', `This payment link is ${paymentRequest.status}.`));
      return;
    }

    if (new Date() > paymentRequest.expiresAt) {
      paymentRequest.status = 'expired';
      await paymentRequest.save();
      res.status(400).send(P2PController.errorPageHTML('Link Expired', 'This payment link has expired. Please request a new one.'));
      return;
    }

    const receiver = paymentRequest.receiver as any;
    const p2pAccounts = await P2PAccount.find({ isActive: true });
    const stripeKey = process.env.STRIPE_PUBLISHABLE_KEY || '';

    res.send(P2PController.paymentPageHTML({
      token: token as string,
      receiverName: receiver.fullName || receiver.userTag,
      receiverTag: receiver.userTag,
      receiverInitial: (receiver.fullName || receiver.userTag || 'R').charAt(0).toUpperCase(),
      presetAmount: paymentRequest.amount || 0,
      note: paymentRequest.note || '',
      expiresAt: paymentRequest.expiresAt.toISOString(),
      p2pAccounts: JSON.stringify(p2pAccounts),
      stripeKey,
    }));
  }

  static renderPaymentSuccess(req: Request, res: Response): void {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Successful | RopeWallet</title>
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
    .card {
      background: #111827;
      border: 1px solid #1F2937;
      border-radius: 24px;
      padding: 48px;
      text-align: center;
      max-width: 440px;
      width: 100%;
    }
    .check {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: rgba(16,185,129,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      font-size: 40px;
    }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 12px; }
    p { color: #9CA3AF; font-size: 15px; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <div class="check">✅</div>
    <h1>Payment Successful!</h1>
    <p>Your payment has been processed and the recipient's wallet has been credited. Thank you for using RopeWallet!</p>
  </div>
</body>
</html>`);
  }

  // ─── HTML Templates ────────────────────────────────────────────

  private static errorPageHTML(title: string, message: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | RopeWallet</title>
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
    .card {
      background: #111827;
      border: 1px solid #1F2937;
      border-radius: 24px;
      padding: 48px;
      text-align: center;
      max-width: 440px;
      width: 100%;
    }
    .icon { font-size: 48px; margin-bottom: 20px; }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 12px; color: #EF4444; }
    p { color: #9CA3AF; font-size: 15px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">⚠️</div>
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
  }

  private static paymentPageHTML(data: any): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pay ${data.receiverName} | RopeWallet</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://js.stripe.com/v3/"></script>
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
    .container { width: 100%; max-width: 460px; }

    .card {
      background: #111827;
      border: 1px solid #1F2937;
      border-radius: 24px;
      padding: 32px;
      margin-bottom: 16px;
    }

    /* Header */
    .pay-header { text-align: center; margin-bottom: 28px; }
    .avatar {
      width: 64px; height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      display: flex; align-items: center; justify-content: center;
      font-size: 26px; font-weight: 800; color: #fff;
      margin: 0 auto 16px;
    }
    .pay-header h1 { font-size: 20px; font-weight: 700; }
    .pay-header .tag { color: #9CA3AF; font-size: 14px; margin-top: 4px; }
    .note { background: #1F2937; border-radius: 12px; padding: 12px 16px; color: #D1D5DB; font-size: 14px; margin-top: 12px; font-style: italic; }

    /* Timer */
    .timer { text-align: center; color: #F59E0B; font-size: 13px; font-weight: 600; margin-bottom: 20px; }

    /* Amount */
    .amount-section { margin-bottom: 24px; }
    .amount-section label { display: block; font-size: 13px; font-weight: 600; color: #9CA3AF; margin-bottom: 8px; }
    .amount-input-wrapper {
      display: flex; align-items: center;
      background: #1F2937; border: 2px solid #374151;
      border-radius: 14px; padding: 4px; transition: border-color 0.2s;
    }
    .amount-input-wrapper:focus-within { border-color: #6366F1; }
    .dollar-sign { font-size: 24px; font-weight: 800; color: #9CA3AF; padding: 0 12px; }
    .amount-input {
      flex: 1; background: transparent; border: none; color: #F9FAFB;
      font-size: 28px; font-weight: 800; padding: 12px 0; outline: none;
      font-family: inherit;
    }
    .quick-amounts {
      display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap;
    }
    .quick-btn {
      padding: 8px 16px; border-radius: 10px; border: 1px solid #374151;
      background: #1F2937; color: #D1D5DB; font-size: 14px; font-weight: 600;
      cursor: pointer; transition: all 0.2s; font-family: inherit;
    }
    .quick-btn:hover, .quick-btn.active { border-color: #6366F1; color: #6366F1; background: rgba(99,102,241,0.1); }

    /* Fee breakdown */
    .fee-breakdown {
      background: #1F2937; border-radius: 12px; padding: 16px;
      margin-bottom: 24px; font-size: 14px;
    }
    .fee-row { display: flex; justify-content: space-between; margin-bottom: 8px; color: #9CA3AF; }
    .fee-row:last-child { margin-bottom: 0; padding-top: 8px; border-top: 1px solid #374151; color: #10B981; font-weight: 700; }

    /* Payment Methods */
    .methods-title { font-size: 13px; font-weight: 600; color: #9CA3AF; margin-bottom: 12px; }
    .method-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
    .method-btn {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      padding: 16px 12px; border-radius: 14px; border: 2px solid #374151;
      background: #1F2937; color: #D1D5DB; cursor: pointer; transition: all 0.2s;
      font-family: inherit; font-size: 13px; font-weight: 600;
    }
    .method-btn:hover { border-color: #6366F1; }
    .method-btn.active { border-color: #6366F1; background: rgba(99,102,241,0.1); color: #F9FAFB; }
    .method-btn .method-icon { font-size: 28px; }
    .method-btn.disabled { opacity: 0.4; cursor: not-allowed; }

    /* P2P Instructions */
    .p2p-instructions {
      background: #1F2937; border-radius: 16px; padding: 24px;
      display: none; margin-bottom: 20px;
    }
    .p2p-instructions.visible { display: block; }
    .p2p-instructions h3 { font-size: 16px; font-weight: 700; margin-bottom: 16px; }
    .step { display: flex; gap: 12px; margin-bottom: 16px; }
    .step-num {
      width: 28px; height: 28px; border-radius: 50%;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 700; flex-shrink: 0;
    }
    .step-text { font-size: 14px; color: #D1D5DB; line-height: 1.5; }
    .handle-box {
      display: flex; align-items: center; justify-content: space-between;
      background: #0B0F1A; border-radius: 10px; padding: 12px 16px;
      margin: 8px 0;
    }
    .handle-box span { font-weight: 700; color: #6366F1; font-size: 16px; }
    .copy-btn {
      padding: 6px 14px; border-radius: 8px; border: none;
      background: #6366F1; color: #fff; font-size: 13px; font-weight: 600;
      cursor: pointer; font-family: inherit;
    }

    /* Payer info */
    .payer-info { margin-bottom: 20px; }
    .payer-info .form-group { margin-bottom: 12px; }
    .payer-info label { display: block; font-size: 13px; color: #9CA3AF; font-weight: 600; margin-bottom: 6px; }
    .payer-info input {
      width: 100%; padding: 12px 14px;
      background: #1F2937; border: 1px solid #374151; border-radius: 10px;
      color: #F9FAFB; font-size: 14px; font-family: inherit;
    }
    .payer-info input:focus { outline: none; border-color: #6366F1; }

    /* Submit */
    .submit-btn {
      width: 100%; padding: 16px;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      color: #fff; border: none; border-radius: 14px;
      font-size: 16px; font-weight: 700; cursor: pointer;
      font-family: inherit; transition: opacity 0.2s;
    }
    .submit-btn:hover { opacity: 0.9; }
    .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .branding { text-align: center; color: #4B5563; font-size: 12px; margin-top: 16px; }

    /* Loading */
    .spinner { display: inline-block; width: 18px; height: 18px; border: 2px solid #fff; border-top: 2px solid transparent; border-radius: 50%; animation: spin 0.8s linear infinite; margin-right: 8px; vertical-align: middle; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <!-- Header -->
      <div class="pay-header">
        <div class="avatar">${data.receiverInitial}</div>
        <h1>Pay ${data.receiverName}</h1>
        <div class="tag">@${data.receiverTag}</div>
        ${data.note ? `<div class="note">"${data.note}"</div>` : ''}
      </div>

      <!-- Timer -->
      <div class="timer" id="timer">⏳ Link expires in --:--</div>

      <!-- Amount -->
      <div class="amount-section">
        <label>Amount to Send</label>
        <div class="amount-input-wrapper">
          <span class="dollar-sign">$</span>
          <input type="number" class="amount-input" id="amountInput" placeholder="0.00" min="1" step="0.01" value="${data.presetAmount || ''}">
        </div>
        <div class="quick-amounts">
          <button class="quick-btn" onclick="setAmount(10)">$10</button>
          <button class="quick-btn" onclick="setAmount(20)">$20</button>
          <button class="quick-btn" onclick="setAmount(25)">$25</button>
          <button class="quick-btn" onclick="setAmount(50)">$50</button>
          <button class="quick-btn" onclick="setAmount(100)">$100</button>
          <button class="quick-btn" onclick="setAmount(200)">$200</button>
        </div>
      </div>

      <!-- Fee Breakdown -->
      <div class="fee-breakdown" id="feeBreakdown" style="display:none;">
        <div class="fee-row"><span>You send</span><span id="feeSend">$0.00</span></div>
        <div class="fee-row"><span>Service fee (15%)</span><span id="feeFee">$0.00</span></div>
        <div class="fee-row"><span>Recipient receives</span><span id="feeNet">$0.00</span></div>
      </div>

      <!-- Payment Method Selection -->
      <div class="methods-title">Select Payment Method</div>
      <div class="method-grid">
        <button class="method-btn" data-method="applepay" onclick="selectMethod('applepay')">
          <span class="method-icon">🍎</span> Apple Pay
        </button>
        <button class="method-btn" data-method="googlepay" onclick="selectMethod('googlepay')">
          <span class="method-icon">🟢</span> Google Pay
        </button>
        <button class="method-btn" data-method="cashapp" onclick="selectMethod('cashapp')">
          <span class="method-icon">💚</span> Cash App
        </button>
        <button class="method-btn" data-method="chime" onclick="selectMethod('chime')">
          <span class="method-icon">🏦</span> Chime
        </button>
        <button class="method-btn" data-method="venmo" onclick="selectMethod('venmo')">
          <span class="method-icon">💜</span> Venmo
        </button>
        <button class="method-btn" data-method="card" onclick="selectMethod('card')">
          <span class="method-icon">💳</span> Debit/Credit
        </button>
      </div>

      <!-- P2P Instructions (for Chime/Venmo/CashApp) -->
      <div class="p2p-instructions" id="p2pInstructions">
        <h3 id="p2pTitle">Send via Chime</h3>
        <div class="step">
          <div class="step-num">1</div>
          <div class="step-text">Open your <strong id="p2pAppName">Chime</strong> app and send <strong id="p2pAmount">$0.00</strong> to:</div>
        </div>
        <div class="handle-box">
          <span id="p2pHandle">-</span>
          <button class="copy-btn" onclick="copyHandle()">📋 Copy</button>
        </div>
        <div id="p2pDirectLinkContainer" style="margin: 12px 0; display: none;">
          <a id="p2pDirectLink" href="#" target="_blank" class="submit-btn" style="display: block; text-align: center; text-decoration: none; background: #10B981; padding: 12px; font-size: 14px; margin-bottom: 16px; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(16,185,129,0.2);">
             ⚡ Open App & Pay Instantly
          </a>
        </div>
        <div id="manualVerificationForm">
          <div class="step">
            <div class="step-num">2</div>
            <div class="step-text">After sending, fill in your info below and click "I Have Sent the Payment"</div>
          </div>

          <div class="payer-info">
            <div class="form-group">
              <label>Your Name</label>
              <input id="payerName" placeholder="John Doe">
            </div>
            <div class="form-group">
              <label>Your Email (for receipt)</label>
              <input id="payerEmail" type="email" placeholder="john@example.com">
            </div>
          </div>
        </div>
      </div>

      <!-- Submit Button -->
      <button class="submit-btn" id="submitBtn" onclick="handleSubmit()" disabled>Select a payment method</button>
    </div>
    <div class="branding">Secured by RopeWallet &bull; 256-bit Encryption</div>
  </div>

  <script>
    const TOKEN = '${data.token}';
    const EXPIRES = new Date('${data.expiresAt}');
    const p2pAccounts = ${data.p2pAccounts};
    const stripeKey = '${data.stripeKey}';
    let selectedMethod = '';
    let currentP2PAccount = null;

    // Filter out buttons for Chime/Venmo/CashApp if the receiver does not have them configured
    document.querySelectorAll('.method-btn').forEach(btn => {
      const method = btn.getAttribute('data-method');
      if ((method === 'chime' || method === 'venmo' || method === 'cashapp') && !p2pAccounts.some(a => a.platform === method)) {
        btn.style.display = 'none';
      }
    });

    // Check if a specific method is requested in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const methodParam = urlParams.get('method');
    if (methodParam) {
      const cleanMethod = methodParam.toLowerCase();
      // Hide all other buttons in the grid
      document.querySelectorAll('.method-btn').forEach(btn => {
        if (btn.getAttribute('data-method') !== cleanMethod) {
          btn.style.display = 'none';
        }
      });
      // Auto-select the clean method
      setTimeout(() => {
        selectMethod(cleanMethod);
      }, 50);
    }

    // Timer
    function updateTimer() {
      const now = new Date();
      const diff = EXPIRES - now;
      if (diff <= 0) {
        document.getElementById('timer').textContent = '❌ This link has expired';
        document.getElementById('submitBtn').disabled = true;
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      document.getElementById('timer').textContent = '⏳ Link expires in ' + mins + ':' + String(secs).padStart(2, '0');
    }
    setInterval(updateTimer, 1000);
    updateTimer();

    // Amount
    document.getElementById('amountInput').addEventListener('input', updateFees);
    function setAmount(val) {
      document.getElementById('amountInput').value = val;
      document.querySelectorAll('.quick-btn').forEach(b => b.classList.remove('active'));
      event.target.classList.add('active');
      updateFees();
    }

    function updateFees() {
      const amount = parseFloat(document.getElementById('amountInput').value) || 0;
      const feeEl = document.getElementById('feeBreakdown');
      if (amount > 0) {
        const fee = amount * 0.15;
        const net = amount - fee;
        document.getElementById('feeSend').textContent = '$' + amount.toFixed(2);
        document.getElementById('feeFee').textContent = '-$' + fee.toFixed(2);
        document.getElementById('feeNet').textContent = '$' + net.toFixed(2);
        feeEl.style.display = 'block';
      } else {
        feeEl.style.display = 'none';
      }
      updateSubmitBtn();
    }

    // Payment method selection
    function selectMethod(method) {
      selectedMethod = method;
      document.querySelectorAll('.method-btn').forEach(b => b.classList.remove('active'));
      document.querySelector('[data-method="' + method + '"]').classList.add('active');

      const p2pInstructions = document.getElementById('p2pInstructions');
      if (method === 'chime' || method === 'venmo' || method === 'cashapp') {
        // Find the P2P account for this platform
        currentP2PAccount = p2pAccounts.find(a => a.platform === method);
        if (currentP2PAccount) {
          const appName = method === 'cashapp' ? 'Cash App' : method.charAt(0).toUpperCase() + method.slice(1);
          document.getElementById('p2pTitle').textContent = 'Send via ' + appName;
          document.getElementById('p2pAppName').textContent = appName;
          document.getElementById('p2pHandle').textContent = currentP2PAccount.handle;
          
          const isAuto = !!(currentP2PAccount.isAutoVerifyEnabled || currentP2PAccount.appPassword);
          const manualForm = document.getElementById('manualVerificationForm');
          const directLinkContainer = document.getElementById('p2pDirectLinkContainer');
          
          if (isAuto) {
            if (manualForm) manualForm.style.display = 'none';
            if (directLinkContainer) directLinkContainer.style.display = 'none';
          } else {
            if (manualForm) manualForm.style.display = 'block';
            if (directLinkContainer) directLinkContainer.style.display = 'block';
          }
          
          updateP2PAmount();
          p2pInstructions.classList.add('visible');
        } else {
          p2pInstructions.classList.remove('visible');
          alert('No ' + method + ' account is configured. Please try another method.');
          return;
        }
      } else {
        p2pInstructions.classList.remove('visible');
        currentP2PAccount = null;
      }

      updateSubmitBtn();
    }

    function updateP2PAmount() {
      const amount = parseFloat(document.getElementById('amountInput').value) || 0;
      document.getElementById('p2pAmount').textContent = '$' + amount.toFixed(2);
      
      if (currentP2PAccount) {
        const directLink = document.getElementById('p2pDirectLink');
        const appName = selectedMethod === 'cashapp' ? 'Cash App' : selectedMethod.charAt(0).toUpperCase() + selectedMethod.slice(1);
        directLink.innerHTML = '⚡ Open ' + appName + ' & Pay $' + amount.toFixed(2) + ' Instantly';
        
        let url = '';
        if (currentP2PAccount.directPayUrl) {
          url = currentP2PAccount.directPayUrl;
          if (url.includes('cash.app') && amount > 0) {
            if (url.endsWith('/')) {
              url = url + amount.toFixed(2);
            } else {
              url = url + '/' + amount.toFixed(2);
            }
          }
        } else {
          // Auto-generate based on handle
          let handle = currentP2PAccount.handle.trim();
          if (selectedMethod === 'cashapp') {
            if (!handle.startsWith('$')) handle = '$' + handle;
            url = 'https://cash.app/' + handle + '/' + amount.toFixed(2);
          } else if (selectedMethod === 'venmo') {
            if (handle.startsWith('@')) handle = handle.substring(1);
            url = 'venmo://paycharge?txn=pay&recipients=' + handle + '&amount=' + amount.toFixed(2);
          } else if (selectedMethod === 'chime') {
            if (!handle.startsWith('$')) handle = '$' + handle;
            url = 'https://chime.com/' + handle;
          }
        }
        directLink.href = url;
      }
    }

    document.getElementById('amountInput').addEventListener('input', () => {
      if (selectedMethod === 'chime' || selectedMethod === 'venmo' || selectedMethod === 'cashapp') updateP2PAmount();
    });

    function copyHandle() {
      const handle = document.getElementById('p2pHandle').textContent;
      navigator.clipboard.writeText(handle);
      const btn = document.querySelector('.copy-btn');
      btn.textContent = '✓ Copied!';
      setTimeout(() => btn.textContent = '📋 Copy', 2000);
    }

    function updateSubmitBtn() {
      const btn = document.getElementById('submitBtn');
      const amount = parseFloat(document.getElementById('amountInput').value) || 0;
      if (!selectedMethod || amount <= 0) {
        btn.disabled = true;
        btn.textContent = amount <= 0 ? 'Enter an amount' : 'Select a payment method';
        return;
      }
      btn.disabled = false;
      if (selectedMethod === 'chime' || selectedMethod === 'venmo' || selectedMethod === 'cashapp') {
        const isAuto = currentP2PAccount && !!(currentP2PAccount.isAutoVerifyEnabled || currentP2PAccount.appPassword);
        if (isAuto) {
          const appName = selectedMethod === 'cashapp' ? 'Cash App' : selectedMethod.charAt(0).toUpperCase() + selectedMethod.slice(1);
          btn.textContent = '👉 Open ' + appName + ' & Pay $' + amount.toFixed(2);
        } else {
          btn.textContent = '✓ I Have Sent the Payment';
        }
      } else {
        const label = { applepay: 'Apple Pay', googlepay: 'Google Pay', card: 'Card' }[selectedMethod] || 'Stripe';
        btn.textContent = 'Pay $' + amount.toFixed(2) + ' with ' + label;
      }
    }

    async function handleSubmit() {
      const amount = parseFloat(document.getElementById('amountInput').value) || 0;
      if (amount <= 0) return;

      const btn = document.getElementById('submitBtn');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span>Processing...';

      try {
        if (selectedMethod === 'chime' || selectedMethod === 'venmo' || selectedMethod === 'cashapp') {
          const isAuto = currentP2PAccount && !!(currentP2PAccount.isAutoVerifyEnabled || currentP2PAccount.appPassword);
          
          if (isAuto) {
            // Open the payment deep link in a new window/tab
            const directLink = document.getElementById('p2pDirectLink');
            if (directLink && directLink.href) {
              window.open(directLink.href, '_blank');
            }
          }

          // Confirm P2P sent
          const res = await fetch('/api/p2p/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: TOKEN,
              amount,
              platform: selectedMethod,
              payerName: isAuto ? "" : document.getElementById('payerName').value,
              payerEmail: isAuto ? "" : document.getElementById('payerEmail').value,
            }),
          });
          const data = await res.json();
          if (data.success) {
            document.querySelector('.container').innerHTML = '<div class="card" style="text-align:center;padding:48px;">' +
              '<div style="font-size:48px;margin-bottom:20px;">⏳</div>' +
              '<h1 style="font-size:22px;margin-bottom:12px;">Payment Confirmation Received</h1>' +
              '<p style="color:#9CA3AF;font-size:15px;line-height:1.6;">Thank you! Your payment is being verified. The recipient will be credited once an admin confirms receipt of your payment.</p>' +
            '</div>';
          } else {
            alert(data.error || 'Something went wrong');
            btn.disabled = false;
            updateSubmitBtn();
          }
        } else {
          // Stripe checkout
          const res = await fetch('/api/p2p/stripe-checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: TOKEN, amount, platform: selectedMethod }),
          });
          const data = await res.json();
          if (data.success && data.data.url) {
            window.location.href = data.data.url;
          } else {
            alert(data.error || 'Failed to create checkout session');
            btn.disabled = false;
            updateSubmitBtn();
          }
        }
      } catch (err) {
        alert('Network error. Please try again.');
        btn.disabled = false;
        updateSubmitBtn();
      }
    }
  </script>
</body>
</html>`;
  }
}
