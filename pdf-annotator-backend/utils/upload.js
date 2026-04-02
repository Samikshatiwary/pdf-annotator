const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { logFileOperation, logError } = require('./logger');
const ensureUploadDir = () => {
  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  const subDirs = ['pdfs', 'avatars', 'thumbnails', 'temp'];
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  subDirs.forEach(subDir => {
    const dirPath = path.join(uploadDir, subDir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
};

ensureUploadDir();
const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.env.UPLOAD_DIR || './uploads', 'pdfs');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uuid = uuidv4();
    const ext = path.extname(file.originalname);
    const filename = `${uuid}${ext}`;
    
    req.uploadedFileName = filename;
    req.uploadedUUID = uuid;
    
    cb(null, filename);
  }
});

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.env.UPLOAD_DIR || './uploads', 'avatars');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${req.user._id}_${Date.now()}${ext}`;
    
    req.uploadedFileName = filename;
    cb(null, filename);
  }
});
const pdfFileFilter = (req, file, cb) => {
  if (file.mimetype !== 'application/pdf') {
    const error = new Error('Only PDF files are allowed');
    error.code = 'INVALID_FILE_TYPE';
    return cb(error, false);
  }
  
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== '.pdf') {
    const error = new Error('File must have .pdf extension');
    error.code = 'INVALID_FILE_EXTENSION';
    return cb(error, false);
  }
  
  cb(null, true);
};

const avatarFileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedMimes.includes(file.mimetype)) {
    const error = new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed');
    error.code = 'INVALID_FILE_TYPE';
    return cb(error, false);
  }
  
  const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedExts.includes(ext)) {
    const error = new Error('Invalid file extension');
    error.code = 'INVALID_FILE_EXTENSION';
    return cb(error, false);
  }
  
  cb(null, true);
};

const uploadPDF = multer({
  storage: pdfStorage,
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, 
    files: 1
  },
  onError: (err, next) => {
    logError(err, { operation: 'PDF upload' });
    next(err);
  }
});

const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: avatarFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, 
    files: 1
  },
  onError: (err, next) => {
    logError(err, { operation: 'Avatar upload' });
    next(err);
  }
});

const uploadMultiple = multer({
  storage: pdfStorage,
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024,
    files: 10 
  }
});
const calculateChecksum = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', (data) => {
      hash.update(data);
    });
    
    stream.on('end', () => {
      resolve(hash.digest('hex'));
    });
    
    stream.on('error', (error) => {
      reject(error);
    });
  });
};

const getFileStats = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.stat(filePath, (err, stats) => {
      if (err) {
        reject(err);
      } else {
        resolve({
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          isFile: stats.isFile(),
          isDirectory: stats.isDirectory()
        });
      }
    });
  });
};
const deleteFile = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        resolve(true);
        return;
      }
      
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) {
          reject(unlinkErr);
        } else {
          logFileOperation('deleted', path.basename(filePath));
          resolve(true);
        }
      });
    });
  });
};
const moveFile = (sourcePath, destinationPath) => {
  return new Promise((resolve, reject) => {
    fs.rename(sourcePath, destinationPath, (err) => {
      if (err) {
        reject(err);
      } else {
        logFileOperation('moved', path.basename(destinationPath), {
          from: sourcePath,
          to: destinationPath
        });
        resolve(true);
      }
    });
  });
};
const copyFile = (sourcePath, destinationPath) => {
  return new Promise((resolve, reject) => {
    fs.copyFile(sourcePath, destinationPath, (err) => {
      if (err) {
        reject(err);
      } else {
        logFileOperation('copied', path.basename(destinationPath), {
          from: sourcePath,
          to: destinationPath
        });
        resolve(true);
      }
    });
  });
};

const fileExists = (filePath) => {
  return new Promise((resolve) => {
    fs.access(filePath, fs.constants.F_OK, (err) => {
      resolve(!err);
    });
  });
};

const getMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
};

const cleanupTempFiles = () => {
  const tempDir = path.join(process.env.UPLOAD_DIR || './uploads', 'temp');
  
  fs.readdir(tempDir, (err, files) => {
    if (err) return;
    
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; 
    
    files.forEach(file => {
      const filePath = path.join(tempDir, file);
      
      fs.stat(filePath, (statErr, stats) => {
        if (statErr) return;
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlink(filePath, (unlinkErr) => {
            if (!unlinkErr) {
              logFileOperation('cleaned up temp file', file);
            }
          });
        }
      });
    });
  });
};
setInterval(cleanupTempFiles, 60 * 60 * 1000);
const getUploadPath = (type = 'pdfs') => {
  return path.join(process.env.UPLOAD_DIR || './uploads', type);
};

const validateFile = async (filePath, options = {}) => {
  try {
    const exists = await fileExists(filePath);
    if (!exists) {
      throw new Error('File does not exist');
    }
    const stats = await getFileStats(filePath);
    if (options.maxSize && stats.size > options.maxSize) {
      throw new Error(`File size ${stats.size} exceeds maximum allowed size ${options.maxSize}`);
    }
    if (options.allowedMimes) {
      const mimeType = getMimeType(filePath);
      if (!options.allowedMimes.includes(mimeType)) {
        throw new Error(`File type ${mimeType} is not allowed`);
      }
    }
    
    return {
      valid: true,
      stats,
      mimeType: getMimeType(filePath)
    };
    
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
};
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    let message = 'Upload error';
    let code = 'UPLOAD_ERROR';
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File too large';
        code = 'FILE_TOO_LARGE';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files';
        code = 'TOO_MANY_FILES';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        code = 'UNEXPECTED_FILE';
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Too many parts';
        code = 'TOO_MANY_PARTS';
        break;
      case 'LIMIT_FIELD_KEY':
        message = 'Field name too long';
        code = 'FIELD_NAME_TOO_LONG';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'Field value too long';
        code = 'FIELD_VALUE_TOO_LONG';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Too many fields';
        code = 'TOO_MANY_FIELDS';
        break;
      default:
        message = error.message;
    }
    
    logError(error, {
      operation: 'File upload',
      code: error.code,
      field: error.field,
      userId: req.user ? req.user._id : null
    });
    
    return res.status(400).json({
      success: false,
      message,
      code
    });
  }
  if (error.code === 'INVALID_FILE_TYPE' || error.code === 'INVALID_FILE_EXTENSION') {
    logError(error, {
      operation: 'File upload validation',
      userId: req.user ? req.user._id : null
    });
    
    return res.status(400).json({
      success: false,
      message: error.message,
      code: error.code
    });
  }
  
  next(error);
};

module.exports = {
  uploadPDF: uploadPDF.single('pdf'),
  uploadAvatar: uploadAvatar.single('avatar'),
  uploadMultiple: uploadMultiple.array('pdfs', 10),
  calculateChecksum,
  getFileStats,
  deleteFile,
  moveFile,
  copyFile,
  fileExists,
  getMimeType,
  cleanupTempFiles,
  getUploadPath,
  validateFile,
  handleUploadError,
  ensureUploadDir
};