import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';

import routes from './routes/index.js';
import { logger } from './config/logger.js';

const app = express();

// Security (relaxed for development)
if (process.env.NODE_ENV === 'production') {
  app.use(helmet());
} else {
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));
}

// CORS (allow all in development)
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Compression
app.use(compression());

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
    documentation: 'https://github.com/pushp314/chhattisgarhshadi-backend',
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