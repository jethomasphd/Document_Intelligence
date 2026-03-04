import { useState, useMemo, useRef, useEffect } from 'react';
import useStore from '../../store';

export default function SearchBar({ corpus }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const setSelectedPoint = useStore((s) => s.setSelectedPoint);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const results = useMemo(() => {
    if (!query.trim() || !corpus) return [];
    const q = query.toLowerCase();
    return corpus.documents
      .filter(
        (d) =>
          (d.title && d.title.toLowerCase().includes(q)) ||
          (d.content && d.content.toLowerCase().includes(q))
      )
      .slice(0, 10);
  }, [query, corpus]);

  return (
    <div className="relative" ref={wrapperRef}>
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search documents..."
        className="bg-bg-raised border border-border-line rounded px-3 py-1.5 text-sm text-text-primary w-64 placeholder:text-text-muted"
      />
      {open && results.length > 0 && (
        <div className="absolute top-full right-0 mt-1 w-80 bg-bg-surface border border-border-line rounded-lg shadow-lg z-50 max-h-72 overflow-y-auto">
          {results.map((doc) => (
            <button
              key={doc.id}
              onClick={() => {
                setSelectedPoint(doc);
                setQuery('');
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-bg-raised transition-colors border-b border-border-line last:border-0"
            >
              <div className="text-text-primary text-sm truncate">{doc.title || doc.id}</div>
              <div className="text-text-muted text-xs truncate">{doc.content?.slice(0, 80)}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
