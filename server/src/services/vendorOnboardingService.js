import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Vendor } from '../models/Vendor.js';
import { VendorBusiness } from '../models/VendorBusiness.js';
import { VendorAddress } from '../models/VendorAddress.js';
import { VendorDocument } from '../models/VendorDocument.js';
import { VendorBankAccount } from '../models/VendorBankAccount.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';
import { tokenService } from './tokenService.js';
import { ROLES } from '../constants/roles.js';

import { mlmRewardService } from './mlmRewardService.js';
import { legalDocumentService } from './legalDocumentService.js';
import { LEGAL_DOCUMENT_TYPES } from '../models/LegalDocument.js';

export const vendorOnboardingService = {
  async register(reqBody) {
    const { 
      name, email, phone, password, referralCode,
      storeName, description, businessType, gstNumber, panNumber,
      state, district, talukArea, pincode, fullAddress, associatedShopkeeper,
      identityDocumentType, identityDocumentNumber, identityDocumentUpload, panDocumentUpload,
      accountHolderName, bankName, accountNumber, ifscCode,
      termsAccepted, termsVersion
    } = reqBody;

    if (!termsAccepted) {
      throw new ApiError(400, 'You must read and agree to the Vendor Terms & Conditions and Privacy Policy.', ERROR_CODES.BAD_REQUEST);
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, ...(phone ? [{ phone }] : [])],
    });

    if (existingUser) {
      throw new ApiError(400, 'Email or Phone is already registered', ERROR_CODES.CONFLICT);
    }

    // Resolve sponsor if referral code provided
    let referrer = null;
    let referralPath = [];
    if (referralCode && typeof referralCode === 'string' && referralCode.trim()) {
      const validation = await mlmRewardService.validateReferralCode(referralCode, ROLES.VENDOR);
      if (!validation.valid) {
        throw new ApiError(400, validation.message, ERROR_CODES.BAD_REQUEST);
      }
      referrer = await User.findById(validation.referrerId);
      if (referrer) {
        referralPath = [...(referrer.referralPath || []), referrer._id];
      }
    }

    let user, vendor;
    try {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Generate unique referral code for the new vendor
      let newReferralCode = User.generateReferralCode(name, ROLES.VENDOR);
      let isCodeUnique = false;
      let attempts = 0;
      while (!isCodeUnique && attempts < 10) {
        const codeExists = await User.findOne({ referralCode: newReferralCode });
        if (!codeExists) {
          isCodeUnique = true;
        } else {
          newReferralCode = User.generateReferralCode(name, ROLES.VENDOR);
          attempts++;
        }
      }

      user = new User({
        name,
        email: email.toLowerCase(),
        phone,
        passwordHash,
        role: ROLES.VENDOR,
        referralCode: newReferralCode,
        referredBy: referrer ? referrer._id : null,
        referralPath,
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        termsVersion: termsVersion || '1.0',
      });
      await user.save();

      // Persist immutable audit record of vendor legal agreement acceptance
      try {
        await legalDocumentService.recordConsent({
          userId: user._id,
          accountIdentifier: email.toLowerCase(),
          role: ROLES.VENDOR,
          documentType: LEGAL_DOCUMENT_TYPES.VENDOR_TERMS,
          version: termsVersion,
        });
        await legalDocumentService.recordConsent({
          userId: user._id,
          accountIdentifier: email.toLowerCase(),
          role: ROLES.VENDOR,
          documentType: LEGAL_DOCUMENT_TYPES.PRIVACY_POLICY,
          version: termsVersion,
        });
      } catch (consentErr) {
        console.error('[vendorOnboardingService] Failed to record vendor legal consent:', consentErr.message);
      }

      // Trigger MLM registration rewards (100 Fair Coins to sponsor and 100 welcome coins to new vendor)
      if (referrer) {
        try {
          await mlmRewardService.processReferralRegistrationRewards(user._id, referrer._id);
        } catch (err) {
          console.error('[vendorOnboardingService] MLM registration reward error:', err);
        }
      }

      const slug = (storeName || name).toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(7);

      const referrerVendor = referrer ? await Vendor.findOne({ userId: referrer._id }) : null;

      vendor = new Vendor({
        userId: user._id,
        storeName: storeName || name + " Store",
        slug,
        email: email.toLowerCase(),
        phone: phone || '',
        status: 'UNDER_REVIEW',
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        referredByVendorId: referrerVendor ? referrerVendor._id : null,
        referredByUserId: referrer ? referrer._id : null,
      });
      await vendor.save();

      const business = new VendorBusiness({
        vendorId: vendor._id,
        storeName: storeName || name,
        description, businessType, gstNumber, panNumber
      });
      await business.save();

      const location = new VendorAddress({
        vendorId: vendor._id,
        state, district, talukArea, pincode, fullAddress,
        associatedShopkeeper: associatedShopkeeper || ''
      });
      await location.save();

      const kyc = new VendorDocument({
        vendorId: vendor._id,
        identityDocumentType: identityDocumentType || 'AADHAAR',
        identityDocumentNumber: identityDocumentNumber || 'N/A',
        identityDocumentUpload: identityDocumentUpload || 'pending_verification',
        panDocumentUpload: panDocumentUpload || ''
      });
      await kyc.save();

      const bank = new VendorBankAccount({
        vendorId: vendor._id,
        accountHolderName: accountHolderName || name,
        bankName: bankName || 'Standard Bank',
        accountNumber: accountNumber || '0000000000',
        ifscCode: ifscCode || 'BANK0000001'
      });
      await bank.save();

      const userResponse = user.toObject();
      delete userResponse.passwordHash;
      delete userResponse.refreshTokenHash;

      return { user: userResponse, vendor };
    } catch (err) {
      if (user?._id) {
        try {
          await User.deleteOne({ _id: user._id });
          if (vendor?._id) {
            await Vendor.deleteOne({ _id: vendor._id });
            await VendorBusiness.deleteMany({ vendorId: vendor._id });
            await VendorAddress.deleteMany({ vendorId: vendor._id });
            await VendorDocument.deleteMany({ vendorId: vendor._id });
            await VendorBankAccount.deleteMany({ vendorId: vendor._id });
          }
        } catch (cleanupErr) {
          console.error('Registration rollback error:', cleanupErr);
        }
      }
      throw err;
    }
  },

  async getStatus(userId) {
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) throw new ApiError(404, 'Vendor not found', ERROR_CODES.NOT_FOUND);

    const business = await VendorBusiness.findOne({ vendorId: vendor._id });
    const location = await VendorAddress.findOne({ vendorId: vendor._id });
    const kyc = await VendorDocument.findOne({ vendorId: vendor._id });
    const bank = await VendorBankAccount.findOne({ vendorId: vendor._id });

    return {
      vendor,
      business,
      location,
      kyc,
      bank: bank ? (bank.toMaskedJSON ? bank.toMaskedJSON() : bank) : null,
    };
  },

  async submitBusiness(userId, payload) {
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) throw new ApiError(404, 'Vendor not found', ERROR_CODES.NOT_FOUND);
    if (vendor.status !== 'PENDING' && vendor.status !== 'REJECTED') {
      throw new ApiError(400, 'Cannot edit business info in current status', ERROR_CODES.BAD_REQUEST);
    }

    vendor.storeName = payload.storeName;
    vendor.description = payload.description || vendor.description;
    await vendor.save();

    let business = await VendorBusiness.findOne({ vendorId: vendor._id });
    if (business) {
      Object.assign(business, payload);
    } else {
      business = new VendorBusiness({ vendorId: vendor._id, ...payload });
    }
    await business.save();
    return business;
  },

  async submitLocation(userId, payload) {
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) throw new ApiError(404, 'Vendor not found', ERROR_CODES.NOT_FOUND);
    if (vendor.status !== 'PENDING' && vendor.status !== 'REJECTED') {
      throw new ApiError(400, 'Cannot edit location info in current status', ERROR_CODES.BAD_REQUEST);
    }

    let location = await VendorAddress.findOne({ vendorId: vendor._id });
    if (location) {
      Object.assign(location, payload);
    } else {
      location = new VendorAddress({ vendorId: vendor._id, ...payload });
    }
    await location.save();
    return location;
  },

  async submitKyc(userId, payload) {
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) throw new ApiError(404, 'Vendor not found', ERROR_CODES.NOT_FOUND);
    if (vendor.status !== 'PENDING' && vendor.status !== 'REJECTED') {
      throw new ApiError(400, 'Cannot edit KYC info in current status', ERROR_CODES.BAD_REQUEST);
    }

    let kyc = await VendorDocument.findOne({ vendorId: vendor._id });
    if (kyc) {
      Object.assign(kyc, payload);
    } else {
      kyc = new VendorDocument({ vendorId: vendor._id, ...payload });
    }
    await kyc.save();
    return kyc;
  },

  async submitBank(userId, payload) {
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) throw new ApiError(404, 'Vendor not found', ERROR_CODES.NOT_FOUND);
    if (vendor.status !== 'PENDING' && vendor.status !== 'REJECTED') {
      throw new ApiError(400, 'Cannot edit bank info in current status', ERROR_CODES.BAD_REQUEST);
    }

    let bank = await VendorBankAccount.findOne({ vendorId: vendor._id });
    if (bank) {
      Object.assign(bank, payload);
    } else {
      bank = new VendorBankAccount({ vendorId: vendor._id, ...payload });
    }
    await bank.save();
    return bank.toMaskedJSON ? bank.toMaskedJSON() : bank;
  },

  async submitFinal(userId, payload) {
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) throw new ApiError(404, 'Vendor not found', ERROR_CODES.NOT_FOUND);
    if (vendor.status !== 'PENDING') {
      throw new ApiError(400, 'Onboarding already submitted', ERROR_CODES.BAD_REQUEST);
    }
    
    if (!payload.termsAccepted) {
        throw new ApiError(400, 'Terms and Conditions must be accepted', ERROR_CODES.BAD_REQUEST);
    }

    vendor.termsAccepted = true;
    vendor.termsAcceptedAt = new Date();
    vendor.status = 'UNDER_REVIEW';
    await vendor.save();

    return vendor;
  },

  async resubmit(userId, payload) {
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) throw new ApiError(404, 'Vendor not found', ERROR_CODES.NOT_FOUND);
    if (vendor.status !== 'REJECTED') {
      throw new ApiError(400, 'Only rejected applications can be resubmitted', ERROR_CODES.BAD_REQUEST);
    }

    vendor.status = 'UNDER_REVIEW';
    await vendor.save();

    return vendor;
  }
};
