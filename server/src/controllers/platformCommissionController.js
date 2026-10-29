import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { VendorOrder } from '../models/VendorOrder.js';
import { Vendor } from '../models/Vendor.js';
import { VendorSettlement } from '../models/VendorSettlement.js';
import { Commission } from '../models/Commission.js';
import { User } from '../models/User.js';
import { platformCommissionService } from '../services/platformCommissionService.js';
import { moneyUtils } from '../utils/moneyUtils.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { parseDateRange } from './salesAnalyticsController.js';

// =========================================================================
// 1. SUPER ADMIN: COMMISSION OVERVIEW (7 KPI Summary Cards)
// =========================================================================
export const getAdminCommissionOverview = asyncWrapper(async (req, res) => {
  const { range = 'THIS_MONTH', startDate, endDate } = req.query;
  const { start, end } = parseDateRange(range, startDate, endDate);

  // Fetch orders in date range with vendor items
  const orders = await Order.find({ createdAt: { $gte: start, $lte: end } })
    .populate('items.vendorId', 'storeName slug')
    .lean();

  let totalVerifiedCustomerPayments = 0;
  let totalVendorProductSales = 0;
  let totalCommissionEarned = 0;
  let commissionPendingDelivery = 0;
  let commissionEligibleForSettlement = 0;
  let pendingVendorProceeds = 0;
  let totalVendorPayables = 0;
  let totalVendorPayoutsCompleted = 0;
  let totalRefundsReversals = 0;

  orders.forEach((order) => {
    const isPaid = order.paymentStatus === 'PAID' || (order.paymentMethod === 'COD' && order.orderStatus === 'DELIVERED');
    const isDelivered = order.orderStatus === 'DELIVERED';
    const isCancelled = order.orderStatus === 'CANCELLED';
    const isRefunded = order.paymentStatus === 'REFUNDED' || order.orderStatus === 'REFUNDED';

    if (isPaid && !isCancelled && !isRefunded) {
      totalVerifiedCustomerPayments = moneyUtils.addMoney(totalVerifiedCustomerPayments, order.grandTotal || order.total || 0);
    }

    order.items?.forEach((item) => {
      // Strictly skip platform Admin Store products
      if (!item.vendorId) return;

      const itemAmount = item.lineTotal || (item.unitPrice || 0) * (item.quantity || 1);
      const commissionRate = 5; // Fixed 5% rate
      const platformCommission = typeof item.platformCommission === 'number'
        ? item.platformCommission
        : platformCommissionService.calculateLine(item.unitPrice || item.price, item.quantity || 1).platformCommission;
      const vendorShare = typeof item.vendorShare === 'number'
        ? item.vendorShare
        : platformCommissionService.calculateLine(item.unitPrice || item.price, item.quantity || 1).vendorProceeds;

      // Cancelled / Refunded reversals
      if (isCancelled || isRefunded) {
        totalRefundsReversals = moneyUtils.addMoney(totalRefundsReversals, itemAmount);
        return;
      }

      // Qualifying Paid sales
      if (isPaid) {
        totalVendorProductSales = moneyUtils.addMoney(totalVendorProductSales, itemAmount);

        if (isDelivered) {
          // Delivered: Commission is EARNED and Vendor Share is ELIGIBLE for settlement
          totalCommissionEarned = moneyUtils.addMoney(totalCommissionEarned, platformCommission);
          commissionEligibleForSettlement = moneyUtils.addMoney(commissionEligibleForSettlement, platformCommission);

          if (item.settlementStatus === 'PAID') {
            totalVendorPayoutsCompleted = moneyUtils.addMoney(totalVendorPayoutsCompleted, vendorShare);
          } else {
            totalVendorPayables = moneyUtils.addMoney(totalVendorPayables, vendorShare);
          }
        } else {
          // Paid but not yet delivered: Pending delivery
          commissionPendingDelivery = moneyUtils.addMoney(commissionPendingDelivery, platformCommission);
          pendingVendorProceeds = moneyUtils.addMoney(pendingVendorProceeds, vendorShare);
        }
      }
    });
  });

  // Calculate settlement status counts and amounts
  const settlements = await VendorSettlement.find({ createdAt: { $gte: start, $lte: end } }).lean();
  let amountEligibleForPayout = 0;
  let failedOrHeldPayouts = 0;
  const now = new Date();

  settlements.forEach((s) => {
    if (s.status === 'ELIGIBLE' && s.eligibleAt && new Date(s.eligibleAt) <= now) {
      amountEligibleForPayout = moneyUtils.addMoney(amountEligibleForPayout, s.netPayable || s.vendorPayoutAmount || 0);
    }
    if (['ON_HOLD', 'FAILED', 'BLOCKED'].includes(s.status)) {
      failedOrHeldPayouts = moneyUtils.addMoney(failedOrHeldPayouts, s.netPayable || s.vendorPayoutAmount || 0);
    }
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        range,
        startDate: start,
        endDate: end,
        metrics: {
          totalVerifiedCustomerPayments,
          totalEligibleProductSales: totalVendorProductSales,
          totalVendorProductSales,
          totalPlatformCommissionEarned: totalCommissionEarned,
          totalCommissionEarned,
          commissionPendingDelivery,
          commissionEligibleForSettlement,
          pendingVendorProceeds,
          amountEligibleForPayout,
          totalVendorPayables,
          totalVendorPayoutsCompleted,
          completedVendorPayouts: totalVendorPayoutsCompleted,
          failedOrHeldPayouts,
          totalRefundsReversals,
          effectiveRate: 5,
        },
      },
      'Commission overview metrics retrieved successfully'
    )
  );
});

