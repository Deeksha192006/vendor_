import mongoose from 'mongoose';

const vendorReferralCommissionSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    suborderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VendorOrder',
      required: true,
      index: true,
    },
    orderItemId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    sellingVendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true,
    },
    referrerVendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true,
    },
    referrerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sellingUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    productName: {
      type: String,
      default: '',
    },
    productSku: {
      type: String,
      default: '',
    },
    quantity: {
      type: Number,
      default: 1,
    },
    unitPrice: {
      type: Number,
      default: 0,
    },
    eligibleSaleAmount: {
      type: Number,
      required: true,
    },
    commissionRate: {
      type: Number,
      default: 3, // Fixed 3%
    },
    commissionAmount: {
      type: Number,
      required: true,
    },
    paymentVerificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
      index: true,
    },
    commissionStatus: {
      type: String,
      enum: ['PENDING_DELIVERY', 'EARNED', 'CANCELLED', 'REVERSED'],
      default: 'PENDING_DELIVERY',
      index: true,
    },
    settlementStatus: {
      type: String,
      enum: ['PENDING_DELIVERY', 'ON_HOLD', 'ELIGIBLE', 'PAID', 'CANCELLED', 'REVERSED'],
      default: 'PENDING_DELIVERY',
      index: true,
    },
    eligibleAt: {
      type: Date,
      default: null,
      index: true,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    payoutReference: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Idempotent indexing: Exactly one referral commission record per (orderId, suborderId, sellingVendorId, referrerVendorId)
vendorReferralCommissionSchema.index(
  { orderId: 1, suborderId: 1, sellingVendorId: 1, referrerVendorId: 1 },
  { unique: true }
);

vendorReferralCommissionSchema.index({ referrerVendorId: 1, settlementStatus: 1 });
vendorReferralCommissionSchema.index({ sellingVendorId: 1, createdAt: -1 });

export const VendorReferralCommission = mongoose.model('VendorReferralCommission', vendorReferralCommissionSchema);
export default VendorReferralCommission;
