import { apiClient } from '../apiclient';

export const userAPI = {
  // Get dashboard data
  getDashboard: async () => {
    const response = await apiClient.get('/user/dashboard');
    return response.data;
  },

  // Upload avatar
  uploadAvatar: async (file, onProgress) => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await apiClient.post('/user/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data;
  },

  // Delete avatar
  deleteAvatar: async () => {
    const response = await apiClient.delete('/user/avatar');
    return response.data;
  },

  // Get activity log
  getActivity: async (params = {}) => {
    const response = await apiClient.get('/user/activity', { params });
    return response.data;
  },

  // Get preferences
  getPreferences: async () => {
    const response = await apiClient.get('/user/preferences');
    return response.data;
  },

  // Update preferences (backend expects them nested under `preferences`)
  updatePreferences: async (preferences) => {
    const response = await apiClient.put('/user/preferences', { preferences });
    return response.data;
  },

  // Export user data
  exportData: async (format = 'json') => {
    const response = await apiClient.get('/user/export', {
      params: { format },
      responseType: format === 'json' ? 'json' : 'blob'
    });
    return response.data;
  },

  // Delete account
  deleteAccount: async (password) => {
    const response = await apiClient.delete('/user/account', {
      data: { password }
    });
    return response.data;
  },

  // Get storage usage
  getStorage: async () => {
    const response = await apiClient.get('/user/storage');
    return response.data;
  },
};