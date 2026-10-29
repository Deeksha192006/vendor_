import { User } from '../models/User.js';
import { Vendor } from '../models/Vendor.js';
import { VendorBusiness } from '../models/VendorBusiness.js';
import { VendorAddress } from '../models/VendorAddress.js';
import { VendorDocument } from '../models/VendorDocument.js';
import { VendorBankAccount } from '../models/VendorBankAccount.js';
import { VendorStatusHistory } from '../models/VendorStatusHistory.js';
import { AdminNote } from '../models/AdminNote.js';
import { Product } from '../models/Product.js';
import { CustomerShopAttribution } from '../models/CustomerShopAttribution.js';
import { Settings } from '../models/Settings.js';
import { AuditLog } from '../models/AuditLog.js';
import { Subscription } from '../models/Subscription.js';
import { Franchise } from '../models/Franchise.js';
import { Shopkeeper } from '../models/Shopkeeper.js';
import { Shop } from '../models/Shop.js';
import { KYCDocument } from '../models/KYCDocument.js';
import { Commission } from '../models/Commission.js';
import { Payment } from '../models/Payment.js';
import { Order } from '../models/Order.js';
import { Fulfillment } from '../models/Fulfillment.js';
import { DeliveryAssignment } from '../models/DeliveryAssignment.js';
import { DeliveryPartner } from '../models/DeliveryPartner.js';
import { CoinTransaction } from '../models/CoinTransaction.js';
import { Coupon } from '../models/Coupon.js';
import { Campaign } from '../models/Campaign.js';
import { VendorWithdrawal } from '../models/VendorWithdrawal.js';
import { ReturnRequest } from '../models/ReturnRequest.js';
import { Territory } from '../models/Territory.js';
import { ShopQRCode } from '../models/ShopQRCode.js';

import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';
import { notificationService } from './notificationService.js';

export const validateSetting = (key, value) => {
  // Prevent credential storage in ordinary settings
  if (key.toLowerCase().includes('secret') || key.toLowerCase().includes('password') || key.toLowerCase().includes('credential')) {
    return 'Sensitive credentials cannot be stored in ordinary Settings';
  }

  if (key === 'MLM_CONFIG') {
    if (typeof value !== 'object' || value === null) return 'Value must be an object';
    if (!Number.isInteger(value.maxLevels) || value.maxLevels <= 0) return 'maxLevels must be a positive integer';
    if (!Array.isArray(value.levels)) return 'levels must be an array';
    for (const level of value.levels) {
      if (!Number.isInteger(level.level) || level.level <= 0) return 'level must be a positive integer';
      if (typeof level.percentage !== 'number' || level.percentage < 0 || level.percentage > 100) {
        return 'level percentage must be between 0 and 100';
      }
    }
  } else if (key === 'FAIR_COIN_RULES') {
    if (typeof value !== 'object' || value === null) return 'Value must be an object';
    if (!Number.isInteger(value.registrationCoins) || value.registrationCoins < 0) return 'registrationCoins must be a non-negative integer';
    if (!Number.isInteger(value.referralCoins) || value.referralCoins < 0) return 'referralCoins must be a non-negative integer';
  } else if (key === 'SPIN_WHEEL_CONFIG') {
    if (typeof value !== 'object' || value === null) return 'Value must be an object';
    if (typeof value.costPerSpin !== 'number' || value.costPerSpin < 0) return 'costPerSpin must be a non-negative number';
  } else if (key === 'MARKETPLACE_CONFIG') {
    if (typeof value !== 'object' || value === null) return 'Value must be an object';
    if (typeof value.commissionPercentage !== 'number' || value.commissionPercentage < 0 || value.commissionPercentage > 100) {
      return 'commissionPercentage must be between 0 and 100';
    }
  } else if (key === 'SUBSCRIPTION_CONFIG') {
    if (typeof value !== 'object' || value === null) return 'Value must be an object';
    if (!Number.isInteger(value.gracePeriodDays) || value.gracePeriodDays < 0) return 'gracePeriodDays must be a non-negative integer';
    if (!Number.isInteger(value.expiryAlertDays) || value.expiryAlertDays < 0) return 'expiryAlertDays must be a non-negative integer';
  } else if (key === 'DELIVERY_CONFIG') {
    if (typeof value !== 'object' || value === null) return 'Value must be an object';
    if (typeof value.baseDeliveryCharge !== 'number' || value.baseDeliveryCharge < 0) return 'baseDeliveryCharge must be a non-negative number';
    if (typeof value.freeDeliveryThreshold !== 'number' || value.freeDeliveryThreshold < 0) return 'freeDeliveryThreshold must be a non-negative number';
  }
  return null;
};

