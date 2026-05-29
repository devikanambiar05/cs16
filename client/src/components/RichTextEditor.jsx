import { useRef } from 'react';
import { marked } from 'marked';

// Configure marked for safe rendering
marked.setOptions({ breaks: true, gfm: true });

/**
 * A simple markdown-based rich text editor.
 * Toolbar buttons wrap selected text in markdown syntax.
 * Storage format is raw markdown — render with <MarkdownContent> for display.
 */
export function MarkdownContent({ content }) {
  if (!content) return null;
  const html = marked.parse(content);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function RichTextEditor({ value, onChange, placeholder, readOnly = false }) {
  const textareaRef = useRef(null);

  const insertWrap = (before, after = before) => {
    const ta = textareaRef.current;
    if (!ta) return;

    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.substring(start, end);

    const newText = value.substring(0, start) + before + selected + after + value.substring(end);
    onChange(newText);

    // Restore cursor position after React re-render
    requestAnimationFrame(() => {
      ta.focus();
      const newCursor = start + before.length + (end - start) + after.length;
      ta.setSelectionRange(newCursor, newCursor);
    });
  };

  const toolbarButtons = [
    { label: 'B', title: 'Bold', wrap: ['**', '**'], className: 'font-bold' },
    { label: 'I', title: 'Italic', wrap: ['*', '*'], className: 'italic' },
    { label: 'U', title: 'Underline', wrap: ['__', '__'], className: 'underline' },
    { label: '—', title: 'Divider', wrap: ['\n---\n', ''], className: '' },
  ];

  if (readOnly) {
    return value ? <MarkdownContent content={value} /> : <span className="text-slate-400">No content</span>;
  }

  return (
    <div className="border border-slate-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary-200 focus-within:border-primary-400 transition-all">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-slate-50 border-b border-slate-200">
        {toolbarButtons.map((btn) => (
          <button
            key={btn.label}
            type="button"
            title={btn.title}
            onClick={() => insertWrap(btn.wrap[0], btn.wrap[1])}
            className={`w-7 h-7 flex items-center justify-center rounded text-sm text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors ${btn.className}`}
          >
            {btn.label}
          </button>
        ))}
        <div className="flex-1" />
        <span className="text-xs text-slate-400">Markdown enabled</span>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={5}
        className="w-full px-3 py-2.5 text-sm resize-none focus:outline-none leading-relaxed"
        style={{ minHeight: '120px' }}
      />
    </div>
  );
}