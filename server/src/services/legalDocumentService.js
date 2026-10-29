import { LegalDocument, LEGAL_DOCUMENT_TYPES } from '../models/LegalDocument.js';
import { UserLegalConsent } from '../models/UserLegalConsent.js';
import { User } from '../models/User.js';
import { DEFAULT_LEGAL_DOCUMENTS } from './legalDocumentSeedData.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

export const legalDocumentService = {
  /**
   * Automatically initializes default legal documents if not present in the DB.
   */
  async ensureDefaultDocuments() {
    for (const type of Object.values(LEGAL_DOCUMENT_TYPES)) {
      const existing = await LegalDocument.findOne({ type });
      if (!existing && DEFAULT_LEGAL_DOCUMENTS[type]) {
        await LegalDocument.create(DEFAULT_LEGAL_DOCUMENTS[type]);
        console.log(`[legalDocumentService] Seeded default document: ${type}`);
      } else if (existing && DEFAULT_LEGAL_DOCUMENTS[type] && type === LEGAL_DOCUMENT_TYPES.VENDOR_TERMS) {
        if (!existing.content.includes('3% referral commission')) {
          existing.content = DEFAULT_LEGAL_DOCUMENTS[type].content;
          existing.version = DEFAULT_LEGAL_DOCUMENTS[type].version || '1.2';
          await existing.save();
          console.log(`[legalDocumentService] Synced updated terms for: ${type}`);
        }
      }
    }
  },

  /**
   * Retrieves an active published legal document by type.
   */
  async getByType(type) {
    await this.ensureDefaultDocuments();
    const doc = await LegalDocument.findOne({ type: type.toUpperCase(), isPublished: true });
    if (!doc) {
      throw new ApiError(404, `Legal document for ${type} not found`, ERROR_CODES.NOT_FOUND);
    }
    return doc;
  },

  /**
   * Retrieves summary list of all public active legal documents.
   */
  async getAllPublic() {
    await this.ensureDefaultDocuments();
    return LegalDocument.find({ isPublished: true })
      .select('type title version effectiveDate updatedAt')
      .sort({ type: 1 });
  },

  /**
   * Super Admin: Retrieves all legal documents with details.
   */
  async getAllForAdmin() {
    await this.ensureDefaultDocuments();
    return LegalDocument.find()
      .populate('lastUpdatedBy', 'name email role')
      .sort({ type: 1 });
  },

  /**
   * Super Admin: Updates document content, version, and archives previous version to history.
   */
  async updateDocument(type, updateData, adminUser) {
    await this.ensureDefaultDocuments();
    const doc = await LegalDocument.findOne({ type: type.toUpperCase() });
    if (!doc) {
      throw new ApiError(404, `Legal document for ${type} not found`, ERROR_CODES.NOT_FOUND);
    }

    const { title, content, version, effectiveDate, isPublished } = updateData;

    // Archive current version into history if content or version changed
    const historyEntry = {
      version: doc.version,
      title: doc.title,
      content: doc.content,
      effectiveDate: doc.effectiveDate,
      publishedAt: new Date(),
      publishedBy: adminUser?._id || null,
    };

    doc.history.push(historyEntry);

    if (title) doc.title = title.trim();
    if (content) doc.content = content;
    if (version) doc.version = version.trim();
    if (effectiveDate) doc.effectiveDate = new Date(effectiveDate);
    if (typeof isPublished === 'boolean') doc.isPublished = isPublished;
    doc.lastUpdatedBy = adminUser?._id || null;

    await doc.save();
    return doc;
  },

  /**
   * Super Admin: Retrieves version history for a given document.
   */
  async getDocumentHistory(type) {
    const doc = await LegalDocument.findOne({ type: type.toUpperCase() })
      .populate('history.publishedBy', 'name email');
    if (!doc) {
      throw new ApiError(404, `Legal document for ${type} not found`, ERROR_CODES.NOT_FOUND);
    }
    return {
      type: doc.type,
      currentVersion: doc.version,
      history: doc.history,
    };
  },

  /**
   * Persists user agreement/acceptance of a legal document.
   */
  async recordConsent({ userId, accountIdentifier, role, documentType, version, ipAddress, userAgent, metadata }) {
    if (!userId || !documentType) {
      return null;
    }

    // Resolve current version if not supplied
    let docVersion = version;
    if (!docVersion) {
      const activeDoc = await LegalDocument.findOne({ type: documentType.toUpperCase() });
      docVersion = activeDoc?.version || '1.0';
    }

    const consent = await UserLegalConsent.create({
      userId,
      accountIdentifier: accountIdentifier || '',
      role: role || '',
      documentType: documentType.toUpperCase(),
      version: docVersion,
      acceptedAt: new Date(),
      ipAddress: ipAddress || '',
      userAgent: userAgent || '',
      metadata: metadata || {},
    });

    // Also update User document for quick lookup
    await User.findByIdAndUpdate(userId, {
      $set: {
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        termsVersion: docVersion,
      },
    }).catch(() => {});

    return consent;
  },

  /**
   * Check if user has accepted the latest published version of a document.
   */
  async checkUserConsent(userId, documentType) {
    const doc = await LegalDocument.findOne({ type: documentType.toUpperCase(), isPublished: true });
    if (!doc) return { accepted: true };

    const consent = await UserLegalConsent.findOne({
      userId,
      documentType: documentType.toUpperCase(),
      version: doc.version,
    });

    return {
      accepted: Boolean(consent),
      latestVersion: doc.version,
      acceptedVersion: consent?.version || null,
      acceptedAt: consent?.acceptedAt || null,
    };
  },
};

export default legalDocumentService;
