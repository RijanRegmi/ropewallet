import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import { rateLimit } from 'express-rate-limit';
import authRoutes from './routes/auth.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import { PaymentController } from './controllers/payment.controller.js';
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
app.use(helmet()); // Set secure HTTP headers
app.use(mongoSanitize()); // Prevent NoSQL Injection

// CORS configuration
app.use(cors());

// Limit JSON payload size to prevent DOS (with rawBody capture for Stripe webhooks)
app.use(express.json({
  limit: '10kb',
  verify: (req: any, res, buf) => {
    if (req.originalUrl.startsWith('/api/webhook')) {
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

// Render-hosted Pages
app.get('/pay', PaymentController.renderPaymentPortal);
app.get('/success', PaymentController.renderSuccess);
app.get('/cancel', PaymentController.renderCancel);

// Routes
app.post('/api/webhook', PaymentController.handleWebhook);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/payments', paymentRoutes);

// Catch 404 routes
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'API route not found' });
});

// Error handling Middleware
app.use(errorHandler);

export default app;
