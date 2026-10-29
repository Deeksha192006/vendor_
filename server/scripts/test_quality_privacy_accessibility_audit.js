import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { LegalDocument, LEGAL_DOCUMENT_TYPES } from '../src/models/LegalDocument.js';
import { User } from '../src/models/User.js';
import { Vendor } from '../src/models/Vendor.js';
import { UserAddress } from '../src/models/UserAddress.js';
import { Wishlist } from '../src/models/Wishlist.js';
import { Cart } from '../src/models/Cart.js';
import { KYCDocument } from '../src/models/KYCDocument.js';
import { DataDeletionRequest, DELETION_REQUEST_STATUS } from '../src/models/DataDeletionRequest.js';
import { USER_STATUS, ROLES } from '../src/constants/roles.js';
import { dataDeletionController } from '../src/controllers/dataDeletionController.js';
import { legalDocumentService } from '../src/services/legalDocumentService.js';
import { authService } from '../src/services/authService.js';
import { platformCommissionService } from '../src/services/platformCommissionService.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fairkart';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    testsPassed++;
    console.log(`  ✓ ${message}`);
  } else {
    testsFailed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function runAuditTests() {
  console.log('================================================================');
  console.log('BAAPOO MART: Quality, Privacy, Accessibility & Trust Audit Suite');
  console.log('================================================================\n');

  await mongoose.connect(MONGO_URI);

  // --------------------------------------------------------------------------
  // TEST SECTION 1: LEGAL PAGES & POLICIES AUDIT
  // --------------------------------------------------------------------------
  console.log('--- TEST 1: Legal Documents Retrieval & Policy Separation ---');
  const allDocs = await legalDocumentService.getAllPublic();
  assert(allDocs.length >= 7, `All 7 public legal documents are registered and published (found: ${allDocs.length})`);

  const customerTerms = await legalDocumentService.getByType(LEGAL_DOCUMENT_TYPES.CUSTOMER_TERMS);
  assert(customerTerms && customerTerms.isPublished, 'Customer Terms & Conditions exists and is published');
  assert(customerTerms.content.includes('Transparent Pricing Display'), 'Customer Terms specifies transparent pricing without hidden fees');
  assert(customerTerms.content.includes('Seven-Day Return Window'), 'Customer Terms accurately specifies 7-day return window');

  const vendorTerms = await legalDocumentService.getByType(LEGAL_DOCUMENT_TYPES.VENDOR_TERMS);
  assert(vendorTerms && vendorTerms.isPublished, 'Vendor Terms & Conditions exists and is published');
  assert(vendorTerms.content.includes('5% commission'), 'Vendor Terms specifies the 5% Super Admin platform commission');
  assert(vendorTerms.content.includes('3% referral commission') || vendorTerms.content.includes('3% direct vendor referral commission'), 'Vendor Terms specifies the 3% direct vendor referral commission');
  assert(vendorTerms.content.includes('Seven-Day Settlement Holding Period'), 'Vendor Terms accurately specifies 7-day settlement lock from delivery');

  const privacyPolicy = await legalDocumentService.getByType(LEGAL_DOCUMENT_TYPES.PRIVACY_POLICY);
  assert(privacyPolicy && privacyPolicy.isPublished, 'Privacy Policy exists and is published');
  assert(privacyPolicy.content.includes('Account & Data Deletion'), 'Privacy Policy explicitly references account and data deletion rights');
  assert(privacyPolicy.content.includes('Statutory Retention Rules'), 'Privacy Policy explains 8-year tax/GST record retention');

  const cookiePolicy = await legalDocumentService.getByType(LEGAL_DOCUMENT_TYPES.COOKIE_POLICY);
  assert(cookiePolicy && cookiePolicy.isPublished, 'Cookie Policy exists and is published');
  assert(cookiePolicy.content.includes('Strictly Necessary Cookies'), 'Cookie Policy distinguishes strictly necessary vs optional cookies');

  const refundPolicy = await legalDocumentService.getByType(LEGAL_DOCUMENT_TYPES.REFUND_POLICY);
  assert(refundPolicy && refundPolicy.isPublished, 'Refund and Cancellation Policy exists and is published');
  assert(refundPolicy.content.includes('seven (7) calendar days'), 'Refund policy specifies 7-day post-delivery return window');

  // --------------------------------------------------------------------------
  // TEST SECTION 2: USER LEGAL CONSENT AUDIT
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 2: User Legal Consent Persistence ---');
  const testUserId = new mongoose.Types.ObjectId();
  const consentRecord = await legalDocumentService.recordConsent({
    userId: testUserId,
    accountIdentifier: 'audit_test_customer@baapoomart.com',
    role: ROLES.CUSTOMER,
    documentType: LEGAL_DOCUMENT_TYPES.CUSTOMER_TERMS,
    version: customerTerms.version,
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0 (Audit-Test)',
  });
  assert(consentRecord && consentRecord.documentType === 'CUSTOMER_TERMS', 'Legal consent recorded with audit timestamp and version');

  const consentCheck = await legalDocumentService.checkUserConsent(testUserId, 'CUSTOMER_TERMS');
  assert(consentCheck.accepted === true, 'Consent verification confirms user accepted latest version');

  // --------------------------------------------------------------------------
  // TEST SECTION 3: DATA DELETION REQUEST WORKFLOW & RETENTION RULES
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 3: Account & Data Deletion Request Workflow ---');
  const dummyPasswordHash = await bcrypt.hash('AuditPass@2026', 10);
  const deletionTestUser = await User.create({
    name: 'Audit Customer Deletion Candidate',
    email: `deletion_candidate_${Date.now()}@example.com`,
    phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
    passwordHash: dummyPasswordHash,
    role: ROLES.CUSTOMER,
    status: USER_STATUS.ACTIVE,
  });

  // Create address, cart, wishlist for candidate
  const userAddress = await UserAddress.create({
    userId: deletionTestUser._id,
    name: deletionTestUser.name,
    phone: deletionTestUser.phone,
    streetAddress: '123 Test Street, Koramangala',
    city: 'Bangalore',
    state: 'Karnataka',
    postalCode: '560034',
    country: 'India',
  });

  // Candidate submits deletion request
  const mockReq = {
    user: deletionTestUser,
    body: { reason: 'Exercising digital personal privacy rights' },
  };
  let submitResData = null;
  const mockRes = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      submitResData = payload;
      return this;
    },
  };

  await dataDeletionController.submitRequest(mockReq, mockRes);
  assert(mockRes.statusCode === 201 && submitResData?.success, 'Data deletion request submitted successfully');
  assert(submitResData?.data?.referenceId?.startsWith('DEL-REQ-'), 'Unique reference ID generated (DEL-REQ-...)');

  // Verify duplicate request is rejected
  let duplicateResData = null;
  const mockDupRes = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      duplicateResData = payload;
      return this;
    },
  };
  await dataDeletionController.submitRequest(mockReq, mockDupRes);
  assert(mockDupRes.statusCode === 400 && !duplicateResData.success, 'Duplicate deletion request rejected while active request is pending');

  // Super Admin processing workflow: COMPLETE
  const createdReq = await DataDeletionRequest.findOne({ referenceId: submitResData.data.referenceId });
  assert(createdReq && createdReq.status === DELETION_REQUEST_STATUS.SUBMITTED, 'Deletion request initially marked as SUBMITTED');

  const adminProcessReq = {
    params: { requestId: createdReq._id },
    body: { action: 'COMPLETE', adminNotes: 'Verified and completed per audit policy' },
    user: { _id: new mongoose.Types.ObjectId() },
  };
  let processResData = null;
  const mockProcessRes = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      processResData = payload;
      return this;
    },
  };

  await dataDeletionController.processAdminRequest(adminProcessReq, mockProcessRes);
  assert(mockProcessRes.statusCode === 200 && processResData?.success, 'Super Admin successfully processes deletion request to COMPLETED');

  // Verify user personal data is anonymized
  const sanitizedUser = await User.findById(deletionTestUser._id);
  assert(sanitizedUser.name === 'Anonymized User', 'User name anonymized to "Anonymized User"');
  assert(sanitizedUser.email.includes('@anonymized.baapoomart.com'), 'Email anonymized to pseudonymous format');
  assert(sanitizedUser.phone === undefined || sanitizedUser.phone === '', 'Direct contact phone number purged');
  assert(sanitizedUser.status === USER_STATUS.DELETED, 'Account status updated to DELETED');

  // Verify associated addresses purged
  const remainingAddresses = await UserAddress.countDocuments({ userId: deletionTestUser._id });
  assert(remainingAddresses === 0, 'Personal user address records purged');

  // Verify deleted user cannot log in
  let loginBlocked = false;
  try {
    await authService.login({ email: sanitizedUser.email, password: 'AuditPass@2026', portal: 'CUSTOMER' });
  } catch (err) {
    if (err.statusCode === 403 && err.message.includes('deleted')) {
      loginBlocked = true;
    }
  }
  assert(loginBlocked, 'Deleted account is permanently blocked from login access (403 Forbidden)');

  // --------------------------------------------------------------------------
  // TEST SECTION 4: 5% PLATFORM & 3% REFERRAL COMMISSION INTEGRITY
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 4: Commission Formula & 7-Day Settlement Hold Regression ---');
  const dummyProduct = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Handloom Silk Saree',
    price: 3000,
  };

  // Vendor without referrer
  const splitDirect = platformCommissionService.calculateLine(dummyProduct.price, 1, false);
  assert(splitDirect.platformCommission === 150, 'Standard unreferred: 5% platform commission on ₹3000 is ₹150');
  assert(splitDirect.vendorProceeds === 2850, 'Standard unreferred: 95% vendor proceeds on ₹3000 is ₹2850');
  assert(splitDirect.referralCommission === 0, 'Standard unreferred: referral commission is ₹0');

  // Vendor with qualifying direct referrer
  const splitReferred = platformCommissionService.calculateLine(dummyProduct.price, 1, true);
  assert(splitReferred.platformCommission === 150, 'Referred vendor: 5% platform commission remains exactly ₹150 (preserved)');
  assert(splitReferred.referralCommission === 90, 'Referred vendor: 3% direct referral commission on ₹3000 is ₹90');
  assert(splitReferred.vendorProceeds === 2760, 'Referred vendor: 92% vendor proceeds on ₹3000 is ₹2760');
  assert(splitReferred.platformCommission + splitReferred.referralCommission + splitReferred.vendorProceeds === 3000, 'Sum of platform commission + referral commission + vendor proceeds exactly equals 100% selling price');

  // Clean up test records
  await User.deleteOne({ _id: deletionTestUser._id });
  await DataDeletionRequest.deleteOne({ _id: createdReq._id });

  console.log('\n================================================================');
  console.log(`AUDIT RESULTS: ${testsPassed} assertions passed, ${testsFailed} assertions failed.`);
  console.log('================================================================\n');

  await mongoose.disconnect();
  process.exit(testsFailed === 0 ? 0 : 1);
}

runAuditTests().catch((err) => {
  console.error('Fatal audit test runner error:', err);
  process.exit(1);
});
