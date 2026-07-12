import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

// Protect all routes
router.use(protect);

router.post('/deposit', PaymentController.deposit);
router.post('/transfer', PaymentController.transfer);
router.get('/transactions', PaymentController.getTransactions);

export default router;
