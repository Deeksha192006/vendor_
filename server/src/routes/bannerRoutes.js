import express from 'express';
import {
  getSuperAdminBanners,
  getActiveBanners,
  createBanner,
  updateBanner,
  updateBannerStatus,
  updateBannerDisplayOrder,
  deleteBanner,
  uploadBannerImage,
} from '../controllers/bannerController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireSuperAdmin } from '../middleware/superAdminMiddleware.js';

const router = express.Router();

// Public customer endpoint: active banners for homepage
router.get('/active', getActiveBanners);

// Protected Super Admin endpoints
router.get('/', authenticate, requireSuperAdmin, getSuperAdminBanners);
router.post('/', authenticate, requireSuperAdmin, createBanner);
router.post('/upload', authenticate, requireSuperAdmin, uploadBannerImage);
router.put('/:id', authenticate, requireSuperAdmin, updateBanner);
router.patch('/:id/status', authenticate, requireSuperAdmin, updateBannerStatus);
router.patch('/:id/display-order', authenticate, requireSuperAdmin, updateBannerDisplayOrder);
router.delete('/:id', authenticate, requireSuperAdmin, deleteBanner);

export default router;
