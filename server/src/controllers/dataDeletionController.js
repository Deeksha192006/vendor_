import { DataDeletionRequest, DELETION_REQUEST_STATUS } from '../models/DataDeletionRequest.js';
import { User } from '../models/User.js';
import { UserAddress } from '../models/UserAddress.js';
import { Cart } from '../models/Cart.js';
import { Wishlist } from '../models/Wishlist.js';
import { Vendor } from '../models/Vendor.js';
import { KYCDocument } from '../models/KYCDocument.js';
import { USER_STATUS } from '../constants/roles.js';

export const dataDeletionController = {
  /**
   * Submit an account and data deletion request
   */
  async submitRequest(req, res) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const existingRequest = await DataDeletionRequest.findOne({
        userId,
        status: { $in: [DELETION_REQUEST_STATUS.SUBMITTED, DELETION_REQUEST_STATUS.IN_REVIEW, DELETION_REQUEST_STATUS.APPROVED] },
      });

      if (existingRequest) {
        return res.status(400).json({
          success: false,
          message: 'An active deletion request already exists for this account',
          data: existingRequest,
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const referenceId = `DEL-REQ-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newRequest = await DataDeletionRequest.create({
        referenceId,
        userId: user._id,
        userRole: user.role,
        requesterEmail: user.email,
        requesterPhone: user.phone || '',
        reason: req.body?.reason?.trim() || 'User requested account and personal data deletion.',
        status: DELETION_REQUEST_STATUS.SUBMITTED,
      });

      return res.status(201).json({
        success: true,
        message: 'Account and personal data deletion request submitted successfully.',
        data: {
          referenceId: newRequest.referenceId,
          status: newRequest.status,
          submittedAt: newRequest.submittedAt,
          retentionExplanation: newRequest.retentionExplanation,
        },
      });
    } catch (error) {
      console.error('Error submitting deletion request:', error);
      return res.status(500).json({ success: false, message: 'Failed to submit deletion request', error: error.message });
    }
  },

  /**
   * Check status of current user's deletion request
   */
  async getMyRequest(req, res) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const request = await DataDeletionRequest.findOne({ userId }).sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        data: request || null,
      });
    } catch (error) {
      console.error('Error retrieving deletion request:', error);
      return res.status(500).json({ success: false, message: 'Failed to retrieve deletion request' });
    }
  },

  /**
   * Admin: List all data deletion requests
   */
  async getAdminRequests(req, res) {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const filter = {};
      if (status && Object.values(DELETION_REQUEST_STATUS).includes(status)) {
        filter.status = status;
      }

      const total = await DataDeletionRequest.countDocuments(filter);
      const requests = await DataDeletionRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .populate('userId', 'name email role phone status')
        .populate('processedBy', 'name email');

      return res.status(200).json({
        success: true,
        data: requests,
        pagination: {
          total,
          page: Number(page),
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Error listing deletion requests:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch deletion requests' });
    }
  },

  /**
   * Admin: Review and process a deletion request
   */
  async processAdminRequest(req, res) {
    try {
      const { requestId } = req.params;
      const { action, adminNotes } = req.body; // action: 'APPROVE', 'REJECT', 'COMPLETE'
      const adminId = req.user?._id;

      const request = await DataDeletionRequest.findById(requestId);
      if (!request) {
        return res.status(404).json({ success: false, message: 'Deletion request not found' });
      }

      if (action === 'REJECT') {
        request.status = DELETION_REQUEST_STATUS.REJECTED;
        request.adminNotes = adminNotes || 'Request rejected by administrative policy.';
        request.processedBy = adminId;
        request.reviewedAt = new Date();
        await request.save();

        return res.status(200).json({
          success: true,
          message: 'Deletion request rejected',
          data: request,
        });
      }

      if (action === 'APPROVE') {
        request.status = DELETION_REQUEST_STATUS.APPROVED;
        request.adminNotes = adminNotes || 'Request approved for processing.';
        request.processedBy = adminId;
        request.reviewedAt = new Date();
        await request.save();

        return res.status(200).json({
          success: true,
          message: 'Deletion request marked as approved',
          data: request,
        });
      }

      if (action === 'COMPLETE') {
        // Perform verified anonymization & removal of personal data
        const user = await User.findById(request.userId);
        if (user) {
          const anonymizedTag = `deleted_${user._id.toString().slice(-6)}_${Date.now()}`;
          user.name = 'Anonymized User';
          user.email = `${anonymizedTag}@anonymized.baapoomart.com`;
          user.phone = undefined;
          user.username = undefined;
          user.status = USER_STATUS.DELETED;
          user.avatar = '';
          await user.save();

          // Remove personal addresses
          await UserAddress.deleteMany({ userId: user._id });

          // Clear active carts and wishlists
          await Cart.deleteMany({ userId: user._id });
          await Wishlist.deleteMany({ userId: user._id });

          // If vendor, sanitize KYC and vendor profile while retaining tax invoices/orders
          if (user.role === 'VENDOR') {
            await Vendor.updateMany(
              { userId: user._id },
              {
                $set: {
                  storeName: 'Former Merchant (Anonymized)',
                  businessDescription: 'Account closed and anonymized upon data deletion request.',
                  status: 'DELETED',
                  banner: '',
                  logo: '',
                },
              }
            );
            await KYCDocument.deleteMany({ userId: user._id });
          }
        }

        request.status = DELETION_REQUEST_STATUS.COMPLETED;
        request.adminNotes = adminNotes || 'Personal data purged and anonymized. Financial & tax ledgers preserved per statutory requirement.';
        request.processedBy = adminId;
        request.completedAt = new Date();
        await request.save();

        return res.status(200).json({
          success: true,
          message: 'User account and personal data anonymization completed successfully.',
          data: request,
        });
      }

      return res.status(400).json({ success: false, message: 'Invalid action specified' });
    } catch (error) {
      console.error('Error processing deletion request:', error);
      return res.status(500).json({ success: false, message: 'Failed to process deletion request', error: error.message });
    }
  },
};

export default dataDeletionController;
