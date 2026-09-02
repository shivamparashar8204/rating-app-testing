import { Request } from 'express';
import { RowDataPacket } from 'mysql2';

export type UserRole = 'ADMIN' | 'CUSTOMER' | 'STORE_OWNER';

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

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string>;
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
  storeOwnerId: number;
}

export interface CustomerRatingBody {
  storeId: number;
  rating: number;
}

export interface CustomerUpdateRatingBody {
  rating: number;
}

export interface DashboardCounts extends RowDataPacket {
  total_users: number;
  total_stores: number;
  total_ratings: number;
}

export interface StoreWithAvgRating extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  address: string;
  store_owner_id: number;
  avg_rating: number | null;
}

export interface StoreWithUserRating extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  address: string;
  store_owner_id: number;
  avg_rating: number | null;
  user_rating: number | null;
}

export interface RatingWithUser extends RowDataPacket {
  id: number;
  rating: number;
  user_id: number;
  user_name: string;
  user_email: string;
  created_at: Date;
  updated_at: Date;
}

export interface AdminUserDetail extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  address: string | null;
  role: UserRole;
  created_at: Date;
}

export interface AdminStoreDetail extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  address: string;
  store_owner_id: number;
  owner_name: string;
  owner_email: string;
  avg_rating: number | null;
  total_ratings: number;
}

export interface StoreOwnerProfile extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  address: string | null;
  role: UserRole;
  store_id: number;
  store_name: string;
  store_email: string;
  store_address: string;
}
