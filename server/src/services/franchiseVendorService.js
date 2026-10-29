import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Vendor } from '../models/Vendor.js';
import { VendorBusiness } from '../models/VendorBusiness.js';
import { VendorAddress } from '../models/VendorAddress.js';
import { VendorDocument } from '../models/VendorDocument.js';
import { VendorBankAccount } from '../models/VendorBankAccount.js';
import { Product } from '../models/Product.js';
import { VendorOrder } from '../models/VendorOrder.js';
import { VendorActivity } from '../models/VendorActivity.js';
import { tokenService } from './tokenService.js';
import { logVendorActivity } from './vendorActivityService.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';
import { ROLES, USER_STATUS } from '../constants/roles.js';
import { legalDocumentService } from './legalDocumentService.js';
import { LEGAL_DOCUMENT_TYPES } from '../models/LegalDocument.js';

export const franchiseVendorService = {
  /**
   * Calculate real database summary cards for the Super Admin Franchise Dashboard
   */
  async getFranchiseDashboardStats() {
    const totalAppointed = await Vendor.countDocuments({ vendorType: 'FRANCHISE_VENDOR' });
    const activeVendors = await Vendor.countDocuments({
      vendorType: 'FRANCHISE_VENDOR',
      activationStatus: 'ACTIVE',
      status: 'APPROVED',
    });
    const pendingInvitations = await Vendor.countDocuments({
      vendorType: 'FRANCHISE_VENDOR',
      activationStatus: 'PENDING_ACTIVATION',
      invitationStatus: { $in: ['PENDING', 'SENT'] },
    });
    const activatedVendors = await Vendor.countDocuments({
      vendorType: 'FRANCHISE_VENDOR',
      activationStatus: 'ACTIVE',
    });
    const suspendedVendors = await Vendor.countDocuments({
      vendorType: 'FRANCHISE_VENDOR',
      $or: [{ status: 'SUSPENDED' }, { activationStatus: 'SUSPENDED' }],
    });

    // Get all franchise vendor IDs for product & order queries
    const franchiseVendors = await Vendor.find({ vendorType: 'FRANCHISE_VENDOR' }).select('_id');
    const franchiseIds = franchiseVendors.map((v) => v._id);

    let totalProducts = 0;
    let totalOrders = 0;
    let totalPaidSales = 0;

    if (franchiseIds.length > 0) {
      totalProducts = await Product.countDocuments({
        vendorId: { $in: franchiseIds },
        isDeleted: false,
      });

      totalOrders = await VendorOrder.countDocuments({
        vendorId: { $in: franchiseIds },
      });

      const salesAgg = await VendorOrder.aggregate([
        {
          $match: {
            vendorId: { $in: franchiseIds },
            status: { $nin: ['CANCELLED', 'REFUNDED'] },
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$grandTotal' },
          },
        },
      ]);
      totalPaidSales = salesAgg.length > 0 ? Math.round(salesAgg[0].totalSales * 100) / 100 : 0;
    }

    return {
      totalAppointed,
      activeVendors,
      pendingInvitations,
      activatedVendors,
      suspendedVendors,
      totalProducts,
      totalOrders,
      totalPaidSales,
    };
  },

  /**
   * Super Admin creates and appoints a new Franchise Vendor
   */
  async createFranchiseVendor(superAdminUser, data, ipAddress = '') {
    const {
      name,
      username,
      phone,
      whatsappNumber,
      email,
      storeName,
      state,
      district,
      taluk,
      fullAddress = '',
      franchiseCode,
      appointmentNotes = '',
    } = data;

    // Required field validation
    if (!name || !username || !phone || !storeName || !state || !district || !taluk) {
      throw new ApiError(400, 'Name, username, phone, store name, state, district, and taluk are required.', ERROR_CODES.BAD_REQUEST);
    }

    const cleanUsername = String(username).toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
    if (cleanUsername.length < 3) {
      throw new ApiError(400, 'Username must be at least 3 alphanumeric characters.', ERROR_CODES.BAD_REQUEST);
    }

    // Phone normalization (country code 91 for Indian numbers if not already provided)
    let cleanPhone = String(phone).replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      throw new ApiError(400, 'Invalid phone number format.', ERROR_CODES.BAD_REQUEST);
    }

    let cleanWhatsapp = whatsappNumber ? String(whatsappNumber).replace(/[^0-9]/g, '') : cleanPhone;
    if (cleanWhatsapp.length === 10) cleanWhatsapp = `91${cleanWhatsapp}`;

    // Normalize email (if missing, generate unique placeholder)
    const normalizedEmail = email && String(email).trim().includes('@')
      ? String(email).toLowerCase().trim()
      : `${cleanUsername}@franchise.baapoomart.com`;

    // Normalize franchiseCode (or generate)
    const cleanCode = franchiseCode && String(franchiseCode).trim()
      ? String(franchiseCode).toUpperCase().trim()
      : `FR-${cleanUsername.toUpperCase().slice(0, 6)}-${Math.floor(100 + Math.random() * 900)}`;

    // Uniqueness checks
    const existingUsername = await User.findOne({ username: cleanUsername });
    if (existingUsername) {
      throw new ApiError(409, `Username '${cleanUsername}' is already taken. Please choose another.`, ERROR_CODES.CONFLICT);
    }

    const existingPhone = await User.findOne({ phone: cleanPhone });
    if (existingPhone) {
      throw new ApiError(409, `Phone number '${cleanPhone}' is already registered with another account.`, ERROR_CODES.CONFLICT);
    }

    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      throw new ApiError(409, `Email '${normalizedEmail}' is already registered.`, ERROR_CODES.CONFLICT);
    }

    const existingCode = await Vendor.findOne({ franchiseCode: cleanCode });
    if (existingCode) {
      throw new ApiError(409, `Franchise code '${cleanCode}' is already in use.`, ERROR_CODES.CONFLICT);
    }

    // Generate cryptographically secure invitation token (single use, 24-hr expiry)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Generate random dummy password hash for initial pending state
    const dummyPassword = crypto.randomBytes(32).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dummyPassword, salt);

    // Generate unique referral code
    let referralCode = User.generateReferralCode(name, ROLES.VENDOR);
    let codeExists = await User.findOne({ referralCode });
    while (codeExists) {
      referralCode = User.generateReferralCode(name, ROLES.VENDOR);
      codeExists = await User.findOne({ referralCode });
    }

    // Generate unique store slug
    const baseSlug = String(storeName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

    // Transaction for atomic account creation (use session if ReplicaSet/Sharded, else direct with compensation)
    const topologyType = mongoose.connection.client?.topology?.description?.type;
    const isReplicaSet = ['ReplicaSetWithPrimary', 'Sharded'].includes(topologyType);

    let session = null;
    let useTransaction = false;
    if (isReplicaSet) {
      try {
        session = await mongoose.startSession();
        session.startTransaction();
        useTransaction = true;
      } catch (sessionErr) {
        session = null;
        useTransaction = false;
      }
    }

    let createdUser, createdVendor;
    try {
      createdUser = new User({
        name,
        username: cleanUsername,
        email: normalizedEmail,
        phone: cleanPhone,
        passwordHash,
        role: ROLES.VENDOR,
        status: USER_STATUS.PENDING,
        referralCode,
      });
      await (useTransaction ? createdUser.save({ session }) : createdUser.save());

      createdVendor = new Vendor({
        userId: createdUser._id,
        storeName,
        slug,
        phone: cleanPhone,
        whatsappNumber: cleanWhatsapp,
        email: normalizedEmail,
        username: cleanUsername,
        vendorType: 'FRANCHISE_VENDOR',
        appointedBy: superAdminUser._id,
        appointedAt: new Date(),
        appointmentNotes,
        franchiseCode: cleanCode,
        territory: {
          state: String(state).trim(),
          district: String(district).trim(),
          taluk: String(taluk).trim(),
          fullAddress: String(fullAddress).trim(),
        },
        address: {
          street: fullAddress || '',
          city: taluk || '',
          state: state || '',
          country: 'India',
        },
        status: 'PENDING',
        activationStatus: 'PENDING_ACTIVATION',
        isPaid: true, // Waived platform fee for Super Admin appointed Franchise Vendor
        paymentStatus: 'PAID',
        invitationTokenHash: tokenHash,
        invitationTokenExpiry: tokenExpiry,
        invitationStatus: 'PENDING',
        termsAccepted: true,
        termsAcceptedAt: new Date(),
      });
      await (useTransaction ? createdVendor.save({ session }) : createdVendor.save());

      // Create linked auxiliary models
      const businessDoc = {
        vendorId: createdVendor._id,
        storeName,
        description: `Franchise Store: ${storeName} (${taluk}, ${district})`,
        businessType: 'FRANCHISE',
      };
      if (useTransaction) {
        await VendorBusiness.create([businessDoc], { session });
      } else {
        await VendorBusiness.create(businessDoc);
      }

      // Resolve or fallback Territory ObjectIds for VendorAddress
      const { Territory } = await import('../models/Territory.js');
      let stateDoc = await Territory.findOne({ name: new RegExp(`^${String(state).trim()}$`, 'i'), type: 'STATE' });
      if (!stateDoc) stateDoc = await Territory.findOne({ type: 'STATE' });

      let distDoc = await Territory.findOne({ name: new RegExp(`^${String(district).trim()}$`, 'i'), type: 'DISTRICT' });
      if (!distDoc) distDoc = await Territory.findOne({ type: 'DISTRICT' });

      let talukDoc = await Territory.findOne({ name: new RegExp(`^${String(taluk).trim()}$`, 'i'), type: 'TALUK' });
      if (!talukDoc) talukDoc = await Territory.findOne({ type: 'TALUK' });

      if (stateDoc && distDoc && talukDoc) {
        const addressDoc = {
          vendorId: createdVendor._id,
          state: stateDoc._id,
          district: distDoc._id,
          talukArea: talukDoc._id,
          pincode: data.pincode || '560001',
          fullAddress: fullAddress || `${taluk}, ${district}, ${state}`,
        };
        if (useTransaction) {
          await VendorAddress.create([addressDoc], { session });
        } else {
          await VendorAddress.create(addressDoc);
        }
      }

      const docKyc = {
        vendorId: createdVendor._id,
        identityDocumentType: 'AADHAAR',
        identityDocumentNumber: 'SUPER_ADMIN_APPOINTED',
        identityDocumentUpload: 'verified_by_super_admin',
      };
      if (useTransaction) {
        await VendorDocument.create([docKyc], { session });
      } else {
        await VendorDocument.create(docKyc);
      }

      const bankDoc = {
        vendorId: createdVendor._id,
        accountHolderName: name,
        bankName: 'Pending Vendor Details',
        accountNumber: '0000000000',
        ifscCode: 'BAAP0000001',
      };
      if (useTransaction) {
        await VendorBankAccount.create([bankDoc], { session });
      } else {
        await VendorBankAccount.create(bankDoc);
      }

      if (useTransaction && session) {
        await session.commitTransaction();
      }
    } catch (createErr) {
      if (useTransaction && session) {
        await session.abortTransaction();
      } else {
        // Rollback any partially created documents on non-replica set
        if (createdUser?._id) await User.findByIdAndDelete(createdUser._id).catch(() => {});
        if (createdVendor?._id) {
          await Vendor.findByIdAndDelete(createdVendor._id).catch(() => {});
          await VendorBusiness.deleteMany({ vendorId: createdVendor._id }).catch(() => {});
          await VendorAddress.deleteMany({ vendorId: createdVendor._id }).catch(() => {});
          await VendorDocument.deleteMany({ vendorId: createdVendor._id }).catch(() => {});
          await VendorBankAccount.deleteMany({ vendorId: createdVendor._id }).catch(() => {});
        }
      }
      throw createErr;
    } finally {
      if (session) session.endSession();
    }

    // Log Activity Records
    await logVendorActivity({
      vendorId: createdVendor._id,
      actorId: superAdminUser._id,
      actorRole: 'SUPER_ADMIN',
      actorName: superAdminUser.name || 'Super Admin',
      eventType: 'FRANCHISE_VENDOR_CREATED',
      description: `Super Admin appointed new Franchise Vendor: ${name} (${storeName}) under code ${cleanCode}`,
      metadata: { username: cleanUsername, phone: cleanPhone, state, district, taluk },
      ipAddress,
    });

    await logVendorActivity({
      vendorId: createdVendor._id,
      actorId: superAdminUser._id,
      actorRole: 'SUPER_ADMIN',
      actorName: superAdminUser.name || 'Super Admin',
      eventType: 'INVITATION_GENERATED',
      description: `Cryptographic invitation link generated (expires in 24 hours)`,
      metadata: { expiry: tokenExpiry },
      ipAddress,
    });

    return {
      vendor: {
        _id: createdVendor._id,
        userId: createdUser._id,
        name: createdUser.name,
        username: cleanUsername,
        phone: cleanPhone,
        whatsappNumber: cleanWhatsapp,
        email: normalizedEmail,
        storeName: createdVendor.storeName,
        franchiseCode: cleanCode,
        territory: createdVendor.territory,
        status: createdVendor.status,
        activationStatus: createdVendor.activationStatus,
        invitationStatus: createdVendor.invitationStatus,
        appointedAt: createdVendor.appointedAt,
      },
      invitationToken: rawToken,
    };
  },

  /**
   * List Franchise Vendors with search, filter, pagination, and real metrics
   */
  async getFranchiseVendors({
    search = '',
    state = '',
    district = '',
    taluk = '',
    accountStatus = '',
    invitationStatus = '',
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  }) {
    const filter = { vendorType: 'FRANCHISE_VENDOR' };

    if (state) filter['territory.state'] = new RegExp(`^${state.trim()}$`, 'i');
    if (district) filter['territory.district'] = new RegExp(`^${district.trim()}$`, 'i');
    if (taluk) filter['territory.taluk'] = new RegExp(`^${taluk.trim()}$`, 'i');

    if (accountStatus && accountStatus !== 'ALL') {
      if (accountStatus === 'ACTIVE') {
        filter.activationStatus = 'ACTIVE';
        filter.status = 'APPROVED';
      } else if (accountStatus === 'PENDING_ACTIVATION') {
        filter.activationStatus = 'PENDING_ACTIVATION';
      } else if (accountStatus === 'SUSPENDED') {
        filter.$or = [{ status: 'SUSPENDED' }, { activationStatus: 'SUSPENDED' }];
      }
    }

    if (invitationStatus && invitationStatus !== 'ALL') {
      filter.invitationStatus = invitationStatus;
    }

    if (search && search.trim()) {
      const s = search.trim();
      const regex = new RegExp(s, 'i');
      filter.$or = [
        { storeName: regex },
        { username: regex },
        { phone: regex },
        { whatsappNumber: regex },
        { franchiseCode: regex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await Vendor.countDocuments(filter);
    const vendors = await Vendor.find(filter)
      .populate('userId', 'name email phone username status lastLoginAt')
      .populate('appointedBy', 'name email')
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Attach real live statistics (productsCount, ordersCount, paidSales, lastActivity)
    const enrichedVendors = await Promise.all(
      vendors.map(async (v) => {
        const [productsCount, ordersCount, salesAgg, lastActivity] = await Promise.all([
          Product.countDocuments({ vendorId: v._id, isDeleted: false }),
          VendorOrder.countDocuments({ vendorId: v._id }),
          VendorOrder.aggregate([
            {
              $match: {
                vendorId: v._id,
                status: { $nin: ['CANCELLED', 'REFUNDED'] },
              },
            },
            { $group: { _id: null, total: { $sum: '$grandTotal' } } },
          ]),
          VendorActivity.findOne({ vendorId: v._id }).sort({ createdAt: -1 }).select('createdAt eventType description'),
        ]);

        return {
          ...v,
          productsCount,
          ordersCount,
          paidSales: salesAgg.length > 0 ? Math.round(salesAgg[0].total * 100) / 100 : 0,
          lastActivity: lastActivity || null,
        };
      })
    );

    return {
      vendors: enrichedVendors,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      limit: limitNum,
    };
  },

  /**
   * Get complete details of a single franchise vendor
   */
  async getFranchiseVendorById(vendorId) {
    const vendor = await Vendor.findById(vendorId)
      .populate('userId', 'name email phone username status lastLoginAt createdAt')
      .populate('appointedBy', 'name email')
      .lean();

    if (!vendor || vendor.vendorType !== 'FRANCHISE_VENDOR') {
      throw new ApiError(404, 'Franchise Vendor not found', ERROR_CODES.NOT_FOUND);
    }

    const [business, location, kyc, bank, productsCount, ordersCount, salesAgg] = await Promise.all([
      VendorBusiness.findOne({ vendorId }).lean(),
      VendorAddress.findOne({ vendorId }).lean(),
      VendorDocument.findOne({ vendorId }).lean(),
      VendorBankAccount.findOne({ vendorId }).lean(),
      Product.countDocuments({ vendorId, isDeleted: false }),
      VendorOrder.countDocuments({ vendorId }),
      VendorOrder.aggregate([
        {
          $match: {
            vendorId: new mongoose.Types.ObjectId(vendorId),
            status: { $nin: ['CANCELLED', 'REFUNDED'] },
          },
        },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } },
      ]),
    ]);

    const totalPaidSales = salesAgg.length > 0 ? Math.round(salesAgg[0].total * 100) / 100 : 0;

    return {
      vendor,
      business,
      location,
      kyc,
      bank,
      stats: {
        productsCount,
        ordersCount,
        totalPaidSales,
      },
    };
  },

  /**
   * Update permitted details of a franchise vendor
   */
  async updateFranchiseVendor(vendorId, updateData, actor, ipAddress = '') {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor || vendor.vendorType !== 'FRANCHISE_VENDOR') {
      throw new ApiError(404, 'Franchise Vendor not found', ERROR_CODES.NOT_FOUND);
    }

    const { storeName, phone, whatsappNumber, territory, appointmentNotes } = updateData;

    if (storeName) vendor.storeName = storeName;
    if (phone) {
      let cleanPhone = String(phone).replace(/[^0-9]/g, '');
      if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;
      vendor.phone = cleanPhone;
      await User.findByIdAndUpdate(vendor.userId, { phone: cleanPhone });
    }
    if (whatsappNumber !== undefined) {
      let cleanWa = whatsappNumber ? String(whatsappNumber).replace(/[^0-9]/g, '') : vendor.phone;
      if (cleanWa.length === 10) cleanWa = `91${cleanWa}`;
      vendor.whatsappNumber = cleanWa;
    }
    if (appointmentNotes !== undefined) vendor.appointmentNotes = appointmentNotes;
    if (territory) {
      vendor.territory = {
        state: territory.state || vendor.territory?.state || '',
        district: territory.district || vendor.territory?.district || '',
        taluk: territory.taluk || vendor.territory?.taluk || '',
        fullAddress: territory.fullAddress || vendor.territory?.fullAddress || '',
      };
      await VendorAddress.findOneAndUpdate(
        { vendorId },
        {
          state: vendor.territory.state,
          district: vendor.territory.district,
          talukArea: vendor.territory.taluk,
          fullAddress: vendor.territory.fullAddress,
        }
      );
    }

    await vendor.save();

    await logVendorActivity({
      vendorId: vendor._id,
      actorId: actor._id,
      actorRole: 'SUPER_ADMIN',
      actorName: actor.name || 'Super Admin',
      eventType: 'PROFILE_UPDATED',
      description: `Super Admin updated vendor store profile and territory information`,
      metadata: { storeName: vendor.storeName, phone: vendor.phone, territory: vendor.territory },
      ipAddress,
    });

    return vendor;
  },

  /**
   * Reissue a fresh invitation link (invalidates old, 24hr expiry)
   */
  async reissueInvitation(vendorId, actor, ipAddress = '') {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor || vendor.vendorType !== 'FRANCHISE_VENDOR') {
      throw new ApiError(404, 'Franchise Vendor not found', ERROR_CODES.NOT_FOUND);
    }

    if (vendor.activationStatus === 'ACTIVE') {
      throw new ApiError(400, 'This account is already active and cannot receive a new activation invitation.', ERROR_CODES.BAD_REQUEST);
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    vendor.invitationTokenHash = tokenHash;
    vendor.invitationTokenExpiry = tokenExpiry;
    vendor.invitationStatus = 'PENDING';
    vendor.invitationSentAt = null;
    vendor.invitationManuallyMarkedSentAt = null;
    await vendor.save();

    await logVendorActivity({
      vendorId: vendor._id,
      actorId: actor._id,
      actorRole: 'SUPER_ADMIN',
      actorName: actor.name || 'Super Admin',
      eventType: 'INVITATION_REISSUED',
      description: `Super Admin reissued invitation link (previous link invalidated; new link valid for 24 hours)`,
      metadata: { expiry: tokenExpiry },
      ipAddress,
    });

    return {
      vendor,
      invitationToken: rawToken,
    };
  },

  /**
   * Revoke an existing invitation
   */
  async revokeInvitation(vendorId, actor, ipAddress = '') {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor || vendor.vendorType !== 'FRANCHISE_VENDOR') {
      throw new ApiError(404, 'Franchise Vendor not found', ERROR_CODES.NOT_FOUND);
    }

    if (vendor.activationStatus === 'ACTIVE') {
      throw new ApiError(400, 'Cannot revoke invitation for an already active vendor account.', ERROR_CODES.BAD_REQUEST);
    }

    vendor.invitationTokenHash = null;
    vendor.invitationTokenExpiry = null;
    vendor.invitationStatus = 'REVOKED';
    await vendor.save();

    await logVendorActivity({
      vendorId: vendor._id,
      actorId: actor._id,
      actorRole: 'SUPER_ADMIN',
      actorName: actor.name || 'Super Admin',
      eventType: 'INVITATION_REVOKED',
      description: `Super Admin revoked the pending invitation link`,
      ipAddress,
    });

    return vendor;
  },

  /**
   * Record that the Super Admin manually sent the invitation via WhatsApp
   */
  async markInvitationSent(vendorId, actor, ipAddress = '') {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor || vendor.vendorType !== 'FRANCHISE_VENDOR') {
      throw new ApiError(404, 'Franchise Vendor not found', ERROR_CODES.NOT_FOUND);
    }

    vendor.invitationStatus = 'SENT';
    vendor.invitationSentAt = new Date();
    vendor.invitationManuallyMarkedSentAt = new Date();
    await vendor.save();

    await logVendorActivity({
      vendorId: vendor._id,
      actorId: actor._id,
      actorRole: 'SUPER_ADMIN',
      actorName: actor.name || 'Super Admin',
      eventType: 'INVITATION_MARKED_SENT',
      description: `Super Admin recorded that invitation was initiated via WhatsApp`,
      ipAddress,
    });

    return vendor;
  },

  /**
   * Record that WhatsApp click-to-chat URL was opened
   */
  async recordWhatsAppOpened(vendorId, actor, ipAddress = '') {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor || vendor.vendorType !== 'FRANCHISE_VENDOR') {
      throw new ApiError(404, 'Franchise Vendor not found', ERROR_CODES.NOT_FOUND);
    }

    await logVendorActivity({
      vendorId: vendor._id,
      actorId: actor._id,
      actorRole: 'SUPER_ADMIN',
      actorName: actor.name || 'Super Admin',
      eventType: 'WHATSAPP_LINK_OPENED',
      description: `Super Admin clicked 'Open WhatsApp & Send Invitation' button`,
      ipAddress,
    });

    return { success: true };
  },

  /**
   * Suspend or Reactivate Franchise Vendor
   */
  async updateVendorStatus(vendorId, { status }, actor, ipAddress = '') {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor || vendor.vendorType !== 'FRANCHISE_VENDOR') {
      throw new ApiError(404, 'Franchise Vendor not found', ERROR_CODES.NOT_FOUND);
    }

    if (status === 'SUSPENDED') {
      vendor.status = 'SUSPENDED';
      vendor.activationStatus = 'SUSPENDED';
      await User.findByIdAndUpdate(vendor.userId, { status: USER_STATUS.SUSPENDED });

      await logVendorActivity({
        vendorId: vendor._id,
        actorId: actor._id,
        actorRole: 'SUPER_ADMIN',
        actorName: actor.name || 'Super Admin',
        eventType: 'ACCOUNT_SUSPENDED',
        description: `Super Admin suspended franchise vendor account`,
        ipAddress,
      });
    } else if (status === 'ACTIVE' || status === 'APPROVED') {
      vendor.status = 'APPROVED';
      vendor.activationStatus = 'ACTIVE';
      await User.findByIdAndUpdate(vendor.userId, { status: USER_STATUS.ACTIVE });

      await logVendorActivity({
        vendorId: vendor._id,
        actorId: actor._id,
        actorRole: 'SUPER_ADMIN',
        actorName: actor.name || 'Super Admin',
        eventType: 'ACCOUNT_REACTIVATED',
        description: `Super Admin reactivated franchise vendor account`,
        ipAddress,
      });
    } else {
      throw new ApiError(400, 'Invalid status update', ERROR_CODES.BAD_REQUEST);
    }

    await vendor.save();
    return vendor;
  },

  /**
   * Get activity logs for a specific vendor
   */
  async getFranchiseVendorActivities(vendorId, { page = 1, limit = 20, eventType = '' }) {
    const filter = { vendorId };
    if (eventType && eventType !== 'ALL') filter.eventType = eventType;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const total = await VendorActivity.countDocuments(filter);
    const activities = await VendorActivity.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    return {
      activities,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
    };
  },

  /**
   * Get platform-wide activity logs
   */
  async getAllVendorActivities({ page = 1, limit = 20, eventType = '', vendorId = '', startDate, endDate }) {
    const filter = {};
    if (vendorId) filter.vendorId = vendorId;
    if (eventType && eventType !== 'ALL') filter.eventType = eventType;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const total = await VendorActivity.countDocuments(filter);
    const activities = await VendorActivity.find(filter)
      .populate('vendorId', 'storeName username territory')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    return {
      activities,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
    };
  },

  /**
   * Get products listed by this franchise vendor
   */
  async getFranchiseVendorProducts(vendorId, { page = 1, limit = 20, search = '' }) {
    const filter = { vendorId, isDeleted: false };
    if (search && search.trim()) {
      filter.name = new RegExp(search.trim(), 'i');
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    return {
      products,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
    };
  },

  /**
   * Get orders associated with this franchise vendor
   */
  async getFranchiseVendorOrders(vendorId, { page = 1, limit = 20, status = '' }) {
    const filter = { vendorId };
    if (status && status !== 'ALL') filter.status = status;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const total = await VendorOrder.countDocuments(filter);
    const orders = await VendorOrder.find(filter)
      .populate('userId', 'name email phone')
      .populate('parentOrderId', 'orderNumber paymentStatus')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    return {
      orders,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
    };
  },

  /**
   * Daily sales report for this specific vendor
   */
  async getFranchiseVendorDailySales(vendorId, { days = 30 }) {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - parseInt(days, 10));

    const salesByDay = await VendorOrder.aggregate([
      {
        $match: {
          vendorId: new mongoose.Types.ObjectId(vendorId),
          status: { $nin: ['CANCELLED', 'REFUNDED'] },
          createdAt: { $gte: sinceDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalSales: { $sum: '$grandTotal' },
          vendorEarnings: { $sum: '$vendorEarning' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return salesByDay.map((s) => ({
      date: s._id,
      totalSales: Math.round(s.totalSales * 100) / 100,
      vendorEarnings: Math.round(s.vendorEarnings * 100) / 100,
      orderCount: s.orderCount,
    }));
  },

  /**
   * Platform-wide franchise reports and analytics
   */
  async getFranchiseReports() {
    // 1. Geographic distribution
    const geoDistribution = await Vendor.aggregate([
      { $match: { vendorType: 'FRANCHISE_VENDOR' } },
      {
        $group: {
          _id: { state: '$territory.state', district: '$territory.district' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]);

    // 2. Status distribution
    const statusDistribution = await Vendor.aggregate([
      { $match: { vendorType: 'FRANCHISE_VENDOR' } },
      {
        $group: {
          _id: '$activationStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    // 3. Appointed over time (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const timeline = await Vendor.aggregate([
      {
        $match: {
          vendorType: 'FRANCHISE_VENDOR',
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          appointed: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return {
      geoDistribution,
      statusDistribution,
      timeline,
    };
  },

  /**
   * PUBLIC ENDPOINT: Validate Invitation Token without consuming it
   */
  async validateInvitationToken(rawToken) {
    if (!rawToken || typeof rawToken !== 'string') {
      throw new ApiError(400, 'Invitation token is missing or malformed.', ERROR_CODES.BAD_REQUEST);
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken.trim()).digest('hex');

    const vendor = await Vendor.findOne({
      vendorType: 'FRANCHISE_VENDOR',
      invitationTokenHash: tokenHash,
    }).populate('userId', 'name email phone username status');

    if (!vendor) {
      throw new ApiError(404, 'Invalid invitation link. This link is unrecognized or has already been used.', ERROR_CODES.NOT_FOUND);
    }

    if (vendor.activationStatus === 'ACTIVE' || vendor.applicationStatus === 'APPROVED') {
      return {
        alreadyActivated: true,
        message: 'This account has already been approved and activated. Please proceed to the Vendor Login portal.',
        vendor: {
          storeName: vendor.storeName,
          username: vendor.username,
        },
      };
    }

    if (vendor.applicationStatus === 'SUBMITTED' || vendor.applicationStatus === 'UNDER_REVIEW') {
      return {
        alreadySubmitted: true,
        message: 'Your application and KYC documents have already been submitted and are under review by the Super Admin.',
        vendor: {
          storeName: vendor.storeName,
          username: vendor.username,
          applicationStatus: vendor.applicationStatus,
        },
      };
    }

    if (vendor.invitationStatus === 'REVOKED') {
      throw new ApiError(400, 'This invitation link has been revoked by the Super Admin. Please contact support.', ERROR_CODES.BAD_REQUEST);
    }

    if (vendor.invitationTokenExpiry && new Date() > new Date(vendor.invitationTokenExpiry)) {
      throw new ApiError(400, 'This invitation link has expired (links are valid for 24 hours). Please contact the Super Admin for a renewed invitation.', ERROR_CODES.BAD_REQUEST);
    }

    const [business, address, kyc] = await Promise.all([
      VendorBusiness.findOne({ vendorId: vendor._id }).lean(),
      VendorAddress.findOne({ vendorId: vendor._id }).lean(),
      VendorDocument.findOne({ vendorId: vendor._id }).lean(),
    ]);

    return {
      valid: true,
      alreadyActivated: false,
      alreadySubmitted: false,
      vendor: {
        id: vendor._id,
        name: vendor.userId?.name || '',
        username: vendor.username || '',
        email: vendor.email || vendor.userId?.email || '',
        phone: vendor.phone || vendor.userId?.phone || '',
        whatsappNumber: vendor.whatsappNumber || vendor.phone || '',
        storeName: vendor.storeName || '',
        franchiseCode: vendor.franchiseCode || '',
        territory: vendor.territory || {},
        businessType: business?.businessType || '',
        panNumber: business?.panNumber || '',
        gstNumber: business?.gstNumber || '',
        description: business?.description || vendor.description || '',
        pincode: address?.pincode || '',
        fullAddress: address?.fullAddress || vendor.territory?.fullAddress || '',
        associatedShopkeeper: address?.associatedShopkeeper || '',
        identityDocumentType: kyc?.identityDocumentNumber !== 'SUPER_ADMIN_APPOINTED' ? (kyc?.identityDocumentType || '') : '',
        identityDocumentNumber: kyc?.identityDocumentNumber !== 'SUPER_ADMIN_APPOINTED' ? (kyc?.identityDocumentNumber || '') : '',
        appointedAt: vendor.appointedAt,
        applicationStatus: vendor.applicationStatus || 'PENDING_APPLICATION',
      },
    };
  },

  /**
   * PUBLIC ENDPOINT: Securely Set Password & Activate Franchise Vendor Account
   */
  async activateFranchiseVendor(rawToken, { password, confirmPassword }, ipAddress = '') {
    if (!password || password.length < 6) {
      throw new ApiError(400, 'Password must be at least 6 characters in length.', ERROR_CODES.BAD_REQUEST);
    }

    if (confirmPassword && password !== confirmPassword) {
      throw new ApiError(400, 'Passwords do not match.', ERROR_CODES.BAD_REQUEST);
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken.trim()).digest('hex');

    const vendor = await Vendor.findOne({
      vendorType: 'FRANCHISE_VENDOR',
      invitationTokenHash: tokenHash,
    }).populate('userId');

    if (!vendor) {
      throw new ApiError(404, 'Invalid or expired invitation token.', ERROR_CODES.NOT_FOUND);
    }

    if (vendor.activationStatus === 'ACTIVE') {
      throw new ApiError(400, 'This account has already been activated.', ERROR_CODES.BAD_REQUEST);
    }

    if (vendor.invitationStatus === 'REVOKED') {
      throw new ApiError(400, 'This invitation has been revoked.', ERROR_CODES.BAD_REQUEST);
    }

    if (vendor.invitationTokenExpiry && new Date() > new Date(vendor.invitationTokenExpiry)) {
      throw new ApiError(400, 'This invitation has expired.', ERROR_CODES.BAD_REQUEST);
    }

    // Set permanent password securely
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.findById(vendor.userId._id);
    user.passwordHash = passwordHash;
    user.status = USER_STATUS.ACTIVE;
    user.lastLoginAt = new Date();
    await user.save();

    // Activate vendor and consume the single-use token atomically
    vendor.status = 'APPROVED';
    vendor.activationStatus = 'ACTIVE';
    vendor.invitationStatus = 'ACCEPTED';
    vendor.activatedAt = new Date();
    vendor.invitationTokenHash = null; // Token consumed
    vendor.invitationTokenExpiry = null;
    await vendor.save();

    // Log activation events
    await logVendorActivity({
      vendorId: vendor._id,
      actorId: user._id,
      actorRole: 'VENDOR',
      actorName: user.name,
      eventType: 'INVITATION_ACCEPTED',
      description: `Vendor opened invitation and initiated account activation`,
      ipAddress,
    });

    await logVendorActivity({
      vendorId: vendor._id,
      actorId: user._id,
      actorRole: 'VENDOR',
      actorName: user.name,
      eventType: 'ACCOUNT_ACTIVATED',
      description: `Vendor securely set password; account is now ACTIVE and APPROVED for marketplace operations`,
      ipAddress,
    });

    // Auto-generate authentication tokens for direct login to Vendor Dashboard
    const tokens = await tokenService.generateTokens(user);

    const userResponse = user.toObject();
    delete userResponse.passwordHash;
    delete userResponse.refreshTokenHash;

    const vendorData = {
      id: vendor._id,
      storeName: vendor.storeName,
      status: vendor.status,
      vendorType: vendor.vendorType,
      franchiseCode: vendor.franchiseCode,
    };

    return {
      user: { ...userResponse, vendor: vendorData },
      tokens,
      accessToken: tokens.accessToken,
    };
  },

  /**
   * PUBLIC ENDPOINT: Submit Application & KYC for Appointed Franchise Vendor
   */
  async submitFranchiseApplication(rawToken, data, ipAddress = '') {
    const {
      password,
      confirmPassword,
      name,
      email,
      phone,
      whatsappNumber,
      storeName,
      businessType = '',
      gstNumber = '',
      panNumber = '',
      description = '',
      state,
      district,
      talukArea,
      pincode = '',
      fullAddress = '',
      associatedShopkeeper = '',
      identityDocumentType,
      identityDocumentNumber,
      identityDocumentUpload,
      panDocumentUpload = '',
      documentType,
      documentNumber,
      identityDocument,
      panDocument,
      termsAccepted = true,
    } = data;

    const resolvedDocType = identityDocumentType || documentType;
    const resolvedDocNumber = identityDocumentNumber || documentNumber;
    const resolvedIdUpload = identityDocumentUpload || identityDocument;
    const resolvedPanUpload = panDocumentUpload || panDocument;

    if (!rawToken || typeof rawToken !== 'string') {
      throw new ApiError(400, 'Invitation token is missing or malformed.', ERROR_CODES.BAD_REQUEST);
    }

    if (!password || password.length < 6) {
      throw new ApiError(400, 'Password must be at least 6 characters in length.', ERROR_CODES.BAD_REQUEST);
    }

    if (confirmPassword && password !== confirmPassword) {
      throw new ApiError(400, 'Passwords do not match.', ERROR_CODES.BAD_REQUEST);
    }

    if (!resolvedDocType || !resolvedDocNumber) {
      throw new ApiError(400, 'Identity document type and document ID number are required.', ERROR_CODES.BAD_REQUEST);
    }

    if (!resolvedIdUpload) {
      throw new ApiError(400, 'Supporting identity document (PDF) upload is required.', ERROR_CODES.BAD_REQUEST);
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken.trim()).digest('hex');

    const vendor = await Vendor.findOne({
      vendorType: 'FRANCHISE_VENDOR',
      invitationTokenHash: tokenHash,
    }).populate('userId');

    if (!vendor) {
      throw new ApiError(404, 'Invalid or expired invitation token.', ERROR_CODES.NOT_FOUND);
    }

    if (vendor.activationStatus === 'ACTIVE' || vendor.applicationStatus === 'APPROVED') {
      throw new ApiError(400, 'This account has already been approved and activated.', ERROR_CODES.BAD_REQUEST);
    }

    if (vendor.invitationStatus === 'REVOKED') {
      throw new ApiError(400, 'This invitation link has been revoked.', ERROR_CODES.BAD_REQUEST);
    }

    if (vendor.invitationTokenExpiry && new Date() > new Date(vendor.invitationTokenExpiry)) {
      throw new ApiError(400, 'This invitation link has expired.', ERROR_CODES.BAD_REQUEST);
    }

    // Set permanent password securely using bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Update User
    const user = await User.findById(vendor.userId._id);
    user.passwordHash = passwordHash;
    if (name && name.trim()) user.name = name.trim();
    if (email && email.trim() && email.includes('@')) user.email = email.toLowerCase().trim();
    if (phone) {
      let cleanPhone = String(phone).replace(/[^0-9]/g, '');
      if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;
      user.phone = cleanPhone;
    }
    user.status = USER_STATUS.PENDING; // Remains pending until Super Admin reviews and approves KYC
    user.termsAccepted = true;
    user.termsAcceptedAt = new Date();
    user.termsVersion = data.termsVersion || '1.0';
    await user.save();

    // Persist immutable audit record of vendor legal agreement acceptance
    try {
      await legalDocumentService.recordConsent({
        userId: user._id,
        accountIdentifier: user.email || user.phone,
        role: ROLES.VENDOR,
        documentType: LEGAL_DOCUMENT_TYPES.VENDOR_TERMS,
        version: data.termsVersion,
        ipAddress,
      });
      await legalDocumentService.recordConsent({
        userId: user._id,
        accountIdentifier: user.email || user.phone,
        role: ROLES.VENDOR,
        documentType: LEGAL_DOCUMENT_TYPES.PRIVACY_POLICY,
        version: data.termsVersion,
        ipAddress,
      });
    } catch (consentErr) {
      console.error('[franchiseVendorService] Failed to record vendor legal consent:', consentErr.message);
    }

    // Update Vendor record
    if (storeName && storeName.trim()) vendor.storeName = storeName.trim();
    if (user.phone) vendor.phone = user.phone;
    if (whatsappNumber) {
      let cleanWa = String(whatsappNumber).replace(/[^0-9]/g, '');
      if (cleanWa.length === 10) cleanWa = `91${cleanWa}`;
      vendor.whatsappNumber = cleanWa;
    }
    if (user.email) vendor.email = user.email;

    vendor.territory = {
      state: state || vendor.territory?.state || '',
      district: district || vendor.territory?.district || '',
      taluk: talukArea || vendor.territory?.taluk || '',
      fullAddress: fullAddress || vendor.territory?.fullAddress || '',
    };
    vendor.address = {
      street: fullAddress || '',
      city: talukArea || vendor.territory?.taluk || '',
      state: state || vendor.territory?.state || '',
      zip: pincode || '',
      country: 'India',
    };

    vendor.applicationStatus = 'SUBMITTED';
    vendor.status = 'UNDER_REVIEW';
    vendor.kycStatus = 'PENDING';
    vendor.activationStatus = 'PENDING_ACTIVATION';
    vendor.applicationSubmittedAt = new Date();
    vendor.termsAccepted = Boolean(termsAccepted);
    vendor.termsAcceptedAt = new Date();

    // Consume invitation token on successful application submission
    vendor.invitationStatus = 'ACCEPTED';
    vendor.invitationTokenHash = null;
    vendor.invitationTokenExpiry = null;
    await vendor.save();

    // Update or create auxiliary models
    await VendorBusiness.findOneAndUpdate(
      { vendorId: vendor._id },
      {
        storeName: vendor.storeName,
        businessType: businessType || 'FRANCHISE',
        gstNumber: gstNumber || '',
        panNumber: panNumber || '',
        description: description || `Franchise Store: ${vendor.storeName}`,
      },
      { upsert: true, new: true }
    );

    const existingAddr = await VendorAddress.findOne({ vendorId: vendor._id });
    const addressUpdates = {
      pincode: pincode || existingAddr?.pincode || '560001',
      fullAddress: fullAddress || existingAddr?.fullAddress || vendor.territory?.fullAddress || 'Address not specified',
      associatedShopkeeper: associatedShopkeeper || existingAddr?.associatedShopkeeper || '',
    };
    if (state && mongoose.Types.ObjectId.isValid(state)) {
      addressUpdates.state = state;
    } else if (existingAddr?.state) {
      addressUpdates.state = existingAddr.state;
    }
    if (district && mongoose.Types.ObjectId.isValid(district)) {
      addressUpdates.district = district;
    } else if (existingAddr?.district) {
      addressUpdates.district = existingAddr.district;
    }
    if (talukArea && mongoose.Types.ObjectId.isValid(talukArea)) {
      addressUpdates.talukArea = talukArea;
    } else if (existingAddr?.talukArea) {
      addressUpdates.talukArea = existingAddr.talukArea;
    }

    if (existingAddr) {
      await VendorAddress.findByIdAndUpdate(existingAddr._id, addressUpdates);
    } else if (addressUpdates.state && addressUpdates.district && addressUpdates.talukArea) {
      await VendorAddress.create({
        vendorId: vendor._id,
        ...addressUpdates,
      });
    }

    const idDocString =
      typeof resolvedIdUpload === 'object' && resolvedIdUpload !== null
        ? resolvedIdUpload.fileData || resolvedIdUpload.url || resolvedIdUpload.fileUrl || JSON.stringify(resolvedIdUpload)
        : String(resolvedIdUpload || '');

    const panDocString =
      typeof resolvedPanUpload === 'object' && resolvedPanUpload !== null
        ? resolvedPanUpload.fileData || resolvedPanUpload.url || resolvedPanUpload.fileUrl || JSON.stringify(resolvedPanUpload)
        : resolvedPanUpload
        ? String(resolvedPanUpload)
        : '';

    await VendorDocument.findOneAndUpdate(
      { vendorId: vendor._id },
      {
        identityDocumentType: resolvedDocType,
        identityDocumentNumber: resolvedDocNumber,
        identityDocumentUpload: idDocString,
        panDocumentUpload: panDocString,
        identityDocumentStatus: 'PENDING',
        panDocumentStatus: panDocString ? 'PENDING' : 'NOT_SUBMITTED',
      },
      { upsert: true, new: true }
    );

    // Log Activity
    await logVendorActivity({
      vendorId: vendor._id,
      actorId: user._id,
      actorRole: 'VENDOR',
      actorName: user.name,
      eventType: 'INVITATION_ACCEPTED',
      description: `Vendor submitted application details, set password, and uploaded KYC verification documents`,
      metadata: { storeName: vendor.storeName, identityDocumentType: resolvedDocType, identityDocumentNumber: resolvedDocNumber },
      ipAddress,
    });

    return {
      success: true,
      message: 'Application and KYC documents submitted successfully! Your application is under review by the Super Admin.',
      vendor: {
        id: vendor._id,
        storeName: vendor.storeName,
        username: vendor.username,
        applicationStatus: vendor.applicationStatus,
        status: vendor.status,
        kycStatus: vendor.kycStatus,
        applicationSubmittedAt: vendor.applicationSubmittedAt,
      },
    };
  },

  /**
   * Super Admin: Summary statistics for Franchise Applications & KYC
   */
  async getFranchiseApplicationsStats() {
    const totalAppointed = await Vendor.countDocuments({ vendorType: 'FRANCHISE_VENDOR' });
    const notYetSubmitted = await Vendor.countDocuments({
      vendorType: 'FRANCHISE_VENDOR',
      applicationStatus: 'PENDING_APPLICATION',
    });
    const submitted = await Vendor.countDocuments({
      vendorType: 'FRANCHISE_VENDOR',
      applicationStatus: 'SUBMITTED',
    });
    const underReview = await Vendor.countDocuments({
      vendorType: 'FRANCHISE_VENDOR',
      applicationStatus: 'UNDER_REVIEW',
    });
    const approved = await Vendor.countDocuments({
      vendorType: 'FRANCHISE_VENDOR',
      applicationStatus: 'APPROVED',
    });
    const rejected = await Vendor.countDocuments({
      vendorType: 'FRANCHISE_VENDOR',
      applicationStatus: 'REJECTED',
    });
    const moreInfoRequired = await Vendor.countDocuments({
      vendorType: 'FRANCHISE_VENDOR',
      applicationStatus: 'MORE_INFO_REQUIRED',
    });

    return {
      totalAppointed,
      notYetSubmitted,
      submitted,
      underReview,
      approved,
      rejected,
      moreInfoRequired,
    };
  },

  /**
   * Super Admin: List Franchise Vendor Applications with filters & pagination
   */
  async getFranchiseApplications({
    search = '',
    applicationStatus = '',
    kycStatus = '',
    state = '',
    district = '',
    startDate = '',
    endDate = '',
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  }) {
    const filter = { vendorType: 'FRANCHISE_VENDOR' };

    if (applicationStatus && applicationStatus !== 'ALL') {
      filter.applicationStatus = applicationStatus;
    }

    if (kycStatus && kycStatus !== 'ALL') {
      filter.kycStatus = kycStatus;
    }

    if (state) filter['territory.state'] = new RegExp(`^${state.trim()}$`, 'i');
    if (district) filter['territory.district'] = new RegExp(`^${district.trim()}$`, 'i');

    if (startDate || endDate) {
      filter.applicationSubmittedAt = {};
      if (startDate) filter.applicationSubmittedAt.$gte = new Date(startDate);
      if (endDate) filter.applicationSubmittedAt.$lte = new Date(endDate);
    }

    if (search && search.trim()) {
      const s = search.trim();
      const regex = new RegExp(s, 'i');
      filter.$or = [
        { storeName: regex },
        { username: regex },
        { phone: regex },
        { whatsappNumber: regex },
        { franchiseCode: regex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await Vendor.countDocuments(filter);
    const vendors = await Vendor.find(filter)
      .populate('userId', 'name email phone username status lastLoginAt')
      .populate('appointedBy', 'name email')
      .populate('applicationReviewedBy', 'name email')
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const enriched = await Promise.all(
      vendors.map(async (v) => {
        const [doc, business] = await Promise.all([
          VendorDocument.findOne({ vendorId: v._id }).lean(),
          VendorBusiness.findOne({ vendorId: v._id }).lean(),
        ]);

        return {
          ...v,
          kycDocumentType: doc?.identityDocumentType !== 'AADHAAR' || doc?.identityDocumentNumber !== 'SUPER_ADMIN_APPOINTED' ? (doc?.identityDocumentType || 'NOT_SUBMITTED') : 'NOT_SUBMITTED',
          kycDocumentNumber: doc?.identityDocumentNumber !== 'SUPER_ADMIN_APPOINTED' ? (doc?.identityDocumentNumber || '') : '',
          hasIdentityDoc: Boolean(doc?.identityDocumentUpload && doc?.identityDocumentUpload !== 'verified_by_super_admin'),
          hasPanDoc: Boolean(doc?.panDocumentUpload),
          businessType: business?.businessType || '',
          panNumber: business?.panNumber || '',
          gstNumber: business?.gstNumber || '',
        };
      })
    );

    return {
      applications: enriched,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
    };
  },

  /**
   * Super Admin: Get single application details with all 7 organized sections
   */
  async getFranchiseApplicationById(vendorId) {
    const vendor = await Vendor.findById(vendorId)
      .populate('userId', 'name email phone username status createdAt lastLoginAt')
      .populate('appointedBy', 'name email')
      .populate('applicationReviewedBy', 'name email');

    if (!vendor || vendor.vendorType !== 'FRANCHISE_VENDOR') {
      throw new ApiError(404, 'Franchise Vendor Application not found', ERROR_CODES.NOT_FOUND);
    }

    const [business, location, kyc, bank, activities] = await Promise.all([
      VendorBusiness.findOne({ vendorId: vendor._id }).lean(),
      VendorAddress.findOne({ vendorId: vendor._id })
        .populate('state', 'name')
        .populate('district', 'name')
        .populate('talukArea', 'name')
        .lean(),
      VendorDocument.findOne({ vendorId: vendor._id }).lean(),
      VendorBankAccount.findOne({ vendorId: vendor._id }).lean(),
      VendorActivity.find({ vendorId: vendor._id }).sort({ createdAt: -1 }).limit(20).lean(),
    ]);

    const userSafe = vendor.userId
      ? {
          _id: vendor.userId._id,
          name: vendor.userId.name,
          email: vendor.userId.email,
          phone: vendor.userId.phone,
          username: vendor.userId.username,
          status: vendor.userId.status,
          createdAt: vendor.userId.createdAt,
          lastLoginAt: vendor.userId.lastLoginAt,
        }
      : null;

    const kycEnhanced = kyc
      ? {
          ...kyc,
          documentType: kyc.identityDocumentType,
          documentNumber: kyc.identityDocumentNumber,
          panNumber: business?.panNumber || '',
          documents: [
            kyc.identityDocumentUpload && kyc.identityDocumentUpload !== 'verified_by_super_admin'
              ? {
                  name: `${kyc.identityDocumentType || 'Identity'} Document`,
                  type: 'Identity Proof',
                  fileUrl: kyc.identityDocumentUpload,
                }
              : null,
            kyc.panDocumentUpload
              ? {
                  name: 'PAN Card Document',
                  type: 'Tax Document',
                  fileUrl: kyc.panDocumentUpload,
                }
              : null,
          ].filter(Boolean),
        }
      : null;

    const addressEnhanced = {
      ...location,
      stateName: location?.state?.name || vendor.territory?.state || '',
      districtName: location?.district?.name || vendor.territory?.district || '',
      talukName: location?.talukArea?.name || vendor.territory?.taluk || '',
      addressLine1: location?.fullAddress || vendor.territory?.fullAddress || '',
      pincode: location?.pincode || vendor.address?.zip || '',
    };

    return {
      vendor,
      user: userSafe,
      business,
      location: addressEnhanced,
      address: addressEnhanced,
      kyc: kycEnhanced,
      bank,
      activities,
    };
  },

  /**
   * Super Admin: Review Application (Approve, Reject, Request More Info, Under Review)
   */
  async reviewFranchiseApplication(
    vendorId,
    { action, decision, reviewNotes = '', rejectionReason = '', moreInfoReason = '' },
    superAdminUser,
    ipAddress = ''
  ) {
    const vendor = await Vendor.findById(vendorId).populate('userId');
    if (!vendor || vendor.vendorType !== 'FRANCHISE_VENDOR') {
      throw new ApiError(404, 'Franchise Vendor not found', ERROR_CODES.NOT_FOUND);
    }

    const finalDecision = String(action || decision || '').toUpperCase();

    vendor.applicationReviewedAt = new Date();
    vendor.applicationReviewedBy = superAdminUser._id;
    if (reviewNotes) vendor.applicationReviewNotes = reviewNotes.trim();

    if (finalDecision === 'APPROVE') {
      vendor.applicationStatus = 'APPROVED';
      vendor.status = 'APPROVED';
      vendor.activationStatus = 'ACTIVE';
      vendor.kycStatus = 'VERIFIED';
      vendor.activatedAt = new Date();
      vendor.applicationRejectionReason = '';
      vendor.applicationMoreInfoReason = '';

      if (vendor.userId) {
        await User.findByIdAndUpdate(vendor.userId._id, { status: USER_STATUS.ACTIVE });
      }

      await VendorDocument.findOneAndUpdate(
        { vendorId: vendor._id },
        { identityDocumentStatus: 'VERIFIED', panDocumentStatus: 'VERIFIED' }
      );

      await logVendorActivity({
        vendorId: vendor._id,
        actorId: superAdminUser._id,
        actorRole: 'SUPER_ADMIN',
        actorName: superAdminUser.name || 'Super Admin',
        eventType: 'ACCOUNT_ACTIVATED',
        description: `Super Admin APPROVED the vendor application and KYC. Account is now ACTIVE for marketplace operations.`,
        metadata: { notes: reviewNotes },
        ipAddress,
      });
    } else if (finalDecision === 'REJECT') {
      if (!rejectionReason || !rejectionReason.trim()) {
        throw new ApiError(400, 'Rejection reason is required.', ERROR_CODES.BAD_REQUEST);
      }
      vendor.applicationStatus = 'REJECTED';
      vendor.status = 'REJECTED';
      vendor.kycStatus = 'REJECTED';
      vendor.applicationRejectionReason = rejectionReason.trim();

      await VendorDocument.findOneAndUpdate(
        { vendorId: vendor._id },
        { identityDocumentStatus: 'REJECTED', identityDocumentReason: rejectionReason.trim() }
      );

      await logVendorActivity({
        vendorId: vendor._id,
        actorId: superAdminUser._id,
        actorRole: 'SUPER_ADMIN',
        actorName: superAdminUser.name || 'Super Admin',
        eventType: 'ACCOUNT_SUSPENDED',
        description: `Super Admin REJECTED application: ${rejectionReason.trim()}`,
        metadata: { rejectionReason: rejectionReason.trim(), notes: reviewNotes },
        ipAddress,
      });
    } else if (finalDecision === 'REQUEST_MORE_INFO') {
      if (!moreInfoReason || !moreInfoReason.trim()) {
        throw new ApiError(400, 'Explanation of required information is required.', ERROR_CODES.BAD_REQUEST);
      }
      vendor.applicationStatus = 'MORE_INFO_REQUIRED';
      vendor.status = 'UNDER_REVIEW';
      vendor.applicationMoreInfoReason = moreInfoReason.trim();

      await logVendorActivity({
        vendorId: vendor._id,
        actorId: superAdminUser._id,
        actorRole: 'SUPER_ADMIN',
        actorName: superAdminUser.name || 'Super Admin',
        eventType: 'PROFILE_UPDATED',
        description: `Super Admin requested more information: ${moreInfoReason.trim()}`,
        metadata: { moreInfoReason: moreInfoReason.trim(), notes: reviewNotes },
        ipAddress,
      });
    } else if (finalDecision === 'UNDER_REVIEW') {
      vendor.applicationStatus = 'UNDER_REVIEW';
      vendor.status = 'UNDER_REVIEW';

      await logVendorActivity({
        vendorId: vendor._id,
        actorId: superAdminUser._id,
        actorRole: 'SUPER_ADMIN',
        actorName: superAdminUser.name || 'Super Admin',
        eventType: 'PROFILE_UPDATED',
        description: `Super Admin marked application as under active review`,
        metadata: { notes: reviewNotes },
        ipAddress,
      });
    } else {
      throw new ApiError(
        400,
        'Invalid decision. Must be APPROVE, REJECT, REQUEST_MORE_INFO, or UNDER_REVIEW.',
        ERROR_CODES.BAD_REQUEST
      );
    }

    await vendor.save();
    return vendor;
  },
};

export default franchiseVendorService;
