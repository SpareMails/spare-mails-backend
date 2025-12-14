import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Domain } from '../models';
import { sendSuccess, sendError, asyncHandler } from '../utils/responseHelpers';
import { isValidEmail, extractDomain } from '../utils/helpers';
import logger from '../configs/logger';

/**
 * Get all available domains
 */
export const getDomains = asyncHandler(
  async (req: Request, res: Response) => {
    const domains = await Domain.findAll({
      where: { isActive: true },
      attributes: ['id', 'domain', 'isActive', 'createdAt'],
      order: [['domain', 'ASC']],
    });

    return sendSuccess(res, domains);
  }
);

/**
 * Create a new domain
 */
export const createDomain = asyncHandler(
  async (req: Request<{}, any, { domain: string }>, res: Response) => {
    const { domain } = req.body;

    if (!domain) {
      return sendError(res, 'Domain is required', 400);
    }

    // // Basic domain validation
    // const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    // if (!domainRegex.test(domain)) {
    //   return sendError(res, 'Invalid domain format', 400);
    // }

    try {
      const newDomain = await Domain.create({
        domain: domain.toLowerCase(),
        isActive: true,
      });

      logger.info(`Created new domain: ${domain}`, {
        id: newDomain.id,
      });

      return sendSuccess(res, newDomain, 'Domain created successfully', 201);
    } catch (error: any) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return sendError(res, 'Domain already exists', 409);
      }
      throw error;
    }
  }
);

/**
 * Update domain status
 */
export const updateDomain = asyncHandler(
  async (req: Request<{ id: string }, any, { isActive: boolean }>, res: Response) => {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return sendError(res, 'isActive must be a boolean value', 400);
    }

    const domain = await Domain.findByPk(id);
    if (!domain) {
      return sendError(res, 'Domain not found', 404);
    }

    await domain.update({ isActive });

    logger.info(`Updated domain status: ${domain.domain}`, {
      id: domain.id,
      isActive,
    });

    return sendSuccess(res, domain, 'Domain updated successfully');
  }
);

/**
 * Delete a domain
 */
export const deleteDomain = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;

    const domain = await Domain.findByPk(id);
    if (!domain) {
      return sendError(res, 'Domain not found', 404);
    }

    // Check if domain is being used by any temporary emails
    const { TemporaryEmail } = await import('../models');
    const activeEmailsCount = await TemporaryEmail.count({
      where: {
        domain: domain.domain,
        isActive: true,
      },
    });

    if (activeEmailsCount > 0) {
      return sendError(res, 'Cannot delete domain with active temporary emails', 400);
    }

    await domain.destroy();

    logger.info(`Deleted domain: ${domain.domain}`, {
      id: domain.id,
    });

    return sendSuccess(res, null, 'Domain deleted successfully');
  }
);

/**
 * Get domain statistics
 */
export const getDomainStats = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;

    const domain = await Domain.findByPk(id);
    if (!domain) {
      return sendError(res, 'Domain not found', 404);
    }

    const { TemporaryEmail, ReceivedEmail } = await import('../models');

    const totalEmails = await TemporaryEmail.count({
      where: { domain: domain.domain },
    });

    const activeEmails = await TemporaryEmail.count({
      where: {
        domain: domain.domain,
        isActive: true,
        expiresAt: {
          [Op.gt]: new Date(),
        },
      },
    });

    const totalReceivedEmails = await ReceivedEmail.count({
      include: [
        {
          model: TemporaryEmail,
          as: 'temporaryEmail',
          where: { domain: domain.domain },
          attributes: [],
        },
      ],
    });

    return sendSuccess(res, {
      domain: domain.domain,
      totalEmails,
      activeEmails,
      expiredEmails: totalEmails - activeEmails,
      totalReceivedEmails,
      isActive: domain.isActive,
      createdAt: domain.createdAt,
    });
  }
);