import { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';

const LOADING_PHASES = [
  "Anveshana (अन्वेषण) — Searching Granth knowledge base...",
  "Manana (मनन) — Reflecting on the context...",
  "Chintana (चिन्तन) — Formulating a response..."
];

export default function RAGChatWidget() {
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedSources, setExpandedSources] = useState(new Set());
  const [phaseIndex, setPhaseIndex] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const toggleSource = (sourceId) => {
    setExpandedSources(prev => {
      const next = new Set(prev);
      if (next.has(sourceId)) {
        next.delete(sourceId);
      } else {
        next.add(sourceId);
      }
      return next;
    });
  };

  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setPhaseIndex(prev => (prev + 1) % LOADING_PHASES.length);
      }, 1500);
    } else {
      setPhaseIndex(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (dialogOpen && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, dialogOpen]);

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    setError('');
    setDialogOpen(true);

    // Add user message immediately
    const assistantMsgId = Date.now();
    setMessages(prev => [
      ...prev,
      { id: assistantMsgId, role: 'user', text: userText },
      { id: assistantMsgId + 1, role: 'assistant', text: '', streaming: true, sources: [], faqsFound: 0 }
    ]);

    setLoading(true);

    try {
      const res = await fetch('/api/rag/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token') || ''
        },
        body: JSON.stringify({ question: userText })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Something went wrong');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let metaParsed = false;

      // Stream tokens as they arrive
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            if (!metaParsed) {
              // The first line contains the sources/metadata JSON
              const meta = JSON.parse(line.trim());
              setMessages(prev => prev.map(m =>
                m.id === assistantMsgId + 1
                  ? { ...m, sources: meta.sources || [], faqsFound: meta.faqsFound || 0 }
                  : m
              ));
              metaParsed = true;
            } else {
              // Subsequent lines are token, done or error chunks
              const chunk = JSON.parse(line.trim());
              if (chunk.token) {
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsgId + 1
                    ? { ...m, text: m.text + chunk.token }
                    : m
                ));
              }
              if (chunk.done) {
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsgId + 1 ? { ...m, streaming: false } : m
                ));
              }
              if (chunk.error) {
                throw new Error(chunk.error);
              }
            }
          } catch (e) {
            console.error('Error parsing stream chunk:', e);
            if (line.includes('"error"')) {
              try {
                const chunk = JSON.parse(line.trim());
                throw new Error(chunk.error);
              } catch {}
            }
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to get answer. Please try again.');
      // Remove the streaming assistant message on error
      setMessages(prev => prev.filter(m => m.id !== assistantMsgId + 1));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setError('');
  };

  const clearChat = () => {
    setMessages([]);
    setError('');
  };

  if (['/login', '/register', '/reset-password', '/verify-email', '/leaderboard', '/ask', '/profile'].includes(location.pathname)) {
    return null;
  }

  return (
    <>
      {/* ── Dialog Overlay ── */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={closeDialog}
          />

          {/* Dialog panel */}
          <div className="relative w-full max-w-lg mx-4 mb-2 rounded-2xl bg-white dark:bg-slate-900 border dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: '70vh' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">💬</span>
                <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">FAQ Assistant</h2>
                {messages.filter(m => m.role === 'assistant').length > 0 && (
                  <span className="text-xs text-slate-400 ml-1">
                    ({messages.filter(m => m.role === 'assistant').length} response{messages.filter(m => m.role === 'assistant').length !== 1 ? 's' : ''})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearChat}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Clear
                </button>
                <button
                  onClick={closeDialog}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {messages.length === 0 && !loading && (
                <div className="text-center py-8 text-slate-400 text-sm">
                  <p className="mb-1">👋 Ask me anything about the FAQ knowledge base.</p>
                  <p className="text-xs">I'll search existing FAQs to find you an answer.</p>
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary-600 text-white rounded-tr-sm'
                      : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100 rounded-tl-sm'
                  }`}>
                    {msg.streaming && !msg.text ? (
                      <div className="flex flex-col gap-1 py-0.5 pr-2 select-none">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2 w-2 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                          </span>
                          <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400 animate-pulse transition-all duration-300">
                            {LOADING_PHASES[phaseIndex]}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                        {msg.streaming && (
                          <span className="inline-block w-1.5 h-4 bg-slate-400 rounded animate-pulse ml-0.5 align-middle" />
                        )}
                      </>
                    )}

                    {msg.role === 'assistant' && !msg.streaming && msg.sources?.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                        <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Sources (Click to expand in-place):</p>
                        <div className="space-y-1.5">
                          {msg.sources.slice(0, 3).map(s => {
                            const isExpanded = expandedSources.has(s._id);
                            return (
                              <div key={s._id} className="rounded-xl border border-slate-200/40 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => toggleSource(s._id)}
                                  className="w-full flex items-center justify-between text-left px-3 py-2 text-[11px] font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 hover:bg-slate-200/40 dark:hover:bg-slate-800/40 transition-all gap-2"
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-primary-500 shrink-0">•</span>
                                    <span className="truncate">{s.title}</span>
                                  </div>
                                  <span className="shrink-0 text-slate-400 dark:text-slate-500 transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </span>
                                </button>
                                
                                {isExpanded && (
                                  <div className="px-3 pb-3 pt-1 border-t border-slate-200/35 dark:border-slate-800/50 bg-white dark:bg-slate-950/40">
                                    <p className="text-[12px] leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-wrap font-sans">
                                      {s.content || "No preview available. View details in Wiki."}
                                    </p>
                                    <div className="mt-2 flex justify-end">
                                      <Link
                                        to={`/wiki?highlight=${s._id}`}
                                        onClick={closeDialog}
                                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors uppercase tracking-wider"
                                      >
                                        Open in Wiki
                                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                      </Link>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {error && (
                <div className="flex justify-start">
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl rounded-tl-sm px-4 py-2 text-sm">
                    ⚠ {error}
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 px-5 py-4 bg-white dark:bg-slate-900">
              <form onSubmit={sendMessage} className="relative">
                <textarea
                  ref={inputRef}
                  className="w-full pl-4 pr-12 py-3 text-sm border border-slate-200 dark:border-slate-800 rounded-2xl resize-none
                             focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500
                             placeholder-slate-400 dark:placeholder-slate-500 bg-slate-50 dark:bg-slate-800/40 dark:text-slate-100"
                  placeholder="Ask about the FAQs..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  rows={1}
                  style={{ minHeight: '46px', maxHeight: '120px' }}
                  onInput={e => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                  }}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="absolute right-3.5 bottom-3 p-1.5 rounded-xl text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 disabled:opacity-30 disabled:hover:text-slate-400 transition-all"
                  title="Send"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Viewport bottom gradient mask for scroll-disappear effect */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 via-slate-50/80 to-transparent dark:from-[#0d1117] dark:via-[#0d1117]/80 pointer-events-none z-30" />

      {/* ── Launcher bar (always visible at bottom) ── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-4">
        <form onSubmit={sendMessage} className="relative">
          <input
            type="text"
            className="w-full pl-5 pr-12 py-3 text-sm border border-slate-200 dark:border-slate-800 rounded-2xl
                       focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500
                       placeholder-slate-400 dark:placeholder-slate-500 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md
                       shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)]
                       hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all dark:text-slate-100"
            placeholder="Ask the FAQ assistant..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          {loading ? (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-0.5 pointer-events-none">
              <span className="w-1 h-1 bg-primary-500 rounded-full animate-pulse-dot" />
              <span className="w-1 h-1 bg-primary-500 rounded-full animate-pulse-dot" style={{ animationDelay: '200ms' }} />
              <span className="w-1 h-1 bg-primary-500 rounded-full animate-pulse-dot" style={{ animationDelay: '400ms' }} />
            </div>
          ) : (
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-xl text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 disabled:opacity-30 disabled:hover:text-slate-400 transition-all"
              title="Send"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          )}
        </form>
      </div>
    </>
  );
}
