import api from './api';

export const franchiseVendorService = {
  // Stats & Dashboard
  getDashboardStats: async () => {
    const res = await api.get('/super-admin/franchise-vendors/stats');
    return res.data?.data;
  },

  // List & Filters
  getFranchiseVendors: async (params = {}) => {
    const res = await api.get('/super-admin/franchise-vendors', { params });
    return res.data?.data;
  },

  // Single Vendor Details
  getFranchiseVendorById: async (id) => {
    const res = await api.get(`/super-admin/franchise-vendors/${id}`);
    return res.data?.data;
  },

  // Appoint New Vendor
  createFranchiseVendor: async (payload) => {
    const res = await api.post('/super-admin/franchise-vendors', payload);
    return res.data?.data;
  },

  // Update Vendor
  updateFranchiseVendor: async (id, payload) => {
    const res = await api.put(`/super-admin/franchise-vendors/${id}`, payload);
    return res.data?.data;
  },

  // Invitation Actions
  reissueInvitation: async (id) => {
    const res = await api.post(`/super-admin/franchise-vendors/${id}/invitation/reissue`);
    return res.data?.data;
  },

  revokeInvitation: async (id) => {
    const res = await api.post(`/super-admin/franchise-vendors/${id}/invitation/revoke`);
    return res.data?.data;
  },

  markInvitationSent: async (id) => {
    const res = await api.post(`/super-admin/franchise-vendors/${id}/invitation/mark-sent`);
    return res.data?.data;
  },

  recordWhatsAppOpened: async (id) => {
    const res = await api.post(`/super-admin/franchise-vendors/${id}/whatsapp-opened`);
    return res.data?.data;
  },

  // Suspend / Reactivate
  updateVendorStatus: async (id, status) => {
    const res = await api.patch(`/super-admin/franchise-vendors/${id}/status`, { status });
    return res.data?.data;
  },

  // Sub-resources
  getVendorProducts: async (id, params = {}) => {
    const res = await api.get(`/super-admin/franchise-vendors/${id}/products`, { params });
    return res.data?.data;
  },

  getVendorOrders: async (id, params = {}) => {
    const res = await api.get(`/super-admin/franchise-vendors/${id}/orders`, { params });
    return res.data?.data;
  },

  getVendorDailySales: async (id, params = {}) => {
    const res = await api.get(`/super-admin/franchise-vendors/${id}/daily-sales`, { params });
    return res.data?.data;
  },

  getVendorActivities: async (id, params = {}) => {
    const res = await api.get(`/super-admin/franchise-vendors/${id}/activities`, { params });
    return res.data?.data;
  },

  getAllVendorActivities: async (params = {}) => {
    const res = await api.get('/super-admin/franchise-vendors/activities/all', { params });
    return res.data?.data;
  },

  getFranchiseReports: async () => {
    const res = await api.get('/super-admin/franchise-vendors/reports');
    return res.data?.data;
  },

  exportCsv: async () => {
    const res = await api.get('/super-admin/franchise-vendors/export', { responseType: 'blob' });
    return res.data;
  },

  // Territories lookup
  getStates: async () => {
    const res = await api.get('/territories/states');
    return res.data?.data || [];
  },

  getDistricts: async (stateId) => {
    const res = await api.get(`/territories/states/${stateId}/districts`);
    return res.data?.data || [];
  },

  getTaluks: async (districtId) => {
    const res = await api.get(`/territories/districts/${districtId}/taluks`);
    return res.data?.data || [];
  },

  // Public Invitation endpoints
  validateInvitationToken: async (token) => {
    const res = await api.get(`/auth/vendor-invitation/invitation/${token}`);
    return res.data?.data;
  },

  activateFranchiseVendor: async (token, payload) => {
    const res = await api.post(`/auth/vendor-invitation/invitation/${token}/activate`, payload);
    return res.data?.data;
  },

  submitFranchiseApplication: async (token, payload) => {
    const res = await api.post(`/auth/vendor-invitation/invitation/${token}/submit-application`, payload);
    return res.data?.data;
  },

  // Super Admin: Franchise Vendor Applications & KYC Management
  getFranchiseApplicationsStats: async () => {
    const res = await api.get('/super-admin/franchise-vendors/applications/stats');
    return res.data?.data;
  },

  getFranchiseApplications: async (params = {}) => {
    const res = await api.get('/super-admin/franchise-vendors/applications', { params });
    return res.data?.data;
  },

  getFranchiseApplicationById: async (id) => {
    const res = await api.get(`/super-admin/franchise-vendors/applications/${id}`);
    return res.data?.data;
  },

  reviewFranchiseApplication: async (id, payload) => {
    const res = await api.patch(`/super-admin/franchise-vendors/applications/${id}/review`, payload);
    return res.data?.data;
  },
};

export default franchiseVendorService;
