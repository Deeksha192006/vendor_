import mongoose from 'mongoose';
import { VendorReferralCommission } from '../models/VendorReferralCommission.js';
import { Vendor } from '../models/Vendor.js';
import { User } from '../models/User.js';
import { Order } from '../models/Order.js';
import { VendorOrder } from '../models/VendorOrder.js';
import { platformCommissionService } from '../services/platformCommissionService.js';
import { moneyUtils } from '../utils/moneyUtils.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { parseDateRange } from './salesAnalyticsController.js';

// =========================================================================
// 1. VENDOR: 3% DIRECT REFERRAL COMMISSION SUMMARY & REFERRED VENDORS
// =========================================================================
export const getVendorReferralSummary = asyncWrapper(async (req, res) => {
  const vendor = await Vendor.findOne({ userId: req.user._id });
  if (!vendor) {
    throw new ApiError(404, 'Vendor profile not found');
  }

  const now = new Date();

  // Find all directly referred vendors
  const referredVendors = await Vendor.find({
    $or: [{ referredByVendorId: vendor._id }, { referredByUserId: req.user._id }],
  })
    .populate('userId', 'name email phone createdAt')
    .lean();

  const referredVendorIds = referredVendors.map((v) => v._id);

  // Find all referral commission records where this vendor is the referrer
  const commissions = await VendorReferralCommission.find({
    referrerVendorId: vendor._id,
  })
    .populate('sellingVendorId', 'storeName slug')
    .populate('orderId', 'orderNumber orderStatus paymentStatus paymentMethod createdAt')
    .sort({ createdAt: -1 })
    .lean();

  let totalReferredSales = 0;
  let totalCommissionEarned = 0;
  let pendingDelivery = 0;
  let onHold7Days = 0;
  let eligibleForPayout = 0;
  let totalPaidOut = 0;
  let totalCancelled = 0;

  // Breakdown per referred vendor
  const vendorStatsMap = new Map();
  referredVendors.forEach((rv) => {
    vendorStatsMap.set(rv._id.toString(), {
      vendorId: rv._id,
      storeName: rv.storeName,
      slug: rv.slug,
      ownerName: rv.userId?.name || 'Vendor',
      joinedAt: rv.createdAt,
      totalSalesGenerated: 0,
      totalCommissionAccrued: 0,
      totalCommissionPaid: 0,
    });
  });

  commissions.forEach((comm) => {
    const saleAmt = comm.eligibleSaleAmount || 0;
    const commAmt = comm.commissionAmount || 0;
    const sId = comm.sellingVendorId?._id?.toString() || comm.sellingVendorId?.toString();

    if (comm.commissionStatus === 'CANCELLED' || comm.settlementStatus === 'CANCELLED' || comm.settlementStatus === 'REVERSED') {
      totalCancelled = moneyUtils.addMoney(totalCancelled, commAmt);
      return;
    }

    totalReferredSales = moneyUtils.addMoney(totalReferredSales, saleAmt);

    if (sId && vendorStatsMap.has(sId)) {
      const stats = vendorStatsMap.get(sId);
      stats.totalSalesGenerated = moneyUtils.addMoney(stats.totalSalesGenerated, saleAmt);
    }

    if (comm.settlementStatus === 'PAID') {
      totalCommissionEarned = moneyUtils.addMoney(totalCommissionEarned, commAmt);
      totalPaidOut = moneyUtils.addMoney(totalPaidOut, commAmt);
      if (sId && vendorStatsMap.has(sId)) {
        const stats = vendorStatsMap.get(sId);
        stats.totalCommissionAccrued = moneyUtils.addMoney(stats.totalCommissionAccrued, commAmt);
        stats.totalCommissionPaid = moneyUtils.addMoney(stats.totalCommissionPaid, commAmt);
      }
    } else if (comm.settlementStatus === 'PENDING_DELIVERY') {
      pendingDelivery = moneyUtils.addMoney(pendingDelivery, commAmt);
    } else if (comm.settlementStatus === 'ELIGIBLE' || comm.settlementStatus === 'ON_HOLD') {
      totalCommissionEarned = moneyUtils.addMoney(totalCommissionEarned, commAmt);
      if (sId && vendorStatsMap.has(sId)) {
        const stats = vendorStatsMap.get(sId);
        stats.totalCommissionAccrued = moneyUtils.addMoney(stats.totalCommissionAccrued, commAmt);
      }

      if (comm.eligibleAt && new Date(comm.eligibleAt) > now) {
        onHold7Days = moneyUtils.addMoney(onHold7Days, commAmt);
      } else {
        eligibleForPayout = moneyUtils.addMoney(eligibleForPayout, commAmt);
      }
    }
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        metrics: {
          referralCommissionRate: 3,
          totalReferredVendorsCount: referredVendors.length,
          totalReferredSales,
          totalCommissionEarned,
          pendingDelivery,
          onHold7Days,
          eligibleForPayout,
          totalPaidOut,
          totalCancelled,
          availableBalance: eligibleForPayout,
        },
        referredVendors: Array.from(vendorStatsMap.values()),
      },
      'Vendor direct referral commission summary retrieved successfully'
    )
  );
});

