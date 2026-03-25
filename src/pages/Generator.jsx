import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCorpus, saveCorpus } from '../lib/storage';
import { knn, zoneCentroid, cosineSimilarity } from '../lib/knn';
import { embed, generate } from '../lib/api';
import { transformNew } from '../lib/umap';
import { exportGenerationReport } from '../lib/export';
import MiniMap from '../components/generator/MiniMap';
import TargetZone from '../components/generator/TargetZone';
import CandidateCard from '../components/generator/CandidateCard';
import InfoHint from '../components/ui/InfoHint';
import StepGuide from '../components/ui/StepGuide';

const GUIDES = [
  {
    title: 'Select a target zone on the map',
    description: 'Click any point to use its semantic neighborhood, or lasso-select a region. The documents in that zone become "exemplars" that guide generation \u2014 Claude will see them as examples of what to produce.',
  },
  {
    title: 'Describe what you want and generate',
    description: 'Write a clear prompt, pick a style, and set how many candidates to create. Claude uses your exemplar documents + prompt to synthesize new content that fits the target zone.',
  },
  {
    title: 'Verify, iterate, and accept the best candidates',
    description: 'Each candidate can be verified: it gets embedded and projected onto the map. On Target = strong fit. If results miss the zone, adjust your prompt and generate again \u2014 iteration is expected. Accept the best candidates into your corpus.',
  },
];

const STYLES = ['Formal', 'Conversational', 'Urgent', 'Playful', 'Minimal', 'Persuasive'];

