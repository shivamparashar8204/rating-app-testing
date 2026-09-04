import api from './api';
import { Store, Rating } from '../types';

export interface CustomerDashboardStore extends Store {
  total_ratings: number;
  user_rating_id?: string | null;
}

export const customerApi = {
  getStores: async (search?: string) => {
    const response = await api.get<{ success: boolean; data: CustomerDashboardStore[] }>('/customer/stores', {
      params: { search },
    });
    return response.data.data;
  },
  submitRating: async (storeId: string, rating: number) => {
    const response = await api.post<{ success: boolean; message: string; data: { ratingId: string } }>(
      '/customer/ratings',
      { storeId: Number(storeId), rating }
    );
    return response.data;
  },
  updateRating: async (ratingId: string, rating: number) => {
    const response = await api.put<{ success: boolean; message: string }>(`/customer/ratings/${ratingId}`, { rating });
    return response.data;
  },
};

export const storeOwnerApi = {
  getDashboard: async () => {
    const response = await api.get<{
      success: boolean;
      data: {
        store: { id: string; name: string; email: string; address: string };
        averageRating: number | null;
        totalRatings: number;
      };
    }>('/store-owner/dashboard');
    return response.data.data;
  },
  getRatings: async () => {
    const response = await api.get<{ success: boolean; data: Rating[] }>('/store-owner/ratings');
    return response.data.data;
  },
};
