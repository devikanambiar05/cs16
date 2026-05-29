const FAQ = require('../models/FAQ');
const Query = require('../models/Query');
const Answer = require('../models/Answer');

// ─── Text utilities ───────────────────────────────────────────────────────────

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these',
  'those', 'it', 'its', 'as', 'if', 'then', 'than', 'so', 'no', 'not',
  'only', 'just', 'also', 'very', 'how', 'what', 'when', 'where', 'which',
  'who', 'whom', 'whose', 'why', 'whether', 'am', 'i', 'we', 'you', 'your',
  'he', 'she', 'they', 'them', 'his', 'her', 'their', 'my', 'our'
]);

function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOPWORDS.has(t));
}

// ─── TF-IDF tag detection (pre-computed, cached 10 min) ───────────────────────

const IDF_CACHE_TTL_MS = 10 * 60 * 1000;
let idfCache = null;
let idfCacheAt = 0;

async function buildIDFCache() {
  if (idfCache && Date.now() - idfCacheAt < IDF_CACHE_TTL_MS) return idfCache;

  const [queryDocs, faqDocs] = await Promise.all([
    Query.find({ deletedAt: null }, 'title description tags').lean(),
    FAQ.find({ status: 'resolved', deletedAt: null }, 'title description tags').lean()
  ]);

  const [queryTags, faqTags] = await Promise.all([
    Query.distinct('tags'),
    FAQ.distinct('tags')
  ]);
  const knownTags = new Set([...queryTags, ...faqTags].map(t => t.toLowerCase()));

  const documents = [
    ...queryDocs.map(d => `${d.title} ${d.description}`.toLowerCase()),
    ...faqDocs.map(d => `${d.title} ${d.description}`.toLowerCase())
  ];

  if (documents.length === 0) {
    idfCache = { knownTags, idf: {}, N: 1 };
    idfCacheAt = Date.now();
    return idfCache;
  }

  const df = {};
  for (const text of documents) {
    for (const term of new Set(tokenize(text))) {
      df[term] = (df[term] || 0) + 1;
    }
  }

  const N = documents.length;
  const idf = {};
  for (const term of Object.keys(df)) {
    idf[term] = Math.log(N / df[term]) + 1;
  }

  idfCache = { knownTags, idf, N };
  idfCacheAt = Date.now();
  return idfCache;
}

