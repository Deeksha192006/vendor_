import mongoose from 'mongoose';

export const DELETION_REQUEST_STATUS = {
  SUBMITTED: 'SUBMITTED',
  IN_REVIEW: 'IN_REVIEW',
  APPROVED: 'APPROVED',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
};

const dataDeletionRequestSchema = new mongoose.Schema(
  {
    referenceId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userRole: {
      type: String,
      required: true,
      enum: ['CUSTOMER', 'VENDOR', 'SHOPKEEPER', 'ADMIN', 'SUPER_ADMIN'],
    },
    requesterEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    requesterPhone: {
      type: String,
      trim: true,
      default: '',
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: 'User requested account and personal data deletion.',
    },
    status: {
      type: String,
      enum: Object.values(DELETION_REQUEST_STATUS),
      default: DELETION_REQUEST_STATUS.SUBMITTED,
      index: true,
    },
    retentionExplanation: {
      type: String,
      default: 'Pursuant to Indian tax laws, Goods and Services Tax (GST) rules, and financial audit standards, historical transaction records, tax invoices, and accounting ledgers must be retained for up to 8 years. All non-essential personal identifiers, contact numbers, and KYC files are purged or anonymized upon completion.',
    },
    adminNotes: {
      type: String,
      default: '',
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const DataDeletionRequest = mongoose.model('DataDeletionRequest', dataDeletionRequestSchema);
export default DataDeletionRequest;
