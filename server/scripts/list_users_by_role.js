import mongoose from 'mongoose';
import { User } from '../src/models/User.js';

async function listUsers() {
  await mongoose.connect('mongodb://127.0.0.1:27017/fairkart');
  const users = await User.find({}, 'name email role status createdAt');
  console.log(`Total users found: ${users.length}`);
  const roleGroups = {};
  users.forEach(u => {
    if (!roleGroups[u.role]) roleGroups[u.role] = [];
    roleGroups[u.role].push({ id: u._id, name: u.name, email: u.email });
  });

  for (const [role, list] of Object.entries(roleGroups)) {
    console.log(`\n--- Role: ${role} (${list.length}) ---`);
    list.slice(0, 10).forEach(u => console.log(`  - ${u.email} (${u.name}) [${u.id}]`));
    if (list.length > 10) console.log(`  ... and ${list.length - 10} more`);
  }

  await mongoose.disconnect();
}

listUsers().catch(console.error);
