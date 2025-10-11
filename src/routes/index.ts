import { Router } from 'express';
import temporaryEmailRoutes from './temporaryEmailRoutes';
import emailRoutes from './emailRoutes';
import domainRoutes from './domainRoutes';
import webhookRoutes from './webhookRoutes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'SpareMails API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API routes
router.use('/temporary-emails', temporaryEmailRoutes);
router.use('/temporary-emails/:emailId/emails', emailRoutes);
router.use('/domains', domainRoutes);
router.use('/webhooks', webhookRoutes);

export default router;