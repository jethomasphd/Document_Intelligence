import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import useStore from '../store';
import { getCorpus } from '../lib/storage';
import { exportCorpusJSON } from '../lib/export';
import SemanticMap from '../components/explorer/SemanticMap';
import PointInspector from '../components/explorer/PointInspector';
import SearchBar from '../components/explorer/SearchBar';
import Tooltip from '../components/ui/Tooltip';
import InfoHint from '../components/ui/InfoHint';

export default function Explorer() {
  const { id } = useParams();
  const [corpus, setCorpus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(true);
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
      {/* Top bar */}
      <div className="px-6 py-3 border-b border-border-line bg-bg-surface flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">{corpus.name}</h1>
          <p className="text-xs text-text-muted font-mono">
            {corpus.documents.length} documents | {corpus.categories?.length || 0} categories | {corpus.embeddingModel || 'voyage-3.5-lite'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SearchBar corpus={corpus} />
          <Tooltip text="Compare two categories by cross-neighborhood cosine similarity. See where populations overlap and diverge." position="bottom">
            <Link
              to={`/corpus/${id}/compare`}
              className="text-text-muted text-sm no-underline hover:text-accent-cyan transition-colors"
            >
              Compare
            </Link>
          </Tooltip>
          <Tooltip text="Select a semantic zone and generate new documents that target that region. Verify placement before accepting." position="bottom">
            <Link
              to={`/corpus/${id}/generate`}
              className="text-text-muted text-sm no-underline hover:text-accent-cyan transition-colors"
            >
              Generate
            </Link>
          </Tooltip>
          <Tooltip text="Download your corpus as JSON for external analysis. Includes all documents with titles, content, and categories (without embeddings for portability)." position="bottom">
            <button
              onClick={() => exportCorpusJSON(corpus)}
              className="text-text-muted text-sm hover:text-accent-cyan transition-colors"
            >
              Export
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Conceptual guide banner */}
      {showGuide && !selectedPoint && (
        <div className="px-6 py-3 bg-bg-surface border-b border-accent-cyan/20">
          <div className="flex items-start justify-between gap-4">
            <div className="text-xs text-text-muted leading-relaxed space-y-1.5">
              <p className="text-text-primary font-medium text-sm mb-1">Reading the Semantic Map</p>
              <p>
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-accent-cyan mr-1.5 align-middle" />
                Each <strong className="text-text-primary">dot is a document</strong>, positioned by its meaning.
                Documents close together share similar semantic content. Clusters form naturally around shared themes.
              </p>
              <p>
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-accent-gold mr-1.5 align-middle" />
                <strong className="text-text-primary">Colors represent categories</strong>.
                When colors cluster tightly, that category has strong internal coherence.
                When colors intermix, those categories share semantic overlap.
              </p>
              <p>
                <strong className="text-accent-cyan">Click</strong> any point to inspect it &mdash; you'll see the full document, its category, and its 15 nearest semantic neighbors.
                <strong className="text-accent-cyan ml-1">Drag</strong> to lasso-select a region.
                <strong className="text-accent-cyan ml-1">Search</strong> to find specific documents by text.
              </p>
            </div>
            <button
              onClick={() => setShowGuide(false)}
              className="text-text-muted text-xs hover:text-text-primary shrink-0 mt-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Map + Inspector */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative">
          <SemanticMap corpus={corpus} setCorpus={setCorpus} />
          {/* Legend overlay */}
          {corpus.categories && corpus.categories.length > 1 && !selectedPoint && (
            <div className="absolute bottom-4 left-4 bg-bg-surface/90 border border-border-line rounded px-3 py-2 backdrop-blur-sm">
              <p className="text-text-muted text-[10px] font-medium uppercase tracking-wider mb-1">Categories</p>
              <div className="space-y-0.5">
                {corpus.categories.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-text-primary">{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
