import { Router } from 'express';
import * as adminController from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';
import { validateAdminCreateUser, validateAdminCreateStore } from '../middleware/validate';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/dashboard', adminController.getDashboard);
router.get('/dashboard/reviews', adminController.getRecentReviews);
router.get('/dashboard/top-stores', adminController.getTopRatedStores);
router.get('/dashboard/recent-customers', adminController.getRecentlyRegisteredCustomers);
router.get('/dashboard/recent-stores', adminController.getRecentlyAddedStores);

router.get('/customers', adminController.getCustomers);
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id', adminController.updateUser);
router.post('/users', validateAdminCreateUser, adminController.createUser);

router.get('/store-owners', adminController.getStoreOwners);

router.get('/stores', adminController.getAllStores);
router.get('/stores/:id', adminController.getStoreById);
router.put('/stores/:id', adminController.updateStore);
router.post('/stores', validateAdminCreateStore, adminController.createStore);

router.get('/ratings', adminController.getAllRatings);
router.get('/ratings/:id', adminController.getRatingById);
router.post('/ratings', adminController.createRating);
router.put('/ratings/:id', adminController.updateRating);
router.delete('/ratings/:id', adminController.deleteRating);

export default router;
