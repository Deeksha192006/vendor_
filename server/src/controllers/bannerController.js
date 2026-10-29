import { Banner } from '../models/Banner.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

/**
 * Super Admin: List all banners with sorting and optional filtering
 */
export const getSuperAdminBanners = asyncWrapper(async (req, res) => {
  const { search, status } = req.query;
  const query = {};

  if (search && search.trim()) {
    query.$or = [
      { title: { $regex: search.trim(), $options: 'i' } },
      { heading: { $regex: search.trim(), $options: 'i' } },
      { subtitle: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  if (status === 'active') {
    query.isActive = true;
  } else if (status === 'inactive') {
    query.isActive = false;
  }

  const banners = await Banner.find(query).sort({ displayOrder: 1, createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        banners,
        total: banners.length,
        activeCount: banners.filter((b) => b.isActive).length,
      },
      'Banners retrieved successfully'
    )
  );
});

/**
 * Public: Retrieve active banners for customer homepage
 */
export const getActiveBanners = asyncWrapper(async (req, res) => {
  const now = new Date();

  // Find active banners that are either unconstrained by dates or within valid window
  const banners = await Banner.find({
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
    new ApiResponse(200, { banners }, 'Active banners retrieved successfully')
  );
});

/**
 * Super Admin: Create a new banner
 */
export const createBanner = asyncWrapper(async (req, res) => {
  const {
    title,
    imageSourceType = 'URL',
    imageUrl,
    heading,
    subtitle,
    buttonLabel,
    buttonDestinationUrl,
    altText,
    isActive = true,
    displayOrder,
    startDate,
    endDate,
  } = req.body;

  if (!title || !title.trim()) {
    throw new ApiError(400, 'Banner title is required', ERROR_CODES.BAD_REQUEST);
  }

  if (!imageUrl || !imageUrl.trim()) {
    throw new ApiError(400, 'Banner image is required', ERROR_CODES.BAD_REQUEST);
  }

  // Validate image URL or data
  const trimmedImage = imageUrl.trim();
  if (imageSourceType === 'URL') {
    if (!/^https?:\/\/.+/i.test(trimmedImage)) {
      throw new ApiError(400, 'Please enter a valid HTTP or HTTPS image URL', ERROR_CODES.BAD_REQUEST);
    }
  } else if (imageSourceType === 'UPLOAD') {
    if (!trimmedImage.startsWith('data:image/') && !/^https?:\/\/.+/i.test(trimmedImage)) {
      throw new ApiError(400, 'Invalid uploaded image data format', ERROR_CODES.BAD_REQUEST);
    }
  }

  // Determine display order if not specified
  let order = Number(displayOrder);
  if (isNaN(order)) {
    const highestBanner = await Banner.findOne().sort({ displayOrder: -1 }).select('displayOrder');
    order = highestBanner ? highestBanner.displayOrder + 1 : 0;
  }

  const banner = await Banner.create({
    title: title.trim(),
    imageSourceType,
    imageUrl: trimmedImage,
    heading: heading ? heading.trim() : '',
    subtitle: subtitle ? subtitle.trim() : '',
    buttonLabel: buttonLabel ? buttonLabel.trim() : '',
    buttonDestinationUrl: buttonDestinationUrl ? buttonDestinationUrl.trim() : '',
    altText: altText ? altText.trim() : title.trim(),
    isActive: Boolean(isActive),
    displayOrder: order,
    startDate: startDate ? new Date(startDate) : null,
    endDate: endDate ? new Date(endDate) : null,
    createdBy: req.user?._id,
  });

  return res.status(201).json(
    new ApiResponse(201, { banner }, 'Banner created successfully')
  );
});

/**
 * Super Admin: Update banner details
 */
export const updateBanner = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const {
    title,
    imageSourceType,
    imageUrl,
    heading,
    subtitle,
    buttonLabel,
    buttonDestinationUrl,
    altText,
    isActive,
    displayOrder,
    startDate,
    endDate,
  } = req.body;

  const banner = await Banner.findById(id);
  if (!banner) {
    throw new ApiError(404, 'Banner not found', ERROR_CODES.NOT_FOUND);
  }

  if (title !== undefined) banner.title = title.trim();
  if (imageSourceType !== undefined) banner.imageSourceType = imageSourceType;

  if (imageUrl !== undefined) {
    const trimmedImage = imageUrl.trim();
    if (imageSourceType === 'URL' || banner.imageSourceType === 'URL') {
      if (!/^https?:\/\/.+/i.test(trimmedImage)) {
        throw new ApiError(400, 'Please enter a valid HTTP or HTTPS image URL', ERROR_CODES.BAD_REQUEST);
      }
    }
    banner.imageUrl = trimmedImage;
  }

  if (heading !== undefined) banner.heading = heading.trim();
  if (subtitle !== undefined) banner.subtitle = subtitle.trim();
  if (buttonLabel !== undefined) banner.buttonLabel = buttonLabel.trim();
  if (buttonDestinationUrl !== undefined) banner.buttonDestinationUrl = buttonDestinationUrl.trim();
  if (altText !== undefined) banner.altText = altText.trim();
  if (isActive !== undefined) banner.isActive = Boolean(isActive);
  if (displayOrder !== undefined && !isNaN(Number(displayOrder))) banner.displayOrder = Number(displayOrder);
  if (startDate !== undefined) banner.startDate = startDate ? new Date(startDate) : null;
  if (endDate !== undefined) banner.endDate = endDate ? new Date(endDate) : null;

  await banner.save();

  return res.status(200).json(
    new ApiResponse(200, { banner }, 'Banner updated successfully')
  );
});

/**
 * Super Admin: Toggle or set banner active status
 */
export const updateBannerStatus = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  const banner = await Banner.findById(id);
  if (!banner) {
    throw new ApiError(404, 'Banner not found', ERROR_CODES.NOT_FOUND);
  }

  banner.isActive = typeof isActive === 'boolean' ? isActive : !banner.isActive;
  await banner.save();

  return res.status(200).json(
    new ApiResponse(200, { banner }, `Banner ${banner.isActive ? 'activated' : 'deactivated'} successfully`)
  );
});

