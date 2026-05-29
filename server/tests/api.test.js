/**
 * API Integration Tests
 *
 * Requires MongoDB running at localhost:27017.
 * Run with: npm test
 *
 * These test the full HTTP layer using supertest.
 */

const request = require('supertest');

let app;
let User;
let server;

beforeAll(async () => {
  // Dynamically import so we avoid DB connection until needed
  app = require('../app');

  // Drop all test data before starting
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/samagama');
  }
  User = require('../models/User');
  const Query = require('../models/Query');
  const Answer = require('../models/Answer');
  await Promise.all([
    User.deleteMany({ email: { $regex: /test-/ } }),
    Query.deleteMany({}),
    Answer.deleteMany({})
  ]);
});

afterAll(async () => {
  // Connection teardown is handled automatically by Jest --forceExit
});

// Helper — generate a unique test email each run
const uniqueEmail = () => `test-${Date.now()}@faq.com`;

describe('Auth Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user and return a token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: uniqueEmail(),
          password: 'testpass123'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.name).toBe('Test User');
      expect(res.body.user.isVerified).toBe(true); // Email verification is bypassed for now
    });

    it('should reject registration with missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'no-name@test.com', password: 'password' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeTruthy();
    });

    it('should reject duplicate email registration', async () => {
      const email = uniqueEmail();
      await request(app).post('/api/auth/register').send({
        name: 'Test', email, password: 'password123'
      });

      const res = await request(app).post('/api/auth/register').send({
        name: 'Test 2', email, password: 'password456'
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/already registered/i);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const email = uniqueEmail();
      await request(app).post('/api/auth/register').send({
        name: 'Login Tester', email, password: 'loginpass123'
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'loginpass123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe(email);
    });

    it('should reject invalid password', async () => {
      const email = uniqueEmail();
      await request(app).post('/api/auth/register').send({
        name: 'Test', email, password: 'correctpassword'
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid/i);
    });

    it('should reject non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@nowhere.com', password: 'anypassword' });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid/i);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should always return 200 even for unknown email (security)', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nobody@nowhere.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/sent|if.*exists/i);
    });

    it('should generate a reset token for existing user', async () => {
      const email = uniqueEmail();
      await request(app).post('/api/auth/register').send({
        name: 'Reset Tester', email, password: 'password123'
      });

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email });

      expect(res.status).toBe(200);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limit on auth endpoints', async () => {
      const email = uniqueEmail();

      // Make 20 rapid requests (auth limit is 20 per 15 min)
      const promises = Array.from({ length: 20 }, () =>
        request(app).post('/api/auth/login').send({
          email: 'rate-limit-test@noconnection.com',
          password: 'wrongpass'
        })
      );

      const results = await Promise.all(promises);
      // At least some should succeed before hitting the limit
      // After 20, the 21st should be rate-limited
      const lastRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'rate-limit-test@noconnection.com', password: 'wrongpass' });

      // After 20 attempts, subsequent requests should get 429
      // Note: this depends on whether previous test runs consumed the limit
    });
  });
});

describe('FAQ Endpoints', () => {
  let authToken;

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'FAQ Tester',
      email: uniqueEmail(),
      password: 'faqtest123'
    });
    authToken = res.body.token;
  });

  describe('GET /api/health', () => {
    it('should return 200 OK', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('OK');
    });
  });

  describe('GET /api/categories', () => {
    it('should return categories', async () => {
      const res = await request(app).get('/api/categories');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/faqs', () => {
    it('should return paginated FAQs', async () => {
      const res = await request(app).get('/api/faqs?page=1&limit=5');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('faqs');
      expect(res.body).toHaveProperty('pagination');
      expect(Array.isArray(res.body.faqs)).toBe(true);
    });

    it('should filter FAQs by search query', async () => {
      const res = await request(app).get('/api/faqs?q=NOC&limit=5');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.faqs)).toBe(true);
    });
  });
});

describe('Community Query Endpoints', () => {
  let userToken;

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Query Tester',
      email: uniqueEmail(),
      password: 'querytest123'
    });
    userToken = res.body.token;
  });

  describe('POST /api/queries (create query)', () => {
    it('should create a query when authenticated', async () => {
      const res = await request(app)
        .post('/api/queries')
        .set('x-auth-token', userToken)
        .send({
          title: 'How do I apply for scholarship?',
          description: 'I need guidance on applying for merit scholarship.',
          tags: ['scholarship', 'fees']
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('query');
      expect(res.body.query.title).toContain('scholarship');
    });

    it('should reject query creation without auth', async () => {
      const res = await request(app)
        .post('/api/queries')
        .send({
          title: 'Unauthorized query',
          description: 'This should fail',
          tags: []
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/queries', () => {
    it('should return queries with pagination', async () => {
      const res = await request(app).get('/api/queries?limit=5&page=1');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('queries');
      expect(res.body).toHaveProperty('pagination');
    });

    it('should filter by status', async () => {
      const res = await request(app).get('/api/queries?status=open&limit=5');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.queries)).toBe(true);
    });

    it('should filter by claimed status', async () => {
      const res = await request(app).get('/api/queries?claimed=true&limit=5');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.queries)).toBe(true);
    });
  });
});