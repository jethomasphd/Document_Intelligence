import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getCorpus, saveCorpus } from '../lib/storage';
import { knn, zoneCentroid, cosineSimilarity } from '../lib/knn';
import { embed, generate } from '../lib/api';
import { transformNew } from '../lib/umap';
import MiniMap from '../components/generator/MiniMap';
import TargetZone from '../components/generator/TargetZone';
import CandidateCard from '../components/generator/CandidateCard';

export default function Generator() {
  const { id } = useParams();
  const [corpus, setCorpus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);

  // Step 1 - Zone selection
  const [exemplars, setExemplars] = useState([]);
  const [zoneCenter, setZoneCenter] = useState(null);

  // Step 2 - Generation prompt
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('Formal');
  const [count, setCount] = useState(3);
  const [generating, setGenerating] = useState(false);

  // Step 3 - Results
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    getCorpus(id).then((c) => {
      setCorpus(c);
      setLoading(false);
    });
  }, [id]);

  const handlePointSelect = useCallback(
    (pointIdx) => {
      if (!corpus) return;
      const doc = corpus.documents[pointIdx];
      const neighbors = knn(doc.embedding, corpus.documents, 10);
      setExemplars(neighbors);
      setZoneCenter(doc.embedding);
      setStep(1);
    },
    [corpus]
  );

  const handleLassoSelect = useCallback(
    (indices) => {
      if (!corpus || indices.length === 0) return;
      const selected = indices.map((i) => corpus.documents[i]);
      const centroid = zoneCentroid(selected);
      const neighbors = knn(centroid, corpus.documents, 10);
      setExemplars(neighbors);
      setZoneCenter(centroid);
      setStep(1);
    },
    [corpus]
  );

  const handleGenerate = async () => {
    if (!corpus || !zoneCenter) return;
    setGenerating(true);

    try {
      const exemplarTexts = exemplars.slice(0, 8).map((e) => ({
        title: e.title || e.id,
        content: e.content?.slice(0, 500),
        category: e.category,
      }));

      const resp = await generate({
        domain: corpus.domain,
        exemplars: exemplarTexts,
        prompt,
        style,
        count,
      });

      setCandidates(
        resp.candidates.map((c, i) => ({
          ...c,
          id: `gen_${Date.now()}_${i}`,
          verified: false,
          placement: null,
          coords: null,
          embedding: null,
        }))
      );
      setStep(2);
    } catch (e) {
      alert('Generation failed: ' + e.message);
    }
    setGenerating(false);
  };

  const verifyCandidate = async (idx) => {
    const candidate = candidates[idx];
    try {
      const embResp = await embed({ texts: [candidate.content], model: corpus.embeddingModel || 'voyage-3.5-lite' });
      const embedding = embResp.embeddings[0];
      const sim = cosineSimilarity(embedding, zoneCenter);

      let placement;
      if (sim > 0.8) placement = 'on-target';
      else if (sim > 0.6) placement = 'adjacent';
      else placement = 'off-target';

      let coords = null;
      if (corpus.umapModel) {
        try {
          const projected = transformNew(corpus.umapModel, [embedding]);
          coords = projected[0];
        } catch {
          // UMAP transform may fail, use null coords
        }
      }

      const updated = [...candidates];
      updated[idx] = { ...candidate, embedding, verified: true, placement, similarity: sim, coords };
      setCandidates(updated);
    } catch (e) {
      alert('Verification failed: ' + e.message);
    }
  };

  const acceptCandidate = async (idx) => {
    const candidate = candidates[idx];
    if (!candidate.embedding) return;

    const newDoc = {
      id: candidate.id,
      title: candidate.title || `Generated ${new Date().toLocaleString()}`,
      content: candidate.content,
      category: `Generated ${new Date().toISOString().slice(0, 10)}`,
      embedding: candidate.embedding,
    };

    const updatedCorpus = {
      ...corpus,
      documents: [...corpus.documents, newDoc],
      docCount: corpus.documents.length + 1,
    };

    await saveCorpus(updatedCorpus);
    setCorpus(updatedCorpus);

    const updated = [...candidates];
    updated[idx] = { ...candidate, accepted: true };
    setCandidates(updated);
  };

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

  const STYLES = ['Formal', 'Conversational', 'Urgent', 'Playful', 'Minimal', 'Persuasive'];

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold text-text-primary mb-2">Document Generator</h1>
      <p className="text-text-muted mb-8">Generate new documents that fit a specific semantic zone in your corpus.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Mini map */}
        <div>
          <MiniMap
            corpus={corpus}
            onPointSelect={handlePointSelect}
            onLassoSelect={handleLassoSelect}
            candidates={candidates.filter((c) => c.coords)}
          />
        </div>

        {/* Right: Controls */}
        <div>
          {step >= 1 && exemplars.length > 0 && (
            <TargetZone exemplars={exemplars} />
          )}

          {step >= 1 && (
            <div className="bg-bg-surface border border-border-line rounded-lg p-6 mt-4">
              <h3 className="text-text-primary font-medium mb-4">Generation Prompt</h3>
              <div className="mb-3">
                <label className="block text-sm text-text-muted mb-1">Domain</label>
                <div className="text-sm text-text-primary font-mono bg-bg-raised px-3 py-2 rounded">
                  {corpus.domain || 'General'}
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-sm text-text-muted mb-1">I want documents that...</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full bg-bg-raised border border-border-line rounded px-3 py-2 text-text-primary text-sm resize-none h-24"
                  placeholder="Describe the type of documents you want to generate..."
                />
              </div>
              <div className="flex gap-4 mb-4">
                <div>
                  <label className="block text-sm text-text-muted mb-1">Style</label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="bg-bg-raised border border-border-line rounded px-3 py-2 text-text-primary text-sm"
                  >
                    {STYLES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-text-muted mb-1">Count ({count})</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="w-32 mt-2"
                  />
                </div>
              </div>
              <button
                onClick={handleGenerate}
                disabled={generating || !prompt.trim()}
                className="w-full bg-accent-cyan text-bg-primary py-2 rounded font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                {generating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          )}

          {step === 0 && (
            <div className="bg-bg-surface border border-border-line rounded-lg p-6">
              <h3 className="text-text-primary font-medium mb-2">Select a Target Zone</h3>
              <p className="text-text-muted text-sm">
                Click a point on the map to use its neighborhood as the target zone, or use lasso select to define a custom region.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Candidates */}
      {candidates.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Generated Candidates</h2>
          <div className="grid grid-cols-1 gap-4">
            {candidates.map((candidate, i) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                onVerify={() => verifyCandidate(i)}
                onAccept={() => acceptCandidate(i)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
