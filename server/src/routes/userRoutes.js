import express from 'express';
import { userController } from '../controllers/userController.js';
import { getCustomerAttribution } from '../controllers/qrAttributionController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import rateLimit from 'express-rate-limit';

const profileUpdateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: {
    success: false,
    message: 'Too many profile updates from this IP, please try again after 15 minutes',
  },
});

const passwordUpdateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many password change attempts from this IP, please try again after 15 minutes',
  },
});

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

router.route('/me')
  .get(userController.getProfile)
  .put(profileUpdateLimiter, userController.updateProfile);

router.put('/me/password', passwordUpdateLimiter, userController.updatePassword);

router.get('/me/commissions', userController.getCommissions);
router.get('/me/wallet', userController.getWallet);
router.get('/me/wallet/transactions', userController.getWalletTransactions);
router.get('/me/attribution', getCustomerAttribution);

router.route('/me/addresses')
  .get(userController.getAddresses)
  .post(userController.createAddress);

import { dataDeletionController } from '../controllers/dataDeletionController.js';

router.route('/me/addresses/:id')
  .put(userController.updateAddress)
  .delete(userController.deleteAddress);

// Data deletion requests (privacy & right to be forgotten)
router.route('/me/data-deletion-request')
  .get(dataDeletionController.getMyRequest)
  .post(dataDeletionController.submitRequest);

export default router;
