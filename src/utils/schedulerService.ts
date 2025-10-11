import cron from 'node-cron';
import { Op } from 'sequelize';
import { TemporaryEmail, ReceivedEmail } from '../models';
import emailProcessingService from './emailProcessingService';
import logger from '../configs/logger';

/**
 * Service for scheduled tasks and cleanup operations
 */
export class SchedulerService {
  private isRunning: boolean = false;

  /**
   * Start all scheduled tasks
   */
  public start(): void {
    if (this.isRunning) {
      logger.warn('Scheduler service is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting scheduler service');

    // Clean up expired temporary emails every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      try {
        await this.cleanupExpiredEmails();
      } catch (error) {
        logger.error('Failed to cleanup expired emails:', error);
      }
    });

    // Clean up old received emails every hour
    cron.schedule('0 * * * *', async () => {
      try {
        await this.cleanupOldReceivedEmails();
      } catch (error) {
        logger.error('Failed to cleanup old received emails:', error);
      }
    });

    // Clean up old attachments daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      try {
        await emailProcessingService.cleanupOldAttachments(7);
      } catch (error) {
        logger.error('Failed to cleanup old attachments:', error);
      }
    });

    // Database maintenance weekly on Sunday at 3 AM
    cron.schedule('0 3 * * 0', async () => {
      try {
        await this.performDatabaseMaintenance();
      } catch (error) {
        logger.error('Failed to perform database maintenance:', error);
      }
    });

    logger.info('All scheduled tasks started successfully');
  }

  /**
   * Stop all scheduled tasks
   */
  public stop(): void {
    if (!this.isRunning) {
      logger.warn('Scheduler service is not running');
      return;
    }

    cron.getTasks().forEach((task: any) => task.stop());
    this.isRunning = false;
    logger.info('Scheduler service stopped');
  }

  /**
   * Clean up expired temporary emails
   */
  private async cleanupExpiredEmails(): Promise<void> {
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

    if (updatedCount > 0) {
      logger.info(`Deactivated ${updatedCount} expired temporary emails`);
    }
  }

  /**
   * Clean up old received emails (older than 30 days)
   */
  private async cleanupOldReceivedEmails(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // First, get emails to be deleted for logging
    const emailsToDelete = await ReceivedEmail.findAll({
      where: {
        createdAt: {
          [Op.lt]: thirtyDaysAgo,
        },
      },
      include: [
        {
          association: 'temporaryEmail',
          attributes: ['email'],
        },
      ],
    });

    if (emailsToDelete.length === 0) {
      return;
    }

    // Delete the emails (cascade will handle attachments)
    const deletedCount = await ReceivedEmail.destroy({
      where: {
        createdAt: {
          [Op.lt]: thirtyDaysAgo,
        },
      },
    });

    logger.info(`Deleted ${deletedCount} old received emails`, {
      olderThanDays: 30,
      deletedEmails: emailsToDelete.map(email => ({
        id: email.id,
        temporaryEmailId: email.temporaryEmailId,
        from: email.fromEmail,
        subject: email.subject,
        receivedAt: email.receivedAt,
      })),
    });
  }

  /**
   * Clean up inactive temporary emails (older than 7 days)
   */
  private async cleanupInactiveTemporaryEmails(): Promise<void> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const deletedCount = await TemporaryEmail.destroy({
      where: {
        isActive: false,
        updatedAt: {
          [Op.lt]: sevenDaysAgo,
        },
      },
    });

    if (deletedCount > 0) {
      logger.info(`Deleted ${deletedCount} inactive temporary emails older than 7 days`);
    }
  }

  /**
   * Perform database maintenance tasks
   */
  private async performDatabaseMaintenance(): Promise<void> {
    logger.info('Starting weekly database maintenance');

    // Clean up inactive temporary emails
    await this.cleanupInactiveTemporaryEmails();

    // Log database statistics
    await this.logDatabaseStats();

    logger.info('Weekly database maintenance completed');
  }

  /**
   * Log database statistics
   */
  private async logDatabaseStats(): Promise<void> {
    try {
      const totalTemporaryEmails = await TemporaryEmail.count();
      const activeTemporaryEmails = await TemporaryEmail.count({
        where: {
          isActive: true,
          expiresAt: {
            [Op.gt]: new Date(),
          },
        },
      });

      const totalReceivedEmails = await ReceivedEmail.count();
      const unreadEmails = await ReceivedEmail.count({
        where: { isRead: false },
      });

      // Calculate emails received in the last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const emailsLast24h = await ReceivedEmail.count({
        where: {
          receivedAt: {
            [Op.gte]: yesterday,
          },
        },
      });

      logger.info('Database statistics', {
        totalTemporaryEmails,
        activeTemporaryEmails,
        expiredTemporaryEmails: totalTemporaryEmails - activeTemporaryEmails,
        totalReceivedEmails,
        unreadEmails,
        emailsLast24h,
      });
    } catch (error) {
      logger.error('Failed to log database statistics:', error);
    }
  }

  /**
   * Get scheduler status
   */
  public getStatus(): { isRunning: boolean; activeTasks: number } {
    const activeTasks = cron.getTasks().size;
    return {
      isRunning: this.isRunning,
      activeTasks,
    };
  }
}

export default new SchedulerService();