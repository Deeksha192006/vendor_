import mongoose from 'mongoose';

const vendorActivitySchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    actorRole: {
      type: String,
      default: 'SUPER_ADMIN',
    },
    actorName: {
      type: String,
      default: 'System',
    },
    eventType: {
      type: String,
      required: true,
      enum: [
        'FRANCHISE_VENDOR_CREATED',
        'INVITATION_GENERATED',
        'WHATSAPP_LINK_OPENED',
        'INVITATION_MARKED_SENT',
        'INVITATION_ACCEPTED',
        'ACCOUNT_ACTIVATED',
        'LOGIN_SUCCESS',
        'PROFILE_UPDATED',
        'PRODUCT_CREATED',
        'PRODUCT_UPDATED',
        'PRODUCT_STATUS_CHANGED',
        'STOCK_UPDATED',
        'ORDER_STATUS_CHANGED',
        'ACCOUNT_SUSPENDED',
        'ACCOUNT_REACTIVATED',
        'INVITATION_REVOKED',
        'INVITATION_REISSUED',
        'PASSWORD_RESET_TRIGGERED',
      ],
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

vendorActivitySchema.index({ vendorId: 1, createdAt: -1 });
vendorActivitySchema.index({ eventType: 1, createdAt: -1 });
vendorActivitySchema.index({ createdAt: -1 });

export const VendorActivity = mongoose.model('VendorActivity', vendorActivitySchema);
export default VendorActivity;
