import { Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { AuthenticatedRequest, SignupBody, LoginBody, ChangePasswordBody, GoogleAuthBody, ApiResponse, SafeUser } from '../types';
import * as authService from '../services/authService';
import { generateToken } from '../middleware/auth';

const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = new OAuth2Client(googleClientId);

export async function signup(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { name, email, address, password, role }: SignupBody = req.body;

    const existingUser = await authService.findUserByEmail(email);
    if (existingUser) {
      res.status(409).json({ success: false, message: 'Email already registered' } as ApiResponse);
      return;
    }

    const user = await authService.createUser(name, email, address, password, role.toUpperCase() as 'CUSTOMER' | 'STORE_OWNER');
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
    const { email, password, role }: LoginBody = req.body;
    const selectedRole = role.toUpperCase() as 'ADMIN' | 'CUSTOMER' | 'STORE_OWNER';

    const user = await authService.findUserByEmail(email);
    if (!user || !user.password_hash) {
      res.status(401).json({ success: false, message: 'Invalid email or password' } as ApiResponse);
      return;
    }

    if (user.role !== selectedRole) {
      res.status(401).json({ success: false, message: `Invalid credentials for ${selectedRole.toLowerCase()} login` } as ApiResponse);
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

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
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

    const safeUser: SafeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      address: user.address,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    res.json({ success: true, data: safeUser } as ApiResponse);
  } catch (error) {
    console.error('Get me error:', error);
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

    if (!user.password_hash) {
      res.status(400).json({ success: false, message: 'This account uses Google authentication. Please sign in with Google.' } as ApiResponse);
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

export async function googleAuth(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { credential }: GoogleAuthBody = req.body;

    if (!credential) {
      res.status(400).json({ success: false, message: 'Google credential is required' } as ApiResponse);
      return;
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      res.status(401).json({ success: false, message: 'Invalid Google token' } as ApiResponse);
      return;
    }

    if (!payload.email_verified) {
      res.status(401).json({ success: false, message: 'Google email not verified' } as ApiResponse);
      return;
    }

    const googleId = payload.sub;
    const email = payload.email!;
    const name = payload.name || email.split('@')[0];

    let user = await authService.findUserByGoogleId(googleId);

    if (!user) {
      user = await authService.findUserByEmail(email);
      if (user) {
        await authService.linkGoogleId(user.id, googleId);
        user = await authService.findUserById(user.id);
      }
    }

    if (!user) {
      const newUser = await authService.createGoogleUser(name, email, googleId);
      const token = generateToken(newUser.id, newUser.role);
      res.status(201).json({
        success: true,
        message: 'Account created successfully with Google',
        data: { token, user: newUser },
      } as ApiResponse);
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
      message: 'Login successful with Google',
      data: { token, user: safeUser },
    } as ApiResponse);
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ success: false, message: 'Google authentication failed' } as ApiResponse);
  }
}
