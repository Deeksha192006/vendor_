import express from 'express';
import {
  getFranchiseDashboardStats,
  createFranchiseVendor,
  getFranchiseVendors,
  getFranchiseVendorById,
  updateFranchiseVendor,
  reissueInvitation,
  revokeInvitation,
  markInvitationSent,
  recordWhatsAppOpened,
  updateVendorStatus,
  getFranchiseVendorActivities,
  getAllVendorActivities,
  getFranchiseVendorProducts,
  getFranchiseVendorOrders,
  getFranchiseVendorDailySales,
  getFranchiseReports,
  exportFranchiseVendorsCsv,
  validateInvitationToken,
  activateFranchiseVendor,
  submitFranchiseApplication,
  getFranchiseApplicationsStats,
  getFranchiseApplications,
  getFranchiseApplicationById,
  reviewFranchiseApplication,
} from '../controllers/franchiseVendorController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireSuperAdmin } from '../middleware/superAdminMiddleware.js';

const router = express.Router();

// ==========================================
// 1. PUBLIC INVITATION & ACTIVATION ENDPOINTS
// ==========================================
router.get('/invitation/:token', validateInvitationToken);
router.post('/invitation/:token/activate', activateFranchiseVendor);
router.post('/invitation/:token/submit-application', submitFranchiseApplication);

// ==========================================
// 2. SUPER ADMIN PRIVILEGED MANAGEMENT ENDPOINTS
// ==========================================
router.use(authenticate);
router.use(requireSuperAdmin);

// Franchise Applications & KYC Management
router.get('/applications/stats', getFranchiseApplicationsStats);
router.get('/applications', getFranchiseApplications);
router.get('/applications/:id', getFranchiseApplicationById);
router.patch('/applications/:id/review', reviewFranchiseApplication);

// Dashboard stats & Reports
router.get('/stats', getFranchiseDashboardStats);
router.get('/reports', getFranchiseReports);
router.get('/export', exportFranchiseVendorsCsv);
router.get('/activities/all', getAllVendorActivities);

// Core CRUD
router.post('/', createFranchiseVendor);
router.get('/', getFranchiseVendors);
router.get('/:id', getFranchiseVendorById);
router.put('/:id', updateFranchiseVendor);
router.patch('/:id/status', updateVendorStatus);

// Invitation Actions
router.post('/:id/invitation/reissue', reissueInvitation);
router.post('/:id/invitation/revoke', revokeInvitation);
router.post('/:id/invitation/mark-sent', markInvitationSent);
router.post('/:id/whatsapp-opened', recordWhatsAppOpened);

// Vendor sub-resources
router.get('/:id/activities', getFranchiseVendorActivities);
router.get('/:id/products', getFranchiseVendorProducts);
router.get('/:id/orders', getFranchiseVendorOrders);
router.get('/:id/daily-sales', getFranchiseVendorDailySales);

export default router;
