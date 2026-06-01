const mongoose = require('mongoose');
require('dotenv').config();
const Query = require('./models/Query');
const User = require('./models/User');

async function clean() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/Grantha');
  console.log('Connected to MongoDB');

  // Find the test users
  const users = await User.find({ email: /race-test/ });
  const userIds = users.map(u => u._id);
  console.log('Found test users:', users.map(u => u.email));

  if (userIds.length > 0) {
    // Delete any queries created by or assigned to these test users
    const deleteQueries = await Query.deleteMany({
      $or: [
        { createdBy: { $in: userIds } },
        { assignedTo: { $in: userIds } }
      ]
    });
    console.log('Deleted queries:', deleteQueries.deletedCount);
    
    // Delete the test users themselves to ensure a clean slate
    const deleteUsers = await User.deleteMany({ _id: { $in: userIds } });
    console.log('Deleted test users:', deleteUsers.deletedCount);
  }

  await mongoose.disconnect();
}

clean().catch(console.error);
