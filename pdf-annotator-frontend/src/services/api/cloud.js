import { apiClient } from '../apiclient';

export const cloudAPI = {
  // Google Drive
  googleDriveAuth: async () => {
    const response = await apiClient.post('/cloud/google-drive/auth');
    return response.data;
  },

  googleDriveCallback: async (code) => {  
    const response = await apiClient.post('/cloud/google-drive/callback', { code });
    return response.data;
  },

  uploadToGoogleDrive: async (pdfId, accessToken) => {
    const response = await apiClient.post('/cloud/google-drive/upload', {
      pdfId,
      accessToken,
    });
    return response.data;
  },

  listGoogleDriveFiles: async (accessToken) => {
    const response = await apiClient.get('/cloud/google-drive/list', {
      params: { accessToken },
    });
    return response.data;
  },

  importFromGoogleDrive: async (fileId, accessToken) => {
    const response = await apiClient.post('/cloud/google-drive/import', {
      fileId,
      accessToken,
    });
    return response.data;
  },

  // Dropbox
  dropboxAuth: async () => {
    const response = await apiClient.post('/cloud/dropbox/auth');
    return response.data;
  },

  dropboxCallback: async (code) => {
    const response = await apiClient.post('/cloud/dropbox/callback', { code });
    return response.data;
  },

  uploadToDropbox: async (pdfId, accessToken) => {
    const response = await apiClient.post('/cloud/dropbox/upload', {
      pdfId,
      accessToken,
    });
    return response.data;
  },

  listDropboxFiles: async (accessToken) => {
    const response = await apiClient.get('/cloud/dropbox/list', {
      params: { accessToken },
    });
    return response.data;
  },

  importFromDropbox: async (path, accessToken) => {
    const response = await apiClient.post('/cloud/dropbox/import', {
      path,
      accessToken,
    });
    return response.data;
  },
};