// =========================================================================
// 2. SUPER ADMIN: COMMISSION TRANSACTIONS TABLE
// =========================================================================
export const getAdminCommissionTransactions = asyncWrapper(async (req, res) => {
  const {
    range = 'THIS_MONTH',
    startDate,
    endDate,
    vendorId,
    productName,
    orderId,
    paymentStatus,
    deliveryStatus,
    settlementStatus,
    page = 1,
    limit = 25,
    search,
  } = req.query;

  const { start, end } = parseDateRange(range, startDate, endDate);
  const query = { createdAt: { $gte: start, $lte: end } };

  if (paymentStatus && paymentStatus !== 'ALL') {
    query.paymentStatus = paymentStatus;
  }
  if (deliveryStatus && deliveryStatus !== 'ALL') {
    query.orderStatus = deliveryStatus;
  }
  if (orderId) {
    query.$or = [
      { orderNumber: { $regex: orderId, $options: 'i' } },
      { publicOrderId: { $regex: orderId, $options: 'i' } },
    ];
  }

  const orders = await Order.find(query)
    .populate('userId', 'name email phone')
    .populate('items.vendorId', 'storeName slug')
    .sort({ createdAt: -1 })
    .lean();

  const transactions = [];

  orders.forEach((order) => {
    order.items?.forEach((item) => {
      if (!item.vendorId) return; // Skip admin items

      const vId = item.vendorId._id ? item.vendorId._id.toString() : item.vendorId.toString();
      if (vendorId && vId !== vendorId.toString()) return;

      const pName = item.productNameSnapshot || item.name || '';
      if (productName && !pName.toLowerCase().includes(productName.toLowerCase())) return;

      if (search) {
        const s = search.toLowerCase();
        const matches =
          (order.orderNumber && order.orderNumber.toLowerCase().includes(s)) ||
          pName.toLowerCase().includes(s) ||
          (order.userId?.name && order.userId.name.toLowerCase().includes(s)) ||
          (item.vendorId?.storeName && item.vendorId.storeName.toLowerCase().includes(s));
        if (!matches) return;
      }

      const itemEligible = item.lineTotal || (item.unitPrice || 0) * (item.quantity || 1);
      const commissionRate = typeof item.commissionRate === 'number' ? item.commissionRate : ((item.quantity || 1) * 5);
      const platformCommission = typeof item.platformCommission === 'number'
        ? item.platformCommission
        : platformCommissionService.calculate(itemEligible, item.quantity || 1).platformCommission;
      const vendorShare = typeof item.vendorShare === 'number'
        ? item.vendorShare
        : platformCommissionService.calculate(itemEligible, item.quantity || 1).vendorShare;

      // Determine real-time settlement status
      let sStatus = item.settlementStatus || 'PENDING_DELIVERY';
      if (order.orderStatus === 'CANCELLED') sStatus = 'CANCELLED';
      else if (order.paymentStatus === 'REFUNDED' || order.orderStatus === 'REFUNDED') sStatus = 'REVERSED';
      else if (item.settlementStatus === 'PAID') sStatus = 'PAID';
      else if (order.orderStatus === 'DELIVERED' && (order.paymentStatus === 'PAID' || order.paymentMethod === 'COD')) {
        sStatus = 'ELIGIBLE';
      }

      if (settlementStatus && settlementStatus !== 'ALL' && sStatus !== settlementStatus) {
        return;
      }

      transactions.push({
        _id: `${order._id}_${item._id}`,
        orderId: order._id,
        orderItemId: item._id,
        orderNumber: order.orderNumber,
        publicOrderId: order.publicOrderId,
        orderDate: order.createdAt,
        deliveryDate: item.deliveredAt || (order.orderStatus === 'DELIVERED' ? order.updatedAt : null),
        customerName: order.userId?.name || 'Customer',
        customerEmail: order.userId?.email || '',
        vendorId: vId,
        vendorName: item.vendorId?.storeName || 'Vendor',
        productId: item.productId,
        productName: pName,
        sku: item.skuSnapshot || item.variantSku || 'N/A',
        quantity: item.quantity,
        unitPrice: item.unitPrice || item.price,
        eligibleSaleAmount: itemEligible,
        commissionRate,
        platformCommission,
        vendorShare,
        paymentStatus: order.paymentStatus,
        deliveryStatus: order.orderStatus,
        settlementStatus: sStatus,
        transactionReference: order.paymentId || `TXN-${order.orderNumber}`,
        payoutReference: item.payoutReference || '',
      });
    });
  });

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 25;
  const total = transactions.length;
  const startIndex = (pageNum - 1) * limitNum;
  const paginated = transactions.slice(startIndex, startIndex + limitNum);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        transactions: paginated,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum) || 1,
        },
      },
      'Commission transactions retrieved'
    )
  );
});

