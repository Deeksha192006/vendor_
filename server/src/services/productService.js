import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { Brand } from '../models/Brand.js';
import { Settings } from '../models/Settings.js';
import { ProductStatusHistory } from '../models/ProductStatusHistory.js';
import { VendorSubscription } from '../models/VendorSubscription.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

export const productService = {
  async getProducts({
    search,
    category,
    brand,
    vendor,
    minPrice,
    maxPrice,
    rating,
    availability,
    sort = 'newest',
    page = 1,
    limit = 12,
  } = {}) {
    const query = { status: { $in: ['APPROVED', 'ACTIVE'] }, isDeleted: false };

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { tags: { $in: [searchRegex] } },
        { sku: searchRegex },
      ];
    }
    if (category) {
      const catObj = await Category.findOne({ slug: category });
      if (catObj) query.categoryId = catObj._id;
    }
    if (brand) {
      const brandObj = await Brand.findOne({ slug: brand });
      if (brandObj) query.brandId = brandObj._id;
    }
    if (vendor) {
      query.vendorId = vendor;
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (rating) {
      query.rating = { $gte: Number(rating) };
    }
    if (availability === 'in_stock') {
      query.stock = { $gt: 0 };
    } else if (availability === 'out_of_stock') {
      query.stock = { $lte: 0 };
    }

    let sortOptions = { createdAt: -1 };
    if (sort === 'price_asc') sortOptions = { price: 1 };
    if (sort === 'price_desc') sortOptions = { price: -1 };
    if (sort === 'rating') sortOptions = { rating: -1 };
    if (sort === 'popular') sortOptions = { reviewCount: -1 };

    const safeLimit = Math.min(Math.max(Number(limit) || 12, 1), 50);
    const safePage = Math.max(Number(page) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const productsRaw = await Product.find(query)
      .populate('categoryId', 'name slug')
      .populate('brandId', 'name slug')
      .populate({ 
        path: 'vendorId', 
        match: { status: { $in: ['APPROVED', 'ACTIVE'] } }, 
        select: 'storeName slug logo' 
      })
      .sort(sortOptions)
      .lean();

    // Filter out vendor products where vendor is not APPROVED/ACTIVE (vendorId will be null after match)
    const activeProducts = productsRaw.filter((p) => p.sourceType === 'SUPER_ADMIN' || p.vendorId !== null);
    
    const paginatedProducts = activeProducts.slice(skip, skip + safeLimit);

    return {
      products: paginatedProducts,
      total: activeProducts.length,
      page: safePage,
      pages: Math.ceil(activeProducts.length / safeLimit) || 1,
      limit: safeLimit,
    };
  },

  async getProductBySlug(slug) {
    const product = await Product.findOne({ slug, status: { $in: ['APPROVED', 'ACTIVE'] }, isDeleted: false })
      .populate('categoryId', 'name slug')
      .populate('brandId', 'name slug')
      .populate({
        path: 'vendorId',
        match: { status: { $in: ['APPROVED', 'ACTIVE'] } },
        select: 'storeName slug logo description phone email'
      });

    if (!product || (product.sourceType !== 'SUPER_ADMIN' && !product.vendorId)) {
      throw new ApiError(404, 'Product not found or vendor is inactive', ERROR_CODES.NOT_FOUND);
    }

    return product;
  },

  validateProductImages(images) {
    if (!images) return [];
    if (!Array.isArray(images)) {
      throw new ApiError(400, 'Product images must be provided as an array.', ERROR_CODES.BAD_REQUEST);
    }
    if (images.length > 5) {
      throw new ApiError(400, 'A maximum of 5 images can be uploaded per product.', ERROR_CODES.BAD_REQUEST);
    }

    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB per image limit
    const sanitizedImages = [];

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (!img || typeof img !== 'string') {
        throw new ApiError(400, `Image #${i + 1} has an invalid data format.`, ERROR_CODES.BAD_REQUEST);
      }

      const trimmed = img.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('data:')) {
        // Base64 Data URI validation
        const matches = trimmed.match(/^data:(image\/(jpeg|png|webp|jpg));base64,(.+)$/i);
        if (!matches) {
          throw new ApiError(
            400,
            `Image #${i + 1} format is not supported. Supported image formats are JPEG, PNG, and WebP.`,
            ERROR_CODES.BAD_REQUEST
          );
        }
        const base64Data = matches[3];
        const buffer = Buffer.from(base64Data, 'base64');
        if (buffer.length > MAX_SIZE_BYTES) {
          throw new ApiError(
            400,
            `Image #${i + 1} file size exceeds maximum limit of 5MB.`,
            ERROR_CODES.BAD_REQUEST
          );
        }
        sanitizedImages.push(trimmed);
      } else if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        // Standardized image URL validation
        const isImageExt = /\.(jpeg|jpg|png|webp)($|\?)/i.test(trimmed);
        const isKnownService = /(unsplash\.com|cloudinary\.com|images\.|img\.|cdn\.|picsum\.photos)/i.test(trimmed);
        if (!isImageExt && !isKnownService && !trimmed.includes('image')) {
          throw new ApiError(
            400,
            `Image #${i + 1} URL must point to a supported image format (JPEG, PNG, or WebP).`,
            ERROR_CODES.BAD_REQUEST
          );
        }
        sanitizedImages.push(trimmed);
      } else {
        throw new ApiError(
          400,
          `Image #${i + 1} must be a valid image URL or base64 encoded image data.`,
          ERROR_CODES.BAD_REQUEST
        );
      }
    }

    return sanitizedImages;
  },

  async createProduct(vendorId, productData) {
    // Validate up to 5 images
    if (productData.images !== undefined) {
      productData.images = this.validateProductImages(productData.images);
    }

    // Validate category exists and is active
    if (!productData.categoryId) {
      throw new ApiError(400, 'Product category is required', ERROR_CODES.BAD_REQUEST);
    }
    const categoryDoc = await Category.findById(productData.categoryId);
    if (!categoryDoc) {
      throw new ApiError(400, 'Selected product category does not exist', ERROR_CODES.BAD_REQUEST);
    }
    if (categoryDoc.status === 'INACTIVE' || categoryDoc.isActive === false) {
      throw new ApiError(400, 'The selected category is inactive. Please select an active category.', ERROR_CODES.BAD_REQUEST);
    }

    // Check if MRP >= Selling Price
    if (productData.price > productData.mrp) {
      throw new ApiError(400, 'Selling price cannot be greater than MRP', ERROR_CODES.BAD_REQUEST);
    }

    // Enforce subscription product listing allowance if configured
    try {
      const activeSub = await VendorSubscription.findOne({
        vendorId,
        subscriptionStatus: { $in: ['Active', 'ACTIVE'] },
        expiryDate: { $gt: new Date() },
      }).sort({ expiryDate: -1 });

      if (activeSub?.planSnapshot?.featureLimits?.maxProducts > 0) {
        const allowedMax = activeSub.planSnapshot.featureLimits.maxProducts;
        const currentCount = await Product.countDocuments({ vendorId, isDeleted: false });
        if (currentCount >= allowedMax) {
          throw new ApiError(
            403,
            `Your active vendor subscription plan allows a maximum of ${allowedMax} active products. Please upgrade your subscription plan to add more products.`,
            ERROR_CODES.FORBIDDEN
          );
        }
      }
    } catch (subCheckErr) {
      if (subCheckErr instanceof ApiError) throw subCheckErr;
      console.warn('[VendorSubscription] Product limit check non-fatal error:', subCheckErr.message);
    }

    const slug = productData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const setting = await Settings.findOne({ key: 'PRODUCT_APPROVAL_REQUIRED' });
    const approvalRequired = setting ? setting.value : false;

    const initialStatus = approvalRequired ? 'PENDING_APPROVAL' : 'APPROVED';
    // If they explicitly pass DRAFT, keep it as DRAFT
    const finalStatus = productData.status === 'DRAFT' ? 'DRAFT' : initialStatus;

    const product = await Product.create({
      ...productData,
      vendorId,
      slug: `${slug}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: finalStatus,
      isDeleted: false,
    });

    return product;
  },

  async updateProduct(productId, vendorId, productData) {
    const product = await Product.findById(productId);
    if (!product || product.isDeleted) {
      throw new ApiError(404, 'Product not found', ERROR_CODES.NOT_FOUND);
    }

    if (product.vendorId.toString() !== vendorId.toString()) {
      throw new ApiError(403, 'Unauthorized to edit this product', ERROR_CODES.FORBIDDEN);
    }

    // Validate up to 5 images
    if (productData.images !== undefined) {
      productData.images = this.validateProductImages(productData.images);
    }

    if (productData.price && productData.mrp && productData.price > productData.mrp) {
      throw new ApiError(400, 'Selling price cannot be greater than MRP', ERROR_CODES.BAD_REQUEST);
    }

    if (productData.categoryId) {
      const categoryDoc = await Category.findById(productData.categoryId);
      if (!categoryDoc) {
        throw new ApiError(400, 'Selected product category does not exist', ERROR_CODES.BAD_REQUEST);
      }
      if (categoryDoc.status === 'INACTIVE' || categoryDoc.isActive === false) {
        throw new ApiError(400, 'The selected category is inactive. Please select an active category.', ERROR_CODES.BAD_REQUEST);
      }
    }

    // Do not allow status change through regular update endpoint
    delete productData.status;
    delete productData.vendorId;

    Object.assign(product, productData);
    await product.save();
    return product;
  },

  async softDeleteProduct(productId, vendorId) {
    const product = await Product.findById(productId);
    if (!product || product.isDeleted) {
      throw new ApiError(404, 'Product not found', ERROR_CODES.NOT_FOUND);
    }

    if (product.vendorId.toString() !== vendorId.toString()) {
      throw new ApiError(403, 'Unauthorized to delete this product', ERROR_CODES.FORBIDDEN);
    }

    product.isDeleted = true;
    await product.save();

    await ProductStatusHistory.create({
      productId: product._id,
      vendorId: product.vendorId,
      previousStatus: product.status,
      newStatus: 'DELETED', // Not in enum but conceptually deleted
      reason: 'Soft delete by vendor',
      changedBy: vendorId, // Simulating User ObjectId using vendorId
    });

    return product;
  },

  async getVendorProducts(vendorId, { search, status, page = 1, limit = 10 } = {}) {
    const query = { vendorId, isDeleted: false };
    
    if (status) query.status = status;
    if (search) query.$text = { $search: search };

    const skip = (page - 1) * limit;
    const products = await Product.find(query)
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(query);
    
    // Also get stats
    const stats = await Product.aggregate([
      { $match: { vendorId, isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const formattedStats = {
      total: total,
      DRAFT: 0, PENDING_APPROVAL: 0, APPROVED: 0, REJECTED: 0, ACTIVE: 0, INACTIVE: 0
    };
    stats.forEach(s => { formattedStats[s._id] = s.count; });

    return {
      products,
      stats: formattedStats,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    };
  },

  async changeVendorProductStatus(productId, vendorId, newStatus) {
    const allowedTransitions = ['ACTIVE', 'INACTIVE', 'PENDING_APPROVAL']; // For Vendors
    if (!allowedTransitions.includes(newStatus)) {
      throw new ApiError(400, 'Invalid status transition requested', ERROR_CODES.BAD_REQUEST);
    }

    const product = await Product.findById(productId);
    if (!product || product.isDeleted) throw new ApiError(404, 'Product not found', ERROR_CODES.NOT_FOUND);
    if (product.vendorId.toString() !== vendorId.toString()) throw new ApiError(403, 'Unauthorized', ERROR_CODES.FORBIDDEN);

    const oldStatus = product.status;

    if (newStatus === 'PENDING_APPROVAL') {
      const setting = await Settings.findOne({ key: 'PRODUCT_APPROVAL_REQUIRED' });
      const approvalRequired = setting ? Boolean(setting.value) : false;
      if (!approvalRequired) {
        newStatus = 'APPROVED';
      }
    }

    product.status = newStatus;
    await product.save();

    await ProductStatusHistory.create({
      productId: product._id,
      vendorId: product.vendorId,
      previousStatus: oldStatus,
      newStatus: newStatus,
      reason: 'Status change by vendor',
      changedBy: vendorId, // Using vendor user id for tracking
    });

    return product;
  },

  async getAdminProducts({ status, vendor, category, brand, date, page = 1, limit = 10 } = {}) {
    const query = { isDeleted: false };
    if (status) query.status = status;
    if (vendor) query.vendorId = vendor;
    if (category) query.categoryId = category;
    if (brand) query.brandId = brand;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      query.createdAt = { $gte: start, $lt: end };
    }

    const skip = (page - 1) * limit;
    const products = await Product.find(query)
      .populate('categoryId', 'name slug')
      .populate('brandId', 'name slug')
      .populate('vendorId', 'storeName slug logo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(query);
    return {
      products,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    };
  },

  async updateProductStatus(productId, status, reason = '', adminUserId, ipAddress = '') {
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      throw new ApiError(400, 'Invalid status value', ERROR_CODES.BAD_REQUEST);
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw new ApiError(404, 'Product not found', ERROR_CODES.NOT_FOUND);
    }

    const oldStatus = product.status;
    product.status = status;
    await product.save();

    const { AuditLog } = await import('../models/AuditLog.js');
    await AuditLog.create({
      userId: adminUserId,
      action: `PRODUCT_STATUS_UPDATE_${status}`,
      entity: 'Product',
      entityId: productId,
      oldValue: oldStatus,
      newValue: status,
      ipAddress,
    });

    const { Vendor } = await import('../models/Vendor.js');
    const { notificationService } = await import('./notificationService.js');
    const vendor = await Vendor.findById(product.vendorId);
    if (vendor) {
      await notificationService.createNotification({
        userId: vendor.userId,
        title: `Product ${status}`,
        message: `Your product "${product.name}" has been ${status.toLowerCase()}.${reason ? ' Reason: ' + reason : ''}`,
        type: 'PRODUCT_STATUS',
        link: `/vendor/products`,
      });
    }

    await ProductStatusHistory.create({
      productId: product._id,
      vendorId: product.vendorId,
      previousStatus: oldStatus,
      newStatus: status,
      reason: reason || 'Admin review',
      changedBy: adminUserId,
    });

    return product;
  },
};
