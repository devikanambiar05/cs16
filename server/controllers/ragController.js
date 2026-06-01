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

// ─── Semantic Cache ──────────────────────────────────────────────────────────

const RAG_CACHE_CAP = 150; // light-weight process foot-print to avoid heavy memory consumption
const semanticCache = new Map(); // maps lowercased query string to { answer: string, sources: Array, faqsFound: number }
const MAX_CACHE_SIZE = RAG_CACHE_CAP;

// Simple Jaccard similarity between two token arrays
function jaccardSimilarity(tokensA, tokensB) {
  if (tokensA.length === 0 || tokensB.length === 0) return 0;
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  const union = new Set([...setA, ...setB]);
  let intersectionCount = 0;
  for (const item of setA) {
    if (setB.has(item)) intersectionCount++;
  }
  return intersectionCount / union.size;
}

// Find a matching response in cache using fast semantic overlap
function getSemanticCache(query) {
  const qTokens = tokenize(query);
  if (qTokens.length === 0) return null;
  
  // 1. Check exact string match (case-insensitive)
  const exactKey = query.toLowerCase().trim();
  if (semanticCache.has(exactKey)) {
    console.log(`[RAG Cache] Exact cache hit for query: "${query}"`);
    return semanticCache.get(exactKey);
  }

  // 2. Iterate cache keys to find high token overlap similarity (Jaccard similarity >= 0.85)
  for (const [cachedQuery, entry] of semanticCache.entries()) {
    const cachedTokens = tokenize(cachedQuery);
    const sim = jaccardSimilarity(qTokens, cachedTokens);
    if (sim >= 0.85) {
      console.log(`[RAG Cache] Semantic cache hit for: "${query}" (similarity: ${sim.toFixed(2)} with cached: "${cachedQuery}")`);
      return entry;
    }
  }
  return null;
}

function setSemanticCache(query, entry) {
  if (semanticCache.size >= MAX_CACHE_SIZE) {
    // Evict oldest item
    const firstKey = semanticCache.keys().next().value;
    semanticCache.delete(firstKey);
  }
  semanticCache.set(query.toLowerCase().trim(), entry);
}

// ─── Ollama availability check ───────────────────────────────────────────────

let ollamaAvailable = null; // null = unknown, true = available, false = unavailable

async function isOllamaAvailable() {
  if (ollamaAvailable !== null) return ollamaAvailable;
  const baseUrl = (process.env.OLLAMA_URL || 'http://localhost:11434').replace(/\/$/, '');
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); // 3 seconds timeout is plenty
    const res = await fetch(`${baseUrl}/api/tags`, { signal: controller.signal });
    clearTimeout(timeout);
    ollamaAvailable = res.ok;
  } catch {
    ollamaAvailable = false;
  }
  return ollamaAvailable;
}

// ─── Ollama validation (only called if Ollama is confirmed available) ──────────

