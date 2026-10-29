import express from 'express';
import {
  getAdminMetrics,
  getSettings,
  updateSettings,
  getAuditLogs,
  getUsers,
  getUserById,
  updateUserStatus,
  getVendors,
  getVendorById,
  updateVendorStatus,
  updateVendorPaymentStatus,
  getVendorDashboardCounters,
  verifyVendorDocument,
  verifyVendorBank,
  getAdminNotes,
  createAdminNote,
  getShops,
  getShopById,
  updateShopStatus,
  getFranchises,
  getFranchiseById,
  updateFranchiseStatus,
  getAdminProducts,
  getProductById,
  approveProduct,
  rejectProduct,
  getOrders,
  getOrderById,
  getPayments,
  getPaymentById,
  getKycs,
  getKycById,
  updateKycStatus,
  getAdminSubscriptions,
  getAdminSubscriptionById,
  getExpiringSubscriptions,
  getCommissions,
  getCommissionById,
  getSettlements,
  getSettlementById,
  updateSettlementStatus,
  reverseSettlement,
  getCoupons,
  createCoupon,
  updateCoupon,
  updateCouponStatus,
  getCampaigns,
  createCampaign,
  updateCampaign,
  updateCampaignStatus,
  getFulfillments,
  getFulfillmentById,
  getDeliveries,
  getDeliveryById,
  getOperationalAlerts,
  exportOrdersCsv,
  exportPaymentsCsv,
  exportCommissionsCsv,
  exportSettlementsCsv,
  exportUsersCsv,
  getRevenueAnalytics,
  getOrderAnalytics,
  getCustomerAnalytics,
  getVendorAnalytics,
  getShopAnalytics,
  getFranchiseAnalytics,
  getKycAnalytics,
  getSubscriptionAnalytics,
  getCommissionAnalytics,
  getSettlementAnalytics,
  getFairCoinAnalytics,
  getProductAnalytics,
  getCouponAnalytics,
  getCampaignAnalytics,
  getFulfillmentAnalytics,
  getDeliveryAnalytics,
  getShopAttributions,
  getVendorArea,
  assignVendorArea
} from '../controllers/adminController.js';
import {
  createSubscriptionPlan,
  getSubscriptionPlans,
  updateSubscriptionPlan,
  togglePlanStatus,
  deleteSubscriptionPlan
} from '../controllers/subscriptionPlanController.js';
import {
  getAdminVendorSubscriptionPlans,
  createAdminVendorSubscriptionPlan,
  updateAdminVendorSubscriptionPlan,
  toggleAdminVendorSubscriptionPlanStatus,
  deleteAdminVendorSubscriptionPlan,
  getAdminVendorSubscriptionsLedger
} from '../controllers/vendorSubscriptionPlanController.js';
import {
  getSubscriptionOverview,
  getSubscriptions,
  getSubscriptionDetails,
  getSubscriptionAnalytics as getUnifiedSubscriptionAnalytics,
  getExpiringSubscriptionsMonitoring,
  exportSubscriptionsCsv,
  updateSubscriptionStatus as updateUnifiedSubscriptionStatus
} from '../controllers/subscriptionMonitoringController.js';
import {
  getPlans,
  createPlan,
  updatePlan,
  adjustSuperCoins
} from '../controllers/adminPremiumController.js';
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
import adminOfflineBillRoutes from './adminOfflineBillRoutes.js';
import adminAttributionRoutes from './adminAttributionRoutes.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import {
  userStatusSchema,
  vendorStatusSchema,
  productStatusSchema,
} from '../validators/adminValidator.js';

import { getVendorNetwork } from '../controllers/adminVendorNetworkController.js';
import { runPaymentReconciliation } from '../controllers/reconciliationController.js';
import { getRoles, createRole, updateRole, getAdmins, createAdmin, updateAdmin } from '../controllers/adminManagementController.js';
import { requirePermission } from '../middleware/permissionMiddleware.js';
import { mutationLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('SUPER_ADMIN'));

// Rate limit all mutative (non-GET) admin requests
router.use((req, res, next) => {
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    return mutationLimiter(req, res, next);
  }
  next();
});

// Admin & Role Management (Super Admin authorization strictly required for mutation)
router.get('/roles', getRoles);
router.post('/roles', authorize('SUPER_ADMIN'), createRole);
router.put('/roles/:id', authorize('SUPER_ADMIN'), updateRole);
router.get('/admins', getAdmins);
router.post('/admins', authorize('SUPER_ADMIN'), createAdmin);
router.put('/admins/:id', authorize('SUPER_ADMIN'), updateAdmin);

