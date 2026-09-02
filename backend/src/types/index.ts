import { Request } from 'express';

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
  role: UserRole;
}

export interface LoginBody {
  email: string;
  password: string;
  role: UserRole;
}

export interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

export interface GoogleAuthBody {
  credential: string;
}

export interface UserRow {
  id: number;
  name: string;
  email: string;
  address: string | null;
  password_hash: string | null;
  google_id: string | null;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export interface StoreRow {
  id: number;
  name: string;
  email: string;
  address: string;
  store_owner_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface RatingRow {
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

export interface AdminUpdateUserBody {
  name?: string;
  email?: string;
  address?: string;
  password?: string;
  role?: UserRole;
}

export interface AdminCreateStoreBody {
  name: string;
  email: string;
  address: string;
  storeOwnerId: number;
}

export interface AdminUpdateStoreBody {
  name?: string;
  email?: string;
  address?: string;
}

export interface AdminCreateRatingBody {
  userId: number;
  storeId: number;
  rating: number;
}

export interface AdminUpdateRatingBody {
  rating: number;
}

export interface AdminRatingDetail {
  id: number;
  rating: number;
  user_id: number;
  user_name: string;
  user_email: string;
  store_id: number;
  store_name: string;
  store_email: string;
  created_at: Date;
  updated_at: Date;
}

export interface CustomerRatingBody {
  storeId: number;
  rating: number;
}

export interface CustomerUpdateRatingBody {
  rating: number;
}

export interface DashboardCounts {
  total_users: number;
  total_stores: number;
  total_ratings: number;
}

export interface StoreWithAvgRating {
  id: number;
  name: string;
  email: string;
  address: string;
  store_owner_id: number;
  avg_rating: number | null;
}

export interface StoreWithUserRating {
  id: number;
  name: string;
  email: string;
  address: string;
  store_owner_id: number;
  avg_rating: number | null;
  user_rating: number | null;
}

export interface RatingWithUser {
  id: number;
  rating: number;
  user_id: number;
  user_name: string;
  user_email: string;
  created_at: Date;
  updated_at: Date;
}

export interface AdminUserDetail {
  id: number;
  name: string;
  email: string;
  address: string | null;
  role: UserRole;
  created_at: Date;
}

export interface AdminStoreDetail {
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

export interface StoreOwnerProfile {
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
