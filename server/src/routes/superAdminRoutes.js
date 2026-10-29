import express from 'express';
import {
  getDashboardStats,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getAnalytics,
  getAuditLogs,
  getSettings,
  updateSettings,
  toggleMaintenanceMode,
  getRolesMatrix,
  getMLMTree,
  getReferralPairs,
  getMLMCommissions,
  getCommissionSettings,
  updateCommissionSettings,
  getSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  getPayoutRequests,
  approvePayoutRequest,
  rejectPayoutRequest,
  getFinancialLedger,
  getOrderFinancialLineage,
  getSalesReport,
  getSuperAdminProducts,
  createSuperAdminProduct,
  updateSuperAdminProduct,
  deleteSuperAdminProduct,
  updateSuperAdminProductStock,
  getSuperAdminInventory,
  getSuperAdminOrders,
} from '../controllers/superAdminController.js';
import { getSuperAdminSpinWheel, updateSuperAdminSpinWheel } from '../controllers/spinController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireSuperAdmin } from '../middleware/superAdminMiddleware.js';

import {
  getSalesOverview,
  getSalesOrders,
  getSalesBySeller,
  getSalesByProduct,
  getSalesTrends,
  getSalesOrderDetails,
  getCustomerPurchaseHistory,
  exportSalesCsv,
} from '../controllers/salesAnalyticsController.js';
import {
  getMlmSummary,
  getVendorReferrals,
  getCustomerReferrals,
  getReferralTree as getOneToManyTree,
} from '../controllers/mlmReferralController.js';

const router = express.Router();

// Strict Backend Security:
// Every route under /api/super-admin is protected by both JWT authentication AND the SUPER_ADMIN role check.
router.use(authenticate);
router.use(requireSuperAdmin);

// 1. Dashboard
router.get('/dashboard', getDashboardStats);

// Sales Report & Analytics
router.get('/sales-report', getSalesOverview);
router.get('/sales/overview', getSalesOverview);
router.get('/sales/orders', getSalesOrders);
router.get('/sales/vendor', (req, res, next) => {
  req.query.channel = 'VENDOR';
  return getSalesOrders(req, res, next);
});
router.get('/sales/admin-store', (req, res, next) => {
  req.query.channel = 'ADMIN';
  return getSalesOrders(req, res, next);
});
router.get('/sales/by-seller', getSalesBySeller);
router.get('/sales/by-product', getSalesByProduct);
router.get('/sales/trends', getSalesTrends);
router.get('/sales/orders/:orderId', getSalesOrderDetails);
router.get('/sales/customers/:customerId/history', getCustomerPurchaseHistory);
router.get('/sales/export', exportSalesCsv);

// Super Admin Product Management & Selling
router.get('/products', getSuperAdminProducts);
router.post('/products', createSuperAdminProduct);
router.put('/products/:id', updateSuperAdminProduct);
router.delete('/products/:id', deleteSuperAdminProduct);
router.post('/products/:id/stock', updateSuperAdminProductStock);
router.get('/inventory', getSuperAdminInventory);
router.get('/admin-orders', getSuperAdminOrders);

// 2. User Management
router.get('/users', getUsers);
router.post('/users', createUser);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.post('/users/:id/reset-password', resetUserPassword);

// 3. Admin & Super Admin Management
router.get('/admins', getAdmins);
router.post('/admins', createAdmin);
router.put('/admins/:id', updateAdmin);
router.delete('/admins/:id', deleteAdmin);
router.post('/admins/:id/reset-password', resetUserPassword);

// 4. Analytics
router.get('/analytics', getAnalytics);

// 5. Audit Logs
router.get('/audit-logs', getAuditLogs);

// 6. Settings & Maintenance Mode
router.get('/settings', getSettings);
router.put('/settings', updateSettings);
router.post('/settings/maintenance', toggleMaintenanceMode);

// 7. Roles & Permissions
router.get('/roles', getRolesMatrix);

// 8. One-to-Many Referral Network & Commissions
router.get('/mlm/tree', getMLMTree);
router.get('/mlm/referral-pairs', getReferralPairs);
router.get('/mlm/commissions', getMLMCommissions);
router.get('/referrals/tree', getMLMTree);
router.get('/referrals/pairs', getReferralPairs);
router.get('/referrals/commissions', getMLMCommissions);

// MLM & Referral Management (One-to-Many System)
router.get('/mlm-referrals/summary', getMlmSummary);
router.get('/mlm-referrals/vendor-referrals', getVendorReferrals);
router.get('/mlm-referrals/customer-referrals', getCustomerReferrals);
router.get('/mlm-referrals/tree', getOneToManyTree);

// 9. Commission Rules & Percentage Settings
router.get('/commissions/settings', getCommissionSettings);
router.put('/commissions/settings', updateCommissionSettings);

