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
import { rateLimiter } from './middleware/rate-limiter.middleware.js';
import { errorHandler } from './middleware/error-handler.middleware.js';
import { env } from './config/env.js';

const app = express();

// Trust proxy is required when running behind a load balancer (like Render, Heroku, AWS ELB)
// This fixes the "X-Forwarded-For" header validation error from express-rate-limit
app.set('trust proxy', 1);

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

// CORS - More secure configuration
const allowedOrigins = env.CORS_ORIGIN ? env.CORS_ORIGIN.split(',').map(o => o.trim()) : [];

const corsOptions = {
  origin: (origin, callback) => {
    // In development, if no origins are specified, allow everything.
    if (process.env.NODE_ENV !== 'production' && allowedOrigins.length === 0) {
      return callback(null, true);
    }

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if the origin is in our allowed list
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }

    return callback(null, true);
  },
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

// Rate limiting
app.use(rateLimiter);

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
app.use(errorHandler);

export default app;