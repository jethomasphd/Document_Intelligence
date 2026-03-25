import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import useStore from '../store';
import { deleteCorpus } from '../lib/storage';

const WORKFLOW_STEPS = [
  {
    num: '1',
    title: 'Upload a Corpus',
    desc: 'Import your document collection as CSV, JSON, or plain text.',
    action: '/corpus/new',
    actionLabel: 'New Corpus',
  },
  {
    num: '2',
    title: 'Explore the Map',
    desc: 'See your documents arranged by meaning on an interactive 2D map.',
  },
  {
    num: '3',
    title: 'Compare & Generate',
    desc: 'Analyze population differences. Synthesize new documents that fit specific semantic zones.',
  },
];

export default function Home() {
  const corpora = useStore((s) => s.corpora);
  const loadCorpora = useStore((s) => s.loadCorpora);

  useEffect(() => {
    loadCorpora();
  }, [loadCorpora]);

  const handleDelete = async (e, id, name) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await deleteCorpus(id);
    loadCorpora();
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-text-primary mb-2">Document Intelligence</h1>
        <p className="text-text-muted max-w-2xl leading-relaxed">
          Upload a collection of documents and transform them into a navigable semantic landscape.
          Every document becomes a point in high-dimensional space, positioned by meaning — not keywords.
          Explore clusters, compare populations, and generate new documents that target specific regions of meaning.
        </p>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {WORKFLOW_STEPS.map((s) => (
          <div key={s.num} className="border border-border-line rounded-lg bg-bg-surface p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-7 h-7 rounded-full bg-accent-cyan/15 flex items-center justify-center shrink-0">
                <span className="text-accent-cyan font-mono text-xs font-bold">{s.num}</span>
              </div>
              <h3 className="text-text-primary font-medium text-sm">{s.title}</h3>
            </div>
            <p className="text-text-muted text-sm leading-relaxed mb-3">{s.desc}</p>
            {s.action && (
              <Link
                to={s.action}
                className="text-accent-cyan text-sm font-medium no-underline hover:opacity-80 transition-opacity"
              >
                {s.actionLabel} &rarr;
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Key concepts */}
      <div className="bg-bg-surface border border-border-line rounded-lg p-5 mb-10">
        <h3 className="text-text-primary font-medium mb-3">Key Concepts</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div>
            <span className="text-accent-cyan font-medium">Semantic Embedding</span>
            <span className="text-text-muted"> &mdash; Each document is converted to a 1024-dimensional vector that captures its meaning. Documents about similar topics land near each other in this space.</span>
          </div>
          <div>
            <span className="text-accent-gold font-medium">Cosine Similarity</span>
            <span className="text-text-muted"> &mdash; A score from 0 to 1 measuring how similar two documents are in meaning. 1.0 = identical meaning, 0.5 = loosely related, below 0.3 = unrelated.</span>
          </div>
          <div>
            <span className="text-accent-cyan font-medium">UMAP Projection</span>
            <span className="text-text-muted"> &mdash; An algorithm that compresses 1024 dimensions into a 2D map while preserving neighborhood relationships. Nearby points on the map = similar meaning.</span>
          </div>
          <div>
            <span className="text-accent-gold font-medium">Target Zone</span>
            <span className="text-text-muted"> &mdash; A region on the semantic map you select for generation. Claude produces new documents designed to land in that zone, which you verify by embedding them.</span>
          </div>
        </div>
      </div>

      {/* Corpus library */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text-primary">
          {corpora.length > 0 ? 'Your Corpora' : 'Get Started'}
        </h2>
        <Link
          to="/corpus/new"
          className="bg-accent-cyan text-bg-primary px-5 py-2 rounded font-medium text-sm no-underline hover:opacity-90 transition-opacity"
        >
          + New Corpus
        </Link>
      </div>

      {corpora.length === 0 ? (
        <div className="border border-border-line border-dashed rounded-lg bg-bg-surface p-12 text-center">
          <div className="text-4xl mb-4 opacity-20">+</div>
          <p className="text-text-muted mb-2">No corpora yet.</p>
          <p className="text-text-muted text-sm">
            Create your first corpus by uploading a CSV, JSON, or text file with your documents.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {corpora.map((c) => (
            <Link
              key={c.id}
              to={`/corpus/${c.id}/explore`}
              className="border border-border-line rounded-lg bg-bg-surface p-5 no-underline hover:border-accent-cyan/50 transition-colors group relative"
            >
              <h3 className="text-text-primary font-medium mb-1 group-hover:text-accent-cyan transition-colors">
                {c.name}
              </h3>
              <p className="text-text-muted text-sm mb-3">{c.domain || 'No domain specified'}</p>
              <div className="flex items-center gap-3 text-xs text-text-muted font-mono">
                <span>{c.docCount} docs</span>
                <span>{c.categories?.length || 0} categories</span>
              </div>
              <button
                onClick={(e) => handleDelete(e, c.id, c.name)}
                className="absolute top-3 right-3 text-text-muted/40 hover:text-error text-xs transition-colors opacity-0 group-hover:opacity-100"
                title="Delete corpus"
              >
                Delete
              </button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
