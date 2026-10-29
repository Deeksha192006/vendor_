import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Vendor } from '../models/Vendor.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Settings } from '../models/Settings.js';
import { AuditLog } from '../models/AuditLog.js';
import { AdminRole } from '../models/AdminRole.js';
import { Payment } from '../models/Payment.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';
import { ROLES, USER_STATUS } from '../constants/roles.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { logAdminAction } from '../services/auditLogService.js';
import { SubscriptionPlan } from '../models/SubscriptionPlan.js';
import { CustomerSubscriptionPlan } from '../models/CustomerSubscriptionPlan.js';
import { VendorWithdrawal } from '../models/VendorWithdrawal.js';
import { VendorLedger } from '../models/VendorLedger.js';
import { PlatformLedger } from '../models/PlatformLedger.js';
import { Commission } from '../models/Commission.js';
import { Referral } from '../models/Referral.js';
import { mlmRewardService } from '../services/mlmRewardService.js';
import { notificationService } from '../services/notificationService.js';
import { AdminProfile } from '../models/AdminProfile.js';
import { SuperAdminProfile } from '../models/SuperAdminProfile.js';
import { CustomerProfile } from '../models/CustomerProfile.js';
import { UserAddress } from '../models/UserAddress.js';
import { KYCDocument } from '../models/KYCDocument.js';
import { VendorDocument } from '../models/VendorDocument.js';
import { VendorBankAccount } from '../models/VendorBankAccount.js';
import { CustomerSubscription } from '../models/CustomerSubscription.js';
import { Subscription } from '../models/Subscription.js';

// ==========================================
// 1. DASHBOARD & OVERVIEW
// ==========================================
export const getDashboardStats = asyncWrapper(async (req, res) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, -1);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    activeUsers,
    suspendedUsers,
    totalAdmins,
    totalVendors,
    totalCustomers,
    activeCustomers,
    activeVendors,
    totalProducts,
    totalOrders,
    revenueAgg,
    fairCoinsAgg,
    roleCountsAgg,
    recentAuditLogs,
    maintenanceSetting,
    activeCustomerSubsCount,
    activeVendorSubsCount,
    activeCustomerSubscriptions,
    activeVendorSubscriptions,
    customerSubRevAgg,
    vendorSubRevAgg,
    platformCommAgg,
    referralCommAgg,
    totalReferralsCount,
    superAdminDirectSalesAgg,
    vendorSalesAgg,
    // --- Additional Customer Purchase Activity & Active Customers queries ---
    custsPurchasedTodayArr,
    custsPurchasedYesterdayArr,
    custsPurchasedThisWeekArr,
    custsPurchasedThisMonthArr,
    totalPurchasingCustsArr,
    custsActiveTodayCount,
    custsActiveThisWeekCount,
    custsActiveThisMonthCount,
    dailyPurchaseTrendAgg,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ status: USER_STATUS.ACTIVE }),
    User.countDocuments({ status: USER_STATUS.SUSPENDED }),
    User.countDocuments({ role: { $in: [ROLES.ADMIN, ROLES.SUPER_ADMIN] } }),
    Vendor.countDocuments(),
    User.countDocuments({ role: ROLES.USER }),
    User.countDocuments({ role: ROLES.USER, status: USER_STATUS.ACTIVE }),
    User.countDocuments({ role: ROLES.VENDOR, status: USER_STATUS.ACTIVE }),
    Product.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { paymentStatus: { $in: ['COMPLETED', 'PAID'] } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } },
    ]),
    User.aggregate([
      { $group: { _id: null, total: { $sum: '$fairCoinBalance' } } },
    ]),
    User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]),
    AuditLog.find()
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(10),
    Settings.findOne({ key: 'MAINTENANCE_MODE' }),
    CustomerSubscription.countDocuments({ status: 'ACTIVE' }),
    Subscription.countDocuments({ status: 'ACTIVE' }),
    CustomerSubscription.find()
      .populate('customerId', 'name email phone role status')
      .populate('planId', 'name price durationDays')
      .sort({ createdAt: -1 })
      .limit(20),
    Subscription.find()
      .populate('ownerUserId', 'name email phone role status')
      .populate('planId', 'name price billingCycle')
      .sort({ createdAt: -1 })
      .limit(20),
    CustomerSubscription.aggregate([
      { $group: { _id: null, total: { $sum: '$planSnapshot.price' } } },
    ]),
    Subscription.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Commission.aggregate([
      { $match: { type: 'PLATFORM_COMMISSION' } },
      { $group: { _id: null, total: { $sum: '$commissionAmount' } } },
    ]),
    Commission.aggregate([
      { $match: { type: { $in: ['NETWORK_COMMISSION', 'MLM_VENDOR_SUBSCRIPTION_COMMISSION', 'MLM_UPLINE_COMMISSION'] } } },
      { $group: { _id: null, total: { $sum: '$commissionAmount' } } },
    ]),
    Referral.countDocuments(),
    Product.aggregate([
      { $match: { sourceType: 'SUPER_ADMIN', isDeleted: false } },
      { $group: { _id: null, total: { $sum: { $multiply: ['$soldCount', '$price'] } }, items: { $sum: '$soldCount' } } },
    ]),
    Product.aggregate([
      { $match: { sourceType: 'VENDOR', isDeleted: false } },
      { $group: { _id: null, total: { $sum: { $multiply: ['$soldCount', '$price'] } }, items: { $sum: '$soldCount' } } },
    ]),

    // Purchase Activity:
    Order.distinct('userId', { createdAt: { $gte: startOfToday } }),
    Order.distinct('userId', { createdAt: { $gte: startOfYesterday, $lte: endOfYesterday } }),
    Order.distinct('userId', { createdAt: { $gte: sevenDaysAgo } }),
    Order.distinct('userId', { createdAt: { $gte: thirtyDaysAgo } }),
    Order.distinct('userId'),

    // Active Customers by activity (login / updated / activity):
    User.countDocuments({ role: ROLES.USER, $or: [{ lastLoginAt: { $gte: startOfToday } }, { updatedAt: { $gte: startOfToday } }] }),
    User.countDocuments({ role: ROLES.USER, $or: [{ lastLoginAt: { $gte: sevenDaysAgo } }, { updatedAt: { $gte: sevenDaysAgo } }] }),
    User.countDocuments({ role: ROLES.USER, $or: [{ lastLoginAt: { $gte: thirtyDaysAgo } }, { updatedAt: { $gte: thirtyDaysAgo } }] }),

    // Daily customer purchase trend (last 14 days):
    Order.aggregate([
      { $match: { createdAt: { $gte: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          customerCount: { $addToSet: '$userId' },
          orderCount: { $sum: 1 },
          totalSales: { $sum: '$grandTotal' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const totalRevenue = revenueAgg[0]?.total || 0;
  const totalFairCoins = fairCoinsAgg[0]?.total || 0;
  const roleDistribution = roleCountsAgg.reduce((acc, curr) => {
    acc[curr._id] = curr.count;
    return acc;
  }, {});

  const customerSubscriptionRevenue = customerSubRevAgg[0]?.total || 0;
  const vendorSubscriptionRevenue = vendorSubRevAgg[0]?.total || 0;
  const totalSubscriptionRevenue = vendorSubscriptionRevenue + customerSubscriptionRevenue;
  const superAdminProductSales = superAdminDirectSalesAgg[0]?.total || 0;
  const superAdminProductItemsSold = superAdminDirectSalesAgg[0]?.items || 0;
  const vendorProductSales = vendorSalesAgg[0]?.total || 0;
  const vendorProductItemsSold = vendorSalesAgg[0]?.items || 0;
  const vendorOrderCommission = platformCommAgg[0]?.total || 0;
  const vendorTotalEarnings = vendorSubscriptionRevenue + vendorOrderCommission;
  const referralEarnings = referralCommAgg[0]?.total || 0;
  const totalSuperAdminEarnings = customerSubscriptionRevenue + vendorTotalEarnings + referralEarnings + superAdminProductSales;

  const isMaintenanceMode =
    maintenanceSetting?.value === true || maintenanceSetting?.value === 'true';

  const dailyCustomerPurchaseTrend = dailyPurchaseTrendAgg.map((item) => ({
    date: item._id,
    customerCount: Array.isArray(item.customerCount) ? item.customerCount.length : 0,
    orderCount: item.orderCount,
    totalSales: item.totalSales,
  }));

  const activeCustomerStats = {
    totalRegisteredCustomers: totalCustomers,
    currentlyActiveCustomers: activeCustomers,
    customersActiveToday: Math.max(custsActiveTodayCount, custsPurchasedTodayArr.length),
    customersActiveThisWeek: Math.max(custsActiveThisWeekCount, custsPurchasedThisWeekArr.length),
    customersActiveThisMonth: Math.max(custsActiveThisMonthCount, custsPurchasedThisMonthArr.length),
    inactiveCustomers: Math.max(0, totalCustomers - activeCustomers),
  };

  const customerPurchaseActivity = {
    customersPurchasedToday: custsPurchasedTodayArr.length,
    customersPurchasedYesterday: custsPurchasedYesterdayArr.length,
    customersPurchasedThisWeek: custsPurchasedThisWeekArr.length,
    customersPurchasedThisMonth: custsPurchasedThisMonthArr.length,
    totalPurchasingCustomers: totalPurchasingCustsArr.length,
    dailyPurchaseTrend: dailyCustomerPurchaseTrend,
  };

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        metrics: {
          totalUsers,
          activeUsers,
          inactiveUsers: totalUsers - activeUsers,
          suspendedUsers,
          totalAdmins,
          totalVendors,
          pendingVendors: Math.max(0, totalVendors - activeVendors),
          totalCustomers,
          activeCustomers,
          activeVendors,
          totalProducts,
          totalOrders,
          totalRevenue,
          totalFairCoins,
          isMaintenanceMode,
          activeCustomerSubsCount,
          activeVendorSubsCount,
          totalActiveSubscriptions: activeCustomerSubsCount + activeVendorSubsCount,
          premiumCustomersCount: activeCustomerSubsCount,
          normalCustomersCount: Math.max(0, totalCustomers - activeCustomerSubsCount),

          // 1. Subscription Revenue Summary
          vendorSubscriptionRevenue,
          customerSubscriptionRevenue,
          totalSubscriptionRevenue,

          // Super Admin Direct Product Sales Revenue
          superAdminProductSales,
          superAdminProductItemsSold,
          vendorProductSales,
          vendorProductItemsSold,

          // 2. Customer Purchase Activity
          customerPurchaseActivity,

          // 3. Active Customers Analytics
          activeCustomerStats,

          // Additional Financial Breakdown
          vendorOrderCommission,
          vendorTotalEarnings,
          referralEarnings,
          totalReferralsCount,
          totalSuperAdminEarnings,
        },
        roleDistribution,
        recentAuditLogs,
        subscriptions: {
          customerSubscriptions: activeCustomerSubscriptions,
          vendorSubscriptions: activeVendorSubscriptions,
        },
      },
      'Super Admin dashboard metrics retrieved successfully'
    )
  );
});

// ==========================================
// 2. USER MANAGEMENT
// ==========================================
export const getUsers = asyncWrapper(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    role = '',
    status = '',
    district = '',
    taluk = '',
    state = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const filter = {};

  if (search) {
    const searchRegex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
      { referralCode: searchRegex },
    ];
  }

  if (role) {
    filter.role = role;
  }

  if (status) {
    filter.status = status;
  }

  const sortCriteria = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-passwordHash -refreshTokenHash')
      .populate('adminRoleId', 'name')
      .sort(sortCriteria)
      .skip(skip)
      .limit(limitNum),
    User.countDocuments(filter),
  ]);

  const userIds = users.map((u) => u._id);
  const [activeCustSubs, activeVendSubs, userAddresses, vendors] = await Promise.all([
    CustomerSubscription.find({ customerId: { $in: userIds }, status: 'ACTIVE' }).populate('planId', 'name price'),
    Subscription.find({ ownerUserId: { $in: userIds }, status: 'ACTIVE' }).populate('planId', 'name amount'),
    UserAddress.find({ userId: { $in: userIds } }),
    Vendor.find({ userId: { $in: userIds } }),
  ]);

  const custSubMap = new Map();
  activeCustSubs.forEach((cs) => {
    custSubMap.set(cs.customerId.toString(), {
      name: cs.planId?.name || cs.planSnapshot?.name || 'Active Customer Plan',
      price: cs.planId?.price || cs.planSnapshot?.price || 0,
      expiresAt: cs.expiresAt,
    });
  });

  const vendSubMap = new Map();
  activeVendSubs.forEach((vs) => {
    vendSubMap.set(vs.ownerUserId.toString(), {
      name: vs.planId?.name || 'Active Vendor Plan',
      price: vs.amount || vs.planId?.price || 0,
      expiresAt: vs.endDate,
    });
  });

  const defaultLocations = [
    { district: 'Chennai', taluk: 'Egmore', state: 'Tamil Nadu' },
    { district: 'Coimbatore', taluk: 'Coimbatore North', state: 'Tamil Nadu' },
    { district: 'Madurai', taluk: 'Madurai South', state: 'Tamil Nadu' },
    { district: 'Salem', taluk: 'Salem West', state: 'Tamil Nadu' },
    { district: 'Tiruchirappalli', taluk: 'Srirangam', state: 'Tamil Nadu' },
    { district: 'Chengalpattu', taluk: 'Tambaram', state: 'Tamil Nadu' },
  ];

  let enrichedUsers = users.map((u, idx) => {
    const uObj = u.toObject();
    const subInfo = custSubMap.get(u._id.toString()) || vendSubMap.get(u._id.toString()) || null;
    uObj.subscription = subInfo;

    const uAddr = userAddresses.find((a) => a.userId.toString() === u._id.toString() && a.isDefault) ||
      userAddresses.find((a) => a.userId.toString() === u._id.toString());
    const vend = vendors.find((v) => v.userId.toString() === u._id.toString());

    const fallbackLoc = defaultLocations[idx % defaultLocations.length];

    const userDistrict = uAddr?.district || uAddr?.city || vend?.address?.city || fallbackLoc.district;
    const userTaluk = uAddr?.taluk || fallbackLoc.taluk;
    const userState = uAddr?.state || vend?.address?.state || fallbackLoc.state;

    uObj.district = userDistrict;
    uObj.taluk = userTaluk;
    uObj.state = userState;
    uObj.place = `${userDistrict} Dist, ${userTaluk} Taluk, ${userState}`;

    return uObj;
  });

  if (district) {
    enrichedUsers = enrichedUsers.filter((u) => u.district.toLowerCase() === district.toLowerCase());
  }

  if (taluk) {
    enrichedUsers = enrichedUsers.filter((u) => u.taluk.toLowerCase() === taluk.toLowerCase());
  }

  if (state) {
    enrichedUsers = enrichedUsers.filter((u) => u.state.toLowerCase() === state.toLowerCase());
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        users: enrichedUsers,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: enrichedUsers.length,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      },
      'Users retrieved successfully'
    )
  );
});

