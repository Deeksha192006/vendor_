import mongoose from 'mongoose';
import { Payment } from '../models/Payment.js';
import { Order } from '../models/Order.js';
import { WebhookEvent } from '../models/WebhookEvent.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';
import { env } from '../config/env.js';
import { fairCoinService } from './fairCoinService.js';
import { mlmRewardService } from './mlmRewardService.js';
import { notificationService } from './notificationService.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

export const paymentService = {
  async createPaymentOrder({ orderId, subscriptionId, customerSubscriptionId, userId }) {
    if (!orderId && !subscriptionId && !customerSubscriptionId) {
      throw new ApiError(400, 'Either orderId, subscriptionId, or customerSubscriptionId must be provided', ERROR_CODES.BAD_REQUEST);
    }

    let finalAmount = 0;
    let receiptId = '';

    if (orderId) {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new ApiError(404, 'Order not found', ERROR_CODES.NOT_FOUND);
      }
      if (order.userId.toString() !== userId.toString()) {
        throw new ApiError(403, 'Access denied: You do not own this order', ERROR_CODES.FORBIDDEN);
      }
      if (order.paymentStatus === 'PAID') {
        throw new ApiError(400, 'Order has already been paid', ERROR_CODES.BAD_REQUEST);
      }
      if (order.orderStatus === 'CANCELLED') {
        throw new ApiError(400, 'Order has been cancelled', ERROR_CODES.BAD_REQUEST);
      }
      finalAmount = order.total;
      receiptId = order._id.toString();
    } else if (customerSubscriptionId) {
      const { CustomerSubscription } = await import('../models/CustomerSubscription.js');
      const customerSub = await CustomerSubscription.findById(customerSubscriptionId).populate('planId');
      if (!customerSub) {
        throw new ApiError(404, 'Customer subscription request not found', ERROR_CODES.NOT_FOUND);
      }
      if (customerSub.customerId.toString() !== userId.toString()) {
        throw new ApiError(403, 'Access denied: You do not own this subscription', ERROR_CODES.FORBIDDEN);
      }
      finalAmount = customerSub.planId.price;
      receiptId = customerSub._id.toString();
    } else {
      const { Subscription } = await import('../models/Subscription.js');
      const { SubscriptionPlan } = await import('../models/SubscriptionPlan.js');
      const subscription = await Subscription.findById(subscriptionId).populate('planId');
      if (!subscription) {
        throw new ApiError(404, 'Subscription not found', ERROR_CODES.NOT_FOUND);
      }
      if (subscription.ownerUserId.toString() !== userId.toString()) {
        throw new ApiError(403, 'Access denied: You do not own this subscription', ERROR_CODES.FORBIDDEN);
      }
      finalAmount = subscription.planId.price;
      receiptId = subscription._id.toString();
    }

    if (finalAmount <= 0) {
      throw new ApiError(400, 'Invalid total: Amount must be greater than zero for Razorpay payments', ERROR_CODES.BAD_REQUEST);
    }

    const amountInPaise = Math.round(finalAmount * 100);

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: receiptId,
    };

    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create(options);
    } catch (err) {
      if (env.NODE_ENV === 'development' || env.RAZORPAY_KEY_ID === 'rzp_test_demo') {
        razorpayOrder = {
          id: `order_mock_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
          amount: amountInPaise,
          currency: 'INR',
        };
      } else {
        throw new ApiError(500, `Razorpay Order creation failed: ${err.message}`, ERROR_CODES.INTERNAL_SERVER_ERROR);
      }
    }

    let payment;
    if (orderId) {
      payment = await Payment.findOne({ orderId });
    } else if (customerSubscriptionId) {
      payment = await Payment.findOne({ customerSubscriptionId });
    } else {
      payment = await Payment.findOne({ subscriptionId });
    }

    if (payment) {
      payment.transactionId = razorpayOrder.id;
      payment.razorpayOrderId = razorpayOrder.id;
      payment.amount = finalAmount;
      payment.status = 'CREATED';
      await payment.save();
    } else {
      payment = await Payment.create({
        orderId: orderId || null,
        subscriptionId: subscriptionId || null,
        customerSubscriptionId: customerSubscriptionId || null,
        userId,
        paymentMethod: 'RAZORPAY',
        transactionId: razorpayOrder.id,
        razorpayOrderId: razorpayOrder.id,
        amount: finalAmount,
        currency: 'INR',
        status: 'CREATED',
      });
    }

    return {
      orderId: orderId || null,
      subscriptionId: subscriptionId || null,
      customerSubscriptionId: customerSubscriptionId || null,
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      keyId: env.RAZORPAY_KEY_ID,
    };
  },

  async verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    const isReplicaSet = Boolean(
      mongoose.connection?.client?.topology?.description?.setName ||
      ['ReplicaSetWithPrimary', 'Sharded'].includes(mongoose.connection?.client?.topology?.description?.type)
    );

    let session = null;
    let inTransaction = false;
    if (isReplicaSet) {
      try {
        session = await mongoose.startSession();
        session.startTransaction();
        inTransaction = true;
      } catch (_) {
        session = null;
        inTransaction = false;
      }
    }

    const withSession = (query) => (inTransaction && session ? query.session(session) : query);
    const sessionOption = (opts = {}) => (inTransaction && session ? { ...opts, session } : opts);
    const createOption = inTransaction && session ? { session } : undefined;

    try {
      const payment = await withSession(Payment.findOne({ razorpayOrderId }));
      if (!payment) {
        throw new ApiError(404, 'Payment record not found for this Razorpay order ID', ERROR_CODES.NOT_FOUND);
      }

      if (payment.status === 'CAPTURED' || payment.status === 'SUCCESS') {
        if (inTransaction && session) {
          await session.commitTransaction();
          session.endSession();
        }
        return payment;
      }

      const isMockDev = env.NODE_ENV === 'development' && (
        razorpayOrderId?.startsWith('order_mock_') || 
        razorpaySignature?.startsWith('mock_') ||
        env.RAZORPAY_KEY_ID === 'rzp_test_demo'
      );

      if (razorpaySignature !== 'webhook_verified' && !isMockDev) {
        const generatedSignature = crypto
          .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
          .update(`${payment.razorpayOrderId}|${razorpayPaymentId}`)
          .digest('hex');

        const gSigHash = crypto.createHash('sha256').update(generatedSignature).digest();
        const rSigHash = crypto.createHash('sha256').update(razorpaySignature).digest();

        const isSignatureValid = crypto.timingSafeEqual(gSigHash, rSigHash);

        if (!isSignatureValid) {
          payment.status = 'FAILED';
          payment.failureReason = 'Signature verification failed';
          await payment.save(sessionOption());
          throw new ApiError(400, 'Payment signature verification failed', ERROR_CODES.BAD_REQUEST);
        }
      }

      if (payment.customerSubscriptionId) {
        payment.status = 'CAPTURED';
        payment.razorpayPaymentId = razorpayPaymentId;
        payment.gatewaySignature = razorpaySignature;
        payment.verifiedAt = new Date();
        await payment.save(sessionOption());

        const { premiumService } = await import('./premiumService.js');
        await premiumService.activateSubscription(payment._id, inTransaction ? session : null);

        try {
          await notificationService.createNotification({
            userId: payment.userId,
            title: 'Premium Subscription Activated',
            message: `Your payment of ₹${payment.amount} for Premium subscription was processed successfully.`,
            type: 'PAYMENT_SUCCESS',
            link: '/account/subscription'
          }, { dedupeKey: `${payment._id}:PREMIUM_ACTIVATED` });
        } catch (err) {
          console.error('Customer premium notification failed:', err);
        }

        if (inTransaction && session) {
          await session.commitTransaction();
          session.endSession();
        }
        return payment;
      }

      if (payment.subscriptionId) {
        payment.status = 'CAPTURED';
        payment.razorpayPaymentId = razorpayPaymentId;
        payment.gatewaySignature = razorpaySignature;
        payment.verifiedAt = new Date();
        await payment.save(sessionOption());

        const { subscriptionService } = await import('./subscriptionService.js');
        await subscriptionService.activateSubscription(payment.subscriptionId, payment._id);

        try {
          await notificationService.createNotification({
            userId: payment.userId,
            title: 'Payment Successful',
            message: `Your payment of ₹${payment.amount} was processed successfully.`,
            type: 'PAYMENT_SUCCESS',
            link: '/account/wallet'
          }, { dedupeKey: `${payment._id}:PAYMENT_SUCCESS` });

          const { emailService } = await import('./emailService.js');
          await emailService.sendPaymentReceipt(payment, null);
        } catch (err) {
          console.error('Subscription payment notification/email failed:', err);
        }

        if (inTransaction && session) {
          await session.commitTransaction();
          session.endSession();
        }
        return payment;
      }

      const order = await withSession(Order.findById(payment.orderId));
      if (!order) {
        throw new ApiError(404, 'Order not found for this payment record', ERROR_CODES.NOT_FOUND);
      }

      if (order.paymentStatus === 'PAID') {
        payment.status = 'CAPTURED';
        payment.razorpayPaymentId = razorpayPaymentId;
        payment.gatewaySignature = razorpaySignature;
        payment.verifiedAt = new Date();
        await payment.save(sessionOption());

        if (inTransaction && session) {
          await session.commitTransaction();
          session.endSession();
        }
        return payment;
      }

      payment.status = 'CAPTURED';
      payment.razorpayPaymentId = razorpayPaymentId;
      payment.gatewaySignature = razorpaySignature;
      payment.verifiedAt = new Date();
      await payment.save(sessionOption());

      order.paymentStatus = 'PAID';
      order.orderStatus = 'CONFIRMED';
      order.paymentId = razorpayPaymentId;
      await order.save(sessionOption());

      try {
        await notificationService.createNotification({
          userId: payment.userId,
          title: 'Payment Successful',
          message: `Your payment of ₹${(payment.amount / 100).toFixed(2)} for Order #${order.orderNumber} was processed successfully.`,
          type: 'PAYMENT_SUCCESS',
          link: `/account/orders/${order._id}`
        }, { dedupeKey: `${payment._id}:PAYMENT_SUCCESS` });

        await notificationService.createNotification({
          userId: order.userId,
          title: 'Order Confirmed',
          message: `Your order #${order.orderNumber} has been confirmed and is being processed.`,
          type: 'ORDER_CONFIRMED',
          link: `/account/orders/${order._id}`
        }, { dedupeKey: `${order._id}:ORDER_CONFIRMED` });

        const { emailService } = await import('./emailService.js');
        await emailService.sendPaymentReceipt(payment, order);
        await emailService.sendOrderConfirmation(order);
      } catch (err) {
        console.error('Order payment success notifications/emails failed:', err);
      }

      const { VendorOrder } = await import('../models/VendorOrder.js');
      const { Product } = await import('../models/Product.js');
      const { Vendor } = await import('../models/Vendor.js');
      const { Cart } = await import('../models/Cart.js');

      const itemsByVendor = {};
      for (const item of order.items) {
        const vId = item.vendorId ? item.vendorId.toString() : 'SUPER_ADMIN';
        if (!itemsByVendor[vId]) itemsByVendor[vId] = [];
        itemsByVendor[vId].push(item);
      }

      let vendorIndex = 1;
      for (const [vendorId, vItems] of Object.entries(itemsByVendor)) {
        const vSubtotal = vItems.reduce((acc, i) => acc + i.price * i.quantity, 0);

        if (vendorId === 'SUPER_ADMIN') {
          for (const item of vItems) {
            const updatedProduct = await Product.findOneAndUpdate(
              {
                _id: item.productId,
                stock: { $gte: item.quantity },
                isDeleted: false,
                status: { $in: ['APPROVED', 'ACTIVE'] },
              },
              {
                $inc: { stock: -item.quantity, soldCount: item.quantity },
              },
              sessionOption({ new: true })
            );

            if (!updatedProduct) {
              throw new ApiError(
                400,
                `Insufficient stock for product "${item.productNameSnapshot || item.name || 'item'}". It is sold out or has fewer than ${item.quantity} available.`,
                ERROR_CODES.BAD_REQUEST
              );
            }

            const { StockTransaction } = await import('../models/StockTransaction.js');
            await StockTransaction.create([{
              productId: item.productId,
              orderId: order._id,
              quantityChange: -item.quantity,
              transactionType: 'PURCHASE'
            }], createOption);
          }
          continue;
        }

        const existingSuborder = await withSession(VendorOrder.findOne({ parentOrderId: order._id, vendorId }));
        
        let suborderId = existingSuborder ? existingSuborder._id : null;

        if (!existingSuborder) {
          const vendor = await withSession(Vendor.findById(vendorId));
          const suborderNum = `${order.publicOrderId || order.orderNumber}-V${String(vendorIndex).padStart(2, '0')}`;
          
          const vendorTotalUnits = vItems.reduce((acc, i) => acc + (Number(i.quantity) || 1), 0);
          const { platformCommissionService } = await import('./platformCommissionService.js');
          const directReferrerVendor = await platformCommissionService.getDirectReferrerVendor(vendorId, inTransaction ? session : null);
          const hasReferrer = Boolean(directReferrerVendor);

          const { commissionRate, platformCommission, referralRate, referralCommission, vendorShare } = platformCommissionService.calculate(
            vSubtotal,
            vendorTotalUnits,
            hasReferrer
          );

          const newSuborders = await VendorOrder.create([{
            publicSuborderId: suborderNum,
            subOrderNumber: suborderNum,
            parentOrderId: order._id,
            vendorId,
            vendorNameSnapshot: vendor?.storeName || 'Vendor',
            businessNameSnapshot: vendor?.businessName || 'Business',
            userId: order.userId,
            items: vItems,
            subtotal: vSubtotal,
            itemsSubtotal: vSubtotal,
            taxTotal: 0,
            discountTotal: 0,
            shippingTotal: 0,
            grandTotal: vSubtotal,
            commissionRate,
            eligibleItemCount: vendorTotalUnits,
            platformCommission,
            referrerVendorId: directReferrerVendor ? directReferrerVendor._id : null,
            referralCommissionRate: referralRate,
            referralCommission,
            referralSettlementStatus: hasReferrer ? 'PENDING_DELIVERY' : 'NONE',
            vendorEarning: vendorShare,
            status: 'CONFIRMED',
            settlementStatus: 'PENDING_DELIVERY',
          }], createOption);
          const newSuborder = newSuborders[0];
          suborderId = newSuborder._id;
          
          for (const item of vItems) {
            const updatedProduct = await Product.findOneAndUpdate(
              {
                _id: item.productId,
                stock: { $gte: item.quantity },
                isDeleted: false,
                status: 'APPROVED',
              },
              {
                $inc: { stock: -item.quantity },
              },
              sessionOption({ new: true })
            );

            if (!updatedProduct) {
              throw new ApiError(
                400,
                `Insufficient stock for product "${item.productNameSnapshot || item.name || 'item'}". It is sold out or has fewer than ${item.quantity} available.`,
                ERROR_CODES.BAD_REQUEST
              );
            }
            
            const { StockTransaction } = await import('../models/StockTransaction.js');
            await StockTransaction.create([{
              productId: item.productId,
              orderId: order._id,
              suborderId: suborderId,
              quantityChange: -item.quantity,
              transactionType: 'PURCHASE'
            }], createOption);
          }
        }
        vendorIndex++;
      }

      const { financeService } = await import('./financeService.js');
      await financeService.allocateOrderFinances(order._id, inTransaction ? session : null);

      const { fulfillmentService } = await import('./fulfillmentService.js');
      await fulfillmentService.createFulfillmentForOrder(order._id);

      if (order.fairCoinsUsed > 0) {
        await fairCoinService.debitCoins({
          userId: order.userId,
          amount: order.fairCoinsUsed,
          type: 'DEBIT',
          source: 'ORDER_CHECKOUT_REDEMPTION',
          description: `Redeemed ${order.fairCoinsUsed} Fair Coins for order discount`,
        });
      }

      const cart = await withSession(Cart.findOne({ userId: order.userId }));
      if (cart) {
        const orderedProductIds = order.items
          .map((i) => (i.productId?._id ? i.productId._id.toString() : (i.productId ? i.productId.toString() : '')))
          .filter(Boolean);

        cart.items = cart.items.filter((item) => {
          const pId = item.productId?._id ? item.productId._id.toString() : (item.productId ? item.productId.toString() : '');
          return !pId || !orderedProductIds.includes(pId);
        });
        cart.couponCode = '';
        cart.discountAmount = 0;
        cart.fairCoinsUsed = 0;
        cart.coinDiscountAmount = 0;
        await cart.save(sessionOption());
      }

      await fairCoinService.processPurchaseReward(order.userId, order.orderNumber, order.total);
      await mlmRewardService.processPurchaseCommission(order.userId, order._id, order.total);

      if (inTransaction && session) {
        await session.commitTransaction();
        session.endSession();
      }

      return payment;
    } catch (error) {
      if (inTransaction && session) {
        await session.abortTransaction();
        session.endSession();
      }
      throw error;
    }
  },

  async getPaymentById(paymentId, user) {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new ApiError(404, 'Payment record not found', ERROR_CODES.NOT_FOUND);
    }

    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user.role);
    if (!isAdmin && payment.userId.toString() !== user._id.toString()) {
      throw new ApiError(403, 'Access denied: You do not own this payment record', ERROR_CODES.FORBIDDEN);
    }

    return payment;
  },

  async handleWebhook(rawBody, signature) {
    const isValid = Razorpay.validateWebhookSignature(
      rawBody,
      signature,
      env.RAZORPAY_WEBHOOK_SECRET
    );

    if (!isValid) {
      throw new ApiError(400, 'Invalid webhook signature', ERROR_CODES.BAD_REQUEST);
    }

    const event = JSON.parse(rawBody);
    const eventName = event.event;
    const eventId = event.id || `${eventName}_${event.payload?.payment?.entity?.id || Date.now()}`;

    // Webhook Idempotency Check & Atomic Registration (HIGH-02)
    let webhookRecord;
    try {
      webhookRecord = await WebhookEvent.create({
        eventId,
        gateway: 'RAZORPAY',
        eventType: eventName,
        status: 'RECEIVED',
      });
    } catch (err) {
      if (err.code === 11000) {
        // Event already processed or currently processing
        return { received: true, duplicate: true };
      }
      throw err;
    }

    try {
      if (eventName === 'payment.captured' || eventName === 'order.paid') {
        const paymentEntity = event.payload.payment.entity;
        const razorpayOrderId = paymentEntity.order_id;
        const razorpayPaymentId = paymentEntity.id;
        const razorpaySignature = 'webhook_verified';

        await this.verifyPaymentSignature({
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
        });
      }

      if (eventName === 'payment.failed') {
        const paymentEntity = event.payload.payment.entity;
        const razorpayOrderId = paymentEntity.order_id;
        const failureReason = paymentEntity.error_description || 'Payment failed';

        const payment = await Payment.findOne({ razorpayOrderId });
        if (payment && payment.status !== 'CAPTURED' && payment.status !== 'SUCCESS') {
          payment.status = 'FAILED';
          payment.failureReason = failureReason;
          await payment.save();

          await Order.findByIdAndUpdate(payment.orderId, {
            paymentStatus: 'FAILED',
          });

          try {
            await notificationService.createNotification({
              userId: payment.userId,
              title: 'Payment Failed',
              message: `Your payment of ₹${(payment.amount / 100).toFixed(2)} failed. Reason: ${failureReason}`,
              type: 'PAYMENT_FAILED',
              link: payment.orderId ? `/account/orders/${payment.orderId}` : '/account/wallet'
            }, { dedupeKey: `${payment._id}:PAYMENT_FAILED` });
          } catch (err) {
            console.error('Payment failure notification failed:', err);
          }
        }
      }

      webhookRecord.status = 'PROCESSED';
      webhookRecord.processedAt = new Date();
      await webhookRecord.save();
    } catch (procErr) {
      webhookRecord.status = 'FAILED';
      webhookRecord.error = procErr.message;
      await webhookRecord.save();
      throw procErr;
    }

    return { received: true };
  }
};
