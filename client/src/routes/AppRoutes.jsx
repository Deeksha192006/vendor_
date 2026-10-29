import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { MainLayout } from '../layouts/MainLayout';
import { CustomerLayout } from '../layouts/CustomerLayout';
import { VendorLayout } from '../layouts/VendorLayout';
import { SuperAdminLayout } from '../layouts/SuperAdminLayout';
import { AuthLayoutWrapper } from '../layouts/AuthLayoutWrapper';
import { NotFound } from '../pages/NotFound';

// Route Guards
import {
  CustomerRoute,
  VendorRoute,
  SuperAdminRoute,
  ProtectedRoute
} from './ProtectedRoute';

// Public & Shared Pages
import { Home } from '../pages/Home';
import { Products } from '../pages/Products';
import { ProductDetail } from '../pages/ProductDetail';
import { Cart } from '../pages/Cart';
import { Checkout } from '../pages/Checkout';
import { ShopQRJoin } from '../pages/ShopQRJoin';
import ScanProcessor from '../pages/ScanProcessor';

// Auth Pages
import { Login } from '../pages/Login';
import { PortalGateway } from '../pages/PortalGateway';
import { Register } from '../pages/Register';
import { CustomerLogin } from '../pages/auth/CustomerLogin';
import { VendorLogin } from '../pages/auth/VendorLogin';
import { SuperAdminLogin } from '../pages/auth/SuperAdminLogin';
import { Unauthorized } from '../pages/auth/Unauthorized';

// Customer Pages
import { CustomerDashboard } from '../pages/customer/CustomerDashboard';
import { Orders } from '../pages/Orders';
import { OrderDetail } from '../pages/OrderDetail';
import { CustomerShop } from '../pages/CustomerShop';
import CustomerAttributionView from '../pages/CustomerAttributionView';
import { Referrals } from '../pages/Referrals';
import { Wallet } from '../pages/Wallet';
import { SpinWheel } from '../pages/SpinWheel';
import { Profile } from '../pages/Profile';
import { Addresses } from '../pages/Addresses';
import { Notifications } from '../pages/Notifications';
import { Settings } from '../pages/Settings';
import { CustomerSubscription } from '../pages/CustomerSubscription';
import { OfflineBills } from '../pages/OfflineBills';
import { Wishlist } from '../pages/Wishlist';
import { Commissions } from '../pages/Commissions';
import CustomerHelp from '../pages/customer/CustomerHelp';
import { CustomerDailyPurchaseReport } from '../pages/customer/CustomerDailyPurchaseReport';

// Vendor Pages
import { VendorDashboard } from '../pages/VendorDashboard';
import { VendorOnboarding } from '../pages/VendorOnboarding';
import { VendorProfile } from '../pages/VendorProfile';
import { VendorSubscription } from '../pages/VendorSubscription';
import { VendorSubscriptionCheckout } from '../pages/VendorSubscriptionCheckout';
import { VendorSubscriptionHistory } from '../pages/VendorSubscriptionHistory';
import { VendorNetworkDashboard } from '../pages/VendorNetworkDashboard';
import VendorProducts from '../pages/VendorProducts';
import VendorProductForm from '../pages/VendorProductForm';
import VendorQRDashboard from '../pages/VendorQRDashboard';
import VendorCustomers from '../pages/VendorCustomers';
import VendorOrders from '../pages/VendorOrders';
import VendorOrderDetail from '../pages/VendorOrderDetail';
import VendorFinance from '../pages/VendorFinance';
import VendorEarnings from '../pages/VendorEarnings';
import { VendorDailySalesReport } from '../pages/VendorDailySalesReport';

// Consolidated Operations Pages (Super Admin Portal)
import { AdminFulfillmentDashboard } from '../pages/AdminFulfillmentDashboard';
import { SystemHealth } from '../pages/SystemHealth';
import { AdminEntityList } from '../components/AdminEntityList';
import { AdminVendorReview } from '../pages/AdminVendorReview';
import { AdminVendorList } from '../pages/AdminVendorList';
import { AdminSubscriptionPlans } from '../pages/AdminSubscriptionPlans';
import { AdminVendorSubscriptions } from '../pages/AdminVendorSubscriptions';
import { AdminNetworkViewer } from '../pages/AdminNetworkViewer';
import { AdminFranchiseGeography } from '../pages/AdminFranchiseGeography';
import { AdminNetworkSettings } from '../pages/AdminNetworkSettings';
import AdminProductReview from '../pages/AdminProductReview';
import { AdminShopAttributions } from '../pages/AdminShopAttributions';
import { AdminManagement } from '../pages/AdminManagement';

