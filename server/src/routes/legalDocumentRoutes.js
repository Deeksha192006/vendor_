import express from 'express';
import {
  getPublicLegalDocument,
  getAllPublicLegalDocuments,
  recordUserConsent,
  checkUserConsent,
} from '../controllers/legalDocumentController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes for all visitors, customers, and vendors
router.get('/', getAllPublicLegalDocuments);
router.get('/:type', getPublicLegalDocument);

// Authenticated user consent verification & recording
router.post('/consent', authenticate, recordUserConsent);
router.get('/consent/:type', authenticate, checkUserConsent);

export default router;
