import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { adminProtect } from '../middlewares/admin.middleware.js';

const router = Router();

// Public: Login
router.post('/login', AdminController.login);

// Protected: All below require admin auth
router.use(adminProtect);

// Dashboard
router.get('/dashboard-data', AdminController.getDashboard);

// User Management
router.get('/users', AdminController.listUsers);
router.get('/users/:id', AdminController.getUser);
router.post('/users', AdminController.createUser);
router.put('/users/:id', AdminController.editUser);
router.delete('/users/:id', AdminController.deleteUser);
router.put('/users/:id/freeze', AdminController.freezeUser);
router.put('/users/:id/unfreeze', AdminController.unfreezeUser);

// Pending Deposits
router.get('/deposits', AdminController.listPendingDeposits);
router.put('/deposits/:id/approve', AdminController.approveDeposit);
router.put('/deposits/:id/decline', AdminController.declineDeposit);

// P2P Account Management
router.get('/p2p-accounts', AdminController.listP2PAccounts);
router.post('/p2p-accounts', AdminController.addP2PAccount);
router.put('/p2p-accounts/:id', AdminController.editP2PAccount);
router.delete('/p2p-accounts/:id', AdminController.deleteP2PAccount);

// Export
router.get('/export/transactions', AdminController.exportTransactions);

export default router;
