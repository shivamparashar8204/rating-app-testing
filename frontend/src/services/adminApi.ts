import api from './api';
import {
  DashboardData,
  AdminUserDetail,
  AdminStoreDetail,
  AdminRatingDetail,
  AdminUserWithStore,
} from '../types';

export const adminApi = {
  getDashboard: async () => {
    const response = await api.get<{ success: boolean; data: DashboardData }>('/admin/dashboard');
    return response.data.data;
  },

  getRecentReviews: async () => {
    const response = await api.get<{ success: boolean; data: AdminRatingDetail[] }>('/admin/dashboard/reviews');
    return response.data.data;
  },

  getTopRatedStores: async () => {
    const response = await api.get<{ success: boolean; data: AdminStoreDetail[] }>('/admin/dashboard/top-stores');
    return response.data.data;
  },

  getRecentlyRegisteredCustomers: async () => {
    const response = await api.get<{ success: boolean; data: AdminUserDetail[] }>('/admin/dashboard/recent-customers');
    return response.data.data;
  },

  getRecentlyAddedStores: async () => {
    const response = await api.get<{ success: boolean; data: AdminStoreDetail[] }>('/admin/dashboard/recent-stores');
    return response.data.data;
  },

  getUsers: async (params?: {
    name?: string;
    email?: string;
    address?: string;
    role?: string;
    sortBy?: string;
    order?: 'ASC' | 'DESC';
  }) => {
    const response = await api.get<{ success: boolean; data: AdminUserDetail[] }>('/admin/users', { params });
    return response.data.data;
  },

  getUserById: async (id: number) => {
    const response = await api.get<{ success: boolean; data: AdminUserWithStore }>(`/admin/users/${id}`);
    return response.data.data;
  },

  createUser: async (data: {
    name: string;
    email: string;
    address: string;
    password: string;
    role: string;
  }) => {
    const response = await api.post<{ success: boolean; message: string; data: AdminUserDetail }>('/admin/users', data);
    return response.data;
  },

  updateUser: async (id: number, data: {
    name?: string;
    email?: string;
    address?: string;
    password?: string;
    role?: string;
  }) => {
    const response = await api.put<{ success: boolean; message: string; data: AdminUserDetail }>(`/admin/users/${id}`, data);
    return response.data;
  },

  getStores: async (params?: {
    name?: string;
    email?: string;
    address?: string;
    sortBy?: string;
    order?: 'ASC' | 'DESC';
  }) => {
    const response = await api.get<{ success: boolean; data: AdminStoreDetail[] }>('/admin/stores', { params });
    return response.data.data;
  },

  getStoreById: async (id: number) => {
    const response = await api.get<{ success: boolean; data: AdminStoreDetail }>(`/admin/stores/${id}`);
    return response.data.data;
  },

  createStore: async (data: {
    name: string;
    email: string;
    address: string;
    storeOwnerId: number;
  }) => {
    const response = await api.post<{ success: boolean; message: string; data: AdminStoreDetail }>('/admin/stores', data);
    return response.data;
  },

  updateStore: async (id: number, data: {
    name?: string;
    email?: string;
    address?: string;
  }) => {
    const response = await api.put<{ success: boolean; message: string; data: AdminStoreDetail }>(`/admin/stores/${id}`, data);
    return response.data;
  },

  getRatings: async (params?: {
    customerName?: string;
    storeName?: string;
    rating?: number;
    sortBy?: string;
    order?: 'ASC' | 'DESC';
  }) => {
    const response = await api.get<{ success: boolean; data: AdminRatingDetail[] }>('/admin/ratings', { params });
    return response.data.data;
  },

  getRatingById: async (id: number) => {
    const response = await api.get<{ success: boolean; data: AdminRatingDetail }>(`/admin/ratings/${id}`);
    return response.data.data;
  },

  createRating: async (data: {
    userId: number;
    storeId: number;
    rating: number;
  }) => {
    const response = await api.post<{ success: boolean; message: string }>('/admin/ratings', data);
    return response.data;
  },

  updateRating: async (id: number, data: { rating: number }) => {
    const response = await api.put<{ success: boolean; message: string }>(`/admin/ratings/${id}`, data);
    return response.data;
  },

  deleteRating: async (id: number) => {
    const response = await api.delete<{ success: boolean; message: string }>(`/admin/ratings/${id}`);
    return response.data;
  },

  getStoreOwners: async () => {
    const response = await api.get<{ success: boolean; data: AdminUserDetail[] }>('/admin/store-owners');
    return response.data.data;
  },

  getCustomers: async () => {
    const response = await api.get<{ success: boolean; data: AdminUserDetail[] }>('/admin/customers');
    return response.data.data;
  },
};
