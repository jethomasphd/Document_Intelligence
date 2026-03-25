import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import useStore from '../store';
import { getCorpus } from '../lib/storage';
import { exportCorpusJSON } from '../lib/export';
import SemanticMap from '../components/explorer/SemanticMap';
import PointInspector from '../components/explorer/PointInspector';
import SearchBar from '../components/explorer/SearchBar';
import Tooltip from '../components/ui/Tooltip';

export default function Explorer() {
  const { id } = useParams();
  const [corpus, setCorpus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showHints, setShowHints] = useState(true);
  const selectedPoint = useStore((s) => s.selectedPoint);

  useEffect(() => {
    getCorpus(id).then((c) => {
      setCorpus(c);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-text-muted">Loading corpus...</div>
      </div>
    );
  }

  if (!corpus) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-error">Corpus not found</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-57px)] flex flex-col">
      <div className="px-6 py-3 border-b border-border-line bg-bg-surface flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">{corpus.name}</h1>
          <p className="text-xs text-text-muted font-mono">{corpus.documents.length} documents | {corpus.categories?.length || 0} categories</p>
        </div>
        <div className="flex items-center gap-3">
          <SearchBar corpus={corpus} />
          <Tooltip text="Compare two document categories by cross-neighborhood similarity" position="bottom">
            <Link
              to={`/corpus/${id}/compare`}
              className="text-text-muted text-sm no-underline hover:text-accent-cyan transition-colors"
            >
              Compare
            </Link>
          </Tooltip>
          <Tooltip text="Generate new documents targeting a specific semantic region" position="bottom">
            <Link
              to={`/corpus/${id}/generate`}
              className="text-text-muted text-sm no-underline hover:text-accent-cyan transition-colors"
            >
              Generate
            </Link>
          </Tooltip>
          <Tooltip text="Download corpus as JSON (without embeddings)" position="bottom">
            <button
              onClick={() => exportCorpusJSON(corpus)}
              className="text-text-muted text-sm hover:text-accent-cyan transition-colors"
            >
              Export
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Contextual hint banner */}
      {showHints && !selectedPoint && (
        <div className="px-6 py-2 bg-accent-cyan/5 border-b border-accent-cyan/20 flex items-center justify-between">
          <p className="text-xs text-text-muted">
            <span className="text-accent-cyan font-medium">Click</span> any point to inspect a document and see its neighbors.{' '}
            <span className="text-accent-cyan font-medium">Lasso select</span> (drag) to highlight a region.{' '}
            Colors represent categories — clusters indicate semantic similarity.
          </p>
          <button
            onClick={() => setShowHints(false)}
            className="text-text-muted text-xs hover:text-text-primary ml-4 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative">
          <SemanticMap corpus={corpus} setCorpus={setCorpus} />
        </div>
        {selectedPoint && (
          <div className="w-96 border-l border-border-line overflow-y-auto bg-bg-surface">
            <PointInspector corpus={corpus} />
          </div>
        )}
      </div>
    </div>
  );
}