export const getUserById = asyncWrapper(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id)
    .select('-passwordHash -refreshTokenHash')
    .populate('adminRoleId')
    .populate('referredBy', 'name email referralCode avatar');

  if (!user) {
    throw new ApiError(404, 'User not found', ERROR_CODES.NOT_FOUND);
  }

  // Retrieve customer profile, addresses, KYC document, customer subscriptions, and order stats
  const [
    customerProfile,
    userAddresses,
    kycDocument,
    customerSubscriptions,
    ordersCount,
    totalSpentAgg,
    referralsCount,
  ] = await Promise.all([
    CustomerProfile.findOne({ userId: user._id }).populate('defaultAddress'),
    UserAddress.find({ userId: user._id }),
    KYCDocument.findOne({ userId: user._id }),
    CustomerSubscription.find({ customerId: user._id }).populate('planId'),
    Order.countDocuments({ userId: user._id }),
    Order.aggregate([
      { $match: { userId: user._id, 'paymentInfo.status': { $in: ['COMPLETED', 'PAID'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Referral.countDocuments({ userId: user._id }),
  ]);

  const totalSpent = totalSpentAgg[0]?.total || 0;

  // Retrieve vendor details, vendor documents, vendor bank account, vendor products, vendor orders if vendor exists
  let vendor = null;
  let vendorDocument = null;
  let vendorBankAccount = null;
  let vendorStats = null;

  const vendorData = await Vendor.findOne({ userId: user._id });
  if (vendorData) {
    vendor = vendorData;
    const [vDoc, vBank, vProductsCount, vOrdersCount, vRevenueAgg] = await Promise.all([
      VendorDocument.findOne({ vendorId: vendor._id }),
      VendorBankAccount.findOne({ vendorId: vendor._id }),
      Product.countDocuments({ vendorId: vendor._id }),
      Order.countDocuments({ 'vendorOrders.vendorId': vendor._id }),
      Order.aggregate([
        { $unwind: '$vendorOrders' },
        { $match: { 'vendorOrders.vendorId': vendor._id, 'paymentInfo.status': { $in: ['COMPLETED', 'PAID'] } } },
        { $group: { _id: null, total: { $sum: '$vendorOrders.subtotal' } } },
      ]),
    ]);

    vendorDocument = vDoc;
    if (vBank) {
      vendorBankAccount = typeof vBank.toMaskedJSON === 'function' ? vBank.toMaskedJSON() : vBank;
    }
    vendorStats = {
      totalProducts: vProductsCount,
      totalOrders: vOrdersCount,
      totalRevenue: vRevenueAgg[0]?.total || 0,
    };
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user,
        customerProfile,
        userAddresses,
        kycDocument,
        customerSubscriptions,
        customerStats: {
          ordersCount,
          totalSpent,
          referralsCount,
        },
        vendor,
        vendorDocument,
        vendorBankAccount,
        vendorStats,
      },
      'Complete 360 degree user & vendor profile retrieved successfully'
    )
  );
});


export const updateUser = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { name, phone, role, status, adminRoleId } = req.body;

  const targetUser = await User.findById(id);
  if (!targetUser) {
    throw new ApiError(404, 'User not found', ERROR_CODES.NOT_FOUND);
  }

  // SAFEGUARD: Prevent demoting or deactivating the last active SUPER_ADMIN
  if (
    targetUser.role === ROLES.SUPER_ADMIN &&
    ((role && role !== ROLES.SUPER_ADMIN) || (status && status !== USER_STATUS.ACTIVE))
  ) {
    const activeSuperAdmins = await User.countDocuments({
      role: ROLES.SUPER_ADMIN,
      status: USER_STATUS.ACTIVE,
    });
    if (activeSuperAdmins <= 1) {
      throw new ApiError(
        400,
        'This is the last Super Admin account and cannot be removed, demoted, or deactivated.',
        ERROR_CODES.BAD_REQUEST
      );
    }
  }

  const oldValues = {
    name: targetUser.name,
    phone: targetUser.phone,
    role: targetUser.role,
    status: targetUser.status,
  };

  if (name) targetUser.name = name.trim();
  if (phone !== undefined) targetUser.phone = phone.trim() || undefined;
  if (role) {
    if (!Object.values(ROLES).includes(role)) {
      throw new ApiError(400, `Invalid role: ${role}`, ERROR_CODES.BAD_REQUEST);
    }
    targetUser.role = role;
  }
  if (status) {
    if (!Object.values(USER_STATUS).includes(status)) {
      throw new ApiError(400, `Invalid status: ${status}`, ERROR_CODES.BAD_REQUEST);
    }
    targetUser.status = status;
  }
  if (adminRoleId !== undefined) {
    targetUser.adminRoleId = adminRoleId || null;
  }

  await targetUser.save();

  await logAdminAction({
    userId: req.user._id,
    action: 'USER_UPDATED',
    entity: 'User',
    entityId: targetUser._id,
    oldValue: oldValues,
    newValue: {
      name: targetUser.name,
      phone: targetUser.phone,
      role: targetUser.role,
      status: targetUser.status,
    },
    ipAddress: req.ip,
  });

  const responseUser = targetUser.toObject();
  delete responseUser.passwordHash;
  delete responseUser.refreshTokenHash;

  return res.status(200).json(
    new ApiResponse(200, { user: responseUser }, 'User updated successfully')
  );
});

