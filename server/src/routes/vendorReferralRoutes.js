import express from 'express';
import { getMyReferralInfo, getMyAttributedCustomers } from '../controllers/vendorReferralController.js';
import { getVendorDashboard } from '../controllers/mlmReferralController.js';
import {
  getVendorReferralSummary,
  getVendorReferralTransactions,
} from '../controllers/vendorReferralCommissionController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('VENDOR', 'ADMIN', 'SUPER_ADMIN'));

router.get('/', getMyReferralInfo);
router.get('/customers', getMyAttributedCustomers);
router.get('/vendor-mlm', getVendorDashboard);
router.get('/commissions/summary', getVendorReferralSummary);
router.get('/commissions/transactions', getVendorReferralTransactions);

export default router;
