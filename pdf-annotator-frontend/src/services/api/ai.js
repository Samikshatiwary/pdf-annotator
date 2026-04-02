import { apiClient } from '../apiclient';

export const aiAPI ={
  summarize: async (pdfId, maxLength = 200) =>{
    const response = await apiClient.post('/ai/summarize', {pdfId, maxLength});
    return response.data;
  },

  extractKeyPhrases: async(pdfId, limit = 10) =>{
    const response = await apiClient.post('/ai/key-phrases',{pdfId, limit});
    return response.data;
  },

  semanticSeacrh: async(pdfId, query) =>{
    const response = await apiClient.post('/ai/semantic-search', {pdfId, query});
    return response.data; 
  },

  analyzeText: async(pdfId) =>{
    const response = await apiClient.post('/ai/analyze', {pdfId});
    return response.data;
  },
};