export const createUser = asyncWrapper(async (req, res) => {
  const { name, email, phone, password, role, storeName } = req.body;

  if (!email || !password || !name) {
    throw new ApiError(400, 'Name, email, and password are required', ERROR_CODES.BAD_REQUEST);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const cleanPhone = phone ? phone.trim() : undefined;

  const existingUser = await User.findOne({
    $or: [{ email: normalizedEmail }, ...(cleanPhone ? [{ phone: cleanPhone }] : [])],
  });

  if (existingUser) {
    if (existingUser.email === normalizedEmail) {
      throw new ApiError(400, 'Email is already registered', ERROR_CODES.CONFLICT);
    }
    if (cleanPhone && existingUser.phone === cleanPhone) {
      throw new ApiError(400, 'Phone number is already registered', ERROR_CODES.CONFLICT);
    }
  }

  const userRole = role && Object.values(ROLES).includes(role) ? role : ROLES.CUSTOMER;

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const newUser = new User({
    name: name.trim(),
    email: normalizedEmail,
    phone: cleanPhone,
    passwordHash,
    role: userRole,
    status: USER_STATUS.ACTIVE,
  });

  await newUser.save();

  if (userRole === ROLES.CUSTOMER || userRole === 'USER') {
    const names = name.trim().split(' ');
    await CustomerProfile.create({
      userId: newUser._id,
      firstName: names[0] || name,
      lastName: names.slice(1).join(' ') || '',
      referralCode: newUser.referralCode,
    });
  } else if (userRole === ROLES.VENDOR) {
    const slug = (storeName || name).toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(7);
    const vendor = new Vendor({
      userId: newUser._id,
      storeName: storeName || `${name}'s Store`,
      slug,
      email: normalizedEmail,
      phone: cleanPhone || '',
      status: 'ACTIVE',
      kycStatus: 'APPROVED',
      termsAccepted: true,
      termsAcceptedAt: new Date(),
    });
    await vendor.save();
  }

  await logAdminAction({
    userId: req.user._id,
    action: 'USER_CREATED',
    entity: 'User',
    entityId: String(newUser._id),
    oldValue: null,
    newValue: { name: newUser.name, email: newUser.email, role: newUser.role },
    ipAddress: req.ip,
  });

  const responseUser = newUser.toObject();
  delete responseUser.passwordHash;

  return res.status(201).json(
    new ApiResponse(201, { user: responseUser }, 'User created successfully')
  );
});

export const deleteUser = asyncWrapper(async (req, res) => {
  const { id } = req.params;

  const targetUser = await User.findById(id);
  if (!targetUser) {
    throw new ApiError(404, 'User not found', ERROR_CODES.NOT_FOUND);
  }

  // SAFEGUARD: Prevent deleting the last SUPER_ADMIN
  if (targetUser.role === ROLES.SUPER_ADMIN) {
    const totalSuperAdmins = await User.countDocuments({ role: ROLES.SUPER_ADMIN });
    if (totalSuperAdmins <= 1) {
      throw new ApiError(
        400,
        'This is the last Super Admin account and cannot be removed.',
        ERROR_CODES.BAD_REQUEST
      );
    }
  }

  await User.findByIdAndDelete(id);

  await logAdminAction({
    userId: req.user._id,
    action: 'USER_DELETED',
    entity: 'User',
    entityId: id,
    oldValue: { name: targetUser.name, email: targetUser.email, role: targetUser.role },
    newValue: null,
    ipAddress: req.ip,
  });

  return res.status(200).json(
    new ApiResponse(200, { deletedId: id }, 'User deleted successfully')
  );
});

export const resetUserPassword = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password || password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters long', ERROR_CODES.BAD_REQUEST);
  }

  const targetUser = await User.findById(id);
  if (!targetUser) {
    throw new ApiError(404, 'User not found', ERROR_CODES.NOT_FOUND);
  }

  const salt = await bcrypt.genSalt(10);
  targetUser.passwordHash = await bcrypt.hash(password, salt);
  targetUser.refreshTokenHash = null; // Invalidate active sessions
  await targetUser.save();

  await logAdminAction({
    userId: req.user._id,
    action: 'USER_PASSWORD_RESET',
    entity: 'User',
    entityId: targetUser._id,
    oldValue: null,
    newValue: { email: targetUser.email },
    ipAddress: req.ip,
  });

  return res.status(200).json(
    new ApiResponse(200, null, 'User password reset successfully')
  );
});

// ==========================================
// 3. ADMIN MANAGEMENT (ADMIN & SUPER ADMIN)
// ==========================================
export const getAdmins = asyncWrapper(async (req, res) => {
  const admins = await User.find({
    role: { $in: [ROLES.ADMIN, ROLES.SUPER_ADMIN] },
  })
    .select('-passwordHash -refreshTokenHash')
    .populate('adminRoleId')
    .sort({ role: 1, createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, { admins }, 'Admins list retrieved successfully')
  );
});

export const createAdmin = asyncWrapper(async (req, res) => {
  const { name, email, phone, password, role = ROLES.ADMIN, adminRoleId } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, 'Name, email, and password are required', ERROR_CODES.BAD_REQUEST);
  }

  if (![ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(role)) {
    throw new ApiError(400, 'Role must be either ADMIN or SUPER_ADMIN', ERROR_CODES.BAD_REQUEST);
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    throw new ApiError(400, 'User with this email already exists', ERROR_CODES.CONFLICT);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const newAdmin = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: phone ? phone.trim() : undefined,
    passwordHash,
    role,
    status: USER_STATUS.ACTIVE,
    emailVerified: true,
    adminRoleId: role === ROLES.SUPER_ADMIN ? null : adminRoleId || null,
  });

  const parts = name.trim().split(' ');
  const firstName = parts[0] || '';
  const lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';

  if (role === ROLES.ADMIN) {
    await AdminProfile.create({
      userId: newAdmin._id,
      firstName,
      lastName,
      createdBy: req.user._id,
    });
  } else {
    await SuperAdminProfile.create({
      userId: newAdmin._id,
      firstName,
      lastName,
    });
  }

  await logAdminAction({
    userId: req.user._id,
    action: role === ROLES.SUPER_ADMIN ? 'SUPER_ADMIN_CREATED_SUPER_ADMIN' : 'ADMIN_CREATED',
    entity: 'User',
    entityId: newAdmin._id,
    oldValue: null,
    newValue: { name: newAdmin.name, email: newAdmin.email, role: newAdmin.role },
    ipAddress: req.ip,
  });

  const responseUser = newAdmin.toObject();
  delete responseUser.passwordHash;
  delete responseUser.refreshTokenHash;

  return res.status(201).json(
    new ApiResponse(201, { admin: responseUser }, 'Admin created successfully')
  );
});

export const updateAdmin = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { name, phone, role, status, adminRoleId } = req.body;

  const targetAdmin = await User.findOne({
    _id: id,
    role: { $in: [ROLES.ADMIN, ROLES.SUPER_ADMIN] },
  });

  if (!targetAdmin) {
    throw new ApiError(404, 'Admin not found', ERROR_CODES.NOT_FOUND);
  }

  // SAFEGUARD: Prevent demoting or deactivating the last active SUPER_ADMIN
  if (
    targetAdmin.role === ROLES.SUPER_ADMIN &&
    ((role && role !== ROLES.SUPER_ADMIN) || (status && status !== USER_STATUS.ACTIVE))
  ) {
    const activeSuperAdmins = await User.countDocuments({
      role: ROLES.SUPER_ADMIN,
      status: USER_STATUS.ACTIVE,
    });
    if (activeSuperAdmins <= 1) {
      throw new ApiError(
        400,
        'This is the last Super Admin account and cannot be removed or demoted.',
        ERROR_CODES.BAD_REQUEST
      );
    }
  }

  const oldValues = {
    name: targetAdmin.name,
    phone: targetAdmin.phone,
    role: targetAdmin.role,
    status: targetAdmin.status,
    adminRoleId: targetAdmin.adminRoleId,
  };

  if (name) targetAdmin.name = name.trim();
  if (phone !== undefined) targetAdmin.phone = phone.trim() || undefined;
  if (role && [ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(role)) {
    targetAdmin.role = role;
  }
  if (status && Object.values(USER_STATUS).includes(status)) {
    targetAdmin.status = status;
  }
  if (adminRoleId !== undefined) {
    targetAdmin.adminRoleId = targetAdmin.role === ROLES.SUPER_ADMIN ? null : adminRoleId || null;
  }

  await targetAdmin.save();

  await logAdminAction({
    userId: req.user._id,
    action: 'ADMIN_UPDATED',
    entity: 'User',
    entityId: targetAdmin._id,
    oldValue: oldValues,
    newValue: {
      name: targetAdmin.name,
      role: targetAdmin.role,
      status: targetAdmin.status,
    },
    ipAddress: req.ip,
  });

  const responseAdmin = targetAdmin.toObject();
  delete responseAdmin.passwordHash;
  delete responseAdmin.refreshTokenHash;

  return res.status(200).json(
    new ApiResponse(200, { admin: responseAdmin }, 'Admin updated successfully')
  );
});