function scoreTags(text, knownTags, idf, limit = 5) {
  const tokens = tokenize(text);
  const tf = {};
  for (const term of tokens) tf[term] = (tf[term] || 0) + 1;

  const scored = [];
  for (const tag of knownTags) {
    const tagLower = tag.toLowerCase();
    let matchedTerms = 0;
    let matchedIdfSum = 0;
    for (const token of tokens) {
      if (tagLower.includes(token)) {
        matchedTerms++;
        matchedIdfSum += idf[token] || 1;
      }
    }

    if (matchedTerms === 0) continue;
    const score = (matchedTerms / tokens.length) * (matchedIdfSum / matchedTerms);
    scored.push({ tag, score: Math.round(score * 100) / 100 });
  }

  if (scored.length === 0) {
    const sortedTerms = Object.entries(tf)
      .sort((a, b) => (idf[b[0]] || 1) - (idf[a[0]] || 1))
      .slice(0, limit)
      .map(([t]) => t);
    return sortedTerms.map(t => ({ tag: t, score: 1 }));
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

// ─── FAQ BM25 search (handles short queries against small corpora) ─────────────
// BM25 solves the zero-IDF problem: TF-IDF cosine similarity gives 0 similarity
// when a term is absent from the FAQ corpus. BM25 uses Robertson-Sparck Jones
// IDF which stays positive even when a term appears in every document.

const FAQ_BM25_TTL_MS = 10 * 60 * 1000;
let faqBm25Cache = null;
let faqBm25CacheAt = 0;

async function buildFaqBm25Index() {
  if (faqBm25Cache && Date.now() - faqBm25CacheAt < FAQ_BM25_TTL_MS) return faqBm25Cache;

  const faqs = await FAQ.find({ status: 'resolved', deletedAt: null })
    .select('_id title finalAnswer tags upvotes')
    .lean();

  if (faqs.length === 0) {
    faqBm25Cache = { faqs: [], df: {}, N: 0 };
    faqBm25CacheAt = Date.now();
    return faqBm25Cache;
  }

  // df[term] = number of FAQs containing this term (document frequency)
  const df = {};
  for (const faq of faqs) {
    for (const term of new Set(tokenize(`${faq.title} ${faq.finalAnswer || ''}`))) {
      df[term] = (df[term] || 0) + 1;
    }
  }

  // Pre-tokenize each FAQ and store alongside
  const processed = faqs.map(faq => {
    const allText = `${faq.title} ${(faq.finalAnswer || '').substring(0, 500)}`;
    const tokens = tokenize(allText);
    return { _id: faq._id, title: faq.title, finalAnswer: faq.finalAnswer, tags: faq.tags, upvotes: faq.upvotes, _tokens: tokens, _docLen: tokens.length };
  });

  faqBm25Cache = { faqs: processed, df, N: faqs.length };
  faqBm25CacheAt = Date.now();
  return faqBm25Cache;
}

// Robertson-Sparck Jones IDF: log((N - df + 0.5) / (df + 0.5) + 1)
// Always positive even when df == N (every document has the term)
function rsjIdf(df, N) {
  return Math.log((N - df + 0.5) / (df + 0.5) + 1);
}

// BM25 scoring — token array version (for FAQ index)
function bm25Score(queryTokens, docTokens, docLength, avgDL, df, idf, N, k1 = 1.5, b = 0.75) {
  const docTf = {};
  for (const t of docTokens) docTf[t] = (docTf[t] || 0) + 1;
  return bm25ScoreTf(queryTokens, docTf, docLength, avgDL, df, N, k1, b);
}

// BM25 scoring — pre-computed TF map version (for query scoring)
function bm25ScoreTf(queryTokens, docTf, docLength, avgDL, df, N, k1 = 1.5, b = 0.75) {
  let score = 0;
  for (const term of queryTokens) {
    const termDf = df[term] || 0;
    if (termDf === 0) continue;
    const wIdf = rsjIdf(termDf, N);
    const tf = docTf[term] || 0;
    const numerator = tf * (k1 + 1);
    const denominator = tf + k1 * (1 - b + b * (docLength / avgDL));
    score += wIdf * (numerator / denominator);
  }
  return score;
}

async function scoreFaqsAgainstQuery(queryText, limit = 5) {
  const { faqs, df, N } = await buildFaqBm25Index();
  if (faqs.length === 0 || N === 0) return [];

  const qTokens = tokenize(queryText);
  if (qTokens.length === 0) return [];

  const avgDL = faqs.reduce((sum, f) => sum + f._docLen, 0) / faqs.length;

  // Score every FAQ
  const scored = faqs
    .map(faq => ({
      _id: faq._id,
      title: faq.title,
      finalAnswer: faq.finalAnswer,
      tags: faq.tags,
      upvotes: faq.upvotes,
      score: bm25Score(qTokens, faq._tokens, faq._docLen, avgDL, df, df, N)
    }))
    .filter(f => f.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return [];

  // Use the TOP result's score as the relevance ceiling, not the input threshold.
  // Only return FAQs that score >= 35% of the best match — this cleanly filters
  // out low-relevance results for truly unrelated queries. An absolute floor of
  // 0.8 prevents a low-scoring result from appearing solely because the corpus
  // is tiny and everything scores poorly.
  const topScore = scored[0].score;
  const MIN_RELATIVE_SCORE = 0.35;
  const MIN_ABSOLUTE_SCORE = 0.8;

  return scored
    .filter(f => f.score >= MIN_ABSOLUTE_SCORE && f.score / topScore >= MIN_RELATIVE_SCORE)
    .slice(0, limit)
    .map(f => ({ _id: f._id, title: f.title, finalAnswer: f.finalAnswer, tags: f.tags, upvotes: f.upvotes, similarity: Math.round(f.score * 1000) / 1000 }));
}

// ─── Jaccard (for query duplicate detection) ───────────────────────────────────

const EXACT_DUPLICATE_THRESHOLD = 0.85;

function jaccardSimilarity(a, b) {
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));
  if (setA.size === 0 || setB.size === 0) return 0;
  const intersection = [...setA].filter(t => setB.has(t)).length;
  return intersection / new Set([...setA, ...setB]).size;
}

// ─── Routes ────────────────────────────────────────────────────────────────────

exports.searchSimilar = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q || q.length < 3) {
      return res.json({ faqs: [], queries: [], resolvedQueries: [], highConfidenceDuplicate: null, isInScope: true });
    }

    // Scope check — does the query mention anything related to the platform/internship?
    const scopeKeywords = [
      'vicharanashala', 'vins', 'vise', 'summership', 'iit ropar', 'internship',
      'noc', 'offer letter', 'certificate', 'rosetta', 'vibe', 'yaksha', 'samagama',
      'phase', 'bronze', 'silver', 'gold', 'platinum', 'badge', 'mentor', 'team formation',
      'quiz', 'live session', 'coursework', 'proctor', 'proctoring',
      'leave', 'attendance', 'stipend', 'laptop', 'linux', 'ssh',
      'viBe', 'vibe platform', 'linear progression', 'penalty score'
    ];
    const queryLower = q.toLowerCase();
    const matchedScope = scopeKeywords.filter(k => queryLower.includes(k));
    const isInScope = matchedScope.length > 0;

    // FAQs — BM25 (handles short queries, zero-IDF edge cases)
    const faqs = await scoreFaqsAgainstQuery(q, 5);

    // Queries — full BM25 scoring, filter to relative relevance threshold
    const allRawQueries = await Query.find({
      status: { $ne: 'closed' },
      deletedAt: null
    })
      .select('_id title description tags status answerCount upvotes createdBy')
      .lean();

    const qTokens = tokenize(q);
    let topRawQueries = [];
    if (qTokens.length > 0) {
      // Separate idf/N for query corpus — compute document frequency across all queries
      const qdf = {};
      for (const r of allRawQueries) {
        for (const term of new Set(tokenize(`${r.title} ${r.description}`))) {
          qdf[term] = (qdf[term] || 0) + 1;
        }
      }
      const qN = allRawQueries.length;
      const avgQL = allRawQueries.reduce((s, r) => s + tokenize(`${r.title} ${r.description}`).length, 0) / Math.max(qN, 1);
      const scoreMap = {};
      for (const r of allRawQueries) {
        const rTokens = tokenize(`${r.title} ${r.description}`);
        const rdl = rTokens.length;
        const rTf = {};
        for (const t of rTokens) rTf[t] = (rTf[t] || 0) + 1;
        const s = bm25ScoreTf(qTokens, rTf, rdl, avgQL || rdl, qdf, qN);
       if (s >= 0.5) scoreMap[r._id.toString()] = s;
      }
      const topScore = Object.values(scoreMap)[0] || 0;
      const MIN_RELATIVE = 0.35;
      topRawQueries = allRawQueries
        .filter(r => {
          const s = scoreMap[r._id.toString()] || 0;
          return topScore === 0 || s / topScore >= MIN_RELATIVE;
        })
        .sort((a, b) => (scoreMap[b._id.toString()] || 0) - (scoreMap[a._id.toString()] || 0))
        .slice(0, 10);
    }

    const resolvedQueries = [];
    const openQueries = [];

    for (const query of topRawQueries) {
      const acceptedAnswer = await Answer.findOne({ queryId: query._id, isAccepted: true })
        .select('_id upvotes').lean();
      if (acceptedAnswer) resolvedQueries.push({ ...query, acceptedAnswer });
      else openQueries.push({ ...query, acceptedAnswer: null });
    }

    const scoredResolved = resolvedQueries.map(query => ({
      ...query,
      titleSimilarity: jaccardSimilarity(q, query.title)
    }));

    const highConfidenceDuplicate = scoredResolved.find(
      rq => rq.titleSimilarity >= EXACT_DUPLICATE_THRESHOLD && rq.acceptedAnswer
    );

    res.json({
      faqs,
      queries: openQueries,
      resolvedQueries: scoredResolved,
      highConfidenceDuplicate: highConfidenceDuplicate || null,
      isInScope
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
};

exports.getTagSuggestions = async (req, res) => {
  try {
    const { q = '' } = req.query;
    const prefix = q.toLowerCase().trim();

    const [queryTags, faqTags] = await Promise.all([
      Query.distinct('tags', prefix ? { tags: { $regex: `^${prefix}`, $options: 'i' } } : {}),
      FAQ.distinct('tags', prefix ? { tags: { $regex: `^${prefix}`, $options: 'i' } } : {})
    ]);

    const tagCounts = {};
    [...queryTags, ...faqTags].forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; });

    const suggestions = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    res.json({ suggestions });
  } catch (error) {
    console.error('Tag suggestions error:', error);
    res.status(500).json({ error: 'Failed to get tag suggestions' });
  }
};

