import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as authService from '../services/authService';
import { db } from '../config/firebase-admin';
import { ApiResponse, UserRole, SafeUser } from '../types';

function generateToken(userId: string, role: UserRole): string {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ uid: userId, role }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '7d' });
}

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

export async function signup(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, address, password, role } = req.body;

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

    const user = await authService.createUser(name, email, address, password, selectedRole);
    const token = generateToken(user.id, user.role);

    res.status(201).json({
      success: true,
      message: 'Signup completed successfully',
      data: { token, user },
    } as ApiResponse);
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, role } = req.body;

    const validRoles: UserRole[] = ['ADMIN', 'CUSTOMER', 'STORE_OWNER'];
    const selectedRole = (role || '').toUpperCase() as UserRole;
    if (!validRoles.includes(selectedRole)) {
      res.status(400).json({ success: false, message: 'Invalid role' } as ApiResponse);
      return;
    }

    const user = await authService.findUserByEmail(email);
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password' } as ApiResponse);
      return;
    }

    if (user.role !== selectedRole) {
      res.status(403).json({ success: false, message: `This account is not registered as ${selectedRole}` } as ApiResponse);
      return;
    }

    const isValidPassword = await authService.verifyPassword(email, password);
    if (!isValidPassword) {
      res.status(401).json({ success: false, message: 'Invalid email or password' } as ApiResponse);
      return;
    }

    const { password_hash: _, ...safeUser } = user;
    const token = generateToken(user.id, user.role);

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

export async function googleLogin(req: Request, res: Response): Promise<void> {
  try {
    const { credential } = req.body;
    const admin = require('firebase-admin');

    const decodedToken = await admin.auth().verifyIdToken(credential);
    const { uid, email, name } = decodedToken;

    const existingUser = await authService.findUserById(uid);
    let user: SafeUser;
    if (existingUser) {
      const { password_hash: _, ...safeUser } = existingUser;
      user = safeUser;
    } else {
      user = await authService.createUserFromFirebase(uid, name || email?.split('@')[0] || 'User', '', 'CUSTOMER', email || '');
    }

    const token = generateToken(uid, user.role);

    res.json({
      success: true,
      message: 'Google login successful',
      data: { token, user },
    } as ApiResponse);
  } catch (error) {
    console.error('Google login error:', error);
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

    const token = generateToken(req.user.uid, user.role);

    res.status(201).json({
      success: true,
      message: 'Profile created successfully',
      data: { token, user },
    } as ApiResponse);
  } catch (error) {
    console.error('Complete signup error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
}

export async function changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { currentPassword, newPassword }: { currentPassword: string; newPassword: string } = req.body;

    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' } as ApiResponse);
      return;
    }

    const user = await authService.findUserById(req.user.uid);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' } as ApiResponse);
      return;
    }

    if (!user.password_hash) {
      res.status(400).json({ success: false, message: 'This account uses Google authentication. Please sign in with Google.' } as ApiResponse);
      return;
    }

    if (currentPassword === newPassword) {
      res.status(400).json({ success: false, message: 'New password must be different from current password' } as ApiResponse);
      return;
    }

    const isValidPassword = await authService.verifyPassword(user.email, currentPassword);
    if (!isValidPassword) {
      res.status(401).json({ success: false, message: 'Current password is incorrect' } as ApiResponse);
      return;
    }

    const passwordHash = require('bcryptjs').hashSync(newPassword, 10);
    await db.collection('users').doc(req.user.uid).update({
      password_hash: passwordHash,
      updated_at: require('firebase-admin').firestore.FieldValue.serverTimestamp(),
    });

    res.json({ success: true, message: 'Password updated successfully' } as ApiResponse);
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
}