// Vendor Network
router.get('/vendors/:vendorId/network', requirePermission('vendor.view'), getVendorNetwork);

// Finance & Settlements
import { getFinanceDashboard, getPlatformRevenue, getExceptions, createAdjustment, processSettlements } from '../controllers/adminFinanceController.js';
router.get('/finance/dashboard', requirePermission('payment.view'), getFinanceDashboard);
router.get('/finance/revenue', requirePermission('payment.view'), getPlatformRevenue);
router.get('/finance/exceptions', requirePermission('payment.view'), getExceptions);
router.post('/finance/adjustments', requirePermission('settlement.process'), createAdjustment);
router.post('/finance/settlements/process-batch', requirePermission('settlement.process'), processSettlements);

// Payment Reconciliation
router.get('/finance/reconciliation', requirePermission('payment.view'), runPaymentReconciliation);

// Premium/Rewards Management
router.get('/customer-premium/plans', requirePermission('reward.view'), getPlans);
router.post('/customer-premium/plans', requirePermission('reward.manage'), createPlan);
router.put('/customer-premium/plans/:id', requirePermission('reward.manage'), updatePlan);
router.post('/customers/:id/super-coin-adjustment', requirePermission('reward.manage'), adjustSuperCoins);

// Offline Bills
router.use('/offline-bills', requirePermission('bill.view'), adminOfflineBillRoutes);

// Customer Attribution
router.use('/attributions', requirePermission('attribution.view'), adminAttributionRoutes);

// Base Admin Endpoints
router.get('/metrics', getAdminMetrics);
router.get('/settings', getSettings);
router.post('/settings', updateSettings);
router.put('/settings', updateSettings);
router.get('/audit-logs', requirePermission('audit.view'), getAuditLogs);
router.get('/alerts', getOperationalAlerts);

// User Management
router.get('/users', requirePermission('customer.view'), getUsers);
router.get('/users/:id', requirePermission('customer.view'), getUserById);
router.put('/users/:id/status', requirePermission('customer.suspend'), validateBody(userStatusSchema), updateUserStatus);

// Vendor Management
router.get('/vendors/dashboard-counters', getVendorDashboardCounters);
router.get('/vendors', getVendors);
router.get('/vendors/:id', getVendorById);
router.put('/vendors/:id/status', validateBody(vendorStatusSchema), updateVendorStatus);
router.put('/vendors/:id/payment-status', updateVendorPaymentStatus);
router.put('/vendors/:id/documents/:docType/verify', verifyVendorDocument);
router.put('/vendors/:id/bank/verify', verifyVendorBank);
router.get('/vendors/:id/internal-notes', getAdminNotes);
router.post('/vendors/:id/internal-notes', createAdminNote);
router.get('/vendors/:id/area', getVendorArea);
router.put('/vendors/:id/area', assignVendorArea);

// Shop Management
router.get('/shops', getShops);
router.get('/shops/:id', getShopById);
router.put('/shops/:id/status', updateShopStatus);

// Franchise Management
router.get('/franchises', getFranchises);
router.get('/franchises/:id', getFranchiseById);
router.put('/franchises/:id/status', updateFranchiseStatus);

// Product Approval Workflow
router.get('/products', getAdminProducts);
router.get('/products/:id', getProductById);
router.post('/products/:id/approve', approveProduct);
router.post('/products/:id/reject', rejectProduct);

// Order Management
router.get('/orders', getOrders);
router.get('/orders/:id', getOrderById);

// Payment Management
router.get('/payments', getPayments);
router.get('/payments/:id', getPaymentById);

// KYC Management
router.get('/kyc', getKycs);
router.get('/kyc/:id', getKycById);
router.put('/kyc/:id/status', updateKycStatus);

// Customer Subscription Management
router.get('/subscription-plans', getSubscriptionPlans);
router.post('/subscription-plans', createSubscriptionPlan);
router.put('/subscription-plans/:id', updateSubscriptionPlan);
router.patch('/subscription-plans/:id/status', togglePlanStatus);
router.put('/subscription-plans/:id/status', togglePlanStatus);
router.delete('/subscription-plans/:id', deleteSubscriptionPlan);

