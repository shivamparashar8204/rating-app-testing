import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validateSignup, validateLogin, validateChangePassword } from '../middleware/validate';

const router = Router();

router.post('/signup', validateSignup, authController.signup);
router.post('/login', validateLogin, authController.login);
router.post('/google', authController.googleAuth);
router.put('/change-password', authenticate, validateChangePassword, authController.changePassword);

export default router;
