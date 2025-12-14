import { SMTPServer, SMTPServerOptions } from 'smtp-server';
import { simpleParser, ParsedMail, Attachment } from 'mailparser';
import emailProcessingService from './emailProcessingService';
import { processEmailAttachments } from '../configs/cloudinary';
import logger from '../configs/logger';
import { environment } from '../configs/environment';

/**
 * SMTP Server for receiving emails
 */
export class SMTPEmailReceiver {
  private server!: SMTPServer;
  private port: number;

  constructor(port: number = 25) {
    this.port = port;
    this.initializeServer();
  }

  private initializeServer() {
    const serverOptions: SMTPServerOptions = {
      // Disable authentication for temporary email service
      disabledCommands: ['AUTH'],
      
      // Allow connections from any host
      allowInsecureAuth: true,
      
      // Handle incoming connections
      onConnect: (session: any, callback: any) => {
        logger.info('SMTP connection established', {
          remoteAddress: session.remoteAddress,
          clientHostname: session.clientHostname,
        });
        callback();
      },

      // Handle email data
      onData: async (stream: any, session: any, callback: any) => {
        try {
          // Parse the raw email
          const parsed = await simpleParser(stream);
          
          // Extract recipient email addresses
          const recipients = this.extractRecipients(session);
          
          logger.info('Received email via SMTP', {
            from: parsed.from?.text,
            to: recipients,
            subject: parsed.subject,
            attachmentCount: parsed.attachments ? parsed.attachments.length : 0,
          });

          // Process each recipient
          for (const recipientEmail of recipients) {
            // Process attachments if any
            let processedAttachments: any[] = [];
            if (parsed.attachments && parsed.attachments.length > 0) {
              try {
                // Convert mailparser attachments to multer-like format for processing
                const multerFiles = this.convertAttachmentsToMulterFormat(parsed.attachments);
                processedAttachments = await processEmailAttachments(multerFiles);
                logger.info(`Processed ${processedAttachments.length} attachments for SMTP email`);
              } catch (error) {
                logger.error('Failed to process SMTP attachments:', error);
                // Continue processing email even if attachments fail
              }
            }

            // Use the webhook email processing service
            await emailProcessingService.processWebhookEmail({
              recipientEmail,
              fromEmail: parsed.from?.text || 'unknown@sender.com',
              subject: parsed.subject || '(No Subject)',
              textContent: parsed.text || '',
              htmlContent: parsed.html || '',
              attachments: processedAttachments,
              receivedAt: new Date(),
            });
          }

          callback();
        } catch (error) {
          logger.error('Failed to process incoming SMTP email:', error);
          callback(new Error('Failed to process email'));
        }
      },
    };

    this.server = new SMTPServer(serverOptions);
    
    // Handle server errors separately
    this.server.on('error', (error: Error) => {
      logger.error('SMTP server error:', error);
    });
  }

  /**
   * Extract recipient email addresses from SMTP session
   */
  private extractRecipients(session: any): string[] {
    const recipients: string[] = [];
    
    if (session.envelope && session.envelope.rcptTo) {
      for (const recipient of session.envelope.rcptTo) {
        recipients.push(recipient.address.toLowerCase());
      }
    }
    
    return recipients;
  }

  /**
   * Convert mailparser attachments to multer-like format for processing
   */
  private convertAttachmentsToMulterFormat(attachments: Attachment[]): Express.Multer.File[] {
    return attachments.map((attachment, index) => ({
      fieldname: `attachment-${index}`,
      originalname: attachment.filename || `attachment-${index}`,
      encoding: '7bit',
      mimetype: attachment.contentType || 'application/octet-stream',
      size: attachment.size || attachment.content?.length || 0,
      buffer: attachment.content || Buffer.alloc(0),
      destination: '',
      filename: attachment.filename || `attachment-${index}`,
      path: '',
      stream: undefined as any,
    }));
  }

  /**
   * Start the SMTP server
   */
  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server.listen(this.port, () => {
          logger.info(`🔧 SMTP server listening on port ${this.port}`);
          resolve();
        });
        
        this.server.on('error', (error: Error) => {
          logger.error(`Failed to start SMTP server on port ${this.port}:`, error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop the SMTP server
   */
  public stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          logger.info('SMTP server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

export default new SMTPEmailReceiver(environment.SMTP_PORT);