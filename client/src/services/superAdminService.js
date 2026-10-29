import api from './api';

export const superAdminService = {
  // Dashboard
  getDashboardStats: async () => {
    const res = await api.get('/super-admin/dashboard');
    return res.data?.data;
  },

  // Sales Reports & Analytics
  getSalesReport: async (params = {}) => {
    const res = await api.get('/admin/sales/overview', { params });
    return res.data?.data;
  },

  getSalesOverview: async (params = {}) => {
    const res = await api.get('/admin/sales/overview', { params });
    return res.data?.data;
  },

  getSalesOrders: async (params = {}) => {
    const res = await api.get('/admin/sales/orders', { params });
    return res.data?.data;
  },

  getSalesBySeller: async (params = {}) => {
    const res = await api.get('/admin/sales/by-seller', { params });
    return res.data?.data;
  },

  getSalesByProduct: async (params = {}) => {
    const res = await api.get('/admin/sales/by-product', { params });
    return res.data?.data;
  },

  getSalesTrends: async (params = {}) => {
    const res = await api.get('/admin/sales/trends', { params });
    return res.data?.data;
  },

  getSalesOrderDetails: async (orderId) => {
    const res = await api.get(`/admin/sales/orders/${orderId}`);
    return res.data?.data;
  },

  getCustomerPurchaseHistory: async (customerId) => {
    const res = await api.get(`/admin/sales/customers/${customerId}/history`);
    return res.data?.data;
  },

  exportSalesCsv: async (params = {}) => {
    const res = await api.get('/admin/sales/export', { params, responseType: 'blob' });
    return res.data;
  },

  // Product Management & Selling
  getProducts: async (params = {}) => {
    const res = await api.get('/super-admin/products', { params });
    return res.data?.data;
  },

  createProduct: async (data) => {
    const res = await api.post('/super-admin/products', data);
    return res.data?.data;
  },

  updateProduct: async (id, data) => {
    const res = await api.put(`/super-admin/products/${id}`, data);
    return res.data?.data;
  },

  deleteProduct: async (id) => {
    const res = await api.delete(`/super-admin/products/${id}`);
    return res.data?.data;
  },

  updateProductStock: async (id, data) => {
    const res = await api.post(`/super-admin/products/${id}/stock`, data);
    return res.data?.data;
  },

  getInventory: async () => {
    const res = await api.get('/super-admin/inventory');
    return res.data?.data;
  },

  getAdminOrders: async (params = {}) => {
    const res = await api.get('/super-admin/admin-orders', { params });
    return res.data?.data;
  },

  // Users
  getUsers: async (params = {}) => {
    const res = await api.get('/super-admin/users', { params });
    return res.data?.data;
  },

  getUserById: async (id) => {
    const res = await api.get(`/super-admin/users/${id}`);
    return res.data?.data;
  },

  createUser: async (data) => {
    const res = await api.post('/super-admin/users', data);
    return res.data?.data;
  },

  updateUser: async (id, data) => {
    const res = await api.put(`/super-admin/users/${id}`, data);
    return res.data?.data;
  },

  deleteUser: async (id) => {
    const res = await api.delete(`/super-admin/users/${id}`);
    return res.data?.data;
  },

  resetUserPassword: async (id, password) => {
    const res = await api.post(`/super-admin/users/${id}/reset-password`, { password });
    return res.data?.data;
  },

  // Admins
  getAdmins: async () => {
    const res = await api.get('/super-admin/admins');
    return res.data?.data?.admins || [];
  },

  createAdmin: async (data) => {
    const res = await api.post('/super-admin/admins', data);
    return res.data?.data;
  },

  updateAdmin: async (id, data) => {
    const res = await api.put(`/super-admin/admins/${id}`, data);
    return res.data?.data;
  },

  deleteAdmin: async (id) => {
    const res = await api.delete(`/super-admin/admins/${id}`);
    return res.data?.data;
  },

  resetAdminPassword: async (id, password) => {
    const res = await api.post(`/super-admin/admins/${id}/reset-password`, { password });
    return res.data?.data;
  },

  // Analytics
  getAnalytics: async () => {
    const res = await api.get('/super-admin/analytics');
    return res.data?.data;
  },

  // Audit Logs
  getAuditLogs: async (params = {}) => {
    const res = await api.get('/super-admin/audit-logs', { params });
    return res.data?.data;
  },

  // Settings & Maintenance
  getSettings: async () => {
    const res = await api.get('/super-admin/settings');
    return res.data?.data;
  },

  updateSettings: async (settings) => {
    const res = await api.put('/super-admin/settings', { settings });
    return res.data?.data;
  },

  toggleMaintenanceMode: async (enabled) => {
    const res = await api.post('/super-admin/settings/maintenance', { enabled });
    return res.data?.data;
  },

  // Dynamic Banner Management
  getBanners: async (params = {}) => {
    const res = await api.get('/banners', { params });
    return res.data?.data;
  },

  getActiveBanners: async () => {
    const res = await api.get('/banners/active');
    return res.data?.data;
  },

  createBanner: async (data) => {
    const res = await api.post('/banners', data);
    return res.data?.data;
  },

  updateBanner: async (id, data) => {
    const res = await api.put(`/banners/${id}`, data);
    return res.data?.data;
  },

  updateBannerStatus: async (id, isActive) => {
    const res = await api.patch(`/banners/${id}/status`, { isActive });
    return res.data?.data;
  },

  updateBannerDisplayOrder: async (id, displayOrder) => {
    const res = await api.patch(`/banners/${id}/display-order`, { displayOrder });
    return res.data?.data;
  },

  deleteBanner: async (id) => {
    const res = await api.delete(`/banners/${id}`);
    return res.data?.data;
  },

  uploadBannerImage: async (imageData, filename) => {
    const res = await api.post('/banners/upload', { imageData, filename });
    return res.data?.data;
  },

  // Roles Matrix
  getRolesMatrix: async () => {
    const res = await api.get('/super-admin/roles');
    return res.data?.data;
  },

  // One-to-Many MLM & Referral Management
  getMlmSummary: async () => {
    const res = await api.get('/super-admin/mlm-referrals/summary');
    return res.data?.data;
  },
  getVendorReferrals: async (params = {}) => {
    const res = await api.get('/super-admin/mlm-referrals/vendor-referrals', { params });
    return res.data?.data;
  },
  getCustomerReferrals: async (params = {}) => {
    const res = await api.get('/super-admin/mlm-referrals/customer-referrals', { params });
    return res.data?.data;
  },
  getOneToManyTree: async (params = {}) => {
    const res = await api.get('/super-admin/mlm-referrals/tree', { params });
    return res.data?.data;
  },

  // Legacy compatibility
  getMLMTree: async (params = {}) => {
    const res = await api.get('/super-admin/mlm/tree', { params });
    return res.data?.data;
  },
  getReferralTree: async (params = {}) => {
    const res = await api.get('/super-admin/mlm/tree', { params });
    return res.data?.data;
  },

  getReferralPairs: async (params = {}) => {
    const res = await api.get('/super-admin/mlm/referral-pairs', { params });
    return res.data?.data;
  },

  getMLMCommissions: async (params = {}) => {
    const res = await api.get('/super-admin/mlm/commissions', { params });
    return res.data?.data;
  },
  getReferralCommissions: async (params = {}) => {
    const res = await api.get('/super-admin/mlm/commissions', { params });
    return res.data?.data;
  },

  // Commission Rules
  getCommissionSettings: async () => {
    const res = await api.get('/super-admin/commissions/settings');
    return res.data?.data;
  },

  updateCommissionSettings: async (data) => {
    const res = await api.put('/super-admin/commissions/settings', data);
    return res.data?.data;
  },

  // Subscriptions
  getSubscriptionPlans: async () => {
    const res = await api.get('/super-admin/subscriptions/plans');
    return res.data?.data;
  },

  createSubscriptionPlan: async (data) => {
    const res = await api.post('/super-admin/subscriptions/plans', data);
    return res.data?.data;
  },

  updateSubscriptionPlan: async (id, data) => {
    const res = await api.put(`/super-admin/subscriptions/plans/${id}`, data);
    return res.data?.data;
  },

  deleteSubscriptionPlan: async (id, planType) => {
    const res = await api.delete(`/super-admin/subscriptions/plans/${id}`, { params: { planType } });
    return res.data?.data;
  },

  // Payouts / Settlements
  getPayoutRequests: async (params = {}) => {
    const res = await api.get('/super-admin/payouts', { params });
    return res.data?.data;
  },

  approvePayoutRequest: async (id, data = {}) => {
    const res = await api.post(`/super-admin/payouts/${id}/approve`, data);
    return res.data?.data;
  },

  rejectPayoutRequest: async (id, data = {}) => {
    const res = await api.post(`/super-admin/payouts/${id}/reject`, data);
    return res.data?.data;
  },

  // Financial Ledger
  getFinancialLedger: async (params = {}) => {
    const res = await api.get('/super-admin/ledger', { params });
    return res.data?.data;
  },

  // Platform Commission Management
  getCommissionOverview: async (params = {}) => {
    const res = await api.get('/admin/commissions/overview', { params });
    return res.data?.data;
  },

  getCommissionTransactions: async (params = {}) => {
    const res = await api.get('/admin/commissions', { params });
    return res.data?.data;
  },

  getVendorCommissions: async (params = {}) => {
    const res = await api.get('/admin/commissions/vendors', { params });
    return res.data?.data;
  },

  getPlatformSettlements: async (params = {}) => {
    const res = await api.get('/admin/platform-settlements', { params });
    return res.data?.data;
  },

  approvePlatformSettlement: async (id) => {
    const res = await api.post(`/admin/platform-settlements/${id}/approve`);
    return res.data?.data;
  },

  processPlatformSettlementPayout: async (id, data = {}) => {
    const res = await api.post(`/admin/platform-settlements/${id}/payout`, data);
    return res.data?.data;
  },

  // Centralized Category Management
  getCategories: async (params = {}) => {
    const res = await api.get('/super-admin/categories', { params });
    return res.data?.data;
  },

  createCategory: async (data) => {
    const res = await api.post('/super-admin/categories', data);
    return res.data?.data;
  },

  updateCategory: async (id, data) => {
    const res = await api.put(`/super-admin/categories/${id}`, data);
    return res.data?.data;
  },

  toggleCategoryStatus: async (id, status) => {
    const res = await api.patch(`/super-admin/categories/${id}/status`, { status });
    return res.data?.data;
  },

  deleteCategory: async (id) => {
    const res = await api.delete(`/super-admin/categories/${id}`);
    return res.data?.data;
  },
};


