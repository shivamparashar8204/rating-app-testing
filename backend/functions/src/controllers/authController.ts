import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as authService from '../services/authService';
import { ChangePasswordBody, ApiResponse, UserRole } from '../types';

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' } as ApiResponse);
      return;
    }

    const user = await authService.findUserById(req.user.uid);
    if (!user) {
      res.status(404).json({ success: false, message: 'User profile not found' } as ApiResponse);
      return;
    }

    const { password_hash: _, ...safeUser } = user;
    res.json({ success: true, data: safeUser } as ApiResponse);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
}

export async function signup(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { name, email, address, role } = req.body;

    const validSignupRoles: UserRole[] = ['CUSTOMER', 'STORE_OWNER'];
    const selectedRole = (role || 'CUSTOMER').toUpperCase() as UserRole;
    if (!validSignupRoles.includes(selectedRole)) {
      res.status(400).json({ success: false, message: 'Role must be either CUSTOMER or STORE_OWNER' } as ApiResponse);
      return;
    }

    const existingUser = await authService.findUserByEmail(email);
    if (existingUser) {
      res.status(409).json({ success: false, message: 'Email already registered' } as ApiResponse);
      return;
    }

    const user = await authService.createUser(name, email, address, '', selectedRole);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user },
    } as ApiResponse);
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
}

export async function completeSignup(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' } as ApiResponse);
      return;
    }

    const { name, address, role } = req.body;

    const validSignupRoles: UserRole[] = ['CUSTOMER', 'STORE_OWNER'];
    const selectedRole = (role || 'CUSTOMER').toUpperCase() as UserRole;
    if (!validSignupRoles.includes(selectedRole)) {
      res.status(400).json({ success: false, message: 'Role must be either CUSTOMER or STORE_OWNER' } as ApiResponse);
      return;
    }

    const existingUser = await authService.findUserById(req.user.uid);
    if (existingUser) {
      res.status(409).json({ success: false, message: 'Profile already exists' } as ApiResponse);
      return;
    }

    const fbUser = await authService.findFirebaseUser(req.user.uid);
    const user = await authService.createUserFromFirebase(
      req.user.uid,
      name || fbUser?.displayName || '',
      address || '',
      selectedRole,
      fbUser?.email || ''
    );

    res.status(201).json({
      success: true,
      message: 'Profile created successfully',
      data: { user },
    } as ApiResponse);
  } catch (error) {
    console.error('Complete signup error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
}

export async function changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { newPassword }: ChangePasswordBody = req.body;

    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' } as ApiResponse);
      return;
    }

    const user = await authService.findUserById(req.user.uid);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' } as ApiResponse);
      return;
    }

    await authService.updatePassword(req.user.uid, newPassword);

    res.json({ success: true, message: 'Password updated successfully' } as ApiResponse);
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
}
