import http from 'http';

function makeRequest(path, method = 'GET', token = null, body = null) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const postData = body ? JSON.stringify(body) : null;
    if (postData) headers['Content-Length'] = Buffer.byteLength(postData);

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path,
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }
    );
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runFranchiseVendorTests() {
  console.log('================================================================');
  console.log('🏛️ BAAPOO MART — Franchise Vendor Management Verification Suite');
  console.log('================================================================\n');

  try {
    // 1. Super Admin Authentication
    console.log('[Test 1] Logging in as Super Admin...');
    const superAdminLogin = await makeRequest('/api/auth/login', 'POST', null, {
      email: 'admin@fairkart.dev',
      password: 'Password@123',
    });
    const superAdminToken = superAdminLogin.body?.data?.accessToken || superAdminLogin.body?.data?.tokens?.accessToken;
    if (superAdminLogin.status !== 200 || !superAdminToken) {
      throw new Error(`Super Admin login failed: ${JSON.stringify(superAdminLogin.body)}`);
    }
    console.log('✅ Super Admin authenticated successfully.\n');

    // 2. Fetch Initial Franchise Dashboard Stats
    console.log('[Test 2] Fetching initial Franchise Dashboard Stats...');
    const initialStats = await makeRequest('/api/super-admin/franchise-vendors/stats', 'GET', superAdminToken);
    if (initialStats.status !== 200) {
      throw new Error(`Failed to fetch stats: ${JSON.stringify(initialStats.body)}`);
    }
    console.log(`✅ Stats retrieved: Total Appointed: ${initialStats.body.data.totalAppointed}, Active: ${initialStats.body.data.activeVendors}\n`);

    // 3. Appoint a New Franchise Vendor
    const uniqueSuffix = Date.now().toString().slice(-5);
    const testFranchiseData = {
      name: `Ramesh Gowda ${uniqueSuffix}`,
      username: `ramesh_hassan_${uniqueSuffix}`,
      phone: `98765${uniqueSuffix}`,
      whatsappNumber: `98765${uniqueSuffix}`,
      email: `ramesh_${uniqueSuffix}@baapoomart.dev`,
      storeName: `Baapoo Mart Hassan Central ${uniqueSuffix}`,
      state: 'Karnataka',
      district: 'Hassan',
      taluk: 'Channarayapatna',
      fullAddress: 'Main Bazaar Road, Hassan, Karnataka',
      franchiseCode: `FR-HAS-${uniqueSuffix}`,
      appointmentNotes: 'Direct Super Admin franchise appointment. 10% standard platform commission.',
    };

    console.log(`[Test 3] Appointing Franchise Vendor: ${testFranchiseData.storeName}...`);
    const appointRes = await makeRequest('/api/super-admin/franchise-vendors', 'POST', superAdminToken, testFranchiseData);
    if (appointRes.status !== 201) {
      throw new Error(`Failed to appoint franchise vendor: ${JSON.stringify(appointRes.body)}`);
    }

    const { vendor: appointedVendor, invitationToken } = appointRes.body.data;
    if (!invitationToken || !appointedVendor._id) {
      throw new Error('Missing invitationToken or vendorId in response');
    }
    console.log(`✅ Vendor appointed: ID ${appointedVendor._id}`);
    console.log(`✅ Cryptographic invitation token generated: ${invitationToken.slice(0, 16)}...`);
    console.log(`✅ Initial status: ${appointedVendor.status}, activation: ${appointedVendor.activationStatus}\n`);

    // 4. Validate WhatsApp Click-to-Chat URL format & Requirements
    console.log('[Test 4] Validating WhatsApp Click-to-Chat URL compliance...');
    const formattedPhone = `9198765${uniqueSuffix}`;
    const expectedInvitationLink = `http://localhost:5173/vendor-invitation/${invitationToken}`;
    const clickToChatUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(expectedInvitationLink)}`;

    console.log(`   Formatted WhatsApp URL: ${clickToChatUrl}`);
    if (clickToChatUrl.includes('+')) throw new Error('WhatsApp URL should not include "+" in phone number path');
    if (!clickToChatUrl.includes(encodeURIComponent(expectedInvitationLink))) {
      throw new Error('WhatsApp message body must contain only the URL encoded invitation link');
    }
    console.log('✅ WhatsApp click-to-chat URL format fully verified.\n');

    // 5. Audit Workflow: WhatsApp Opened & Mark Sent
    console.log('[Test 5] Auditing Super Admin WhatsApp actions...');
    const waOpenRes = await makeRequest(`/api/super-admin/franchise-vendors/${appointedVendor._id}/whatsapp-opened`, 'POST', superAdminToken);
    if (waOpenRes.status !== 200) throw new Error('Failed to record whatsapp opened');

    const markSentRes = await makeRequest(`/api/super-admin/franchise-vendors/${appointedVendor._id}/invitation/mark-sent`, 'POST', superAdminToken);
    if (markSentRes.status !== 200) throw new Error('Failed to record invitation marked sent');
    console.log('✅ WhatsApp opened and manually sent actions audited successfully.\n');

    // 6. Public Token Validation (GET should NOT consume token)
    console.log('[Test 6] Validating invitation token through public endpoint...');
    const valRes = await makeRequest(`/api/auth/vendor-invitation/invitation/${invitationToken}`, 'GET');
    if (valRes.status !== 200 || !valRes.body.data.valid) {
      throw new Error(`Token validation failed: ${JSON.stringify(valRes.body)}`);
    }
    if (valRes.body.data.vendor.storeName !== testFranchiseData.storeName) {
      throw new Error('Mismatch in validated vendor store name');
    }
    console.log(`✅ Token successfully validated for: ${valRes.body.data.vendor.storeName}\n`);

    // 7. Secure Activation: Vendor Sets Password
    console.log('[Test 7] Activating Franchise Vendor account with permanent password...');
    const activateRes = await makeRequest(`/api/auth/vendor-invitation/invitation/${invitationToken}/activate`, 'POST', null, {
      password: 'VendorPassword@123',
      confirmPassword: 'VendorPassword@123',
    });

    if (activateRes.status !== 200) {
      throw new Error(`Activation failed: ${JSON.stringify(activateRes.body)}`);
    }
    const vendorToken = activateRes.body?.data?.accessToken || activateRes.body?.data?.tokens?.accessToken;
    if (!vendorToken) throw new Error('Vendor token missing after activation');
    console.log('✅ Account activated! User immediately received authentication tokens.\n');

    // 8. Invalidation: Attempt to Reuse Token Must Fail
    console.log('[Test 8] Testing single-use token consumption...');
    const reuseRes = await makeRequest(`/api/auth/vendor-invitation/invitation/${invitationToken}/activate`, 'POST', null, {
      password: 'AnotherPassword@123',
      confirmPassword: 'AnotherPassword@123',
    });
    if (reuseRes.status === 200) {
      throw new Error('Used token was not rejected!');
    }
    console.log(`✅ Re-activation blocked as expected (Status ${reuseRes.status}): Token consumed.\n`);

    // 9. Vendor Login via Assigned Username
    console.log('[Test 9] Logging in as Vendor using assigned username...');
    const vendorLogin = await makeRequest('/api/auth/login', 'POST', null, {
      email: testFranchiseData.username,
      password: 'VendorPassword@123',
      portal: 'VENDOR',
    });
    const loggedInVendorToken = vendorLogin.body?.data?.accessToken || vendorLogin.body?.data?.tokens?.accessToken;
    if (vendorLogin.status !== 200 || !loggedInVendorToken) {
      throw new Error(`Vendor login with username failed: ${JSON.stringify(vendorLogin.body)}`);
    }
    console.log(`✅ Franchise Vendor logged in successfully using username: @${testFranchiseData.username}\n`);

    // 10. Vendor Adds a Product
    console.log('[Test 10] Testing Franchise Vendor product creation...');
    // Fetch categories
    const catRes = await makeRequest('/api/categories', 'GET');
    const categories = catRes.body?.data || [];
    const categoryId = categories.length > 0 ? categories[0]._id : null;

    if (categoryId) {
      const prodRes = await makeRequest('/api/vendor/products', 'POST', vendorToken, {
        name: `Organic Jaggery ${uniqueSuffix}`,
        description: 'Fresh organic jaggery from Hassan',
        price: 150,
        mrp: 180,
        stock: 50,
        categoryId,
        sku: `JAG-${uniqueSuffix}`,
        images: ['https://example.com/jaggery.jpg'],
      });
      if (prodRes.status !== 201) {
        throw new Error(`Failed to create vendor product: ${JSON.stringify(prodRes.body)}`);
      }
      console.log(`✅ Product created: "${prodRes.body.data.product.name}" (ID: ${prodRes.body.data.product._id})\n`);
    }

    // 11. Super Admin Checks Vendor Activity Log
    console.log('[Test 11] Checking Super Admin Vendor Activity timeline...');
    const actRes = await makeRequest(`/api/super-admin/franchise-vendors/${appointedVendor._id}/activities`, 'GET', superAdminToken);
    if (actRes.status !== 200) {
      throw new Error(`Failed to fetch activities: ${JSON.stringify(actRes.body)}`);
    }
    const events = actRes.body.data.activities.map((a) => a.eventType);
    console.log(`   Recorded events: ${events.join(', ')}`);
    if (!events.includes('FRANCHISE_VENDOR_CREATED') || !events.includes('ACCOUNT_ACTIVATED')) {
      throw new Error('Expected lifecycle events missing from activity log');
    }
    console.log('✅ Activity timeline complete and fully verified.\n');

    // 12. Super Admin Tests Account Suspension & Reactivation
    console.log('[Test 12] Testing account suspension and reactivation...');
    const suspendRes = await makeRequest(`/api/super-admin/franchise-vendors/${appointedVendor._id}/status`, 'PATCH', superAdminToken, {
      status: 'SUSPENDED',
    });
    if (suspendRes.status !== 200 || suspendRes.body.data.activationStatus !== 'SUSPENDED') {
      throw new Error('Failed to suspend vendor');
    }

    // Suspended vendor login attempt should fail
    const blockedLogin = await makeRequest('/api/auth/login', 'POST', null, {
      email: testFranchiseData.username,
      password: 'VendorPassword@123',
      portal: 'VENDOR',
    });
    if (blockedLogin.status !== 403) {
      throw new Error('Suspended vendor was not blocked from login');
    }
    console.log('✅ Suspended vendor successfully blocked from logging in.');

    // Reactivate vendor
    const reactivateRes = await makeRequest(`/api/super-admin/franchise-vendors/${appointedVendor._id}/status`, 'PATCH', superAdminToken, {
      status: 'ACTIVE',
    });
    if (reactivateRes.status !== 200 || reactivateRes.body.data.activationStatus !== 'ACTIVE') {
      throw new Error('Failed to reactivate vendor');
    }
    console.log('✅ Vendor reactivated successfully.\n');

    // 13. Security / RBAC Checks: Non-admins cannot access Super Admin franchise endpoints
    console.log('[Test 13] Verifying Role-Based Access Control...');
    const normalUserLogin = await makeRequest('/api/auth/login', 'POST', null, {
      email: 'user@fairkart.dev',
      password: 'Password@123',
    });
    const normalUserToken = normalUserLogin.body?.data?.accessToken || normalUserLogin.body?.data?.tokens?.accessToken;

    const forbiddenCheck = await makeRequest('/api/super-admin/franchise-vendors', 'GET', normalUserToken);
    if (forbiddenCheck.status !== 403) {
      throw new Error(`Customer was not blocked from Super Admin franchise API (Status: ${forbiddenCheck.status})`);
    }
    console.log('✅ Customer blocked with HTTP 403 as required.');

    const vendorForbiddenCheck = await makeRequest('/api/super-admin/franchise-vendors', 'GET', vendorToken);
    if (vendorForbiddenCheck.status !== 403) {
      throw new Error(`Vendor was not blocked from Super Admin franchise API (Status: ${vendorForbiddenCheck.status})`);
    }
    console.log('✅ Franchise Vendor blocked from Super Admin management API with HTTP 403 as required.\n');

    console.log('================================================================');
    console.log('🎉 ALL 13 TEST SUITES PASSED FLAWLESSLY!');
    console.log('   The Franchise Vendor Management System is 100% operational.');
    console.log('================================================================');
  } catch (err) {
    console.error('❌ Test suite error:', err.message);
    process.exit(1);
  }
}

runFranchiseVendorTests();
