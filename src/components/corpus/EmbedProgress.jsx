import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { embed } from '../../lib/api';
import { saveCorpus } from '../../lib/storage';
import useStore from '../../store';

export default function EmbedProgress({ rawData, config, onBack }) {
  const navigate = useNavigate();
  const addCorpus = useStore((s) => s.addCorpus);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('preparing');
  const [error, setError] = useState(null);
  const abortRef = useRef(false);

  useEffect(() => {
    runEmbedding();
    return () => {
      abortRef.current = true;
    };
  }, []);

  const runEmbedding = async () => {
    try {
      // Build documents from raw data + field mapping
      const { fieldMap, categories, embeddingModel, name, domain } = config;

      const documents = rawData.map((row, i) => ({
        id: fieldMap.id ? String(row[fieldMap.id]) : String(i + 1),
        content: row[fieldMap.content] || '',
        title: fieldMap.title ? row[fieldMap.title] : '',
        category: fieldMap.category ? row[fieldMap.category] : 'All',
      }));

      // Filter out empty content
      const validDocs = documents.filter((d) => d.content.trim());
      setTotal(validDocs.length);
      setStatus('embedding');

      // Batch embed
      const BATCH_SIZE = 100;
      const allEmbeddings = [];

      for (let i = 0; i < validDocs.length; i += BATCH_SIZE) {
        if (abortRef.current) return;

        const batch = validDocs.slice(i, i + BATCH_SIZE);
        const texts = batch.map((d) => d.content);

        let retries = 0;
        let result;

        while (retries < 4) {
          try {
            result = await embed({ texts, model: embeddingModel });
            break;
          } catch (e) {
            retries++;
            if (retries >= 4) throw e;
            const delay = Math.pow(2, retries) * 1000 + Math.random() * 1000;
            setStatus(`Rate limited — retrying in ${Math.ceil(delay / 1000)}s...`);
            await new Promise((r) => setTimeout(r, delay));
            setStatus('embedding');
          }
        }

        allEmbeddings.push(...result.embeddings);
        setProgress(Math.min(i + BATCH_SIZE, validDocs.length));
      }

      // Assign embeddings to documents
      const docsWithEmbeddings = validDocs.map((doc, i) => ({
        ...doc,
        embedding: allEmbeddings[i],
      }));

      // Create corpus object
      const corpusId = `corpus_${Date.now()}`;
      const corpus = {
        id: corpusId,
        name,
        domain,
        embeddingModel,
        categories,
        documents: docsWithEmbeddings,
        docCount: docsWithEmbeddings.length,
        createdAt: Date.now(),
        coords2d: null,
        umapModel: null,
      };

      setStatus('saving');
      await saveCorpus(corpus);
      addCorpus(corpus);

      setStatus('done');
      navigate(`/corpus/${corpusId}/explore`);
    } catch (e) {
      setError(e.message);
      setStatus('error');
    }
  };

  const pct = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <div>
      <div className="bg-bg-surface border border-border-line rounded-lg p-8 text-center">
        {status === 'error' ? (
          <div>
            <div className="text-error text-lg mb-2">Embedding Failed</div>
            <p className="text-text-muted text-sm mb-4">{error}</p>
            <button
              onClick={onBack}
              className="border border-border-line text-text-primary px-6 py-2 rounded hover:border-accent-cyan/50 transition-colors"
            >
              Go Back
            </button>
          </div>
        ) : status === 'done' ? (
          <div>
            <div className="text-success text-lg mb-2">Embedding Complete!</div>
            <p className="text-text-muted text-sm">Redirecting to Explorer...</p>
          </div>
        ) : (
          <div>
            <div className="text-text-primary text-lg mb-2">
              {status === 'preparing' && 'Preparing documents...'}
              {status === 'embedding' && `Embedding ${progress} / ${total} documents...`}
              {status === 'saving' && 'Saving corpus...'}
              {status.startsWith('Rate limited') && status}
            </div>
            <div className="w-full bg-bg-raised rounded-full h-3 mt-4 mb-2 overflow-hidden">
              <div
                className="h-full bg-accent-cyan rounded-full transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-text-muted text-sm font-mono">{pct}%</p>
          </div>
        )}
      </div>
    </div>
  );
}
