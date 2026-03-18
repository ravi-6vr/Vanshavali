import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const timerRef = useRef(null);

  // Open with Ctrl+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  // Debounced search
  const search = useCallback((q) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!q.trim()) { setResults([]); setLoading(false); return; }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data.results || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedIndex(0);
    search(val);
  };

  const handleSelect = (item) => {
    setOpen(false);
    if (item.type === 'member') navigate(`/members/${item.id}`);
    else if (item.type === 'story') navigate('/stories');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-white rounded-xl shadow-2xl border border-stone-200 overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-100">
          <svg className="w-5 h-5 text-stone-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Search members, stories..."
            className="flex-1 text-sm bg-transparent outline-none text-stone-800 placeholder-stone-400"
          />
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono bg-stone-100 text-stone-500 rounded border border-stone-200">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {loading && (
            <div className="px-4 py-6 text-center">
              <div className="w-5 h-5 border-2 border-saffron-200 border-t-saffron-600 rounded-full animate-spin mx-auto" />
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-stone-400 text-sm">No results for "{query}"</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="py-1">
              {results.map((item, i) => (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleSelect(item)}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-3 text-sm transition-colors ${
                    i === selectedIndex ? 'bg-saffron-50 text-saffron-700' : 'text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <span className="flex-shrink-0 text-base">
                    {item.type === 'member' ? '👤' : '📖'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{item.name}</p>
                    {item.detail && <p className="text-xs text-stone-400 truncate">{item.detail}</p>}
                  </div>
                  <span className="badge bg-stone-100 text-stone-500 text-[10px]">{item.type}</span>
                </button>
              ))}
            </div>
          )}

          {!loading && !query && (
            <div className="px-4 py-6 text-center">
              <p className="text-stone-400 text-sm">Type to search across members and stories</p>
              <p className="text-stone-300 text-xs mt-1">Use arrow keys to navigate, Enter to select</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
