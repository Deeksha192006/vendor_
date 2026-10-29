import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', default: null },
  name: { type: String, required: true }, // Keeping for backward compatibility
  productNameSnapshot: { type: String, required: true },
  skuSnapshot: { type: String, required: true },
  price: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  quantity: { type: Number, required: true },
  taxSnapshot: { type: Number, default: 0 },
  discountSnapshot: { type: Number, default: 0 },
  lineTotal: { type: Number, required: true },
  variantSku: { type: String, default: '' },
  image: { type: String, default: '' },
  productImageSnapshot: { type: String, default: '' },
  commissionRate: { type: Number, default: 5 },
  platformCommission: { type: Number, default: 0 },
  vendorShare: { type: Number, default: 0 },
  referrerVendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', default: null },
  referralCommissionRate: { type: Number, default: 0 },
  referralCommission: { type: Number, default: 0 },
  referralSettlementStatus: {
    type: String,
    enum: ['NONE', 'PENDING_DELIVERY', 'ELIGIBLE', 'PROCESSING', 'PAID', 'CANCELLED', 'REVERSED'],
    default: 'NONE',
  },
  settlementStatus: {
    type: String,
    enum: ['PENDING_DELIVERY', 'ELIGIBLE', 'PROCESSING', 'PAID', 'CANCELLED', 'REVERSED'],
    default: 'PENDING_DELIVERY',
  },
  deliveredAt: { type: Date, default: null },
  settlementDueDate: { type: Date, default: null },
  deliveryStatus: { type: String, default: 'PENDING' },
  paymentStatus: { type: String, default: 'PENDING' },
  refundStatus: { type: String, enum: ['NONE', 'PARTIAL', 'FULL', 'DISPUTED'], default: 'NONE' },
  settlementPaidAt: { type: Date, default: null },
  payoutReference: { type: String, default: '' },
});

const addressSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  phone: { type: String, default: '' },
  street: { type: String, default: '' },
  streetAddress: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  zip: { type: String, default: '' },
  postalCode: { type: String, default: '' },
  country: { type: String, default: 'India' },
}, { _id: false });

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    publicOrderId: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [orderItemSchema],
    shippingAddress: addressSchema, // Keep for backward compatibility
    billingAddress: addressSchema,
    deliveryAddressSnapshot: { type: Object, required: true },
    subtotal: { type: Number, required: true }, // Keep for compatibility
    itemsSubtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    discountTotal: { type: Number, default: 0 },
    coinDiscount: { type: Number, default: 0 },
    fairCoinsUsed: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    shippingTotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    taxTotal: { type: Number, default: 0 },
    total: { type: Number, required: true }, // Keep
    grandTotal: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
    },
    orderStatus: {
      type: String,
      enum: [
        'PENDING',
        'CONFIRMED',
        'PROCESSING',
        'PACKED',
        'READY_TO_SHIP',
        'SHIPMENT_CREATED',
        'PICKUP_REQUESTED',
        'PICKUP_SCHEDULED',
        'PICKED_UP',
        'IN_TRANSIT',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'PARTIALLY_DELIVERED',
        'DELIVERY_FAILED',
        'CANCELLED',
        'RETURN_INITIATED',
        'RETURN_IN_TRANSIT',
        'RETURN_REQUESTED',
        'RETURNED',
        'REFUNDED',
      ],
      default: 'PENDING',
      index: true,
    },
    paymentMethod: { type: String, enum: ['RAZORPAY', 'STRIPE', 'COD'], default: 'RAZORPAY' },
    paymentId: { type: String, default: '' },
    couponCode: { type: String, default: '' },
    attributedShopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', default: null, index: true },
    customerAttributionId: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerShopAttribution', default: null },
    attributedVendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', default: null },
  },
  { timestamps: true }
);

export const Order = mongoose.model('Order', orderSchema);
export default Order;
