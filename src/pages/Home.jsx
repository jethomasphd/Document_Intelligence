import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import useStore from '../store';

export default function Home() {
  const corpora = useStore((s) => s.corpora);
  const loadCorpora = useStore((s) => s.loadCorpora);

  useEffect(() => {
    loadCorpora();
  }, [loadCorpora]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-semibold text-text-primary mb-2">Your Corpora</h1>
        <p className="text-text-muted">
          Upload a document corpus to explore semantic relationships, compare populations, and generate new content.
        </p>
      </div>

      {corpora.length === 0 ? (
        <div className="border border-border-line rounded-lg bg-bg-surface p-12 text-center">
          <p className="text-text-muted mb-4">No corpora yet. Create one to get started.</p>
          <Link
            to="/corpus/new"
            className="inline-block bg-accent-cyan text-bg-primary px-6 py-2 rounded font-medium no-underline hover:opacity-90 transition-opacity"
          >
            + New Corpus
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {corpora.map((c) => (
            <Link
              key={c.id}
              to={`/corpus/${c.id}/explore`}
              className="border border-border-line rounded-lg bg-bg-surface p-5 no-underline hover:border-accent-cyan/50 transition-colors group"
            >
              <h3 className="text-text-primary font-medium mb-1 group-hover:text-accent-cyan transition-colors">
                {c.name}
              </h3>
              <p className="text-text-muted text-sm mb-3">{c.domain || 'No domain specified'}</p>
              <div className="flex items-center gap-3 text-xs text-text-muted font-mono">
                <span>{c.docCount} docs</span>
                <span>{c.categories?.length || 0} categories</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