// Super Admin Pages
import { SuperAdminDashboard } from '../pages/super-admin/SuperAdminDashboard';
import { SuperAdminUsers } from '../pages/super-admin/SuperAdminUsers';
import { SuperAdminAdmins } from '../pages/super-admin/SuperAdminAdmins';
import { SuperAdminRoles } from '../pages/super-admin/SuperAdminRoles';
import { SuperAdminAnalytics } from '../pages/super-admin/SuperAdminAnalytics';
import { SuperAdminAuditLogs } from '../pages/super-admin/SuperAdminAuditLogs';
import { SuperAdminSettings } from '../pages/super-admin/SuperAdminSettings';
import { SuperAdminSalesReport } from '../pages/super-admin/SuperAdminSalesReport';
import { SuperAdminProfile } from '../pages/super-admin/SuperAdminProfile';
import { SuperAdminMLM } from '../pages/super-admin/SuperAdminMLM';
import { SuperAdminCommissions } from '../pages/super-admin/SuperAdminCommissions';
import { SuperAdminSubscriptions } from '../pages/super-admin/SuperAdminSubscriptions';
import { SuperAdminPayouts } from '../pages/super-admin/SuperAdminPayouts';
import { SuperAdminLedger } from '../pages/super-admin/SuperAdminLedger';
import { SuperAdminSpinWheel } from '../pages/super-admin/SuperAdminSpinWheel';
import SuperAdminProducts from '../pages/super-admin/SuperAdminProducts';
import SuperAdminProductForm from '../pages/super-admin/SuperAdminProductForm';
import SuperAdminCategories from '../pages/super-admin/SuperAdminCategories';
import SuperAdminInventory from '../pages/super-admin/SuperAdminInventory';
import SuperAdminOrders from '../pages/super-admin/SuperAdminOrders';
import { SuperAdminOfflineBills } from '../pages/super-admin/SuperAdminOfflineBills';

// Hub & Delivery Portals
import { HubDashboard } from '../pages/HubDashboard';
import { DeliveryDashboard } from '../pages/DeliveryDashboard';
import { FranchiseDashboard } from '../pages/FranchiseDashboard';
import { ShopkeeperDashboard } from '../pages/ShopkeeperDashboard';
import { ShopQRCodeManager } from '../pages/ShopQRCodeManager';

// Super Admin Appointed Franchise Vendor Management
import { SuperAdminFranchiseVendors } from '../pages/super-admin/SuperAdminFranchiseVendors';
import { SuperAdminFranchiseVendorDetail } from '../pages/super-admin/SuperAdminFranchiseVendorDetail';
import { SuperAdminFranchiseApplications } from '../pages/super-admin/SuperAdminFranchiseApplications';
import { SuperAdminFranchiseApplicationDetail } from '../pages/super-admin/SuperAdminFranchiseApplicationDetail';
import { VendorInvitationPage } from '../pages/VendorInvitationPage';

