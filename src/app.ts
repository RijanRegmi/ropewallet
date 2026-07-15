import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import { rateLimit } from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import adminRoutes from './routes/admin.routes.js';
import p2pRoutes from './routes/p2p.routes.js';
import { PaymentController } from './controllers/payment.controller.js';
import { AdminController } from './controllers/admin.controller.js';
import { P2PController } from './controllers/p2p.controller.js';
import { adminProtect } from './middlewares/admin.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { connectDB } from './config/db.js';

const app = express();

// Ensure DB is connected for every request (critical for serverless)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection middleware error:', error);
    res.status(500).json({ success: false, error: 'Database connection failed' });
  }
});

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for admin portal
}));
app.use(mongoSanitize()); // Prevent NoSQL Injection
app.use(cookieParser());  // Parse cookies for admin auth

// CORS configuration
app.use(cors({
  credentials: true,
  origin: true, // Allow all origins with credentials
}));

// Limit JSON payload size to prevent DOS (with rawBody capture for Stripe webhooks)
app.use(express.json({
  limit: '10kb',
  verify: (req: any, res, buf) => {
    if (req.originalUrl.startsWith('/api/webhook') || req.originalUrl.startsWith('/api/p2p')) {
      req.rawBody = buf;
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Global Rate Limiter (Max 100 requests per 15 mins)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests from this IP, please try again after 15 minutes' },
});
app.use('/api', globalLimiter);

// Strict Rate Limiter for Authentication (Max 10 requests per 15 mins)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many authentication attempts, please try again after 15 minutes' },
});

// Welcome root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to RopeWallet Backend API!' });
});

// ─── Admin Portal Pages (Server-Rendered HTML) ─────────────────
app.get('/admin', AdminController.renderLoginPage);
app.get('/admin/dashboard', adminProtect, AdminController.renderDashboardPage);
app.get('/admin/users', adminProtect, AdminController.renderUsersPage);
app.get('/admin/deposits', adminProtect, AdminController.renderDepositsPage);
app.get('/admin/p2p-accounts', adminProtect, AdminController.renderP2PAccountsPage);
app.get('/admin/logout', AdminController.logout);

// ─── P2P Payment Pages (Public, Server-Rendered HTML) ──────────
app.get('/pay', P2PController.renderPaymentPage);
app.get('/pay/success', P2PController.renderPaymentSuccess);
app.get('/success', PaymentController.renderSuccess);
app.get('/cancel', PaymentController.renderCancel);

// ─── API Routes ────────────────────────────────────────────────
app.post('/api/webhook', PaymentController.handleWebhook);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/p2p', p2pRoutes);

// Catch 404 routes
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'API route not found' });
});

// Error handling Middleware
app.use(errorHandler);

export default app;
