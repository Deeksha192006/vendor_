import dns from 'dns';
import mongoose from 'mongoose';
import { env } from './env.js';

// Fix for Node.js SRV lookup issues on Windows / certain ISPs
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (err) {
  console.warn('[Database] Failed to set custom DNS servers:', err.message);
}

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);

    // Gracefully handle standalone MongoDB instances that do not support multi-document transactions
    const isReplicaSet = Boolean(
      conn.connection?.client?.topology?.description?.setName ||
      ['ReplicaSetWithPrimary', 'Sharded'].includes(conn.connection?.client?.topology?.description?.type)
    );

    if (!isReplicaSet) {
      console.log('[Database] Standalone MongoDB detected — transaction methods stubbed for local single-node compatibility.');
      const originalStartSession = mongoose.startSession.bind(mongoose);
      mongoose.startSession = async function (...args) {
        const session = await originalStartSession(...args);
        if (session) {
          session.startTransaction = function () {};
          session.commitTransaction = async function () {};
          session.abortTransaction = async function () {};
          session.inTransaction = function () { return false; };
          session.withTransaction = async function (fn) { return await fn(session); };
        }
        return session;
      };
    }

    return conn;
  } catch (error) {
    console.error(`[Database Error] ${error.message}`);
    // Non-blocking throw so server can gracefully log or retry depending on environment
    throw error;
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[Database] Mongoose disconnected from MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('[Database Error] Connection error:', err);
});
