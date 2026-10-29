import mongoose from 'mongoose';
import { DEFAULT_LEGAL_DOCUMENTS } from '../src/services/legalDocumentSeedData.js';

async function sync() {
  await mongoose.connect('mongodb://127.0.0.1:27017/fairkart');
  for (const [type, doc] of Object.entries(DEFAULT_LEGAL_DOCUMENTS)) {
    await mongoose.connection.db.collection('legaldocuments').updateOne(
      { type },
      { $set: { title: doc.title, content: doc.content, version: doc.version, isPublished: true, updatedAt: new Date() } },
      { upsert: true }
    );
  }
  console.log('Synchronized all 7 legal documents successfully');
  process.exit(0);
}

sync().catch(err => {
  console.error(err);
  process.exit(1);
});
