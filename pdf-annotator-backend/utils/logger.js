const winston = require('winston');
const path = require('path');

const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = '\n' + JSON.stringify(meta, null, 2);
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);
const fs = require('fs');
const logsDir = process.env.LOG_DIR || './logs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'pdf-annotator-backend' },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, 
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, 
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'access.log'),
      level: 'http',
      maxsize: 5242880, 
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: 5242880, 
      maxFiles: 5
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      maxsize: 5242880, 
      maxFiles: 5
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: 'debug'
  }));
}

const createChildLogger = (module) => {
  return logger.child({ module });
};

const loggers = {
  auth: createChildLogger('auth'),
  pdf: createChildLogger('pdf'),
  highlight: createChildLogger('highlight'),
  user: createChildLogger('user'),
  upload: createChildLogger('upload'),
  database: createChildLogger('database'),
  security: createChildLogger('security')
};

const logPerformance = (operation, startTime, metadata = {}) => {
  const duration = Date.now() - startTime;
  logger.info(`Performance: ${operation}`, {
    duration: `${duration}ms`,
    ...metadata
  });
};

const logSecurityEvent = (event, details = {}) => {
  loggers.security.warn(`Security Event: ${event}`, {
    timestamp: new Date().toISOString(),
    ...details
  });
};

const logDatabaseOperation = (operation, collection, details = {}) => {
  loggers.database.debug(`Database: ${operation}`, {
    collection,
    ...details
  });
};

const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  logger.http('Request started', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    user: req.user ? req.user.email : 'Anonymous'
  });
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.http('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length'),
      user: req.user ? req.user.email : 'Anonymous'
    });
  });
  
  next();
};

const logError = (error, context = {}) => {
  logger.error('Error occurred', {
    message: error.message,
    stack: error.stack,
    ...context
  });
};

const logSuccess = (operation, details = {}) => {
  logger.info(`Success: ${operation}`, details);
};

const logWarning = (warning, details = {}) => {
  logger.warn(`Warning: ${warning}`, details);
};

const logDebug = (message, details = {}) => {
  if (process.env.NODE_ENV !== 'production') {
    logger.debug(message, details);
  }
};

const logApiUsage = (endpoint, userId, details = {}) => {
  logger.info('API Usage', {
    endpoint,
    userId,
    timestamp: new Date().toISOString(),
    ...details
  });
};

const logFileOperation = (operation, filename, details = {}) => {
  loggers.upload.info(`File ${operation}`, {
    filename,
    ...details
  });
};

const logUserActivity = (userId, activity, details = {}) => {
  loggers.user.info('User Activity', {
    userId,
    activity,
    timestamp: new Date().toISOString(),
    ...details
  });
};

module.exports = {

  logger,

  loggers,
  logPerformance,
  logSecurityEvent,
  logDatabaseOperation,
  logError,
  logSuccess,
  logWarning,
  logDebug,
  logApiUsage,
  logFileOperation,
  logUserActivity,
  
  requestLogger,
  info: logger.info.bind(logger),
  error: logger.error.bind(logger),
  warn: logger.warn.bind(logger),
  debug: logger.debug.bind(logger),
  verbose: logger.verbose.bind(logger),
  silly: logger.silly.bind(logger)
};