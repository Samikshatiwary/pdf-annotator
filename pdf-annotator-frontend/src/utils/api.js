export const handleApiError = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export const isValidFileType = (file) => {
  const allowedTypes = import.meta.env.VITE_ALLOWED_FILE_TYPES?.split(',') || ['application/pdf'];
  return allowedTypes.includes(file.type);
};

export const isValidFileSize = (file) => {
  const maxSize = parseInt(import.meta.env.VITE_MAX_FILE_SIZE) || 50000000;
  return file.size <= maxSize;
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
