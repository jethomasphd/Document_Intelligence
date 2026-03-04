import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store';
import { knn } from '../../lib/knn';
import { summarize } from '../../lib/api';
import { exportNeighborsCSV } from '../../lib/export';

export default function PointInspector({ corpus }) {
  const navigate = useNavigate();
  const selectedPoint = useStore((s) => s.selectedPoint);
  const setSelectedPoint = useStore((s) => s.setSelectedPoint);
  const clearSelectedPoint = useStore((s) => s.clearSelectedPoint);
  const [summary, setSummary] = useState(null);
  const [summarizing, setSummarizing] = useState(false);
  const [filterCategory, setFilterCategory] = useState(null);

  const neighbors = useMemo(() => {
    if (!selectedPoint || !corpus) return [];
    return knn(selectedPoint.embedding, corpus.documents, 15, filterCategory);
  }, [selectedPoint, corpus, filterCategory]);

  if (!selectedPoint) return null;

  const handleSummarize = async () => {
    setSummarizing(true);
    setSummary(null);
    try {
      const resp = await summarize({
        content: selectedPoint.content,
        context: corpus.domain,
      });
      setSummary(resp.summary);
    } catch (e) {
      setSummary('Error: ' + e.message);
    }
    setSummarizing(false);
  };

  const categories = [...new Set(corpus.documents.map((d) => d.category).filter(Boolean))];

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-text-primary font-medium">Document Inspector</h3>
        <button
          onClick={clearSelectedPoint}
          className="text-text-muted hover:text-text-primary text-sm"
        >
          Close
        </button>
      </div>

      {/* Document details */}
      <div className="mb-4">
        <h4 className="text-accent-cyan font-mono text-sm mb-1">{selectedPoint.title || selectedPoint.id}</h4>
        {selectedPoint.category && (
          <span className="inline-block bg-bg-raised border border-border-line text-text-muted text-xs px-2 py-0.5 rounded mb-2">
            {selectedPoint.category}
          </span>
        )}
        <div className="text-text-primary text-sm max-h-40 overflow-y-auto bg-bg-raised rounded p-3 mt-2">
          {selectedPoint.content}
        </div>
      </div>

      {/* Summarize button */}
      <button
        onClick={handleSummarize}
        disabled={summarizing}
        className="w-full bg-accent-gold text-bg-primary py-1.5 rounded text-sm font-medium mb-3 disabled:opacity-40 hover:opacity-90 transition-opacity"
      >
        {summarizing ? 'Summarizing...' : 'Summarize'}
      </button>

      {summary && (
        <div className="bg-bg-raised border border-accent-gold/30 rounded p-3 mb-4 text-sm text-text-primary">
          {summary}
        </div>
      )}

      {/* Neighbors */}
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-text-primary text-sm font-medium">Nearest Neighbors</h4>
        <button
          onClick={() => exportNeighborsCSV(neighbors, selectedPoint.title || selectedPoint.id)}
          className="text-text-muted text-xs hover:text-accent-cyan"
        >
          Export CSV
        </button>
      </div>

      {/* Category filter */}
      {categories.length > 1 && (
        <div className="mb-3">
          <select
            value={filterCategory || ''}
            onChange={(e) => setFilterCategory(e.target.value || null)}
            className="w-full bg-bg-raised border border-border-line rounded px-2 py-1 text-sm text-text-primary"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-1">
        {neighbors.map((n, i) => (
          <button
            key={n.id}
            onClick={() => setSelectedPoint(n)}
            className="w-full text-left px-3 py-2 rounded hover:bg-bg-raised transition-colors group"
          >
            <div className="flex items-center justify-between">
              <span className="text-text-primary text-sm truncate group-hover:text-accent-cyan">
                {n.title || n.id}
              </span>
              <span className="text-text-muted text-xs font-mono ml-2 shrink-0">
                {n.similarity.toFixed(3)}
              </span>
            </div>
            {n.category && (
              <span className="text-text-muted text-xs">{n.category}</span>
            )}
          </button>
        ))}
      </div>

      {/* Generate button */}
      <button
        onClick={() => navigate(`/corpus/${corpus.id}/generate`)}
        className="w-full mt-4 border border-accent-cyan text-accent-cyan py-1.5 rounded text-sm font-medium hover:bg-accent-cyan/10 transition-colors"
      >
        Generate from this neighborhood
      </button>
    </div>
  );
}
