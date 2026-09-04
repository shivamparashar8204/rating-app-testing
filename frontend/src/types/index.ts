export type UserRole = 'ADMIN' | 'CUSTOMER' | 'STORE_OWNER';

export interface User {
  id: string;
  name: string;
  email: string;
  address: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface Store {
  id: string;
  name: string;
  email: string;
  address: string;
  store_owner_id: string;
  avg_rating: number | null;
  user_rating: number | null;
}

export interface Rating {
  id: string;
  rating: number;
  user_id: string;
  user_name: string;
  user_email: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardData {
  total_users: number;
  total_customers: number;
  total_store_owners: number;
  total_stores: number;
  total_ratings: number;
  avg_rating: number | null;
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  cuisine: string;
  rating: number;
  reviewCount: number;
  image: string;
}

export interface Review {
  id: string;
  userName: string;
  date: string;
  rating: number;
  text: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  role: UserRole;
}

export interface SignupData {
  name: string;
  email: string;
  address: string;
  password: string;
  role: UserRole;
}

export interface AdminUserDetail {
  id: string;
  name: string;
  email: string;
  address: string | null;
  role: UserRole;
  created_at: string;
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
  created_at: string;
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
  created_at: string;
  updated_at: string;
}

export interface AdminUserWithStore extends AdminUserDetail {
  store?: AdminStoreDetail;
  avg_rating?: number | null;
  total_ratings?: number;
}
