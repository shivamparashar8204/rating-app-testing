import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validateChangePassword } from '../middleware/validate';

const router = Router();

router.get('/me', authenticate, authController.getMe);
router.post('/complete-signup', authenticate, authController.completeSignup);
router.post('/signup', authenticate, authController.signup);
router.put('/change-password', authenticate, validateChangePassword, authController.changePassword);

export default router;
