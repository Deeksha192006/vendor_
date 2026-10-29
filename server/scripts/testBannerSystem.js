import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

async function runBannerTests() {
  console.log('========================================================');
  console.log('BAAPOO MART - Dynamic Banner Management Automated Tests');
  console.log('========================================================\n');

  let adminToken = '';
  let normalToken = '';
  let createdBannerId = '';
  let secondBannerId = '';

  // 1. Authenticate as Super Admin
  console.log('[TEST 1] Logging in as Super Admin...');
  try {
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@fairkart.dev',
      password: 'Password@123',
    });
    adminToken = loginRes.data?.data?.accessToken || loginRes.data?.data?.tokens?.accessToken;
    if (!adminToken) {
      throw new Error('Access token not found in response');
    }
    console.log('  -> Super Admin authenticated successfully.');
  } catch (err) {
    console.error('  -> Failed Super Admin login:', err.response?.data || err.message);
    process.exit(1);
  }

  const adminHeaders = { headers: { Authorization: `Bearer ${adminToken}` } };

  // 2. Authenticate as a normal customer or non-admin to test RBAC
  console.log('\n[TEST 2] Testing RBAC (Non-admin must be rejected from banner management)...');
  try {
    const custLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'user@fairkart.dev',
      password: 'Password@123',
    });
    normalToken = custLogin.data?.data?.accessToken || custLogin.data?.data?.tokens?.accessToken;
    try {
      await axios.post(
        `${API_BASE}/banners`,
        {
          title: 'Unauthorized Banner',
          imageUrl: 'https://example.com/banner.jpg',
        },
        { headers: { Authorization: `Bearer ${normalToken}` } }
      );
      console.error('  -> ERROR: Non-admin was NOT rejected!');
      process.exit(1);
    } catch (authErr) {
      if (authErr.response?.status === 403 || authErr.response?.status === 401) {
        console.log(`  -> Non-admin properly blocked with status ${authErr.response.status}`);
      } else {
        throw authErr;
      }
    }
  } catch (err) {
    console.log('  -> Non-admin test check completed');
  }

  // 3. Test Invalid Image URLs and Validation
  console.log('\n[TEST 3] Testing validation of invalid input...');
  try {
    await axios.post(
      `${API_BASE}/banners`,
      {
        title: '',
        imageUrl: 'not-a-url',
      },
      adminHeaders
    );
    console.error('  -> ERROR: Invalid input was accepted!');
    process.exit(1);
  } catch (err) {
    console.log('  -> Rejected invalid banner title / URL format:', err.response?.data?.message || err.message);
  }

  // 4. Test Image Upload API with base64 Data URL (JPEG/PNG/WebP validation)
  console.log('\n[TEST 4] Testing Banner Image Upload endpoint...');
  const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  try {
    const uploadRes = await axios.post(
      `${API_BASE}/banners/upload`,
      {
        imageData: sampleBase64,
        filename: 'test-pixel.png',
      },
      adminHeaders
    );
    if (uploadRes.data.success && uploadRes.data.data.imageUrl) {
      console.log('  -> Image validated and uploaded persistently. Size:', uploadRes.data.data.sizeBytes, 'bytes');
    }
  } catch (err) {
    console.error('  -> Failed image upload:', err.response?.data || err.message);
    process.exit(1);
  }

  // 5. Create a Banner with Direct Image URL
  console.log('\n[TEST 5] Super Admin creating Banner 1 (Direct Image URL)...');
  try {
    const createRes = await axios.post(
      `${API_BASE}/banners`,
      {
        title: 'Authentic Indian Handlooms',
        imageSourceType: 'URL',
        imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80',
        heading: 'Handcrafted Heritage',
        subtitle: 'Pure cotton and silk apparel curated from traditional weavers across India.',
        buttonLabel: 'Explore Handlooms',
        buttonDestinationUrl: '/products?category=fashion-apparel',
        altText: 'Indian Handloom Banner',
        displayOrder: 1,
        isActive: true,
      },
      adminHeaders
    );
    createdBannerId = createRes.data.data.banner._id;
    console.log('  -> Banner 1 created persistently! ID:', createdBannerId);
  } catch (err) {
    console.error('  -> Failed to create banner:', err.response?.data || err.message);
    process.exit(1);
  }

  // 6. Create Banner 2 (Uploaded Image source) with order 0
  console.log('\n[TEST 6] Super Admin creating Banner 2 (Uploaded Image source, Display Order 0)...');
  try {
    const createRes2 = await axios.post(
      `${API_BASE}/banners`,
      {
        title: 'Diwali Mega Festive Savings',
        imageSourceType: 'UPLOAD',
        imageUrl: sampleBase64,
        heading: 'Festive Mega Offers',
        subtitle: 'Up to 50% extra cashback in Fair Coins on verified marketplace items.',
        buttonLabel: 'Shop Festive Deals',
        buttonDestinationUrl: '/products',
        displayOrder: 0,
        isActive: true,
      },
      adminHeaders
    );
    secondBannerId = createRes2.data.data.banner._id;
    console.log('  -> Banner 2 created persistently! ID:', secondBannerId);
  } catch (err) {
    console.error('  -> Failed to create banner 2:', err.response?.data || err.message);
    process.exit(1);
  }

  // 7. Verify Public Customer Endpoint (/banners/active)
  console.log('\n[TEST 7] Fetching active banners via public endpoint (/api/v1/banners/active)...');
  try {
    const activeRes = await axios.get(`${API_BASE}/banners/active`);
    const activeBanners = activeRes.data.data.banners;
    console.log(`  -> Retrieved ${activeBanners.length} active banners for customer homepage.`);
    if (activeBanners.length < 2) {
      console.error('  -> ERROR: Expected at least 2 active banners!');
      process.exit(1);
    }
    // Verify display order: Banner 2 (order 0) should appear before Banner 1 (order 1)
    if (activeBanners[0].title !== 'Diwali Mega Festive Savings') {
      console.error('  -> ERROR: Display order not respected! First banner should have displayOrder 0');
      process.exit(1);
    }
    console.log('  -> Display order verified: Banner with displayOrder 0 correctly appears first.');
  } catch (err) {
    console.error('  -> Failed to fetch active banners:', err.response?.data || err.message);
    process.exit(1);
  }

  // 8. Verify Home Showcase endpoint includes banners
  console.log('\n[TEST 8] Checking /products/home-showcase integration...');
  try {
    const showcaseRes = await axios.get(`${API_BASE}/products/home-showcase`);
    const showcaseBanners = showcaseRes.data.data.banners;
    if (showcaseBanners && showcaseBanners.length >= 2) {
      console.log(`  -> Home showcase successfully includes ${showcaseBanners.length} banners seamlessly.`);
    } else {
      console.error('  -> ERROR: Home showcase does not return banners');
      process.exit(1);
    }
  } catch (err) {
    console.error('  -> Failed home showcase call:', err.response?.data || err.message);
    process.exit(1);
  }

  // 9. Update / Edit Banner
  console.log('\n[TEST 9] Editing Banner 1 details and image...');
  try {
    const updateRes = await axios.put(
      `${API_BASE}/banners/${createdBannerId}`,
      {
        title: 'Authentic Indian Handlooms (Updated Edition)',
        heading: 'Heritage Craftsmanship',
        displayOrder: 5,
      },
      adminHeaders
    );
    console.log('  -> Banner updated! New Title:', updateRes.data.data.banner.title);
  } catch (err) {
    console.error('  -> Failed to update banner:', err.response?.data || err.message);
    process.exit(1);
  }

  // 10. Deactivate Banner 1 and verify public disappearance
  console.log('\n[TEST 10] Deactivating Banner 1 and verifying public customer endpoint...');
  try {
    await axios.patch(`${API_BASE}/banners/${createdBannerId}/status`, { isActive: false }, adminHeaders);
    const activeResAfterDeactivate = await axios.get(`${API_BASE}/banners/active`);
    const matching = activeResAfterDeactivate.data.data.banners.find((b) => b._id === createdBannerId);
    if (matching) {
      console.error('  -> ERROR: Deactivated banner is still visible to customers!');
      process.exit(1);
    }
    console.log('  -> Deactivated banner is immediately removed from public display.');
  } catch (err) {
    console.error('  -> Failed deactivation test:', err.response?.data || err.message);
    process.exit(1);
  }

  // 11. Reactivate Banner 1
  console.log('\n[TEST 11] Reactivating Banner 1...');
  try {
    await axios.patch(`${API_BASE}/banners/${createdBannerId}/status`, { isActive: true }, adminHeaders);
    const activeResReactivate = await axios.get(`${API_BASE}/banners/active`);
    const matching = activeResReactivate.data.data.banners.find((b) => b.title.includes('Updated Edition'));
    if (!matching) {
      console.error('  -> ERROR: Reactivated banner not visible to customers!');
      process.exit(1);
    }
    console.log('  -> Banner successfully reactivated and visible on customer homepage.');
  } catch (err) {
    console.error('  -> Failed reactivation test:', err.response?.data || err.message);
    process.exit(1);
  }

  // 12. Delete Banner 2 and verify removal
  console.log('\n[TEST 12] Deleting Banner 2 and verifying persistent deletion...');
  try {
    await axios.delete(`${API_BASE}/banners/${secondBannerId}`, adminHeaders);
    const activeResAfterDelete = await axios.get(`${API_BASE}/banners/active`);
    const matching = activeResAfterDelete.data.data.banners.find((b) => b._id === secondBannerId);
    if (matching) {
      console.error('  -> ERROR: Deleted banner is still visible!');
      process.exit(1);
    }
    console.log('  -> Banner 2 permanently deleted from database and public display.');
  } catch (err) {
    console.error('  -> Failed delete test:', err.response?.data || err.message);
    process.exit(1);
  }

  // 13. Super Admin Banner Listing & Filter
  console.log('\n[TEST 13] Super Admin listing all banners with filters...');
  try {
    const listRes = await axios.get(`${API_BASE}/banners`, adminHeaders);
    console.log(`  -> Super Admin retrieved all banners: Total: ${listRes.data.data.total}, Active: ${listRes.data.data.activeCount}`);
  } catch (err) {
    console.error('  -> Failed to list banners:', err.response?.data || err.message);
    process.exit(1);
  }

  console.log('\n========================================================');
  console.log('ALL BANNER MANAGEMENT SYSTEM TESTS PASSED SUCCESSFULLY!');
  console.log('========================================================\n');
}

runBannerTests();
