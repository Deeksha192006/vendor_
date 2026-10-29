import { franchiseVendorService } from '../services/franchiseVendorService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';

export const getFranchiseDashboardStats = asyncWrapper(async (req, res) => {
  const stats = await franchiseVendorService.getFranchiseDashboardStats();
  return res.status(200).json(new ApiResponse(200, stats, 'Franchise dashboard stats retrieved'));
});

export const createFranchiseVendor = asyncWrapper(async (req, res) => {
  const result = await franchiseVendorService.createFranchiseVendor(req.user, req.body, req.ip);
  return res.status(201).json(new ApiResponse(201, result, 'Franchise vendor appointed successfully'));
});

export const getFranchiseVendors = asyncWrapper(async (req, res) => {
  const result = await franchiseVendorService.getFranchiseVendors(req.query);
  return res.status(200).json(new ApiResponse(200, result, 'Franchise vendors list retrieved'));
});

export const getFranchiseVendorById = asyncWrapper(async (req, res) => {
  const result = await franchiseVendorService.getFranchiseVendorById(req.params.id);
  return res.status(200).json(new ApiResponse(200, result, 'Franchise vendor details retrieved'));
});

export const updateFranchiseVendor = asyncWrapper(async (req, res) => {
  const vendor = await franchiseVendorService.updateFranchiseVendor(req.params.id, req.body, req.user, req.ip);
  return res.status(200).json(new ApiResponse(200, vendor, 'Franchise vendor updated successfully'));
});

export const reissueInvitation = asyncWrapper(async (req, res) => {
  const result = await franchiseVendorService.reissueInvitation(req.params.id, req.user, req.ip);
  return res.status(200).json(new ApiResponse(200, result, 'Invitation reissued successfully'));
});

export const revokeInvitation = asyncWrapper(async (req, res) => {
  const vendor = await franchiseVendorService.revokeInvitation(req.params.id, req.user, req.ip);
  return res.status(200).json(new ApiResponse(200, vendor, 'Invitation revoked successfully'));
});

export const markInvitationSent = asyncWrapper(async (req, res) => {
  const vendor = await franchiseVendorService.markInvitationSent(req.params.id, req.user, req.ip);
  return res.status(200).json(new ApiResponse(200, vendor, 'Invitation marked as sent'));
});

export const recordWhatsAppOpened = asyncWrapper(async (req, res) => {
  const result = await franchiseVendorService.recordWhatsAppOpened(req.params.id, req.user, req.ip);
  return res.status(200).json(new ApiResponse(200, result, 'WhatsApp opening logged'));
});

export const updateVendorStatus = asyncWrapper(async (req, res) => {
  const vendor = await franchiseVendorService.updateVendorStatus(req.params.id, req.body, req.user, req.ip);
  return res.status(200).json(new ApiResponse(200, vendor, 'Vendor status updated successfully'));
});

export const getFranchiseVendorActivities = asyncWrapper(async (req, res) => {
  const result = await franchiseVendorService.getFranchiseVendorActivities(req.params.id, req.query);
  return res.status(200).json(new ApiResponse(200, result, 'Vendor activities retrieved'));
});

export const getAllVendorActivities = asyncWrapper(async (req, res) => {
  const result = await franchiseVendorService.getAllVendorActivities(req.query);
  return res.status(200).json(new ApiResponse(200, result, 'All vendor activities retrieved'));
});

export const getFranchiseVendorProducts = asyncWrapper(async (req, res) => {
  const result = await franchiseVendorService.getFranchiseVendorProducts(req.params.id, req.query);
  return res.status(200).json(new ApiResponse(200, result, 'Franchise vendor products retrieved'));
});

export const getFranchiseVendorOrders = asyncWrapper(async (req, res) => {
  const result = await franchiseVendorService.getFranchiseVendorOrders(req.params.id, req.query);
  return res.status(200).json(new ApiResponse(200, result, 'Franchise vendor orders retrieved'));
});

