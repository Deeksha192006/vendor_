import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { startJobs } from './jobs/jobRunner.js';

const startServer = async () => {
  try {
    // Connect to MongoDB FIRST
    await connectDB();

    console.log('[Database] Connection established successfully.');

    // Auto-seed territories if empty
    try {
      const { Territory } = await import('./models/Territory.js');
      const count = await Territory.countDocuments();
      if (count === 0) {
        console.log('[Territories] Empty territory database detected. Seeding Indian states & dispatch hubs...');
        const { seedTerritories } = await import('../scripts/seedTerritories.js');
        await seedTerritories();
      }
    } catch (terrErr) {
      console.warn('[Territories] Auto-seed check notice:', terrErr.message);
    }

    // Auto-seed legal documents if empty
    try {
      const { legalDocumentService } = await import('./services/legalDocumentService.js');
      await legalDocumentService.ensureDefaultDocuments();
    } catch (legalErr) {
      console.warn('[LegalDocuments] Auto-seed check notice:', legalErr.message);
    }

    const PORT = env.PORT || 5000;

    // Start API only after MongoDB is connected
    app.listen(PORT, '0.0.0.0', () => {
      console.log('==========================================');
      console.log(`🚀 FairKart API Server running on port ${PORT}`);
      console.log(`🌐 Environment: ${env.NODE_ENV}`);
      console.log('==========================================');
    });

    startJobs();

  } catch (error) {
    console.error('[Fatal] MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

startServer();