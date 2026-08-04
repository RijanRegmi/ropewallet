import { Router } from 'express';
import { NoticeController } from '../controllers/notice.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { adminProtect } from '../middlewares/admin.middleware.js';

const router = Router();

// User Notice Endpoints (Requires User Auth)
router.get('/', protect, NoticeController.getUserNotices);
router.post('/:id/read', protect, NoticeController.markAsRead);

// Admin Notice Endpoints (Requires Admin Auth)
router.get('/admin', adminProtect, NoticeController.getAdminNotices);
router.post('/admin', adminProtect, NoticeController.createNotice);
router.delete('/admin/:id', adminProtect, NoticeController.deleteNotice);

export default router;
