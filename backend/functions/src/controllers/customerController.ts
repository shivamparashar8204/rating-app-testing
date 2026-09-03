import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as customerService from '../services/customerService';
import * as authService from '../services/authService';
import { ApiResponse } from '../types';

export async function getStores(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' } as ApiResponse);
      return;
    }

    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const stores = await customerService.getAllStores(req.user.uid, search);
    res.json({ success: true, data: stores } as ApiResponse);
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
}

export async function submitRating(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' } as ApiResponse);
      return;
    }

    const { storeId, rating } = req.body;

    const store = await customerService.findStoreById(storeId);
    if (!store) {
      res.status(404).json({ success: false, message: 'Store not found' } as ApiResponse);
      return;
    }

    try {
      const result = await customerService.submitRating(req.user.uid, storeId, rating);
      res.status(201).json({
        success: true,
        message: 'Rating submitted successfully',
        data: { ratingId: result.insertId },
      } as ApiResponse);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'DUPLICATE_RATING') {
        res.status(409).json({ success: false, message: 'You have already rated this store. Use PUT to modify your rating.' } as ApiResponse);
        return;
      }
      throw err;
    }
  } catch (error) {
    console.error('Submit rating error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
}

export async function updateRating(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' } as ApiResponse);
      return;
    }

    const ratingId = req.params.ratingId;
    const existingRating = await customerService.findRatingById(ratingId);
    if (!existingRating) {
      res.status(404).json({ success: false, message: 'Rating not found' } as ApiResponse);
      return;
    }

    if (existingRating.user_id !== req.user.uid) {
      res.status(403).json({ success: false, message: 'You can only modify your own ratings' } as ApiResponse);
      return;
    }

    const { rating } = req.body;
    await customerService.updateRating(ratingId, rating);

    res.json({ success: true, message: 'Rating updated successfully' } as ApiResponse);
  } catch (error) {
    console.error('Update rating error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
}

export async function getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' } as ApiResponse);
      return;
    }

    const user = await authService.findUserById(req.user.uid);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' } as ApiResponse);
      return;
    }

    const { password_hash: _, ...safeUser } = user;
    res.json({ success: true, data: safeUser } as ApiResponse);
  } catch (error) {
    console.error('Customer profile error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
}
