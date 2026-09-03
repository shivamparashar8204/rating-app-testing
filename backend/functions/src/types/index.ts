export type UserRole = 'ADMIN' | 'CUSTOMER' | 'STORE_OWNER';

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

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  address: string | null;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export interface UserRow {
  id: string;
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
  id: string;
  name: string;
  email: string;
  address: string;
  store_owner_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface RatingRow {
  id: string;
  user_id: string;
  store_id: string;
  rating: number;
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
  storeOwnerId: string;
}

export interface AdminUpdateStoreBody {
  name?: string;
  email?: string;
  address?: string;
}

export interface AdminCreateRatingBody {
  userId: string;
  storeId: string;
  rating: number;
}

export interface AdminUpdateRatingBody {
  rating: number;
}

export interface AdminRatingDetail {
  id: string;
  rating: number;
  user_id: string;
  user_name: string;
  user_email: string;
  store_id: string;
  store_name: string;
  store_email: string;
  created_at: Date;
  updated_at: Date;
}

export interface CustomerRatingBody {
  storeId: string;
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
  id: string;
  name: string;
  email: string;
  address: string;
  store_owner_id: string;
  avg_rating: number | null;
}

export interface StoreWithUserRating {
  id: string;
  name: string;
  email: string;
  address: string;
  store_owner_id: string;
  avg_rating: number | null;
  user_rating: number | null;
}

export interface RatingWithUser {
  id: string;
  rating: number;
  user_id: string;
  user_name: string;
  user_email: string;
  created_at: Date;
  updated_at: Date;
}

export interface AdminUserDetail {
  id: string;
  name: string;
  email: string;
  address: string | null;
  role: UserRole;
  created_at: Date;
}

export interface AdminStoreDetail {
  id: string;
  name: string;
  email: string;
  address: string;
  store_owner_id: string;
  owner_name: string;
  owner_email: string;
  avg_rating: number | null;
  total_ratings: number;
}

export interface StoreOwnerProfile {
  id: string;
  name: string;
  email: string;
  address: string | null;
  role: UserRole;
  store_id: string;
  store_name: string;
  store_email: string;
  store_address: string;
}
