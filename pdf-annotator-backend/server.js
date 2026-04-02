const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const pdfRoutes = require('./routes/pdf');
const highlightRoutes = require('./routes/highlights');
const userRoutes = require('./routes/user');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const aiRoutes = require('./routes/ai');
const cloudRoutes = require('./routes/cloud');

const app = express();

// Declare server in global scope
let server;

const createDirectories = () => {
  const dirs = ['uploads', 'logs'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger?.info(`Created directory: ${dir}`) || console.log(`Created directory: ${dir}`);
    }
  });
};

createDirectories();

app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000'
    ];
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods:['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders:['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders:['Content-Range', 'X-Content-Range']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(compression());
app.use(morgan('combined', { 
  stream: { 
    write: (message) => logger?.info(message.trim()) || console.log(message.trim())
  } 
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/highlights', highlightRoutes);
app.use('/api/user', userRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/cloud', cloudRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use(errorHandler);

// Database connection function
const connectDB = async () => {
  try {
    // Check if MONGODB_URI exists
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: false
    });
    
    logger?.info(`MongoDB Connected: ${conn.connection.host}`) || console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger?.error('Database connection failed:', error) || console.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Graceful shutdown function
const gracefulShutdown = () => {
  logger?.info('Received shutdown signal, closing server gracefully...') || console.log('Received shutdown signal, closing server gracefully...');
  
  if (server) {
    server.close((err) => {
      if (err) {
        logger?.error('Error during server shutdown:', err) || console.error('Error during server shutdown:', err);
        process.exit(1);
      }
      
      mongoose.connection.close(() => {
        logger?.info('Database connection closed') || console.log('Database connection closed');
        process.exit(0);
      });
    });
  } else {
    mongoose.connection.close(() => {
      logger?.info('Database connection closed') || console.log('Database connection closed');
      process.exit(0);
    });
  }
};

// Process event handlers
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

process.on('unhandledRejection', (err) => {
  logger?.error('Unhandled Promise Rejection:', err) || console.error('Unhandled Promise Rejection:', err);
  gracefulShutdown();
});

process.on('uncaughtException', (err) => {
  logger?.error('Uncaught Exception:', err) || console.error('Uncaught Exception:', err);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

// Start server function
const startServer = async () => {
  try {
    console.log('Environment check:');
    console.log('- MONGODB_URI:', process.env.MONGODB_URI ? 'Found' : 'Missing');
    console.log('- NODE_ENV:', process.env.NODE_ENV || 'development');
    console.log('- PORT:', PORT);
    
    await connectDB();
    
    server = app.listen(PORT, () => {
      const message = `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`;
      logger?.info(message) || console.log(message);
    });
    
    return server;
  } catch (error) {
    const errorMessage = 'Failed to start server:';
    logger?.error(errorMessage, error) || console.error(errorMessage, error);
    process.exit(1);
  }
};

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = app;