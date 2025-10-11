import { Request, Response } from 'express';
import { asyncHandler, sendSuccess, sendError } from './responseHelpers';
import emailProcessingService from './emailProcessingService';
import logger from '../configs/logger';

/**
 * Webhook handler for receiving emails from external services
 * This can be used with services like Mailgun, SendGrid, Postmark, etc.
 */

interface WebhookEmailData {
  to: string;
  from: string;
  subject: string;
  'body-plain'?: string;
  'body-html'?: string;
  'stripped-text'?: string;
  'stripped-html'?: string;
  attachments?: any[];
  timestamp?: string;
}

/**
 * Handle incoming email webhook (Mailgun format)
 */
export const handleMailgunWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const emailData: WebhookEmailData = req.body;
      
      logger.info('Received email webhook', {
        to: emailData.to,
        from: emailData.from,
        subject: emailData.subject,
        timestamp: emailData.timestamp,
      });

      // Process the email
      const processedEmail = await emailProcessingService.processWebhookEmail({
        recipientEmail: emailData.to,
        fromEmail: emailData.from,
        subject: emailData.subject || '(No Subject)',
        textContent: emailData['body-plain'] || emailData['stripped-text'],
        htmlContent: emailData['body-html'] || emailData['stripped-html'],
        attachments: emailData.attachments || [],
        receivedAt: emailData.timestamp ? new Date(emailData.timestamp) : new Date(),
      });

      if (processedEmail) {
        return sendSuccess(res, { emailId: processedEmail.id }, 'Email processed successfully');
      } else {
        return sendError(res, 'Failed to process email', 400);
      }
    } catch (error) {
      logger.error('Webhook email processing failed:', error);
      return sendError(res, 'Internal server error', 500);
    }
  }
);

/**
 * Handle incoming email webhook (SendGrid format)
 */
export const handleSendGridWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const emailData = req.body;
      
      logger.info('Received SendGrid webhook', {
        to: emailData.to,
        from: emailData.from,
        subject: emailData.subject,
      });

      // Process the email
      const processedEmail = await emailProcessingService.processWebhookEmail({
        recipientEmail: emailData.to,
        fromEmail: emailData.from,
        subject: emailData.subject || '(No Subject)',
        textContent: emailData.text,
        htmlContent: emailData.html,
        attachments: emailData.attachments || [],
        receivedAt: new Date(),
      });

      if (processedEmail) {
        return sendSuccess(res, { emailId: processedEmail.id }, 'Email processed successfully');
      } else {
        return sendError(res, 'Failed to process email', 400);
      }
    } catch (error) {
      logger.error('SendGrid webhook processing failed:', error);
      return sendError(res, 'Internal server error', 500);
    }
  }
);

/**
 * Generic webhook handler for testing
 */
export const handleGenericWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { to, from, subject, text, html } = req.body;
      
      if (!to || !from) {
        return sendError(res, 'Missing required fields: to, from', 400);
      }

      logger.info('Received generic email webhook', {
        to,
        from,
        subject,
      });

      // Process the email
      const processedEmail = await emailProcessingService.processWebhookEmail({
        recipientEmail: to,
        fromEmail: from,
        subject: subject || '(No Subject)',
        textContent: text,
        htmlContent: html,
        attachments: [],
        receivedAt: new Date(),
      });

      if (processedEmail) {
        return sendSuccess(res, { emailId: processedEmail.id }, 'Email processed successfully');
      } else {
        return sendError(res, 'Failed to process email', 400);
      }
    } catch (error) {
      logger.error('Generic webhook processing failed:', error);
      return sendError(res, 'Internal server error', 500);
    }
  }
);