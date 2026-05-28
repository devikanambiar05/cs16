const mongoose = require('mongoose');

module.exports = function connectDB(uri) {
  return mongoose.connect(uri || process.env.MONGO_URI || 'mongodb://localhost:27017/samagama')
    .then(() => {
      console.log('MongoDB Connected');
    })
    .catch((err) => {
      console.error('MongoDB Connection Error:', err.message);
      process.exit(1);
    });
};
