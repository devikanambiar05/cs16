require('dotenv').config();
const connectDB = require('./utils/connectDB');
const app = require('./app');

let server = null;

async function bootstrap() {
  try {
    await connectDB();
    console.log('Database connected');

    // Auto-seed if database is empty, missing key synthetic users (Amit), or explicitly requested via RESET_DB=true
    const User = require('./models/User');
    const amitUser = await User.findOne({ email: 'amit@example.com' });
    if (!amitUser || process.env.RESET_DB === 'true') {
      console.log('Auto-seeding database with advanced synthetic variation...');
      const { seedDatabase } = require('./seed');
      await seedDatabase(true);
    }

    // Ensure RAG Assistant bot user is initialized in database
    const ragBot = await User.findOne({ email: 'ragbot@faqapp.local' });
    if (!ragBot) {
      await User.create({
        name: 'RAG Assistant',
        email: 'ragbot@faqapp.local',
        password: 'ragbot_secure_password_random_123',
        role: 'user',
        isVolunteer: true,
        reputation: 9999,
        isEmailVerified: true
      });
      console.log('Created RAG Assistant bot user');
    } else {
      // Clean up any legacy RAG bot answers that were auto-posted
      const Answer = require('./models/Answer');
      const deleteResult = await Answer.deleteMany({ userId: ragBot._id });
      if (deleteResult.deletedCount > 0) {
        console.log(`[RAG Cleanup] Cleaned up ${deleteResult.deletedCount} legacy RAG Assistant answers`);
        // Recalculate answerCount and status for affected queries
        const affectedQueries = await Answer.distinct('queryId');
        const Query = require('./models/Query');
        for (const qId of affectedQueries) {
          const q = await Query.findById(qId);
          if (q) {
            const count = await Answer.countDocuments({ queryId: q._id, deletedAt: null });
            q.answerCount = count;
            if (count === 0 && q.status === 'answered') {
              q.status = 'open';
            }
            await q.save();
          }
        }
      }
    }
  } catch (err) {
    console.error('Database connection or seeding failed:', err.message);
    process.exit(1);
  }

  const PORT = parseInt(process.env.PORT) || 5000;

  // Attempt to listen; if PORT is busy, try up to 3 consecutive ports
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const portToTry = PORT + attempt;
    try {
      server = app.listen(portToTry, () => {
        console.log(`Server running on port ${portToTry}`);
      });
      break;
    } catch (err) {
      if (err.code === 'EADDRINUSE') {
        console.warn(`Port ${portToTry} is in use — attempt ${attempt + 1}/3`);
        lastError = err;
        // Wait a bit for OS to release the port
        await new Promise(r => setTimeout(r, 500));
      } else {
        throw err;
      }
    }
  }

  if (!server) {
    console.error('Could not bind to any port. Is another server already running?');
    process.exit(1);
  }

  // Graceful shutdown — close server before exit
  const shutdown = (signal) => {
    console.log(`\n${signal} received — shutting down gracefully...`);
    if (server) server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
    // Force exit after 5s if server.close() hangs
    setTimeout(() => { console.error('Forced exit'); process.exit(1); }, 5000);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Pre-warm RAG index in the background — don't block server startup
  const { buildRagIndex } = require('./controllers/ragController');
  console.log('Pre-warming RAG index in background...');
  buildRagIndex()
    .then(({ faqs }) => {
      console.log(`RAG index ready — ${faqs.length} FAQs indexed`);
    })
    .catch(err => {
      console.warn('RAG pre-warm failed (non-fatal):', err.message);
    });

  // Set up inactive query claims release scheduler (running every 4 hours + boot run)
  const { releaseInactiveClaims } = require('./controllers/queryController');
  releaseInactiveClaims().catch(err => console.error('Initial claims release check failed:', err.message));
  const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
  setInterval(() => {
    releaseInactiveClaims().catch(err => console.error('Claims release check failed:', err.message));
  }, FOUR_HOURS_MS);
}

bootstrap().catch(err => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
