const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  logger.error('Error Handler:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    user: req.user ? req.user.email : 'Anonymous'
  });

  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = {
      message,
      statusCode: 404,
      code: 'RESOURCE_NOT_FOUND'
    };
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    error = {
      message,
      statusCode: 400,
      code: 'DUPLICATE_FIELD'
    };
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      message,
      statusCode: 400,
      code: 'VALIDATION_ERROR'
    };
  }
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = {
      message,
      statusCode: 401,
      code: 'INVALID_TOKEN'
    };
  }
  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = {
      message,
      statusCode: 401,
      code: 'TOKEN_EXPIRED'
    };
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large';
    error = {
      message,
      statusCode: 400,
      code: 'FILE_TOO_LARGE'
    };
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    const message = 'Too many files';
    error = {
      message,
      statusCode: 400,
      code: 'TOO_MANY_FILES'
    };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field';
    error = {
      message,
      statusCode: 400,
      code: 'UNEXPECTED_FILE'
    };
  }
  if (err.message && err.message.includes('CORS')) {
    const message = 'CORS policy violation';
    error = {
      message,
      statusCode: 403,
      code: 'CORS_ERROR'
    };
  }
  if (err.code === 'ENOENT') {
    const message = 'File not found';
    error = {
      message,
      statusCode: 404,
      code: 'FILE_NOT_FOUND'
    };
  }

  if (err.code === 'EACCES' || err.code === 'EPERM') {
    const message = 'File permission denied';
    error = {
      message,
      statusCode: 500,
      code: 'FILE_PERMISSION_ERROR'
    };
  }
  if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
    const message = 'Database connection error';
    error = {
      message,
      statusCode: 500,
      code: 'DATABASE_ERROR'
    };
  }
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Server Error';
  const code = error.code || 'INTERNAL_SERVER_ERROR';
  const errorResponse = {
    success: false,
    message,
    code
  };
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error = {
      stack: err.stack,
      details: err
    };
  }
  errorResponse.timestamp = new Date().toISOString();
  if (process.env.NODE_ENV === 'development') {
    errorResponse.request = {
      method: req.method,
      url: req.url,
      headers: req.headers,
      query: req.query,
      params: req.params
    };
  }

  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;