export const adminService = {
  // Settings Management
  async getSettings() {
    return await Settings.find({});
  },

  async updateSettings(key, value, category, adminUser, ip) {
    if (key === 'FAIR_COINS_PER_RUPEE' && Number(value) !== 10) {
      throw new ApiError(
        400,
        'Fair Coin conversion rate is permanently fixed at 10 Fair Coins = ₹1 and cannot be modified.',
        ERROR_CODES.BAD_REQUEST
      );
    }

    const errorMsg = validateSetting(key, value);
    if (errorMsg) {
      throw new ApiError(400, errorMsg, ERROR_CODES.BAD_REQUEST);
    }

    const oldSetting = await Settings.findOne({ key });

    const settings = await Settings.findOneAndUpdate(
      { key },
      { value, category, updatedBy: adminUser._id },
      { new: true, upsert: true }
    );

    await AuditLog.create({
      userId: adminUser._id,
      action: 'UPDATE_SETTINGS',
      entity: 'Settings',
      entityId: settings._id.toString(),
      oldValue: oldSetting ? oldSetting.value : null,
      newValue: value,
      ipAddress: ip
    });

    return settings;
  },

  // User Management
  async getUsers({ page = 1, limit = 10, search = '', role = '', status = '', date = '' }) {
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      query.role = role;
    }

    if (status) {
      query.status = status;
    }

    if (date) {
      const start = new Date(date);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setUTCHours(23, 59, 59, 999);
      query.createdAt = { $gte: start, $lte: end };
    }

    const skip = (page - 1) * limit;
    const users = await User.find(query)
      .select('-passwordHash -refreshTokenHash')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    return {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  },

  async getUserById(userId) {
    const user = await User.findById(userId).select('-passwordHash -refreshTokenHash');
    if (!user) throw new ApiError(404, 'User not found', ERROR_CODES.NOT_FOUND);
    return user;
  },

  async updateUserStatus(targetUserId, status, adminUser) {
    if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
      throw new ApiError(400, 'Invalid status. Status must be ACTIVE or SUSPENDED', ERROR_CODES.BAD_REQUEST);
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      throw new ApiError(404, 'User not found', ERROR_CODES.NOT_FOUND);
    }

    if (targetUser.role === 'SUPER_ADMIN' && adminUser.role !== 'SUPER_ADMIN') {
      throw new ApiError(403, 'Access denied: Only SUPER_ADMIN can modify other SUPER_ADMIN accounts', ERROR_CODES.FORBIDDEN);
    }

    targetUser.status = status;
    await targetUser.save();

    return targetUser;
  },

  // Vendor Management
  async getVendors({ page = 1, limit = 10, status = '', search = '', kycStatus = '', gstStatus = '', bankStatus = '', state = '', district = '', talukArea = '', from = '', to = '' }) {
    const query = {};
    if (status) query.status = status;
    if (kycStatus) query.kycStatus = kycStatus;
    if (search) {
      query.$or = [
        { storeName: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setUTCHours(23, 59, 59, 999);
        query.createdAt.$lte = toDate;
      }
    }

    // Need to find vendors matching complex sub-document filters
    let vendorIdsToKeep = null;
    
    if (gstStatus) {
      const businesses = await VendorBusiness.find({ gstStatus }).select('vendorId');
      vendorIdsToKeep = businesses.map(b => b.vendorId.toString());
    }
    
    if (bankStatus) {
      const banks = await VendorBankAccount.find({ verificationStatus: bankStatus }).select('vendorId');
      const bankVendorIds = banks.map(b => b.vendorId.toString());
      if (vendorIdsToKeep === null) {
        vendorIdsToKeep = bankVendorIds;
      } else {
        vendorIdsToKeep = vendorIdsToKeep.filter(id => bankVendorIds.includes(id));
      }
    }
    
    if (state || district || talukArea) {
      const locQuery = {};
      if (state) locQuery.state = state;
      if (district) locQuery.district = district;
      if (talukArea) locQuery.talukArea = talukArea;
      
      const addresses = await VendorAddress.find(locQuery).select('vendorId');
      const addressVendorIds = addresses.map(a => a.vendorId.toString());
      if (vendorIdsToKeep === null) {
        vendorIdsToKeep = addressVendorIds;
      } else {
        vendorIdsToKeep = vendorIdsToKeep.filter(id => addressVendorIds.includes(id));
      }
    }
    
    if (vendorIdsToKeep !== null) {
      query._id = { $in: vendorIdsToKeep };
    }

    // Also need to allow search by email and mobile
    if (search) {
      const users = await User.find({ 
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      const userIds = users.map(u => u._id);
      
      query.$or.push({ userId: { $in: userIds } });
      query.$or.push({ phone: { $regex: search, $options: 'i' } });
    }

    const skip = (page - 1) * limit;
    const vendors = await Vendor.find(query)
      .populate('userId', 'name email role status')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // Populate the missing fields for the admin list
    const populatedVendors = await Promise.all(vendors.map(async (v) => {
      const loc = await VendorAddress.findOne({ vendorId: v._id }).populate('state district talukArea', 'name');
      const bus = await VendorBusiness.findOne({ vendorId: v._id });
      const bank = await VendorBankAccount.findOne({ vendorId: v._id });
      return {
        ...v.toObject(),
        location: loc,
        business: bus,
        bank: bank ? (bank.toMaskedJSON ? bank.toMaskedJSON() : bank) : null
      };
    }));

    const total = await Vendor.countDocuments(query);

    return {
      vendors: populatedVendors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  },

  async getVendorById(vendorId) {
    const vendor = await Vendor.findById(vendorId).populate('userId', 'name email role status');
    if (!vendor) throw new ApiError(404, 'Vendor not found', ERROR_CODES.NOT_FOUND);
    
    const business = await VendorBusiness.findOne({ vendorId: vendor._id });
    const location = await VendorAddress.findOne({ vendorId: vendor._id })
      .populate('state', 'name')
      .populate('district', 'name')
      .populate('talukArea', 'name');
    const kyc = await VendorDocument.findOne({ vendorId: vendor._id });
    const bank = await VendorBankAccount.findOne({ vendorId: vendor._id });
    const statusHistory = await VendorStatusHistory.find({ vendorId: vendor._id })
      .populate('changedBy', 'name email')
      .sort({ createdAt: -1 });

    return { 
      vendor, 
      business, 
      location, 
      kyc, 
      bank: bank ? (bank.toMaskedJSON ? bank.toMaskedJSON() : bank) : null, 
      statusHistory 
    };
  },

  async updateVendorStatus(vendorId, status, adminUser, reason = '') {
    const validStatuses = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED', 'BLOCKED'];
    if (!validStatuses.includes(status)) {
      throw new ApiError(400, 'Invalid vendor status', ERROR_CODES.BAD_REQUEST);
    }
    
    if (status === 'REJECTED' && !reason) {
      throw new ApiError(400, 'Rejection reason is required', ERROR_CODES.BAD_REQUEST);
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      throw new ApiError(404, 'Vendor profile not found', ERROR_CODES.NOT_FOUND);
    }

    const oldStatus = vendor.status;
    vendor.status = status;
    await vendor.save();
    
    await VendorStatusHistory.create({
      vendorId: vendor._id,
      previousStatus: oldStatus,
      newStatus: status,
      changedBy: adminUser._id,
      reason
    });

    if (status === 'REJECTED') {
      const { sendEmail } = await import('../utils/mailer.js');
      await sendEmail({
        to: vendor.email,
        subject: 'Vendor Application Rejected - Babu Super Market',
        text: `We regret to inform you that your vendor application for ${vendor.storeName} has been rejected.\nReason: ${reason}\nPlease contact support for more information.`
      });
    }

    if (status === 'APPROVED') {
      await User.findByIdAndUpdate(vendor.userId, { role: 'VENDOR' });
    }

    // Send Notification
    await notificationService.createNotification({
      userId: vendor.userId,
      title: 'Vendor Status Updated',
      message: status === 'REJECTED' ? `Your vendor application was rejected. Reason: ${reason}` : `Your vendor account status has been set to ${status}.`,
      type: 'ACCOUNT_STATUS'
    });

    return vendor;
  },

  async updateVendorPaymentStatus(vendorId, paymentStatus, adminUser, paidAmount = 1999) {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) throw new ApiError(404, 'Vendor profile not found', ERROR_CODES.NOT_FOUND);

    const oldPaymentStatus = vendor.paymentStatus;
    vendor.paymentStatus = paymentStatus;
    vendor.isPaid = paymentStatus === 'PAID';
    if (paymentStatus === 'PAID') {
      vendor.paidAmount = paidAmount || 1999;
      vendor.paymentDate = new Date();
      vendor.paymentTransactionId = `txn_admin_verify_${Date.now()}`;
      vendor.status = 'APPROVED'; // Auto approve store upon payment
      await User.findByIdAndUpdate(vendor.userId, { role: 'VENDOR' });
    }
    await vendor.save();

    await logAdminAction({
      userId: adminUser._id,
      action: 'UPDATE_VENDOR_PAYMENT_STATUS',
      entity: 'Vendor',
      entityId: vendor._id.toString(),
      oldValue: { paymentStatus: oldPaymentStatus, isPaid: !vendor.isPaid },
      newValue: { paymentStatus, isPaid: vendor.isPaid },
    });

    await notificationService.createNotification({
      userId: vendor.userId,
      title: 'Vendor Payment Status Updated',
      message: paymentStatus === 'PAID' ? 'Your vendor platform payment of ₹1,999 has been verified and approved by Admin. All platform features are now unlocked!' : `Your vendor payment status is updated to ${paymentStatus}.`,
      type: 'PAYMENT_UPDATE'
    });

    return vendor;
  },

  async getVendorDashboardCounters() {
    const [
      total,
      pending,
      underReview,
      approved,
      rejected,
      suspended,
      blocked
    ] = await Promise.all([
      Vendor.countDocuments(),
      Vendor.countDocuments({ status: 'PENDING' }),
      Vendor.countDocuments({ status: 'UNDER_REVIEW' }),
      Vendor.countDocuments({ status: 'APPROVED' }),
      Vendor.countDocuments({ status: 'REJECTED' }),
      Vendor.countDocuments({ status: 'SUSPENDED' }),
      Vendor.countDocuments({ status: 'BLOCKED' })
    ]);

    return { total, pending, underReview, approved, rejected, suspended, blocked };
  },

  async verifyVendorDocument(vendorId, docType, status, reason, adminUser) {
    if (!['VERIFIED', 'REJECTED'].includes(status)) throw new ApiError(400, 'Invalid status', ERROR_CODES.BAD_REQUEST);
    if (status === 'REJECTED' && !reason) throw new ApiError(400, 'Reason required for rejection', ERROR_CODES.BAD_REQUEST);

    const kyc = await VendorDocument.findOne({ vendorId });
    if (!kyc) throw new ApiError(404, 'Documents not found', ERROR_CODES.NOT_FOUND);

    if (docType === 'identity') {
      kyc.identityDocumentStatus = status;
      kyc.identityDocumentReason = reason;
    } else if (docType === 'pan') {
      kyc.panDocumentStatus = status;
      kyc.panDocumentReason = reason;
    } else if (docType === 'gst') {
      kyc.gstCertificateStatus = status;
      kyc.gstCertificateReason = reason;
    } else if (docType === 'business') {
      kyc.businessProofStatus = status;
      kyc.businessProofReason = reason;
    } else {
      throw new ApiError(400, 'Invalid document type', ERROR_CODES.BAD_REQUEST);
    }
    await kyc.save();

    // Check if all are verified -> update Vendor kycStatus to VERIFIED
    const allStatuses = [kyc.identityDocumentStatus, kyc.panDocumentStatus, kyc.gstCertificateStatus, kyc.businessProofStatus];
    const vendor = await Vendor.findById(vendorId);
    
    if (allStatuses.every(s => s === 'VERIFIED' || !s)) {
      vendor.kycStatus = 'VERIFIED';
    } else if (allStatuses.some(s => s === 'REJECTED')) {
      vendor.kycStatus = 'REJECTED';
    } else {
      vendor.kycStatus = 'PARTIALLY_VERIFIED';
    }
    await vendor.save();

    return kyc;
  },

  async verifyVendorBank(vendorId, status, reason, adminUser) {
    if (!['VERIFIED', 'REJECTED'].includes(status)) throw new ApiError(400, 'Invalid status', ERROR_CODES.BAD_REQUEST);
    if (status === 'REJECTED' && !reason) throw new ApiError(400, 'Reason required for rejection', ERROR_CODES.BAD_REQUEST);

    const bank = await VendorBankAccount.findOne({ vendorId });
    if (!bank) throw new ApiError(404, 'Bank details not found', ERROR_CODES.NOT_FOUND);

    bank.verificationStatus = status;
    bank.rejectionReason = reason;
    await bank.save();
    return bank;
  },

  async getAdminNotes(vendorId) {
    return await AdminNote.find({ vendorId })
      .populate('adminId', 'name email')
      .sort({ createdAt: -1 });
  },

  async createAdminNote(vendorId, note, adminUser) {
    const adminNote = await AdminNote.create({
      vendorId,
      adminId: adminUser._id,
      note
    });
    return adminNote;
  },

  // Shop Management
  async getShops({ page = 1, limit = 10, status = '', search = '' }) {
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { shopName: { $regex: search, $options: 'i' } },
        { shopCode: { $regex: search, $options: 'i' } }
      ];
    }
    const skip = (page - 1) * limit;
    const shops = await Shop.find(query)
      .populate('shopkeeperId')
      .populate('talukFranchiseId')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Shop.countDocuments(query);
    return {
      shops,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    };
  },

  async getShopById(id) {
    const shop = await Shop.findById(id)
      .populate('shopkeeperId')
      .populate('talukFranchiseId')
      .populate('subscriptionId');
    if (!shop) throw new ApiError(404, 'Shop not found', ERROR_CODES.NOT_FOUND);
    return shop;
  },

  async updateShopStatus(id, status, adminUser, ip) {
    const shop = await Shop.findById(id);
    if (!shop) throw new ApiError(404, 'Shop not found', ERROR_CODES.NOT_FOUND);

    const oldStatus = shop.status;
    shop.status = status;
    await shop.save();

    await AuditLog.create({
      userId: adminUser._id,
      action: `SHOP_STATUS_${status}`,
      entity: 'Shop',
      entityId: id,
      oldValue: oldStatus,
      newValue: status,
      ipAddress: ip
    });

    return shop;
  },

  async getShopAttributions({ page = 1, limit = 10, shopId = '', customerUserId = '', date = '', status = '' }) {
    const query = {};
    if (shopId) query.shopId = shopId;
    if (customerUserId) query.customerUserId = customerUserId;
    if (status) query.status = status;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      query.attributedAt = { $gte: start, $lt: end };
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const [attributions, total] = await Promise.all([
      CustomerShopAttribution.find(query)
        .populate('customerUserId', 'name email')
        .populate('shopId', 'shopName shopCode')
        .populate('qrCodeId', 'publicToken')
        .skip(skip)
        .limit(limitNum)
        .sort({ attributedAt: -1 }),
      CustomerShopAttribution.countDocuments(query)
    ]);

    return {
      attributions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum) || 1
      }
    };
  },

  // Franchise Management
  async getFranchises({ page = 1, limit = 10, status = '', search = '' }) {
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.businessName = { $regex: search, $options: 'i' };
    }
    const skip = (page - 1) * limit;
    const franchises = await Franchise.find(query)
      .populate('userId', 'name email phone')
      .populate('territoryId')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Franchise.countDocuments(query);
    return {
      franchises,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    };
  },

  async getFranchiseById(id) {
    const franchise = await Franchise.findById(id)
      .populate('userId', 'name email phone')
      .populate('territoryId')
      .populate('parentFranchiseId');
    if (!franchise) throw new ApiError(404, 'Franchise not found', ERROR_CODES.NOT_FOUND);
    return franchise;
  },

  async updateFranchiseStatus(id, status, adminUser, ip) {
    const franchise = await Franchise.findById(id);
    if (!franchise) throw new ApiError(404, 'Franchise not found', ERROR_CODES.NOT_FOUND);

    const oldStatus = franchise.status;
    franchise.status = status;
    await franchise.save();

    await AuditLog.create({
      userId: adminUser._id,
      action: `FRANCHISE_STATUS_${status}`,
      entity: 'Franchise',
      entityId: id,
      oldValue: oldStatus,
      newValue: status,
      ipAddress: ip
    });

    return franchise;
  },

  // Product Management
  async getProductById(id) {
    const product = await Product.findById(id).populate('vendorId', 'storeName');
    if (!product) throw new ApiError(404, 'Product not found', ERROR_CODES.NOT_FOUND);
    return product;
  },

  // Order Management
  async getOrders({ page = 1, limit = 10, orderNumber = '', status = '', paymentStatus = '', userId = '', attributedShopId = '' }) {
    const query = {};
    if (orderNumber) query.orderNumber = { $regex: orderNumber, $options: 'i' };
    if (status) query.orderStatus = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (userId) query.userId = userId;
    if (attributedShopId) query.attributedShopId = attributedShopId;

    const skip = (page - 1) * limit;
    const orders = await Order.find(query)
      .populate('userId', 'name email')
      .populate('attributedShopId', 'shopName shopCode')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(query);
    return {
      orders,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    };
  },

  async getOrderById(id) {
    const order = await Order.findById(id)
      .populate('userId', 'name email phone')
      .populate('attributedShopId');
    if (!order) throw new ApiError(404, 'Order not found', ERROR_CODES.NOT_FOUND);

    const fulfillments = await Fulfillment.find({ orderId: id });
    const payments = await Payment.find({ orderId: id });

    return { order, fulfillments, payments };
  },

  // Payment Reporting
  async getPayments({ page = 1, limit = 10, status = '', gateway = '', orderId = '', subscriptionId = '' }) {
    const query = {};
    if (status) query.status = status;
    if (gateway) query.paymentMethod = gateway;
    if (orderId) query.orderId = orderId;
    if (subscriptionId) query.subscriptionId = subscriptionId;

    const skip = (page - 1) * limit;
    const payments = await Payment.find(query)
      .populate('userId', 'name email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Payment.countDocuments(query);
    return {
      payments,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    };
  },

  async getPaymentById(id) {
    const payment = await Payment.findById(id).populate('userId', 'name email');
    if (!payment) throw new ApiError(404, 'Payment not found', ERROR_CODES.NOT_FOUND);
    return payment;
  },

  // KYC Management
  async getKycs({ page = 1, limit = 10, status = '', entityType = '' }) {
    const query = {};
    if (status) query.status = status;
    if (entityType) query.entityType = entityType;

    const skip = (page - 1) * limit;
    const kycs = await KYCDocument.find(query)
      .populate('ownerUserId', 'name email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await KYCDocument.countDocuments(query);
    return {
      kycs,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    };
  },

  async getKycById(id) {
    const kyc = await KYCDocument.findById(id).populate('ownerUserId', 'name email');
    if (!kyc) throw new ApiError(404, 'KYC document not found', ERROR_CODES.NOT_FOUND);
    return kyc;
  },

  async updateKycStatus(id, status, rejectionReason, adminUser, ip) {
    if (!['VERIFIED', 'REJECTED'].includes(status)) {
      throw new ApiError(400, 'Invalid KYC status', ERROR_CODES.BAD_REQUEST);
    }

    const kyc = await KYCDocument.findById(id);
    if (!kyc) throw new ApiError(404, 'KYC document not found', ERROR_CODES.NOT_FOUND);

    const oldStatus = kyc.status;
    kyc.status = status;
    kyc.reviewedAt = new Date();
    kyc.reviewedBy = adminUser._id;
    if (status === 'REJECTED') {
      kyc.rejectionReason = rejectionReason || 'Documents rejected by administrator';
    }
    await kyc.save();

    await AuditLog.create({
      userId: adminUser._id,
      action: `KYC_STATUS_${status}`,
      entity: 'KYCDocument',
      entityId: id,
      oldValue: oldStatus,
      newValue: status,
      ipAddress: ip
    });

    // Update shop or franchise kycStatus
    if (kyc.entityType === 'SHOPKEEPER') {
      await Shopkeeper.findByIdAndUpdate(kyc.entityId, { kycStatus: status });
    } else if (kyc.entityType === 'SHOP') {
      await Shop.findByIdAndUpdate(kyc.entityId, { kycStatus: status });
    } else if (kyc.entityType === 'FRANCHISE') {
      await Franchise.findByIdAndUpdate(kyc.entityId, { kycStatus: status });
    }

    return kyc;
  },

  // MLM Commissions
  async getCommissions({ page = 1, limit = 10, recipientUserId = '', type = '', status = '' }) {
    const query = {};
    if (recipientUserId) query.recipientUserId = recipientUserId;
    if (type) query.type = type;
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const commissions = await Commission.find(query)
      .populate('recipientUserId', 'name email role')
      .populate('orderId', 'orderNumber')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Commission.countDocuments(query);
    return {
      commissions,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    };
  },

  async getCommissionById(id) {
    const commission = await Commission.findById(id)
      .populate('recipientUserId', 'name email role')
      .populate('orderId');
    if (!commission) throw new ApiError(404, 'Commission not found', ERROR_CODES.NOT_FOUND);
    return commission;
  },

  // Settlements (VendorWithdrawals)
  async getSettlements({ page = 1, limit = 10, status = '' }) {
    const query = {};
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const settlements = await VendorWithdrawal.find(query)
      .populate('vendorId')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await VendorWithdrawal.countDocuments(query);
    return {
      settlements,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    };
  },

  async getSettlementById(id) {
    const settlement = await VendorWithdrawal.findById(id).populate('vendorId');
    if (!settlement) throw new ApiError(404, 'Settlement not found', ERROR_CODES.NOT_FOUND);
    return settlement;
  },

  async updateSettlementStatus(id, status, adminNotes, adminUser, ip) {
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      throw new ApiError(400, 'Invalid settlement status', ERROR_CODES.BAD_REQUEST);
    }

    const settlement = await VendorWithdrawal.findById(id);
    if (!settlement) throw new ApiError(404, 'Settlement record not found', ERROR_CODES.NOT_FOUND);

    if (settlement.status !== 'PENDING') {
      throw new ApiError(400, `Settlement has already been processed with status: ${settlement.status}`, ERROR_CODES.BAD_REQUEST);
    }

    const oldStatus = settlement.status;
    settlement.status = status;
    settlement.adminNotes = adminNotes || '';
    settlement.processedAt = new Date();
    await settlement.save();

    const vendor = await Vendor.findById(settlement.vendorId);
    if (vendor) {
      if (status === 'APPROVED') {
        vendor.pendingBalance = Math.max(0, (vendor.pendingBalance || 0) - settlement.amount);
        await vendor.save();

        const { VendorLedger } = await import('../models/VendorLedger.js');
        await VendorLedger.create({
          vendorId: vendor._id,
          transactionType: 'PAYOUT',
          debit: settlement.amount,
          balanceSnapshot: vendor.balance,
          description: `Withdrawal payout processed: ₹${settlement.amount}`,
          referenceId: settlement._id.toString(),
        });
      } else if (status === 'REJECTED') {
        vendor.pendingBalance = Math.max(0, (vendor.pendingBalance || 0) - settlement.amount);
        vendor.balance = (vendor.balance || 0) + settlement.amount;
        await vendor.save();
      }
    }

    await AuditLog.create({
      userId: adminUser._id,
      action: `SETTLEMENT_STATUS_${status}`,
      entity: 'VendorWithdrawal',
      entityId: id,
      oldValue: oldStatus,
      newValue: status,
      ipAddress: ip
    });

    return settlement;
  },

  // Coupons
  async getCoupons({ page = 1, limit = 10, active = '' }) {
    const query = {};
    if (active === 'true') query.isActive = true;
    if (active === 'false') query.isActive = false;

    const skip = (page - 1) * limit;
    const coupons = await Coupon.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Coupon.countDocuments(query);
    return {
      coupons,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    };
  },

  async createCoupon(data) {
    const coupon = new Coupon(data);
    return await coupon.save();
  },

  async updateCoupon(id, data) {
    const coupon = await Coupon.findByIdAndUpdate(id, data, { new: true });
    if (!coupon) throw new ApiError(404, 'Coupon not found', ERROR_CODES.NOT_FOUND);
    return coupon;
  },

  async updateCouponStatus(id, isActive) {
    const coupon = await Coupon.findByIdAndUpdate(id, { isActive }, { new: true });
    if (!coupon) throw new ApiError(404, 'Coupon not found', ERROR_CODES.NOT_FOUND);
    return coupon;
  },

  // Campaigns
  async getCampaigns({ page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;
    const campaigns = await Campaign.find({})
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Campaign.countDocuments({});
    return {
      campaigns,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    };
  },

  async createCampaign(data) {
    const campaign = new Campaign(data);
    return await campaign.save();
  },

  async updateCampaign(id, data) {
    const campaign = await Campaign.findByIdAndUpdate(id, data, { new: true });
    if (!campaign) throw new ApiError(404, 'Campaign not found', ERROR_CODES.NOT_FOUND);
    return campaign;
  },

  async updateCampaignStatus(id, isActive) {
    const campaign = await Campaign.findByIdAndUpdate(id, { isActive }, { new: true });
    if (!campaign) throw new ApiError(404, 'Campaign not found', ERROR_CODES.NOT_FOUND);
    return campaign;
  },

  // Fulfillments
  async getFulfillments({ page = 1, limit = 10, status = '', sourceType = '' }) {
    const query = {};
    if (status) query.status = status;
    if (sourceType) query.sourceType = sourceType;

    const skip = (page - 1) * limit;
    const fulfillments = await Fulfillment.find(query)
      .populate('orderId', 'orderNumber')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Fulfillment.countDocuments(query);
    return {
      fulfillments,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    };
  },

  async getFulfillmentById(id) {
    const fulfillment = await Fulfillment.findById(id).populate('orderId');
    if (!fulfillment) throw new ApiError(404, 'Fulfillment not found', ERROR_CODES.NOT_FOUND);
    return fulfillment;
  },

  // Deliveries
  async getDeliveries({ page = 1, limit = 10, status = '' }) {
    const query = {};
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const deliveries = await DeliveryAssignment.find(query)
      .populate('deliveryPartnerId')
      .populate('fulfillmentId')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await DeliveryAssignment.countDocuments(query);
    return {
      deliveries,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    };
  },

  async getDeliveryById(id) {
    const delivery = await DeliveryAssignment.findById(id)
      .populate('deliveryPartnerId')
      .populate('fulfillmentId');
    if (!delivery) throw new ApiError(404, 'Delivery assignment not found', ERROR_CODES.NOT_FOUND);
    return delivery;
  },

  // Enhanced Audit Logs with Search Filters
  async getAuditLogsFiltered({ page = 1, limit = 20, actor = '', action = '', resource = '', resourceId = '', date = '' }) {
    const query = {};
    const parsedPage = Math.max(1, parseInt(page) || 1);
    const parsedLimit = Math.max(1, parseInt(limit) || 20);
    const skip = (parsedPage - 1) * parsedLimit;

    if (actor) {
      // Find user by email or name regex, then match userId
      const matchedUsers = await User.find({
        $or: [
          { name: { $regex: actor, $options: 'i' } },
          { email: { $regex: actor, $options: 'i' } }
        ]
      }).select('_id');
      query.userId = { $in: matchedUsers.map(u => u._id) };
    }

    if (action) {
      query.action = { $regex: action, $options: 'i' };
    }

    if (resource) {
      query.entity = { $regex: resource, $options: 'i' };
    }

    if (resourceId) {
      query.entityId = resourceId;
    }

    if (date) {
      const start = new Date(date);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setUTCHours(23, 59, 59, 999);
      query.createdAt = { $gte: start, $lte: end };
    }

    const logs = await AuditLog.find(query)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit);

    const total = await AuditLog.countDocuments(query);

    return {
      logs,
      total,
      page: parsedPage,
      pages: Math.ceil(total / parsedLimit)
    };
  },

  // ----------------------------------------------------
  // ANALYTICS SERVICE LAYER (MongoDB Aggregations)
  // ----------------------------------------------------

  async getRevenueAnalytics(startDate, endDate) {
    const revenueStats = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: {
        _id: null,
        grossSales: { $sum: { $add: ['$subtotal', '$shippingFee', '$tax'] } },
        netSales: { $sum: '$total' },
        couponDiscounts: { $sum: '$discount' },
        coinDiscounts: { $sum: '$coinDiscount' },
        deliveryRevenue: { $sum: '$shippingFee' },
        refunds: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'REFUNDED'] }, '$total', 0] } }
      }}
    ]);

    const paymentStats = await Payment.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: {
        _id: null,
        successfulPayments: { $sum: { $cond: [{ $in: ['$status', ['SUCCESS', 'CAPTURED']] }, 1, 0] } },
        failedPayments: { $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] } }
      }}
    ]);

    return {
      grossSales: revenueStats[0]?.grossSales || 0,
      netSales: revenueStats[0]?.netSales || 0,
      discounts: (revenueStats[0]?.couponDiscounts || 0) + (revenueStats[0]?.coinDiscounts || 0),
      couponDiscounts: revenueStats[0]?.couponDiscounts || 0,
      coinDiscounts: revenueStats[0]?.coinDiscounts || 0,
      deliveryRevenue: revenueStats[0]?.deliveryRevenue || 0,
      refunds: revenueStats[0]?.refunds || 0,
      successfulPayments: paymentStats[0]?.successfulPayments || 0,
      failedPayments: paymentStats[0]?.failedPayments || 0
    };
  },

  async getOrderAnalytics(startDate, endDate) {
    const counts = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
    ]);

    const formattedCounts = {
      total: 0,
      confirmed: 0,
      processing: 0,
      packed: 0,
      dispatched: 0,
      outForDelivery: 0,
      delivered: 0,
      cancelled: 0,
      returned: 0
    };

    counts.forEach(c => {
      formattedCounts.total += c.count;
      if (c._id === 'CONFIRMED') formattedCounts.confirmed = c.count;
      else if (c._id === 'PROCESSING') formattedCounts.processing = c.count;
      else if (c._id === 'PACKED') formattedCounts.packed = c.count;
      else if (c._id === 'SHIPPED' || c._id === 'DISPATCHED') formattedCounts.dispatched = c.count;
      else if (c._id === 'OUT_FOR_DELIVERY') formattedCounts.outForDelivery = c.count;
      else if (c._id === 'DELIVERED') formattedCounts.delivered = c.count;
      else if (c._id === 'CANCELLED') formattedCounts.cancelled = c.count;
      else if (c._id === 'RETURNED' || c._id === 'REFUNDED') formattedCounts.returned = c.count;
    });

    const trend = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
        revenue: { $sum: '$total' }
      }},
      { $sort: { _id: 1 } }
    ]);

    return { counts: formattedCounts, trend };
  },

  async getCustomerAnalytics(startDate, endDate) {
    const total = await User.countDocuments({ role: { $in: [ROLES.CUSTOMER, 'USER'] } });
    const active = await User.countDocuments({ role: { $in: [ROLES.CUSTOMER, 'USER'] }, status: 'ACTIVE' });
    const suspended = await User.countDocuments({ role: { $in: [ROLES.CUSTOMER, 'USER'] }, status: 'SUSPENDED' });
    const newCust = await User.countDocuments({ role: { $in: [ROLES.CUSTOMER, 'USER'] }, createdAt: { $gte: startDate, $lte: endDate } });
    const verified = await User.countDocuments({ role: { $in: [ROLES.CUSTOMER, 'USER'] }, $or: [{ emailVerified: true }, { phoneVerified: true }] });

    const withOrders = await Order.distinct('userId', { createdAt: { $gte: startDate, $lte: endDate } });

    const repeatStats = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $count: 'total' }
    ]);

    return {
      totalCustomers: total,
      activeCustomers: active,
      suspendedCustomers: suspended,
      newCustomers: newCust,
      verifiedCustomers: verified,
      customersWithOrders: withOrders.length,
      repeatCustomers: repeatStats[0]?.total || 0
    };
  },

  async getVendorAnalytics(startDate, endDate) {
    const total = await Vendor.countDocuments();
    const pending = await Vendor.countDocuments({ status: 'PENDING' });
    const approved = await Vendor.countDocuments({ status: 'APPROVED' });
    const rejected = await Vendor.countDocuments({ status: 'REJECTED' });
    const suspended = await Vendor.countDocuments({ status: 'SUSPENDED' });

    const salesStats = await VendorOrder.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate }, status: { $ne: 'CANCELLED' } } },
      { $group: {
        _id: null,
        vendorGMV: { $sum: '$subtotal' },
        vendorEarnings: { $sum: '$vendorEarning' },
        platformCommission: { $sum: '$platformCommission' },
        orderCount: { $sum: 1 }
      }}
    ]);

    return {
      totalVendors: total,
      pendingVendors: pending,
      approvedVendors: approved,
      rejectedVendors: rejected,
      suspendedVendors: suspended,
      vendorGMV: salesStats[0]?.vendorGMV || 0,
      vendorEarnings: salesStats[0]?.vendorEarnings || 0,
      platformCommission: salesStats[0]?.platformCommission || 0,
      orderCount: salesStats[0]?.orderCount || 0
    };
  },

  async getShopAnalytics(startDate, endDate) {
    const total = await Shop.countDocuments();
    const pending = await Shop.countDocuments({ status: 'PENDING' });
    const active = await Shop.countDocuments({ status: 'ACTIVE' });
    const suspended = await Shop.countDocuments({ status: 'SUSPENDED' });
    const expired = await Shop.countDocuments({ status: 'EXPIRED' });

    const attributions = await CustomerShopAttribution.countDocuments({ attributedAt: { $gte: startDate, $lte: endDate } });
    const activeQrs = await ShopQRCode.countDocuments({ status: 'ACTIVE' });

    const orderStats = await Order.aggregate([
      { $match: { attributedShopId: { $ne: null }, createdAt: { $gte: startDate, $lte: endDate }, paymentStatus: 'PAID' } },
      { $group: {
        _id: null,
        count: { $sum: 1 },
        totalAmount: { $sum: '$total' }
      }}
    ]);

    // Sum shop upline commissions
    const shopsUsers = await Shopkeeper.distinct('userId');
    const commStats = await Commission.aggregate([
      { $match: { recipientUserId: { $in: shopsUsers }, createdAt: { $gte: startDate, $lte: endDate }, status: { $ne: 'CANCELLED' } } },
      { $group: { _id: null, totalComm: { $sum: '$commissionAmount' } } }
    ]);

    return {
      totalShops: total,
      pendingShops: pending,
      activeShops: active,
      suspendedShops: suspended,
      expiredShops: expired,
      attributedCustomers: attributions,
      shopOrders: orderStats[0]?.count || 0,
      shopCommission: commStats[0]?.totalComm || 0,
      activeQRShops: activeQrs
    };
  },

  async getFranchiseAnalytics(startDate, endDate) {
    const stateCount = await Franchise.countDocuments({ franchiseType: 'STATE', status: 'ACTIVE' });
    const districtCount = await Franchise.countDocuments({ franchiseType: 'DISTRICT', status: 'ACTIVE' });
    const talukCount = await Franchise.countDocuments({ franchiseType: 'TALUK', status: 'ACTIVE' });

    const territories = await Territory.find({ status: 'ACTIVE' });
    const details = [];

    for (const terr of territories) {
      let shopQuery = {};
      if (terr.type === 'STATE') {
        shopQuery = { state: { $regex: new RegExp(`^${terr.name}$`, 'i') } };
      } else if (terr.type === 'DISTRICT') {
        shopQuery = { district: { $regex: new RegExp(`^${terr.name}$`, 'i') } };
      } else {
        shopQuery = { 
          $or: [
            { taluk: { $regex: new RegExp(`^${terr.name}$`, 'i') } },
            { pincode: { $in: terr.pincodes } }
          ]
        };
      }

      const shops = await Shop.find(shopQuery);
      const shopIds = shops.map(s => s._id);

      const custCount = await User.countDocuments({ attributedShopId: { $in: shopIds } });

      const orderStats = await Order.aggregate([
        { $match: { attributedShopId: { $in: shopIds }, createdAt: { $gte: startDate, $lte: endDate }, paymentStatus: 'PAID' } },
        { $group: {
          _id: null,
          ordersCount: { $sum: 1 },
          sales: { $sum: '$total' }
        }}
      ]);

      const orders = await Order.find({ attributedShopId: { $in: shopIds }, createdAt: { $gte: startDate, $lte: endDate } }, { _id: 1 });
      const commStats = await Commission.aggregate([
        { $match: { orderId: { $in: orders.map(o => o._id) }, status: { $ne: 'CANCELLED' } } },
        { $group: { _id: null, totalComm: { $sum: '$commissionAmount' } } }
      ]);

      details.push({
        territory: terr.name,
        type: terr.type,
        shopsCount: shops.length,
        customersCount: custCount,
        ordersCount: orderStats[0]?.ordersCount || 0,
        sales: orderStats[0]?.sales || 0,
        commission: commStats[0]?.totalComm || 0
      });
    }

    return {
      stateFranchises: stateCount,
      districtFranchises: districtCount,
      talukFranchises: talukCount,
      territories: details
    };
  },

  async getKycAnalytics(startDate, endDate) {
    const pending = await KYCDocument.countDocuments({ status: 'PENDING' });
    const verified = await KYCDocument.countDocuments({ status: 'VERIFIED' });
    const rejected = await KYCDocument.countDocuments({ status: 'REJECTED' });

    const reviewTimes = await KYCDocument.aggregate([
      { $match: { status: { $in: ['VERIFIED', 'REJECTED'] }, reviewedAt: { $ne: null } } },
      { $project: { duration: { $subtract: ['$reviewedAt', '$submittedAt'] } } },
      { $group: { _id: null, avgTime: { $avg: '$duration' } } }
    ]);
    const avgSec = reviewTimes[0]?.avgTime ? Math.round(reviewTimes[0].avgTime / 1000) : 0;

    return {
      pending,
      underReview: 0, // Mocked parameter for interface compatibility
      verified,
      rejected,
      averageReviewTimeSec: avgSec
    };
  },

  async getSubscriptionAnalytics(startDate, endDate) {
    const active = await Subscription.countDocuments({ status: 'ACTIVE' });
    const pending = await Subscription.countDocuments({ status: 'PENDING' });
    const expired = await Subscription.countDocuments({ status: 'EXPIRED' });
    const renewals = await Subscription.countDocuments({ renewalCount: { $gt: 0 } });
    const newSubs = await Subscription.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } });

    const revStats = await Payment.aggregate([
      { $match: { subscriptionId: { $ne: null }, status: 'SUCCESS', createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const now = new Date();
    const getExpiringCount = async (days) => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      return await Subscription.countDocuments({
        status: 'ACTIVE',
        endDate: { $gte: now, $lte: futureDate }
      });
    };

    return {
      activeSubscriptions: active,
      pending,
      expired,
      renewals,
      newSubscriptions: newSubs,
      revenue: revStats[0]?.total || 0,
      expiring7Days: await getExpiringCount(7),
      expiring15Days: await getExpiringCount(15),
      expiring30Days: await getExpiringCount(30)
    };
  },

  async getCommissionAnalytics(startDate, endDate) {
    const totalStats = await Commission.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: {
        _id: '$status',
        total: { $sum: '$commissionAmount' }
      }}
    ]);

    let total = 0, paid = 0, pending = 0, reversed = 0;
    totalStats.forEach(t => {
      total += t.total;
      if (t._id === 'PAID') paid = t.total;
      else if (t._id === 'PENDING') pending = t.total;
      else if (t._id === 'CANCELLED') reversed = t.total;
    });

    // Breakdown
    const commissions = await Commission.find({ createdAt: { $gte: startDate, $lte: endDate } }).populate('recipientUserId');
    const breakdown = {
      vendor: 0,
      shop: 0,
      mlmL1: 0,
      mlmL2: 0,
      mlmL3: 0,
      mlmL4: 0,
      mlmL5: 0,
      mlmL6: 0,
      mlmL7: 0,
      mlmL8: 0,
      mlmL9: 0,
      franchise: 0
    };

    for (const c of commissions) {
      if (c.status === 'CANCELLED') continue;
      
      const recipient = c.recipientUserId;
      if (!recipient) continue;

      if (c.type === 'VENDOR_PLATFORM_COMMISSION') {
        breakdown.vendor += c.commissionAmount;
      } else if (['STATE_FRANCHISE', 'DISTRICT_FRANCHISE', 'TALUK_FRANCHISE'].includes(recipient.role)) {
        breakdown.franchise += c.commissionAmount;
      } else if (recipient.role === 'SHOPKEEPER') {
        breakdown.shop += c.commissionAmount;
      } else if (c.type === 'MLM_UPLINE_COMMISSION') {
        // Resolve level from buyer's upline path
        const order = await Order.findById(c.orderId).populate('userId');
        if (order && order.userId) {
          const index = order.userId.referralPath.findIndex(id => id.toString() === recipient._id.toString());
          if (index !== -1) {
            const levelNum = index + 1;
            if (levelNum >= 1 && levelNum <= 9) {
              breakdown[`mlmL${levelNum}`] += c.commissionAmount;
            }
          } else {
            // Default to L1 if not resolvable but MLM type
            breakdown.mlmL1 += c.commissionAmount;
          }
        }
      }
    }

    return {
      totalCommissions: total,
      paid,
      pending,
      reversed,
      breakdown
    };
  },

  async getSettlementAnalytics(startDate, endDate) {
    const completed = await VendorWithdrawal.countDocuments({ status: 'APPROVED', createdAt: { $gte: startDate, $lte: endDate } });
    const pending = await VendorWithdrawal.countDocuments({ status: 'PENDING', createdAt: { $gte: startDate, $lte: endDate } });
    const processing = 0; // Interface compatibility
    const failed = await VendorWithdrawal.countDocuments({ status: 'REJECTED', createdAt: { $gte: startDate, $lte: endDate } });

    const totalPaid = await VendorWithdrawal.aggregate([
      { $match: { status: 'APPROVED', createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalComm = await Commission.aggregate([
      { $match: { status: 'PAID', createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: '$commissionAmount' } } }
    ]);

    return {
      completed,
      pending,
      processing,
      failed,
      reversed: 0,
      totalSettlementAmount: totalPaid[0]?.total || 0,
      totalCommissions: totalComm[0]?.total || 0,
      failedSettlements: failed,
      settlementsRequiringAttention: pending
    };
  },

  async getFairCoinAnalytics(startDate, endDate) {
    const creditTypes = ['CREDIT', 'BONUS', 'REFERRAL_REWARD', 'PURCHASE_REWARD', 'SPIN_REWARD', 'ADMIN_ADJUSTMENT'];
    const credits = await CoinTransaction.aggregate([
      { $match: { type: { $in: creditTypes }, createdAt: { $gte: startDate, $lte: endDate }, status: 'COMPLETED' } },
      { $group: {
        _id: '$type',
        total: { $sum: '$amount' }
      }}
    ]);

    const debits = await CoinTransaction.aggregate([
      { $match: { type: { $in: ['DEBIT', 'EXPIRATION'] }, createdAt: { $gte: startDate, $lte: endDate }, status: 'COMPLETED' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const details = {
      coinsIssued: 0,
      coinsRedeemed: debits[0]?.total || 0,
      coinsFromReferrals: 0,
      coinsFromPurchases: 0,
      coinsFromSpin: 0,
      adminCredits: 0,
      adminDebits: 0
    };

    credits.forEach(c => {
      details.coinsIssued += c.total;
      if (c._id === 'REFERRAL_REWARD') details.coinsFromReferrals = c.total;
      else if (c._id === 'PURCHASE_REWARD') details.coinsFromPurchases = c.total;
      else if (c._id === 'SPIN_REWARD') details.coinsFromSpin = c.total;
      else if (c._id === 'ADMIN_ADJUSTMENT') {
        details.adminCredits = c.total;
      }
    });

    const adminDebitsAdjust = await CoinTransaction.aggregate([
      { $match: { type: 'ADMIN_ADJUSTMENT', amount: { $lt: 0 }, createdAt: { $gte: startDate, $lte: endDate }, status: 'COMPLETED' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    details.adminDebits = Math.abs(adminDebitsAdjust[0]?.total || 0);

    return details;
  },

  async getProductAnalytics(startDate, endDate) {
    const total = await Product.countDocuments();
    const approved = await Product.countDocuments({ status: 'APPROVED' });
    const pending = await Product.countDocuments({ status: 'PENDING_APPROVAL' });
    const rejected = await Product.countDocuments({ status: 'REJECTED' });
    const draft = await Product.countDocuments({ status: 'DRAFT' });

    const bestSelling = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate }, paymentStatus: 'PAID' } },
      { $unwind: '$items' },
      { $group: {
        _id: '$items.productId',
        name: { $first: '$items.name' },
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
      }},
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 }
    ]);

    const lowStock = await Product.find({ stock: { $lt: 10 } })
      .limit(10)
      .select('name stock sku');

    return {
      totalProducts: total,
      approved,
      pending,
      rejected,
      draft,
      bestSellingProducts: bestSelling,
      lowStockProducts: lowStock
    };
  },

  async getCouponAnalytics(startDate, endDate) {
    const active = await Coupon.countDocuments({ isActive: true, endDate: { $gt: new Date() } });
    const expired = await Coupon.countDocuments({ $or: [{ isActive: false }, { endDate: { $lte: new Date() } }] });

    const orderStats = await Order.aggregate([
      { $match: { couponCode: { $ne: '' }, paymentStatus: 'PAID', createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: {
        _id: null,
        totalDiscount: { $sum: '$discount' },
        count: { $sum: 1 }
      }}
    ]);

    const topCoupons = await Order.aggregate([
      { $match: { couponCode: { $ne: '' }, paymentStatus: 'PAID', createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$couponCode', usage: { $sum: 1 }, saved: { $sum: '$discount' } } },
      { $sort: { usage: -1 } },
      { $limit: 5 }
    ]);

    return {
      activeCoupons: active,
      expiredCoupons: expired,
      usageCount: orderStats[0]?.count || 0,
      discountValue: orderStats[0]?.totalDiscount || 0,
      topCoupons
    };
  },

  async getCampaignAnalytics(startDate, endDate) {
    const active = await Campaign.countDocuments({ isActive: true, endDate: { $gt: new Date() } });
    const expired = await Campaign.countDocuments({ $or: [{ isActive: false }, { endDate: { $lte: new Date() } }] });

    return {
      activeCampaigns: active,
      expiredCampaigns: expired,
      rewardImpact: 0, // Mock placeholder
      usage: 0 // Mock placeholder
    };
  },

  async getFulfillmentAnalytics(startDate, endDate) {
    const counts = await Fulfillment.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const formatted = {
      pending: 0,
      processing: 0,
      picked: 0,
      packed: 0,
      hubReceived: 0,
      dispatched: 0,
      outForDelivery: 0,
      delivered: 0,
      failed: 0
    };

    counts.forEach(c => {
      if (c._id === 'PENDING') formatted.pending = c.count;
      else if (c._id === 'PROCESSING') formatted.processing = c.count;
      else if (c._id === 'PICKED') formatted.picked = c.count;
      else if (c._id === 'PACKED') formatted.packed = c.count;
      else if (c._id === 'READY_FOR_DISPATCH') formatted.hubReceived = c.count;
      else if (c._id === 'DISPATCHED') formatted.dispatched = c.count;
      else if (c._id === 'OUT_FOR_DELIVERY') formatted.outForDelivery = c.count;
      else if (c._id === 'DELIVERED') formatted.delivered = c.count;
      else if (c._id === 'CANCELLED' || c._id === 'RETURNED') formatted.failed = c.count;
    });

    return formatted;
  },

  async getDeliveryAnalytics(startDate, endDate) {
    const counts = await DeliveryAssignment.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const formatted = {
      assigned: 0,
      accepted: 0,
      pickedUp: 0,
      outForDelivery: 0,
      delivered: 0,
      failed: 0
    };

    let total = 0;
    counts.forEach(c => {
      total += c.count;
      if (c._id === 'ASSIGNED') formatted.assigned = c.count;
      else if (c._id === 'ACCEPTED') formatted.accepted = c.count;
      else if (c._id === 'PICKED_UP') formatted.pickedUp = c.count;
      else if (c._id === 'OUT_FOR_DELIVERY') formatted.outForDelivery = c.count;
      else if (c._id === 'DELIVERED') formatted.delivered = c.count;
      else if (c._id === 'FAILED' || c._id === 'CANCELLED') formatted.failed = c.count;
    });

    const successRate = total > 0 ? Math.round((formatted.delivered / total) * 100) : 0;
    const failureRate = total > 0 ? Math.round((formatted.failed / total) * 100) : 0;

    return {
      ...formatted,
      deliverySuccessRate: successRate,
      failureRate
    };
  },

  // Operational Alerts Engine (Task 20)
  async getOperationalAlerts() {
    const alerts = [];

    // 1. Failed payments
    const failedPayments = await Payment.countDocuments({ status: 'FAILED' });
    if (failedPayments > 0) {
      alerts.push({
        type: 'CRITICAL',
        title: 'Failed Payments Detected',
        message: `${failedPayments} customer payments have failed. Check payment logs.`,
        code: 'FAILED_PAYMENTS'
      });
    }

    // 2. Failed settlements (VendorWithdrawals status is REJECTED)
    const failedSettlements = await VendorWithdrawal.countDocuments({ status: 'REJECTED' });
    if (failedSettlements > 0) {
      alerts.push({
        type: 'CRITICAL',
        title: 'Failed Settlements',
        message: `${failedSettlements} vendor withdrawals are marked as rejected/failed. Payouts require review.`,
        code: 'FAILED_SETTLEMENTS'
      });
    }

    // 3. Pending KYC
    const pendingKyc = await KYCDocument.countDocuments({ status: 'PENDING' });
    if (pendingKyc > 0) {
      alerts.push({
        type: 'WARNING',
        title: 'Pending KYC Document Approvals',
        message: `${pendingKyc} new entity KYC files are pending manual verification.`,
        code: 'PENDING_KYC'
      });
    }

    // 4. Expiring subscriptions (Grace period sync / warnings)
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + 7);
    const expiringSubscriptions = await Subscription.countDocuments({ status: 'ACTIVE', endDate: { $lte: threshold } });
    if (expiringSubscriptions > 0) {
      alerts.push({
        type: 'WARNING',
        title: 'Subscriptions Expiring Soon',
        message: `${expiringSubscriptions} shopkeeper or franchise subscriptions will expire within 7 days.`,
        code: 'EXPIRING_SUBSCRIPTIONS'
      });
    }

    // 5. Low stock
    const lowStock = await Product.countDocuments({ stock: { $lt: 5 } });
    if (lowStock > 0) {
      alerts.push({
        type: 'WARNING',
        title: 'Low Stock Alert',
        message: `${lowStock} products have stock quantities under 5 items.`,
        code: 'LOW_STOCK'
      });
    }

    // 6. Failed deliveries
    const failedDeliveries = await DeliveryAssignment.countDocuments({ status: 'FAILED' });
    if (failedDeliveries > 0) {
      alerts.push({
        type: 'CRITICAL',
        title: 'Failed Deliveries Pending Review',
        message: `${failedDeliveries} package dispatch attempts failed in the field.`,
        code: 'FAILED_DELIVERIES'
      });
    }

    // 7. Pending Vendor approvals
    const pendingVendors = await Vendor.countDocuments({ status: 'PENDING' });
    if (pendingVendors > 0) {
      alerts.push({
        type: 'INFO',
        title: 'Pending Vendor Approvals',
        message: `${pendingVendors} merchant profile requests are pending onboarding review.`,
        code: 'PENDING_VENDORS'
      });
    }

    // 8. Pending product approvals
    const pendingProducts = await Product.countDocuments({ status: 'PENDING_APPROVAL' });
    if (pendingProducts > 0) {
      alerts.push({
        type: 'INFO',
        title: 'Pending Product Approvals',
        message: `${pendingProducts} item catalogs require catalog checks.`,
        code: 'PENDING_PRODUCTS'
      });
    }

    // 9. Pending returns
    const pendingReturns = await ReturnRequest.countDocuments({ status: 'PENDING' });
    if (pendingReturns > 0) {
      alerts.push({
        type: 'INFO',
        title: 'Pending Returns',
        message: `${pendingReturns} purchase return requests are waiting for processing.`,
        code: 'PENDING_RETURNS'
      });
    }

    // Sort by severity (CRITICAL first, then WARNING, then INFO)
    const severityMap = { CRITICAL: 1, WARNING: 2, INFO: 3 };
    return alerts.sort((a, b) => severityMap[a.type] - severityMap[b.type]);
  }
};
