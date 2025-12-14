import { Router } from 'express';
import multer from 'multer';
import {
  handleGenericWebhook,
} from '../utils/webhookHandlers';

const router = Router();

// Configure multer for email attachments
const emailUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 20, // Max 20 files per request
  },
  fileFilter: (req, file, cb) => {
    // Accept all file types for emails
    cb(null, true);
  },
});

/**
 * @route   POST /api/webhooks/email
 * @desc    Generic webhook for SMTP email processing and testing
 * @access  Public (for SMTP integration and testing)
 */
router.post('/email', emailUpload.array('attachments'), handleGenericWebhook);

export default router;