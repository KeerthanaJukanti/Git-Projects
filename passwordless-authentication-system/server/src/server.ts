import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import mongoose from 'mongoose';
import createError from 'http-errors';

import { authRouter } from './routes/authRoutes.js';
import { requireAuth } from './middleware/jwtAuthMiddleware.js';
import { User } from './models/User.js';
import { logger } from './utils/logger.js';

// Dynamic configuration
const PORT = Number(process.env.PORT) || 4000;
const MONGODB_URI = process.env.MONGODB_URI;
const ORIGIN = process.env.APP_URL || 'http://localhost:5173';

// Allow multiple origins for development
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  ORIGIN
].filter(Boolean);

// Validate required environment variables
if (!MONGODB_URI) {
  logger.error('MONGODB_URI environment variable is required');
  process.exit(1);
}

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
app.use(cors({ 
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    
    // In development, be more permissive
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Cookie parsing middleware
app.use(cookieParser());

// Logging middleware
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/auth', authRouter);

// Protected route example
app.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const user = await User.findById(req.user.sub);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ 
      user: {
        ...req.user,
        email: user.email
      }
    });
  } catch (error) {
    logger.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// 404 handler
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(createError(404, 'Not Found'));
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  let status = err.status || 500;
  let message = err.message || 'Internal Server Error';
  
  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    status = 400;
    message = 'Validation failed: ' + err.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
  }
  
  logger.error('Error:', err);
  
  res.status(status).json({ 
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Database connection and server startup
mongoose.connect(MONGODB_URI)
  .then(() => {
    logger.success('MongoDB connected successfully');
    startServer();
  })
  .catch((error) => {
    logger.failure('MongoDB connection error:', error);
    logger.info('Starting server without database connection...');
    startServer();
  });

function startServer() {
  app.listen(PORT, '0.0.0.0', () => {
    logger.success(`Server running on http://0.0.0.0:${PORT}`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
    logger.info(`Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
  });
}
