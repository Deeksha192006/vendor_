import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { VendorOrder } from '../models/VendorOrder.js';
import { Fulfillment } from '../models/Fulfillment.js';
import { FulfillmentHub } from '../models/FulfillmentHub.js';
import { DeliveryZone } from '../models/DeliveryZone.js';
import { Package } from '../models/Package.js';
import { Vendor } from '../models/Vendor.js';
import { Shopkeeper } from '../models/Shopkeeper.js';
import { Shop } from '../models/Shop.js';
import { OrderStatusHistory } from '../models/OrderStatusHistory.js';
import { fulfillmentStatusService } from './fulfillmentStatusService.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

export const fulfillmentService = {
  async createFulfillmentForOrder(orderId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const order = await Order.findById(orderId).session(session);
      if (!order) {
        throw new ApiError(404, 'Order not found', ERROR_CODES.NOT_FOUND);
      }

      // Check if fulfillment already exists for this order
      const existing = await Fulfillment.findOne({ orderId }).session(session);
      if (existing) {
        await session.abortTransaction();
        session.endSession();
        return; // Idempotency
      }

      const vendorOrders = await VendorOrder.find({ parentOrderId: order._id }).session(session);
      if (vendorOrders.length === 0) {
        // No vendor suborders to fulfill (e.g. direct platform inventory)
        await session.commitTransaction();
        session.endSession();
        return;
      }

      // Resolve Delivery Zone by pincode (shippingAddress.zip)
      const deliveryZone = await DeliveryZone.findOne({
        pincodes: order.shippingAddress.zip,
        status: 'ACTIVE',
      }).session(session);

      const hubId = deliveryZone ? deliveryZone.hubId : null;

      for (const vo of vendorOrders) {
        // Resolve source details (SHOP vs VENDOR)
        let sourceType = 'VENDOR';
        let sourceId = vo.vendorId;

        const vendor = await Vendor.findById(vo.vendorId).session(session);
        if (vendor) {
          const shopkeeper = await Shopkeeper.findOne({ userId: vendor.userId }).session(session);
          if (shopkeeper) {
            const shop = await Shop.findOne({ shopkeeperId: shopkeeper._id, status: 'ACTIVE' }).session(session);
            if (shop) {
              sourceType = 'SHOP';
              sourceId = shop._id;
            }
          }
        }

        const items = vo.items.map((item) => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          pickedQuantity: 0,
          missingQuantity: 0,
        }));

        const fulfillment = await Fulfillment.create(
          [
            {
              orderId: order._id,
              vendorOrderId: vo._id,
              sourceType,
              sourceId,
              hubId,
              status: 'PENDING',
              items,
            },
          ],
          { session }
        );

        await OrderStatusHistory.create(
          [
            {
              orderId: order._id,
              fulfillmentId: fulfillment[0]._id,
              status: 'PENDING',
              actorUserId: order.userId,
              note: 'Fulfillment automatically initialized',
            },
          ],
          { session }
        );
      }

      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  },

  async pickItems(fulfillmentId, itemsInput, actor) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const fulfillment = await Fulfillment.findById(fulfillmentId).session(session);
      if (!fulfillment) {
        throw new ApiError(404, 'Fulfillment record not found', ERROR_CODES.NOT_FOUND);
      }

      // Check current status
      if (!['PENDING', 'PROCESSING'].includes(fulfillment.status)) {
        throw new ApiError(400, 'Fulfillment is not in picking-eligible state', ERROR_CODES.BAD_REQUEST);
      }

      // Apply transition to PROCESSING if in PENDING
      if (fulfillment.status === 'PENDING') {
        await fulfillmentStatusService.transitionFulfillmentStatus(
          fulfillment._id,
          'PROCESSING',
          actor,
          'Picking started',
          session
        );
      }

      // Update picked quantities
      for (const input of itemsInput) {
        const item = fulfillment.items.find((i) => i.productId.toString() === input.productId.toString());
        if (!item) {
          throw new ApiError(400, `Product ${input.productId} not part of this fulfillment`, ERROR_CODES.BAD_REQUEST);
        }

        if (input.pickedQuantity > item.quantity) {
          throw new ApiError(400, 'Picked quantity cannot exceed ordered quantity', ERROR_CODES.BAD_REQUEST);
        }

        item.pickedQuantity = input.pickedQuantity;
        item.missingQuantity = item.quantity - input.pickedQuantity;
      }

      await fulfillment.save({ session });

      // Move to PICKED if all items have been evaluated
      const allPicked = fulfillment.items.every(
        (i) => i.pickedQuantity + i.missingQuantity === i.quantity
      );

      if (allPicked) {
        await fulfillmentStatusService.transitionFulfillmentStatus(
          fulfillment._id,
          'PICKED',
          actor,
          'All items picked & verified',
          session
        );
      }

      await session.commitTransaction();
      session.endSession();

      return await Fulfillment.findById(fulfillmentId);
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  },

  async packFulfillment(fulfillmentId, packageData, actor) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const fulfillment = await Fulfillment.findById(fulfillmentId).session(session);
      if (!fulfillment) {
        throw new ApiError(404, 'Fulfillment not found', ERROR_CODES.NOT_FOUND);
      }

      if (fulfillment.status !== 'PICKED') {
        throw new ApiError(400, 'Fulfillment must be PICKED before packing', ERROR_CODES.BAD_REQUEST);
      }

      // Generate unique tracking number
      const trackingNumber = `FK-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const packageNumber = `PKG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

      const pkg = await Package.create(
        [
          {
            fulfillmentId: fulfillment._id,
            packageNumber,
            trackingNumber,
            weight: packageData.weight || 0,
            dimensions: packageData.dimensions || { length: 0, width: 0, height: 0 },
            status: 'PACKED',
            packedAt: new Date(),
          },
        ],
        { session }
      );

      await fulfillmentStatusService.transitionFulfillmentStatus(
        fulfillment._id,
        'PACKED',
        actor,
        `Package packed. Tracking: ${trackingNumber}`,
        session
      );

      await session.commitTransaction();
      session.endSession();

      return { fulfillment, package: pkg[0] };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  },

  async receiveAtHub(fulfillmentId, hubId, actor) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const fulfillment = await Fulfillment.findById(fulfillmentId).session(session);
      if (!fulfillment) {
        throw new ApiError(404, 'Fulfillment not found', ERROR_CODES.NOT_FOUND);
      }

      if (fulfillment.status !== 'PACKED') {
        throw new ApiError(400, 'Fulfillment must be PACKED to be received at Hub', ERROR_CODES.BAD_REQUEST);
      }

      const hub = await FulfillmentHub.findById(hubId).session(session);
      if (!hub || hub.status !== 'ACTIVE') {
        throw new ApiError(400, 'Invalid or inactive Fulfillment Hub', ERROR_CODES.BAD_REQUEST);
      }

      // Hub staff authorization check
      const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(actor.role);
      if (!isAdmin && actor.role === 'HUB_STAFF') {
        const hasAccess = actor.authorizedHubs?.some((hId) => hId.toString() === hubId.toString());
        if (!hasAccess) {
          throw new ApiError(403, 'Access denied: You are not authorized for this hub', ERROR_CODES.FORBIDDEN);
        }
      }

      fulfillment.hubId = hubId;
      await fulfillment.save({ session });

      // Move fulfillment to READY_FOR_DISPATCH
      await fulfillmentStatusService.transitionFulfillmentStatus(
        fulfillment._id,
        'READY_FOR_DISPATCH',
        actor,
        `Received and sorted at hub: ${hub.name}`,
        session
      );

      await session.commitTransaction();
      session.endSession();

      return fulfillment;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  },
};
