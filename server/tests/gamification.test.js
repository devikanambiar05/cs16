const request = require('supertest');
const mongoose = require('mongoose');

let app;
let User;
let Query;
let Answer;
let UpvoteLog;

beforeAll(async () => {
  process.env.MONGO_URI = 'mongodb://localhost:27017/faqapp_test';
  app = require('../app');
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO_URI);
  }
  User = require('../models/User');
  Query = require('../models/Query');
  Answer = require('../models/Answer');
  UpvoteLog = require('../models/UpvoteLog');

  // Clear relevant collections
  await Promise.all([
    User.deleteMany({ email: { $regex: /gametest/ } }),
    Query.deleteMany({ title: { $regex: /GameTest/ } }),
    Answer.deleteMany({ content: { $regex: /GameTest/ } }),
    UpvoteLog.deleteMany({})
  ]);
});

const uniqueEmail = (prefix) => `gametest-${prefix}-${Date.now()}@test.com`;

const createUser = async (name, email, role = 'user', reputation = 0) => {
  const registerRes = await request(app)
    .post('/api/auth/register')
    .send({
      name,
      email,
      password: 'password123'
    });
  
  const token = registerRes.body.token;
  const userId = registerRes.body.user.id || registerRes.body.user._id;

  if (role !== 'user' || reputation !== 0) {
    await User.findByIdAndUpdate(userId, { role, reputation });
  }

  return { token, userId };
};

