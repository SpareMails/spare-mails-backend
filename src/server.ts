import express from 'express';
import cors from 'cors';
import path from 'path';

// Import configurations and utilities
import { environment, validateEnvironment } from './configs/environment';
import { connectDatabase } from './configs/database';
import logger from './configs/logger';
import { errorHandler, notFoundHandler } from './utils/responseHelpers';
import schedulerService from './utils/schedulerService';

// Import routes
import apiRoutes from './routes';

// Import models to ensure associations are set up
import './models';

const app = express();
const PORT = process.env.PORT || 3000;

// Validate environment variables
validateEnvironment();

// CORS configuration
const corsOptions = {
  origin: environment.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  next();
});

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    query: req.query,
  });
  next();
});

// Static files for attachments
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'SpareMails Backend API',
    version: '1.0.0',
    documentation: '/api/health',
    timestamp: new Date().toISOString(),
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  schedulerService.stop();
  
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    
    // Start scheduler service
    schedulerService.start();

    // Start SMTP server if enabled
    if (environment.ENABLE_SMTP_SERVER) {
      const smtpReceiver = (await import('./utils/smtpReceiver')).default;
      await smtpReceiver.start();
      logger.info('📧 SMTP email receiver started', {
        port: environment.SMTP_PORT,
        enabled: true,
      });
    } else {
      logger.info('📧 SMTP email receiver disabled');
    }
    
    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`🚀 SpareMails backend server is running on port ${PORT}`, {
        environment: environment.NODE_ENV,
        port: PORT,
        smtpEnabled: environment.ENABLE_SMTP_SERVER,
        smtpPort: environment.SMTP_PORT,
        timestamp: new Date().toISOString(),
      });
      
      // Log available endpoints
      logger.info('Available endpoints:', {
        health: '/api/health',
        temporaryEmails: '/api/temporary-emails',
        domains: '/api/domains',
        documentation: 'Check README.md for full API documentation',
      });
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
