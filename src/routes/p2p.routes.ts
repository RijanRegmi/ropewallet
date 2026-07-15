import { Router } from 'express';
import { P2PController } from '../controllers/p2p.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

// Public routes (for guest payers)
router.get('/request/:token', P2PController.getPaymentRequest);
router.get('/receiver/:tag', P2PController.getReceiverProfile);
router.post('/confirm', P2PController.confirmP2PSent);
router.post('/stripe-checkout', P2PController.createStripeP2PCheckout);

// Protected routes (for authenticated RopeWallet users)
router.post('/create-request', protect, P2PController.createPaymentRequest);

export default router;
