const {
  semanticCache,
  getSemanticCache,
  setSemanticCache,
  cleanExpiredCache,
  CACHE_TTL_MS
} = require('../controllers/ragController');

describe('Dynamic Semantic Query Cache Eviction', () => {
  let originalNow;

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    originalNow = Date.now;
  });

  afterAll(() => {
    Date.now = originalNow;
  });

  beforeEach(() => {
    semanticCache.clear();
    Date.now = originalNow;
  });

  it('should store entries with a timestamp property', () => {
    const query = 'How do I apply for scholarship?';
    const entry = { answer: 'Apply via LMS.', sources: [], faqsFound: 1 };
    
    setSemanticCache(query, entry);
    
    const cached = semanticCache.get(query.toLowerCase());
    expect(cached).toBeDefined();
    expect(cached.timestamp).toBeDefined();
    expect(typeof cached.timestamp).toBe('number');
    expect(cached.answer).toBe('Apply via LMS.');
  });

  it('should hit cache for exact query and semantic overlap', () => {
    const query = 'How do I apply for scholarship?';
    const entry = { answer: 'Apply via LMS.', sources: [], faqsFound: 1 };
    
    setSemanticCache(query, entry);
    
    // Exact hit
    const exactHit = getSemanticCache('how do i apply for scholarship?');
    expect(exactHit).toBeDefined();
    expect(exactHit.answer).toBe('Apply via LMS.');

    // Semantic hit (Jaccard similarity >= 0.85)
    const semanticHit = getSemanticCache('how do we apply for scholarship?');
    expect(semanticHit).toBeDefined();
    expect(semanticHit.answer).toBe('Apply via LMS.');
  });

  it('should evict cache entries older than 2 hours (CACHE_TTL_MS)', () => {
    const query = 'How do I apply for scholarship?';
    const entry = { answer: 'Apply via LMS.', sources: [], faqsFound: 1 };
    
    let fakeTime = 1000000000000;
    Date.now = () => fakeTime;
    
    setSemanticCache(query, entry);
    
    // Check it's there
    expect(getSemanticCache(query)).toBeDefined();
    
    // Fast-forward 1 hour (should NOT evict)
    fakeTime += 1 * 60 * 60 * 1000;
    expect(getSemanticCache(query)).toBeDefined();
    
    // Fast-forward another 1 hour and 1 second (total > 2 hours, should evict)
    fakeTime += 1 * 60 * 60 * 1000 + 1000;
    
    const hit = getSemanticCache(query);
    expect(hit).toBeNull();
    expect(semanticCache.has(query.toLowerCase())).toBe(false);
  });
});