async function validateAnswer(title, answer) {
  const baseUrl = (process.env.OLLAMA_URL || 'http://localhost:11434').replace(/\/$/, '');
  const model = process.env.OLLAMA_MODEL || 'llama3';
  const prompt = `Does the answer contain real information (not placeholder text)? Yes or No only.\nQuestion: ${title}\nAnswer: ${answer}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); 

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

// ─── Background Validation Sweeper ──────────────────────────────────────────

let isValidatingBackground = false;

async function triggerBackgroundValidation(pendingFaqs) {
  if (isValidatingBackground) return;
  isValidatingBackground = true;

  // Run in a fully asynchronous, non-blocking execution cycle
  setImmediate(async () => {
    try {
      const ollamaOk = await isOllamaAvailable();
      if (!ollamaOk) {
        isValidatingBackground = false;
        return;
      }

      console.log(`[RAG Background] Validating ${pendingFaqs.length} newly added or unvalidated FAQs...`);
      for (const faq of pendingFaqs) {
        try {
          const isValid = await validateAnswer(faq.title, faq.finalAnswer || '');
          await FAQ.updateOne(
            { _id: faq._id },
            { $set: { isValidated: isValid } }
          );
          console.log(`[RAG Background] FAQ "${faq.title}" validation outcome: ${isValid ? 'PASSED' : 'FAILED'}`);
        } catch (e) {
          console.warn(`[RAG Background] Validation error for FAQ ${faq._id}:`, e.message);
        }
        // Controlled spacing delay to avoid choking local Ollama instance
        await new Promise(r => setTimeout(r, 600));
      }

      // Clear the cache to rebuild the index including new validated statuses
      ragCache = null;
      console.log('[RAG Background] Completed sweep. Cleared in-memory index cache for dynamic rebuild.');
    } catch (err) {
      console.error('[RAG Background] Critical background validation failure:', err.message);
    } finally {
      isValidatingBackground = false;
    }
  });
}

// ─── RAG Index (in-memory, refreshed every 10 min) ──────────────────────────

const RAG_TTL_MS = 10 * 60 * 1000;
let ragCache = null;
let ragCacheAt = 0;

async function buildRagIndex() {
  if (ragCache && Date.now() - ragCacheAt < RAG_TTL_MS) return ragCache;

  // 1. Fetch resolved FAQs from database
  const faqs = await FAQ.find({
    status: 'resolved',
    deletedAt: null,
    finalAnswer: { $type: 'string', $ne: '' }
  }).select('title finalAnswer tags upvotes isValidated').lean();

  if (faqs.length === 0) {
    ragCache = { faqs: [], df: {}, N: 0 };
    ragCacheAt = Date.now();
    return ragCache;
  }

  // 2. Separate into validated list and unvalidated list for background validation
  const validatedFaqs = [];
  const pendingValidation = [];

  for (const faq of faqs) {
    if (faq.isValidated === true) {
      validatedFaqs.push(faq);
    } else if (faq.isValidated === false) {
      // Explicitly failed LLM placeholder validation — filter out to preserve quality!
    } else {
      // Legacy or fresh entries without a validation state
      // We include them instantly for full availability but queue them for background LLM check!
      validatedFaqs.push(faq);
      pendingValidation.push(faq);
    }
  }

  // 3. Fire the background worker in a non-blocking way
  if (pendingValidation.length > 0) {
    triggerBackgroundValidation(pendingValidation);
  }

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
      content: f.finalAnswer || '',
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

async function askOllamaStream(question, context, onChunk, externalSignal) {
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

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', () => {
        controller.abort();
      });
    }
  }

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
      const lines = buffer.split('\n');
      buffer = lines.pop(); 
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
  const abortController = new AbortController();

  // Gracefully handle client connection close/abort to terminate LLM streams instantly
  req.on('close', () => {
    if (!abortController.signal.aborted) {
      console.log('[RAG] Client request closed early. Aborting active Ollama generation fetch stream...');
      abortController.abort();
    }
  });

  try {
    const { question } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length < 3) {
      return res.status(400).json({ error: 'Question must be at least 3 characters' });
    }

    const q = question.trim();

    // ─────────────────────────────────────────────────────────────────────────
    // EXPERIMENT 2: Semantic Cache Check (Sub-millisecond Retrieval)
    // ─────────────────────────────────────────────────────────────────────────
    const cachedResponse = getSemanticCache(q);
    if (cachedResponse) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Transfer-Encoding', 'chunked');
      res.setHeader('X-Content-Type-Options', 'nosniff');

      // Send identical sources list instantly
      res.write(JSON.stringify({ sources: cachedResponse.sources, faqsFound: cachedResponse.faqsFound }) + '\n');

      // Stream cached content back in lightning-fast mock-typing chunks
      const words = cachedResponse.answer.split(/(\s+)/);
      for (const word of words) {
        if (!word) continue;
        res.write(JSON.stringify({ token: word }) + '\n');
        await new Promise(resolve => setTimeout(resolve, 3)); // 3ms interval is imperceptible
      }

      res.write(JSON.stringify({ done: true }) + '\n');
      res.end();
      return;
    }

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

    const sources = scored.map(f => ({
      _id: f._id,
      title: f.title,
      content: f.content,
      score: Math.round(f.score * 1000) / 1000
    }));

    // Increment viewCount on FAQs shown as sources
    const sourceIds = scored.map(f => f._id);
    if (sourceIds.length > 0) {
      FAQ.updateMany(
        { _id: { $in: sourceIds } },
        { $inc: { viewCount: 1 }, $set: { lastViewed: new Date() } }
      ).catch(err => console.warn('Failed to increment FAQ viewCount:', err.message));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EXPERIMENT 1: High-Confidence Short-Circuit Routing (Instantaneous Symbolic Shortcut)
    // ─────────────────────────────────────────────────────────────────────────
    let canShortCircuit = false;
    const topFaq = scored[0];

    if (topFaq && topFaq.score >= 3.0) { // Raised score threshold from 2.5 to 3.0
      // Calculate how many distinct query terms actually match the FAQ document
      const queryTermsInDoc = qTokens.filter(t => topFaq._tokens.includes(t)).length;
      
      if (qTokens.length === 1) {
        // Single term queries need a very high BM25 match score
        canShortCircuit = topFaq.score >= 3.5;
      } else if (qTokens.length >= 2) {
        // Multi-term queries require at least 2 distinct tokens to match to block single-word coincidences
        canShortCircuit = queryTermsInDoc >= 2;
      }
    }

    if (canShortCircuit && topFaq) {
      console.log(`[RAG Short-Circuit] Verified high-confidence match: "${topFaq.title}" (score: ${topFaq.score.toFixed(2)}, matching terms: ${qTokens.filter(t => topFaq._tokens.includes(t)).join(', ')})`);
      
      const responseText = `Here is the resolved FAQ response matching your query:\n\n**${topFaq.title}**\n${topFaq.content}\n\n`;

      // Save complete entry to Jaccard Semantic Cache
      setSemanticCache(q, {
        answer: responseText,
        sources,
        faqsFound: scored.length
      });

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Transfer-Encoding', 'chunked');
      res.setHeader('X-Content-Type-Options', 'nosniff');

      res.write(JSON.stringify({ sources, faqsFound: scored.length }) + '\n');

      const words = responseText.split(/(\s+)/);
      for (const word of words) {
        if (!word) continue;
        res.write(JSON.stringify({ token: word }) + '\n');
        await new Promise(resolve => setTimeout(resolve, 4)); // fast 4ms delay
      }

      res.write(JSON.stringify({ done: true }) + '\n');
      res.end();
      return;
    }

    // 2. Build context string from top FAQs
    const context = scored.length
      ? scored.map(f => `**${f.title}**\n${f.content}`).join('\n\n')
      : 'No relevant FAQs found for this question.';

    const ollamaOk = await isOllamaAvailable();
    if (!ollamaOk) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Transfer-Encoding', 'chunked');
      res.setHeader('X-Content-Type-Options', 'nosniff');

      res.write(JSON.stringify({ sources, faqsFound: scored.length }) + '\n');

      let responseText = '';
      if (scored.length > 0) {
        const topFaq = scored[0];
        responseText = `I searched Grantha resolved FAQs and found a highly relevant match for your query:\n\n**${topFaq.title}**\n${topFaq.content}\n\n`;
        if (scored.length > 1) {
          responseText += `You can also check out these related topics:\n`;
          scored.slice(1, 3).forEach(f => {
            responseText += `• **${f.title}**\n`;
          });
        }
      } else {
        responseText = `I searched Grantha FAQs but couldn't find a direct match. You can raise a new query in the community and a peer or mentor will answer it soon!`;
      }

      // ───────────────────────────────────────────────────────────────────────
      // EXPERIMENT 3: Dynamic Fallback Streaming (Ultra-responsive Mock Typing)
      // ───────────────────────────────────────────────────────────────────────
      const words = responseText.split(/(\s+)/);
      for (const word of words) {
        if (!word) continue;
        res.write(JSON.stringify({ token: word }) + '\n');
        await new Promise(resolve => setTimeout(resolve, 8)); // Accelerated 8ms simulated typing
      }

      res.write(JSON.stringify({ done: true }) + '\n');
      res.end();
      return;
    }

    // 3. Stream answer via Ollama
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    res.write(JSON.stringify({ sources, faqsFound: scored.length }) + '\n');

    let answerText = '';

    await askOllamaStream(q, context, (chunk) => {
      answerText += chunk;
      res.write(JSON.stringify({ token: chunk }) + '\n');
    }, abortController.signal);

    // Save newly generated LLM answer to Semantic Cache
    if (answerText.trim().length > 0) {
      setSemanticCache(q, {
        answer: answerText,
        sources,
        faqsFound: scored.length
      });
    }

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
