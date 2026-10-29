import { productService } from '../services/productService.js';
import { Product } from '../models/Product.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { productQuerySchema } from '../utils/validators.js';

export const getProducts = asyncWrapper(async (req, res) => {
  const validatedQuery = productQuerySchema.parse(req.query);
  const result = await productService.getProducts(validatedQuery);
  return res.status(200).json(new ApiResponse(200, result, 'Products retrieved'));
});

export const getProductBySlug = asyncWrapper(async (req, res) => {
  const product = await productService.getProductBySlug(req.params.slug);
  return res.status(200).json(new ApiResponse(200, { product }, 'Product details retrieved'));
});

export const getFeaturedProducts = asyncWrapper(async (req, res) => {
  const products = await Product.find({ isFeatured: true, status: 'APPROVED' })
    .populate('categoryId', 'name slug')
    .populate('brandId', 'name slug')
    .populate('vendorId', 'storeName slug logo')
    .limit(12);
  return res.status(200).json(new ApiResponse(200, { products }, 'Featured products retrieved'));
});

export const getNewArrivals = asyncWrapper(async (req, res) => {
  const products = await Product.find({ status: 'APPROVED' })
    .populate('categoryId', 'name slug')
    .populate('brandId', 'name slug')
    .populate('vendorId', 'storeName slug logo')
    .sort({ createdAt: -1 })
    .limit(12);
  return res.status(200).json(new ApiResponse(200, { products }, 'New arrivals retrieved'));
});

export const getBestSelling = asyncWrapper(async (req, res) => {
  const products = await Product.find({ status: 'APPROVED' })
    .populate('categoryId', 'name slug')
    .populate('brandId', 'name slug')
    .populate('vendorId', 'storeName slug logo')
    .sort({ reviewCount: -1 })
    .limit(12);
  return res.status(200).json(new ApiResponse(200, { products }, 'Best selling products retrieved'));
});

export const getTopRated = asyncWrapper(async (req, res) => {
  const products = await Product.find({ status: 'APPROVED' })
    .populate('categoryId', 'name slug')
    .populate('brandId', 'name slug')
    .populate('vendorId', 'storeName slug logo')
    .sort({ rating: -1 })
    .limit(12);
  return res.status(200).json(new ApiResponse(200, { products }, 'Top rated products retrieved'));
});

export const getHomeShowcase = asyncWrapper(async (req, res) => {
  const { Settings } = await import('../models/Settings.js');
  const { Brand } = await import('../models/Brand.js');
  const { Vendor } = await import('../models/Vendor.js');
  const { Banner } = await import('../models/Banner.js');

  const settingsDocs = await Settings.find({
    key: {
      $in: [
        'BANNER_FLASH_SALE_BADGE',
        'BANNER_FLASH_SALE_TITLE',
        'BANNER_FLASH_SALE_SUBTITLE',
        'BANNER_FLASH_SALE_BUTTON_TEXT',
        'BANNER_FLASH_SALE_BUTTON_LINK',
        'BANNER_FLASH_SALE_HOURS',
        'BANNER_FLASH_SALE_MINUTES',
        'BANNER_FLASH_SALE_SECONDS',
        'SHOW_TOP_SELLING_PRODUCTS',
        'TOP_SELLING_PRODUCTS_TITLE',
        'SHOW_TOP_SELLING_BRANDS',
        'TOP_SELLING_BRANDS_TITLE',
        'SHOW_TOP_SELLERS',
        'TOP_SELLERS_TITLE',
      ],
    },
  });

  const bannerSettings = {};
  settingsDocs.forEach((s) => {
    bannerSettings[s.key] = s.value;
  });

  const topSellingProducts = await Product.find({ status: 'APPROVED', isDeleted: false })
    .populate('categoryId', 'name slug')
    .populate('brandId', 'name slug')
    .populate('vendorId', 'storeName slug logo')
    .sort({ reviewCount: -1, rating: -1 })
    .limit(12);

  const topSellingBrands = await Brand.find({ isActive: true })
    .sort({ createdAt: -1 })
    .limit(8);

  const topVendors = await Vendor.find({ status: 'APPROVED' })
    .select('storeName logo rating category totalSales storeAddress')
    .sort({ totalSales: -1, rating: -1 })
    .limit(6);

  const now = new Date();
  const activeBanners = await Banner.find({
    isActive: true,
    $and: [
      {
        $or: [{ startDate: null }, { startDate: { $exists: false } }, { startDate: { $lte: now } }],
      },
      {
        $or: [{ endDate: null }, { endDate: { $exists: false } }, { endDate: { $gte: now } }],
      },
    ],
  })
    .sort({ displayOrder: 1, createdAt: -1 })
    .select('title imageUrl heading subtitle buttonLabel buttonDestinationUrl altText displayOrder');

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        banners: activeBanners,
        bannerSettings: {
          flashSaleBadge: bannerSettings.BANNER_FLASH_SALE_BADGE || 'LIMITED TIME FLASH SALE',
          flashSaleTitle: bannerSettings.BANNER_FLASH_SALE_TITLE || 'Supercharged Deals • Up to 65% OFF',
          flashSaleSubtitle:
            bannerSettings.BANNER_FLASH_SALE_SUBTITLE ||
            'Verified genuine products. Extra 2X Fair Coins credited instantly to your wallet.',
          flashSaleButtonText: bannerSettings.BANNER_FLASH_SALE_BUTTON_TEXT || 'VIEW FLASH DEALS',
          flashSaleButtonLink: bannerSettings.BANNER_FLASH_SALE_BUTTON_LINK || '/products',
          flashSaleHours: Number(bannerSettings.BANNER_FLASH_SALE_HOURS || 8),
          flashSaleMinutes: Number(bannerSettings.BANNER_FLASH_SALE_MINUTES || 21),
          flashSaleSeconds: Number(bannerSettings.BANNER_FLASH_SALE_SECONDS || 52),
          showTopSellingProducts: bannerSettings.SHOW_TOP_SELLING_PRODUCTS !== 'false',
          topSellingProductsTitle:
            bannerSettings.TOP_SELLING_PRODUCTS_TITLE || 'Top Selling Products & Featured Marketplace Picks',
          showTopSellingBrands: bannerSettings.SHOW_TOP_SELLING_BRANDS !== 'false',
          topSellingBrandsTitle: bannerSettings.TOP_SELLING_BRANDS_TITLE || 'Top Selling Brands',
          showTopSellers: bannerSettings.SHOW_TOP_SELLERS !== 'false',
          topSellersTitle: bannerSettings.TOP_SELLERS_TITLE || 'Top Verified Sellers & Merchants',
        },
        topSellingProducts,
        topSellingBrands,
        topVendors,
      },
      'Home showcase data retrieved'
    )
  );
});
