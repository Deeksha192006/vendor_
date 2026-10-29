const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fairkart';

async function cleanData() {
  console.log(`Connecting to MongoDB at ${MONGODB_URI}...`);
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB.');

  const db = mongoose.connection.db;

  const collectionsToClear = [
    // Products & related
    'products',
    'productstatushistories',
    'stocktransactions',
    'reviews',
    'wishlists',
    'carts',

    // Vendor specific records
    'vendors',
    'vendoractivities',
    'vendoraddresses',
    'vendorareaassignments',
    'vendorbankaccounts',
    'vendorbusinesses',
    'vendordocuments',
    'vendorledgers',
    'vendorpayoutprofiles',
    'vendorprofiles',
    'vendorqrcodes',
    'vendorreferralcodes',
    'vendorshippingaddresses',
    'vendorstatushistories',
    'vendorwithdrawals',
    'kycdocuments',

    // Subscriptions (active/purchased subscriptions and their orders, NOT the plan definitions)
    'subscriptions',
    'subscriptionorders',
    'vendorsubscriptions',
    'customersubscriptions',

    // Orders, revenue, commissions, settlements & financials
    'orders',
    'vendororders',
    'vendorsettlements',
    'commissions',
    'payments',
    'paymentreconciliations',
    'platformledgers',
    'financeadjustments',
    'financeexceptions',
    'orderstatushistories',
    'suborderstatushistories',
    'fulfillments',
    'shipments',
    'shipmenttrackingevents',
    'shippingexceptions',
    'returnrequests',
    'deliveryassignments',
    'offlinebills',
    'offlinebillstatushistories',
    'billrewards',
    'wallets',
    'wallettransactions',
    'cointransactions',
    'supercointransactions',
    'supercoinwallets',
    'referrals',
    'referralrewards',
    'referralevents',
    'referralrelationships',
    'customervendorattributions',
    'customershopattributions',
    'attributionchangerequests',
    'attributionhistories',
    'qrscanlogs'
  ];

  console.log('\n--- 1. DELETING VENDOR USERS ---');
  const vendorUsersCountBefore = await db.collection('users').countDocuments({ role: 'VENDOR' });
  const adminUsersCountBefore = await db.collection('users').countDocuments({ role: { $in: ['SUPER_ADMIN', 'ADMIN'] } });
  console.log(`Existing VENDOR users: ${vendorUsersCountBefore}`);
  console.log(`Existing ADMIN/SUPER_ADMIN users (preserved): ${adminUsersCountBefore}`);

  const deleteVendorUsersResult = await db.collection('users').deleteMany({ role: 'VENDOR' });
  console.log(`Deleted ${deleteVendorUsersResult.deletedCount} VENDOR user records.`);

  console.log('\n--- 2. CLEARING TARGET COLLECTIONS ---');
  const stats = {};
  for (const collName of collectionsToClear) {
    try {
      const coll = db.collection(collName);
      const countBefore = await coll.countDocuments();
      if (countBefore > 0) {
        const result = await coll.deleteMany({});
        stats[collName] = { before: countBefore, deleted: result.deletedCount };
        console.log(`[CLEARED] ${collName}: deleted ${result.deletedCount} documents`);
      } else {
        stats[collName] = { before: 0, deleted: 0 };
      }
    } catch (err) {
      console.error(`Error processing collection ${collName}:`, err.message);
    }
  }

  console.log('\n--- 3. VERIFYING PRESERVED SYSTEM DATA ---');
  const preservedCollections = [
    'users',
    'categories',
    'brands',
    'subscriptionplans',
    'customersubscriptionplans',
    'vendorsubscriptionplans',
    'settings',
    'territories',
    'roles',
    'spinwheels'
  ];

  for (const pColl of preservedCollections) {
    try {
      const count = await db.collection(pColl).countDocuments();
      console.log(`[PRESERVED] ${pColl}: ${count} remaining`);
    } catch (err) {
      console.log(`Collection ${pColl} does not exist or empty.`);
    }
  }

  console.log('\n--- SUMMARY ---');
  console.log('Cleanup completed successfully!');
  await mongoose.disconnect();
}

cleanData().catch((err) => {
  console.error('Fatal error during cleanup:', err);
  process.exit(1);
});
