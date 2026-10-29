import { VendorActivity } from '../models/VendorActivity.js';

export const logVendorActivity = async ({
  vendorId,
  actorId = null,
  actorRole = 'SUPER_ADMIN',
  actorName = 'System',
  eventType,
  description,
  metadata = {},
  ipAddress = '',
}) => {
  try {
    if (!vendorId || !eventType || !description) return null;

    // Sanitize metadata to never store passwords or sensitive secrets
    const cleanMeta = { ...metadata };
    delete cleanMeta.password;
    delete cleanMeta.passwordHash;
    delete cleanMeta.token;
    delete cleanMeta.rawToken;
    delete cleanMeta.refreshToken;

    return await VendorActivity.create({
      vendorId,
      actorId,
      actorRole,
      actorName,
      eventType,
      description,
      metadata: cleanMeta,
      ipAddress,
    });
  } catch (err) {
    console.error('[VendorActivity] Error recording activity:', err.message);
    return null;
  }
};

export default logVendorActivity;
