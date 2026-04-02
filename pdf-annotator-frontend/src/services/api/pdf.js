import { apiClient } from '../apiclient';

export const pdfAPI = {
  // Upload PDF
  upload: async (file, onProgress) => {
    const formData = new FormData();
    formData.append('pdf', file);

    const response = await apiClient.post('/pdf/upload', formData, {
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

  // Get user's PDFs with pagination
  getAll: async (params = {}) => {
    const response = await apiClient.get('/pdf', { params });
    return response.data;
  },

  // Get PDF by UUID
  getById: async (uuid) => {
    const response = await apiClient.get(`/pdf/${uuid}`);
    return response.data;
  },

  // Update PDF metadata
  update: async (uuid, updateData) => {
    const response = await apiClient.put(`/pdf/${uuid}`, updateData);
    return response.data;
  },

  // Delete PDF
  delete: async (uuid) => {
    const response = await apiClient.delete(`/pdf/${uuid}`);
    return response.data;
  },

  // Get PDF download URL
  getDownloadUrl: (uuid) => {
    return `${import.meta.env.VITE_BACKEND_URL}/api/pdf/${uuid}/download`;
  },

  // Get PDF view URL (for iframe or direct viewing)
  getViewUrl: (uuid) => {
    return `${import.meta.env.VITE_BACKEND_URL}/api/pdf/${uuid}`;
  },

  // Share PDF
  share: async (uuid, shareData) => {
    const response = await apiClient.post(`/pdf/${uuid}/share`, shareData);
    return response.data;
  },

  // Revoke sharing
  revokeShare: async (uuid, userId) => {
    const response = await apiClient.delete(`/pdf/${uuid}/share/${userId}`);
    return response.data;
  },

  // Toggle favorite
  toggleFavorite: async (uuid) => {
    const response = await apiClient.post(`/pdf/${uuid}/favorite`);
    return response.data;
  },

  // Toggle archive
  toggleArchive: async (uuid) => {
    const response = await apiClient.post(`/pdf/${uuid}/archive`);
    return response.data;
  },

  // Search PDFs
  search: async (query, params = {}) => {
    const response = await apiClient.get('/pdf/search', {
      params: { q: query, ...params }
    });
    return response.data;
  },

  // Get public PDFs
  getPublic: async (params = {}) => {
    const response = await apiClient.get('/pdf/public', { params });
    return response.data;
  },

  // Get shared PDFs
  getShared: async (params = {}) => {
    const response = await apiClient.get('/pdf/shared', { params });
    return response.data;
  },

  // Get PDF statistics
  getStats: async () => {
    const response = await apiClient.get('/pdf/stats');
    return response.data;
  },
};