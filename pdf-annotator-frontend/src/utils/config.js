export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  backendUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000',
  websocketUrl: import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:5000',
  maxFileSize: parseInt(import.meta.env.VITE_MAX_FILE_SIZE) || 50000000,
  allowedFileTypes: import.meta.env.VITE_ALLOWED_FILE_TYPES?.split(',') || ['application/pdf'],
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  dropboxAppKey: import.meta.env.VITE_DROPBOX_APP_KEY,
};

export default config;