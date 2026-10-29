import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';
import { priceService } from './priceService.js';
import { couponService } from './couponService.js';

export const cartService = {
  /**
   * Recalculate cart item prices, subtotal, and coupon discounts from source of truth.
   */
  async recalculateCart(cart) {
    let subtotal = 0;

    // Populate product references if not populated
    await cart.populate({
      path: 'items.productId',
      populate: { path: 'vendorId' }
    });

    // Remove items that no longer exist or aren't approved
    cart.items = cart.items.filter((item) => {
      const prod = item.productId;
      if (!prod || !['APPROVED', 'ACTIVE'].includes(prod.status)) return false;
      const isSuperAdmin = prod.sourceType === 'SUPER_ADMIN' || !prod.vendorId;
      if (!isSuperAdmin) {
        const vStatus = prod.vendorId?.status;
        if (!prod.vendorId || (vStatus !== 'APPROVED' && vStatus !== 'ACTIVE')) return false;
      }
      return true;
    });

    for (const item of cart.items) {
      const prod = item.productId;
      const pricing = priceService.getEffectiveProductPrice(prod, item.variantSku);
      
      item.price = pricing.sellingPrice;
      const isSuperAdmin = prod.sourceType === 'SUPER_ADMIN' || !prod.vendorId;
      // enforce vendorId correctness
      item.vendorId = isSuperAdmin ? null : (prod.vendorId?._id || prod.vendorId);
      
      subtotal += item.price * item.quantity;
    }

    let discountAmount = 0;
    if (cart.couponCode) {
      try {
        const validation = await couponService.validateCoupon({
          code: cart.couponCode,
          userId: cart.userId,
          items: cart.items,
        });
        discountAmount = validation.discountAmount;
        cart.couponCode = validation.coupon.code;
      } catch (err) {
        // Clear invalid coupon code from cart
        cart.couponCode = '';
      }
    }

    cart.discountAmount = discountAmount;
    await cart.save();
    return cart;
  },

  async getCart(userId) {
    let cart = await Cart.findOne({ userId }).populate({
      path: 'items.productId',
      populate: { path: 'vendorId', select: 'storeName businessName' }
    });
    
    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    } else {
      cart = await this.recalculateCart(cart);
    }
    
    // Structure for grouping
    const groupedItems = cart.items.reduce((acc, item) => {
      const isSuperAdmin = item.productId?.sourceType === 'SUPER_ADMIN' || !item.vendorId;
      const vId = isSuperAdmin ? 'SUPER_ADMIN' : (item.vendorId?._id ? item.vendorId._id.toString() : item.vendorId?.toString() || 'SUPER_ADMIN');
      if (!acc[vId]) {
        const vendorData = item.productId?.vendorId;
        acc[vId] = {
          vendorId: isSuperAdmin ? null : vId,
          vendorName: isSuperAdmin ? 'FairKart Direct' : (vendorData?.storeName || vendorData?.businessName || 'Vendor'),
          items: [],
          vendorSubtotal: 0
        };
      }
      const lineTotal = item.price * item.quantity;
      acc[vId].items.push({
        _id: item._id,
        productId: item.productId,
        variantSku: item.variantSku,
        quantity: item.quantity,
        price: item.price,
        lineTotal
      });
      acc[vId].vendorSubtotal += lineTotal;
      return acc;
    }, {});

    const subtotal = Object.values(groupedItems).reduce((sum, group) => sum + group.vendorSubtotal, 0);

    const { FAIR_COIN_CONVERSION } = await import('../constants/coinConstants.js');
    const coinsPerRupee = FAIR_COIN_CONVERSION.COINS_PER_RUPEE;
    const { fairCoinService } = await import('./fairCoinService.js');
    const maxCoinsPerPurchase = await fairCoinService.getMaxCoinsPerPurchase();

    return {
      _id: cart._id,
      userId: cart.userId,
      couponCode: cart.couponCode,
      discountAmount: cart.discountAmount,
      coinDiscountAmount: cart.coinDiscountAmount,
      fairCoinsUsed: cart.fairCoinsUsed,
      coinsPerRupee,
      maxCoinsPerPurchase,
      subtotal,
      total: Math.max(0, subtotal - cart.discountAmount - cart.coinDiscountAmount),
      items: cart.items,
      vendors: Object.values(groupedItems)
    };
  },

  async addToCart(userId, { productId, quantity = 1, variantSku = '' }) {
    if (quantity <= 0) {
      throw new ApiError(400, 'Quantity must be at least 1', ERROR_CODES.BAD_REQUEST);
    }

    const product = await Product.findById(productId).populate('vendorId');
    if (!product || !['APPROVED', 'ACTIVE'].includes(product.status)) {
      throw new ApiError(404, 'Product not available', ERROR_CODES.NOT_FOUND);
    }

    const isSuperAdmin = product.sourceType === 'SUPER_ADMIN' || !product.vendorId;
    if (!isSuperAdmin) {
      const vStatus = product.vendorId?.status;
      if (!product.vendorId || (vStatus !== 'APPROVED' && vStatus !== 'ACTIVE')) {
        throw new ApiError(400, 'Vendor is currently not eligible to sell', ERROR_CODES.BAD_REQUEST);
      }
    }

    const itemVendorId = isSuperAdmin ? null : (product.vendorId?._id || product.vendorId);

    const pricing = priceService.getEffectiveProductPrice(product, variantSku);
    if (pricing.stock < quantity) {
      throw new ApiError(400, `Insufficient stock. Only ${pricing.stock} items available.`, ERROR_CODES.BAD_REQUEST);
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }

    const existingIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId && item.variantSku === variantSku
    );

    if (existingIndex > -1) {
      // Validate combined stock limit
      const newQty = cart.items[existingIndex].quantity + quantity;
      if (pricing.stock < newQty) {
        throw new ApiError(400, `Insufficient stock. Total cart quantity ${newQty} exceeds available ${pricing.stock}.`, ERROR_CODES.BAD_REQUEST);
      }
      cart.items[existingIndex].quantity = newQty;
      cart.items[existingIndex].price = pricing.sellingPrice;
      cart.items[existingIndex].vendorId = itemVendorId;
    } else {
      cart.items.push({
        productId,
        vendorId: itemVendorId,
        variantSku,
        quantity,
        price: pricing.sellingPrice,
      });
    }

    await cart.save();
    return this.getCart(userId);
  },

  async updateQuantity(userId, { productId, quantity, variantSku = '' }) {
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart) throw new ApiError(404, 'Cart not found', ERROR_CODES.NOT_FOUND);

    if (quantity <= 0) {
      cart.items = cart.items.filter(
        (item) => !(item.productId._id.toString() === productId && item.variantSku === variantSku)
      );
    } else {
      const item = cart.items.find(
        (item) => item.productId._id.toString() === productId && item.variantSku === variantSku
      );
      if (!item) throw new ApiError(404, 'Cart item not found', ERROR_CODES.NOT_FOUND);

      const product = item.productId;
      if (!product || product.status !== 'APPROVED') {
        throw new ApiError(400, 'Product is no longer available', ERROR_CODES.BAD_REQUEST);
      }

      const pricing = priceService.getEffectiveProductPrice(product, variantSku);
      if (pricing.stock < quantity) {
        throw new ApiError(400, `Insufficient stock. Only ${pricing.stock} items available.`, ERROR_CODES.BAD_REQUEST);
      }

      item.quantity = quantity;
      item.price = pricing.sellingPrice;
    }

    await cart.save();
    return this.getCart(userId);
  },

  async applyCoupon(userId, couponCode) {
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart) throw new ApiError(404, 'Cart not found', ERROR_CODES.NOT_FOUND);

    const validation = await couponService.validateCoupon({
      code: couponCode,
      userId,
      items: cart.items,
    });

    cart.couponCode = validation.coupon.code;
    cart.discountAmount = validation.discountAmount;
    await cart.save();
    return this.getCart(userId);
  },
};
