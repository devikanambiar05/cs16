const FAQ = require('../models/FAQ');

// ─── Tokenizer (same as searchController — not exported, so copied here) ──────

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

// ─── BM25 parameters ─────────────────────────────────────────────────────────

const K1 = 1.5;
const B = 0.75;

function rsjIdf(df, N) {
  return Math.log((N - df + 0.5) / (df + 0.5) + 1);
}

function bm25Score(queryTokens, docTokens, docLen, avgDL, df, N) {
  const docTf = {};
  for (const t of docTokens) docTf[t] = (docTf[t] || 0) + 1;
  let score = 0;
  for (const term of queryTokens) {
    const termDf = df[term] || 0;
    if (termDf === 0) continue;
    const wIdf = rsjIdf(termDf, N);
    const tf = docTf[term] || 0;
    const numerator = tf * (K1 + 1);
    const denominator = tf + K1 * (1 - B + B * (docLen / avgDL));
    score += wIdf * (numerator / denominator);
  }
  return score;
}



// ─── Ollama validation (only called if pre-check passes) ───────────────────

async function validateAnswer(title, answer) {
  const baseUrl = (process.env.OLLAMA_URL || 'http://localhost:11434').replace(/\/$/, '');
  const model = process.env.OLLAMA_MODEL || 'llama3';
  const prompt = `Does the answer contain real information (not placeholder text)? Yes or No only.\nQuestion: ${title}\nAnswer: ${answer}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: false }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!response.ok) return false;
    const data = await response.json();
    const r = (data.response || '').toLowerCase().trim();
    return r === 'yes' || r === 'yes.';
  } catch {
    clearTimeout(timeout);
    return false;
  }
}

// ─── RAG Index (in-memory, refreshed every 10 min) ──────────────────────────

const RAG_TTL_MS = 10 * 60 * 1000;
let ragCache = null;
let ragCacheAt = 0;

async function buildRagIndex() {
  if (ragCache && Date.now() - ragCacheAt < RAG_TTL_MS) return ragCache;

  // Only include FAQs with a valid string finalAnswer — some legacy docs may have malformed data
  const faqs = await FAQ.find({
    status: 'resolved',
    deletedAt: null,
    finalAnswer: { $type: 'string', $ne: '' }
  }).select('title finalAnswer tags upvotes').lean();

  if (faqs.length === 0) {
    ragCache = { faqs: [], df: {}, N: 0 };
    ragCacheAt = Date.now();
    return ragCache;
  }

  // Validate FAQs with controlled concurrency to avoid Ollama overload
  const CONCURRENCY = 8;
  const results = [];
  for (let i = 0; i < faqs.length; i += CONCURRENCY) {
    const batch = faqs.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(f => validateAnswer(f.title, f.finalAnswer || '').catch(() => false))
    );
    results.push(...batchResults);
    // Small delay between batches to let Ollama breathe
    if (i + CONCURRENCY < faqs.length) await new Promise(r => setTimeout(r, 200));
  }
  const validatedFaqs = faqs.filter((_, i) => results[i]);
  console.log('RAG validation: passed=' + validatedFaqs.length + ' of ' + faqs.length);

  if (validatedFaqs.length === 0) {
    ragCache = { faqs: [], df: {}, N: 0 };
    ragCacheAt = Date.now();
    return ragCache;
  }

  // Document frequency across validated FAQ corpus
  const df = {};
  for (const faq of validatedFaqs) {
    const text = `${faq.title} ${faq.finalAnswer || ''}`.toLowerCase();
    for (const term of new Set(tokenize(text))) {
      df[term] = (df[term] || 0) + 1;
    }
  }

  ragCache = {
    faqs: validatedFaqs.map(f => ({
      _id: f._id,
      title: f.title,
      content: (f.finalAnswer || '').substring(0, 600),
      tags: f.tags,
      upvotes: f.upvotes,
      _tokens: tokenize(`${f.title} ${f.finalAnswer || ''}`),
      _docLen: tokenize(`${f.title} ${f.finalAnswer || ''}`).length
    })),
    df,
    N: validatedFaqs.length
  };
  ragCacheAt = Date.now();
  return ragCache;
}

// ─── Ollama streaming call ───────────────────────────────────────────────────

async function askOllamaStream(question, context, onChunk) {
  const baseUrl = (process.env.OLLAMA_URL || 'http://localhost:11434').replace(/\/$/, '');
  const model = process.env.OLLAMA_MODEL || 'llama3';

  const prompt = `You are a helpful university FAQ assistant. Answer the user's question based ONLY on the provided FAQ context. If the context doesn't contain a sufficient answer, say you couldn't find a clear answer and suggest the user ask the community.

CONTEXT:
${context}

QUESTION: ${question}

INSTRUCTIONS:
- Answer based strictly on the context provided above
- Be concise and helpful (2-4 sentences normally)
- If the context doesn't have a clear answer, say so honestly
- Do NOT make up information
- Format your response with bullet points if it helps

ANSWER (only reference FAQ titles, never say "FAQ 1", "FAQ 2", etc.):`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: true }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Ollama error ${response.status}: ${err}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      // Each Ollama streaming line: {"response":"chunk text..."}
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep incomplete last line in buffer
      for (const line of lines) {
        if (!line.trim() || !line.startsWith('{')) continue;
        try {
          const chunk = JSON.parse(line);
          if (chunk.response) onChunk(chunk.response);
        } catch { /* skip malformed lines */ }
      }
    }
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') throw new Error('Request timed out. Please try again.');
    throw err;
  }
}

// ─── Route handler ───────────────────────────────────────────────────────────

exports.buildRagIndex = buildRagIndex;

exports.ragChat = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length < 3) {
      return res.status(400).json({ error: 'Question must be at least 3 characters' });
    }

    const q = question.trim();

    // 1. Retrieve top-k relevant FAQs using BM25
    const { faqs, df, N } = await buildRagIndex();

    if (faqs.length === 0) {
      return res.json({
        answer: "There are no FAQs in the system yet. Be the first to ask!",
        sources: [],
        faqsFound: 0
      });
    }

    const qTokens = tokenize(q);
    const avgDL = faqs.reduce((s, f) => s + f._docLen, 0) / faqs.length;

    const scored = faqs
      .map(faq => ({ ...faq, score: bm25Score(qTokens, faq._tokens, faq._docLen, avgDL, df, N) }))
      .filter(f => f.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const sources = scored.map(f => ({ _id: f._id, title: f.title, score: Math.round(f.score * 1000) / 1000 }));

    // 3. Track views — increment viewCount on FAQs that were shown to the user
    const sourceIds = scored.map(f => f._id);
    if (sourceIds.length > 0) {
      FAQ.updateMany(
        { _id: { $in: sourceIds } },
        { $inc: { viewCount: 1 }, $set: { lastViewed: new Date() } }
      ).catch(err => console.warn('Failed to increment FAQ viewCount:', err.message));
    }

    // 2. Build context string from top FAQs
    const context = scored.length
      ? scored.map(f => `**${f.title}**\n${f.content}`).join('\n\n')
      : 'No relevant FAQs found for this question.';

    // 3. Stream answer via Ollama
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Send the JSON frame header immediately
    res.write(JSON.stringify({ sources, faqsFound: scored.length }) + '\n');

    let answerText = '';

    await askOllamaStream(q, context, (chunk) => {
      answerText += chunk;
      // Stream each token chunk as a JSON line
      res.write(JSON.stringify({ token: chunk }) + '\n');
    });

    // Signal completion
    res.write(JSON.stringify({ done: true }) + '\n');
    res.end();
  } catch (error) {
    console.error('RAG chat error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate answer', message: error.message });
    } else {
      res.write(JSON.stringify({ error: error.message }) + '\n');
      res.end();
    }
  }
};
