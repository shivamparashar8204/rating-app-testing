import { Request } from 'express';

export type UserRole = 'ADMIN' | 'USER' | 'STORE_OWNER';

export interface JwtPayload {
  userId: number;
  role: UserRole;
}

export interface AuthenticatedUser {
  userId: number;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export interface SignupBody {
  name: string;
  email: string;
  address: string;
  password: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

export interface UserRow {
  id: number;
  name: string;
  email: string;
  address: string | null;
  password_hash: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export interface SafeUser {
  id: number;
  name: string;
  email: string;
  address: string | null;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}
