import { VendorOrder } from '../models/VendorOrder.js';
import { Vendor } from '../models/Vendor.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

export const getVendorDashboardStats = asyncWrapper(async (req, res) => {
  const vendor = await Vendor.findOne({ userId: req.user._id });
  if (!vendor) throw new ApiError(404, 'Vendor profile not found', ERROR_CODES.NOT_FOUND);

  const stats = await VendorOrder.aggregate([
    { $match: { vendorId: vendor._id } },
    { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$vendorEarning' } } }
  ]);

  return res.status(200).json(new ApiResponse(200, stats, 'Vendor dashboard stats retrieved'));
});

export const acceptOrder = asyncWrapper(async (req, res) => {
  const vendor = await Vendor.findOne({ userId: req.user._id });
  if (!vendor) throw new ApiError(404, 'Vendor profile not found', ERROR_CODES.NOT_FOUND);

  const { id } = req.params;
  const suborder = await VendorOrder.findOne({ _id: id, vendorId: vendor._id });

  if (!suborder) throw new ApiError(404, 'Suborder not found', ERROR_CODES.NOT_FOUND);
  if (suborder.status !== 'PENDING') throw new ApiError(400, 'Only PENDING orders can be accepted', ERROR_CODES.BAD_REQUEST);

  suborder.status = 'CONFIRMED';
  await suborder.save();

  const { logVendorActivity } = await import('../services/vendorActivityService.js');
  await logVendorActivity({
    vendorId: vendor._id,
    actorId: req.user._id,
    actorRole: 'VENDOR',
    actorName: req.user.name,
    eventType: 'ORDER_STATUS_CHANGED',
    description: `Vendor accepted order #${suborder.subOrderNumber || suborder.publicSuborderId} (Status: CONFIRMED)`,
    metadata: { orderId: suborder._id, status: 'CONFIRMED' },
    ipAddress: req.ip,
  });

  return res.status(200).json(new ApiResponse(200, { suborder }, 'Order accepted'));
});

export const processOrder = asyncWrapper(async (req, res) => {
  const vendor = await Vendor.findOne({ userId: req.user._id });
  if (!vendor) throw new ApiError(404, 'Vendor profile not found', ERROR_CODES.NOT_FOUND);

  const { id } = req.params;
  const suborder = await VendorOrder.findOne({ _id: id, vendorId: vendor._id });

  if (!suborder) throw new ApiError(404, 'Suborder not found', ERROR_CODES.NOT_FOUND);
  if (suborder.status !== 'CONFIRMED') throw new ApiError(400, 'Only CONFIRMED orders can be processed', ERROR_CODES.BAD_REQUEST);

  suborder.status = 'PROCESSING';
  await suborder.save();

  const { logVendorActivity } = await import('../services/vendorActivityService.js');
  await logVendorActivity({
    vendorId: vendor._id,
    actorId: req.user._id,
    actorRole: 'VENDOR',
    actorName: req.user.name,
    eventType: 'ORDER_STATUS_CHANGED',
    description: `Vendor started processing order #${suborder.subOrderNumber || suborder.publicSuborderId}`,
    metadata: { orderId: suborder._id, status: 'PROCESSING' },
    ipAddress: req.ip,
  });

  return res.status(200).json(new ApiResponse(200, { suborder }, 'Order processing started'));
});

export const packOrder = asyncWrapper(async (req, res) => {
  const vendor = await Vendor.findOne({ userId: req.user._id });
  if (!vendor) throw new ApiError(404, 'Vendor profile not found', ERROR_CODES.NOT_FOUND);

  const { id } = req.params;
  const suborder = await VendorOrder.findOne({ _id: id, vendorId: vendor._id });

  if (!suborder) throw new ApiError(404, 'Suborder not found', ERROR_CODES.NOT_FOUND);
  if (suborder.status !== 'PROCESSING') throw new ApiError(400, 'Only PROCESSING orders can be packed', ERROR_CODES.BAD_REQUEST);

  suborder.status = 'PACKED';
  await suborder.save();

  const { logVendorActivity } = await import('../services/vendorActivityService.js');
  await logVendorActivity({
    vendorId: vendor._id,
    actorId: req.user._id,
    actorRole: 'VENDOR',
    actorName: req.user.name,
    eventType: 'ORDER_STATUS_CHANGED',
    description: `Vendor packed order #${suborder.subOrderNumber || suborder.publicSuborderId}`,
    metadata: { orderId: suborder._id, status: 'PACKED' },
    ipAddress: req.ip,
  });

  return res.status(200).json(new ApiResponse(200, { suborder }, 'Order packed'));
});

export const markReadyToShip = asyncWrapper(async (req, res) => {
  const vendor = await Vendor.findOne({ userId: req.user._id });
  if (!vendor) throw new ApiError(404, 'Vendor profile not found', ERROR_CODES.NOT_FOUND);

  const { id } = req.params;
  const suborder = await VendorOrder.findOne({ _id: id, vendorId: vendor._id });

  if (!suborder) throw new ApiError(404, 'Suborder not found', ERROR_CODES.NOT_FOUND);
  if (suborder.status !== 'PACKED') throw new ApiError(400, 'Only PACKED orders can be marked READY_TO_SHIP', ERROR_CODES.BAD_REQUEST);

  suborder.status = 'READY_TO_SHIP';
  await suborder.save();

  const { logVendorActivity } = await import('../services/vendorActivityService.js');
  await logVendorActivity({
    vendorId: vendor._id,
    actorId: req.user._id,
    actorRole: 'VENDOR',
    actorName: req.user.name,
    eventType: 'ORDER_STATUS_CHANGED',
    description: `Vendor marked order #${suborder.subOrderNumber || suborder.publicSuborderId} as READY_TO_SHIP`,
    metadata: { orderId: suborder._id, status: 'READY_TO_SHIP' },
    ipAddress: req.ip,
  });

  return res.status(200).json(new ApiResponse(200, { suborder }, 'Order ready to ship'));
});