export const getFranchiseVendorDailySales = asyncWrapper(async (req, res) => {
  const result = await franchiseVendorService.getFranchiseVendorDailySales(req.params.id, req.query);
  return res.status(200).json(new ApiResponse(200, result, 'Franchise vendor daily sales retrieved'));
});

export const getFranchiseReports = asyncWrapper(async (req, res) => {
  const reports = await franchiseVendorService.getFranchiseReports();
  return res.status(200).json(new ApiResponse(200, reports, 'Franchise reports retrieved'));
});

export const exportFranchiseVendorsCsv = asyncWrapper(async (req, res) => {
  const result = await franchiseVendorService.getFranchiseVendors({ ...req.query, limit: 1000 });
  const headers = [
    'Store Name',
    'Username',
    'Franchise Code',
    'Phone',
    'WhatsApp',
    'State',
    'District',
    'Taluk',
    'Account Status',
    'Invitation Status',
    'Products Count',
    'Orders Count',
    'Paid Sales (INR)',
    'Appointed Date',
  ];

  const rows = result.vendors.map((v) => [
    `"${(v.storeName || '').replace(/"/g, '""')}"`,
    `"${v.username || ''}"`,
    `"${v.franchiseCode || ''}"`,
    `"${v.phone || ''}"`,
    `"${v.whatsappNumber || ''}"`,
    `"${v.territory?.state || ''}"`,
    `"${v.territory?.district || ''}"`,
    `"${v.territory?.taluk || ''}"`,
    `"${v.activationStatus || v.status}"`,
    `"${v.invitationStatus || ''}"`,
    v.productsCount || 0,
    v.ordersCount || 0,
    v.paidSales || 0,
    `"${v.appointedAt ? new Date(v.appointedAt).toISOString().split('T')[0] : ''}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="franchise_vendors.csv"');
  return res.status(200).send(csvContent);
});

// PUBLIC ENDPOINTS
export const validateInvitationToken = asyncWrapper(async (req, res) => {
  const result = await franchiseVendorService.validateInvitationToken(req.params.token);
  return res.status(200).json(new ApiResponse(200, result, 'Invitation token validated'));
});

export const activateFranchiseVendor = asyncWrapper(async (req, res) => {
  const result = await franchiseVendorService.activateFranchiseVendor(req.params.token, req.body, req.ip);

  // Set refresh token cookie if available
  if (result.tokens?.refreshToken) {
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  return res.status(200).json(new ApiResponse(200, result, 'Vendor account activated successfully!'));
});

export const submitFranchiseApplication = asyncWrapper(async (req, res) => {
  const result = await franchiseVendorService.submitFranchiseApplication(req.params.token, req.body, req.ip);
  return res.status(200).json(new ApiResponse(200, result, 'Franchise vendor application & KYC submitted successfully'));
});

// SUPER ADMIN APPLICATION MANAGEMENT ENDPOINTS
export const getFranchiseApplicationsStats = asyncWrapper(async (req, res) => {
  const stats = await franchiseVendorService.getFranchiseApplicationsStats();
  return res.status(200).json(new ApiResponse(200, stats, 'Franchise application statistics retrieved'));
});

export const getFranchiseApplications = asyncWrapper(async (req, res) => {
  const result = await franchiseVendorService.getFranchiseApplications(req.query);
  return res.status(200).json(new ApiResponse(200, result, 'Franchise vendor applications retrieved'));
});

export const getFranchiseApplicationById = asyncWrapper(async (req, res) => {
  const result = await franchiseVendorService.getFranchiseApplicationById(req.params.id);
  return res.status(200).json(new ApiResponse(200, result, 'Franchise vendor application details retrieved'));
});

export const reviewFranchiseApplication = asyncWrapper(async (req, res) => {
  const result = await franchiseVendorService.reviewFranchiseApplication(req.params.id, req.body, req.user, req.ip);
  return res.status(200).json(new ApiResponse(200, result, 'Application review status updated successfully'));
});

