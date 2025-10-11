import { createServer } from 'smtp-server';
import { simpleParser } from 'mailparser';
import emailProcessingService from './emailProcessingService';
import logger from '../configs/logger';

/**
 * SMTP Server for receiving emails
 */
export class SMTPEmailReceiver {
  private server: any;
  private port: number;

  constructor(port: number = 25) {
    this.port = port;
    this.initializeServer();
  }

  private initializeServer() {
    this.server = createServer({
      // Disable authentication for temporary email service
      disabledCommands: ['AUTH'],
      
      // Allow connections from any host
      allowInsecureAuth: true,
      
      // Handle incoming connections
      onConnect: (session, callback) => {
        logger.info('SMTP connection established', {
          remoteAddress: session.remoteAddress,
          clientHostname: session.clientHostname,
        });
        callback();
      },

      // Handle email data
      onData: async (stream, session, callback) => {
        try {
          // Parse the raw email
          const parsed = await simpleParser(stream);
          
          // Extract recipient email addresses
          const recipients = this.extractRecipients(session);
          
          logger.info('Received email via SMTP', {
            from: parsed.from?.text,
            to: recipients,
            subject: parsed.subject,
          });

          // Process each recipient
          for (const recipientEmail of recipients) {
            await emailProcessingService.processIncomingEmail({
              rawEmail: stream.toString(),
              recipientEmail,
            });
          }

          callback();
        } catch (error) {
          logger.error('Failed to process incoming SMTP email:', error);
          callback(new Error('Failed to process email'));
        }
      },

      // Handle errors
      onError: (error) => {
        logger.error('SMTP server error:', error);
      },
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
   * Start the SMTP server
   */
  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.listen(this.port, (error: any) => {
        if (error) {
          logger.error(`Failed to start SMTP server on port ${this.port}:`, error);
          reject(error);
        } else {
          logger.info(`🔧 SMTP server listening on port ${this.port}`);
          resolve();
        }
      });
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

export default new SMTPEmailReceiver(parseInt(process.env.SMTP_PORT || '2525'));