describe('Trust-Based Gamification & Anti-Collusion Tests', () => {
  let userLowRep;   // reputation 0
  let userMedRep;   // reputation 50
  let userHighRep;  // reputation 100
  let userAdmin;    // admin role
  let testQuery;

  beforeAll(async () => {
    userLowRep = await createUser('Low Rep User', uniqueEmail('low'));
    userMedRep = await createUser('Med Rep User', uniqueEmail('med'), 'user', 50);
    userHighRep = await createUser('High Rep User', uniqueEmail('high'), 'user', 100);
    userAdmin = await createUser('Admin User', uniqueEmail('admin'), 'admin');

    // Create a query that we can answer
    const queryRes = await request(app)
      .post('/api/queries')
      .set('x-auth-token', userLowRep.token)
      .send({
        title: 'GameTest: Scholarship requirements?',
        description: 'What are the main scholarship documents required?',
        tags: ['scholarship']
      });
    testQuery = queryRes.body.query;
  });

  describe('Trust-Based Answer Vetting (isVetted)', () => {
    it('should create an unverified (isVetted = false) answer if creator reputation < 50', async () => {
      const res = await request(app)
        .post('/api/answers')
        .set('x-auth-token', userLowRep.token)
        .send({
          queryId: testQuery._id,
          content: 'GameTest: Low reputation answer content'
        });

      expect(res.status).toBe(201);
      expect(res.body.answer).toHaveProperty('isVetted', false);
    });

    it('should create a verified (isVetted = true) answer if creator reputation >= 50', async () => {
      const res = await request(app)
        .post('/api/answers')
        .set('x-auth-token', userMedRep.token)
        .send({
          queryId: testQuery._id,
          content: 'GameTest: Med reputation answer content'
        });

      expect(res.status).toBe(201);
      expect(res.body.answer).toHaveProperty('isVetted', true);
    });

    it('should create a verified (isVetted = true) answer if creator is admin', async () => {
      const res = await request(app)
        .post('/api/answers')
        .set('x-auth-token', userAdmin.token)
        .send({
          queryId: testQuery._id,
          content: 'GameTest: Admin answer content'
        });

      expect(res.status).toBe(201);
      expect(res.body.answer).toHaveProperty('isVetted', true);
    });
  });

  describe('Vetting Endpoints (POST /api/answers/:id/vet)', () => {
    let unvettedAnswerId;

    beforeEach(async () => {
      await Answer.deleteMany({ queryId: testQuery._id });
      await Query.findByIdAndUpdate(testQuery._id, { answerCount: 0 });

      const res = await request(app)
        .post('/api/answers')
        .set('x-auth-token', userLowRep.token)
        .send({
          queryId: testQuery._id,
          content: 'GameTest: Temporarily unvetted answer'
        });
      unvettedAnswerId = res.body.answer._id;
    });

    it('should block vetting from a user with reputation < 100', async () => {
      const res = await request(app)
        .post(`/api/answers/${unvettedAnswerId}/vet`)
        .set('x-auth-token', userMedRep.token);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('reputation');
    });

    it('should successfully vet an answer from a user with reputation >= 100 and award +5 author rep', async () => {
      const authorBefore = await User.findById(userLowRep.userId);
      const repBefore = authorBefore.reputation;

      const res = await request(app)
        .post(`/api/answers/${unvettedAnswerId}/vet`)
        .set('x-auth-token', userHighRep.token);

      expect(res.status).toBe(200);
      expect(res.body.answer).toHaveProperty('isVetted', true);

      const authorAfter = await User.findById(userLowRep.userId);
      expect(authorAfter.reputation).toBe(repBefore + 5);
    });

    it('should successfully vet an answer from an admin user', async () => {
      const res = await request(app)
        .post(`/api/answers/${unvettedAnswerId}/vet`)
        .set('x-auth-token', userAdmin.token);

      expect(res.status).toBe(200);
      expect(res.body.answer).toHaveProperty('isVetted', true);
    });
  });

  describe('Self-Upvote & Peer-to-Peer Throttling (Anti-Collusion)', () => {
    let answer1, answer2, answer3;

    beforeAll(async () => {
      await Answer.deleteMany({ queryId: testQuery._id });
      await Query.findByIdAndUpdate(testQuery._id, { answerCount: 0 });

      // UserLowRep submits 3 answers
      const res1 = await request(app)
        .post('/api/answers')
        .set('x-auth-token', userLowRep.token)
        .send({ queryId: testQuery._id, content: 'GameTest: Answer 1' });
      answer1 = res1.body.answer;

      const res2 = await request(app)
        .post('/api/answers')
        .set('x-auth-token', userLowRep.token)
        .send({ queryId: testQuery._id, content: 'GameTest: Answer 2' });
      answer2 = res2.body.answer;

      const res3 = await request(app)
        .post('/api/answers')
        .set('x-auth-token', userLowRep.token)
        .send({ queryId: testQuery._id, content: 'GameTest: Answer 3' });
      answer3 = res3.body.answer;
    });

    it('should block self-upvotes', async () => {
      const res = await request(app)
        .post(`/api/answers/${answer1._id}/upvote`)
        .set('x-auth-token', userLowRep.token);

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/cannot upvote your own/i);
    });

    it('should allow a peer to upvote 2 answers within 24 hours, but block the 3rd', async () => {
      // 1st upvote from UserMedRep to UserLowRep's answer1
      const res1 = await request(app)
        .post(`/api/answers/${answer1._id}/upvote`)
        .set('x-auth-token', userMedRep.token);
      expect(res1.status).toBe(200);

      // 2nd upvote from UserMedRep to UserLowRep's answer2
      const res2 = await request(app)
        .post(`/api/answers/${answer2._id}/upvote`)
        .set('x-auth-token', userMedRep.token);
      expect(res2.status).toBe(200);

      // 3rd upvote attempt from UserMedRep to UserLowRep's answer3 should fail
      const res3 = await request(app)
        .post(`/api/answers/${answer3._id}/upvote`)
        .set('x-auth-token', userMedRep.token);
      expect(res3.status).toBe(400);
      expect(res3.body.error).toContain('limit exceeded');
    });

    it('should free up a slot if the peer removes an upvote, allowing another upvote', async () => {
      // Remove upvote on answer1
      const resRemove = await request(app)
        .post(`/api/answers/${answer1._id}/upvote`)
        .set('x-auth-token', userMedRep.token);
      expect(resRemove.status).toBe(200);

      // Now the 3rd upvote attempt on answer3 should succeed
      const res3 = await request(app)
        .post(`/api/answers/${answer3._id}/upvote`)
        .set('x-auth-token', userMedRep.token);
      expect(res3.status).toBe(200);
    });
  });
});
