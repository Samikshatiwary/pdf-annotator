import { apiClient } from '../apiclient';

export const drawingsAPI = {
  // Save (upsert) the drawing canvas for a PDF page
  save: async (pdfId, pageNumber, data) => {
    const response = await apiClient.post('/drawings', { pdfId, pageNumber, data });
    return response.data;
  },

  // Get all drawings for a PDF (current user)
  getByPdfId: async (pdfId) => {
    const response = await apiClient.get(`/drawings/pdf/${pdfId}`);
    return response.data;
  },
};