// Legal & Policy Pages
import { LegalDocumentView } from '../pages/legal/LegalDocumentView';
import { SuperAdminLegalDocuments } from '../pages/super-admin/SuperAdminLegalDocuments';
import { SuperAdminDataDeletions } from '../pages/super-admin/SuperAdminDataDeletions';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* ------------------------------------------------------------- */}
      {/* 1. PUBLIC PORTAL ENTRY POINTS & COMMON AUTH (AuthLayout)       */}
      {/* ------------------------------------------------------------- */}
      <Route path="/vendor-invitation/:token" element={<VendorInvitationPage />} />
      <Route element={<AuthLayoutWrapper />}>
        <Route path="/login" element={<CustomerLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/customer/login" element={<CustomerLogin />} />
        <Route path="/customer/register" element={<Register />} />
        <Route path="/vendor/login" element={<VendorLogin />} />
        <Route path="/vendor/register" element={<VendorOnboarding />} />
        <Route path="/vendor/apply" element={<VendorOnboarding />} />
        <Route path="/vendor/onboarding" element={<VendorOnboarding />} />
        <Route path="/admin/login" element={<Navigate to="/super-admin/login" replace />} />
        <Route path="/admin/super-admin/login" element={<SuperAdminLogin />} />
        <Route path="/super-admin/login" element={<SuperAdminLogin />} />
        <Route path="/portals" element={<PortalGateway />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
      </Route>

      {/* ------------------------------------------------------------- */}
      {/* 2. CUSTOMER PORTAL (Strictly Customer Protected)             */}
      {/* ------------------------------------------------------------- */}
      <Route
        path="/customer"
        element={
          <CustomerRoute>
            <CustomerLayout />
          </CustomerRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<CustomerDashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="wallet" element={<Wallet />} />
        <Route path="coins" element={<Wallet />} />
        <Route path="rewards" element={<SpinWheel />} />
        <Route path="spin" element={<SpinWheel />} />
        <Route path="bills" element={<OfflineBills />} />
        <Route path="offline-bills" element={<OfflineBills />} />
        <Route path="subscription" element={<CustomerSubscription />} />
        <Route path="referral" element={<Referrals />} />
        <Route path="referrals" element={<Referrals />} />
        <Route path="wishlist" element={<Wishlist />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
        <Route path="addresses" element={<Addresses />} />
        <Route path="settings" element={<Settings />} />
        <Route path="daily-purchases" element={<CustomerDailyPurchaseReport />} />
        <Route path="daily-sales" element={<CustomerDailyPurchaseReport />} />
        <Route path="help" element={<CustomerHelp />} />
        <Route path="support" element={<CustomerHelp />} />
        <Route path="terms" element={<LegalDocumentView initialType="CUSTOMER_TERMS" />} />
        <Route path="privacy" element={<LegalDocumentView initialType="PRIVACY_POLICY" />} />
        <Route path="cookies" element={<LegalDocumentView initialType="COOKIE_POLICY" />} />
      </Route>

      {/* ------------------------------------------------------------- */}
      {/* 3. VENDOR PORTAL (Strictly Vendor Protected & Status Gated)   */}
      {/* ------------------------------------------------------------- */}
      <Route
        path="/vendor"
        element={
          <VendorRoute>
            <VendorLayout />
          </VendorRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<VendorDashboard />} />
        <Route path="products" element={<VendorProducts />} />
        <Route path="products/new" element={<VendorProductForm />} />
        <Route path="products/add" element={<VendorProductForm />} />
        <Route path="products/:id/edit" element={<VendorProductForm />} />
        <Route path="orders" element={<VendorOrders />} />
        <Route path="orders/:id" element={<VendorOrderDetail />} />
        <Route path="customers" element={<VendorCustomers />} />
        <Route path="daily-sales" element={<VendorDailySalesReport />} />
        <Route path="sales" element={<VendorEarnings />} />
        <Route path="earnings" element={<VendorEarnings />} />
        <Route path="commissions" element={<VendorEarnings />} />
        <Route path="finance" element={<VendorFinance />} />
        <Route path="analytics" element={<VendorDashboard />} />
        <Route path="wallet" element={<VendorFinance />} />
        <Route path="payouts" element={<Navigate to="/vendor/finance" replace />} />
        <Route path="transactions" element={<VendorFinance />} />
        <Route path="qr" element={<VendorQRDashboard />} />
        <Route path="subscription" element={<VendorSubscription />} />
        <Route path="subscription/plans" element={<VendorSubscription />} />
        <Route path="subscription/checkout" element={<VendorSubscriptionCheckout />} />
        <Route path="subscription/checkout/:planId" element={<VendorSubscriptionCheckout />} />
        <Route path="subscription/history" element={<VendorSubscriptionHistory />} />
        <Route path="network" element={<VendorNetworkDashboard />} />
        <Route path="referrals" element={<VendorNetworkDashboard />} />
        <Route path="refer" element={<VendorNetworkDashboard />} />
        <Route path="profile" element={<VendorProfile />} />
        <Route path="terms" element={<LegalDocumentView initialType="VENDOR_TERMS" />} />
        <Route path="privacy" element={<LegalDocumentView initialType="PRIVACY_POLICY" />} />
        <Route path="cookies" element={<LegalDocumentView initialType="COOKIE_POLICY" />} />
      </Route>

      {/* ------------------------------------------------------------- */}
      {/* 4. ADMIN PORTAL (Redirected to Unified Super Admin Portal)    */}
      {/* ------------------------------------------------------------- */}
      <Route path="/admin/*" element={<Navigate to="/super-admin/dashboard" replace />} />

      {/* ------------------------------------------------------------- */}
      {/* 5. SUPER ADMIN PORTAL (Unified Control Center & Operations)    */}
      {/* ------------------------------------------------------------- */}
      <Route
        path="/super-admin"
        element={
          <SuperAdminRoute>
            <SuperAdminLayout />
          </SuperAdminRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<SuperAdminDashboard />} />
        <Route path="sales-report" element={<SuperAdminSalesReport />} />
        <Route path="daily-sales" element={<SuperAdminSalesReport />} />
        <Route path="users" element={<SuperAdminUsers />} />
        <Route path="customers" element={<SuperAdminUsers />} />
        <Route path="vendors" element={<AdminVendorList />} />
        <Route path="vendors/:id/review" element={<AdminVendorReview />} />
        <Route path="franchise-vendors" element={<SuperAdminFranchiseVendors />} />
        <Route path="franchise-vendors/:id" element={<SuperAdminFranchiseVendorDetail />} />
        <Route path="franchise-applications" element={<SuperAdminFranchiseApplications />} />
        <Route path="franchise-applications/:id" element={<SuperAdminFranchiseApplicationDetail />} />
        <Route path="admins" element={<Navigate to="/super-admin/dashboard" replace />} />
        <Route path="roles" element={<Navigate to="/super-admin/dashboard" replace />} />
        <Route path="mlm" element={<SuperAdminMLM />} />
        <Route path="network" element={<SuperAdminMLM />} />
        <Route path="referral-network" element={<SuperAdminMLM />} />
        <Route path="commissions" element={<SuperAdminCommissions />} />
        <Route path="subscriptions" element={<SuperAdminSubscriptions />} />
        <Route path="subscription-overview" element={<SuperAdminSubscriptions />} />
        <Route path="vendor-subscriptions" element={<AdminVendorSubscriptions />} />
        <Route path="subscription-plans" element={<AdminSubscriptionPlans />} />
        <Route path="payouts" element={<SuperAdminPayouts />} />
        <Route path="wallets" element={<SuperAdminLedger />} />
        <Route path="ledger" element={<SuperAdminLedger />} />
        <Route path="payments" element={<SuperAdminSalesReport />} />
        <Route path="settlements" element={<AdminEntityList />} />
        <Route path="orders" element={<AdminEntityList />} />
        <Route path="products" element={<SuperAdminProducts />} />
        <Route path="products/new" element={<SuperAdminProductForm />} />
        <Route path="products/:id/edit" element={<SuperAdminProductForm />} />
        <Route path="products/review" element={<AdminProductReview />} />
        <Route path="inventory" element={<SuperAdminInventory />} />
        <Route path="admin-orders" element={<SuperAdminOrders />} />
        <Route path="categories" element={<SuperAdminCategories />} />
        <Route path="fulfillment" element={<AdminFulfillmentDashboard />} />
        <Route path="franchises" element={<AdminManagement />} />
        <Route path="shopkeepers" element={<AdminManagement />} />
        <Route path="shops" element={<AdminManagement />} />
        <Route path="kyc" element={<AdminManagement />} />
        <Route path="shop-attributions" element={<AdminShopAttributions />} />
        <Route path="delivery" element={<AdminEntityList />} />
        <Route path="coupons" element={<AdminEntityList />} />
        <Route path="campaigns" element={<AdminEntityList />} />
        <Route path="network-viewer" element={<Navigate to="/super-admin/referral-network" replace />} />
        <Route path="network-settings" element={<Navigate to="/super-admin/referral-network" replace />} />
        <Route path="geography" element={<AdminFranchiseGeography />} />
        <Route path="system-health" element={<Navigate to="/super-admin/dashboard" replace />} />
        <Route path="analytics" element={<SuperAdminAnalytics />} />
        <Route path="reports" element={<SuperAdminAnalytics />} />
        <Route path="audit-logs" element={<Navigate to="/super-admin/dashboard" replace />} />
        <Route path="settings" element={<SuperAdminSettings />} />
        <Route path="spin-wheel" element={<SuperAdminSpinWheel />} />
        <Route path="offline-bills" element={<SuperAdminOfflineBills />} />
        <Route path="legal-documents" element={<SuperAdminLegalDocuments />} />
        <Route path="legal" element={<SuperAdminLegalDocuments />} />
        <Route path="data-deletions" element={<SuperAdminDataDeletions />} />
        <Route path="profile" element={<SuperAdminProfile />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      {/* ------------------------------------------------------------- */}
      {/* 6. PUBLIC STOREFRONT & SHARED ACCOUNT (MainLayout)           */}
      {/* ------------------------------------------------------------- */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="products" element={<Products />} />
        <Route path="products/:slug" element={<ProductDetail />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="join/shop/:publicToken" element={<ShopQRJoin />} />
        <Route path="v/:token" element={<ScanProcessor />} />

        {/* Legal & Compliance Routes */}
        <Route path="terms" element={<LegalDocumentView initialType="CUSTOMER_TERMS" />} />
        <Route path="terms/customer" element={<LegalDocumentView initialType="CUSTOMER_TERMS" />} />
        <Route path="terms/vendor" element={<LegalDocumentView initialType="VENDOR_TERMS" />} />
        <Route path="vendor/terms" element={<LegalDocumentView initialType="VENDOR_TERMS" />} />
        <Route path="privacy-policy" element={<LegalDocumentView initialType="PRIVACY_POLICY" />} />
        <Route path="privacy" element={<LegalDocumentView initialType="PRIVACY_POLICY" />} />
        <Route path="cookie-policy" element={<LegalDocumentView initialType="COOKIE_POLICY" />} />
        <Route path="cookies" element={<LegalDocumentView initialType="COOKIE_POLICY" />} />
        <Route path="refund-policy" element={<LegalDocumentView initialType="REFUND_POLICY" />} />
        <Route path="returns" element={<LegalDocumentView initialType="REFUND_POLICY" />} />
        <Route path="shipping-policy" element={<LegalDocumentView initialType="SHIPPING_POLICY" />} />
        <Route path="shipping" element={<LegalDocumentView initialType="SHIPPING_POLICY" />} />
        <Route path="grievance-policy" element={<LegalDocumentView initialType="GRIEVANCE_POLICY" />} />
        <Route path="contact" element={<LegalDocumentView initialType="GRIEVANCE_POLICY" />} />
        <Route path="grievance" element={<LegalDocumentView initialType="GRIEVANCE_POLICY" />} />

        {/* Legacy / Shared Account Shortcuts for smooth user experience */}
        <Route path="dashboard" element={<Navigate to="/customer/dashboard" replace />} />
        <Route path="account/dashboard" element={<Navigate to="/customer/dashboard" replace />} />
        <Route path="account/orders" element={<Navigate to="/customer/orders" replace />} />
        <Route path="account/orders/:id" element={<Navigate to="/customer/orders" replace />} />
        <Route path="account/shop" element={<Navigate to="/customer/dashboard" replace />} />
        <Route path="account/attribution" element={<Navigate to="/customer/dashboard" replace />} />
        <Route path="account/referrals" element={<Navigate to="/customer/referrals" replace />} />
        <Route path="account/wallet" element={<Navigate to="/customer/wallet" replace />} />
        <Route path="account/fair-coins" element={<Navigate to="/customer/wallet" replace />} />
        <Route path="account/spin" element={<Navigate to="/customer/rewards" replace />} />
        <Route path="account/profile" element={<Navigate to="/customer/profile" replace />} />
        <Route path="account/addresses" element={<Navigate to="/customer/addresses" replace />} />
        <Route path="account/notifications" element={<Navigate to="/customer/notifications" replace />} />
        <Route path="account/settings" element={<Navigate to="/customer/settings" replace />} />
        <Route path="account/subscription" element={<Navigate to="/customer/subscription" replace />} />
        <Route path="subscriptions" element={<CustomerSubscription />} />
        <Route path="subscription-plans" element={<CustomerSubscription />} />
        <Route path="account/offline-bills" element={<Navigate to="/customer/bills" replace />} />
        <Route path="account/wishlist" element={<Navigate to="/customer/wishlist" replace />} />
        <Route path="account/commissions" element={<Navigate to="/customer/wallet" replace />} />

        {/* Support Portals */}
        <Route path="delivery/dashboard" element={<ProtectedRoute allowedRoles={['DELIVERY_PARTNER', 'SUPER_ADMIN']}><DeliveryDashboard /></ProtectedRoute>} />
        <Route path="hub/dashboard" element={<ProtectedRoute allowedRoles={['HUB_STAFF', 'SUPER_ADMIN']}><HubDashboard /></ProtectedRoute>} />
        <Route path="franchise/dashboard" element={<ProtectedRoute allowedRoles={['STATE_FRANCHISE', 'DISTRICT_FRANCHISE', 'TALUK_FRANCHISE', 'SUPER_ADMIN']}><FranchiseDashboard /></ProtectedRoute>} />
        <Route path="shopkeeper/dashboard" element={<ProtectedRoute allowedRoles={['SHOPKEEPER', 'SUPER_ADMIN']}><ShopkeeperDashboard /></ProtectedRoute>} />
        <Route path="shopkeeper/qr" element={<ProtectedRoute allowedRoles={['SHOPKEEPER', 'SUPER_ADMIN']}><ShopQRCodeManager /></ProtectedRoute>} />
      </Route>

      {/* 7. Catch-all 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
