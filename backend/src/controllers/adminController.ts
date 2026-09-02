import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse, UserRow, StoreRow } from '../types';
import * as adminService from '../services/adminService';
import pool from '../config/database';

export async function getDashboard(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const data = await adminService.getDashboard();
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
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid user ID' } as ApiResponse);
      return;
    }

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
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid store ID' } as ApiResponse);
      return;
    }

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

    const existingStoreResult = await pool.query<StoreRow>(
      'SELECT id FROM stores WHERE store_owner_id = $1',
      [storeOwnerId]
    );
    if (existingStoreResult.rows.length > 0) {
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

    const existingResult = await pool.query<UserRow>(
      'SELECT id FROM users WHERE email = $1',
      [email.trim().toLowerCase()]
    );
    if (existingResult.rows.length > 0) {
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
