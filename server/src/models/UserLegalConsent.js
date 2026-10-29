import mongoose from 'mongoose';
import { LEGAL_DOCUMENT_TYPES } from './LegalDocument.js';

const userLegalConsentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    accountIdentifier: {
      type: String,
      trim: true,
      index: true,
    },
    role: {
      type: String,
      trim: true,
    },
    documentType: {
      type: String,
      required: true,
      enum: Object.values(LEGAL_DOCUMENT_TYPES),
      uppercase: true,
      index: true,
    },
    version: {
      type: String,
      required: true,
      trim: true,
    },
    acceptedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

userLegalConsentSchema.index({ userId: 1, documentType: 1, version: 1 });

export const UserLegalConsent = mongoose.model('UserLegalConsent', userLegalConsentSchema);
export default UserLegalConsent;
