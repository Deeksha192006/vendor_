import mongoose from 'mongoose';

const vendorSettlementSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    suborderId: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorOrder', required: true, index: true, unique: true },
    grossAmount: { type: Number, required: true },
    orderValue: { type: Number, default: function() { return this.grossAmount; } },
    eligibleItemCount: { type: Number, default: 1 },
    commissionRate: { type: Number, default: 5 },
    commissionAmount: { type: Number, default: function() { return this.platformCommission; } },
    vendorPayoutAmount: { type: Number, default: function() { return this.netPayable; } },
    platformCommission: { type: Number, required: true },
    networkCommission: { type: Number, default: 0 },
    otherDeductions: { type: Number, default: 0 },
    netPayable: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ['PENDING_DELIVERY', 'ON_HOLD', 'ELIGIBLE', 'PROCESSING', 'PAID', 'FAILED', 'BLOCKED', 'REVERSED'], 
      default: 'PENDING_DELIVERY',
      index: true
    },
    settlementStatus: { 
      type: String, 
      default: 'PENDING_DELIVERY',
      index: true
    },
    eligibleAt: { type: Date, required: true, index: true },
    paidAt: { type: Date, default: null },
    payoutReference: { type: String, default: '' },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

export const VendorSettlement = mongoose.model('VendorSettlement', vendorSettlementSchema);
