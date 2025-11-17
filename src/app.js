import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';

import routes from './routes/index.js';
import { logger } from './config/logger.js';
import requestIdMiddleware from './middleware/requestId.middleware.js';

const app = express();

// Request ID tracking (for debugging and logging)
app.use(requestIdMiddleware);

// Security (relaxed for development)
if (process.env.NODE_ENV === 'production') {
  app.use(helmet());
} else {
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));
}

// CORS (allow all in development, restrict in production)
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.CORS_ORIGIN || '*').split(',').map(o => o.trim())
    : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours - cache preflight requests
};
app.use(cors(corsOptions));

// Parsers (with size limits to prevent DoS)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data sanitization against NoSQL injection
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    logger.warn(`Sanitized request from ${req.ip}:`, key);
  }
}));

// Prevent HTTP Parameter Pollution
app.use(hpp({
  whitelist: ['sort', 'filter', 'page', 'limit'] // Allow these query params to be arrays
}));

// Compression (only for production, responses > 1kb)
app.use(compression({
  level: 6, // Balance between speed and compression
  threshold: 1024, // Only compress responses > 1kb
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Root route - Welcome message
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🎉 Chhattisgarh Shadi Backend API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/v1/health',
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      profiles: '/api/v1/profiles',
      matches: '/api/v1/matches',
      messages: '/api/v1/messages',
    },
  });
});

// API Routes
app.use('/api/v1', routes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    requestedPath: req.path,
    hint: 'All API routes are under /api/v1 prefix',
  });
});

// Error Handler
app.use((err, req, res, _next) => {
  logger.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

export default app;