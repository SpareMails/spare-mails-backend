import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';
import logger from '../configs/logger';

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Send standardized API response
 */
export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  success: boolean,
  data?: T,
  message?: string,
  error?: string
): Response => {
  const response: ApiResponse<T> = {
    success,
    ...(data && { data }),
    ...(message && { message }),
    ...(error && { error }),
  };

  return res.status(statusCode).json(response);
};

/**
 * Send success response
 */
export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode: number = 200
): Response => {
  return sendResponse(res, statusCode, true, data, message);
};

/**
 * Send error response
 */
export const sendError = (
  res: Response,
  error: string,
  statusCode: number = 400,
  message?: string
): Response => {
  return sendResponse(res, statusCode, false, undefined, message, error);
};

/**
 * Global error handler middleware
 */
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  logger.error('Error caught by global handler:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  // Sequelize validation errors
  if (error.name === 'SequelizeValidationError') {
    const errors = error.errors.map((err: any) => err.message);
    return sendError(res, errors.join(', '), 400, 'Validation Error');
  }

  // Sequelize unique constraint errors
  if (error.name === 'SequelizeUniqueConstraintError') {
    return sendError(res, 'Resource already exists', 409, 'Duplicate Entry');
  }

  // Sequelize foreign key constraint errors
  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return sendError(res, 'Referenced resource not found', 400, 'Invalid Reference');
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token', 401, 'Authentication Error');
  }

  if (error.name === 'TokenExpiredError') {
    return sendError(res, 'Token expired', 401, 'Authentication Error');
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  
  return sendError(res, message, statusCode);
};

/**
 * 404 handler middleware
 */
export const notFoundHandler = (req: Request, res: Response): Response => {
  return sendError(res, `Route ${req.originalUrl} not found`, 404, 'Not Found');
};

/**
 * Validate required fields in request body
 */
export const validateRequiredFields = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction): Response | void => {
    const missingFields = fields.filter(field => req.body[field] === undefined || req.body[field] === null);
    
    if (missingFields.length > 0) {
      return sendError(
        res,
        `Missing required fields: ${missingFields.join(', ')}`,
        400,
        'Validation Error'
      );
    }
    
    next();
  };
};

/**
 * Validate pagination query parameters
 */
export const validatePagination = (req: Request, res: Response, next: NextFunction): void => {
  const { page, limit } = req.query;
  
  if (page && (isNaN(Number(page)) || Number(page) < 1)) {
    req.query.page = '1';
  }
  
  if (limit && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
    req.query.limit = '10';
  }
  
  next();
};