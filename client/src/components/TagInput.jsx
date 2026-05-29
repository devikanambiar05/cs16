import { useState, useEffect, useRef } from 'react';

const PRESET_SUGGESTIONS = [
  'fees', 'admission', 'exams', 'hostel', 'scholarship',
  'documents', 'courses', 'placement', 'library', 'transport'
];

export default function TagInput({ tags, onChange, maxTags = 3 }) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchTimer = useRef(null);

  // Fetch autocomplete suggestions from server as user types
  useEffect(() => {
    clearTimeout(searchTimer.current);

    if (!input.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search/tags?q=${encodeURIComponent(input.trim())}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } }
        );
        if (!res.ok) throw new Error();
        const data = await res.json();
        const available = (data.suggestions || [])
          .map(s => s.tag)
          .filter(t => !tags.includes(t));
        setSuggestions(available.slice(0, 6));
        setShowDropdown(available.length > 0);
        setHighlighted(-1);
      } catch {
        const filtered = PRESET_SUGGESTIONS.filter(
          t => t.startsWith(input.toLowerCase()) && !tags.includes(t)
        );
        setSuggestions(filtered);
        setShowDropdown(filtered.length > 0);
      }
    }, 200);

    return () => clearTimeout(searchTimer.current);
  }, [input, tags]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        inputRef.current && !inputRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const addTag = (tag) => {
    const clean = tag.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (clean && !tags.includes(clean) && tags.length < maxTags) {
      onChange([...tags, clean]);
    }
    setInput('');
    setSuggestions([]);
    setShowDropdown(false);
  };

  const removeTag = (tag) => onChange(tags.filter(t => t !== tag));

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',' || e.key === ' ') && input.trim()) {
      e.preventDefault();
      addTag(highlighted >= 0 && suggestions[highlighted] ? suggestions[highlighted] : input);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted(h => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted(h => Math.max(h - 1, -1));
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const atMax = tags.length >= maxTags;

  return (
    <div className="relative">
      {/* Tag chips + input */}
      <div className={`flex flex-wrap gap-2 px-3 py-2.5 border rounded-lg bg-white dark:bg-slate-800 min-h-[44px] transition-colors
        ${atMax ? 'border-slate-200 dark:border-slate-700' : 'border-slate-300 dark:border-slate-600 focus-within:border-primary-400 dark:focus-within:border-primary-500'}`}>
        {tags.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-700 text-xs px-2.5 py-1 rounded-full"
          >
            #{tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-primary-400 hover:text-primary-700 dark:hover:text-primary-200 leading-none ml-0.5 font-bold"
              aria-label={`Remove tag ${tag}`}
            >
              ×
            </button>
          </span>
        ))}

        {!atMax && (
          <input
            ref={inputRef}
            type="text"
            className="flex-1 min-w-[100px] text-sm border-none outline-none bg-transparent text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            placeholder={tags.length === 0 ? 'fees, admission…' : 'Add tag…'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
          />
        )}

        {atMax && (
          <span className="text-xs text-slate-400 dark:text-slate-500 self-center ml-1">
            max {maxTags} tags
          </span>
        )}
      </div>

      {/* Autocomplete dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden"
        >
          <ul className="max-h-40 overflow-y-auto py-1">
            {suggestions.map((tag, i) => (
              <li key={tag}>
                <button
                  type="button"
                  className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors
                    ${i === highlighted
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                  onMouseDown={e => { e.preventDefault(); addTag(tag); }}
                >
                  <span className="text-slate-400 dark:text-slate-500">#</span>
                  {tag}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Hint */}
      {!atMax && (
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Enter, comma or space to add · Backspace removes last
        </p>
      )}

      {/* Quick-add presets — only when no tags yet */}
      {tags.length === 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {PRESET_SUGGESTIONS.slice(0, 8).map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => addTag(tag)}
              className="text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
