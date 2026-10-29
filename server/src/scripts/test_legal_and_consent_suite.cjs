const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fairkart';
const API_PORT = process.env.PORT || 5000;

function httpRequest(method, endpoint, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };
    if (payload) {
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      {
        hostname: 'localhost',
        port: API_PORT,
        path: `/api${endpoint}`,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch (e) {
            parsed = data;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runLegalTestSuite() {
  console.log('================================================================');
  console.log('🧪 BAAPOO MART – LEGAL TERMS & COOKIE CONSENT TEST SUITE');
  console.log('================================================================\n');

  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition, testName) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ PASS: ${testName}`);
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // Test 1: Fetch all public legal documents
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing Public Legal Documents Retrieval ---');
    const allDocsRes = await httpRequest('GET', '/legal-documents');
    assert(allDocsRes.status === 200, 'GET /legal-documents returns status 200');
    assert(Array.isArray(allDocsRes.body?.data) && allDocsRes.body.data.length === 4, 'Returns all 4 public legal documents');

    const types = allDocsRes.body.data.map((d) => d.type);
    assert(types.includes('CUSTOMER_TERMS'), 'Includes CUSTOMER_TERMS');
    assert(types.includes('VENDOR_TERMS'), 'Includes VENDOR_TERMS');
    assert(types.includes('PRIVACY_POLICY'), 'Includes PRIVACY_POLICY');
    assert(types.includes('COOKIE_POLICY'), 'Includes COOKIE_POLICY');

    // -------------------------------------------------------------
    // Test 2: Verify Vendor Terms content contains quantity commission, Razorpay & 10% referral
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Vendor Terms Content Compliance ---');
    const vendorTermsRes = await httpRequest('GET', '/legal-documents/vendor_terms');
    assert(vendorTermsRes.status === 200, 'GET /legal-documents/vendor_terms returns 200');
    const vendorContent = vendorTermsRes.body?.data?.content || '';
    assert(vendorContent.includes('Commission Rate = Number of Eligible Product Units * 5%') || vendorContent.includes('Number of Eligible Product Units'), 'Vendor terms contain order-quantity commission formula');
    assert(vendorContent.includes('Razorpay') && vendorContent.includes('2%'), 'Vendor terms mention Razorpay proposed ~2% processing fee');
    assert(vendorContent.includes('10% of qualifying Vendor B subscription'), 'Vendor terms specify 10% referral commission strictly on subscription payments');
    assert(vendorContent.includes('seven (7) calendar days') || vendorContent.includes('7-day'), 'Vendor terms state 7-day settlement holding period');

    // -------------------------------------------------------------
    // Test 3: Verify Customer Terms content
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Customer Terms Content Compliance ---');
    const custTermsRes = await httpRequest('GET', '/legal-documents/customer_terms');
    assert(custTermsRes.status === 200, 'GET /legal-documents/customer_terms returns 200');
    const custContent = custTermsRes.body?.data?.content || '';
    assert(custContent.includes('Maximum Retail Price (MRP)') && custContent.includes('strikethrough'), 'Customer terms specify MRP strikethrough pricing display');
    assert(custContent.includes('Fair Coin') && custContent.includes('1.00'), 'Customer terms detail Fair Coins 1 coin = ₹1.00 conversion');
    assert(!custContent.includes('Vendor payout = Total eligible order value'), 'Customer terms do NOT expose internal vendor-only commission formula');

    // -------------------------------------------------------------
    // Test 4: Customer Registration Validation (Blocking without terms acceptance)
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Customer Registration Consent Gate ---');
    const testCustEmail = `test_cust_legal_${Date.now()}@example.com`;

    // Attempt registration without termsAccepted
    const failCustReg = await httpRequest('POST', '/auth/register', {
      name: 'Test Customer Legal',
      email: testCustEmail,
      password: 'Password123!',
      termsAccepted: false,
    });
    assert(failCustReg.status === 400, 'Registration without terms acceptance is strictly blocked with 400');

    // Attempt registration with termsAccepted: true
    const successCustReg = await httpRequest('POST', '/auth/register', {
      name: 'Test Customer Legal',
      email: testCustEmail,
      password: 'Password123!',
      termsAccepted: true,
      termsVersion: '1.0',
    });
    assert(successCustReg.status === 201, 'Registration with terms acceptance succeeds with 201');

    // Verify User record in DB has terms fields
    const createdCustUser = await db.collection('users').findOne({ email: testCustEmail });
    assert(createdCustUser && createdCustUser.termsAccepted === true, 'User document has termsAccepted: true');
    assert(createdCustUser && createdCustUser.termsVersion === '1.0', 'User document has termsVersion: 1.0');

    // Verify UserLegalConsent records
    const custConsents = await db.collection('userlegalconsents').find({ userId: createdCustUser._id }).toArray();
    assert(custConsents.length === 2, 'Created 2 immutable legal consent records (CUSTOMER_TERMS & PRIVACY_POLICY)');
    const consentDocTypes = custConsents.map((c) => c.documentType);
    assert(consentDocTypes.includes('CUSTOMER_TERMS'), 'Consent record exists for CUSTOMER_TERMS');
    assert(consentDocTypes.includes('PRIVACY_POLICY'), 'Consent record exists for PRIVACY_POLICY');

    // -------------------------------------------------------------
    // Test 5: Vendor Registration Validation (Blocking without terms acceptance)
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Vendor Registration Consent Gate ---');
    const testVendorEmail = `test_vendor_legal_${Date.now()}@example.com`;

    // Attempt registration without termsAccepted
    const failVendorReg = await httpRequest('POST', '/auth/vendor-onboarding/register', {
      name: 'Test Vendor Legal',
      email: testVendorEmail,
      phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      password: 'Password123!',
      storeName: 'Test Legal Store',
      termsAccepted: false,
    });
    assert(failVendorReg.status === 400, 'Vendor registration without terms acceptance is strictly blocked with 400');

    // Find valid sample territory references
    const sampleState = await db.collection('territories').findOne({ type: 'STATE' });
    const sampleDistrict = await db.collection('territories').findOne({ type: 'DISTRICT' });
    const sampleTaluk = await db.collection('territories').findOne({ type: 'TALUK' });

    // Attempt registration with termsAccepted: true
    const successVendorReg = await httpRequest('POST', '/auth/vendor-onboarding/register', {
      name: 'Test Vendor Legal',
      email: testVendorEmail,
      phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      password: 'Password123!',
      storeName: 'Test Legal Store',
      state: String(sampleState?._id),
      district: String(sampleDistrict?._id),
      talukArea: String(sampleTaluk?._id),
      pincode: '560001',
      fullAddress: '123 MG Road, Bangalore',
      termsAccepted: true,
      termsVersion: '1.0',
    });
    assert(successVendorReg.status === 201, 'Vendor registration with terms acceptance succeeds with 201');

    const createdVendorUser = await db.collection('users').findOne({ email: testVendorEmail });
    assert(createdVendorUser && createdVendorUser.termsAccepted === true, 'Vendor user has termsAccepted: true');
    const vendorConsents = await db.collection('userlegalconsents').find({ userId: createdVendorUser._id }).toArray();
    assert(vendorConsents.length === 2, 'Created 2 immutable vendor consent records (VENDOR_TERMS & PRIVACY_POLICY)');

    // -------------------------------------------------------------
    // Test 6: Super Admin Document Update & History Retention
    // -------------------------------------------------------------
    console.log('\n--- 6. Testing Super Admin Document Management & Version History ---');
    // Login as Super Admin
    const loginRes = await httpRequest('POST', '/auth/login', {
      email: 'admin@fairkart.dev',
      password: 'Password@123',
      portal: 'SUPER_ADMIN',
    });
    assert(loginRes.status === 200, 'Super admin logs in successfully');
    const adminToken = loginRes.body?.data?.accessToken || loginRes.body?.data?.tokens?.accessToken;

    // Update Cookie Policy to version 1.1
    const updateRes = await httpRequest(
      'PUT',
      '/super-admin/legal-documents/COOKIE_POLICY',
      {
        title: 'Cookie Policy (Updated)',
        version: '1.1',
        effectiveDate: new Date().toISOString(),
        isPublished: true,
        content: '# Updated Cookie Policy\nVersion 1.1 with revised analytics disclosure.',
      },
      { Authorization: `Bearer ${adminToken}` }
    );
    assert(updateRes.status === 200, 'Super admin updates cookie policy with version 1.1');
    assert(updateRes.body?.data?.version === '1.1', 'Updated version reflects 1.1');

    // Verify history retained
    const historyRes = await httpRequest(
      'GET',
      '/super-admin/legal-documents/COOKIE_POLICY/history',
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    assert(historyRes.status === 200, 'Retrieves version history successfully');
    assert(Array.isArray(historyRes.body?.data?.history) && historyRes.body.data.history.length > 0, 'Previous version 1.0 safely preserved in history array');
    assert(historyRes.body?.data?.history[0].version === '1.0', 'Archived entry has version 1.0');

    // Clean up test users created during test
    await db.collection('users').deleteOne({ email: testCustEmail });
    await db.collection('users').deleteOne({ email: testVendorEmail });
    await db.collection('vendors').deleteOne({ email: testVendorEmail });
    await db.collection('userlegalconsents').deleteMany({ accountIdentifier: { $in: [testCustEmail, testVendorEmail] } });

    console.log('\n================================================================');
    console.log(`🎉 TEST SUITE COMPLETE: ${passedTests}/${totalTests} Tests Passed`);
    console.log('================================================================\n');
  } catch (err) {
    console.error('Fatal error during test suite:', err);
  } finally {
    await mongoose.disconnect();
  }
}

runLegalTestSuite();
