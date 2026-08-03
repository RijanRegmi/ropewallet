import { Router } from 'express';
import { P2POrderController } from '../controllers/p2p_order.controller.js';

const router = Router();

// Public: Get host info for payment selection page
router.get('/host/:userTag', P2POrderController.getHostInfo);

// Public: Create order gateway link
router.post('/create-order', P2POrderController.createOrder);

// Public: Get order status and remaining countdown timer
router.get('/order/:orderId', P2POrderController.getOrder);

// Admin: Get flagged/unmatched orders needing manual transfer review
router.get('/flagged-orders', P2POrderController.getFlaggedOrders);

// Admin: Manually approve & transfer verified order to host
router.post('/manual-approve/:orderId', P2POrderController.manualApproveOrder);

export default router;
