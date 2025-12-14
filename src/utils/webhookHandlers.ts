import { Request, Response } from 'express';
import { asyncHandler, sendSuccess, sendError } from './responseHelpers';
import emailProcessingService from './emailProcessingService';
import { processEmailAttachments } from '../configs/cloudinary';
import logger from '../configs/logger';

/**
 * Webhook handler for receiving emails from SMTP server and testing
 */

interface EmailWebhookData {
  to: string;
  from: string;
  subject?: string;
  text?: string;
  html?: string;
  textContent?: string;
  htmlContent?: string;
  timestamp?: string;
}

/**
 * Generic webhook handler for SMTP email processing and testing
 */
export const handleGenericWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const emailData: EmailWebhookData = req.body;
      const files = req.files as Express.Multer.File[] || [];
      
      if (!emailData.to || !emailData.from) {
        return sendError(res, 'Missing required fields: to, from', 400);
      }

      logger.info('Received email webhook', {
        to: emailData.to,
        from: emailData.from,
        subject: emailData.subject,
        hasAttachments: files.length > 0,
        attachmentCount: files.length,
      });

      // Process attachments if any
      let processedAttachments: any[] = [];
      if (files && files.length > 0) {
        try {
          processedAttachments = await processEmailAttachments(files);
          logger.info(`Processed ${processedAttachments.length} attachments for email webhook`);
        } catch (error) {
          logger.error('Failed to process attachments:', error);
          // Continue processing email even if attachments fail
        }
      }

      // Process the email
      const processedEmail = await emailProcessingService.processWebhookEmail({
        recipientEmail: emailData.to,
        fromEmail: emailData.from,
        subject: emailData.subject || '(No Subject)',
        textContent: emailData.text || emailData.textContent,
        htmlContent: emailData.html || emailData.htmlContent,
        attachments: processedAttachments,
        receivedAt: emailData.timestamp ? new Date(emailData.timestamp) : new Date(),
      });

      if (processedEmail) {
        return sendSuccess(res, { 
          emailId: processedEmail.id,
          attachmentCount: processedAttachments.length,
          message: 'Email processed successfully'
        }, 'Email received and processed');
      } else {
        return sendError(res, 'Failed to process email', 400);
      }
    } catch (error) {
      logger.error('Email webhook processing failed:', error);
      return sendError(res, 'Internal server error', 500);
    }
  }
);