import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;
if (!API_BASE_URL) {
  console.error(
    '[api] VITE_API_URL is not set. The build was made WITHOUT a backend URL, so all API calls ' +
      'will fail. Configure it in Vercel (Project -> Settings -> Environment Variables -> ' +
      'VITE_API_URL = https://<your-render-backend>.onrender.com/api) and redeploy.',
  );
}

const TOKEN_KEY = 'rating_app_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

const api = axios.create({
  baseURL: API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      setToken(null);
      localStorage.removeItem('rating_app_user');
    }
    return Promise.reject(error);
  }
);

export default api;
