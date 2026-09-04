import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validateSignup, validateLogin, validateChangePassword } from '../middleware/validate';

const router = Router();

router.post('/signup', validateSignup, authController.signup);
router.post('/login', validateLogin, authController.login);
router.post('/google', authController.googleLogin);
router.get('/me', authenticate, authController.getMe);
router.post('/complete-signup', authenticate, authController.completeSignup);
router.put('/change-password', authenticate, validateChangePassword, authController.changePassword);

export default router;
