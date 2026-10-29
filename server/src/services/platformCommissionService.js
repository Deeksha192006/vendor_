import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { VendorOrder } from '../models/VendorOrder.js';
import { Vendor } from '../models/Vendor.js';
import { VendorSettlement } from '../models/VendorSettlement.js';
import { VendorReferralCommission } from '../models/VendorReferralCommission.js';
import { Commission } from '../models/Commission.js';
import { VendorLedger } from '../models/VendorLedger.js';
import { PlatformLedger } from '../models/PlatformLedger.js';
import { User } from '../models/User.js';
import { moneyUtils } from '../utils/moneyUtils.js';

const FIXED_COMMISSION_PERCENT = 5; // Fixed 5% Platform Commission
const FIXED_REFERRAL_COMMISSION_PERCENT = 3; // Fixed 3% Direct Vendor Referral Commission

export const platformCommissionService = {
  /**
   * Helper: Resolves the unique direct referrer vendor for a given vendor.
   * Strictly enforces One-to-One relationship (no multi-level).
   * Prevents self-referral and circular loops.
   */
  async getDirectReferrerVendor(vendorId, sessionArg = null) {
    if (!vendorId) return null;
    const session = sessionArg && typeof sessionArg.inTransaction === 'function' ? sessionArg : null;
    const vendorIdStr = vendorId._id ? vendorId._id.toString() : vendorId.toString();

    let query = Vendor.findById(vendorIdStr);
    if (session) query = query.session(session);
    const vendor = await query;
    if (!vendor) return null;

    // 1. Direct field on Vendor
    if (vendor.referredByVendorId) {
      const refVIdStr = vendor.referredByVendorId.toString();
      if (refVIdStr !== vendorIdStr) {
        let refQuery = Vendor.findById(refVIdStr);
        if (session) refQuery = refQuery.session(session);
        const refVendor = await refQuery;
        if (refVendor && refVendor._id.toString() !== vendorIdStr) {
          // Check circular loop: does refVendor point back to vendor?
          if (refVendor.referredByVendorId && refVendor.referredByVendorId.toString() === vendorIdStr) {
            return null;
          }
          return refVendor;
        }
      }
    }

    // 2. Direct field on User
    if (vendor.userId) {
      const vendorUserIdStr = vendor.userId.toString();
      let uQuery = User.findById(vendorUserIdStr);
      if (session) uQuery = uQuery.session(session);
      const user = await uQuery;

      if (user && user.referredBy) {
        const referrerUserIdStr = user.referredBy.toString();
        if (referrerUserIdStr !== vendorUserIdStr) {
          let refVQuery = Vendor.findOne({ userId: referrerUserIdStr });
          if (session) refVQuery = refVQuery.session(session);
          const refVendor = await refVQuery;
          if (refVendor && refVendor._id.toString() !== vendorIdStr) {
            // Check circular loop
            if (refVendor.referredByVendorId && refVendor.referredByVendorId.toString() === vendorIdStr) {
              return null;
            }
            if (!vendor.referredByVendorId) {
              vendor.referredByVendorId = refVendor._id;
              vendor.referredByUserId = user.referredBy;
              await vendor.save(session ? { session } : {});
            }
            return refVendor;
          }
        }
      }

      // 3. Direct record in ReferralRelationship (referralType: 'VENDOR')
      const { ReferralRelationship } = await import('../models/ReferralRelationship.js');
      let relQuery = ReferralRelationship.findOne({ referredUserId: vendor.userId, referralType: 'VENDOR' });
      if (session) relQuery = relQuery.session(session);
      const rel = await relQuery;

      if (rel && rel.referrerId) {
        const relRefUserIdStr = rel.referrerId.toString();
        if (relRefUserIdStr !== vendorUserIdStr) {
          let refVQuery = Vendor.findOne({ userId: relRefUserIdStr });
          if (session) refVQuery = refVQuery.session(session);
          const refVendor = await refVQuery;
          if (refVendor && refVendor._id.toString() !== vendorIdStr) {
            // Check circular loop
            if (refVendor.referredByVendorId && refVendor.referredByVendorId.toString() === vendorIdStr) {
              return null;
            }
            if (!vendor.referredByVendorId) {
              vendor.referredByVendorId = refVendor._id;
              vendor.referredByUserId = rel.referrerId;
              await vendor.save(session ? { session } : {});
            }
            return refVendor;
          }
        }
      }
    }

    return null;
  },

  /**
   * Fixed 5% Platform Commission + Additional 3% Direct Vendor Referral Commission:
   * - Platform commission per eligible product line = 5% of that line's eligible selling-price amount (UNCHANGED)
   * - Referral commission per eligible product line = 3% of that line's eligible selling-price amount (if has direct referrer)
   * - Vendor proceeds = lineAmount - platformCommission - referralCommission (92% if referred, 95% if not referred)
   */
  calculateLine(unitSellingPrice, quantity = 1, hasReferrer = false) {
    const unitPrice = Number(unitSellingPrice) || 0;
    const qty = Math.max(1, Number(quantity) || 1);
    const lineAmount = moneyUtils.roundMoney(unitPrice * qty);
    const commissionRate = FIXED_COMMISSION_PERCENT; // Fixed 5% Platform Commission
    const referralRate = hasReferrer ? FIXED_REFERRAL_COMMISSION_PERCENT : 0; // Additional 3% Direct Referral

    if (lineAmount <= 0) {
      return {
        unitPrice,
        quantity: qty,
        lineAmount: 0,
        commissionRate,
        platformCommission: 0,
        referralRate,
        referralCommission: 0,
        vendorProceeds: 0,
        vendorShare: 0,
      };
    }

    const platformCommission = moneyUtils.calculatePercentage(lineAmount, commissionRate);
    const referralCommission = hasReferrer ? moneyUtils.calculatePercentage(lineAmount, referralRate) : 0;
    const vendorProceeds = moneyUtils.subtractMoney(moneyUtils.subtractMoney(lineAmount, platformCommission), referralCommission);

    return {
      unitPrice,
      quantity: qty,
      lineAmount,
      commissionRate,
      platformCommissionRate: commissionRate,
      platformCommission,
      referralRate,
      referralCommissionRate: referralRate,
      referralCommission,
      vendorProceeds,
      vendorShare: vendorProceeds,
      vendorShareRate: hasReferrer ? 92 : 95,
    };
  },

  /**
   * Pure calculation: Fixed 5% Platform Commission + Optional 3% Direct Vendor Referral
   */
  calculate(amount, units = 1, hasReferrer = false) {
    const saleAmount = Number(amount) || 0;
    const unitCount = Number(units) >= 0 ? Number(units) : 1;
    const commissionRate = FIXED_COMMISSION_PERCENT; // Fixed 5% platform commission
    const referralRate = hasReferrer ? FIXED_REFERRAL_COMMISSION_PERCENT : 0; // Additional 3% referral commission

    if (saleAmount <= 0) {
      return {
        saleAmount: Math.max(0, saleAmount),
        units: unitCount,
        commissionRate,
        platformCommissionRate: commissionRate,
        platformCommission: 0,
        referralRate,
        referralCommissionRate: referralRate,
        referralCommission: 0,
        vendorShare: Math.max(0, saleAmount),
        vendorPayout: Math.max(0, saleAmount),
        vendorShareRate: hasReferrer ? 92 : 95,
      };
    }

    const platformCommission = moneyUtils.calculatePercentage(saleAmount, commissionRate);
    const referralCommission = hasReferrer ? moneyUtils.calculatePercentage(saleAmount, referralRate) : 0;
    const vendorShare = moneyUtils.subtractMoney(moneyUtils.subtractMoney(saleAmount, platformCommission), referralCommission);

    return {
      saleAmount,
      units: unitCount,
      commissionRate,
      platformCommissionRate: commissionRate,
      platformCommission,
      referralRate,
      referralCommissionRate: referralRate,
      referralCommission,
      vendorShare,
      vendorPayout: vendorShare,
      vendorShareRate: hasReferrer ? 92 : 95,
    };
  },

  /**
   * Called when order is placed or paid.
   * Snapshots fixed 5% commission on each eligible product line in PENDING_DELIVERY status.
   */
  async recordOrderCommission(orderId, sessionArg = null) {
    const session = sessionArg && typeof sessionArg.inTransaction === 'function' ? sessionArg : null;
    const opts = session ? { session } : {};

    let orderQuery = Order.findById(orderId);
    if (session) orderQuery = orderQuery.session(session);
    const order = await orderQuery;
    if (!order) return;

    let adminQuery = User.findOne({ role: 'SUPER_ADMIN' });
    if (session) adminQuery = adminQuery.session(session);
    const adminUser = await adminQuery;
    const adminUserId = adminUser ? adminUser._id : null;

    let subordersQuery = VendorOrder.find({ parentOrderId: orderId });
    if (session) subordersQuery = subordersQuery.session(session);
    const suborders = await subordersQuery;

    let orderUpdated = false;

    // Process each Vendor suborder and its eligible product lines
    for (const suborder of suborders) {
      const directReferrerVendor = await this.getDirectReferrerVendor(suborder.vendorId, session);
      const hasReferrer = Boolean(directReferrerVendor);

      let suborderCommission = 0;
      let suborderReferralCommission = 0;
      let suborderVendorShare = 0;
      let suborderGross = 0;
      let suborderUnits = 0;

      // Calculate line-by-line: fixed 5% platform commission + 3% direct vendor referral commission (if has direct referrer)
      order.items?.forEach((item) => {
        if (item.vendorId && item.vendorId.toString() === suborder.vendorId.toString()) {
          const lineCalc = this.calculateLine(item.unitPrice || item.price, item.quantity || 1, hasReferrer);
          item.commissionRate = 5;
          item.platformCommission = lineCalc.platformCommission;
          item.referralCommissionRate = lineCalc.referralRate;
          item.referralCommission = lineCalc.referralCommission;
          item.referrerVendorId = directReferrerVendor ? directReferrerVendor._id : null;
          item.vendorShare = lineCalc.vendorProceeds;
          item.paymentStatus = order.paymentStatus || 'PENDING';
          item.deliveryStatus = order.orderStatus || 'PENDING';
          if (!item.settlementStatus) {
            item.settlementStatus = 'PENDING_DELIVERY';
          }
          if (hasReferrer) {
            item.referralSettlementStatus = 'PENDING_DELIVERY';
          }

          suborderCommission = moneyUtils.addMoney(suborderCommission, lineCalc.platformCommission);
          suborderReferralCommission = moneyUtils.addMoney(suborderReferralCommission, lineCalc.referralCommission);
          suborderVendorShare = moneyUtils.addMoney(suborderVendorShare, lineCalc.vendorProceeds);
          suborderGross = moneyUtils.addMoney(suborderGross, lineCalc.lineAmount);
          suborderUnits += (item.quantity || 1);
          orderUpdated = true;
        }
      });

      const commissionRate = 5;
      const grossAmount = suborderGross || suborder.subtotal || suborder.itemsSubtotal || 0;
      const platformCommission = suborderCommission || moneyUtils.calculatePercentage(grossAmount, commissionRate);
      const referralCommission = suborderReferralCommission || (hasReferrer ? moneyUtils.calculatePercentage(grossAmount, 3) : 0);
      const vendorShare = suborderVendorShare || moneyUtils.subtractMoney(moneyUtils.subtractMoney(grossAmount, platformCommission), referralCommission);
      const eligibleUnits = suborderUnits || suborder.items?.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0) || 1;

      suborder.platformCommission = platformCommission;
      suborder.referrerVendorId = directReferrerVendor ? directReferrerVendor._id : null;
      suborder.referralCommissionRate = hasReferrer ? 3 : 0;
      suborder.referralCommission = referralCommission;
      suborder.referralSettlementStatus = hasReferrer ? 'PENDING_DELIVERY' : 'NONE';
      suborder.vendorEarning = vendorShare;
      suborder.commissionRate = commissionRate;
      suborder.eligibleItemCount = eligibleUnits;
      if (!suborder.settlementStatus) {
        suborder.settlementStatus = 'PENDING_DELIVERY';
      }
      await suborder.save(opts);

      // Create or update VendorSettlement in PENDING_DELIVERY status (7-day period starts on delivery)
      let settlementQuery = VendorSettlement.findOne({ suborderId: suborder._id });
      if (session) settlementQuery = settlementQuery.session(session);
      let settlement = await settlementQuery;

      const defaultHoldDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      if (!settlement) {
        await VendorSettlement.create(
          [
            {
              vendorId: suborder.vendorId,
              suborderId: suborder._id,
              grossAmount,
              orderValue: grossAmount,
              eligibleItemCount: eligibleUnits,
              commissionRate: 5,
              commissionAmount: platformCommission,
              vendorPayoutAmount: vendorShare,
              platformCommission,
              networkCommission: 0,
              otherDeductions: referralCommission,
              netPayable: vendorShare,
              status: 'PENDING_DELIVERY',
              settlementStatus: 'PENDING_DELIVERY',
              eligibleAt: defaultHoldDate,
            },
          ],
          opts
        );
      } else {
        settlement.grossAmount = grossAmount;
        settlement.orderValue = grossAmount;
        settlement.eligibleItemCount = eligibleUnits;
        settlement.commissionRate = 5;
        settlement.commissionAmount = platformCommission;
        settlement.vendorPayoutAmount = vendorShare;
        settlement.platformCommission = platformCommission;
        settlement.otherDeductions = referralCommission;
        settlement.netPayable = vendorShare;
        await settlement.save(opts);
      }

      // Record 3% Direct Vendor Referral Commission separately
      if (hasReferrer && referralCommission > 0) {
        let refCommQuery = VendorReferralCommission.findOne({
          orderId: order._id,
          suborderId: suborder._id,
          sellingVendorId: suborder.vendorId,
          referrerVendorId: directReferrerVendor._id,
        });
        if (session) refCommQuery = refCommQuery.session(session);
        let refComm = await refCommQuery;

        const isPaid = order.paymentStatus === 'PAID';

        if (!refComm) {
          await VendorReferralCommission.create(
            [
              {
                orderId: order._id,
                suborderId: suborder._id,
                sellingVendorId: suborder.vendorId,
                referrerVendorId: directReferrerVendor._id,
                referrerUserId: directReferrerVendor.userId,
                sellingUserId: suborder.userId || order.userId,
                eligibleSaleAmount: grossAmount,
                commissionRate: 3,
                commissionAmount: referralCommission,
                paymentVerificationStatus: isPaid ? 'VERIFIED' : 'PENDING',
                commissionStatus: 'PENDING_DELIVERY',
                settlementStatus: 'PENDING_DELIVERY',
                eligibleAt: defaultHoldDate,
              },
            ],
            opts
          );
        } else {
          refComm.eligibleSaleAmount = grossAmount;
          refComm.commissionAmount = referralCommission;
          if (isPaid) refComm.paymentVerificationStatus = 'VERIFIED';
          await refComm.save(opts);
        }

        // Commission record for Admin tracking
        let existingRefCommQuery = Commission.findOne({
          orderId: order._id,
          suborderId: suborder._id,
          type: 'VENDOR_DIRECT_REFERRAL_COMMISSION',
          recipientUserId: directReferrerVendor.userId,
        });
        if (session) existingRefCommQuery = existingRefCommQuery.session(session);
        let existingRefCommission = await existingRefCommQuery;

        if (!existingRefCommission) {
          await Commission.create(
            [
              {
                orderId: order._id,
                suborderId: suborder._id,
                type: 'VENDOR_DIRECT_REFERRAL_COMMISSION',
                recipientUserId: directReferrerVendor.userId,
                vendorId: directReferrerVendor._id,
                orderAmount: grossAmount,
                commissionPercentage: 3,
                commissionAmount: referralCommission,
                status: 'PENDING',
              },
            ],
            opts
          );
        } else {
          existingRefCommission.orderAmount = grossAmount;
          existingRefCommission.commissionPercentage = 3;
          existingRefCommission.commissionAmount = referralCommission;
          await existingRefCommission.save(opts);
        }
      }

      // Create or update Commission record for Admin tracking
      if (adminUserId && platformCommission > 0) {
        let existingCommQuery = Commission.findOne({
          orderId: order._id,
          suborderId: suborder._id,
          type: 'PLATFORM_COMMISSION',
        });
        if (session) existingCommQuery = existingCommQuery.session(session);
        const existingCommission = await existingCommQuery;

        if (!existingCommission) {
          await Commission.create(
            [
              {
                orderId: order._id,
                suborderId: suborder._id,
                type: 'PLATFORM_COMMISSION',
                recipientUserId: adminUserId,
                vendorId: suborder.vendorId,
                orderAmount: grossAmount,
                commissionPercentage: commissionRate,
                commissionAmount: platformCommission,
                status: 'PENDING',
              },
            ],
            opts
          );
        } else {
          existingCommission.orderAmount = grossAmount;
          existingCommission.commissionPercentage = commissionRate;
          existingCommission.commissionAmount = platformCommission;
          await existingCommission.save(opts);
        }
      }
    }

    if (orderUpdated) {
      await order.save(opts);
    }
  },

  /**
   * Called when order delivery is confirmed (status === 'DELIVERED').
   * Idempotently releases commission as earned and vendor share as eligible for settlement!
   */
  async onOrderDelivered(orderOrSuborderId, sessionArg = null) {
    const session = sessionArg && typeof sessionArg.inTransaction === 'function' ? sessionArg : null;
    const opts = session ? { session } : {};

    let order = await Order.findById(orderOrSuborderId);
    let suborders = [];

    if (order) {
      suborders = await VendorOrder.find({ parentOrderId: order._id });
    } else {
      const suborder = await VendorOrder.findById(orderOrSuborderId);
      if (suborder) {
        order = await Order.findById(suborder.parentOrderId);
        suborders = [suborder];
      }
    }

    if (!order) return;

    // For COD orders, successful delivery completes payment collection
    if (order.paymentMethod === 'COD' && order.paymentStatus !== 'PAID') {
      order.paymentStatus = 'PAID';
      await order.save(opts);
    }

    // Verify payment qualification (Paid or Confirmed COD)
    const isPaid = order.paymentStatus === 'PAID' || order.paymentMethod === 'COD';
    if (!isPaid) return;

    const deliveryTimestamp = new Date();
    // 7-day holding period strictly starts from verified delivery
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const settlementEligibleAt = new Date(deliveryTimestamp.getTime() + SEVEN_DAYS_MS);

    // 1. Update Order line items
    let orderChanged = false;
    order.items?.forEach((item) => {
      const isItemInSuborders = suborders.some(so => so.items.some(si => si.productId?.toString() === item.productId?.toString() || si._id?.toString() === item._id?.toString()));
      if (item.vendorId && (item.settlementStatus === 'PENDING_DELIVERY' || !item.settlementStatus) && isItemInSuborders) {
        item.settlementStatus = 'ELIGIBLE';
        item.deliveredAt = deliveryTimestamp;
        item.settlementDueDate = settlementEligibleAt;
        item.deliveryStatus = 'DELIVERED';
        if (item.referrerVendorId) {
          item.referralSettlementStatus = 'ELIGIBLE';
        }
        orderChanged = true;
      }
    });
    if (orderChanged) {
      await order.save(opts);
    }

    // 2. Update Suborders & Vendor Settlements
    for (const suborder of suborders) {
      const directReferrerVendor = await this.getDirectReferrerVendor(suborder.vendorId, session);
      const hasReferrer = Boolean(directReferrerVendor);

      const eligibleUnits = suborder.eligibleItemCount || suborder.items?.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0) || 1;
      const grossAmount = suborder.subtotal || suborder.itemsSubtotal || 0;
      const { commissionRate, platformCommission, referralRate, referralCommission, vendorShare } = this.calculate(grossAmount, eligibleUnits, hasReferrer);

      // Idempotency check: only transition if PENDING_DELIVERY or ON_HOLD
      if (['PENDING_DELIVERY', 'ON_HOLD', 'CONFIRMED', 'PROCESSING'].includes(suborder.settlementStatus) || !suborder.settlementStatus) {
        suborder.status = 'DELIVERED';
        suborder.settlementStatus = 'ELIGIBLE';
        suborder.deliveredAt = deliveryTimestamp;
        suborder.commissionRate = 5;
        suborder.eligibleItemCount = eligibleUnits;
        suborder.platformCommission = platformCommission;
        suborder.referrerVendorId = directReferrerVendor ? directReferrerVendor._id : null;
        suborder.referralCommissionRate = referralRate;
        suborder.referralCommission = referralCommission;
        suborder.referralSettlementStatus = hasReferrer ? 'ELIGIBLE' : 'NONE';
        suborder.vendorEarning = vendorShare;
        await suborder.save(opts);
      }

      // Update or create VendorSettlement
      let settlementQuery = VendorSettlement.findOne({ suborderId: suborder._id });
      if (session) settlementQuery = settlementQuery.session(session);
      let settlement = await settlementQuery;

      if (settlement) {
        if (['PENDING_DELIVERY', 'ON_HOLD', 'CONFIRMED', 'PROCESSING'].includes(settlement.status) || !settlement.status) {
          settlement.status = 'ELIGIBLE';
          settlement.settlementStatus = 'ELIGIBLE';
          settlement.eligibleAt = settlementEligibleAt; // 7-day holding period starting from verified delivery!
        }
        settlement.grossAmount = grossAmount;
        settlement.orderValue = grossAmount;
        settlement.eligibleItemCount = eligibleUnits;
        settlement.commissionRate = commissionRate;
        settlement.commissionAmount = platformCommission;
        settlement.vendorPayoutAmount = vendorShare;
        settlement.platformCommission = platformCommission;
        settlement.otherDeductions = referralCommission;
        settlement.netPayable = vendorShare;
        await settlement.save(opts);
      } else {
        await VendorSettlement.create(
          [
            {
              vendorId: suborder.vendorId,
              suborderId: suborder._id,
              grossAmount,
              orderValue: grossAmount,
              eligibleItemCount: eligibleUnits,
              commissionRate,
              commissionAmount: platformCommission,
              vendorPayoutAmount: vendorShare,
              platformCommission,
              networkCommission: 0,
              otherDeductions: referralCommission,
              netPayable: vendorShare,
              status: 'ELIGIBLE',
              settlementStatus: 'ELIGIBLE',
              eligibleAt: settlementEligibleAt,
            },
          ],
          opts
        );
      }

      // Update VendorReferralCommission and credit referrer vendor
      if (hasReferrer && referralCommission > 0) {
        let refComm = await VendorReferralCommission.findOne({
          suborderId: suborder._id,
          referrerVendorId: directReferrerVendor._id,
        });

        if (refComm) {
          refComm.paymentVerificationStatus = 'VERIFIED';
          refComm.commissionStatus = 'EARNED';
          refComm.settlementStatus = 'ELIGIBLE';
          refComm.deliveredAt = deliveryTimestamp;
          refComm.eligibleAt = settlementEligibleAt; // 7-day holding period starting from verified delivery!
          await refComm.save(opts);
        } else {
          await VendorReferralCommission.create(
            [
              {
                orderId: order._id,
                suborderId: suborder._id,
                sellingVendorId: suborder.vendorId,
                referrerVendorId: directReferrerVendor._id,
                referrerUserId: directReferrerVendor.userId,
                sellingUserId: suborder.userId || order.userId,
                eligibleSaleAmount: grossAmount,
                commissionRate: 3,
                commissionAmount: referralCommission,
                paymentVerificationStatus: 'VERIFIED',
                commissionStatus: 'EARNED',
                settlementStatus: 'ELIGIBLE',
                deliveredAt: deliveryTimestamp,
                eligibleAt: settlementEligibleAt,
              },
            ],
            opts
          );
        }

        // Credit direct referrer vendor's balance and add to VendorLedger
        let refVendorQuery = Vendor.findById(directReferrerVendor._id);
        if (session) refVendorQuery = refVendorQuery.session(session);
        const refVendor = await refVendorQuery;

        if (refVendor) {
          let existingRefLedger = await VendorLedger.findOne({
            suborderId: suborder._id,
            transactionType: 'VENDOR_REFERRAL_COMMISSION_EARNED',
          });

          if (!existingRefLedger) {
            const newRefBalance = moneyUtils.addMoney(refVendor.balance || 0, referralCommission);
            refVendor.balance = newRefBalance;
            await refVendor.save(opts);

            await VendorLedger.create(
              [
                {
                  vendorId: refVendor._id,
                  orderId: order._id,
                  suborderId: suborder._id,
                  transactionType: 'VENDOR_REFERRAL_COMMISSION_EARNED',
                  credit: referralCommission,
                  debit: 0,
                  balanceSnapshot: newRefBalance,
                  description: `3% Direct Vendor Referral Commission earned on delivered order ${order.orderNumber} (Referred Vendor: ${suborder.vendorNameSnapshot}, Gross ₹${grossAmount})`,
                },
              ],
              opts
            );
          }
        }

        // Update Commission record to PAID/EARNED
        await Commission.updateMany(
          { suborderId: suborder._id, type: 'VENDOR_DIRECT_REFERRAL_COMMISSION' },
          { $set: { status: 'PAID', commissionPercentage: 3, commissionAmount: referralCommission } },
          opts
        );
      }

      // Credit selling vendor payable balance upon delivery
      let vendorQuery = Vendor.findById(suborder.vendorId);
      if (session) vendorQuery = vendorQuery.session(session);
      const vendor = await vendorQuery;

      if (vendor) {
        // Check if ledger entry already exists to avoid duplicate credit
        let existingLedger = await VendorLedger.findOne({
          suborderId: suborder._id,
          transactionType: 'SALE_EARNED',
        });

        if (!existingLedger) {
          const newBalance = moneyUtils.addMoney(vendor.balance || 0, vendorShare);
          vendor.balance = newBalance;
          vendor.totalSales = moneyUtils.addMoney(vendor.totalSales || 0, grossAmount);
          await vendor.save(opts);

          await VendorLedger.create(
            [
              {
                vendorId: vendor._id,
                orderId: order._id,
                suborderId: suborder._id,
                transactionType: 'SALE_EARNED',
                credit: vendorShare,
                debit: 0,
                balanceSnapshot: newBalance,
                description: `Delivered sales earnings for order ${order.orderNumber} (Gross ₹${grossAmount} less ${commissionRate}% platform fee ₹${platformCommission}${hasReferrer ? ' and 3% referral fee ₹' + referralCommission : ''})`,
              },
            ],
            opts
          );
        }
      }

      // Update Commission record to PAID/EARNED
      await Commission.updateMany(
        { suborderId: suborder._id, type: 'PLATFORM_COMMISSION' },
        { $set: { status: 'PAID', commissionPercentage: commissionRate, commissionAmount: platformCommission } },
        opts
      );

      // Record earned commission in PlatformLedger idempotently
      if (platformCommission > 0) {
        const existingPlatformLedger = await PlatformLedger.findOne({
          sourceEntityId: order._id.toString(),
          'metadata.suborderId': suborder._id,
          type: 'ORDER_COMMISSION',
        });

        if (!existingPlatformLedger) {
          const latestPlatformRecord = await PlatformLedger.findOne().sort({ createdAt: -1 });
          const currentPlatformBalance = latestPlatformRecord?.balanceSnapshot || 0;
          const nextPlatformBalance = moneyUtils.addMoney(currentPlatformBalance, platformCommission);

          await PlatformLedger.create(
            [
              {
                transactionId: `PL-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
                type: 'ORDER_COMMISSION',
                sourceEntityType: 'ORDER',
                sourceEntityId: order._id.toString(),
                credit: platformCommission,
                debit: 0,
                balanceSnapshot: nextPlatformBalance,
                description: `${commissionRate}% Platform Commission earned on delivered order ${order.orderNumber} (${eligibleUnits} unit${eligibleUnits > 1 ? 's' : ''}, Vendor: ${suborder.vendorNameSnapshot})`,
                metadata: {
                  orderId: order._id,
                  vendorId: suborder.vendorId,
                  suborderId: suborder._id,
                  grossAmount,
                  eligibleUnits,
                  commissionRate,
                },
              },
            ],
            opts
          );
        }
      }
    }
  },

  /**
   * Called when order is cancelled.
   * Reverses settlement and commissions.
   */
  async onOrderCancelled(orderId, sessionArg = null) {
    const session = sessionArg && typeof sessionArg.inTransaction === 'function' ? sessionArg : null;
    const opts = session ? { session } : {};

    let orderQuery = Order.findById(orderId);
    if (session) orderQuery = orderQuery.session(session);
    const order = await orderQuery;
    if (!order) return;

    order.items?.forEach((item) => {
      if (item.vendorId) {
        item.settlementStatus = 'CANCELLED';
        if (item.referrerVendorId) {
          item.referralSettlementStatus = 'CANCELLED';
        }
      }
    });
    await order.save(opts);

    const suborders = await VendorOrder.find({ parentOrderId: orderId });
    for (const suborder of suborders) {
      suborder.status = 'CANCELLED';
      suborder.settlementStatus = 'CANCELLED';
      if (suborder.referrerVendorId) {
        suborder.referralSettlementStatus = 'CANCELLED';
      }
      await suborder.save(opts);

      await VendorSettlement.updateMany(
        { suborderId: suborder._id },
        { $set: { status: 'REVERSED', settlementStatus: 'REVERSED', notes: 'Order cancelled before settlement' } },
        opts
      );

      // Cancel referral commissions
      if (suborder.referrerVendorId) {
        let refComm = await VendorReferralCommission.findOne({
          suborderId: suborder._id,
          referrerVendorId: suborder.referrerVendorId,
        });

        if (refComm) {
          if (refComm.settlementStatus === 'PAID') {
            let refVendor = await Vendor.findById(suborder.referrerVendorId);
            if (refVendor) {
              const newBal = moneyUtils.subtractMoney(refVendor.balance || 0, refComm.commissionAmount, true);
              refVendor.balance = newBal;
              await refVendor.save(opts);

              await VendorLedger.create(
                [
                  {
                    vendorId: refVendor._id,
                    orderId: order._id,
                    suborderId: suborder._id,
                    transactionType: 'REFUND_REVERSAL',
                    credit: 0,
                    debit: refComm.commissionAmount,
                    balanceSnapshot: newBal,
                    description: `Referral commission reversed due to cancelled order ${order.orderNumber} (₹${refComm.commissionAmount})`,
                  },
                ],
                opts
              );
            }
          }
          refComm.commissionStatus = 'CANCELLED';
          refComm.settlementStatus = 'CANCELLED';
          await refComm.save(opts);
        }
      }

      await Commission.updateMany(
        { suborderId: suborder._id },
        { $set: { status: 'CANCELLED' } },
        opts
      );
    }
  },

  /**
   * Process settlement payout to selling vendor (Super Admin marks settlement as PAID).
   */
  async processVendorPayout(settlementId, { payoutReference, notes, processedBy }) {
    const settlement = await VendorSettlement.findById(settlementId).populate('vendorId');
    if (!settlement) {
      throw new Error('Settlement record not found');
    }

    if (settlement.status === 'PAID') {
      throw new Error('Settlement has already been paid out');
    }

    // 1. Verify 7-day holding period has elapsed
    const now = new Date();
    if (settlement.eligibleAt && new Date(settlement.eligibleAt) > now) {
      throw new Error(`Vendor payout is locked in 7-day holding period until ${new Date(settlement.eligibleAt).toISOString()}`);
    }

    // 2. Verify no hold, cancellation, dispute, or reversal prevents payout
    if (['CANCELLED', 'REVERSED', 'ON_HOLD', 'BLOCKED', 'FAILED'].includes(settlement.status)) {
      throw new Error(`Cannot release settlement in status: ${settlement.status}`);
    }

    // 3. Verify suborder and parent order status
    const suborder = await VendorOrder.findById(settlement.suborderId);
    if (suborder) {
      if (['CANCELLED', 'RETURNED', 'REFUNDED'].includes(suborder.status)) {
        throw new Error(`Cannot release payout: suborder is ${suborder.status}`);
      }
      const order = await Order.findById(suborder.parentOrderId);
      if (order) {
        if (['CANCELLED', 'REFUNDED'].includes(order.orderStatus) || order.paymentStatus === 'REFUNDED') {
          throw new Error('Cannot release payout: parent order is cancelled or refunded');
        }
        if (order.paymentStatus !== 'PAID' && order.paymentMethod !== 'COD') {
          throw new Error('Cannot release payout: customer payment is not verified');
        }
      }
    }

    const ref = payoutReference || `PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const paidTimestamp = new Date();

    settlement.status = 'PAID';
    settlement.settlementStatus = 'PAID';
    settlement.paidAt = paidTimestamp;
    settlement.payoutReference = ref;
    if (notes) settlement.notes = notes;
    await settlement.save();

    // Update VendorOrder
    await VendorOrder.findByIdAndUpdate(settlement.suborderId, {
      settlementStatus: 'PAID',
      settlementPaidAt: paidTimestamp,
      payoutReference: ref,
    });

    // Update Order line items
    if (settlement.suborderId) {
      const suborder = await VendorOrder.findById(settlement.suborderId);
      if (suborder?.parentOrderId) {
        await Order.updateOne(
          { _id: suborder.parentOrderId, 'items.vendorId': settlement.vendorId._id },
          {
            $set: {
              'items.$[elem].settlementStatus': 'PAID',
              'items.$[elem].settlementPaidAt': paidTimestamp,
              'items.$[elem].payoutReference': ref,
            },
          },
          {
            arrayFilters: [{ 'elem.vendorId': settlement.vendorId._id }],
          }
        );
      }
    }

    // Ledger record for payout deduction from balance
    if (settlement.vendorId) {
      const vendor = await Vendor.findById(settlement.vendorId._id || settlement.vendorId);
      if (vendor) {
        const remainingBalance = moneyUtils.subtractMoney(vendor.balance || 0, settlement.netPayable, true);
        vendor.balance = remainingBalance;
        await vendor.save();

        await VendorLedger.create({
          vendorId: vendor._id,
          suborderId: settlement.suborderId,
          transactionType: 'PAYOUT',
          credit: 0,
          debit: settlement.netPayable,
          balanceSnapshot: remainingBalance,
          description: `Vendor payout completed: Ref ${ref} (Net ₹${settlement.netPayable})`,
        });
      }
    }

    return settlement;
  },

  /**
   * Process 3% direct vendor referral commission payout (Super Admin marks referral payout as PAID).
   */
  async processVendorReferralPayout(referralCommissionId, { payoutReference, notes, processedBy } = {}) {
    const refComm = await VendorReferralCommission.findById(referralCommissionId)
      .populate('referrerVendorId')
      .populate('sellingVendorId');
    if (!refComm) {
      throw new Error('Referral commission record not found');
    }

    if (refComm.settlementStatus === 'PAID') {
      throw new Error('Referral commission has already been paid out');
    }

    // 1. Verify status
    if (['CANCELLED', 'REVERSED', 'ON_HOLD', 'BLOCKED', 'FAILED'].includes(refComm.settlementStatus)) {
      throw new Error(`Cannot release referral commission in status: ${refComm.settlementStatus}`);
    }

    // 2. Verify 7-day holding period has elapsed
    const now = new Date();
    if (refComm.eligibleAt && new Date(refComm.eligibleAt) > now) {
      throw new Error(`Referral commission payout is locked in 7-day holding period until ${new Date(refComm.eligibleAt).toISOString()}`);
    }

    // 3. Verify suborder & order status
    const suborder = await VendorOrder.findById(refComm.suborderId);
    if (suborder) {
      if (['CANCELLED', 'RETURNED', 'REFUNDED'].includes(suborder.status)) {
        throw new Error(`Cannot release referral payout: suborder is ${suborder.status}`);
      }
      const order = await Order.findById(suborder.parentOrderId);
      if (order) {
        if (['CANCELLED', 'REFUNDED'].includes(order.orderStatus) || order.paymentStatus === 'REFUNDED') {
          throw new Error('Cannot release referral payout: parent order is cancelled or refunded');
        }
        if (order.paymentStatus !== 'PAID' && order.paymentMethod !== 'COD') {
          throw new Error('Cannot release referral payout: customer payment is not verified');
        }
      }
    }

    const ref = payoutReference || `REF-PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const paidTimestamp = new Date();

    refComm.settlementStatus = 'PAID';
    refComm.paidAt = paidTimestamp;
    refComm.payoutReference = ref;
    if (notes) refComm.notes = notes;
    await refComm.save();

    // Update VendorOrder
    await VendorOrder.findByIdAndUpdate(refComm.suborderId, {
      referralSettlementStatus: 'PAID',
      referralSettlementPaidAt: paidTimestamp,
      referralPayoutReference: ref,
    });

    // Update Order line items
    if (refComm.suborderId) {
      const suborder = await VendorOrder.findById(refComm.suborderId);
      if (suborder?.parentOrderId) {
        await Order.updateOne(
          { _id: suborder.parentOrderId, 'items.referrerVendorId': refComm.referrerVendorId._id },
          {
            $set: {
              'items.$[elem].referralSettlementStatus': 'PAID',
              'items.$[elem].referralSettlementPaidAt': paidTimestamp,
              'items.$[elem].referralPayoutReference': ref,
            },
          },
          {
            arrayFilters: [{ 'elem.referrerVendorId': refComm.referrerVendorId._id }],
          }
        );
      }
    }

    // Ledger record for payout deduction from balance
    if (refComm.referrerVendorId) {
      const vendor = await Vendor.findById(refComm.referrerVendorId._id || refComm.referrerVendorId);
      if (vendor) {
        const remainingBalance = moneyUtils.subtractMoney(vendor.balance || 0, refComm.commissionAmount, true);
        vendor.balance = remainingBalance;
        await vendor.save();

        await VendorLedger.create({
          vendorId: vendor._id,
          suborderId: refComm.suborderId,
          orderId: refComm.orderId,
          transactionType: 'VENDOR_REFERRAL_PAYOUT',
          credit: 0,
          debit: refComm.commissionAmount,
          balanceSnapshot: remainingBalance,
          description: `Direct vendor referral commission payout completed: Ref ${ref} (Net ₹${refComm.commissionAmount})`,
        });
      }
    }

    return refComm;
  },
};

