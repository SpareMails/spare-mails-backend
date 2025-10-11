import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { TemporaryEmail, Domain } from '../models';
import { 
  CreateTemporaryEmailRequest, 
  CreateTemporaryEmailResponse,
  PaginationQuery 
} from '../types';
import { 
  generateTemporaryEmail, 
  generateExpiryDate, 
  isValidEmail,
  generateRandomUsername 
} from '../utils/helpers';
import { sendSuccess, sendError, asyncHandler } from '../utils/responseHelpers';
import logger from '../configs/logger';

/**
 * Create a new temporary email address
 */
export const createTemporaryEmail = asyncHandler(
  async (req: Request<{}, CreateTemporaryEmailResponse, CreateTemporaryEmailRequest>, res: Response) => {
    const { customName, domain: requestedDomain, expiryMinutes = 10 } = req.body;

    // Validate expiry minutes (between 1 minute and 24 hours)
    if (expiryMinutes < 1 || expiryMinutes > 1440) {
      return sendError(res, 'Expiry minutes must be between 1 and 1440 (24 hours)', 400);
    }

    // Get available domains
    const availableDomains = await Domain.findAll({
      where: { isActive: true },
      attributes: ['domain'],
    });

    if (availableDomains.length === 0) {
      return sendError(res, 'No domains available', 500);
    }

    // Select domain
    let selectedDomain = requestedDomain;
    if (!selectedDomain || !availableDomains.find(d => d.domain === selectedDomain)) {
      selectedDomain = availableDomains[Math.floor(Math.random() * availableDomains.length)].domain;
    }

    // Generate email address
    let emailAddress: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      const username = customName || generateRandomUsername();
      emailAddress = generateTemporaryEmail(selectedDomain, username);
      attempts++;

      // Check if email already exists
      const existingEmail = await TemporaryEmail.findOne({
        where: { email: emailAddress }
      });

      if (!existingEmail) break;

      if (attempts >= maxAttempts) {
        return sendError(res, 'Unable to generate unique email address', 500);
      }
    } while (attempts < maxAttempts);

    // Create temporary email
    const expiresAt = generateExpiryDate(expiryMinutes);
    
    const temporaryEmail = await TemporaryEmail.create({
      email: emailAddress,
      domain: selectedDomain,
      isActive: true,
      expiresAt,
    });

    logger.info(`Created temporary email: ${emailAddress}`, {
      id: temporaryEmail.id,
      expiresAt,
      domain: selectedDomain,
    });

    return sendSuccess(res, {
      email: temporaryEmail.email,
      expiresAt: temporaryEmail.expiresAt,
      id: temporaryEmail.id,
    }, 'Temporary email created successfully', 201);
  }
);

/**
 * Get all temporary emails with pagination
 */
export const getTemporaryEmails = asyncHandler(
  async (req: Request<{}, any, any, PaginationQuery>, res: Response) => {
    const page = parseInt(String(req.query.page)) || 1;
    const limit = parseInt(String(req.query.limit)) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await TemporaryEmail.findAndCountAll({
      where: {
        isActive: true,
        expiresAt: {
          [Op.gt]: new Date(),
        },
      },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      include: [
        {
          association: 'domainInfo',
          attributes: ['domain', 'isActive'],
        },
      ],
    });

    return sendSuccess(res, {
      emails: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
        hasMore: offset + limit < count,
      },
    });
  }
);

/**
 * Get temporary email by ID
 */
export const getTemporaryEmailById = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;

    const temporaryEmail = await TemporaryEmail.findByPk(id, {
      include: [
        {
          association: 'domainInfo',
          attributes: ['domain', 'isActive'],
        },
        {
          association: 'receivedEmails',
          separate: true,
          order: [['receivedAt', 'DESC']],
          limit: 10,
        },
      ],
    });

    if (!temporaryEmail) {
      return sendError(res, 'Temporary email not found', 404);
    }

    // Check if expired
    if (temporaryEmail.isExpired()) {
      await temporaryEmail.update({ isActive: false });
      return sendError(res, 'Temporary email has expired', 410);
    }

    return sendSuccess(res, temporaryEmail);
  }
);

/**
 * Delete temporary email
 */
export const deleteTemporaryEmail = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;

    const temporaryEmail = await TemporaryEmail.findByPk(id);

    if (!temporaryEmail) {
      return sendError(res, 'Temporary email not found', 404);
    }

    await temporaryEmail.update({ isActive: false });

    logger.info(`Deactivated temporary email: ${temporaryEmail.email}`, {
      id: temporaryEmail.id,
    });

    return sendSuccess(res, null, 'Temporary email deactivated successfully');
  }
);

/**
 * Extend temporary email expiry
 */
export const extendTemporaryEmail = asyncHandler(
  async (req: Request<{ id: string }, any, { minutes: number }>, res: Response) => {
    const { id } = req.params;
    const { minutes = 10 } = req.body;

    // Validate minutes
    if (minutes < 1 || minutes > 1440) {
      return sendError(res, 'Minutes must be between 1 and 1440 (24 hours)', 400);
    }

    const temporaryEmail = await TemporaryEmail.findByPk(id);

    if (!temporaryEmail) {
      return sendError(res, 'Temporary email not found', 404);
    }

    if (!temporaryEmail.isActive) {
      return sendError(res, 'Temporary email is not active', 400);
    }

    // Extend expiry
    const newExpiryDate = generateExpiryDate(minutes);
    await temporaryEmail.update({ expiresAt: newExpiryDate });

    logger.info(`Extended temporary email: ${temporaryEmail.email}`, {
      id: temporaryEmail.id,
      newExpiryDate,
      minutes,
    });

    return sendSuccess(res, {
      email: temporaryEmail.email,
      expiresAt: newExpiryDate,
    }, 'Temporary email extended successfully');
  }
);

/**
 * Clean up expired temporary emails
 */
export const cleanupExpiredEmails = asyncHandler(
  async (req: Request, res: Response) => {
    const [updatedCount] = await TemporaryEmail.update(
      { isActive: false },
      {
        where: {
          isActive: true,
          expiresAt: {
            [Op.lt]: new Date(),
          },
        },
      }
    );

    logger.info(`Cleaned up ${updatedCount} expired temporary emails`);

    return sendSuccess(res, {
      cleanedCount: updatedCount,
    }, 'Expired emails cleaned up successfully');
  }
);