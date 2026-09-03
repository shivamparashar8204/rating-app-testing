import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as storeOwnerService from '../services/storeOwnerService';
import { ApiResponse } from '../types';

export async function getDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' } as ApiResponse);
      return;
    }

    const data = await storeOwnerService.getDashboard(req.user.uid);
    if (!data) {
      res.status(404).json({ success: false, message: 'Store not found for this owner' } as ApiResponse);
      return;
    }

    res.json({ success: true, data } as ApiResponse);
  } catch (error) {
    console.error('Store owner dashboard error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
}

export async function getRatings(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' } as ApiResponse);
      return;
    }

    const ratings = await storeOwnerService.getRatingsForStore(req.user.uid);
    res.json({ success: true, data: ratings } as ApiResponse);
  } catch (error) {
    console.error('Store owner ratings error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
}

export async function getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' } as ApiResponse);
      return;
    }

    const profile = await storeOwnerService.getProfile(req.user.uid);
    if (!profile) {
      res.status(404).json({ success: false, message: 'User not found' } as ApiResponse);
      return;
    }

    res.json({ success: true, data: profile } as ApiResponse);
  } catch (error) {
    console.error('Store owner profile error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
}
