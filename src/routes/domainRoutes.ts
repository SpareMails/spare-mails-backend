import { Router } from 'express';
import {
  getDomains,
  createDomain,
  updateDomain,
  deleteDomain,
  getDomainStats,
} from '../controllers/domainController';
import { validateRequiredFields } from '../utils/responseHelpers';

const router = Router();

/**
 * @route   GET /api/domains
 * @desc    Get all available domains
 * @access  Public
 */
router.get('/', getDomains);

/**
 * @route   POST /api/domains
 * @desc    Create a new domain
 * @access  Admin (for now public, but should be protected in production)
 */
router.post('/', validateRequiredFields(['domain']), createDomain);

/**
 * @route   PUT /api/domains/:id
 * @desc    Update domain status
 * @access  Admin (for now public, but should be protected in production)
 */
router.put('/:id', validateRequiredFields(['isActive']), updateDomain);

/**
 * @route   DELETE /api/domains/:id
 * @desc    Delete a domain
 * @access  Admin (for now public, but should be protected in production)
 */
router.delete('/:id', deleteDomain);

/**
 * @route   GET /api/domains/:id/stats
 * @desc    Get domain statistics
 * @access  Public
 */
router.get('/:id/stats', getDomainStats);

export default router;