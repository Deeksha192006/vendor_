import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    storeName: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String, default: '' },
    logo: { type: String, default: '' },
    banner: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    address: {
      street: String,
      city: String,
      state: String,
      zip: String,
      country: String,
    },
    status: {
      type: String,
      enum: ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED', 'BLOCKED', 'EXPIRED'],
      default: 'PENDING',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'PENDING', 'PAID'],
      default: 'UNPAID',
      index: true,
    },
    isPaid: {
      type: Boolean,
      default: false,
      index: true,
    },
    paidAmount: {
      type: Number,
      default: 1999,
    },
    paymentDate: {
      type: Date,
      default: null,
    },
    paymentTransactionId: {
      type: String,
      default: '',
    },
    currentAreaAssignment: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'VendorAreaAssignment',
      default: null
    },
    kycStatus: {
      type: String,
      enum: ['PENDING', 'PARTIALLY_VERIFIED', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
    },
    termsAccepted: { type: Boolean, default: false },
    termsAcceptedAt: { type: Date },
    commissionRate: { type: Number, default: 10 }, // 10% platform commission default
    totalSales: { type: Number, default: 0 },
    balance: { type: Number, default: 0 }, // Available for withdrawal
    pendingBalance: { type: Number, default: 0 },
    // Direct Vendor Referrer (Earns 3% on eligible sales made by this vendor)
    referredByVendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      default: null,
      index: true,
    },
    referredByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    // Franchise Vendor fields
    vendorType: {
      type: String,
      enum: ['NORMAL', 'FRANCHISE_VENDOR'],
      default: 'NORMAL',
      index: true,
    },
    username: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
    whatsappNumber: {
      type: String,
      default: '',
      trim: true,
    },
    franchiseCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    appointedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    appointedAt: {
      type: Date,
      default: null,
    },
    appointmentNotes: {
      type: String,
      default: '',
    },
    territory: {
      state: { type: String, default: '', trim: true },
      district: { type: String, default: '', trim: true },
      taluk: { type: String, default: '', trim: true },
      fullAddress: { type: String, default: '', trim: true },
    },
    invitationTokenHash: {
      type: String,
      select: false,
      default: null,
    },
    invitationTokenExpiry: {
      type: Date,
      default: null,
    },
    invitationStatus: {
      type: String,
      enum: ['PENDING', 'SENT', 'ACCEPTED', 'EXPIRED', 'REVOKED'],
      default: 'PENDING',
      index: true,
    },
    invitationSentAt: {
      type: Date,
      default: null,
    },
    invitationManuallyMarkedSentAt: {
      type: Date,
      default: null,
    },
    activatedAt: {
      type: Date,
      default: null,
    },
    activationStatus: {
      type: String,
      enum: ['PENDING_ACTIVATION', 'ACTIVE', 'SUSPENDED'],
      default: 'ACTIVE',
      index: true,
    },
    applicationStatus: {
      type: String,
      enum: ['PENDING_APPLICATION', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'MORE_INFO_REQUIRED'],
      default: 'PENDING_APPLICATION',
      index: true,
    },
    applicationSubmittedAt: {
      type: Date,
      default: null,
    },
    applicationReviewedAt: {
      type: Date,
      default: null,
    },
    applicationReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    applicationReviewNotes: {
      type: String,
      default: '',
    },
    applicationRejectionReason: {
      type: String,
      default: '',
    },
    applicationMoreInfoReason: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export const Vendor = mongoose.model('Vendor', vendorSchema);
export default Vendor;
