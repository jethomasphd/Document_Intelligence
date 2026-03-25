import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import useStore from '../store';
import { deleteCorpus } from '../lib/storage';

const WORKFLOW_STEPS = [
  {
    num: '1',
    title: 'Upload a Corpus',
    desc: 'Import your document collection as CSV, JSON, or plain text. Map your columns, choose an embedding model, and let the system process everything.',
    action: '/corpus/new',
    actionLabel: 'New Corpus',
  },
  {
    num: '2',
    title: 'Explore the Map',
    desc: 'See your documents arranged by meaning on an interactive 2D map. Click any point to inspect it, find its neighbors, and summarize it with AI.',
  },
  {
    num: '3',
    title: 'Compare & Generate',
    desc: 'Analyze population differences, then generate new documents that target specific semantic zones. The system auto-selects the best 5 out of 10 candidates.',
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
    if (!confirm(`Delete "${name}"? This removes all documents and embeddings. This cannot be undone.`)) return;
    await deleteCorpus(id);
    loadCorpora();
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-text-primary mb-2">Document Intelligence</h1>
          <p className="text-text-muted max-w-2xl leading-relaxed">
            Upload a collection of documents and transform them into a navigable semantic landscape.
            See what your content means as a whole. Find patterns. Generate what's missing.
          </p>
        </div>
        <Link
          to="/about"
          className="text-text-muted text-sm no-underline hover:text-accent-cyan transition-colors shrink-0 mt-2"
        >
          How it works &rarr;
        </Link>
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
          <p className="text-text-muted text-sm mb-4">
            Create your first corpus by uploading a CSV, JSON, or text file with your documents.
          </p>
          <Link
            to="/corpus/new"
            className="inline-block bg-accent-cyan text-bg-primary px-6 py-2 rounded font-medium text-sm no-underline hover:opacity-90 transition-opacity"
          >
            Create Your First Corpus
          </Link>
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

      {/* Storage disclosure */}
      <div className="mt-10 bg-bg-surface border border-border-line rounded-lg p-5">
        <h3 className="text-text-primary font-medium mb-2">Where is my data stored?</h3>
        <div className="text-text-muted text-sm leading-relaxed space-y-2">
          <p>
            All of your corpora, documents, and embeddings are stored locally in your browser using <strong className="text-text-primary">IndexedDB</strong>.
            Nothing is stored on a server or in the cloud. Your data never leaves your machine except when it's sent to the embedding and generation APIs during processing.
          </p>
          <p>
            <strong className="text-text-primary">Persistence:</strong> Your data persists across browser sessions and restarts. It will remain until you explicitly delete it (using the Delete button on each corpus card) or clear your browser's site data.
          </p>
          <p>
            <strong className="text-text-primary">Clearing all data:</strong> To remove everything, go to your browser's settings &rarr; Privacy/Site Data &rarr; find this site &rarr; Clear Data. Or delete corpora individually using the Delete button that appears when you hover over a corpus card above.
          </p>
          <p>
            <strong className="text-text-primary">Backup:</strong> Use the Export buttons in the Explorer to download your corpus as CSV or JSON (with embeddings). This is your portable backup. Keep it safe.
          </p>
        </div>
      </div>
    </div>
  );
}
