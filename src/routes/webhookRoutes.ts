import { Router } from 'express';
import {
  handleMailgunWebhook,
  handleSendGridWebhook,
  handleGenericWebhook,
} from '../utils/webhookHandlers';

const router = Router();

/**
 * @route   POST /api/webhooks/mailgun
 * @desc    Handle incoming emails from Mailgun
 * @access  Public (but should be secured with API keys in production)
 */
router.post('/mailgun', handleMailgunWebhook);

/**
 * @route   POST /api/webhooks/sendgrid
 * @desc    Handle incoming emails from SendGrid
 * @access  Public (but should be secured with API keys in production)
 */
router.post('/sendgrid', handleSendGridWebhook);

/**
 * @route   POST /api/webhooks/email
 * @desc    Generic webhook for testing email reception
 * @access  Public (for testing only)
 */
router.post('/email', handleGenericWebhook);

export default router;