// 10. Subscription Plans (Vendor & Customer)
router.get('/subscriptions/plans', getSubscriptionPlans);
router.post('/subscriptions/plans', createSubscriptionPlan);
router.put('/subscriptions/plans/:id', updateSubscriptionPlan);
router.delete('/subscriptions/plans/:id', deleteSubscriptionPlan);

// 11. Vendor Payouts / Withdrawals
router.get('/payouts', getPayoutRequests);
router.post('/payouts/:id/approve', approvePayoutRequest);
router.post('/payouts/:id/reject', rejectPayoutRequest);

// 12. Double-Entry Financial Ledger
router.get('/ledger', getFinancialLedger);

// 13. Financial Transaction Explorer (Full 360-degree Lineage)
router.get('/finance/trace/:orderId', getOrderFinancialLineage);

// 14. Spin & Win Wheel Manager (5-Segment Control)
router.get('/spin-wheel', getSuperAdminSpinWheel);
router.put('/spin-wheel', updateSuperAdminSpinWheel);

// =========================================================================
// 15. Fixed 5% Platform Commission & Vendor Settlement Management
// =========================================================================
import {
  getAdminCommissionOverview,
  getAdminCommissionTransactions,
  getAdminVendorCommissionsSummary,
  getAdminProductCommissionsSummary,
  getAdminSettlements,
  approveAdminSettlement,
  processAdminSettlementPayout,
  exportAdminCommissionsCsv,
} from '../controllers/platformCommissionController.js';

router.get('/commissions/overview', getAdminCommissionOverview);
router.get('/commissions/vendors', getAdminVendorCommissionsSummary);
router.get('/commissions/products', getAdminProductCommissionsSummary);
router.get('/commissions/export', exportAdminCommissionsCsv);
router.get('/commissions', getAdminCommissionTransactions);
router.get('/platform-settlements', getAdminSettlements);
router.post('/platform-settlements/:id/approve', approveAdminSettlement);
router.get('/settlements', getAdminSettlements);
router.post('/settlements/:id/approve', approveAdminSettlement);
router.post('/settlements/:id/payout', processAdminSettlementPayout);

// =========================================================================
// 15B. Additional 3% Direct Vendor Referral Commission Management
// =========================================================================
import {
  getAdminReferralOverview,
  getAdminReferralTransactions,
  payoutAdminReferralCommission,
  exportAdminReferralCommissionsCsv,
} from '../controllers/vendorReferralCommissionController.js';

router.get('/referral-commissions/overview', getAdminReferralOverview);
router.get('/referral-commissions/transactions', getAdminReferralTransactions);
router.post('/referral-commissions/:id/payout', payoutAdminReferralCommission);
router.get('/referral-commissions/export', exportAdminReferralCommissionsCsv);

// =========================================================================
// 16. Shared Dynamic Product Category Management
// =========================================================================
import {
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  toggleCategoryStatus,
  deleteCategory,
} from '../controllers/categoryController.js';

router.get('/categories', getAdminCategories);
router.post('/categories', createAdminCategory);
router.put('/categories/:id', updateAdminCategory);
router.patch('/categories/:id/status', toggleCategoryStatus);
router.delete('/categories/:id', deleteCategory);

// =========================================================================
// 17. Daily Sales Report (Renamed from Payments)
// =========================================================================
import {
  getAdminDailySales,
  getAdminDailySalesVendor,
  getAdminDailySalesAdminStore,
  exportDailySalesCsv,
} from '../controllers/dailySalesReportController.js';

router.get('/daily-sales', getAdminDailySales);
router.get('/daily-sales/vendor', getAdminDailySalesVendor);
router.get('/daily-sales/admin-store', getAdminDailySalesAdminStore);
router.get('/daily-sales/export', exportDailySalesCsv);
router.get('/payments', getAdminDailySales);
router.get('/payments/daily-sales', getAdminDailySales);

// =========================================================================
// 18. Legal Documents & Policy Management (Super Admin Exclusive)
// =========================================================================
import {
  getAdminLegalDocuments,
  updateLegalDocument,
  getLegalDocumentHistory,
} from '../controllers/legalDocumentController.js';

router.get('/legal-documents', getAdminLegalDocuments);
router.put('/legal-documents/:type', updateLegalDocument);
router.get('/legal-documents/:type/history', getLegalDocumentHistory);

// =========================================================================
// 19. Data Deletion Requests Management (Super Admin Exclusive)
// =========================================================================
import { dataDeletionController } from '../controllers/dataDeletionController.js';

router.get('/data-deletion-requests', dataDeletionController.getAdminRequests);
router.post('/data-deletion-requests/:requestId/process', dataDeletionController.processAdminRequest);

export default router;


