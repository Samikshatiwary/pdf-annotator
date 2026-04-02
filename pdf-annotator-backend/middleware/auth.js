const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');
const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. User not found.'
        });
      }
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. Account is deactivated.'
        });
      }
      req.user = user;
      next();
      
    } catch (tokenError) {
      logger.error('Token verification failed:', tokenError);
      
      if (tokenError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Access denied. Token has expired.',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      if (tokenError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Access denied. Invalid token.',
          code: 'INVALID_TOKEN'
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Access denied. Token verification failed.'
      });
    }
    
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authentication required.'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }
    
    next();
  };
};
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        logger.warn('Optional auth token verification failed:', error.message);
      }
    }
    
    next();
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    next(); 
  }
};
const verifyRefreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.body.refreshToken || req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not provided'
      });
    }
    
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      
      if (decoded.type !== 'refresh') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token type'
        });
      }
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }
      
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated'
        });
      }
      const tokenExists = user.refreshTokens.some(
        tokenObj => tokenObj.token === refreshToken
      );
      
      if (!tokenExists) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }
      user.cleanExpiredRefreshTokens();
      await user.save();
      
      req.user = user;
      req.refreshToken = refreshToken;
      next();
      
    } catch (tokenError) {
      logger.error('Refresh token verification failed:', tokenError);
      
      if (tokenError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Refresh token has expired',
          code: 'REFRESH_TOKEN_EXPIRED'
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
    
  } catch (error) {
    logger.error('Refresh token middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during token verification'
    });
  }
};

const checkResourceOwnership = (resourceModel, resourceParam = 'id', userField = 'userId') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceParam];
      const userId = req.user._id;
      const resource = await resourceModel.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }
      if (resource[userField].toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not own this resource.'
        });
      }
      req.resource = resource;
      next();
      
    } catch (error) {
      logger.error('Resource ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during ownership verification'
      });
    }
  };
};
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    if (!req.user) {
      return next();
    }
    
    const userId = req.user._id.toString();
    const now = Date.now();
    if (now % 60000 < 1000) { 
      for (const [key, data] of requests.entries()) {
        if (now - data.resetTime > windowMs) {
          requests.delete(key);
        }
      }
    }
    
    const userRequests = requests.get(userId) || {
      count: 0,
      resetTime: now + windowMs
    };
    
    if (now > userRequests.resetTime) {
      userRequests.count = 1;
      userRequests.resetTime = now + windowMs;
    } else {
      userRequests.count++;
    }
    
    if (userRequests.count > maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests from this user',
        retryAfter: Math.ceil((userRequests.resetTime - now) / 1000)
      });
    }
    
    requests.set(userId, userRequests);
    res.set({
      'X-RateLimit-Limit': maxRequests,
      'X-RateLimit-Remaining': Math.max(0, maxRequests - userRequests.count),
      'X-RateLimit-Reset': new Date(userRequests.resetTime).toISOString()
    });
    
    next();
  };
};
const logActivity = (action) => {
  return (req, res, next) => {
    if (req.user) {
      logger.info(`User activity: ${req.user.email} - ${action}`, {
        userId: req.user._id,
        email: req.user.email,
        action,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
    }
    next();
  };
};

module.exports = {
  protect,
  authorize,
  optionalAuth,
  verifyRefreshToken,
  checkResourceOwnership,
  userRateLimit,
  logActivity
};