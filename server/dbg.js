require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const FAQ = require('./models/FAQ.js');
  const count = await FAQ.countDocuments({});
  console.log('total:', count);
  const statuses = await FAQ.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  console.log('by status:', JSON.stringify(statuses));
  const recent = await FAQ.find({}).select('status title').sort({ createdAt: -1 }).limit(5).lean();
  console.log('recent:', JSON.stringify(recent));
  mongoose.disconnect();
}).catch(console.error);