// Centralized Subscription Monitoring Dashboard
router.get('/subscriptions/overview', getSubscriptionOverview);
router.get('/subscriptions/analytics', getUnifiedSubscriptionAnalytics);
router.get('/subscriptions/expiring', getExpiringSubscriptionsMonitoring);
router.get('/subscriptions/export', exportSubscriptionsCsv);
router.get('/subscriptions/customers', (req, res, next) => {
  req.query.type = 'CUSTOMER';
  return getSubscriptions(req, res, next);
});
router.get('/subscriptions/vendors', (req, res, next) => {
  req.query.type = 'VENDOR';
  return getSubscriptions(req, res, next);
});
router.get('/subscriptions', getSubscriptions);
router.get('/subscriptions/:id', getSubscriptionDetails);
router.patch('/subscriptions/:id/status', updateUnifiedSubscriptionStatus);

// Sales Reports & Analytics Dashboard (Module: Complete Sales Analytics)
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

// Vendor Subscription Plan Management
router.get('/vendor-subscription-plans', getAdminVendorSubscriptionPlans);
router.post('/vendor-subscription-plans', createAdminVendorSubscriptionPlan);
router.put('/vendor-subscription-plans/:id', updateAdminVendorSubscriptionPlan);
router.patch('/vendor-subscription-plans/:id/status', toggleAdminVendorSubscriptionPlanStatus);
router.put('/vendor-subscription-plans/:id/status', toggleAdminVendorSubscriptionPlanStatus);
router.delete('/vendor-subscription-plans/:id', deleteAdminVendorSubscriptionPlan);

// Vendor Subscriptions Ledger
router.get('/vendor-subscriptions', getAdminVendorSubscriptionsLedger);

// Commission Management
router.get('/commissions', getCommissions);
router.get('/commissions/:id', getCommissionById);

// Settlement Management
router.get('/settlements', getSettlements);
router.get('/settlements/:id', getSettlementById);
router.put('/settlements/:id/status', updateSettlementStatus);
router.post('/settlements/:id/reverse', reverseSettlement); // Controlled reversal

// Coupons
router.get('/coupons', getCoupons);
router.post('/coupons', createCoupon);
router.put('/coupons/:id', updateCoupon);
router.put('/coupons/:id/status', updateCouponStatus);

// Campaigns
router.get('/campaigns', getCampaigns);
router.post('/campaigns', createCampaign);
router.put('/campaigns/:id', updateCampaign);
router.put('/campaigns/:id/status', updateCampaignStatus);

// Fulfillment
router.get('/fulfillments', getFulfillments);
router.get('/fulfillments/:id', getFulfillmentById);

// Delivery
router.get('/deliveries', getDeliveries);
router.get('/deliveries/:id', getDeliveryById);

// CSV Export Routes
router.get('/exports/orders', exportOrdersCsv);
router.get('/exports/payments', exportPaymentsCsv);
router.get('/exports/commissions', exportCommissionsCsv);
router.get('/exports/settlements', exportSettlementsCsv);
router.get('/exports/users', exportUsersCsv);

// Analytics
router.get('/analytics/revenue', getRevenueAnalytics);
router.get('/analytics/orders', getOrderAnalytics);
router.get('/analytics/customers', getCustomerAnalytics);
router.get('/analytics/vendors', getVendorAnalytics);
router.get('/analytics/shops', getShopAnalytics);
router.get('/analytics/franchises', getFranchiseAnalytics);
router.get('/analytics/kyc', getKycAnalytics);
router.get('/analytics/subscriptions', getSubscriptionAnalytics);
router.get('/analytics/commissions', getCommissionAnalytics);
router.get('/analytics/settlements', getSettlementAnalytics);
router.get('/analytics/fair-coins', getFairCoinAnalytics);
router.get('/analytics/products', getProductAnalytics);
router.get('/analytics/coupons', getCouponAnalytics);
router.get('/analytics/campaigns', getCampaignAnalytics);
router.get('/analytics/fulfillments', getFulfillmentAnalytics);
router.get('/analytics/deliveries', getDeliveryAnalytics);

// Shop Attributions Logs
router.get('/shop-attributions', getShopAttributions);

// =========================================================================
// Fixed 5% Platform Commission & Vendor Settlements
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
router.post('/platform-settlements/:id/payout', processAdminSettlementPayout);
router.post('/settlements/:id/payout', processAdminSettlementPayout);

// Additional 3% Direct Vendor Referral Commission Management
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

// Category Management
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

// Daily Sales Report
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
router.get('/payments/daily-sales', getAdminDailySales);

export default router;
