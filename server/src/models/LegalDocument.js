import mongoose from 'mongoose';

export const LEGAL_DOCUMENT_TYPES = {
  VENDOR_TERMS: 'VENDOR_TERMS',
  CUSTOMER_TERMS: 'CUSTOMER_TERMS',
  PRIVACY_POLICY: 'PRIVACY_POLICY',
  COOKIE_POLICY: 'COOKIE_POLICY',
  REFUND_POLICY: 'REFUND_POLICY',
  SHIPPING_POLICY: 'SHIPPING_POLICY',
  GRIEVANCE_POLICY: 'GRIEVANCE_POLICY',
};

const legalDocumentHistorySchema = new mongoose.Schema(
  {
    version: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    effectiveDate: {
      type: Date,
      default: Date.now,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { _id: true }
);

const legalDocumentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      unique: true,
      enum: Object.values(LEGAL_DOCUMENT_TYPES),
      uppercase: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    version: {
      type: String,
      required: true,
      default: '1.0',
      trim: true,
    },
    effectiveDate: {
      type: Date,
      default: Date.now,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    history: [legalDocumentHistorySchema],
  },
  {
    timestamps: true,
  }
);

export const LegalDocument = mongoose.model('LegalDocument', legalDocumentSchema);
export default LegalDocument;