// =========================================================================
// 2. VENDOR: 3% DIRECT REFERRAL TRANSACTIONS LIST
// =========================================================================
export const getVendorReferralTransactions = asyncWrapper(async (req, res) => {
  const vendor = await Vendor.findOne({ userId: req.user._id });
  if (!vendor) {
    throw new ApiError(404, 'Vendor profile not found');
  }

  const { status, page = 1, limit = 20, sellingVendorId } = req.query;
  const filter = { referrerVendorId: vendor._id };

  if (status && status !== 'ALL') {
    filter.settlementStatus = status;
  }
  if (sellingVendorId) {
    filter.sellingVendorId = sellingVendorId;
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [total, records] = await Promise.all([
    VendorReferralCommission.countDocuments(filter),
    VendorReferralCommission.find(filter)
      .populate('sellingVendorId', 'storeName slug')
      .populate('orderId', 'orderNumber createdAt paymentStatus orderStatus')
      .populate('suborderId', 'suborderNumber trackingId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
  ]);

  const now = new Date();
  const transactions = records.map((r) => {
    let computedHoldStatus = r.settlementStatus;
    if (r.settlementStatus === 'ELIGIBLE' && r.eligibleAt && new Date(r.eligibleAt) > now) {
      computedHoldStatus = 'ON_HOLD_7_DAYS';
    }

    return {
      _id: r._id,
      orderId: r.orderId?._id || r.orderId,
      orderNumber: r.orderId?.orderNumber || 'N/A',
      suborderNumber: r.suborderId?.suborderNumber || 'N/A',
      sellingVendorName: r.sellingVendorId?.storeName || 'Referred Vendor',
      sellingVendorId: r.sellingVendorId?._id || r.sellingVendorId,
      eligibleSaleAmount: r.eligibleSaleAmount,
      commissionRate: r.commissionRate || 3,
      commissionAmount: r.commissionAmount,
      commissionStatus: r.commissionStatus,
      settlementStatus: r.settlementStatus,
      computedHoldStatus,
      eligibleAt: r.eligibleAt,
      deliveredAt: r.deliveredAt,
      paidAt: r.paidAt,
      payoutReference: r.payoutReference,
      createdAt: r.createdAt,
    };
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        transactions,
      },
      'Vendor referral transactions retrieved successfully'
    )
  );
});

// =========================================================================
// 3. SUPER ADMIN: 3% DIRECT VENDOR REFERRAL OVERVIEW
// =========================================================================
export const getAdminReferralOverview = asyncWrapper(async (req, res) => {
  const { range = 'THIS_MONTH', startDate, endDate } = req.query;
  const { start, end } = parseDateRange(range, startDate, endDate);

  const query = { createdAt: { $gte: start, $lte: end } };
  const commissions = await VendorReferralCommission.find(query)
    .populate('referrerVendorId', 'storeName slug')
    .populate('sellingVendorId', 'storeName slug')
    .lean();

  let totalReferredSales = 0;
  let totalReferralCommissions = 0;
  let pendingDelivery = 0;
  let onHold7Days = 0;
  let eligibleForPayout = 0;
  let totalPaidOut = 0;
  let totalCancelled = 0;

  const now = new Date();
  const referrerMap = new Map();

  commissions.forEach((c) => {
    const sale = c.eligibleSaleAmount || 0;
    const comm = c.commissionAmount || 0;

    if (c.commissionStatus === 'CANCELLED' || c.settlementStatus === 'CANCELLED' || c.settlementStatus === 'REVERSED') {
      totalCancelled = moneyUtils.addMoney(totalCancelled, comm);
      return;
    }

    totalReferredSales = moneyUtils.addMoney(totalReferredSales, sale);

    if (c.settlementStatus === 'PAID') {
      totalReferralCommissions = moneyUtils.addMoney(totalReferralCommissions, comm);
      totalPaidOut = moneyUtils.addMoney(totalPaidOut, comm);
    } else if (c.settlementStatus === 'PENDING_DELIVERY') {
      pendingDelivery = moneyUtils.addMoney(pendingDelivery, comm);
    } else if (c.settlementStatus === 'ELIGIBLE' || c.settlementStatus === 'ON_HOLD') {
      totalReferralCommissions = moneyUtils.addMoney(totalReferralCommissions, comm);
      if (c.eligibleAt && new Date(c.eligibleAt) > now) {
        onHold7Days = moneyUtils.addMoney(onHold7Days, comm);
      } else {
        eligibleForPayout = moneyUtils.addMoney(eligibleForPayout, comm);
      }
    }

    // Top referrers aggregation
    const refId = c.referrerVendorId?._id?.toString() || c.referrerVendorId?.toString();
    if (refId) {
      if (!referrerMap.has(refId)) {
        referrerMap.set(refId, {
          referrerVendorId: refId,
          storeName: c.referrerVendorId?.storeName || 'Vendor',
          totalReferralEarned: 0,
          totalReferredSales: 0,
          pendingPayout: 0,
          completedPayout: 0,
        });
      }
      const refStat = referrerMap.get(refId);
      refStat.totalReferredSales = moneyUtils.addMoney(refStat.totalReferredSales, sale);
      if (c.settlementStatus === 'PAID') {
        refStat.completedPayout = moneyUtils.addMoney(refStat.completedPayout, comm);
        refStat.totalReferralEarned = moneyUtils.addMoney(refStat.totalReferralEarned, comm);
      } else if (c.settlementStatus === 'ELIGIBLE') {
        refStat.pendingPayout = moneyUtils.addMoney(refStat.pendingPayout, comm);
        refStat.totalReferralEarned = moneyUtils.addMoney(refStat.totalReferralEarned, comm);
      }
    }
  });

  const totalReferralPairs = await Vendor.countDocuments({ referredByVendorId: { $ne: null } });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        range,
        startDate: start,
        endDate: end,
        metrics: {
          commissionRate: 3,
          totalReferralPairs,
          totalReferredSales,
          totalReferralCommissions,
          pendingDelivery,
          onHold7Days,
          eligibleForPayout,
          totalPaidOut,
          totalCancelled,
        },
        topReferrers: Array.from(referrerMap.values()).sort((a, b) => b.totalReferralEarned - a.totalReferralEarned),
      },
      'Super Admin referral commission overview retrieved successfully'
    )
  );
});

