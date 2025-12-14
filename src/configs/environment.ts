import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Environment configuration with validation and defaults
 */
export const environment = {
  // Server Configuration
  PORT: process.env.PORT || '3000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database Configuration (Supabase PostgreSQL)
  DATABASE_URL: process.env.DATABASE_URL || '', // Supabase connection string
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || '5432',
  DB_NAME: process.env.DB_NAME || 'postgres',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '24h',
  
  // CORS Configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  
  // SMTP Server Configuration
  SMTP_HOST: process.env.SMTP_HOST || 'localhost',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '2525'),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@sparemail.com',
  ENABLE_SMTP_SERVER: process.env.ENABLE_SMTP_SERVER === 'true',
  
  // Cloudinary Configuration
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  
  // Application Configuration
  MAX_EMAILS_PER_ADDRESS: parseInt(process.env.MAX_EMAILS_PER_ADDRESS || '100'),
  EMAIL_RETENTION_DAYS: parseInt(process.env.EMAIL_RETENTION_DAYS || '7'),
  MAX_ATTACHMENT_SIZE: process.env.MAX_ATTACHMENT_SIZE || '10mb',
  
  // Security Configuration
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '12'),
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW || '15'), // minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  
  // Webhook Configuration
  WEBHOOK_TIMEOUT: parseInt(process.env.WEBHOOK_TIMEOUT || '30000'), // 30 seconds
  WEBHOOK_RETRY_ATTEMPTS: parseInt(process.env.WEBHOOK_RETRY_ATTEMPTS || '3'),
} as const;

/**
 * Validate required environment variables
 */
export function validateEnvironment(): void {
  const requiredVars = [
    'DB_HOST',
    'DB_NAME',
    'DB_USER',
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars);
    console.error('Please check your .env file and ensure all required variables are set.');
    process.exit(1);
  }
  
  // Warn about missing optional but important variables
  const importantVars = [
    'CLOUDINARY_CLOUD_NAME',
    'JWT_SECRET',
  ];
  
  const missingImportant = importantVars.filter(varName => !process.env[varName]);
  
  if (missingImportant.length > 0 && environment.NODE_ENV === 'production') {
    console.warn('⚠️  Missing important environment variables for production:', missingImportant);
  }
}

export default environment;