import { Response } from 'express';
import { AuthenticatedRequest, SignupBody, LoginBody, ChangePasswordBody, ApiResponse, SafeUser } from '../types';
import * as authService from '../services/authService';
import { generateToken } from '../middleware/auth';

export async function signup(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { name, email, address, password }: SignupBody = req.body;

    const existingUser = await authService.findUserByEmail(email);
    if (existingUser) {
      res.status(409).json({ success: false, message: 'Email already registered' } as ApiResponse);
      return;
    }

    const user = await authService.createUser(name, email, address, password, 'CUSTOMER');
    const token = generateToken(user.id, user.role);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { token, user },
    } as ApiResponse);
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
}

export async function login(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { email, password }: LoginBody = req.body;

    const user = await authService.findUserByEmail(email);
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password' } as ApiResponse);
      return;
    }

    const isValidPassword = await authService.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      res.status(401).json({ success: false, message: 'Invalid email or password' } as ApiResponse);
      return;
    }

    const token = generateToken(user.id, user.role);
    const safeUser: SafeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      address: user.address,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    res.json({
      success: true,
      message: 'Login successful',
      data: { token, user: safeUser },
    } as ApiResponse);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
}

export async function changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { currentPassword, newPassword }: ChangePasswordBody = req.body;

    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' } as ApiResponse);
      return;
    }

    const user = await authService.findUserById(req.user.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' } as ApiResponse);
      return;
    }

    const isValidPassword = await authService.verifyPassword(currentPassword, user.password_hash);
    if (!isValidPassword) {
      res.status(401).json({ success: false, message: 'Current password is incorrect' } as ApiResponse);
      return;
    }

    if (currentPassword === newPassword) {
      res.status(400).json({ success: false, message: 'New password must be different from current password' } as ApiResponse);
      return;
    }

    await authService.updatePassword(req.user.userId, newPassword);

    res.json({ success: true, message: 'Password updated successfully' } as ApiResponse);
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
}
