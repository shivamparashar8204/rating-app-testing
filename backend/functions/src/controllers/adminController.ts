import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../config/firebase-admin';
import * as adminService from '../services/adminService';
import { ApiResponse, UserRole } from '../types';

export async function getDashboard(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const data = await adminService.getDashboardExtended();
    res.json({ success: true, data } as ApiResponse);
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
}

export async function getAllUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const filters = {
      name: typeof req.query.name === 'string' ? req.query.name : undefined,
      email: typeof req.query.email === 'string' ? req.query.email : undefined,
      address: typeof req.query.address === 'string' ? req.query.address : undefined,
      role: typeof req.query.role === 'string' ? req.query.role : undefined,
    };
    const sortBy = typeof req.query.sortBy === 'string' ? req.query.sortBy : 'name';
    const order = req.query.order === 'DESC' ? 'DESC' : 'ASC';

    const users = await adminService.getAllUsers(filters, { sortBy, order });
    res.json({ success: true, data: users } as ApiResponse);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
}

export async function getUserById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    const result = await adminService.getUserById(id);
    if (!result) {
      res.status(404).json({ success: false, message: 'User not found' } as ApiResponse);
      return;
    }
    res.json({ success: true, data: result } as ApiResponse);
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
}

export async function updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    const existingUser = await adminService.findUserByIdForAdmin(id);
    if (!existingUser) {
      res.status(404).json({ success: false, message: 'User not found' } as ApiResponse);
      return;
    }

    if (req.body.email && req.body.email.trim().toLowerCase() !== existingUser.email) {
      const emailCheck = await db.collection('users')
        .where('email', '==', req.body.email.trim().toLowerCase())
        .get();
      const otherUsers = emailCheck.docs.filter((doc) => doc.id !== id);
      if (otherUsers.length > 0) {
        res.status(409).json({ success: false, message: 'Email already registered' } as ApiResponse);
        return;
      }
    }

    const user = await adminService.updateUser(id, req.body);
    res.json({ success: true, message: 'User updated successfully', data: user } as ApiResponse);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
}

export async function getAllStores(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const filters = {
      name: typeof req.query.name === 'string' ? req.query.name : undefined,
      email: typeof req.query.email === 'string' ? req.query.email : undefined,
      address: typeof req.query.address === 'string' ? req.query.address : undefined,
    };
    const sortBy = typeof req.query.sortBy === 'string' ? req.query.sortBy : 'name';
    const order = req.query.order === 'DESC' ? 'DESC' : 'ASC';

    const stores = await adminService.getAllStores(filters, { sortBy, order });
    res.json({ success: true, data: stores } as ApiResponse);
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
}