// =========================================================================
// 3. SUPER ADMIN: VENDOR-WISE COMMISSIONS SUMMARY
// =========================================================================
export const getAdminVendorCommissionsSummary = asyncWrapper(async (req, res) => {
  const { range = 'THIS_MONTH', startDate, endDate } = req.query;
  const { start, end } = parseDateRange(range, startDate, endDate);

  const orders = await Order.find({ createdAt: { $gte: start, $lte: end } })
    .populate('items.vendorId', 'storeName slug phone email')
    .lean();

  const vendorMap = new Map();

  orders.forEach((order) => {
    if (order.orderStatus === 'CANCELLED') return;
    const isPaid = order.paymentStatus === 'PAID' || (order.paymentMethod === 'COD' && order.orderStatus === 'DELIVERED');
    const isDelivered = order.orderStatus === 'DELIVERED';

    order.items?.forEach((item) => {
      if (!item.vendorId) return;
      const vId = item.vendorId._id ? item.vendorId._id.toString() : item.vendorId.toString();

      if (!vendorMap.has(vId)) {
        vendorMap.set(vId, {
          vendorId: vId,
          storeName: item.vendorId?.storeName || 'Vendor',
          email: item.vendorId?.email || '',
          totalOrders: new Set(),
          totalUnits: 0,
          grossSales: 0,
          platformCommissionTotal: 0,
          vendorEarningsTotal: 0,
          pendingCommission: 0,
          eligiblePayable: 0,
          paidOutTotal: 0,
        });
      }

      const vRec = vendorMap.get(vId);
      const itemEligible = item.lineTotal || (item.unitPrice || 0) * (item.quantity || 1);
      const platformCommission = typeof item.platformCommission === 'number'
        ? item.platformCommission
        : platformCommissionService.calculate(itemEligible, item.quantity || 1).platformCommission;
      const vendorShare = typeof item.vendorShare === 'number'
        ? item.vendorShare
        : platformCommissionService.calculate(itemEligible, item.quantity || 1).vendorShare;

      if (isPaid) {
        vRec.totalOrders.add(order._id.toString());
        vRec.totalUnits += item.quantity || 1;
        vRec.grossSales = moneyUtils.addMoney(vRec.grossSales, itemEligible);
        vRec.platformCommissionTotal = moneyUtils.addMoney(vRec.platformCommissionTotal, platformCommission);
        vRec.vendorEarningsTotal = moneyUtils.addMoney(vRec.vendorEarningsTotal, vendorShare);

        if (isDelivered) {
          if (item.settlementStatus === 'PAID') {
            vRec.paidOutTotal = moneyUtils.addMoney(vRec.paidOutTotal, vendorShare);
          } else {
            vRec.eligiblePayable = moneyUtils.addMoney(vRec.eligiblePayable, vendorShare);
          }
        } else {
          vRec.pendingCommission = moneyUtils.addMoney(vRec.pendingCommission, platformCommission);
        }
      }
    });
  });

  const list = Array.from(vendorMap.values()).map((v) => ({
    ...v,
    totalOrders: v.totalOrders.size,
  }));

  return res.status(200).json(
    new ApiResponse(200, { vendors: list }, 'Vendor commissions summary retrieved')
  );
});

