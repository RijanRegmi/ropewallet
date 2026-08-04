import app from './app.js';
import { connectDB } from './config/db.js';
import dotenv from 'dotenv';
import { startP2PAutomationService } from './services/email_parser.service.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to Database and start server (only if running locally / non-serverless)
const startServer = async () => {
  // Always start HTTP listener on port 5000 first so proxy connections do not get ECONNREFUSED
  if (!process.env.VERCEL) {
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  }

  try {
    await connectDB();
    if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
      startP2PAutomationService(20000);
    }
  } catch (err: any) {
    console.error('Database connection error on server startup:', err.message || err);
  }
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});

export default app;
