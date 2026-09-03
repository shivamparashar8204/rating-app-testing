import axios from 'axios';
import { auth } from '../lib/firebase';

const API_BASE_URL = import.meta.env.VITE_API_URL;
if (!API_BASE_URL) {
  console.error('VITE_API_URL environment variable is not set');
}

const api = axios.create({
  baseURL: API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const currentUser = auth.currentUser;
  if (currentUser) {
    const token = await currentUser.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRetrying = false;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !isRetrying) {
      isRetrying = true;
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const newToken = await currentUser.getIdToken(true);
          error.config.headers.Authorization = `Bearer ${newToken}`;
          const retryResponse = await axios(error.config);
          isRetrying = false;
          return retryResponse;
        } catch {
          isRetrying = false;
          return Promise.reject(error);
        }
      }
      isRetrying = false;
    }
    return Promise.reject(error);
  }
);

export default api;
