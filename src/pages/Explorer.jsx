import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import useStore from '../store';
import { getCorpus } from '../lib/storage';
import { exportCorpusJSON } from '../lib/export';
import SemanticMap from '../components/explorer/SemanticMap';
import PointInspector from '../components/explorer/PointInspector';
import SearchBar from '../components/explorer/SearchBar';

export default function Explorer() {
  const { id } = useParams();
  const [corpus, setCorpus] = useState(null);
  const [loading, setLoading] = useState(true);
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
          <p className="text-xs text-text-muted font-mono">{corpus.documents.length} documents</p>
        </div>
        <div className="flex items-center gap-3">
          <SearchBar corpus={corpus} />
          <Link
            to={`/corpus/${id}/compare`}
            className="text-text-muted text-sm no-underline hover:text-accent-cyan transition-colors"
          >
            Compare
          </Link>
          <Link
            to={`/corpus/${id}/generate`}
            className="text-text-muted text-sm no-underline hover:text-accent-cyan transition-colors"
          >
            Generate
          </Link>
          <button
            onClick={() => exportCorpusJSON(corpus)}
            className="text-text-muted text-sm hover:text-accent-cyan transition-colors"
          >
            Export
          </button>
        </div>
      </div>
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
