require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const FAQ = require('./models/FAQ.js');
  const baseUrl = 'http://127.0.0.1:11434';
  const isLikelyPlaceholder = (title, answer) => {
    const a = (answer||'').trim();
    if (a.length < 3) return true;
    if (a.endsWith('?')) return true;
    const aWords = a.toLowerCase().split(/\s+/).filter(w=>w.length>3);
    const qWords = title.toLowerCase().split(/\s+/).filter(w=>w.length>3);
    const overlap = aWords.filter(w=>qWords.includes(w));
    return overlap.length >= 3;
  };
  const faqs = await FAQ.find({status:'resolved', deletedAt:null}).select('title finalAnswer').lean();
  console.log('Total resolved FAQs in DB:', faqs.length);
  let passed = 0, placeholderFail = 0, llmFail = 0;
  for (const f of faqs) {
    const a = f.finalAnswer||'';
    if (isLikelyPlaceholder(f.title, a)) { placeholderFail++; continue; }
    const prompt = 'Does the answer contain real information (not placeholder text)? Yes or No only.\nQuestion: '+f.title+'\nAnswer: '+a;
    try {
      const r = await fetch(baseUrl+'/api/generate', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'llama3',prompt,stream:false})});
      const d = await r.json();
      const ok = d.response.trim().toLowerCase() === 'yes';
      if (ok) passed++; else { llmFail++; if (llmFail <= 5) console.log('LLM_FAIL:', f.title, '->', a.substring(0,80)); }
    } catch(e) { placeholderFail++; }
  }
  console.log('RESULT: passed='+passed+' placeholderFail='+placeholderFail+' llmFail='+llmFail+' total='+faqs.length);
  mongoose.disconnect();
}).catch(e=>console.error(e.message));