import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/check-usertag', AuthController.checkUserTag);
router.post('/send-register-otp', AuthController.sendRegisterOtp);
router.post('/verify-register-otp', AuthController.verifyRegisterOtp);
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/verify-forgot-password-otp', AuthController.verifyForgotPasswordOtp);
router.post('/reset-password', AuthController.resetPassword);
router.post('/set-pin', protect, AuthController.setPin);
router.post('/verify-pin', protect, AuthController.verifyPin);
router.get('/me', protect, AuthController.getMe);
router.post('/update-profile-image', protect, AuthController.updateProfileImage);
router.post('/send-update-otp', protect, AuthController.sendUpdateOtp);
router.post('/change-password', protect, AuthController.changePassword);
router.post('/change-pin', protect, AuthController.changePin);

export default router;
