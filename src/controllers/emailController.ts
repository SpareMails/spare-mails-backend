import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { ReceivedEmail, TemporaryEmail } from '../models';
import { EmailQuery, GetEmailsResponse } from '../types';
import { sendSuccess, sendError, asyncHandler } from '../utils/responseHelpers';
import logger from '../configs/logger';

/**
 * Get received emails for a temporary email address
 */
export const getReceivedEmails = asyncHandler(
  async (req: Request<{ emailId: string }, any, any, EmailQuery>, res: Response) => {
    const { emailId } = req.params;
    const page = parseInt(String(req.query.page)) || 1;
    const limit = parseInt(String(req.query.limit)) || 10;
    const offset = (page - 1) * limit;
    const { isRead, search, sortBy = 'receivedAt', sortOrder = 'DESC' } = req.query;

    // Verify temporary email exists and is active
    const temporaryEmail = await TemporaryEmail.findByPk(emailId);
    if (!temporaryEmail) {
      return sendError(res, 'Temporary email not found', 404);
    }

    if (!temporaryEmail.isActive || temporaryEmail.isExpired()) {
      return sendError(res, 'Temporary email is not active or has expired', 410);
    }

    // Build where conditions
    const whereConditions: any = {
      temporaryEmailId: emailId,
    };

    if (typeof isRead === 'boolean') {
      whereConditions.isRead = isRead;
    }

    if (search) {
      whereConditions[Op.or] = [
        { fromEmail: { [Op.like]: `%${search}%` } },
        { fromName: { [Op.like]: `%${search}%` } },
        { subject: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await ReceivedEmail.findAndCountAll({
      where: whereConditions,
      order: [[sortBy, sortOrder]],
      limit,
      offset,
      include: [
        {
          association: 'temporaryEmail',
          attributes: ['email', 'expiresAt'],
        },
      ],
    });

    const response: GetEmailsResponse = {
      emails: rows,
      total: count,
      hasMore: offset + limit < count,
    };

    return sendSuccess(res, {
      ...response,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
        hasMore: response.hasMore,
      },
    });
  }
);

/**
 * Get a specific received email by ID
 */
export const getReceivedEmailById = asyncHandler(
  async (req: Request<{ emailId: string; id: string }>, res: Response) => {
    const { emailId, id } = req.params;

    const receivedEmail = await ReceivedEmail.findOne({
      where: {
        id,
        temporaryEmailId: emailId,
      },
      include: [
        {
          association: 'temporaryEmail',
          attributes: ['email', 'expiresAt', 'isActive'],
        },
      ],
    });

    if (!receivedEmail) {
      return sendError(res, 'Email not found', 404);
    }

    // Mark as read if not already
    if (!receivedEmail.isRead) {
      await receivedEmail.update({ isRead: true });
      logger.info(`Marked email as read: ${receivedEmail.id}`);
    }

    return sendSuccess(res, receivedEmail);
  }
);

/**
 * Mark email as read/unread
 */
export const markEmailAsRead = asyncHandler(
  async (req: Request<{ emailId: string; id: string }, any, { isRead: boolean }>, res: Response) => {
    const { emailId, id } = req.params;
    const { isRead = true } = req.body;

    const receivedEmail = await ReceivedEmail.findOne({
      where: {
        id,
        temporaryEmailId: emailId,
      },
    });

    if (!receivedEmail) {
      return sendError(res, 'Email not found', 404);
    }

    await receivedEmail.update({ isRead });

    logger.info(`Marked email as ${isRead ? 'read' : 'unread'}: ${receivedEmail.id}`);

    return sendSuccess(res, {
      id: receivedEmail.id,
      isRead,
    }, `Email marked as ${isRead ? 'read' : 'unread'} successfully`);
  }
);

/**
 * Delete a received email
 */
export const deleteReceivedEmail = asyncHandler(
  async (req: Request<{ emailId: string; id: string }>, res: Response) => {
    const { emailId, id } = req.params;

    const receivedEmail = await ReceivedEmail.findOne({
      where: {
        id,
        temporaryEmailId: emailId,
      },
    });

    if (!receivedEmail) {
      return sendError(res, 'Email not found', 404);
    }

    await receivedEmail.destroy();

    logger.info(`Deleted received email: ${receivedEmail.id}`);

    return sendSuccess(res, null, 'Email deleted successfully');
  }
);

/**
 * Get email statistics for a temporary email
 */
export const getEmailStats = asyncHandler(
  async (req: Request<{ emailId: string }>, res: Response) => {
    const { emailId } = req.params;

    // Verify temporary email exists
    const temporaryEmail = await TemporaryEmail.findByPk(emailId);
    if (!temporaryEmail) {
      return sendError(res, 'Temporary email not found', 404);
    }

    const totalEmails = await ReceivedEmail.count({
      where: { temporaryEmailId: emailId },
    });

    const unreadEmails = await ReceivedEmail.count({
      where: {
        temporaryEmailId: emailId,
        isRead: false,
      },
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const emailsToday = await ReceivedEmail.count({
      where: {
        temporaryEmailId: emailId,
        receivedAt: {
          [Op.gte]: todayStart,
        },
      },
    });

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const emailsThisWeek = await ReceivedEmail.count({
      where: {
        temporaryEmailId: emailId,
        receivedAt: {
          [Op.gte]: weekStart,
        },
      },
    });

    return sendSuccess(res, {
      totalEmails,
      unreadEmails,
      readEmails: totalEmails - unreadEmails,
      emailsToday,
      emailsThisWeek,
      temporaryEmail: {
        email: temporaryEmail.email,
        expiresAt: temporaryEmail.expiresAt,
        isActive: temporaryEmail.isActive,
        remainingTime: temporaryEmail.getRemainingTime(),
      },
    });
  }
);

/**
 * Mark all emails as read for a temporary email
 */
export const markAllEmailsAsRead = asyncHandler(
  async (req: Request<{ emailId: string }>, res: Response) => {
    const { emailId } = req.params;

    // Verify temporary email exists
    const temporaryEmail = await TemporaryEmail.findByPk(emailId);
    if (!temporaryEmail) {
      return sendError(res, 'Temporary email not found', 404);
    }

    const [updatedCount] = await ReceivedEmail.update(
      { isRead: true },
      {
        where: {
          temporaryEmailId: emailId,
          isRead: false,
        },
      }
    );

    logger.info(`Marked ${updatedCount} emails as read for temporary email: ${emailId}`);

    return sendSuccess(res, {
      updatedCount,
    }, 'All emails marked as read successfully');
  }
);