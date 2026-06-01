const mongoose = require('mongoose');

module.exports = function connectDB(uri) {
  return mongoose.connect(uri || process.env.MONGO_URI || 'mongodb://localhost:27017/grantha')
    .then(async () => {
      console.log('MongoDB Connected');
      try {
        // Ensure Query model indexes are built to prevent "failed to load queries" search crashes
        const Query = require('../models/Query');
        await Query.ensureIndexes();
        console.log('Query search text indexes verified');
      } catch (err) {
        console.warn('Query indexing warning (non-fatal):', err.message);
      }
    })
    .catch((err) => {
      console.error('MongoDB Connection Error:', err.message);
      process.exit(1);
    });
};
