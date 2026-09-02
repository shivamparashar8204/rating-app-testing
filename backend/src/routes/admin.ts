import { Router } from 'express';
import * as adminController from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';
import { validateAdminCreateUser, validateAdminCreateStore } from '../middleware/validate';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/dashboard', adminController.getDashboard);
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.post('/users', validateAdminCreateUser, adminController.createUser);
router.get('/stores', adminController.getAllStores);
router.get('/stores/:id', adminController.getStoreById);
router.post('/stores', validateAdminCreateStore, adminController.createStore);

export default router;