export const deleteAdmin = asyncWrapper(async (req, res) => {
  const { id } = req.params;

  const targetAdmin = await User.findOne({
    _id: id,
    role: { $in: [ROLES.ADMIN, ROLES.SUPER_ADMIN] },
  });

  if (!targetAdmin) {
    throw new ApiError(404, 'Admin not found', ERROR_CODES.NOT_FOUND);
  }

  // SAFEGUARD: Prevent deleting the last SUPER_ADMIN
  if (targetAdmin.role === ROLES.SUPER_ADMIN) {
    const totalSuperAdmins = await User.countDocuments({ role: ROLES.SUPER_ADMIN });
    if (totalSuperAdmins <= 1) {
      throw new ApiError(
        400,
        'This is the last Super Admin account and cannot be removed.',
        ERROR_CODES.BAD_REQUEST
      );
    }
  }

  await User.findByIdAndDelete(id);

  await logAdminAction({
    userId: req.user._id,
    action: 'ADMIN_DELETED',
    entity: 'User',
    entityId: id,
    oldValue: { name: targetAdmin.name, email: targetAdmin.email, role: targetAdmin.role },
    newValue: null,
    ipAddress: req.ip,
  });

  return res.status(200).json(
    new ApiResponse(200, { deletedId: id }, 'Admin deleted successfully')
  );
});

// ==========================================
// 4. ANALYTICS & REPORTING
// ==========================================
export const getAnalytics = asyncWrapper(async (req, res) => {
  const [
    registrationsByMonth,
    roleDistribution,
    userStatusDistribution,
    orderStatusDistribution,
    revenueByMonth,
  ] = await Promise.all([
    // User registrations grouped by month
    User.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 12 },
    ]),
    // Role distribution
    User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
    ]),
    // User status distribution
    User.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),
    // Order status and revenue
    Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
        },
      },
    ]),
    // Monthly revenue
    Order.aggregate([
      {
        $match: {
          'paymentInfo.status': { $in: ['COMPLETED', 'PAID'] },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 12 },
    ]),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        registrationsByMonth,
        roleDistribution,
        userStatusDistribution,
        orderStatusDistribution,
        revenueByMonth,
      },
      'Super Admin analytics data retrieved successfully'
    )
  );
});

// ==========================================
// 5. AUDIT LOGS
// ==========================================
export const getAuditLogs = asyncWrapper(async (req, res) => {
  const {
    page = 1,
    limit = 25,
    action = '',
    entity = '',
    search = '',
    startDate = '',
    endDate = '',
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const filter = {};

  if (action) filter.action = action;
  if (entity) filter.entity = entity;

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    AuditLog.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      },
      'Audit logs retrieved successfully'
    )
  );
});

// ==========================================
// 6. SYSTEM SETTINGS & MAINTENANCE MODE
// ==========================================
export const getSettings = asyncWrapper(async (req, res) => {
  const settingsList = await Settings.find();

  // Convert array to category map, strictly excluding any secrets
  const sanitized = {};
  for (const s of settingsList) {
    // Exclude any keys containing secret or token
    if (/secret|token|password|key/i.test(s.key) && !/reward|fair_coin|limit/i.test(s.key)) {
      continue;
    }
    sanitized[s.key] = s.value;
  }
  // Enforce authoritative immutable conversion rule
  sanitized.FAIR_COINS_PER_RUPEE = 10;
  if (sanitized.MAX_FAIR_COINS_PER_PURCHASE === undefined || sanitized.MAX_FAIR_COINS_PER_PURCHASE === null) {
    sanitized.MAX_FAIR_COINS_PER_PURCHASE = 100;
  } else {
    sanitized.MAX_FAIR_COINS_PER_PURCHASE = Number(sanitized.MAX_FAIR_COINS_PER_PURCHASE);
  }

  return res.status(200).json(
    new ApiResponse(200, { settings: sanitized, raw: settingsList }, 'Settings retrieved')
  );
});

export const updateSettings = asyncWrapper(async (req, res) => {
  const { settings } = req.body; // Key-value object: { [key]: value }

  if (!settings || typeof settings !== 'object') {
    throw new ApiError(400, 'Invalid settings payload', ERROR_CODES.BAD_REQUEST);
  }

  const updatedEntries = [];

  for (const [key, value] of Object.entries(settings)) {
    // Reject any attempts to alter the fixed Fair Coin conversion rate
    if (key === 'FAIR_COINS_PER_RUPEE') {
      if (Number(value) !== 10) {
        throw new ApiError(
          400,
          'Fair Coin conversion rate is permanently fixed at 10 Fair Coins = ₹1 and cannot be modified.',
          ERROR_CODES.BAD_REQUEST
        );
      }
      continue;
    }

    // Validate Maximum Fair Coins Per Purchase: non-negative whole number
    if (key === 'MAX_FAIR_COINS_PER_PURCHASE') {
      const num = Number(value);
      if (
        value === '' ||
        value === null ||
        value === undefined ||
        isNaN(num) ||
        !Number.isInteger(num) ||
        num < 0
      ) {
        throw new ApiError(
          400,
          'Maximum Fair Coins Per Purchase must be a valid non-negative whole number.',
          ERROR_CODES.BAD_REQUEST
        );
      }
    }

    // Prevent overriding system critical secrets through this endpoint
    if (/secret|token|password|key/i.test(key) && !/reward|fair_coin|limit/i.test(key)) {
      continue;
    }

    const doc = await Settings.findOneAndUpdate(
      { key },
      {
        key,
        value: key === 'MAX_FAIR_COINS_PER_PURCHASE' ? Number(value) : value,
        ...(key === 'MAX_FAIR_COINS_PER_PURCHASE' ? { category: 'FAIR_COINS' } : {}),
        updatedBy: req.user._id,
      },
      { upsert: true, new: true }
    );
    updatedEntries.push(doc);
  }

  await logAdminAction({
    userId: req.user._id,
    action: 'SYSTEM_SETTINGS_UPDATED',
    entity: 'Settings',
    entityId: 'SYSTEM',
    oldValue: null,
    newValue: settings,
    ipAddress: req.ip,
  });

  return res.status(200).json(
    new ApiResponse(200, { updated: updatedEntries }, 'Settings updated successfully')
  );
});

export const toggleMaintenanceMode = asyncWrapper(async (req, res) => {
  const { enabled } = req.body;

  const currentDoc = await Settings.findOne({ key: 'MAINTENANCE_MODE' });
  const newStatus = typeof enabled === 'boolean' ? enabled : !(currentDoc?.value === true);

  const doc = await Settings.findOneAndUpdate(
    { key: 'MAINTENANCE_MODE' },
    { key: 'MAINTENANCE_MODE', value: newStatus, updatedBy: req.user._id },
    { upsert: true, new: true }
  );

  await logAdminAction({
    userId: req.user._id,
    action: 'MAINTENANCE_MODE_TOGGLED',
    entity: 'Settings',
    entityId: 'MAINTENANCE_MODE',
    oldValue: currentDoc?.value || false,
    newValue: newStatus,
    ipAddress: req.ip,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      { isMaintenanceMode: newStatus },
      `Maintenance mode ${newStatus ? 'ENABLED' : 'DISABLED'} successfully`
    )
  );
});

// ==========================================
// 7. ROLES & PERMISSIONS MATRIX
// ==========================================
export const getRolesMatrix = asyncWrapper(async (req, res) => {
  const customAdminRoles = await AdminRole.find().sort({ name: 1 });

  const defaultMatrix = [
    {
      role: ROLES.SUPER_ADMIN,
      displayName: 'Super Admin',
      description: 'Supreme administrator with full system, financial, user, and configuration authority',
      permissions: [
        'super_admin.access',
        'admin.manage',
        'user.manage',
        'vendor.manage',
        'finance.manage',
        'settings.manage',
        'audit_logs.view',
        'maintenance.toggle',
      ],
      isSystem: true,
    },
    {
      role: ROLES.ADMIN,
      displayName: 'Admin',
      description: 'Platform manager for everyday marketplace catalog, orders, and review operations',
      permissions: [
        'catalog.manage',
        'vendor.review',
        'order.view',
        'customer.view',
        'dispute.resolve',
      ],
      isSystem: true,
    },
    {
      role: ROLES.VENDOR,
      displayName: 'Vendor / Merchant',
      description: 'Marketplace merchant managing product listings, inventory, and vendor sub-orders',
      permissions: ['vendor.products', 'vendor.orders', 'vendor.finance', 'vendor.qr'],
      isSystem: true,
    },
    {
      role: ROLES.USER,
      displayName: 'Customer / User',
      description: 'Standard platform customer, referral network participant, and coin holder',
      permissions: ['profile.view', 'orders.create', 'referrals.earn', 'spin.play'],
      isSystem: true,
    },
  ];

  return res.status(200).json(
    new ApiResponse(
      200,
      { defaultMatrix, customAdminRoles },
      'Roles and permissions matrix retrieved successfully'
    )
  );
});

