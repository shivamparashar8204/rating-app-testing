import { Router } from 'express';
import * as storeOwnerController from '../controllers/storeOwnerController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize('STORE_OWNER'));

router.get('/dashboard', storeOwnerController.getDashboard);
router.get('/ratings', storeOwnerController.getRatings);
router.get('/profile', storeOwnerController.getProfile);

export default router;
