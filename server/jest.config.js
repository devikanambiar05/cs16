process.env.MONGO_URI = 'mongodb://localhost:27017/faqapp_test';

module.exports = {
  testEnvironment: 'node',
  testTimeout: 15000,
  verbose: true,
  forceExit: true
};