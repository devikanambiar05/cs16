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

// BM25 scoring
function bm25Score(queryTokens, docTokens, docLength, avgDL, df, idf, N, k1 = 1.5, b = 0.75) {
  const docTf = {};
  for (const t of docTokens) docTf[t] = (docTf[t] || 0) + 1;

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
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  if (scored.length === 0) return [];

  // Normalise scores relative to the top result.
  // Only return FAQs that score at least 25% of the best match — this filters
  // out low-relevance results for unrelated queries like "who was the first president".
  const topScore = scored[0].score;
  const MIN_RELATIVE_SCORE = 0.25;

  // Also require a minimum absolute BM25 score so that a corpus with very few
  // documents doesn't inflate all scores artificially.
  const MIN_ABSOLUTE_SCORE = 1.0;

  return scored
    .filter(f => f.score >= MIN_ABSOLUTE_SCORE && f.score / topScore >= MIN_RELATIVE_SCORE)
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
      return res.json({ faqs: [], queries: [], resolvedQueries: [], highConfidenceDuplicate: null });
    }

    // FAQs — BM25 (handles short queries, zero-IDF edge cases)
    const faqs = await scoreFaqsAgainstQuery(q, 5);

    // Queries — keyword + regex (fast, sufficient)
    const allQueries = await Query.find({
      $or: [
        { tags: { $in: tokenize(q) } },
        { title: { $regex: q, $options: 'i' } }
      ]
    })
      .select('_id title status answerCount tags upvotes')
      .limit(10)
      .lean();

    const resolvedQueries = [];
    const openQueries = [];

    for (const query of allQueries) {
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
      highConfidenceDuplicate: highConfidenceDuplicate || null
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
    const { title = '', description = '' } = req.query;
    const text = `${title} ${description}`.trim();
    if (!text || text.length < 10) return res.json({ detectedTags: [], confidence: [] });

    const { knownTags, idf } = await buildIDFCache();

    if (!knownTags || knownTags.size === 0) {
      const fallback = extractKeywords(text).slice(0, 3);
      return res.json({ detectedTags: fallback, confidence: fallback.map(t => ({ tag: t, score: 1 })) });
    }

    // Score and cap at 3 tags. Only include tags with a meaningful score
    // (score > 0.05) so that unrelated text doesn't produce noise tags.
    const scored = scoreTags(text, knownTags, idf, 10);
    const MIN_TAG_SCORE = 0.05;
    const filtered = scored.filter(s => s.score >= MIN_TAG_SCORE).slice(0, 3);

    res.json({ detectedTags: filtered.map(s => s.tag), confidence: filtered });
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