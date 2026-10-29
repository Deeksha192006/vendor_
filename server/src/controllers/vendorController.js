import { vendorService } from '../services/vendorService.js';
import { productService } from '../services/productService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';

export const registerVendor = asyncWrapper(async (req, res) => {
  const vendor = await vendorService.registerVendor(req.user._id, req.body);
  return res.status(201).json(new ApiResponse(201, { vendor }, 'Vendor registration submitted successfully'));
});

export const payVendorActivationFee = asyncWrapper(async (req, res) => {
  const { paymentMethod, transactionId } = req.body;
  const vendor = await vendorService.payVendorActivationFee(req.user._id, { paymentMethod, transactionId });
  return res.status(200).json(new ApiResponse(200, { vendor }, 'Vendor platform payment completed successfully! All merchant options are now fully unlocked and enabled.'));
});

export const getVendorProfile = asyncWrapper(async (req, res) => {
  const profile = await vendorService.getVendorProfile(req.user._id);
  return res.status(200).json(new ApiResponse(200, profile, 'Vendor profile retrieved'));
});

export const updateVendorProfile = asyncWrapper(async (req, res) => {
  const profile = await vendorService.updateVendorProfile(req.user._id, req.body);
  return res.status(200).json(new ApiResponse(200, profile, 'Vendor profile updated'));
});

export const updateVendorDocuments = asyncWrapper(async (req, res) => {
  const { docType } = req.params;
  const kyc = await vendorService.updateVendorDocuments(req.user._id, docType, req.body);
  return res.status(200).json(new ApiResponse(200, { kyc }, 'Vendor documents updated'));
});

export const updateVendorBank = asyncWrapper(async (req, res) => {
  const bank = await vendorService.updateVendorBank(req.user._id, req.body);
  return res.status(200).json(new ApiResponse(200, { bank }, 'Vendor bank updated'));
});

export const getVendorStatusHistory = asyncWrapper(async (req, res) => {
  const history = await vendorService.getVendorStatusHistory(req.user._id);
  return res.status(200).json(new ApiResponse(200, { history }, 'Vendor status history retrieved'));
});

export const getVendorDashboard = asyncWrapper(async (req, res) => {
  const vendorProfile = await vendorService.getVendorProfile(req.user._id);
  const dashboardData = await vendorService.getVendorDashboard(vendorProfile._id);
  return res.status(200).json(new ApiResponse(200, dashboardData, 'Vendor dashboard retrieved'));
});

export const createVendorProduct = asyncWrapper(async (req, res) => {
  const vendor = await vendorService.checkVendorEligibility(req.user._id);
  const product = await productService.createProduct(vendor._id, req.body);

  const { logVendorActivity } = await import('../services/vendorActivityService.js');
  await logVendorActivity({
    vendorId: vendor._id,
    actorId: req.user._id,
    actorRole: 'VENDOR',
    actorName: req.user.name,
    eventType: 'PRODUCT_CREATED',
    description: `Vendor added new product: "${product.name}" (SKU: ${product.sku || 'N/A'}, Price: ₹${product.price})`,
    metadata: { productId: product._id, sku: product.sku, price: product.price, stock: product.stock },
    ipAddress: req.ip,
  });

  return res.status(201).json(new ApiResponse(201, { product }, 'Vendor product created'));
});

export const getVendorProducts = asyncWrapper(async (req, res) => {
  try {
    const vendorProfile = await vendorService.getVendorProfile(req.user._id);
    const result = await productService.getVendorProducts(vendorProfile.vendor._id, req.query);
    return res.status(200).json(new ApiResponse(200, result, 'Vendor products retrieved'));
  } catch (err) {
    if (req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN') {
      const { Vendor } = await import('../models/Vendor.js');
      const firstVendor = await Vendor.findOne();
      if (firstVendor) {
        const result = await productService.getVendorProducts(firstVendor._id, req.query);
        return res.status(200).json(new ApiResponse(200, result, 'Vendor products retrieved (Admin view)'));
      }
      return res.status(200).json(new ApiResponse(200, {
        products: [],
        stats: { total: 0, DRAFT: 0, PENDING_APPROVAL: 0, APPROVED: 0, REJECTED: 0, ACTIVE: 0, INACTIVE: 0 },
        total: 0,
        page: 1,
        pages: 1
      }, 'No products found'));
    }
    throw err;
  }
});

