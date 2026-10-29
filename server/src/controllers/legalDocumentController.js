import { legalDocumentService } from '../services/legalDocumentService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

export const getPublicLegalDocument = asyncWrapper(async (req, res) => {
  const { type } = req.params;
  const doc = await legalDocumentService.getByType(type);
  return res.status(200).json(new ApiResponse(200, doc, `${doc.title} retrieved successfully`));
});

export const getAllPublicLegalDocuments = asyncWrapper(async (req, res) => {
  const docs = await legalDocumentService.getAllPublic();
  return res.status(200).json(new ApiResponse(200, docs, 'Legal documents list retrieved'));
});

export const getAdminLegalDocuments = asyncWrapper(async (req, res) => {
  const docs = await legalDocumentService.getAllForAdmin();
  return res.status(200).json(new ApiResponse(200, docs, 'All legal documents retrieved for admin'));
});

export const updateLegalDocument = asyncWrapper(async (req, res) => {
  const { type } = req.params;
  const { title, content, version, effectiveDate, isPublished } = req.body;

  if (!content || !content.trim()) {
    throw new ApiError(400, 'Document content is required', ERROR_CODES.BAD_REQUEST);
  }

  const updatedDoc = await legalDocumentService.updateDocument(
    type,
    { title, content, version, effectiveDate, isPublished },
    req.user
  );

  return res.status(200).json(
    new ApiResponse(200, updatedDoc, `Legal document '${updatedDoc.title}' version ${updatedDoc.version} published successfully`)
  );
});

export const getLegalDocumentHistory = asyncWrapper(async (req, res) => {
  const { type } = req.params;
  const history = await legalDocumentService.getDocumentHistory(type);
  return res.status(200).json(new ApiResponse(200, history, 'Document history retrieved'));
});

export const recordUserConsent = asyncWrapper(async (req, res) => {
  const { documentType, version } = req.body;
  const userId = req.user?._id;

  if (!userId || !documentType) {
    throw new ApiError(400, 'User ID and document type are required', ERROR_CODES.BAD_REQUEST);
  }

  const consent = await legalDocumentService.recordConsent({
    userId,
    accountIdentifier: req.user.email || req.user.phone,
    role: req.user.role,
    documentType,
    version,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  return res.status(200).json(new ApiResponse(200, consent, 'Consent recorded successfully'));
});

export const checkUserConsent = asyncWrapper(async (req, res) => {
  const { type } = req.params;
  const result = await legalDocumentService.checkUserConsent(req.user._id, type);
  return res.status(200).json(new ApiResponse(200, result, 'Consent status checked'));
});
