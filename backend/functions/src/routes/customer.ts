import { Router } from 'express';
import * as customerController from '../controllers/customerController';
import { authenticate, authorize } from '../middleware/auth';
import { validateCustomerRating, validateCustomerUpdateRating } from '../middleware/validate';

const router = Router();

router.use(authenticate);
router.use(authorize('CUSTOMER'));

router.get('/stores', customerController.getStores);
router.post('/ratings', validateCustomerRating, customerController.submitRating);
router.put('/ratings/:ratingId', validateCustomerUpdateRating, customerController.updateRating);
router.get('/profile', customerController.getProfile);

export default router;