// =========================================================================
// 4. SUPER ADMIN: SETTLEMENTS LEDGER & ACTIONS
// =========================================================================
export const getAdminSettlements = asyncWrapper(async (req, res) => {
  const { status, vendorId, page = 1, limit = 25 } = req.query;

  const query = {};
  if (status && status !== 'ALL') {
    query.status = status;
  }
  if (vendorId) {
    query.vendorId = vendorId;
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 25;

  const settlements = await VendorSettlement.find(query)
    .populate('vendorId', 'storeName slug phone email balance')
    .populate({
      path: 'suborderId',
      select: 'subOrderNumber items status grandTotal deliveredAt parentOrderId',
    })
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .lean();

  const total = await VendorSettlement.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        settlements,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum) || 1,
        },
      },
      'Vendor settlements retrieved'
    )
  );
});

export const approveAdminSettlement = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const settlement = await VendorSettlement.findById(id);
  if (!settlement) {
    throw new ApiError(404, 'Settlement record not found');
  }

  settlement.status = 'PROCESSING';
  await settlement.save();

  return res.status(200).json(new ApiResponse(200, settlement, 'Settlement approved for processing'));
});

export const processAdminSettlementPayout = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { payoutReference, notes } = req.body;

  const updatedSettlement = await platformCommissionService.processVendorPayout(id, {
    payoutReference,
    notes,
    processedBy: req.user._id,
  });

  return res.status(200).json(
    new ApiResponse(200, updatedSettlement, 'Vendor payout successfully recorded and paid')
  );
});