export async function getStoreById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    const store = await adminService.getStoreById(id);
    if (!store) {
      res.status(404).json({ success: false, message: 'Store not found' } as ApiResponse);
      return;
    }
    res.json({ success: true, data: store } as ApiResponse);
  } catch (error) {
    console.error('Get store details error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
}

export async function updateStore(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    const existingStore = await adminService.getStoreById(id);
    if (!existingStore) {
      res.status(404).json({ success: false, message: 'Store not found' } as ApiResponse);
      return;
    }

    if (req.body.email && req.body.email.trim().toLowerCase() !== existingStore.email) {
      const emailCheck = await db.collection('stores')
        .where('email', '==', req.body.email.trim().toLowerCase())
        .get();
      const otherStores = emailCheck.docs.filter((doc) => doc.id !== id);
      if (otherStores.length > 0) {
        res.status(409).json({ success: false, message: 'Store email already registered' } as ApiResponse);
        return;
      }
    }

    const store = await adminService.updateStore(id, req.body);
    res.json({ success: true, message: 'Store updated successfully', data: store } as ApiResponse);
  } catch (error) {
    console.error('Update store error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
}

export async function createStore(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { name, email, address, storeOwnerId } = req.body;

    const owner = await adminService.findUserByIdForAdmin(storeOwnerId);
    if (!owner) {
      res.status(404).json({ success: false, message: 'Store owner not found' } as ApiResponse);
      return;
    }
    if (owner.role !== 'STORE_OWNER') {
      res.status(400).json({ success: false, message: 'User must have STORE_OWNER role' } as ApiResponse);
      return;
    }

    const existingStoreResult = await db.collection('stores')
      .where('store_owner_id', '==', storeOwnerId)
      .get();
    if (!existingStoreResult.empty) {
      res.status(409).json({ success: false, message: 'This user already owns a store' } as ApiResponse);
      return;
    }

    const store = await adminService.createStore(name, email, address, storeOwnerId);
    res.status(201).json({ success: true, message: 'Store created successfully', data: store } as ApiResponse);
  } catch (error) {
    console.error('Create store error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
}

export async function createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { name, email, address, password, role } = req.body;

    const existingResult = await db.collection('users')
      .where('email', '==', email.trim().toLowerCase())
      .get();
    if (!existingResult.empty) {
      res.status(409).json({ success: false, message: 'Email already registered' } as ApiResponse);
      return;
    }

    const user = await adminService.createUser(name, email, address, password, role);
    res.status(201).json({ success: true, message: 'User created successfully', data: user } as ApiResponse);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
}

export async function getAllRatings(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const filters = {
      customerName: typeof req.query.customerName === 'string' ? req.query.customerName : undefined,
      storeName: typeof req.query.storeName === 'string' ? req.query.storeName : undefined,
      rating: req.query.rating ? parseInt(req.query.rating as string, 10) : undefined,
    };
    const sortBy = typeof req.query.sortBy === 'string' ? req.query.sortBy : 'created_at';
    const order = req.query.order === 'DESC' ? 'DESC' : 'ASC';

    const ratings = await adminService.getAllRatings(filters, { sortBy, order });
    res.json({ success: true, data: ratings } as ApiResponse);
  } catch (error) {
    console.error('Get ratings error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
}

export async function getRatingById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    const rating = await adminService.getRatingById(id);
    if (!rating) {
      res.status(404).json({ success: false, message: 'Rating not found' } as ApiResponse);
      return;
    }
    res.json({ success: true, data: rating } as ApiResponse);
  } catch (error) {
    console.error('Get rating details error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
}

export async function createRating(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { userId, storeId, rating } = req.body;

    const ratingDocId = `${userId}_${storeId}`;
    const existingDoc = await db.collection('ratings').doc(ratingDocId).get();
    if (existingDoc.exists) {
      res.status(409).json({ success: false, message: 'User has already rated this store' } as ApiResponse);
      return;
    }

    const newRating = await adminService.createRating(userId, storeId, rating);
    res.status(201).json({ success: true, message: 'Rating created successfully', data: newRating } as ApiResponse);
  } catch (error) {
    console.error('Create rating error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
}

export async function updateRating(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    const existingRating = await adminService.getRatingById(id);
    if (!existingRating) {
      res.status(404).json({ success: false, message: 'Rating not found' } as ApiResponse);
      return;
    }

    await adminService.updateRating(id, req.body.rating);
    res.json({ success: true, message: 'Rating updated successfully' } as ApiResponse);
  } catch (error) {
    console.error('Update rating error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
}

export async function deleteRating(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    const existingRating = await adminService.getRatingById(id);
    if (!existingRating) {
      res.status(404).json({ success: false, message: 'Rating not found' } as ApiResponse);
      return;
    }

    await adminService.deleteRating(id);
    res.json({ success: true, message: 'Rating deleted successfully' } as ApiResponse);
  } catch (error) {
    console.error('Delete rating error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
}

export async function getRecentReviews(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const reviews = await adminService.getRecentReviews();
    res.json({ success: true, data: reviews } as ApiResponse);
  } catch (error) {
    console.error('Get recent reviews error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
}

export async function getTopRatedStores(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const stores = await adminService.getTopRatedStores();
    res.json({ success: true, data: stores } as ApiResponse);
  } catch (error) {
    console.error('Get top rated stores error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
}

export async function getRecentlyRegisteredCustomers(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const customers = await adminService.getRecentlyRegisteredCustomers();
    res.json({ success: true, data: customers } as ApiResponse);
  } catch (error) {
    console.error('Get recent customers error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
}

export async function getRecentlyAddedStores(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const stores = await adminService.getRecentlyAddedStores();
    res.json({ success: true, data: stores } as ApiResponse);
  } catch (error) {
    console.error('Get recent stores error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
}

export async function getStoreOwners(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const storeOwners = await adminService.getStoreOwnerUsers();
    res.json({ success: true, data: storeOwners } as ApiResponse);
  } catch (error) {
    console.error('Get store owners error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
}

export async function getCustomers(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const customers = await adminService.getCustomerUsers();
    res.json({ success: true, data: customers } as ApiResponse);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
}
