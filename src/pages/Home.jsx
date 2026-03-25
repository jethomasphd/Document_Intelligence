import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import useStore from '../store';

const FEATURES = [
  {
    title: 'Upload & Embed',
    description: 'Import CSV, JSON, or text files. Every document gets embedded into 1024-dimensional semantic space using Voyage AI.',
    icon: '1',
  },
  {
    title: 'Explore the Map',
    description: 'UMAP projects your documents onto a 2D scatter plot. Click any point to inspect it, find neighbors, and summarize.',
    icon: '2',
  },
  {
    title: 'Compare Populations',
    description: 'Select two categories and see exactly how they relate — with cross-similarity histograms and AI-powered insights.',
    icon: '3',
  },
  {
    title: 'Generate Documents',
    description: 'Point to a region on the map and synthesize new documents that belong there. Verify placement before accepting.',
    icon: '4',
  },
];

export default function Home() {
  const corpora = useStore((s) => s.corpora);
  const loadCorpora = useStore((s) => s.loadCorpora);

  useEffect(() => {
    loadCorpora();
  }, [loadCorpora]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {corpora.length === 0 ? (
        /* First-time experience */
        <div>
          <div className="text-center mb-12">
            <h1 className="text-4xl font-semibold text-text-primary mb-3">
              Meaning has geometry.
            </h1>
            <p className="text-text-muted text-lg max-w-2xl mx-auto leading-relaxed">
              Upload a document collection and see it arranged by meaning — not keywords, not topics, but the
              deep semantic structure that connects your texts. Then compare, explore, and generate.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="border border-border-line rounded-lg bg-bg-surface p-5 flex gap-4"
              >
                <div className="shrink-0 w-8 h-8 rounded-full bg-accent-cyan/15 flex items-center justify-center">
                  <span className="text-accent-cyan font-mono text-sm font-medium">{f.icon}</span>
                </div>
                <div>
                  <h3 className="text-text-primary font-medium mb-1">{f.title}</h3>
                  <p className="text-text-muted text-sm leading-relaxed">{f.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              to="/corpus/new"
              className="inline-block bg-accent-cyan text-bg-primary px-8 py-3 rounded-lg font-medium text-lg no-underline hover:opacity-90 transition-opacity"
            >
              Create Your First Corpus
            </Link>
            <p className="text-text-muted text-xs mt-3">
              You'll need a CSV, JSON, or text file with your documents.
            </p>
          </div>
        </div>
      ) : (
        /* Returning user */
        <div>
          <div className="mb-10">
            <h1 className="text-3xl font-semibold text-text-primary mb-2">Your Corpora</h1>
            <p className="text-text-muted">
              Select a corpus to explore its semantic landscape, or create a new one.
            </p>
          </div>

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
        </div>
      )}
    </div>
  );
}
