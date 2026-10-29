import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, USER_STATUS } from '../constants/roles.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.CUSTOMER,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE,
      index: true,
    },
    adminRoleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminRole',
      default: null,
    },
    avatar: {
      type: String,
      default: '',
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    referralPath: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    attributedShopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      default: null,
      index: true,
    },
    attributedVendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      default: null,
      index: true,
    },
    fairCoinBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    superCoinBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    termsAccepted: {
      type: Boolean,
      default: false,
    },
    termsAcceptedAt: {
      type: Date,
      default: null,
    },
    termsVersion: {
      type: String,
      default: null,
    },
    refreshTokenHash: {
      type: String,
      select: false,
    },
    lastRotatedTokenHash: {
      type: String,
      select: false,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    mfaEnabled: {
      type: Boolean,
      default: false,
      index: true,
    },
    mfaSecret: {
      type: String,
      select: false,
    },
    mfaVerifiedAt: {
      type: Date,
      default: null,
    },
    mfaRecoveryCodes: [
      {
        codeHash: { type: String, required: true },
        used: { type: Boolean, default: false },
        usedAt: { type: Date, default: null },
      },
    ],
    mfaFailedAttempts: {
      type: Number,
      default: 0,
    },
    mfaLockedUntil: {
      type: Date,
      default: null,
    },
    authorizedHubs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FulfillmentHub',
      },
    ],
    notificationPreferences: {
      orderUpdates: { type: Boolean, default: true },
      promotional: { type: Boolean, default: false },
      walletAlerts: { type: Boolean, default: true },
      securityAlerts: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for mobileNumber (canonical alias for phone)
userSchema.virtual('mobileNumber')
  .get(function () { return this.phone; })
  .set(function (val) { this.phone = val; });

// Virtuals for verification flags
userSchema.virtual('isEmailVerified')
  .get(function () { return this.emailVerified; })
  .set(function (val) { this.emailVerified = val; });

userSchema.virtual('isMobileVerified')
  .get(function () { return this.phoneVerified; })
  .set(function (val) { this.phoneVerified = val; });

// Virtual for isActive
userSchema.virtual('isActive').get(function () {
  return this.status === USER_STATUS.ACTIVE;
});

// Virtual for lastLogin
userSchema.virtual('lastLogin').get(function () {
  return this.lastLoginAt;
});

// Method to match password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Static helper to generate unique referral code with role prefixes (VND- for Vendor, CLI- for Client)
userSchema.statics.generateReferralCode = function (name, role = 'CUSTOMER') {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomStr = '';
  for (let i = 0; i < 5; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const prefix = role === 'VENDOR' ? 'VND' : role === 'SUPER_ADMIN' || role === 'ADMIN' ? 'ADM' : 'CLI';
  return `${prefix}-${randomStr}`;
};

// Pre-save hook to ensure every user has a unique referralCode if not provided
userSchema.pre('save', async function (next) {
  if (!this.referralCode || typeof this.referralCode !== 'string' || !this.referralCode.trim()) {
    let newReferralCode = userSchema.statics.generateReferralCode(this.name, this.role);
    let isCodeUnique = false;
    let attempts = 0;
    while (!isCodeUnique && attempts < 15) {
      const codeExists = await this.constructor.findOne({ referralCode: newReferralCode });
      if (!codeExists) {
        isCodeUnique = true;
      } else {
        newReferralCode = userSchema.statics.generateReferralCode(this.name, this.role);
        attempts++;
      }
    }
    this.referralCode = newReferralCode;
  }
  next();
});

export const User = mongoose.model('User', userSchema);

