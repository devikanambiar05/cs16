require('dotenv').config();
const connectDB = require('./utils/connectDB');
const app = require('./app');

async function bootstrap() {
  try {
    await connectDB();
    console.log('Database connected');
  } catch (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

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
}

bootstrap().catch(err => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