// =========================================================================
// 5. SUPER ADMIN: EXPORT COMMISSIONS CSV
// =========================================================================
export const exportAdminCommissionsCsv = asyncWrapper(async (req, res) => {
  const { range = 'THIS_MONTH', startDate, endDate } = req.query;
  const { start, end } = parseDateRange(range, startDate, endDate);

  const orders = await Order.find({ createdAt: { $gte: start, $lte: end } })
    .populate('userId', 'name email phone')
    .populate('items.vendorId', 'storeName slug')
    .sort({ createdAt: -1 })
    .lean();

  let csv = 'Order ID,Order Date,Customer Name,Vendor Name,Product Name,Quantity,Unit Price (INR),Product Sale Amount (INR),Platform Commission Rate,Platform Commission (INR),Vendor Share (INR),Payment Status,Delivery Status,Settlement Status,Payout Reference\n';

  orders.forEach((order) => {
    order.items?.forEach((item) => {
      if (!item.vendorId) return;

      const itemEligible = item.lineTotal || (item.unitPrice || 0) * (item.quantity || 1);
      const commissionRate = typeof item.commissionRate === 'number' ? item.commissionRate : ((item.quantity || 1) * 5);
      const platformCommission = typeof item.platformCommission === 'number'
        ? item.platformCommission
        : platformCommissionService.calculate(itemEligible, item.quantity || 1).platformCommission;
      const vendorShare = typeof item.vendorShare === 'number'
        ? item.vendorShare
        : platformCommissionService.calculate(itemEligible, item.quantity || 1).vendorShare;

      let sStatus = item.settlementStatus || 'PENDING_DELIVERY';
      if (order.orderStatus === 'CANCELLED') sStatus = 'CANCELLED';
      else if (order.paymentStatus === 'REFUNDED') sStatus = 'REVERSED';
      else if (item.settlementStatus === 'PAID') sStatus = 'PAID';
      else if (order.orderStatus === 'DELIVERED' && order.paymentStatus === 'PAID') sStatus = 'ELIGIBLE';

      const row = [
        `"${order.orderNumber || ''}"`,
        `"${new Date(order.createdAt).toISOString()}"`,
        `"${order.userId?.name || 'Customer'}"`,
        `"${item.vendorId?.storeName || 'Vendor'}"`,
        `"${(item.productNameSnapshot || item.name || '').replace(/"/g, '""')}"`,
        item.quantity || 1,
        item.unitPrice || 0,
        itemEligible,
        `"${commissionRate}%"`,
        platformCommission,
        vendorShare,
        `"${order.paymentStatus}"`,
        `"${order.orderStatus}"`,
        `"${sStatus}"`,
        `"${item.payoutReference || ''}"`,
      ];
      csv += row.join(',') + '\n';
    });
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="baapoo_mart_commissions_${Date.now()}.csv"`);
  return res.status(200).send(csv);
});

// =========================================================================
// 6. VENDOR DASHBOARD: SALES & EARNINGS
// =========================================================================
export const getVendorEarnings = asyncWrapper(async (req, res) => {
  // Find vendor profile belonging to this user
  const vendor = await Vendor.findOne({ userId: req.user._id });
  if (!vendor) {
    throw new ApiError(404, 'Vendor profile not found for this account');
  }

  // Fetch all orders containing this vendor's products
  const orders = await Order.find({ 'items.vendorId': vendor._id })
    .populate('userId', 'name')
    .sort({ createdAt: -1 })
    .lean();

  let totalProductSales = 0;
  let totalPlatformCommission = 0;
  let earningsPendingDelivery = 0;
  let earningsEligibleForSettlement = 0;
  let totalAmountPaidOut = 0;
  let refundedReversedAmounts = 0;

  const orderItemsList = [];

  orders.forEach((order) => {
    const isPaid = order.paymentStatus === 'PAID' || (order.paymentMethod === 'COD' && order.orderStatus === 'DELIVERED');
    const isDelivered = order.orderStatus === 'DELIVERED';
    const isCancelled = order.orderStatus === 'CANCELLED';
    const isRefunded = order.paymentStatus === 'REFUNDED' || order.orderStatus === 'REFUNDED';

    order.items?.forEach((item) => {
      if (!item.vendorId || item.vendorId.toString() !== vendor._id.toString()) return;

      const itemEligible = item.lineTotal || (item.unitPrice || 0) * (item.quantity || 1);
      const platformCommission = typeof item.platformCommission === 'number'
        ? item.platformCommission
        : platformCommissionService.calculate(itemEligible, item.quantity || 1).platformCommission;
      const vendorShare = typeof item.vendorShare === 'number'
        ? item.vendorShare
        : platformCommissionService.calculate(itemEligible, item.quantity || 1).vendorShare;

      let sStatus = item.settlementStatus || 'PENDING_DELIVERY';
      if (isCancelled) sStatus = 'CANCELLED';
      else if (isRefunded) sStatus = 'REVERSED';
      else if (item.settlementStatus === 'PAID') sStatus = 'PAID';
      else if (isDelivered && isPaid) sStatus = 'ELIGIBLE';

      if (isCancelled || isRefunded) {
        refundedReversedAmounts = moneyUtils.addMoney(refundedReversedAmounts, itemEligible);
      } else if (isPaid) {
        totalProductSales = moneyUtils.addMoney(totalProductSales, itemEligible);
        totalPlatformCommission = moneyUtils.addMoney(totalPlatformCommission, platformCommission);

        if (isDelivered) {
          if (sStatus === 'PAID') {
            totalAmountPaidOut = moneyUtils.addMoney(totalAmountPaidOut, vendorShare);
          } else {
            earningsEligibleForSettlement = moneyUtils.addMoney(earningsEligibleForSettlement, vendorShare);
          }
        } else {
          earningsPendingDelivery = moneyUtils.addMoney(earningsPendingDelivery, vendorShare);
        }
      }

      orderItemsList.push({
        _id: `${order._id}_${item._id}`,
        orderId: order._id,
        orderNumber: order.orderNumber,
        productName: item.productNameSnapshot || item.name,
        sku: item.skuSnapshot || item.variantSku || 'N/A',
        quantity: item.quantity,
        productSaleAmount: itemEligible,
        platformFee: platformCommission,
        vendorEarnings: vendorShare,
        paymentStatus: order.paymentStatus,
        deliveryStatus: order.orderStatus,
        settlementStatus: sStatus,
        orderDate: order.createdAt,
        deliveredAt: item.deliveredAt,
      });
    });
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        metrics: {
          totalProductSales,
          totalPlatformCommission,
          earningsPendingDelivery,
          earningsEligibleForSettlement,
          totalAmountPaidOut,
          currentPayableBalance: earningsEligibleForSettlement,
          refundedReversedAmounts,
          commissionRate: 5,
        },
        items: orderItemsList,
      },
      'Vendor sales and earnings retrieved successfully'
    )
  );
});

// =========================================================================
// 8. SUPER ADMIN: PRODUCT-WISE COMMISSION BREAKDOWN
// =========================================================================
export const getAdminProductCommissionsSummary = asyncWrapper(async (req, res) => {
  const { range = 'THIS_MONTH', startDate, endDate } = req.query;
  const { start, end } = parseDateRange(range, startDate, endDate);

  const orders = await Order.find({ createdAt: { $gte: start, $lte: end } })
    .populate('items.vendorId', 'storeName slug')
    .populate('items.productId', 'name sku images')
    .lean();

  const productMap = new Map();

  orders.forEach((order) => {
    if (order.orderStatus === 'CANCELLED') return;
    const isPaid = order.paymentStatus === 'PAID' || (order.paymentMethod === 'COD' && order.orderStatus === 'DELIVERED');

    order.items?.forEach((item) => {
      if (!item.vendorId) return;
      const pId = item.productId?._id ? item.productId._id.toString() : (item.productId?.toString() || item.skuSnapshot);

      if (!productMap.has(pId)) {
        productMap.set(pId, {
          productId: pId,
          productName: item.productNameSnapshot || item.productId?.name || item.name || 'Product',
          sku: item.skuSnapshot || item.productId?.sku || 'N/A',
          vendorId: item.vendorId?._id || item.vendorId,
          vendorName: item.vendorId?.storeName || 'Vendor',
          image: item.productImageSnapshot || item.productId?.images?.[0] || item.image || '',
          unitPrice: item.unitPrice || item.price,
          totalUnitsSold: 0,
          grossSales: 0,
          commissionRate: 5,
          platformCommission: 0,
          vendorProceeds: 0,
        });
      }

      if (isPaid) {
        const pRec = productMap.get(pId);
        const qty = item.quantity || 1;
        const lineTotal = item.lineTotal || (item.unitPrice || item.price || 0) * qty;
        const lineCalc = platformCommissionService.calculateLine(item.unitPrice || item.price, qty);

        pRec.totalUnitsSold += qty;
        pRec.grossSales = moneyUtils.addMoney(pRec.grossSales, lineTotal);
        pRec.platformCommission = moneyUtils.addMoney(pRec.platformCommission, lineCalc.platformCommission);
        pRec.vendorProceeds = moneyUtils.addMoney(pRec.vendorProceeds, lineCalc.vendorProceeds);
      }
    });
  });

  const products = Array.from(productMap.values()).sort((a, b) => b.grossSales - a.grossSales);

  return res.status(200).json(
    new ApiResponse(200, { products }, 'Product-wise commission breakdown retrieved')
  );
});
