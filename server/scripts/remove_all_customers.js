import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fairkart';

async function removeAllCustomers() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  // 1. Identify all customer user accounts
  const customerUsers = await db.collection('users').find({
    role: { $in: ['CUSTOMER', 'USER'] }
  }, { projection: { _id: 1, name: 1, email: 1, role: 1 } }).toArray();

  console.log(`Found ${customerUsers.length} customer user accounts to remove.`);

  if (customerUsers.length === 0) {
    console.log('No customer users found in the database.');
    await mongoose.disconnect();
    return;
  }

  const customerIds = customerUsers.map(u => u._id);
  const customerIdStrings = customerUsers.map(u => u._id.toString());

  console.log('\nRemoving customer user accounts:');
  customerUsers.forEach(u => console.log(`  - ${u.role}: ${u.email} (${u.name}) [${u._id}]`));

  // 2. Remove customer users from `users` collection
  const deleteUsersResult = await db.collection('users').deleteMany({
    _id: { $in: customerIds }
  });
  console.log(`\nDeleted ${deleteUsersResult.deletedCount} user documents from 'users' collection.`);

  // 3. Remove associated customer data
  const collectionsToClean = [
    { name: 'carts', query: { userId: { $in: customerIds } } },
    { name: 'wishlists', query: { userId: { $in: customerIds } } },
    { name: 'useraddresses', query: { userId: { $in: customerIds } } },
    { name: 'customershopattributions', query: { $or: [{ customerUserId: { $in: customerIds } }, { customerUserId: { $in: customerIdStrings } }] } },
    { name: 'customersubscriptions', query: { customerId: { $in: customerIds } } },
    { name: 'notifications', query: { userId: { $in: customerIds } } },
    { name: 'wallets', query: { userId: { $in: customerIds } } },
    { name: 'cointransactions', query: { userId: { $in: customerIds } } },
    { name: 'spinrewards', query: { userId: { $in: customerIds } } },
  ];

  for (const col of collectionsToClean) {
    try {
      const exists = await db.listCollections({ name: col.name }).hasNext();
      if (exists) {
        const res = await db.collection(col.name).deleteMany(col.query);
        console.log(`Deleted ${res.deletedCount} records from '${col.name}'.`);
      }
    } catch (e) {
      console.warn(`Could not clean collection ${col.name}:`, e.message);
    }
  }

  // 4. Verify remaining users
  const remainingUsers = await db.collection('users').find({}, { projection: { role: 1 } }).toArray();
  const remainingCounts = {};
  remainingUsers.forEach(u => {
    remainingCounts[u.role] = (remainingCounts[u.role] || 0) + 1;
  });

  console.log('\nRemaining Users by Role in Database:');
  for (const [role, count] of Object.entries(remainingCounts)) {
    console.log(`  - ${role}: ${count}`);
  }

  console.log('\nAll customer users have been successfully removed!');
  await mongoose.disconnect();
}

removeAllCustomers().catch(console.error);
