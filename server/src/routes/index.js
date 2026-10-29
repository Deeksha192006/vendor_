import express from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import productRoutes from './productRoutes.js';
import cartRoutes from './cartRoutes.js';
import orderRoutes from './orderRoutes.js';
import fairCoinRoutes from './fairCoinRoutes.js';
import referralRoutes from './referralRoutes.js';
import spinRoutes from './spinRoutes.js';
import vendorRoutes from './vendorRoutes.js';
import adminRoutes from './adminRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import financeRoutes from './financeRoutes.js';
import franchiseRoutes from './franchiseRoutes.js';
import shopkeeperRoutes from './shopkeeperRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import fulfillmentRoutes from './fulfillmentRoutes.js';
import hubRoutes from './hubRoutes.js';
import deliveryRoutes from './deliveryRoutes.js';
import returnRoutes from './returnRoutes.js';
import userRoutes from './userRoutes.js';
import wishlistRoutes from './wishlistRoutes.js';
import brandRoutes from './brandRoutes.js';
import reviewRoutes from './reviewRoutes.js';
import couponRoutes from './couponRoutes.js';
import campaignRoutes from './campaignRoutes.js';
import vendorOnboardingRoutes from './vendorOnboardingRoutes.js';
import territoryRoutes from './territoryRoutes.js';
import vendorSubscriptionRoutes from './vendorSubscriptionRoutes.js';
import { getActiveVendorPlans } from '../controllers/vendorSubscriptionPlanController.js';
import qrRoutes from './qrRoutes.js';

import shippingRoutes from './shippingRoutes.js';
import customerPremiumRoutes from './customerPremiumRoutes.js';
import customerSubscriptionRoutes from './customerSubscriptionRoutes.js';
import superCoinRoutes from './superCoinRoutes.js';
import offlineBillRoutes from './offlineBillRoutes.js';
import vendorReferralRoutes from './vendorReferralRoutes.js';
import customerAttributionRoutes from './customerAttributionRoutes.js';
import publicReferralRoutes from './publicReferralRoutes.js';
import superAdminRoutes from './superAdminRoutes.js';
import franchiseVendorRoutes from './franchiseVendorRoutes.js';
import mfaRoutes from './mfaRoutes.js';
import bannerRoutes from './bannerRoutes.js';
import legalDocumentRoutes from './legalDocumentRoutes.js';

const router = express.Router();

router.use('/legal-documents', legalDocumentRoutes);
router.use('/banners', bannerRoutes);
router.use('/super-admin/banners', bannerRoutes);
router.use('/super-admin/franchise-vendors', franchiseVendorRoutes);
router.use('/auth/vendor-invitation', franchiseVendorRoutes);
router.use('/vendor-invitation', franchiseVendorRoutes);
router.use('/super-admin', superAdminRoutes);

router.use('/health', healthRoutes);
router.use('/territories', territoryRoutes);
router.use('/auth/mfa', mfaRoutes);
router.use('/auth/vendor-onboarding', vendorOnboardingRoutes);
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/fair-coins', fairCoinRoutes);
router.use('/super-coins', superCoinRoutes); // ADDED FOR MODULE 10
router.use('/customer/premium', customerPremiumRoutes); // ADDED FOR MODULE 10
router.use('/customer/subscription', customerSubscriptionRoutes);

// Customer Daily Purchases Report
import { authenticate } from '../middleware/authMiddleware.js';
import {
  getCustomerDailyPurchases,
  exportDailySalesCsv,
} from '../controllers/dailySalesReportController.js';
router.get('/customer/daily-purchases', authenticate, getCustomerDailyPurchases);
router.get('/customer/daily-purchases/export', authenticate, (req, res, next) => {
  req.query.type = 'customer';
  return exportDailySalesCsv(req, res, next);
});
router.use('/subscription-plans', customerSubscriptionRoutes);
router.use('/customer/offline-bills', offlineBillRoutes); // ADDED FOR MODULE 11
router.use('/customer/attribution', customerAttributionRoutes); // ADDED FOR MODULE 12
router.use('/vendor/referral', vendorReferralRoutes); // ADDED FOR MODULE 12
router.use('/r', publicReferralRoutes); // ADDED FOR MODULE 12
router.use('/referrals', referralRoutes);
router.use('/spin', spinRoutes);
router.get('/vendor/subscription-plans', getActiveVendorPlans);
router.use('/vendor/subscription', vendorSubscriptionRoutes);
router.use('/vendors', vendorRoutes);
router.use('/vendor', vendorRoutes);
router.use('/vendor-subscriptions', vendorSubscriptionRoutes);
router.use('/admin', adminRoutes);
router.use('/payments', paymentRoutes);
router.use('/finance', financeRoutes); // ADDED FOR MODULE 8
router.use('/shipping', shippingRoutes); // ADDED FOR MODULE 9
router.use('/franchises', franchiseRoutes);
router.use('/notifications', notificationRoutes);
router.use('/fulfillments', fulfillmentRoutes);
router.use('/hubs', hubRoutes);
router.use('/deliveries', deliveryRoutes);
router.use('/returns', returnRoutes);
router.use('/users', userRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/brands', brandRoutes);
router.use('/reviews', reviewRoutes);
router.use('/coupons', couponRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/qr', qrRoutes);
router.use('/', shopkeeperRoutes);

export default router;
