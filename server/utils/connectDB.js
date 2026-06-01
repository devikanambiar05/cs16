const mongoose = require('mongoose');

module.exports = function connectDB(uri) {
  return mongoose.connect(uri || process.env.MONGO_URI || 'mongodb://localhost:27017/grantha')
    .then(async () => {
      console.log('MongoDB Connected');
      try {
        // Ensure both Query and FAQ model indexes are built to prevent full-text search crashes
        const Query = require('../models/Query');
        const FAQ = require('../models/FAQ');
        await Promise.all([
          Query.ensureIndexes(),
          FAQ.ensureIndexes()
        ]);
        console.log('Query and FAQ full-text search indexes verified');
      } catch (err) {
        console.warn('Indexing warning (non-fatal):', err.message);
      }
    })
    .catch((err) => {
      console.error('MongoDB Connection Error:', err.message);
      process.exit(1);
    });
};
