import { Router } from 'express';
import {
  createTemporaryEmail,
  getTemporaryEmails,
  getTemporaryEmailById,
  deleteTemporaryEmail,
  extendTemporaryEmail,
  cleanupExpiredEmails,
} from '../controllers/temporaryEmailController';
import { validateRequiredFields, validatePagination } from '../utils/responseHelpers';

const router = Router();

/**
 * @route   POST /api/temporary-emails
 * @desc    Create a new temporary email address
 * @access  Public
 */
router.post('/', createTemporaryEmail);

/**
 * @route   GET /api/temporary-emails
 * @desc    Get all temporary emails with pagination
 * @access  Public
 */
router.get('/', validatePagination, getTemporaryEmails);

/**
 * @route   GET /api/temporary-emails/:id
 * @desc    Get temporary email by ID
 * @access  Public
 */
router.get('/:id', getTemporaryEmailById);

/**
 * @route   DELETE /api/temporary-emails/:id
 * @desc    Delete/deactivate temporary email
 * @access  Public
 */
router.delete('/:id', deleteTemporaryEmail);

/**
 * @route   PUT /api/temporary-emails/:id/extend
 * @desc    Extend temporary email expiry
 * @access  Public
 */
router.put('/:id/extend', validateRequiredFields(['minutes']), extendTemporaryEmail);

/**
 * @route   POST /api/temporary-emails/cleanup
 * @desc    Clean up expired temporary emails
 * @access  Public
 */
router.post('/cleanup', cleanupExpiredEmails);

export default router;