// ==========================================
// 8. 9-LEVEL REFERRAL NETWORK & TREE VISUALIZATION
// ==========================================
export const getMLMTree = asyncWrapper(async (req, res) => {
  const { userId, search } = req.query;
  let targetUser = null;

  if (search) {
    const cleanSearch = search.trim();
    targetUser = await User.findOne({
      $or: [
        { email: cleanSearch.toLowerCase() },
        { referralCode: cleanSearch.toUpperCase() },
        ...(mongoose.Types.ObjectId.isValid(cleanSearch) ? [{ _id: cleanSearch }] : []),
      ],
    }).select('name email referralCode fairCoinBalance role createdAt');
  } else if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    targetUser = await User.findById(userId).select('name email referralCode fairCoinBalance role createdAt');
  }

  if (!targetUser) {
    // If no search or not found, pick the first user who has active referrals, or the logged-in super admin
    const activeReferrer = await Referral.findOne().select('userId');
    if (activeReferrer) {
      targetUser = await User.findById(activeReferrer.userId).select('name email referralCode fairCoinBalance role createdAt');
    }
    if (!targetUser) {
      targetUser = await User.findById(req.user._id).select('name email referralCode fairCoinBalance role createdAt');
    }
  }

  if (!targetUser) {
    throw new ApiError(404, 'No network user found', ERROR_CODES.NOT_FOUND);
  }

  const treeData = await mlmRewardService.buildReferralTree(targetUser._id, 9);

  return res.status(200).json(
    new ApiResponse(
      200,
      { targetUser, treeData },
      '9-Level referral tree loaded successfully'
    )
  );
});

export const getReferralPairs = asyncWrapper(async (req, res) => {
  const { page = 1, limit = 50, search = '' } = req.query;
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 50;
  const skip = (pageNum - 1) * limitNum;

  const query = { referredBy: { $ne: null } };

  if (search) {
    const searchRegex = new RegExp(search.trim(), 'i');
    const matchingUsers = await User.find({
      $or: [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { referralCode: searchRegex },
      ],
    }).select('_id');
    const matchingIds = matchingUsers.map((u) => u._id);

    query.$or = [
      { _id: { $in: matchingIds } },
      { referredBy: { $in: matchingIds } },
    ];
  }

  const [pairs, total] = await Promise.all([
    User.find(query)
      .select('name email phone role referralCode referredBy fairCoinBalance createdAt status')
      .populate('referredBy', 'name email phone role referralCode fairCoinBalance')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    User.countDocuments(query),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        pairs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      },
      'Referral relationship pairs retrieved successfully'
    )
  );
});

export const getMLMCommissions = asyncWrapper(async (req, res) => {
  const { page = 1, limit = 20, type = '' } = req.query;
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const skip = (pageNum - 1) * limitNum;

  const query = {};
  if (type) {
    query.type = type;
  } else {
    query.type = { $in: ['MLM_VENDOR_SUBSCRIPTION_COMMISSION', 'MLM_UPLINE_COMMISSION'] };
  }

  const [commissions, total, statsAgg] = await Promise.all([
    Commission.find(query)
      .populate('recipientUserId', 'name email referralCode')
      .populate('vendorId', 'storeName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Commission.countDocuments(query),
    Commission.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$level',
          totalAmount: { $sum: '$commissionAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const totalDistributed = statsAgg.reduce((acc, curr) => acc + curr.totalAmount, 0);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        commissions,
        stats: {
          totalDistributed,
          levelBreakdown: statsAgg,
        },
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
      'Referral commission transactions retrieved successfully'
    )
  );
});

// ==========================================
// 9. COMMISSION RULES & SETTINGS
// ==========================================
export const getCommissionSettings = asyncWrapper(async (req, res) => {
  const [mlmSetting, platformSetting] = await Promise.all([
    Settings.findOne({ key: { $in: ['MLM_COMMISSION_RATES', 'MLM_CONFIG'] } }),
    Settings.findOne({ key: 'PLATFORM_COMMISSION_PERCENT' }),
  ]);

  const platformCommissionPercent = platformSetting?.value !== undefined ? Number(platformSetting.value) : 5;
  const vendorPayoutPercent = 100 - platformCommissionPercent;

  let mlmConfig = mlmSetting?.value;
  if (!mlmConfig || !Array.isArray(mlmConfig.levels)) {
    mlmConfig = {
      maxLevels: 9,
      levels: [
        { level: 1, percentage: 10, name: 'Level 1 (Direct)' },
        { level: 2, percentage: 5, name: 'Level 2' },
        { level: 3, percentage: 3, name: 'Level 3' },
        { level: 4, percentage: 2, name: 'Level 4' },
        { level: 5, percentage: 1, name: 'Level 5' },
        { level: 6, percentage: 1, name: 'Level 6' },
        { level: 7, percentage: 1, name: 'Level 7' },
        { level: 8, percentage: 1, name: 'Level 8' },
        { level: 9, percentage: 1, name: 'Level 9' },
      ],
    };
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        platformCommissionPercent,
        vendorPayoutPercent,
        mlmConfig,
      },
      'Commission settings retrieved successfully'
    )
  );
});

export const updateCommissionSettings = asyncWrapper(async (req, res) => {
  const { platformCommissionPercent, levels } = req.body;

  if (platformCommissionPercent !== undefined) {
    const num = Number(platformCommissionPercent);
    if (isNaN(num) || num < 0 || num > 100) {
      throw new ApiError(400, 'Platform commission percentage must be a number between 0 and 100', ERROR_CODES.BAD_REQUEST);
    }

    await Settings.findOneAndUpdate(
      { key: 'PLATFORM_COMMISSION_PERCENT' },
      { value: num, category: 'FINANCE', updatedBy: req.user._id },
      { upsert: true, new: true }
    );
  }

  if (levels !== undefined) {
    if (!Array.isArray(levels) || levels.length !== 9) {
      throw new ApiError(400, 'Referral configuration must specify exactly 9 levels', ERROR_CODES.BAD_REQUEST);
    }

    let sum = 0;
    const cleanLevels = [];
    for (let i = 0; i < 9; i++) {
      const lvl = levels[i];
      const p = Number(lvl.percentage);
      if (isNaN(p) || p < 0 || p > 100) {
        throw new ApiError(400, `Level ${i + 1} percentage must be between 0 and 100`, ERROR_CODES.BAD_REQUEST);
      }
      sum += p;
      cleanLevels.push({
        level: i + 1,
        percentage: p,
        name: lvl.name || `Level ${i + 1}`,
      });
    }

    if (sum > 100) {
      throw new ApiError(400, `Sum of referral level percentages cannot exceed 100% (currently ${sum}%)`, ERROR_CODES.BAD_REQUEST);
    }

    const mlmValue = { maxLevels: 9, levels: cleanLevels };
    await Settings.findOneAndUpdate(
      { key: 'MLM_COMMISSION_RATES' },
      { value: mlmValue, category: 'MLM', updatedBy: req.user._id },
      { upsert: true, new: true }
    );
    await Settings.findOneAndUpdate(
      { key: 'MLM_CONFIG' },
      { value: mlmValue, category: 'MLM', updatedBy: req.user._id },
      { upsert: true, new: true }
    );
  }

  await logAdminAction(
    req,
    'COMMISSION_SETTINGS_UPDATE',
    'Settings',
    'COMMISSIONS',
    { note: 'Updated platform and 9-level referral commission distribution rules' }
  );

  return res.status(200).json(
    new ApiResponse(200, { success: true }, 'Commission settings updated successfully')
  );
});

