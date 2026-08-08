import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { adminProtect, superAdminOnly } from '../middlewares/admin.middleware.js';

const router = Router();

// Public: Login & Logout
router.post('/login', AdminController.login);
router.post('/logout', (req, res) => {
  res.clearCookie('admin_token', { httpOnly: true, sameSite: 'lax' });
  res.json({ success: true, message: 'Logged out' });
});

// Protected: All below require admin auth
router.use(adminProtect);

// Admin Profile
router.get('/me', AdminController.getCurrentAdmin);

// Dashboard
router.get('/dashboard-data', AdminController.getDashboard);

// User Management
router.get('/users', AdminController.listUsers);
router.get('/users/:id', AdminController.getUser);
router.post('/users', superAdminOnly, AdminController.createUser);
router.put('/users/:id', AdminController.editUser);
router.delete('/users/:id', AdminController.deleteUser);
router.put('/users/:id/freeze', AdminController.freezeUser);
router.put('/users/:id/unfreeze', AdminController.unfreezeUser);
router.put('/users/:id/role', AdminController.updateUserRole);

// Pending Deposits
router.get('/deposits', AdminController.listPendingDeposits);
router.put('/deposits/:id/approve', AdminController.approveDeposit);
router.put('/deposits/:id/decline', AdminController.declineDeposit);

// Host Payout / Cashout Requests (Super Admin approval required)
router.get('/payouts', superAdminOnly, AdminController.listPendingPayouts);
router.put('/payouts/:id/approve', superAdminOnly, AdminController.approvePayout);
router.put('/payouts/:id/decline', superAdminOnly, AdminController.declinePayout);

// P2P Account Management
router.get('/p2p-accounts', AdminController.listP2PAccounts);
router.post('/p2p-accounts', AdminController.addP2PAccount);
router.put('/p2p-accounts/:id', AdminController.editP2PAccount);
router.delete('/p2p-accounts/:id', AdminController.deleteP2PAccount);

// Super Admin Transaction Records & Revenue Summary
router.get('/all-transactions', superAdminOnly, AdminController.getAllTransactions);

// Super Admin Audit Activity Logs
router.get('/audit-logs', superAdminOnly, AdminController.getAuditLogs);

import { NoticeController } from '../controllers/notice.controller.js';

// Notice Center Management
router.get('/notices', NoticeController.getAdminNotices);
router.post('/notices', NoticeController.createNotice);
router.delete('/notices/:id', NoticeController.deleteNotice);

// Export
router.get('/export/transactions', AdminController.exportTransactions);

export default router;
