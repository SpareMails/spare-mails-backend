import { simpleParser, ParsedMail, Attachment } from 'mailparser';
import { ReceivedEmail, TemporaryEmail, EmailAttachment } from '../models';
import { sanitizeFilename, cleanHtmlContent } from '../utils/helpers';
import logger from '../configs/logger';
import fs from 'fs/promises';
import path from 'path';

interface ProcessEmailOptions {
  rawEmail: string;
  recipientEmail: string;
}

interface ProcessedAttachment {
  filename: string;
  contentType: string;
  size: number;
  filePath: string;
}

/**
 * Service for processing incoming emails
 */
export class EmailProcessingService {
  private attachmentsDir: string;

  constructor() {
    this.attachmentsDir = path.join(process.cwd(), 'uploads', 'attachments');
    this.ensureAttachmentsDirectory();
  }

  private async ensureAttachmentsDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.attachmentsDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create attachments directory:', error);
    }
  }

  /**
   * Process incoming email and save to database
   */
  public async processIncomingEmail(options: ProcessEmailOptions): Promise<ReceivedEmail | null> {
    try {
      const { rawEmail, recipientEmail } = options;

      // Find the temporary email
      const temporaryEmail = await TemporaryEmail.findOne({
        where: {
          email: recipientEmail,
          isActive: true,
        },
      });

      if (!temporaryEmail) {
        logger.warn(`Received email for unknown or inactive temporary email: ${recipientEmail}`);
        return null;
      }

      // Check if temporary email is expired
      if (temporaryEmail.isExpired()) {
        logger.warn(`Received email for expired temporary email: ${recipientEmail}`);
        await temporaryEmail.update({ isActive: false });
        return null;
      }

      // Parse the email
      const parsedEmail = await simpleParser(rawEmail);

      // Process attachments
      const processedAttachments = await this.processAttachments(parsedEmail.attachments || []);

      // Create received email record
      const receivedEmail = await ReceivedEmail.create({
        temporaryEmailId: temporaryEmail.id,
        fromEmail: this.extractEmailAddress(parsedEmail.from),
        fromName: this.extractEmailName(parsedEmail.from),
        subject: parsedEmail.subject || '(No Subject)',
        textContent: parsedEmail.text || '',
        htmlContent: parsedEmail.html ? cleanHtmlContent(parsedEmail.html) : '',
        attachments: processedAttachments as any, // Store processed attachments info
        isRead: false,
        receivedAt: parsedEmail.date || new Date(),
      });

      // Save attachment records
      if (processedAttachments.length > 0) {
        const attachmentRecords = processedAttachments.map(attachment => ({
          emailId: receivedEmail.id,
          filename: attachment.filename,
          contentType: attachment.contentType,
          size: attachment.size,
          filePath: attachment.filePath,
        }));

        await EmailAttachment.bulkCreate(attachmentRecords);
      }

      logger.info(`Processed incoming email for: ${recipientEmail}`, {
        emailId: receivedEmail.id,
        from: receivedEmail.fromEmail,
        subject: receivedEmail.subject,
        attachmentCount: processedAttachments.length,
      });

      return receivedEmail;
    } catch (error) {
      logger.error('Failed to process incoming email:', error);
      return null;
    }
  }

  /**
   * Process email attachments
   */
  private async processAttachments(attachments: Attachment[]): Promise<ProcessedAttachment[]> {
    const processedAttachments: ProcessedAttachment[] = [];

    for (const attachment of attachments) {
      try {
        if (!attachment.content || !attachment.filename) {
          continue;
        }

        // Sanitize filename
        const sanitizedFilename = sanitizeFilename(attachment.filename);
        const timestamp = new Date().getTime();
        const filename = `${timestamp}_${sanitizedFilename}`;
        const filePath = path.join(this.attachmentsDir, filename);

        // Save attachment to disk
        await fs.writeFile(filePath, attachment.content);

        processedAttachments.push({
          filename: attachment.filename,
          contentType: attachment.contentType || 'application/octet-stream',
          size: attachment.size || attachment.content.length,
          filePath,
        });

        logger.debug(`Saved attachment: ${filename}`, {
          originalName: attachment.filename,
          size: attachment.size || attachment.content.length,
          contentType: attachment.contentType,
        });
      } catch (error) {
        logger.error(`Failed to process attachment: ${attachment.filename}`, error);
      }
    }

    return processedAttachments;
  }

  /**
   * Extract email address from parsed email address object
   */
  private extractEmailAddress(from: any): string {
    if (!from) return '';
    
    if (typeof from === 'string') {
      const match = from.match(/<(.+)>/);
      return match ? match[1] : from;
    }

    if (from.value && from.value.length > 0) {
      return from.value[0].address || '';
    }

    return from.text || '';
  }

  /**
   * Extract name from parsed email address object
   */
  private extractEmailName(from: any): string | undefined {
    if (!from) return undefined;
    
    if (typeof from === 'string') {
      const match = from.match(/^(.+?)\s*</);
      return match ? match[1].trim() : undefined;
    }

    if (from.value && from.value.length > 0) {
      return from.value[0].name || undefined;
    }

    return undefined;
  }

  /**
   * Process webhook email data
   */
  public async processWebhookEmail(options: {
    recipientEmail: string;
    fromEmail: string;
    subject: string;
    textContent?: string;
    htmlContent?: string;
    attachments?: any[];
    receivedAt: Date;
  }): Promise<ReceivedEmail | null> {
    try {
      const { recipientEmail, fromEmail, subject, textContent, htmlContent, attachments = [], receivedAt } = options;

      // Find the temporary email
      const temporaryEmail = await TemporaryEmail.findOne({
        where: {
          email: recipientEmail,
          isActive: true,
        },
      });

      if (!temporaryEmail) {
        logger.warn(`Received email for unknown or inactive temporary email: ${recipientEmail}`);
        return null;
      }

      // Check if temporary email is expired
      if (temporaryEmail.isExpired()) {
        logger.warn(`Received email for expired temporary email: ${recipientEmail}`);
        await temporaryEmail.update({ isActive: false });
        return null;
      }

      // Create received email record
      const receivedEmail = await ReceivedEmail.create({
        temporaryEmailId: temporaryEmail.id,
        fromEmail,
        fromName: this.extractNameFromEmail(fromEmail),
        subject,
        textContent: textContent || '',
        htmlContent: htmlContent ? cleanHtmlContent(htmlContent) : '',
        attachments: [], // Webhook attachments handling can be added later
        isRead: false,
        receivedAt,
      });

      logger.info(`Processed webhook email for: ${recipientEmail}`, {
        emailId: receivedEmail.id,
        from: receivedEmail.fromEmail,
        subject: receivedEmail.subject,
      });

      return receivedEmail;
    } catch (error) {
      logger.error('Failed to process webhook email:', error);
      return null;
    }
  }

  /**
   * Extract name from email address
   */
  private extractNameFromEmail(email: string): string | undefined {
    const match = email.match(/^(.+?)\s*<.+>$/);
    return match ? match[1].trim() : undefined;
  }

  /**
   * Clean up old attachments
   */
  public async cleanupOldAttachments(olderThanDays: number = 7): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      // Find old attachment records
      const oldAttachments = await EmailAttachment.findAll({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      // Delete files and records
      for (const attachment of oldAttachments) {
        try {
          await fs.unlink(attachment.filePath);
          await attachment.destroy();
          logger.debug(`Cleaned up old attachment: ${attachment.filename}`);
        } catch (error) {
          logger.warn(`Failed to cleanup attachment: ${attachment.filename}`, error);
        }
      }

      logger.info(`Cleaned up ${oldAttachments.length} old attachments`);
    } catch (error) {
      logger.error('Failed to cleanup old attachments:', error);
    }
  }
}

export default new EmailProcessingService();