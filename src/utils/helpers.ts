import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

/**
 * Generate a random email username
 */
export const generateRandomUsername = (length: number = 8): string => {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

/**
 * Generate a secure random string
 */
export const generateSecureRandom = (length: number = 32): string => {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Sanitize filename for safe storage
 */
export const sanitizeFilename = (filename: string): string => {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
};

/**
 * Format file size to human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Generate expiry date based on minutes
 */
export const generateExpiryDate = (minutes: number = 10): Date => {
  const now = new Date();
  return new Date(now.getTime() + minutes * 60 * 1000);
};

/**
 * Check if a date is expired
 */
export const isExpired = (date: Date): boolean => {
  return new Date() > date;
};

/**
 * Get remaining time in milliseconds
 */
export const getRemainingTime = (expiryDate: Date): number => {
  const now = new Date().getTime();
  const expiry = expiryDate.getTime();
  return Math.max(0, expiry - now);
};

/**
 * Format remaining time to human readable format
 */
export const formatRemainingTime = (milliseconds: number): string => {
  if (milliseconds <= 0) return 'Expired';
  
  const minutes = Math.floor(milliseconds / (1000 * 60));
  const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};

/**
 * Generate UUID
 */
export const generateUUID = (): string => {
  return uuidv4();
};

/**
 * Clean HTML content for safe display
 */
export const cleanHtmlContent = (html: string): string => {
  // Basic HTML sanitization - you might want to use a library like DOMPurify for production
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '');
};

/**
 * Extract domain from email
 */
export const extractDomain = (email: string): string => {
  return email.split('@')[1];
};

/**
 * Generate temporary email address
 */
export const generateTemporaryEmail = (domain: string, customName?: string): string => {
  const username = customName || generateRandomUsername();
  return `${username}@${domain}`;
};