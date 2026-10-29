import express from 'express';
import { getWallet, getTransactions, getFairCoinSettings } from '../controllers/fairCoinController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/wallet', getWallet);
router.get('/transactions', getTransactions);
router.get('/settings', getFairCoinSettings);
router.get('/limit', getFairCoinSettings);

export default router;
