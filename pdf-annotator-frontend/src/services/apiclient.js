import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds for file uploads
  withCredentials: true, // Important for cookies
});

// Token management
const getToken = () => localStorage.getItem('token') || localStorage.getItem('accessToken');
const getRefreshToken = () => localStorage.getItem('refreshToken');
const setTokens = (token, refreshToken) => {
  localStorage.setItem('token', token);
  localStorage.setItem('accessToken', token);
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
};
const clearTokens = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle token expiration
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refreshToken
          });

          const { token, refreshToken: newRefreshToken } = response.data.data;
          setTokens(token, newRefreshToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          clearTokens();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        clearTokens();
        window.location.href = '/login';
      }
    }

    // Handle common errors
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    
    // Don't show toast for specific status codes
    if (![401, 403].includes(error.response?.status)) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export { apiClient, setTokens, clearTokens };