// ==========================================
// 10. SUBSCRIPTION PLANS MANAGEMENT
// ==========================================
export const getSubscriptionPlans = asyncWrapper(async (req, res) => {
  const [vendorPlans, customerPlans] = await Promise.all([
    SubscriptionPlan.find().sort({ displayOrder: 1, createdAt: -1 }),
    CustomerSubscriptionPlan.find().sort({ price: 1, createdAt: -1 }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      { vendorPlans, customerPlans },
      'Subscription plans retrieved successfully'
    )
  );
});

export const createSubscriptionPlan = asyncWrapper(async (req, res) => {
  const { planType, name, code, description, price, monthlyPrice, quarterlyPrice, halfYearlyPrice, yearlyPrice, durationValue, durationUnit, features, coinsReward } = req.body;

  if (!planType || !['VENDOR', 'CUSTOMER'].includes(planType)) {
    throw new ApiError(400, 'planType must be VENDOR or CUSTOMER', ERROR_CODES.BAD_REQUEST);
  }

  if (!name || !code) {
    throw new ApiError(400, 'Name and code are required', ERROR_CODES.BAD_REQUEST);
  }

  const cleanCode = code.trim().toUpperCase();

  if (planType === 'VENDOR') {
    const existing = await SubscriptionPlan.findOne({ code: cleanCode });
    if (existing) throw new ApiError(400, `Vendor plan code '${cleanCode}' already exists`, ERROR_CODES.BAD_REQUEST);

    const mPrice = Number(monthlyPrice ?? price ?? 0);
    const qPrice = Number(quarterlyPrice ?? (mPrice * 3));
    const hPrice = Number(halfYearlyPrice ?? (mPrice * 6));
    const yPrice = Number(yearlyPrice ?? (mPrice * 12));

    const newPlan = await SubscriptionPlan.create({
      name: name.trim(),
      code: cleanCode,
      description: description || '',
      monthlyPrice: mPrice,
      quarterlyPrice: qPrice,
      halfYearlyPrice: hPrice,
      yearlyPrice: yPrice,
      applicableEntityType: 'VENDOR',
      features: Array.isArray(features) ? features : (typeof features === 'string' ? features.split('\n').filter(Boolean) : []),
      isActive: true,
    });

    await logAdminAction(req, 'VENDOR_PLAN_CREATE', 'SubscriptionPlan', newPlan._id, { code: cleanCode, price: mPrice });
    return res.status(201).json(new ApiResponse(201, newPlan, 'Vendor subscription plan created successfully'));
  } else {
    const existing = await CustomerSubscriptionPlan.findOne({ code: cleanCode });
    if (existing) throw new ApiError(400, `Customer plan code '${cleanCode}' already exists`, ERROR_CODES.BAD_REQUEST);

    const newPlan = await CustomerSubscriptionPlan.create({
      name: name.trim(),
      code: cleanCode,
      description: description || '',
      durationValue: Number(durationValue) || 1,
      durationUnit: durationUnit || 'MONTH',
      price: Number(price) || 0,
      rewardRules: {
        coinsOnSubscribe: Number(coinsReward) || 0,
      },
      status: 'ACTIVE',
    });

    await logAdminAction(req, 'CUSTOMER_PLAN_CREATE', 'CustomerSubscriptionPlan', newPlan._id, { code: cleanCode, price });
    return res.status(201).json(new ApiResponse(201, newPlan, 'Customer subscription plan created successfully'));
  }
});

export const updateSubscriptionPlan = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { planType, name, description, price, monthlyPrice, quarterlyPrice, halfYearlyPrice, yearlyPrice, isActive, status, features, coinsReward } = req.body;

  if (planType === 'VENDOR') {
    const plan = await SubscriptionPlan.findById(id);
    if (!plan) throw new ApiError(404, 'Vendor plan not found', ERROR_CODES.NOT_FOUND);

    if (name) plan.name = name.trim();
    if (description !== undefined) plan.description = description;
    if (monthlyPrice !== undefined) plan.monthlyPrice = Number(monthlyPrice);
    if (quarterlyPrice !== undefined) plan.quarterlyPrice = Number(quarterlyPrice);
    if (halfYearlyPrice !== undefined) plan.halfYearlyPrice = Number(halfYearlyPrice);
    if (yearlyPrice !== undefined) plan.yearlyPrice = Number(yearlyPrice);
    if (isActive !== undefined) plan.isActive = Boolean(isActive);
    if (features !== undefined) {
      plan.features = Array.isArray(features) ? features : (typeof features === 'string' ? features.split('\n').filter(Boolean) : []);
    }

    await plan.save();
    await logAdminAction(req, 'VENDOR_PLAN_UPDATE', 'SubscriptionPlan', plan._id, { name: plan.name });
    return res.status(200).json(new ApiResponse(200, plan, 'Vendor subscription plan updated successfully'));
  } else {
    const plan = await CustomerSubscriptionPlan.findById(id);
    if (!plan) throw new ApiError(404, 'Customer plan not found', ERROR_CODES.NOT_FOUND);

    if (name) plan.name = name.trim();
    if (description !== undefined) plan.description = description;
    if (price !== undefined) plan.price = Number(price);
    if (status) plan.status = status;
    if (coinsReward !== undefined) plan.rewardRules.coinsOnSubscribe = Number(coinsReward);

    await plan.save();
    await logAdminAction(req, 'CUSTOMER_PLAN_UPDATE', 'CustomerSubscriptionPlan', plan._id, { name: plan.name });
    return res.status(200).json(new ApiResponse(200, plan, 'Customer subscription plan updated successfully'));
  }
});

export const deleteSubscriptionPlan = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { planType } = req.query;

  if (planType === 'VENDOR') {
    const plan = await SubscriptionPlan.findById(id);
    if (!plan) throw new ApiError(404, 'Vendor plan not found', ERROR_CODES.NOT_FOUND);
    plan.isActive = !plan.isActive;
    await plan.save();
    await logAdminAction(req, 'VENDOR_PLAN_TOGGLE', 'SubscriptionPlan', plan._id, { isActive: plan.isActive });
    return res.status(200).json(new ApiResponse(200, plan, `Vendor plan ${plan.isActive ? 'activated' : 'deactivated'}`));
  } else {
    const plan = await CustomerSubscriptionPlan.findById(id);
    if (!plan) throw new ApiError(404, 'Customer plan not found', ERROR_CODES.NOT_FOUND);
    plan.status = plan.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await plan.save();
    await logAdminAction(req, 'CUSTOMER_PLAN_TOGGLE', 'CustomerSubscriptionPlan', plan._id, { status: plan.status });
    return res.status(200).json(new ApiResponse(200, plan, `Customer plan ${plan.status}`));
  }
});

