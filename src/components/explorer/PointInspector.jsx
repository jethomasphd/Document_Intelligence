import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store';
import { knn } from '../../lib/knn';
import { summarize } from '../../lib/api';
import { exportNeighborsCSV } from '../../lib/export';
import InfoHint from '../ui/InfoHint';

function SimilarityBadge({ sim }) {
  let color, label;
  if (sim >= 0.8) { color = 'bg-success/20 text-success border-success/30'; label = 'Very Similar'; }
  else if (sim >= 0.6) { color = 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/30'; label = 'Related'; }
  else if (sim >= 0.4) { color = 'bg-warning/10 text-warning border-warning/30'; label = 'Loosely Related'; }
  else { color = 'bg-error/10 text-error border-error/30'; label = 'Distant'; }

  return (
    <span
      className={`text-[10px] px-1.5 py-0.5 rounded border ${color}`}
      title={`Cosine similarity: ${sim.toFixed(4)}. ${label} documents share semantic characteristics.`}
    >
      {sim.toFixed(3)}
    </span>
  );
}

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

      {/* Actions with explanations */}
      <div className="space-y-2 mb-4">
        <button
          onClick={handleSummarize}
          disabled={summarizing}
          className="w-full bg-accent-gold text-bg-primary py-1.5 rounded text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          {summarizing ? 'Summarizing...' : 'AI Summary'}
        </button>
        <p className="text-text-muted text-[10px] leading-tight">
          Claude reads this document and produces a concise summary highlighting key themes and distinguishing characteristics.
        </p>
      </div>

      {summary && (
        <div className="bg-bg-raised border border-accent-gold/30 rounded p-3 mb-4 text-sm text-text-primary">
          {summary}
        </div>
      )}

      {/* Neighbors section */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-text-primary text-sm font-medium">
            Nearest Neighbors
            <InfoHint
              text="The 15 documents most semantically similar to this one, measured by cosine similarity. High similarity (>0.8) means the documents share strong thematic overlap. Click any neighbor to navigate to it and see its own neighborhood."
              position="left"
            />
          </h4>
          <button
            onClick={() => exportNeighborsCSV(neighbors, selectedPoint.title || selectedPoint.id)}
            className="text-text-muted text-xs hover:text-accent-cyan"
          >
            Export CSV
          </button>
        </div>
        <p className="text-text-muted text-[10px] mb-2">
          Sorted by cosine similarity. Click to navigate. Color-coded scores indicate semantic closeness.
        </p>
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
          <p className="text-text-muted text-[10px] mt-1">
            Filter neighbors by category to see which documents from a specific population are closest.
          </p>
        </div>
      )}

      <div className="space-y-1">
        {neighbors.map((n) => (
          <button
            key={n.id}
            onClick={() => {
              setSummary(null);
              setSelectedPoint(n);
            }}
            className="w-full text-left px-3 py-2 rounded hover:bg-bg-raised transition-colors group"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-text-primary text-sm truncate group-hover:text-accent-cyan">
                {n.title || n.id}
              </span>
              <SimilarityBadge sim={n.similarity} />
            </div>
            {n.category && (
              <span className="text-text-muted text-xs">{n.category}</span>
            )}
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="mt-4 space-y-2">
        <button
          onClick={() => navigate(`/corpus/${corpus.id}/generate`)}
          className="w-full border border-accent-cyan text-accent-cyan py-1.5 rounded text-sm font-medium hover:bg-accent-cyan/10 transition-colors"
        >
          Generate from this neighborhood
        </button>
        <p className="text-text-muted text-[10px] leading-tight">
          Opens the Generator with this document's neighborhood pre-selected as the target zone.
          Claude will create new documents designed to fit semantically near this one.
        </p>
      </div>
    </div>
  );
}
