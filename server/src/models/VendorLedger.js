import mongoose from 'mongoose';

const vendorLedgerSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null, index: true },
    suborderId: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorOrder', default: null, index: true },
    transactionType: { 
      type: String, 
      enum: [
        'SALE',
        'SALE_EARNED',
        'PLATFORM_COMMISSION',
        'NETWORK_COMMISSION',
        'PAYOUT',
        'WITHDRAWAL_RESERVE',
        'REFUND_REVERSAL',
        'ADJUSTMENT',
        'VENDOR_REFERRAL_COMMISSION_EARNED',
        'VENDOR_REFERRAL_PAYOUT',
      ], 
      required: true 
    },
    credit: { type: Number, default: 0 },
    debit: { type: Number, default: 0 },
    balanceSnapshot: { type: Number, required: true },
    description: { type: String, default: '' },
    referenceId: { type: String, default: '' }, // For payment/settlement IDs
  },
  { timestamps: true }
);

export const VendorLedger = mongoose.model('VendorLedger', vendorLedgerSchema);
export default VendorLedger;
