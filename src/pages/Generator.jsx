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
    description: 'Click any point to use its semantic neighborhood, or lasso-select a region. The documents in that zone become exemplars that guide what Claude generates.',
  },
  {
    title: 'Describe what you want and generate',
    description: 'Write a clear prompt and pick a style. The system generates candidates, embeds all of them into semantic space, and automatically selects the top 5 closest to your target zone.',
  },
  {
    title: 'Review results and export',
    description: 'The top 5 candidates are automatically added to your corpus. All are shown ranked by similarity so you can see the full distribution. Export your results or return to the Explorer to see the updated map.',
  },
];

const STYLES = ['Formal', 'Conversational', 'Urgent', 'Playful', 'Minimal', 'Persuasive'];
const GENERATE_COUNT = 10;
const AUTO_ACCEPT_COUNT = 5;

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
  const [generating, setGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState('');

  // Results
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
    setCandidates([]);

    try {
      // Step 1: Generate candidates
      setGenStatus(`Generating ${GENERATE_COUNT} candidates with Claude...`);
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
        count: GENERATE_COUNT,
      });

      const allRaw = resp.candidates || [];
      if (allRaw.length === 0) {
        throw new Error('Claude returned no candidates. Try rephrasing your prompt.');
      }

      // Step 2: Embed all candidates
      setGenStatus(`Embedding ${allRaw.length} candidates into semantic space...`);
      const texts = allRaw.map((c) => c.content).filter(Boolean);
      if (texts.length === 0) {
        throw new Error('All candidates had empty content.');
      }
      const embResp = await embed({ texts, model: corpus.embeddingModel || 'voyage-3.5-lite' });

      // Step 3: Score all against zone center and project onto map
      setGenStatus('Projecting into semantic space and ranking...');
      const embeddings = embResp.embeddings || [];
      const scoreable = allRaw.slice(0, embeddings.length);
      const scored = scoreable.map((c, i) => {
        const embedding = embeddings[i];
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
            // transform may fail
          }
        }

        return {
          ...c,
          id: `gen_${Date.now()}_${i}`,
          embedding,
          similarity: sim,
          placement,
          coords,
          verified: true,
          rank: 0,
          accepted: false,
        };
      });

      // Step 4: Sort by similarity, take top 5
      scored.sort((a, b) => b.similarity - a.similarity);
      scored.forEach((c, i) => { c.rank = i + 1; });

      const topN = scored.slice(0, AUTO_ACCEPT_COUNT);
      topN.forEach((c) => { c.accepted = true; });

      // Step 5: Add top 5 to corpus
      setGenStatus('Adding top 5 candidates to corpus...');
      const newDocs = topN.map((c) => ({
        id: c.id,
        title: c.title || `Generated ${new Date().toLocaleString()}`,
        content: c.content,
        category: `Generated ${new Date().toISOString().slice(0, 10)}`,
        embedding: c.embedding,
      }));

      const updatedCorpus = {
        ...corpus,
        documents: [...corpus.documents, ...newDocs],
        docCount: corpus.documents.length + newDocs.length,
      };

      await saveCorpus(updatedCorpus);
      setCorpus(updatedCorpus);
      setCandidates(scored);
      setStep(2);
      setGenStatus('');
    } catch (e) {
      alert('Generation failed: ' + e.message);
      setGenStatus('');
    }
    setGenerating(false);
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

  const accepted = candidates.filter((c) => c.accepted);
  const onTarget = candidates.filter((c) => c.placement === 'on-target');
  const adjacent = candidates.filter((c) => c.placement === 'adjacent');

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center gap-4 mb-6">
        <Link to={`/corpus/${id}/explore`} className="text-text-muted text-sm no-underline hover:text-accent-cyan transition-colors">&larr; Back to Map</Link>
        <span className="text-border-line">|</span>
        <Link to={`/corpus/${id}/compare`} className="text-text-muted text-sm no-underline hover:text-accent-cyan transition-colors">Compare</Link>
        <span className="text-border-line">|</span>
        <Link to="/home" className="text-text-muted text-sm no-underline hover:text-accent-cyan transition-colors">Home</Link>
      </div>
      <h1 className="text-2xl font-semibold text-text-primary mb-2">Document Generator</h1>
      <p className="text-text-muted mb-6">
        Point to a semantic zone, generate candidates, and the system automatically embeds all of them,
        ranks by proximity to the target zone, and adds the top 5 to your corpus.
      </p>

      <StepGuide steps={GUIDES} currentStep={Math.min(step + 1, 3)} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Map */}
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
              : step === 2
              ? 'All candidates are projected. Gold stars = accepted (top 5). Gray circles = the rest.'
              : 'Gold stars will show where candidates land after generation.'}
          </p>
        </div>

        {/* Right: Controls */}
        <div>
          {exemplars.length > 0 && (
            <TargetZone
              exemplars={exemplars}
              onReset={step !== 2 ? () => {
                setStep(0);
                setExemplars([]);
                setZoneCenter(null);
                setCandidates([]);
              } : undefined}
            />
          )}

          {step === 1 && (
            <div className="bg-bg-surface border border-border-line rounded-lg p-6 mt-4">
              <h3 className="text-text-primary font-medium mb-4">Generation Prompt</h3>
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
                  <InfoHint text="Be specific. 'Write formal product descriptions for enterprise security tools' gives better results than 'Write something similar.'" />
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full bg-bg-raised border border-border-line rounded px-3 py-2 text-text-primary text-sm resize-none h-24"
                  placeholder="e.g., Write email subject lines that convey urgency about upcoming project deadlines..."
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm text-text-muted mb-1">
                  Style
                  <InfoHint text="Formal = professional. Conversational = casual. Urgent = time-sensitive. Playful = creative. Minimal = concise. Persuasive = compelling." />
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
              <button
                onClick={handleGenerate}
                disabled={generating || !prompt.trim()}
                className="w-full bg-accent-cyan text-bg-primary py-2.5 rounded font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                {generating ? genStatus || 'Processing...' : `Generate ${GENERATE_COUNT} & Auto-Select Top ${AUTO_ACCEPT_COUNT}`}
              </button>
              <p className="text-text-muted text-xs mt-2 text-center">
                Generates {GENERATE_COUNT} candidates, embeds all into semantic space, and automatically selects the {AUTO_ACCEPT_COUNT} closest to your target zone.
              </p>
            </div>
          )}

          {/* Generating progress */}
          {generating && (
            <div className="bg-bg-surface border border-accent-cyan/30 rounded-lg p-6 mt-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-4 h-4 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
                <span className="text-text-primary text-sm font-medium">Processing</span>
              </div>
              <p className="text-text-muted text-sm">{genStatus}</p>
              <div className="mt-3 w-full h-1.5 bg-bg-raised rounded overflow-hidden">
                <div className="h-full bg-accent-cyan rounded animate-pulse w-full" />
              </div>
            </div>
          )}

          {step === 0 && (
            <div className="bg-bg-surface border border-border-line rounded-lg p-6">
              <h3 className="text-text-primary font-medium mb-2">Select a Target Zone</h3>
              <p className="text-text-muted text-sm leading-relaxed mb-3">
                The target zone defines <em>where in semantic space</em> your new documents should live.
              </p>
              <div className="space-y-2 text-sm text-text-muted">
                <p>
                  <span className="text-accent-cyan font-medium">Click a point</span> &mdash; uses its 10 nearest neighbors as the zone.
                </p>
                <p>
                  <span className="text-accent-cyan font-medium">Lasso select</span> &mdash; drag to select a region.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results section */}
      {step === 2 && candidates.length > 0 && (
        <div className="mt-8">
          {/* Success summary */}
          <div className="bg-bg-surface border border-success/30 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full bg-success/20 flex items-center justify-center">
                <span className="text-success font-bold">{accepted.length}</span>
              </div>
              <h2 className="text-xl font-semibold text-text-primary">
                Top {accepted.length} added to corpus
              </h2>
            </div>
            <p className="text-text-muted text-sm mb-4">
              Generated {candidates.length} candidates, embedded all into semantic space, and selected the {AUTO_ACCEPT_COUNT} closest to the target zone.
              Your corpus now has <strong className="text-text-primary">{corpus.documents.length}</strong> total documents.
              {onTarget.length > 0 && (
                <> <span className="text-success font-medium">{onTarget.length} on-target</span> (sim &gt; 0.8).</>
              )}
              {adjacent.length > 0 && (
                <> <span className="text-accent-cyan font-medium">{adjacent.length} adjacent</span> (sim 0.6&ndash;0.8).</>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                to={`/corpus/${id}/explore`}
                className="bg-accent-cyan text-bg-primary px-5 py-2 rounded text-sm font-medium no-underline hover:opacity-90 transition-opacity"
              >
                View Updated Map
              </Link>
              <button
                onClick={() => exportGenerationReport(corpus, exemplars, candidates, zoneCenter)}
                className="border border-border-line text-text-primary px-5 py-2 rounded text-sm hover:border-accent-cyan/50 transition-colors"
              >
                Export Generation Report
              </button>
              <button
                onClick={() => {
                  setStep(1);
                  setCandidates([]);
                }}
                className="border border-border-line text-text-muted px-5 py-2 rounded text-sm hover:border-accent-cyan/50 transition-colors"
              >
                Generate Another Round
              </button>
              <Link
                to="/home"
                className="border border-border-line text-text-muted px-5 py-2 rounded text-sm no-underline hover:border-accent-cyan/50 transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>

          {/* All candidates ranked */}
          <h3 className="text-text-primary font-medium mb-1">All {candidates.length} Candidates Ranked by Similarity</h3>
          <p className="text-text-muted text-xs mb-4">
            Top {AUTO_ACCEPT_COUNT} were automatically accepted into the corpus. All candidates are shown so you can see the full distribution.
          </p>
          <div className="grid grid-cols-1 gap-3">
            {candidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