export const getVendorProductById = asyncWrapper(async (req, res) => {
  const { Product } = await import('../models/Product.js');
  let query = { _id: req.params.id, isDeleted: false };
  
  if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
    const vendorProfile = await vendorService.getVendorProfile(req.user._id);
    query.vendorId = vendorProfile.vendor._id;
  }
  
  const product = await Product.findOne(query).populate('categoryId', 'name slug');
  if (!product) {
    throw new (await import('../utils/ApiError.js')).ApiError(404, 'Product not found', 'NOT_FOUND');
  }
  return res.status(200).json(new ApiResponse(200, { product }, 'Vendor product retrieved'));
});

export const updateVendorProduct = asyncWrapper(async (req, res) => {
  const vendor = await vendorService.checkVendorEligibility(req.user._id);
  const product = await productService.updateProduct(req.params.id, vendor._id, req.body);

  const { logVendorActivity } = await import('../services/vendorActivityService.js');
  await logVendorActivity({
    vendorId: vendor._id,
    actorId: req.user._id,
    actorRole: 'VENDOR',
    actorName: req.user.name,
    eventType: 'PRODUCT_UPDATED',
    description: `Vendor updated product: "${product.name}"`,
    metadata: { productId: product._id, price: product.price, stock: product.stock },
    ipAddress: req.ip,
  });

  return res.status(200).json(new ApiResponse(200, { product }, 'Vendor product updated'));
});

export const deleteVendorProduct = asyncWrapper(async (req, res) => {
  const vendor = await vendorService.checkVendorEligibility(req.user._id);
  const product = await productService.softDeleteProduct(req.params.id, vendor._id);

  const { logVendorActivity } = await import('../services/vendorActivityService.js');
  await logVendorActivity({
    vendorId: vendor._id,
    actorId: req.user._id,
    actorRole: 'VENDOR',
    actorName: req.user.name,
    eventType: 'PRODUCT_STATUS_CHANGED',
    description: `Vendor deleted product: "${product.name}"`,
    metadata: { productId: product._id, isDeleted: true },
    ipAddress: req.ip,
  });

  return res.status(200).json(new ApiResponse(200, { product }, 'Vendor product deleted'));
});

export const changeVendorProductStatus = asyncWrapper(async (req, res) => {
  const vendor = await vendorService.checkVendorEligibility(req.user._id);
  const { status } = req.body;
  const product = await productService.changeVendorProductStatus(req.params.id, vendor._id, status);

  const { logVendorActivity } = await import('../services/vendorActivityService.js');
  await logVendorActivity({
    vendorId: vendor._id,
    actorId: req.user._id,
    actorRole: 'VENDOR',
    actorName: req.user.name,
    eventType: 'PRODUCT_STATUS_CHANGED',
    description: `Vendor changed status of product "${product.name}" to ${status}`,
    metadata: { productId: product._id, status },
    ipAddress: req.ip,
  });

  return res.status(200).json(new ApiResponse(200, { product }, `Product status changed to ${status}`));
});

export const requestWithdrawal = asyncWrapper(async (req, res) => {
  const vendorProfile = await vendorService.getVendorProfile(req.user._id);
  const withdrawal = await vendorService.requestWithdrawal(vendorProfile._id, req.body);
  return res.status(201).json(new ApiResponse(201, { withdrawal }, 'Withdrawal request submitted'));
});

export const getVendorOrders = asyncWrapper(async (req, res) => {
  const vendorProfile = await vendorService.getVendorProfile(req.user._id);
  const { VendorOrder } = await import('../models/VendorOrder.js');
  
  // Implement basic querying - in a real app this would move to a service method
  const orders = await VendorOrder.find({ vendorId: vendorProfile.vendor._id })
    .populate('userId', 'name email phone')
    .sort({ createdAt: -1 });
    
  return res.status(200).json(new ApiResponse(200, { orders }, 'Vendor orders retrieved'));
});

export const getVendorOrderById = asyncWrapper(async (req, res) => {
  const vendorProfile = await vendorService.getVendorProfile(req.user._id);
  const { VendorOrder } = await import('../models/VendorOrder.js');
  
  const order = await VendorOrder.findOne({ 
    _id: req.params.id, 
    vendorId: vendorProfile.vendor._id 
  }).populate('userId', 'name email phone');
  
  if (!order) {
    throw new (await import('../utils/ApiError.js')).ApiError(404, 'Order not found', 'NOT_FOUND');
  }
    
  return res.status(200).json(new ApiResponse(200, { order }, 'Vendor order retrieved'));
});
