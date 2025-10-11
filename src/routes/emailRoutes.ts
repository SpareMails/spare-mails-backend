import { Router } from 'express';
import {
  getReceivedEmails,
  getReceivedEmailById,
  markEmailAsRead,
  deleteReceivedEmail,
  getEmailStats,
  markAllEmailsAsRead,
} from '../controllers/emailController';
import { validatePagination } from '../utils/responseHelpers';

const router = Router({ mergeParams: true }); // mergeParams allows access to parent route params

/**
 * @route   GET /api/temporary-emails/:emailId/emails
 * @desc    Get received emails for a temporary email address
 * @access  Public
 */
router.get('/', validatePagination, getReceivedEmails);

/**
 * @route   GET /api/temporary-emails/:emailId/emails/stats
 * @desc    Get email statistics for a temporary email
 * @access  Public
 */
router.get('/stats', getEmailStats);

/**
 * @route   PUT /api/temporary-emails/:emailId/emails/mark-all-read
 * @desc    Mark all emails as read for a temporary email
 * @access  Public
 */
router.put('/mark-all-read', markAllEmailsAsRead);

/**
 * @route   GET /api/temporary-emails/:emailId/emails/:id
 * @desc    Get a specific received email by ID
 * @access  Public
 */
router.get('/:id', getReceivedEmailById);

/**
 * @route   PUT /api/temporary-emails/:emailId/emails/:id/read
 * @desc    Mark email as read/unread
 * @access  Public
 */
router.put('/:id/read', markEmailAsRead);

/**
 * @route   DELETE /api/temporary-emails/:emailId/emails/:id
 * @desc    Delete a received email
 * @access  Public
 */
router.delete('/:id', deleteReceivedEmail);

export default router;