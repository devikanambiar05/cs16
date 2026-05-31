const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Query = require('./models/Query');
const User = require('./models/User');

async function run() {
  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  console.log('Connected to in-memory database');

  const user = await User.create({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    reputation: 100
  });

  const query = await Query.create({
    title: 'Test Title',
    description: 'Test Description',
    status: 'open',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  });

  console.log('Initial Query:', query);

  const updated = await Query.findOneAndUpdate(
    { _id: query._id },
    { $set: { assignedTo: user._id, status: 'claimed' } },
    { new: true }
  );

  console.log('Updated Query:', updated);

  await mongoose.disconnect();
  await mongoServer.stop();
}

run().catch(console.error);