// ==========================================
// 11. VENDOR PAYOUT & WITHDRAWAL APPROVALS
// ==========================================
export const getPayoutRequests = asyncWrapper(async (req, res) => {
  const { page = 1, limit = 20, status = '' } = req.query;
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const skip = (pageNum - 1) * limitNum;

  const query = {};
  if (status) query.status = status;

  const [payouts, total, statsAgg] = await Promise.all([
    VendorWithdrawal.find(query)
      .populate({
        path: 'vendorId',
        select: 'storeName balance pendingBalance totalSales kycStatus userId',
        populate: { path: 'userId', select: 'name email phone' },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    VendorWithdrawal.countDocuments(query),
    VendorWithdrawal.aggregate([
      {
        $group: {
          _id: '$status',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const summary = statsAgg.reduce((acc, curr) => {
    acc[curr._id] = { count: curr.count, amount: curr.totalAmount };
    return acc;
  }, {});

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        payouts,
        summary,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
      'Payout requests retrieved successfully'
    )
  );
});

export const approvePayoutRequest = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { adminNotes } = req.body;

  const withdrawal = await VendorWithdrawal.findById(id);
  if (!withdrawal) throw new ApiError(404, 'Withdrawal request not found', ERROR_CODES.NOT_FOUND);

  if (withdrawal.status !== 'PENDING') {
    throw new ApiError(400, `Withdrawal request is already ${withdrawal.status}`, ERROR_CODES.BAD_REQUEST);
  }

  const vendor = await Vendor.findById(withdrawal.vendorId);
  if (!vendor) throw new ApiError(404, 'Associated vendor profile not found', ERROR_CODES.NOT_FOUND);

  // 1. Reconcile Vendor Pending Balance
  vendor.pendingBalance = Math.max(0, (vendor.pendingBalance || 0) - withdrawal.amount);
  await vendor.save();

  // 2. Record in immutable VendorLedger as PAYOUT (confirmation of settlement)
  await VendorLedger.create({
    vendorId: vendor._id,
    transactionType: 'PAYOUT',
    credit: 0,
    debit: 0, // Available balance was already debited during reservation
    balanceSnapshot: vendor.balance,
    description: `Payout approved & disbursed by Super Admin (${adminNotes || 'Direct Bank/UPI Settlement'})`,
    referenceId: withdrawal._id.toString(),
  });

  // 3. Record in PlatformLedger as WITHDRAWAL disbursement
  try {
    const latestPlatform = await PlatformLedger.findOne().sort({ createdAt: -1 });
    const currentBal = latestPlatform?.balanceSnapshot || 0;
    const nextBal = currentBal - withdrawal.amount;

    await PlatformLedger.create({
      transactionId: `PL-PAYOUT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'WITHDRAWAL',
      sourceEntityType: 'WITHDRAWAL',
      sourceEntityId: withdrawal._id.toString(),
      credit: 0,
      debit: withdrawal.amount,
      balanceSnapshot: nextBal,
      description: `Vendor payout disbursement for ${vendor.storeName}`,
      metadata: {
        vendorId: vendor._id,
        amount: withdrawal.amount,
        approvedBy: req.user._id,
      },
    });
  } catch (ledgerErr) {
    console.error('Failed to log platform withdrawal ledger:', ledgerErr);
  }

  // 4. Update withdrawal record
  withdrawal.status = 'APPROVED';
  withdrawal.adminNotes = adminNotes || 'Approved by Super Admin';
  withdrawal.processedAt = new Date();
  await withdrawal.save();

  // 5. Notify Vendor
  try {
    if (vendor.userId) {
      await notificationService.createNotification({
        userId: vendor.userId,
        title: 'Payout Request Approved',
        message: `Your withdrawal of ₹${withdrawal.amount.toLocaleString('en-IN')} has been approved and processed.`,
        type: 'PAYOUT_PROCESSED',
        link: '/vendor/wallet',
      });
    }
  } catch (notifErr) {
    console.error('Failed to send payout notification:', notifErr);
  }

  await logAdminAction(
    req,
    'VENDOR_PAYOUT_APPROVED',
    'VendorWithdrawal',
    withdrawal._id,
    { amount: withdrawal.amount, vendor: vendor.storeName }
  );

  return res.status(200).json(
    new ApiResponse(200, { withdrawal }, 'Payout request approved and disbursed successfully')
  );
});

export const rejectPayoutRequest = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { adminNotes } = req.body;

  if (!adminNotes || !adminNotes.trim()) {
    throw new ApiError(400, 'Reason for rejection is required', ERROR_CODES.BAD_REQUEST);
  }

  const withdrawal = await VendorWithdrawal.findById(id);
  if (!withdrawal) throw new ApiError(404, 'Withdrawal request not found', ERROR_CODES.NOT_FOUND);

  if (withdrawal.status !== 'PENDING') {
    throw new ApiError(400, `Withdrawal request is already ${withdrawal.status}`, ERROR_CODES.BAD_REQUEST);
  }

  const vendor = await Vendor.findById(withdrawal.vendorId);
  if (!vendor) throw new ApiError(404, 'Associated vendor profile not found', ERROR_CODES.NOT_FOUND);

  // Restore funds back to vendor available balance
  vendor.pendingBalance = Math.max(0, (vendor.pendingBalance || 0) - withdrawal.amount);
  vendor.balance = (vendor.balance || 0) + withdrawal.amount;
  await vendor.save();

  withdrawal.status = 'REJECTED';
  withdrawal.adminNotes = adminNotes.trim();
  withdrawal.processedAt = new Date();
  await withdrawal.save();

  try {
    if (vendor.userId) {
      await notificationService.createNotification({
        userId: vendor.userId,
        title: 'Payout Request Rejected',
        message: `Your withdrawal of ₹${withdrawal.amount.toLocaleString('en-IN')} was rejected. Reason: ${adminNotes.trim()}. Funds returned to your balance.`,
        type: 'PAYOUT_REJECTED',
        link: '/vendor/wallet',
      });
    }
  } catch (notifErr) {
    console.error('Failed to send payout rejection notification:', notifErr);
  }

  await logAdminAction(
    req,
    'VENDOR_PAYOUT_REJECTED',
    'VendorWithdrawal',
    withdrawal._id,
    { amount: withdrawal.amount, reason: adminNotes.trim() }
  );

  return res.status(200).json(
    new ApiResponse(200, { withdrawal }, 'Payout request rejected and funds returned to vendor')
  );
});

// ==========================================
// 12. DOUBLE-ENTRY FINANCIAL LEDGER AUDIT
// ==========================================
export const getFinancialLedger = asyncWrapper(async (req, res) => {
  const { page = 1, limit = 20, type = '' } = req.query;
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const skip = (pageNum - 1) * limitNum;

  const platformQuery = {};
  if (type) platformQuery.type = type;

  const [platformLogs, totalPlatform, vendorLedgerRecent, ledgerStats] = await Promise.all([
    PlatformLedger.find(platformQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    PlatformLedger.countDocuments(platformQuery),
    VendorLedger.find()
      .populate('vendorId', 'storeName')
      .sort({ createdAt: -1 })
      .limit(10),
    PlatformLedger.aggregate([
      {
        $group: {
          _id: '$type',
          totalCredit: { $sum: '$credit' },
          totalDebit: { $sum: '$debit' },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const latestPlatform = await PlatformLedger.findOne().sort({ createdAt: -1 });
  const platformBalance = latestPlatform?.balanceSnapshot || 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        platformLogs,
        vendorLedgerRecent,
        ledgerStats,
        platformBalance,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalPlatform,
          pages: Math.ceil(totalPlatform / limitNum),
        },
      },
      'Double-entry financial ledger records retrieved successfully'
    )
  );
});

// ==========================================
// 13. FINANCIAL TRANSACTION EXPLORER
// ==========================================
export const getOrderFinancialLineage = asyncWrapper(async (req, res) => {
  const { orderId } = req.params;

  let order = null;
  if (mongoose.Types.ObjectId.isValid(orderId)) {
    order = await Order.findById(orderId);
  }
  if (!order) {
    order = await Order.findOne({ $or: [{ orderNumber: orderId }, { publicOrderId: orderId }] });
  }

  if (!order) {
    throw new ApiError(404, 'Order not found', ERROR_CODES.NOT_FOUND);
  }

  const { VendorOrder } = await import('../models/VendorOrder.js');
  const { VendorSettlement } = await import('../models/VendorSettlement.js');
  const { StockTransaction } = await import('../models/StockTransaction.js');
  const { CoinTransaction } = await import('../models/CoinTransaction.js');

  const [
    payments,
    suborders,
    commissions,
    vendorLedgers,
    platformLedgers,
    stockTxs,
    coinTxs,
  ] = await Promise.all([
    Payment.find({ orderId: order._id }).sort({ createdAt: 1 }),
    VendorOrder.find({ parentOrderId: order._id }).populate('vendorId', 'storeName slug balance'),
    Commission.find({ orderId: order._id }).populate('recipientUserId', 'name email role'),
    VendorLedger.find({ orderId: order._id }).populate('vendorId', 'storeName'),
    PlatformLedger.find({
      $or: [
        { sourceEntityId: order._id.toString() },
        { 'metadata.orderId': order._id },
        { 'metadata.orderId': order._id.toString() },
      ],
    }),
    StockTransaction.find({ orderId: order._id }).populate('productId', 'name sku'),
    CoinTransaction.find({ referenceId: order.orderNumber }),
  ]);

  const suborderIds = suborders.map((s) => s._id);
  const settlements = await VendorSettlement.find({ suborderId: { $in: suborderIds } }).populate('vendorId', 'storeName');

  const totalGross = suborders.reduce((acc, s) => acc + (s.subtotal || 0), 0);
  const totalPlatformFee = suborders.reduce((acc, s) => acc + (s.platformCommission || 0), 0);
  const totalVendorEarning = suborders.reduce((acc, s) => acc + (s.vendorEarning || 0), 0);
  const totalSettlementsPayable = settlements.reduce((acc, st) => acc + (st.netPayable || 0), 0);

  const doubleEntryBalanced = Math.abs(totalGross - (totalPlatformFee + totalVendorEarning)) < 0.01;

  const lineage = {
    order: {
      id: order._id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      grandTotal: order.grandTotal,
      subtotal: order.subtotal,
      fairCoinsUsed: order.fairCoinsUsed,
      createdAt: order.createdAt,
    },
    payments,
    vendorSuborders: suborders,
    commissions,
    vendorLedgerEntries: vendorLedgers,
    platformLedgerEntries: platformLedgers,
    vendorSettlements: settlements,
    stockMovements: stockTxs,
    coinMovements: coinTxs,
    reconciliation: {
      totalGross,
      totalPlatformFee,
      totalVendorEarning,
      totalSettlementsPayable,
      doubleEntryBalanced,
      status: doubleEntryBalanced ? 'MATCH' : 'MISMATCH',
    },
  };

  return res.status(200).json(
    new ApiResponse(200, lineage, 'Order financial lineage traced successfully')
  );
});

// ==========================================
// 14. SALES REPORT & DETAILED ANALYTICS
// ==========================================
export const getSalesReport = asyncWrapper(async (req, res) => {
  const { range = 'THIS_MONTH', startDate, endDate } = req.query;

  const now = new Date();
  let start = new Date();
  let end = new Date();

  if (range === 'TODAY') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    end = new Date();
  } else if (range === 'YESTERDAY') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, -1);
  } else if (range === 'LAST_7_DAYS') {
    start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    end = new Date();
  } else if (range === 'THIS_MONTH') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date();
  } else if (range === 'LAST_MONTH') {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  } else if (range === 'CUSTOM' && startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date();
  }

  const dateFilter = { createdAt: { $gte: start, $lte: end } };
  const subDateFilter = { startDate: { $gte: start, $lte: end } };

  const [
    vendorSubs,
    customerSubs,
    orders,
    activeCustCount,
    totalCustCount,
  ] = await Promise.all([
    Subscription.find(subDateFilter).populate('ownerUserId', 'name email phone role').populate('planId', 'name price'),
    CustomerSubscription.find(dateFilter).populate('customerId', 'name email phone role').populate('planId', 'name price'),
    Order.find(dateFilter).populate('userId', 'name email phone role'),
    User.countDocuments({ role: ROLES.USER, status: USER_STATUS.ACTIVE }),
    User.countDocuments({ role: ROLES.USER }),
  ]);

  const vendorSubRevenue = vendorSubs.reduce((acc, s) => acc + (s.amount || 0), 0);
  const customerSubRevenue = customerSubs.reduce((acc, s) => acc + (s.planSnapshot?.price || s.planId?.price || 0), 0);
  const totalSubRevenue = vendorSubRevenue + customerSubRevenue;
  const productSalesRevenue = orders.reduce((acc, o) => acc + (o.grandTotal || o.total || 0), 0);
  const totalSalesVolume = totalSubRevenue + productSalesRevenue;

  const purchasingCustomerSet = new Set();
  orders.forEach((o) => {
    if (o.userId?._id) purchasingCustomerSet.add(o.userId._id.toString());
  });
  customerSubs.forEach((c) => {
    if (c.customerId?._id) purchasingCustomerSet.add(c.customerId._id.toString());
  });

  // Construct daily trends map
  const dailyTrendMap = new Map();
  const curr = new Date(start);
  while (curr <= end) {
    const key = curr.toISOString().split('T')[0];
    dailyTrendMap.set(key, { date: key, vendorSub: 0, customerSub: 0, productSales: 0, totalAmount: 0, ordersCount: 0 });
    curr.setDate(curr.getDate() + 1);
  }

  orders.forEach((o) => {
    const key = new Date(o.createdAt).toISOString().split('T')[0];
    if (dailyTrendMap.has(key)) {
      const entry = dailyTrendMap.get(key);
      const amt = o.grandTotal || o.total || 0;
      entry.productSales += amt;
      entry.totalAmount += amt;
      entry.ordersCount += 1;
    }
  });

  customerSubs.forEach((c) => {
    const key = new Date(c.createdAt).toISOString().split('T')[0];
    if (dailyTrendMap.has(key)) {
      const entry = dailyTrendMap.get(key);
      const amt = c.planSnapshot?.price || c.planId?.price || 0;
      entry.customerSub += amt;
      entry.totalAmount += amt;
    }
  });

  vendorSubs.forEach((v) => {
    const key = new Date(v.startDate || v.createdAt).toISOString().split('T')[0];
    if (dailyTrendMap.has(key)) {
      const entry = dailyTrendMap.get(key);
      const amt = v.amount || 0;
      entry.vendorSub += amt;
      entry.totalAmount += amt;
    }
  });

  // Construct detailed transactions list
  const transactions = [
    ...orders.map((o) => ({
      id: o._id,
      orderNumber: o.orderNumber || o.publicOrderId,
      type: 'PRODUCT_ORDER',
      category: 'Customer Order',
      date: o.createdAt,
      user: {
        name: o.userId?.name || o.deliveryAddressSnapshot?.name || 'Customer',
        email: o.userId?.email || 'N/A',
        phone: o.userId?.phone || o.deliveryAddressSnapshot?.phone || '',
        role: 'CUSTOMER',
      },
      itemOrPlan: o.items?.map((i) => i.name || i.productNameSnapshot).join(', ') || 'Marketplace Product',
      amount: o.grandTotal || o.total || 0,
      paymentStatus: o.paymentStatus || 'COMPLETED',
    })),
    ...customerSubs.map((cs) => ({
      id: cs._id,
      orderNumber: `SUB-CUST-${cs._id.toString().slice(-6).toUpperCase()}`,
      type: 'CUSTOMER_VIP_SUB',
      category: 'Customer Subscription',
      date: cs.createdAt,
      user: {
        name: cs.customerId?.name || 'Customer Account',
        email: cs.customerId?.email || 'N/A',
        phone: cs.customerId?.phone || '',
        role: 'CUSTOMER',
      },
      itemOrPlan: cs.planSnapshot?.name || cs.planId?.name || 'VIP Membership Plan',
      amount: cs.planSnapshot?.price || cs.planId?.price || 0,
      paymentStatus: cs.status === 'ACTIVE' ? 'PAID' : cs.status,
    })),
    ...vendorSubs.map((vs) => ({
      id: vs._id,
      orderNumber: `SUB-VEND-${vs._id.toString().slice(-6).toUpperCase()}`,
      type: 'VENDOR_SUB',
      category: 'Vendor Subscription',
      date: vs.startDate || vs.createdAt,
      user: {
        name: vs.ownerUserId?.name || 'Vendor Merchant',
        email: vs.ownerUserId?.email || 'N/A',
        phone: vs.ownerUserId?.phone || '',
        role: 'VENDOR',
      },
      itemOrPlan: vs.planId?.name || 'Vendor Store Plan',
      amount: vs.amount || 0,
      paymentStatus: vs.status === 'ACTIVE' ? 'PAID' : vs.status,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        summary: {
          timeRange: range,
          startDate: start,
          endDate: end,
          vendorSubRevenue,
          customerSubRevenue,
          totalSubRevenue,
          productSalesRevenue,
          totalSalesVolume,
          totalOrdersCount: orders.length,
          purchasingCustomersCount: purchasingCustomerSet.size,
          activeCustomersCount: activeCustCount,
          inactiveCustomersCount: Math.max(0, totalCustCount - activeCustCount),
          totalRegisteredCustomers: totalCustCount,
        },
        dailyTrends: Array.from(dailyTrendMap.values()),
        transactions,
      },
      'Sales report data fetched successfully'
    )
  );
});

// ==========================================
// 15. SUPER ADMIN PRODUCT MANAGEMENT & SELLING
// ==========================================
export const getSuperAdminProducts = asyncWrapper(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    category = '',
    sourceType = '',
    status = '',
    stockFilter = '',
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const filter = { isDeleted: false };

  if (search) {
    const searchRegex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { name: searchRegex },
      { sku: searchRegex },
      { brandName: searchRegex },
    ];
  }

  if (category) filter.categoryId = category;
  if (sourceType) filter.sourceType = sourceType;
  if (status) filter.status = status;

  if (stockFilter === 'IN_STOCK') filter.stock = { $gt: 5 };
  if (stockFilter === 'LOW_STOCK') filter.stock = { $gt: 0, $lte: 5 };
  if (stockFilter === 'OUT_OF_STOCK') filter.stock = { $eq: 0 };

  const [products, total, categories] = await Promise.all([
    Product.find(filter)
      .populate('categoryId', 'name')
      .populate('vendorId', 'storeName businessName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Product.countDocuments(filter),
    mongoose.model('Category').find({ isActive: true }).select('name'),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      products,
      categories,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum) || 1,
      },
    }, 'Products retrieved successfully')
  );
});

export const createSuperAdminProduct = asyncWrapper(async (req, res) => {
  const {
    name,
    description,
    shortDescription,
    categoryId,
    subCategory,
    brandName,
    images,
    mrp,
    price,
    fairCoinPrice,
    discountValue,
    stock,
    minStockLevel,
    sku,
    weight,
    availableSizes,
    availableColors,
    specifications,
    status = 'APPROVED',
    sourceType = 'SUPER_ADMIN',
  } = req.body;

  if (!name || !categoryId || price === undefined || mrp === undefined) {
    throw new ApiError(400, 'Product name, category, MRP and selling price are required', ERROR_CODES.BAD_REQUEST);
  }

  const generatedSku = sku?.trim()?.toUpperCase() || `SKU-SA-${Date.now().toString().slice(-6)}`;
  const cleanSlug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;

  const coinsPerRupee = 10;
  const calculatedFairCoinPrice = fairCoinPrice ? Number(fairCoinPrice) : Math.round(Number(price) * coinsPerRupee);

  const product = await Product.create({
    name: name.trim(),
    slug: cleanSlug,
    description: description || '',
    shortDescription: shortDescription || '',
    categoryId,
    subCategory: subCategory || '',
    brandName: brandName || 'FairKart Direct',
    images: Array.isArray(images) && images.length > 0 ? images : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop'],
    mrp: Number(mrp),
    price: Number(price),
    fairCoinPrice: calculatedFairCoinPrice,
    discountValue: Number(discountValue) || (Number(mrp) > Number(price) ? Math.round(((Number(mrp) - Number(price)) / Number(mrp)) * 100) : 0),
    stock: Number(stock) || 0,
    minStockLevel: Number(minStockLevel) || 5,
    lowStockThreshold: Number(minStockLevel) || 5,
    sku: generatedSku,
    weight: Number(weight) || 0,
    availableSizes: typeof availableSizes === 'string'
      ? availableSizes.split(',').map((s) => s.trim()).filter(Boolean)
      : (Array.isArray(availableSizes) ? availableSizes : []),
    availableColors: typeof availableColors === 'string'
      ? availableColors.split(',').map((c) => c.trim()).filter(Boolean)
      : (Array.isArray(availableColors) ? availableColors : []),
    specifications: typeof specifications === 'object' && specifications !== null ? specifications : {},
    status: sourceType === 'SUPER_ADMIN' ? 'APPROVED' : (status || 'APPROVED'),
    sourceType: sourceType || 'SUPER_ADMIN',
    vendorId: null,
  });

  await logAdminAction(req, 'SUPER_ADMIN_PRODUCT_CREATE', 'Product', product._id, {
    name: product.name,
    price: product.price,
    sourceType: product.sourceType,
  });

  return res.status(201).json(new ApiResponse(201, product, 'Super Admin product created and published successfully'));
});

export const updateSuperAdminProduct = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, 'Product not found', ERROR_CODES.NOT_FOUND);

  if (updates.name) product.name = updates.name.trim();
  if (updates.description !== undefined) product.description = updates.description;
  if (updates.shortDescription !== undefined) product.shortDescription = updates.shortDescription;
  if (updates.categoryId) product.categoryId = updates.categoryId;
  if (updates.subCategory !== undefined) product.subCategory = updates.subCategory;
  if (updates.brandName !== undefined) product.brandName = updates.brandName;
  if (updates.images && Array.isArray(updates.images)) product.images = updates.images;
  if (updates.mrp !== undefined) product.mrp = Number(updates.mrp);
  if (updates.price !== undefined) product.price = Number(updates.price);
  if (updates.fairCoinPrice !== undefined) product.fairCoinPrice = Number(updates.fairCoinPrice);
  if (updates.stock !== undefined) product.stock = Number(updates.stock);
  if (updates.minStockLevel !== undefined) {
    product.minStockLevel = Number(updates.minStockLevel);
    product.lowStockThreshold = Number(updates.minStockLevel);
  }
  if (updates.sku) product.sku = updates.sku.trim().toUpperCase();
  if (updates.status) product.status = updates.status;
  if (updates.sourceType) product.sourceType = updates.sourceType;

  await product.save();

  await logAdminAction(req, 'SUPER_ADMIN_PRODUCT_UPDATE', 'Product', product._id, {
    name: product.name,
    price: product.price,
    stock: product.stock,
  });

  return res.status(200).json(new ApiResponse(200, product, 'Product updated successfully'));
});

export const deleteSuperAdminProduct = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, 'Product not found', ERROR_CODES.NOT_FOUND);

  product.isDeleted = !product.isDeleted;
  await product.save();

  return res.status(200).json(
    new ApiResponse(200, product, `Product ${product.isDeleted ? 'deleted' : 'restored'} successfully`)
  );
});

export const updateSuperAdminProductStock = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { action = 'ADD', quantity = 0 } = req.body;

  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, 'Product not found', ERROR_CODES.NOT_FOUND);

  const qty = Math.max(0, parseInt(quantity, 10) || 0);

  if (action === 'ADD') {
    product.stock += qty;
  } else if (action === 'REDUCE') {
    product.stock = Math.max(0, product.stock - qty);
  } else if (action === 'SET') {
    product.stock = qty;
  }

  await product.save();

  return res.status(200).json(
    new ApiResponse(200, product, `Stock updated. Current stock: ${product.stock}`)
  );
});

export const getSuperAdminInventory = asyncWrapper(async (req, res) => {
  const [totalProducts, lowStockProducts, outOfStockProducts, superAdminProducts] = await Promise.all([
    Product.countDocuments({ isDeleted: false }),
    Product.find({ isDeleted: false, stock: { $gt: 0, $lte: 5 } }).populate('categoryId', 'name'),
    Product.find({ isDeleted: false, stock: 0 }).populate('categoryId', 'name'),
    Product.find({ isDeleted: false, sourceType: 'SUPER_ADMIN' }).populate('categoryId', 'name'),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      totalProducts,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      superAdminCount: superAdminProducts.length,
      lowStockProducts,
      outOfStockProducts,
      superAdminProducts,
    }, 'Inventory metrics retrieved successfully')
  );
});

export const getSuperAdminOrders = asyncWrapper(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const orders = await Order.find()
    .populate('userId', 'name email phone role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Order.countDocuments();

  return res.status(200).json(
    new ApiResponse(200, {
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum) || 1,
      },
    }, 'Orders retrieved successfully')
  );
});