// =========================================================================
// 4. SUPER ADMIN: 3% DIRECT VENDOR REFERRAL TRANSACTIONS TABLE
// =========================================================================
export const getAdminReferralTransactions = asyncWrapper(async (req, res) => {
  const {
    range = 'THIS_MONTH',
    startDate,
    endDate,
    referrerVendorId,
    sellingVendorId,
    settlementStatus,
    search,
    page = 1,
    limit = 25,
  } = req.query;

  const { start, end } = parseDateRange(range, startDate, endDate);
  const filter = { createdAt: { $gte: start, $lte: end } };

  if (referrerVendorId) filter.referrerVendorId = referrerVendorId;
  if (sellingVendorId) filter.sellingVendorId = sellingVendorId;
  if (settlementStatus && settlementStatus !== 'ALL') {
    filter.settlementStatus = settlementStatus;
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [total, records] = await Promise.all([
    VendorReferralCommission.countDocuments(filter),
    VendorReferralCommission.find(filter)
      .populate('referrerVendorId', 'storeName slug')
      .populate('sellingVendorId', 'storeName slug')
      .populate('orderId', 'orderNumber orderStatus paymentStatus paymentMethod')
      .populate('suborderId', 'suborderNumber trackingId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
  ]);

  const now = new Date();
  const transactions = records.map((r) => {
    const isLockedInHold = r.settlementStatus === 'ELIGIBLE' && r.eligibleAt && new Date(r.eligibleAt) > now;
    const canPayout = r.settlementStatus === 'ELIGIBLE' && (!r.eligibleAt || new Date(r.eligibleAt) <= now);

    return {
      _id: r._id,
      orderNumber: r.orderId?.orderNumber || 'N/A',
      suborderNumber: r.suborderId?.suborderNumber || 'N/A',
      referrerVendor: {
        _id: r.referrerVendorId?._id || r.referrerVendorId,
        storeName: r.referrerVendorId?.storeName || 'Referrer Vendor',
        slug: r.referrerVendorId?.slug,
      },
      sellingVendor: {
        _id: r.sellingVendorId?._id || r.sellingVendorId,
        storeName: r.sellingVendorId?.storeName || 'Selling Vendor',
        slug: r.sellingVendorId?.slug,
      },
      eligibleSaleAmount: r.eligibleSaleAmount,
      commissionRate: r.commissionRate || 3,
      commissionAmount: r.commissionAmount,
      commissionStatus: r.commissionStatus,
      settlementStatus: r.settlementStatus,
      isLockedInHold,
      canPayout,
      eligibleAt: r.eligibleAt,
      deliveredAt: r.deliveredAt,
      paidAt: r.paidAt,
      payoutReference: r.payoutReference,
      notes: r.notes,
      createdAt: r.createdAt,
    };
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        transactions,
      },
      'Referral commission transactions retrieved successfully'
    )
  );
});

// =========================================================================
// 5. SUPER ADMIN: PROCESS REFERRAL COMMISSION PAYOUT (RELEASE AFTER 7 DAYS)
// =========================================================================
export const payoutAdminReferralCommission = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { payoutReference, notes } = req.body;

  const updatedCommission = await platformCommissionService.processVendorReferralPayout(id, {
    payoutReference,
    notes,
    processedBy: req.user._id,
  });

  return res.status(200).json(
    new ApiResponse(200, updatedCommission, 'Direct vendor referral commission payout successfully processed and marked PAID')
  );
});

