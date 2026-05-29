import { useState, useRef, useEffect } from 'react';

export default function RAGChatWidget() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

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

      // Read the metadata line first
      const firstLine = await reader.read();
      if (firstLine.value) {
        const meta = JSON.parse(decoder.decode(firstLine.value).trim());
        setMessages(prev => prev.map(m =>
          m.id === assistantMsgId + 1
            ? { ...m, sources: meta.sources || [], faqsFound: meta.faqsFound || 0 }
            : m
        ));
      }

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
          } catch { /* skip malformed */ }
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
          <div className="relative w-full max-w-lg mx-4 mb-2 rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: '70vh' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">💬</span>
                <h2 className="font-semibold text-slate-800 text-sm">FAQ Assistant</h2>
                {messages.filter(m => m.role === 'assistant').length > 0 && (
                  <span className="text-xs text-slate-400 ml-1">
                    ({messages.filter(m => m.role === 'assistant').length} response{messages.filter(m => m.role === 'assistant').length !== 1 ? 's' : ''})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearChat}
                  className="text-xs text-slate-400 hover:text-slate-600 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100"
                >
                  Clear
                </button>
                <button
                  onClick={closeDialog}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
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
                      : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    {msg.streaming && (
                      <span className="inline-block w-1.5 h-4 bg-slate-400 rounded animate-pulse ml-0.5 align-middle" />
                    )}

                    {msg.role === 'assistant' && !msg.streaming && msg.sources?.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200/50">
                        <p className="text-xs text-slate-400 mb-1 font-medium">Sources:</p>
                        <div className="space-y-0.5">
                          {msg.sources.slice(0, 3).map(s => (
                            <div key={s._id} className="flex items-start gap-1.5 text-xs text-slate-500">
                              <span className="text-primary-400 mt-0.5">•</span>
                              <span className="line-clamp-1">{s.title}</span>
                            </div>
                          ))}
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
            <div className="shrink-0 px-5 py-3 border-t border-slate-100 bg-white">
              <form onSubmit={sendMessage} className="relative">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    className="flex-1 px-4 py-2.5 pr-12 text-sm border border-slate-300 rounded-2xl resize-none
                               focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                               placeholder-slate-400 bg-slate-50"
                    placeholder="Ask about the FAQs..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    rows={1}
                    style={{ minHeight: '44px', maxHeight: '100px' }}
                    onInput={e => {
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="bg-primary-600 text-white px-4 py-2.5 rounded-2xl text-sm font-medium
                               hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Launcher bar (always visible at bottom) ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        <div className="max-w-lg mx-auto px-4 py-2.5">
          <form onSubmit={sendMessage} className="relative">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  className="w-full px-4 py-2.5 pr-10 text-sm border border-slate-300 rounded-full
                             focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                             placeholder-slate-400 bg-slate-50 shadow-sm"
                  placeholder="Ask the FAQ assistant..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="bg-primary-600 text-white p-2 rounded-full
                           hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
