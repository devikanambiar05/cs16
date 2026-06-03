const mongoose = require('mongoose');
const Query = require('../models/Query');
const Answer = require('../models/Answer');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { releaseInactiveClaims } = require('../controllers/queryController');

beforeAll(async () => {
  process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/faqapp_test';
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO_URI);
  }

  // Clean collections before starting tests
  await Promise.all([
    Query.deleteMany({ title: /SchedulerTest/ }),
    Answer.deleteMany({ content: /SchedulerTest/ }),
    User.deleteMany({ email: /schedulertest/ }),
    Notification.deleteMany({ title: 'Query Claim Released' })
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('Inactive Query Claims Release Scheduler', () => {
  let creator;
  let claimant;

  beforeEach(async () => {
    // Create query creator and claimant
    creator = await User.create({
      name: 'Creator User',
      email: `schedulertest-creator-${Date.now()}@test.com`,
      password: 'password123'
    });

    claimant = await User.create({
      name: 'Claimant User',
      email: `schedulertest-claimant-${Date.now()}@test.com`,
      password: 'password123'
    });
  });

  afterEach(async () => {
    await Promise.all([
      Query.deleteMany({ title: /SchedulerTest/ }),
      Answer.deleteMany({ content: /SchedulerTest/ }),
      User.deleteMany({ email: /schedulertest/ }),
      Notification.deleteMany({ title: 'Query Claim Released' })
    ]);
  });

  it('should automatically release a claimed query older than 48 hours with no answers', async () => {
    // 1. Create a claimed query with claimedAt 3 days ago (72 hours ago)
    const threeDaysAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
    const query = await Query.create({
      title: 'SchedulerTest: Stale Claimed Query',
      description: 'Stale claimed query description',
      createdBy: creator._id,
      assignedTo: claimant._id,
      claimedAt: threeDaysAgo,
      status: 'claimed',
      expiresAt: new Date(Date.now() - 48 * 60 * 60 * 1000)
    });

    // 2. Execute the scheduler
    const releasedCount = await releaseInactiveClaims();

    // 3. Verify return count is 1
    expect(releasedCount).toBe(1);

    // 4. Retrieve query and verify release state
    const updatedQuery = await Query.findById(query._id);
    expect(updatedQuery.status).toBe('open');
    expect(updatedQuery.assignedTo).toBeNull();
    expect(updatedQuery.claimedAt).toBeNull();
    expect(updatedQuery.skipCount).toBe(1);

    // 5. Verify in-app notification is created for the claimant
    const notification = await Notification.findOne({
      recipient: claimant._id,
      type: 'claim',
      title: 'Query Claim Released'
    });
    expect(notification).toBeDefined();
    expect(notification.message).toContain('released due to 48 hours of inactivity');
  });

  it('should NOT release a claimed query older than 48 hours if an answer has been submitted', async () => {
    // 1. Create a claimed query with claimedAt 3 days ago
    const threeDaysAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
    const query = await Query.create({
      title: 'SchedulerTest: Answered Claimed Query',
      description: 'Answered claimed query description',
      createdBy: creator._id,
      assignedTo: claimant._id,
      claimedAt: threeDaysAgo,
      status: 'claimed',
      expiresAt: new Date(Date.now() - 48 * 60 * 60 * 1000)
    });

    // 2. Submit an answer for this query
    await Answer.create({
      content: 'SchedulerTest: Answer submitted for stale query',
      queryId: query._id,
      userId: claimant._id
    });

    // 3. Execute the scheduler
    const releasedCount = await releaseInactiveClaims();

    // 4. Verify return count is 0
    expect(releasedCount).toBe(0);

    // 5. Retrieve query and verify it remains claimed
    const updatedQuery = await Query.findById(query._id);
    expect(updatedQuery.status).toBe('claimed');
    expect(updatedQuery.assignedTo.toString()).toBe(claimant._id.toString());
    expect(updatedQuery.claimedAt).not.toBeNull();
    expect(updatedQuery.skipCount).toBe(0);

    // 6. Verify no release notification was created
    const notificationCount = await Notification.countDocuments({
      recipient: claimant._id,
      title: 'Query Claim Released'
    });
    expect(notificationCount).toBe(0);
  });
});
