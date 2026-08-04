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
import noticeRoutes from './routes/notice.routes.js';
import { PaymentController } from './controllers/payment.controller.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { connectDB } from './config/db.js';

const app = express();

// Enable trust proxy for Vercel / reverse proxy environment (required by express-rate-limit)
app.set('trust proxy', 1);

// Health & Environment verification endpoint (runs before DB connection middleware)
app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    success: true,
    message: 'RopeWallet API Service Active',
    isVercel: !!process.env.VERCEL,
    envCheck: {
      hasMongoUri: !!process.env.MONGODB_URI,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
      hasCardEncryptionKey: !!process.env.CARD_ENCRYPTION_KEY,
    }
  });
});

// ─── Security & Utility Middlewares ────────────────────────────
// Helmet Security Headers (Runs on every response)
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for admin portal
  crossOriginEmbedderPolicy: false,
  xFrameOptions: { action: 'sameorigin' },
  xContentTypeOptions: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// NoSQL Injection Defense: Strip/replace Mongo operators ($ne, $gt, etc.) from body, params, query
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    mongoSanitize.sanitize(req.body, { replaceWith: '_' });
  }
  if (req.params && typeof req.params === 'object') {
    mongoSanitize.sanitize(req.params, { replaceWith: '_' });
  }
  if (req.query && typeof req.query === 'object') {
    try {
      mongoSanitize.sanitize(req.query, { replaceWith: '_' });
    } catch {
      // express 5 req.query getter safeguard
    }
  }
  next();
});

app.use(cookieParser());  // Parse cookies for admin auth

// CORS configuration
app.use(cors({
  credentials: true,
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    return callback(null, origin);
  },
}));

// Limit JSON payload size to 10MB to support profile image uploads
app.use(express.json({
  limit: '10mb',
  verify: (req: any, res, buf) => {
    const url = req.originalUrl || req.url || '';
    if (url.startsWith('/api/webhook') || url.startsWith('/api/p2p')) {
      req.rawBody = buf;
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global Rate Limiter (Max 100 requests per 15 mins)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  message: { success: false, error: 'Too many requests from this IP, please try again after 15 minutes' },
});
app.use('/api', globalLimiter as any);

// Strict Rate Limiter for Auth & Admin Login (Max 10 requests per 15 mins)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  message: { success: false, error: 'Too many authentication attempts, please try again after 15 minutes' },
});

// Normalize URL paths for Vercel Serverless environment
app.use((req, res, next) => {
  if (!req.url.startsWith('/api') && req.url !== '/') {
    req.url = '/api' + req.url;
  }
  next();
});

// Health & Environment verification endpoint (runs before DB connection middleware)
app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    success: true,
    message: 'RopeWallet API Service Active',
    isVercel: !!process.env.VERCEL,
    envCheck: {
      hasMongoUri: !!process.env.MONGODB_URI,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
      hasCardEncryptionKey: !!process.env.CARD_ENCRYPTION_KEY,
    }
  });
});

// Welcome root endpoint
app.get('/', (req, res) => {
  res.json({ success: true, message: 'RopeWallet Layered REST API Service Running' });
});

// Early Access Control Validation: Reject unauthenticated calls immediately with 401
app.use(['/api/admin', '/admin'], (req, res, next) => {
  if (req.path === '/login' || req.path === '/logout') return next();
  const token = (req.headers.authorization?.startsWith('Bearer ') && req.headers.authorization.split(' ')[1]) || req.cookies?.admin_token;
  if (!token) {
    res.status(401).json({ success: false, error: 'Admin authentication required' });
    return;
  }
  next();
});

// Database connection middleware
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error: any) {
    console.error('Database connection middleware error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: `Database Connection Failed: ${error.message || 'Check MONGODB_URI in Vercel Environment Variables'}`
      });
    }
  }
});

import p2pOrderRoutes from './routes/p2p_order.routes.js';

// ─── API Routes ────────────────────────────────────────────────
app.post(['/api/webhook', '/webhook'], PaymentController.handleWebhook);
app.use(['/api/auth', '/auth'], authLimiter as any, authRoutes);
app.use(['/api/admin/login', '/admin/login'], authLimiter as any); // Protect admin login from brute force attacks
app.use(['/api/admin', '/admin'], adminRoutes);
app.use(['/api/payments', '/payments'], paymentRoutes);
app.use(['/api/p2p', '/p2p'], p2pRoutes);
app.use(['/api/pay', '/pay'], p2pOrderRoutes);
app.use(['/api/notices', '/notices'], noticeRoutes);

// Catch 404 routes
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'API route not found' });
});

// Error handling Middleware
app.use(errorHandler);

export default app;
