import { Request } from 'express';
import { RowDataPacket } from 'mysql2';

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

export interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  address: string | null;
  password_hash: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export interface StoreRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  address: string;
  store_owner_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface RatingRow extends RowDataPacket {
  id: number;
  user_id: number;
  store_id: number;
  rating: number;
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

export interface AdminCreateUserBody {
  name: string;
  email: string;
  address: string;
  password: string;
  role: UserRole;
}

export interface AdminCreateStoreBody {
  name: string;
  email: string;
  address: string;
  store_owner_id: number;
}

export interface RatingBody {
  store_id: number;
  rating: number;
}

export interface DashboardCounts extends RowDataPacket {
  total_users: number;
  total_stores: number;
  total_ratings: number;
}

export interface StoreWithRating extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  address: string;
  store_owner_id: number;
  avg_rating: number | null;
}

export interface RatingWithUser extends RowDataPacket {
  id: number;
  rating: number;
  user_id: number;
  user_name: string;
  user_email: string;
}

export interface StoreOwnerDashboard extends RowDataPacket {
  store_id: number;
  store_name: string;
  avg_rating: number | null;
}
