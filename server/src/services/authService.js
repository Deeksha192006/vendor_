import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Referral } from '../models/Referral.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';
import { tokenService } from './tokenService.js';
import { mlmRewardService } from './mlmRewardService.js';
import { ROLES, USER_STATUS } from '../constants/roles.js';
import { ShopQRCode } from '../models/ShopQRCode.js';
import { Shop } from '../models/Shop.js';
import { CustomerShopAttribution } from '../models/CustomerShopAttribution.js';
import mongoose from 'mongoose';

import { CustomerProfile } from '../models/CustomerProfile.js';
import { UserAddress } from '../models/UserAddress.js';
import { logAdminAction } from './auditLogService.js';
import { legalDocumentService } from './legalDocumentService.js';
import { LEGAL_DOCUMENT_TYPES } from '../models/LegalDocument.js';

export const authService = {
  async register(reqBody) {
    const { 
      name, firstName, lastName, email, password, phone, mobileNumber,
      referralCode, shopQrToken, address, city, state, country, pincode,
      termsAccepted, termsVersion
    } = reqBody;

    if (!termsAccepted) {
      throw new ApiError(400, 'You must read and agree to the Terms & Conditions and Privacy Policy to register.', ERROR_CODES.BAD_REQUEST);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanPhone = (mobileNumber || phone || '').trim() || undefined;
    const fullName = (name || `${firstName || ''} ${lastName || ''}`.trim() || 'Customer').trim();

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, ...(cleanPhone ? [{ phone: cleanPhone }] : [])],
    });

    if (existingUser) {
      if (existingUser.email === normalizedEmail) {
        throw new ApiError(400, 'Email is already registered', ERROR_CODES.CONFLICT);
      }
      if (cleanPhone && existingUser.phone === cleanPhone) {
        throw new ApiError(400, 'Phone number is already registered', ERROR_CODES.CONFLICT);
      }
    }

    try {
      // Resolve referredBy user if referral code provided
      let referrer = null;
      let referralPath = [];
      if (referralCode && referralCode.trim()) {
        const validation = await mlmRewardService.validateReferralCode(referralCode, ROLES.CUSTOMER);
        if (!validation.valid) {
          throw new ApiError(400, validation.message, ERROR_CODES.BAD_REQUEST);
        }
        referrer = await User.findById(validation.referrerId);
        if (referrer) {
          referralPath = [...(referrer.referralPath || []), referrer._id];
        }
      }

      let qrCode = null;
      let shop = null;
      if (shopQrToken) {
        qrCode = await ShopQRCode.findOne({ publicToken: shopQrToken, status: 'ACTIVE' });
        if (!qrCode) {
          throw new ApiError(400, 'Invalid or revoked QR code', ERROR_CODES.BAD_REQUEST);
        }
        shop = await Shop.findOne({ _id: qrCode.shopId, status: 'ACTIVE' });
        if (!shop) {
          throw new ApiError(400, 'Associated shop is inactive or suspended', ERROR_CODES.BAD_REQUEST);
        }
      }

      const { vendorReferralService } = await import('./vendorReferralService.js');
      let vendorReferral = null;
      if (reqBody.vendorReferralCode) {
        vendorReferral = await vendorReferralService.resolveVendorByCode(reqBody.vendorReferralCode);
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Generate unique referral code for new customer
      let newReferralCode = User.generateReferralCode(fullName);
      let isCodeUnique = false;
      let attempts = 0;
      while (!isCodeUnique && attempts < 5) {
        const codeExists = await User.findOne({ referralCode: newReferralCode });
        if (!codeExists) {
          isCodeUnique = true;
        } else {
          newReferralCode = User.generateReferralCode(fullName);
          attempts++;
        }
      }

      // Explicitly enforce canonical role: CUSTOMER (rejects client role overrides)
      const user = new User({
        name: fullName,
        email: normalizedEmail,
        phone: cleanPhone,
        passwordHash,
        referralCode: newReferralCode,
        referredBy: referrer ? referrer._id : null,
        referralPath,
        role: ROLES.CUSTOMER,
        attributedShopId: shop ? shop._id : null,
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        termsVersion: termsVersion || '1.0',
      });
      await user.save();

      // Persist immutable audit record of legal agreement acceptance
      try {
        await legalDocumentService.recordConsent({
          userId: user._id,
          accountIdentifier: normalizedEmail,
          role: ROLES.CUSTOMER,
          documentType: LEGAL_DOCUMENT_TYPES.CUSTOMER_TERMS,
          version: termsVersion,
        });
        await legalDocumentService.recordConsent({
          userId: user._id,
          accountIdentifier: normalizedEmail,
          role: ROLES.CUSTOMER,
          documentType: LEGAL_DOCUMENT_TYPES.PRIVACY_POLICY,
          version: termsVersion,
        });
      } catch (consentErr) {
        console.error('[authService] Failed to record customer legal consent:', consentErr.message);
      }

      // Create linked CustomerProfile (Role-specific customer data model)
      let initialAddressId = null;
      let addrLine = '';
      let addrCity = city || '';
      let addrState = state || '';
      let addrCountry = country || 'India';
      let addrPincode = pincode || '';

      if (address && typeof address === 'object') {
        addrLine = address.addressLine1 || address.streetAddress || address.addressLine || address.fullAddress || '';
        addrCity = address.city || addrCity;
        addrState = address.state || addrState;
        addrCountry = address.country || addrCountry;
        addrPincode = address.postalCode || address.pincode || addrPincode;
      } else if (typeof address === 'string') {
        addrLine = address;
      }

      if (addrLine || addrCity || addrState || addrPincode) {
        const userAddr = await UserAddress.create({
          userId: user._id,
          name: fullName,
          phone: cleanPhone || '9999999999',
          streetAddress: addrLine || 'Primary Address',
          city: addrCity || 'City',
          state: addrState || 'State',
          postalCode: addrPincode || '000000',
          country: addrCountry || 'India',
          isDefault: true,
        });
        initialAddressId = userAddr._id;
      }

      const parsedFirstName = firstName || fullName.split(' ')[0] || '';
      const parsedLastName = lastName || (fullName.split(' ').length > 1 ? fullName.split(' ').slice(1).join(' ') : '');

      await CustomerProfile.create({
        userId: user._id,
        firstName: parsedFirstName,
        lastName: parsedLastName,
        referralCode: newReferralCode,
        referredBy: referrer ? referrer._id : null,
        addresses: initialAddressId ? [initialAddressId] : [],
        defaultAddress: initialAddressId,
      });

      if (referrer) {
        await logAdminAction({
          userId: user._id,
          action: 'REFERRAL_CREATED',
          entity: 'User',
          entityId: String(user._id),
          oldValue: null,
          newValue: { referrerId: String(referrer._id), referralCode: referralCode.trim().toUpperCase() },
        });
      }

      if (shop) {
        await CustomerShopAttribution.create({
          customerUserId: user._id,
          shopId: shop._id,
          qrCodeId: qrCode._id,
          attributedVia: 'QR_CODE',
          status: 'ACTIVE',
        });
      }

      if (vendorReferral) {
        await vendorReferralService.createPrimaryAttribution(
          user._id,
          vendorReferral.vendorId._id,
          'REFERRAL_LINK',
          vendorReferral.code,
          null
        );
      }

      // Fire MLM registration rewards (welcome bonus + upline coins)
      try {
        await mlmRewardService.processReferralRegistrationRewards(user._id, referrer ? referrer._id : null);
      } catch (err) {
        console.error('[authService] MLM registration reward error:', err);
      }

      const tokens = await tokenService.generateTokens(user);

      const userResponse = user.toObject();
      delete userResponse.passwordHash;
      delete userResponse.refreshTokenHash;

      return { user: userResponse, tokens };
    } catch (err) {
      throw err;
    }
  },

  async login({ email, password, portal }) {
    const input = (email || '').trim();
    const query = input.includes('@')
      ? { email: input.toLowerCase() }
      : { $or: [{ phone: input }, { email: input.toLowerCase() }, { username: input.toLowerCase() }] };

    const user = await User.findOne(query).select('+passwordHash');
    if (!user) {
      throw new ApiError(401, 'Invalid email, mobile number or password', ERROR_CODES.UNAUTHORIZED);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid email, mobile number or password', ERROR_CODES.UNAUTHORIZED);
    }

    if (user.status === USER_STATUS.SUSPENDED) {
      throw new ApiError(403, 'Your account has been suspended. Please contact platform support.', ERROR_CODES.FORBIDDEN);
    }

    if (user.status === USER_STATUS.DELETED) {
      throw new ApiError(403, 'This account has been closed and deleted per data deletion request.', ERROR_CODES.FORBIDDEN);
    }

    // Strict Canonical Portal Validation
    if (portal) {
      if (portal === 'CUSTOMER') {
        if (user.role !== ROLES.CUSTOMER) {
          if (user.role === ROLES.VENDOR) {
            throw new ApiError(403, 'This account is registered as a Vendor. Please use Vendor Login.', ERROR_CODES.FORBIDDEN);
          } else if (user.role === ROLES.SUPER_ADMIN) {
            throw new ApiError(403, 'This account is registered as a Super Admin. Please use Super Admin Login.', ERROR_CODES.FORBIDDEN);
          } else {
            throw new ApiError(403, `This role (${user.role}) cannot sign in through Customer portal.`, ERROR_CODES.FORBIDDEN);
          }
        }
      } else if (portal === 'VENDOR') {
        if (user.role !== ROLES.VENDOR) {
          if (user.role === ROLES.CUSTOMER) {
            throw new ApiError(403, 'This account is registered as a Customer. Please use Customer Login.', ERROR_CODES.FORBIDDEN);
          } else if (user.role === ROLES.SUPER_ADMIN) {
            throw new ApiError(403, 'This account is registered as a Super Admin. Please use Super Admin Login.', ERROR_CODES.FORBIDDEN);
          } else {
            throw new ApiError(403, 'Unauthorized. Please use the appropriate login portal.', ERROR_CODES.FORBIDDEN);
          }
        }
      } else if (portal === 'ADMIN' || portal === 'SUPER_ADMIN') {
        if (user.role !== ROLES.SUPER_ADMIN) {
          throw new ApiError(403, 'Access Denied: Only Super Admins can access this portal.', ERROR_CODES.FORBIDDEN);
        }
      }
    }

    let vendorData = null;
    if (user.role === ROLES.VENDOR) {
      const { Vendor } = await import('../models/Vendor.js');
      const vendor = await Vendor.findOne({ userId: user._id });
      if (vendor) {
        vendorData = {
          id: vendor._id,
          storeName: vendor.storeName,
          status: vendor.status,
          kycStatus: vendor.kycStatus,
        };
        if (portal === 'VENDOR') {
          if (vendor.status === 'PENDING' || vendor.status === 'UNDER_REVIEW') {
            throw new ApiError(403, 'Waiting for Super Admin Approval. Your vendor registration is currently under review.', ERROR_CODES.FORBIDDEN, { vendorStatus: vendor.status });
          }
          if (vendor.status === 'REJECTED') {
            throw new ApiError(403, 'Your vendor application has been rejected. Please contact platform support.', ERROR_CODES.FORBIDDEN, { vendorStatus: 'REJECTED' });
          }
          if (vendor.status === 'SUSPENDED' || vendor.status === 'BLOCKED') {
            throw new ApiError(403, 'Your vendor account is suspended. Dashboard access is blocked.', ERROR_CODES.FORBIDDEN, { vendorStatus: vendor.status });
          }
        }
      }
    }

    // Enforce Super Admin Mandatory MFA
    if (user.role === ROLES.SUPER_ADMIN && user.mfaEnabled) {
      const jwt = (await import('jsonwebtoken')).default;
      const mfaToken = jwt.sign(
        { id: user._id, role: user.role, type: 'MFA_PENDING' },
        process.env.JWT_SECRET || 'fairkart_jwt_secret_key_prod_2026',
        { expiresIn: '5m' }
      );
      return {
        mfaRequired: true,
        mfaToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    }

    user.lastLoginAt = new Date();
    await user.save();

    const tokens = await tokenService.generateTokens(user);

    const userResponse = user.toObject();
    delete userResponse.passwordHash;
    delete userResponse.refreshTokenHash;

    return { user: { ...userResponse, vendor: vendorData }, tokens };
  },

  async refreshTokens(refreshToken) {
    if (!refreshToken) {
      throw new ApiError(400, 'Refresh token is required', ERROR_CODES.BAD_REQUEST);
    }

    try {
      const user = await tokenService.verifyAndRotateRefreshToken(refreshToken);
      const tokens = await tokenService.generateTokens(user);
      return { user, tokens };
    } catch (err) {
      throw new ApiError(401, 'Invalid or expired refresh token', ERROR_CODES.INVALID_TOKEN);
    }
  },

  async logout(userId) {
    if (userId) {
      await tokenService.revokeRefreshToken(userId);
    }
  },
};
