import { apiClient } from '../apiclient';

export const highlightsAPI = {
  // Create highlight
  create: async (highlightData) => {
    const response = await apiClient.post('/highlights', highlightData);
    return response.data;
  },

  // Get highlights for a PDF
  getByPdfId: async (pdfId, params = {}) => {
    const response = await apiClient.get(`/highlights/pdf/${pdfId}`, { 
    params: { ...params, limit: 1000 } // Return up to 1000 highlights
  });
  return response.data;
  },

  // Get highlight by UUID
  getById: async (uuid) => {
    const response = await apiClient.get(`/highlights/${uuid}`);
    return response.data;
  },

  // Update highlight
  update: async (uuid, updateData) => {
    const response = await apiClient.put(`/highlights/${uuid}`, updateData);
    return response.data;
  },

  // Delete highlight
  delete: async (uuid) => {
    const response = await apiClient.delete(`/highlights/${uuid}`);
    return response.data;
  },

  // Add reaction
  addReaction: async (uuid, reactionData) => {
    const response = await apiClient.post(`/highlights/${uuid}/reactions`, reactionData);
    return response.data;
  },

  // Remove reaction
  removeReaction: async (uuid) => {
    const response = await apiClient.delete(`/highlights/${uuid}/reactions`);
    return response.data;
  },

  // Add reply
  addReply: async (uuid, replyData) => {
    const response = await apiClient.post(`/highlights/${uuid}/replies`, replyData);
    return response.data;
  },

  // Update reply
  updateReply: async (uuid, replyId, updateData) => {
    const response = await apiClient.put(`/highlights/${uuid}/replies/${replyId}`, updateData);
    return response.data;
  },

  // Delete reply
  deleteReply: async (uuid, replyId) => {
    const response = await apiClient.delete(`/highlights/${uuid}/replies/${replyId}`);
    return response.data;
  },

  // Share highlight
  share: async (uuid, shareData) => {
    const response = await apiClient.post(`/highlights/${uuid}/share`, shareData);
    return response.data;
  },

  // Search highlights
  search: async (query, params = {}) => {
    const response = await apiClient.get('/highlights/search', {
      params: { q: query, ...params }
    });
    return response.data;
  },

  // Get user's highlights
  getMy: async (params = {}) => {
    const response = await apiClient.get('/highlights/my', { params });
    return response.data;
  },

  // Get highlight statistics
  getStats: async () => {
    const response = await apiClient.get('/highlights/stats');
    return response.data;
  },

  // Bulk operations
  bulk: async (operation, highlightIds, data = {}) => {
    const response = await apiClient.post('/highlights/bulk', {
      operation,
      highlightIds,
      ...data
    });
    return response.data;
  },

  // Export highlights
  export: async (format = 'json', params = {}) => {
    const response = await apiClient.get('/highlights/export', {
      params: { format, ...params },
      responseType: format === 'json' ? 'json' : 'blob'
    });
    return response.data;
  },

  // Import highlights
  import: async (file, format = 'json') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('format', format);

    const response = await apiClient.post('/highlights/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
