import app from './app.js';
import { connectDB } from './config/db.js';
import dotenv from 'dotenv';
import { startP2PAutomationService } from './services/email_parser.service.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to Database and start server (only if running locally / non-serverless)
const startServer = async () => {
  await connectDB();
  
  // Start background P2P deposit automated email polling ONLY in persistent server environments
  if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
    startP2PAutomationService(20000);
    app.listen(PORT, () => {
      console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  }
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});

export default app;