exports.detectTags = async (req, res) => {
  try {
    const { text = '' } = req.query;
    if (!text || text.length < 10) return res.json({ detectedTags: [], confidence: [] });

    const scoreTags = require('./searchController').scoreTags || (async () => []);
    const extractKeywords = (text) => text
      .toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/)
      .filter(t => t.length > 2);

    const knownTags = new Set();
    const allFAQs = await FAQ.find({ status: 'resolved', deletedAt: null }).select('tags').lean();
    for (const f of allFAQs) { (f.tags || []).forEach(t => knownTags.add(t)); }

    if (!knownTags.size) {
      const kw = extractKeywords(text).slice(0, 3);
      return res.json({ detectedTags: kw, confidence: kw.map(t => ({ tag: t, score: 1 })) });
    }

    // Only suggest tags that already exist in the FAQ database
    const tokens = extractKeywords(text);
    const suggestions = tokens.filter(t => knownTags.has(t)).slice(0, 3);
    return res.json({ detectedTags: suggestions, confidence: suggestions.map(t => ({ tag: t, score: 1 })) });
  } catch (error) {
    console.error('Tag detection error:', error);
    res.status(500).json({ error: 'Failed to detect tags' });
  }
};

// Fallback: extract meaningful tokens from text as candidate tags
// when no tag vocabulary exists in the database yet
function extractKeywords(text) {
  const tokens = tokenize(text);
  const tf = {};
  for (const t of tokens) tf[t] = (tf[t] || 0) + 1;
  return Object.entries(tf)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([t]) => t);
}