// =========================================================================
// 6. SUPER ADMIN: EXPORT REFERRAL COMMISSIONS CSV
// =========================================================================
export const exportAdminReferralCommissionsCsv = asyncWrapper(async (req, res) => {
  const { range = 'THIS_MONTH', startDate, endDate } = req.query;
  const { start, end } = parseDateRange(range, startDate, endDate);

  const records = await VendorReferralCommission.find({ createdAt: { $gte: start, $lte: end } })
    .populate('referrerVendorId', 'storeName')
    .populate('sellingVendorId', 'storeName')
    .populate('orderId', 'orderNumber paymentStatus orderStatus')
    .populate('suborderId', 'suborderNumber')
    .sort({ createdAt: -1 })
    .lean();

  let csv = 'Referral Commission ID,Order Number,Suborder Number,Referrer Vendor,Selling Vendor,Sale Amount (INR),Referral Rate (%),Referral Commission (INR),Settlement Status,Delivered At,Eligible At (7-Day Holding),Paid At,Payout Reference\n';

  records.forEach((r) => {
    const row = [
      `"${r._id}"`,
      `"${r.orderId?.orderNumber || 'N/A'}"`,
      `"${r.suborderId?.suborderNumber || 'N/A'}"`,
      `"${r.referrerVendorId?.storeName || 'Referrer Vendor'}"`,
      `"${r.sellingVendorId?.storeName || 'Selling Vendor'}"`,
      r.eligibleSaleAmount || 0,
      r.commissionRate || 3,
      r.commissionAmount || 0,
      `"${r.settlementStatus}"`,
      `"${r.deliveredAt ? new Date(r.deliveredAt).toISOString() : ''}"`,
      `"${r.eligibleAt ? new Date(r.eligibleAt).toISOString() : ''}"`,
      `"${r.paidAt ? new Date(r.paidAt).toISOString() : ''}"`,
      `"${r.payoutReference || ''}"`,
    ];
    csv += row.join(',') + '\n';
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="baapoo_vendor_referral_commissions_${Date.now()}.csv"`);
  return res.status(200).send(csv);
});