export default function Generator() {
  const { id } = useParams();
  const [corpus, setCorpus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);

  // Zone selection
  const [exemplars, setExemplars] = useState([]);
  const [zoneCenter, setZoneCenter] = useState(null);

  // Generation prompt
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('Formal');
  const [count, setCount] = useState(5);
  const [generating, setGenerating] = useState(false);

  // Results (accumulates across rounds)
  const [candidates, setCandidates] = useState([]);
  const [roundCount, setRoundCount] = useState(0);

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

      const newCandidates = resp.candidates.map((c, i) => ({
        ...c,
        id: `gen_${Date.now()}_${i}`,
        verified: false,
        placement: null,
        coords: null,
        embedding: null,
        round: roundCount + 1,
      }));

      setCandidates((prev) => [...newCandidates, ...prev]);
      setRoundCount((r) => r + 1);
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
          // UMAP transform may fail
        }
      }

      const updated = [...candidates];
      updated[idx] = { ...candidate, embedding, verified: true, placement, similarity: sim, coords };
      setCandidates(updated);
    } catch (e) {
      alert('Verification failed: ' + e.message);
    }
  };

  const verifyAll = async () => {
    for (let i = 0; i < candidates.length; i++) {
      if (!candidates[i].verified && !candidates[i].accepted) {
        await verifyCandidate(i);
      }
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

  // Stats
  const verified = candidates.filter((c) => c.verified);
  const onTarget = verified.filter((c) => c.placement === 'on-target');
  const adjacent = verified.filter((c) => c.placement === 'adjacent');
  const accepted = candidates.filter((c) => c.accepted);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold text-text-primary mb-2">Document Generator</h1>
      <p className="text-text-muted mb-6">
        Point to a semantic zone, generate documents that belong there, and verify where they land.
        Iteration is expected &mdash; generate multiple rounds, keep the best, discard the rest.
      </p>

      <StepGuide steps={GUIDES} currentStep={Math.min(step + 1, 3)} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Map (always visible as anchor) */}
        <div>
          <MiniMap
            corpus={corpus}
            onPointSelect={handlePointSelect}
            onLassoSelect={handleLassoSelect}
            candidates={candidates.filter((c) => c.coords)}
          />
          <p className="text-text-muted text-xs mt-2 text-center">
            {step === 0
              ? 'Click a point or lasso-select a region to define your target zone.'
              : 'Gold stars show where verified candidates landed. The map is your ground truth.'}
          </p>
        </div>

        {/* Right: Controls */}
        <div>
          {/* Target zone - always visible once set */}
          {exemplars.length > 0 && (
            <TargetZone
              exemplars={exemplars}
              onReset={() => {
                setStep(0);
                setExemplars([]);
                setZoneCenter(null);
                setCandidates([]);
                setRoundCount(0);
              }}
            />
          )}

          {step >= 1 && (
            <div className="bg-bg-surface border border-border-line rounded-lg p-6 mt-4">
              <h3 className="text-text-primary font-medium mb-4">
                Generation Prompt
                {roundCount > 0 && (
                  <span className="text-text-muted font-normal text-xs ml-2">
                    Round {roundCount + 1}
                  </span>
                )}
              </h3>
              <div className="mb-3">
                <label className="block text-sm text-text-muted mb-1">
                  Domain
                  <InfoHint text="Context about what these documents are. Helps Claude produce more appropriate content." />
                </label>
                <div className="text-sm text-text-primary font-mono bg-bg-raised px-3 py-2 rounded">
                  {corpus.domain || 'General'}
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-sm text-text-muted mb-1">
                  I want documents that...
                  <InfoHint text="Be specific about what you want. 'Write formal product descriptions for enterprise security tools' gives better results than 'Write something similar.' If your first round misses the target zone, refine this prompt and generate again." />
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full bg-bg-raised border border-border-line rounded px-3 py-2 text-text-primary text-sm resize-none h-24"
                  placeholder="e.g., Write email subject lines that convey urgency about upcoming project deadlines..."
                />
              </div>
              <div className="flex gap-4 mb-4">
                <div>
                  <label className="block text-sm text-text-muted mb-1">
                    Style
                    <InfoHint text="Formal = professional/academic. Conversational = casual/friendly. Urgent = time-sensitive. Playful = creative/fun. Minimal = concise/sparse. Persuasive = compelling/sales." />
                  </label>
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
                  <label className="block text-sm text-text-muted mb-1">
                    Count ({count})
                    <InfoHint text="Generate more candidates to increase the chance of on-target hits. You can always discard the ones that miss." />
                  </label>
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
                {generating ? 'Generating...' : roundCount > 0 ? 'Generate Another Round' : 'Generate'}
              </button>
              {roundCount > 0 && (
                <p className="text-text-muted text-xs mt-2 text-center">
                  Adjust your prompt, style, or count and generate again. New candidates are added to the list below.
                </p>
              )}
            </div>
          )}

          {step === 0 && (
            <div className="bg-bg-surface border border-border-line rounded-lg p-6">
              <h3 className="text-text-primary font-medium mb-2">Select a Target Zone</h3>
              <p className="text-text-muted text-sm leading-relaxed mb-3">
                The target zone defines <em>where in semantic space</em> your new documents should live.
                Documents in the zone become exemplars that Claude uses as references.
              </p>
              <div className="space-y-2 text-sm text-text-muted">
                <p>
                  <span className="text-accent-cyan font-medium">Click a point</span> &mdash; uses its 10 nearest neighbors as the zone.
                  Good when you want "more like this specific document."
                </p>
                <p>
                  <span className="text-accent-cyan font-medium">Lasso select</span> &mdash; drag to select a region.
                  Good when you want to target a broader area or the space between clusters.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Candidates section */}
      {candidates.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xl font-semibold text-text-primary">Generated Candidates</h2>
              <p className="text-text-muted text-sm">
                {candidates.length} generated | {verified.length} verified | {onTarget.length} on target | {adjacent.length} adjacent | {accepted.length} accepted
              </p>
            </div>
            <div className="flex gap-2">
              {candidates.some((c) => !c.verified && !c.accepted) && (
                <button
                  onClick={verifyAll}
                  className="border border-accent-cyan text-accent-cyan px-4 py-1.5 rounded text-sm hover:bg-accent-cyan/10 transition-colors"
                >
                  Verify All
                </button>
              )}
            </div>
          </div>

          {/* Iteration strategy tip */}
          {verified.length > 0 && onTarget.length === 0 && (
            <div className="bg-bg-raised/50 border border-warning/20 rounded-lg p-3 mb-4 text-sm text-text-muted">
              <span className="text-warning font-medium">No on-target hits yet.</span>
              {' '}This is normal &mdash; try adjusting your prompt to more closely match the language patterns of the exemplar documents, or generate another round with more candidates.
              The semantic map is the ground truth: if a candidate lands near the target zone, it's a genuine match.
            </div>
          )}

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

          {/* Session end panel — appears once at least one candidate is accepted */}
          {accepted.length > 0 && (
            <div className="mt-6 bg-bg-surface border border-success/30 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center">
                  <span className="text-success text-sm font-bold">{accepted.length}</span>
                </div>
                <h3 className="text-text-primary font-medium">
                  {accepted.length} document{accepted.length !== 1 ? 's' : ''} accepted into corpus
                </h3>
              </div>
              <p className="text-text-muted text-sm mb-4">
                Your corpus now has <strong className="text-text-primary">{corpus.documents.length}</strong> total documents.
                The accepted documents are saved and will appear on the map next time you visit the Explorer.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/corpus/${id}/explore`}
                  className="bg-accent-cyan text-bg-primary px-4 py-2 rounded text-sm font-medium no-underline hover:opacity-90 transition-opacity"
                >
                  View Updated Map
                </Link>
                <button
                  onClick={() => exportGenerationReport(corpus, exemplars, candidates, zoneCenter)}
                  className="border border-border-line text-text-primary px-4 py-2 rounded text-sm hover:border-accent-cyan/50 transition-colors"
                >
                  Export Generation Report
                </button>
                <Link
                  to="/home"
                  className="border border-border-line text-text-muted px-4 py-2 rounded text-sm no-underline hover:border-accent-cyan/50 transition-colors"
                >
                  Back to Dashboard
                </Link>
              </div>
              <p className="text-text-muted text-[10px] mt-3">
                The generation report includes your target zone exemplars, all candidates with placement scores, and accepted documents with their full content.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
