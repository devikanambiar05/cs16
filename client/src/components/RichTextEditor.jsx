import { useRef, useState } from 'react';
import { marked } from 'marked';
import { uploadImage } from '../services/api';

marked.setOptions({ breaks: true, gfm: true });

export function MarkdownContent({ content }) {
  if (!content) return null;
  const html = marked.parse(content);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function RichTextEditor({ value, onChange, placeholder, readOnly = false }) {
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const insertWrap = (before, after = before) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.substring(start, end);
    const newText = value.substring(0, start) + before + selected + after + value.substring(end);
    onChange(newText);
    requestAnimationFrame(() => {
      ta.focus();
      const newCursor = start + before.length + (end - start) + after.length;
      ta.setSelectionRange(newCursor, newCursor);
    });
  };

  const insertAtCursor = (text) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newText = value.substring(0, start) + text + value.substring(end);
    onChange(newText);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + text.length, start + text.length);
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadImage(file);
      const url = res.data.url;
      insertAtCursor(`\n![${file.name}](${url})\n`);
    } catch (err) {
      console.error('Image upload failed:', err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const toolbarButtons = [
    { label: 'B', title: 'Bold', wrap: ['**', '**'], className: 'font-bold' },
    { label: 'I', title: 'Italic', wrap: ['*', '*'], className: 'italic' },
    { label: 'U', title: 'Underline', wrap: ['<u>', '</u>'], className: 'underline' },
    { label: '—', title: 'Divider', wrap: ['\n---\n', ''], className: '' },
  ];

  if (readOnly) {
    return value ? <MarkdownContent content={value} /> : <span className="text-slate-400">No content</span>;
  }

  return (
    <div className="border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary-200 focus-within:border-primary-400 transition-all">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-600">
        {toolbarButtons.map((btn) => (
          <button
            key={btn.label}
            type="button"
            title={btn.title}
            onClick={() => insertWrap(btn.wrap[0], btn.wrap[1])}
            className={`w-7 h-7 flex items-center justify-center rounded text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200 transition-colors ${btn.className}`}
          >
            {btn.label}
          </button>
        ))}

        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* Image upload button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleImageUpload}
        />
        <button
          type="button"
          title="Add image"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={`w-7 h-7 flex items-center justify-center rounded text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {uploading ? '…' : '📷'}
        </button>

        <div className="flex-1" />
        <span className="text-xs text-slate-400 dark:text-slate-500">Markdown enabled</span>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={5-20}
        className="w-full px-3 py-2.5 text-sm resize-none focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 leading-relaxed"
        style={{ minHeight: '120px' }}
      />
    </div>
  );
}
