export const getPDFUrl = (uuid) => {
  return `${import.meta.env.VITE_BACKEND_URL}/api/pdf/${uuid}/file`;
};

export const getDownloadUrl = (uuid) => {
  return `${import.meta.env.VITE_BACKEND_URL}/api/pdf/${uuid}/download`;
};

export const getThumbnailUrl = (uuid) => {
  return `${import.meta.env.VITE_BACKEND_URL}/api/pdf/${uuid}/thumbnail`;
};

export const validatePDFFile = (file) => {
  const maxSize = parseInt(import.meta.env.VITE_MAX_FILE_SIZE) || 50000000;
  const allowedTypes = ['application/pdf'];

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only PDF files are allowed' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: `File size must be less than ${maxSize / 1000000}MB` };
  }

  return { valid: true };
};