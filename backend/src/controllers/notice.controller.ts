import { Request, Response, NextFunction } from 'express';
import { Notice } from '../models/notice.model.js';
import { User } from '../models/user.model.js';
import { sendPushNotification } from '../services/push_notification.service.js';

export class NoticeController {
  // Admin: Create notice
  static async createNotice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, content, category, targetType, targetUserIds } = req.body;

      if (!title || !content) {
        res.status(400).json({ success: false, error: 'Title and content are required' });
        return;
      }

      const notice = await Notice.create({
        title: title.trim(),
        content: content.trim(),
        category: category || 'info',
        targetType: ['all', 'customers', 'hosts', 'specific'].includes(targetType) ? targetType : 'all',
        targetUsers: targetType === 'specific' && Array.isArray(targetUserIds) ? targetUserIds : [],
        createdBy: (req as any).admin?.id || (req as any).admin?._id || (req as any).user?.id || (req as any).user?._id,
        readBy: [],
      });

      // Async FCM Push Dispatch
      (async () => {
        try {
          let query: any = { fcmToken: { $exists: true, $ne: '' } };
          if (targetType === 'specific' && Array.isArray(targetUserIds) && targetUserIds.length > 0) {
            query._id = { $in: targetUserIds };
          } else if (targetType === 'customers') {
            query.role = 'customer';
          } else if (targetType === 'hosts') {
            query.role = { $in: ['host', 'admin', 'superadmin'] };
          }

          const recipients = await User.find(query).select('fcmToken');
          for (const u of recipients) {
            if ((u as any).fcmToken) {
              await sendPushNotification((u as any).fcmToken, title.trim(), content.trim(), {
                type: 'notice',
                noticeId: (notice._id as any).toString(),
                category: category || 'info',
              });
            }
          }
        } catch (pushErr) {
          console.error('[NoticeController] Async FCM push dispatch error:', pushErr);
        }
      })();

      res.status(201).json({
        success: true,
        message: 'Notice posted successfully',
        data: notice,
      });
    } catch (error) {
      next(error);
    }
  }

  // Admin: Get all posted notices
  static async getAdminNotices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const notices = await Notice.find()
        .populate('targetUsers', 'fullName userTag email role')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: notices,
      });
    } catch (error) {
      next(error);
    }
  }

  // Admin: Delete notice
  static async deleteNotice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const notice = await Notice.findByIdAndDelete(id);

      if (!notice) {
        res.status(404).json({ success: false, error: 'Notice not found' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Notice deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // User: Get notices applicable to current user
  static async getUserNotices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      const userRole = (req as any).user?.role || 'customer';

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const roleTarget = ['host', 'admin', 'superadmin'].includes(userRole) ? 'hosts' : 'customers';

      // Match notices where targetType is 'all' OR targetType matches role OR targetUsers contains current userId
      const notices = await Notice.find({
        $or: [
          { targetType: 'all' },
          { targetType: roleTarget },
          { targetUsers: userId },
        ],
      }).sort({ createdAt: -1 });

      // Transform response to include isRead boolean for this user
      const formatted = notices.map((n) => {
        const isRead = n.readBy.some((id) => id.toString() === userId.toString());
        return {
          _id: n._id,
          title: n.title,
          content: n.content,
          category: n.category,
          targetType: n.targetType,
          createdAt: n.createdAt,
          isRead,
        };
      });

      res.status(200).json({
        success: true,
        data: formatted,
      });
    } catch (error) {
      next(error);
    }
  }

  // User: Mark notice as read
  static async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      await Notice.findByIdAndUpdate(id, {
        $addToSet: { readBy: userId },
      });

      res.status(200).json({
        success: true,
        message: 'Notice marked as read',
      });
    } catch (error) {
      next(error);
    }
  }
}
