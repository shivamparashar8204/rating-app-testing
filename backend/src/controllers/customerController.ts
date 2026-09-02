import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import * as customerService from '../services/customerService';
import * as authService from '../services/authService';
import pool from '../config/database';

export async function getStores(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' } as ApiResponse);
      return;
    }

    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const stores = await customerService.getAllStores(req.user.userId, search);
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

    const [existingRows] = await pool.query(
      'SELECT id FROM ratings WHERE user_id = ? AND store_id = ?',
      [req.user.userId, storeId]
    ) as [{ id: number }[], unknown];
    const existingRating = (existingRows as { id: number }[])[0];
    if (existingRating) {
      res.status(409).json({ success: false, message: 'You have already rated this store. Use PUT to modify your rating.' } as ApiResponse);
      return;
    }

    const result = await customerService.submitRating(req.user.userId, storeId, rating);
    res.status(201).json({
      success: true,
      message: 'Rating submitted successfully',
      data: { ratingId: result.insertId },
    } as ApiResponse);
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

    const ratingId = parseInt(req.params.ratingId, 10);
    if (isNaN(ratingId)) {
      res.status(400).json({ success: false, message: 'Invalid rating ID' } as ApiResponse);
      return;
    }

    const existingRating = await customerService.findRatingById(ratingId);
    if (!existingRating) {
      res.status(404).json({ success: false, message: 'Rating not found' } as ApiResponse);
      return;
    }

    if (existingRating.user_id !== req.user.userId) {
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

    const user = await authService.findUserById(req.user.userId);
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