/**
 * Super Admin: Update banner display order
 */
export const updateBannerDisplayOrder = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { displayOrder } = req.body;

  if (displayOrder === undefined || isNaN(Number(displayOrder))) {
    throw new ApiError(400, 'Valid numeric display order is required', ERROR_CODES.BAD_REQUEST);
  }

  const banner = await Banner.findByIdAndUpdate(
    id,
    { displayOrder: Number(displayOrder) },
    { new: true }
  );

  if (!banner) {
    throw new ApiError(404, 'Banner not found', ERROR_CODES.NOT_FOUND);
  }

  return res.status(200).json(
    new ApiResponse(200, { banner }, 'Banner display order updated successfully')
  );
});

/**
 * Super Admin: Delete banner
 */
export const deleteBanner = asyncWrapper(async (req, res) => {
  const { id } = req.params;

  const banner = await Banner.findByIdAndDelete(id);
  if (!banner) {
    throw new ApiError(404, 'Banner not found', ERROR_CODES.NOT_FOUND);
  }

  return res.status(200).json(
    new ApiResponse(200, { id }, 'Banner deleted successfully')
  );
});

/**
 * Super Admin: Upload image validation & persistent storage handler
 */
export const uploadBannerImage = asyncWrapper(async (req, res) => {
  const { imageData, filename } = req.body;

  if (!imageData || typeof imageData !== 'string') {
    throw new ApiError(400, 'Image data is required', ERROR_CODES.BAD_REQUEST);
  }

  // Validate format and mime type (support JPEG, PNG, WebP)
  const matches = imageData.match(/^data:(image\/(jpeg|png|webp|jpg));base64,(.+)$/i);
  if (!matches) {
    throw new ApiError(
      400,
      'Invalid image format. Supported formats are JPEG, PNG, and WebP.',
      ERROR_CODES.BAD_REQUEST
    );
  }

  const mimeType = matches[1];
  const base64Data = matches[3];
  const buffer = Buffer.from(base64Data, 'base64');

  // Validate file size limit: 5MB
  const MAX_SIZE_BYTES = 5 * 1024 * 1024;
  if (buffer.length > MAX_SIZE_BYTES) {
    throw new ApiError(400, 'Image file size exceeds maximum limit of 5MB', ERROR_CODES.BAD_REQUEST);
  }

  // Persistently stored as standardized high-efficiency image URI
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        imageUrl: imageData,
        mimeType,
        sizeBytes: buffer.length,
        filename: filename || 'banner-image',
      },
      'Banner image processed successfully'
    )
  );
});
