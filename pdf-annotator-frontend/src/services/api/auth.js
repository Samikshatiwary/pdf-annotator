import { apiClient, setTokens, clearTokens } from '../apiclient';

export const authAPI = {
  // Register new user
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    if (response.data.success && response.data.data.token) {
      setTokens(response.data.data.token, response.data.data.refreshToken);
    }
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    if (response.data.success && response.data.data.token) {
      setTokens(response.data.data.token, response.data.data.refreshToken);
    }
    return response.data;
  },

  // Logout user
  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      clearTokens();
    }
  },

  // Logout from all devices
  logoutAll: async () => {
    try {
      await apiClient.post('/auth/logout-all');
    } finally {
      clearTokens();
    }
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  // Update profile
  updateProfile: async (profileData) => {
    const response = await apiClient.put('/auth/profile', profileData);
    return response.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await apiClient.put('/auth/change-password', passwordData);
    return response.data;
  },

  // Forgot password
  forgotPassword: async (email) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password
  resetPassword: async (resetData) => {
    const response = await apiClient.put('/auth/reset-password', resetData);
    return response.data;
  },
};
