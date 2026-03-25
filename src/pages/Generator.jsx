import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCorpus, saveCorpus } from '../lib/storage';
import { knn, zoneCentroid, cosineSimilarity } from '../lib/knn';
import { embed, generate } from '../lib/api';
import { exportGenerationReport } from '../lib/export';
import MiniMap from '../components/generator/MiniMap';
import TargetZone from '../components/generator/TargetZone';
import CandidateCard from '../components/generator/CandidateCard';
import InfoHint from '../components/ui/InfoHint';
import StepGuide from '../components/ui/StepGuide';
import ErrorBoundary from '../components/ui/ErrorBoundary';

const GUIDES = [
  {
    title: 'Select a target zone on the map',
    description: 'Click any point to use its semantic neighborhood, or lasso-select a region.',
  },
  {
    title: 'Describe what you want and generate',
    description: 'Write a clear prompt and pick a style. The system generates 10 candidates, embeds them, and ranks by similarity to your target zone.',
  },
  {
    title: 'Review results and save',
    description: 'All 10 candidates are ranked by similarity. Click "Save Top 5 to Corpus" to keep the best ones.',
  },
];

const STYLES = ['Formal', 'Conversational', 'Urgent', 'Playful', 'Minimal', 'Persuasive'];
const GENERATE_COUNT = 10;

export default function Generator() {
  const { id } = useParams();
  const [corpus, setCorpus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);

  const [exemplars, setExemplars] = useState([]);
  const [zoneCenter, setZoneCenter] = useState(null);

  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('Formal');
  const [generating, setGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState('');
  const [genError, setGenError] = useState(null);

  const [candidates, setCandidates] = useState([]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

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
      setSaved(false);
      setCandidates([]);
      setGenError(null);
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
      setSaved(false);
      setCandidates([]);
      setGenError(null);
    },
    [corpus]
  );

  // ── GENERATE: Claude → Voyage → Score ──
  const handleGenerate = async () => {
    if (!corpus || !zoneCenter) return;
    setGenerating(true);
    setCandidates([]);
    setGenError(null);
    setSaved(false);

    try {
      // 1. Generate via Claude
      setGenStatus('Generating candidates with Claude...');
      const exemplarTexts = exemplars.slice(0, 8).map((e) => ({
        title: e.title || e.id,
        content: e.content?.slice(0, 500),
        category: e.category,
      }));

      let resp;
      try {
        resp = await generate({
          domain: corpus.domain,
          exemplars: exemplarTexts,
          prompt,
          style,
          count: GENERATE_COUNT,
        });
      } catch (apiErr) {
        throw new Error('Generation API call failed: ' + apiErr.message);
      }

      const allRaw = (resp.candidates || []).filter((c) => c && c.content);
      if (allRaw.length === 0) {
        throw new Error('Claude returned no candidates. Try rephrasing your prompt.');
      }

      setGenStatus(`Generated ${allRaw.length} candidates. Now embedding...`);

      // 2. Embed via Voyage AI
      let embeddings;
      try {
        const texts = allRaw.map((c) => c.content);
        const embResp = await embed({ texts, model: corpus.embeddingModel || 'voyage-3.5-lite' });
        embeddings = embResp.embeddings || [];
      } catch (embErr) {
        throw new Error('Embedding API call failed: ' + embErr.message);
      }

      if (embeddings.length === 0) {
        throw new Error('Embedding API returned no results.');
      }

      setGenStatus('Ranking by similarity...');

      // 3. Score by cosine similarity
      const zc = Array.isArray(zoneCenter) ? zoneCenter : Array.from(zoneCenter);
      const results = [];

      for (let i = 0; i < Math.min(allRaw.length, embeddings.length); i++) {
        const emb = embeddings[i];
        if (!emb || !Array.isArray(emb)) continue;

        let sim;
        try { sim = cosineSimilarity(emb, zc); } catch { continue; }
        if (!isFinite(sim)) continue;

        results.push({
          id: `gen_${i}_${Math.random().toString(36).slice(2, 8)}`,
          title: String(allRaw[i].title || 'Untitled'),
          content: String(allRaw[i].content || ''),
          rationale: String(allRaw[i].rationale || ''),
          similarity: sim,
          placement: sim > 0.8 ? 'on-target' : sim > 0.6 ? 'adjacent' : 'off-target',
          rank: 0,
          accepted: false,
          _embedding: emb, // stored privately, not rendered
        });
      }

      if (results.length === 0) {
        throw new Error('Could not score any candidates.');
      }

      // 4. Sort and rank
      results.sort((a, b) => b.similarity - a.similarity);
      results.forEach((c, i) => {
        c.rank = i + 1;
        c.accepted = i < 5;
      });

      setCandidates(results);
      setStep(2);
    } catch (e) {
      console.error('Generation error:', e);
      setGenError(e.message || 'Unknown error');
    }

    setGenStatus('');
    setGenerating(false);
  };

  // ── SAVE: Separate from generation so it can't crash the results ──
  const handleSave = async () => {
    if (saved || saving) return;
    setSaving(true);

    try {
      const toSave = candidates.filter((c) => c.accepted);
      const newDocs = toSave.map((c) => ({
        id: c.id,
        title: c.title,
        content: c.content,
        category: `Generated ${new Date().toISOString().slice(0, 10)}`,
        embedding: c._embedding,
      }));

      const updatedCorpus = {
        ...corpus,
        documents: [...corpus.documents, ...newDocs],
        docCount: corpus.documents.length + newDocs.length,
      };

      await saveCorpus(updatedCorpus);
      setCorpus(updatedCorpus);
      setSaved(true);
    } catch (saveErr) {
      console.error('Save failed:', saveErr);
      alert('Save failed: ' + saveErr.message + '\n\nYour generated candidates are still displayed. Try exporting the report instead.');
    }

    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center h-96"><div className="text-text-muted">Loading corpus...</div></div>;
  if (!corpus) return <div className="flex items-center justify-center h-96"><div className="text-error">Corpus not found</div></div>;

  const accepted = candidates.filter((c) => c.accepted);
  const onTarget = candidates.filter((c) => c.placement === 'on-target');

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
        Generate candidates, rank by semantic similarity to your target zone, and save the best to your corpus.
      </p>

      <StepGuide steps={GUIDES} currentStep={Math.min(step + 1, 3)} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <MiniMap
            corpus={corpus}
            onPointSelect={handlePointSelect}
            onLassoSelect={handleLassoSelect}
            candidates={[]}
          />
          <p className="text-text-muted text-xs mt-2 text-center">
            {step === 0 ? 'Click a point or lasso-select a region to define your target zone.' : 'Your target zone is selected.'}
          </p>
        </div>

        <div>
          {exemplars.length > 0 && (
            <TargetZone
              exemplars={exemplars}
              onReset={step !== 2 ? () => {
                setStep(0); setExemplars([]); setZoneCenter(null);
                setCandidates([]); setSaved(false); setGenError(null);
              } : undefined}
            />
          )}

          {step === 1 && !generating && (
            <div className="bg-bg-surface border border-border-line rounded-lg p-6 mt-4">
              <h3 className="text-text-primary font-medium mb-4">Generation Prompt</h3>
              <div className="mb-3">
                <label className="block text-sm text-text-muted mb-1">
                  Domain
                  <InfoHint text="Context about what these documents are." />
                </label>
                <div className="text-sm text-text-primary font-mono bg-bg-raised px-3 py-2 rounded">
                  {corpus.domain || 'General'}
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-sm text-text-muted mb-1">
                  I want documents that...
                  <InfoHint text="Be specific. Describe the type, tone, and topic." />
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full bg-bg-raised border border-border-line rounded px-3 py-2 text-text-primary text-sm resize-none h-24"
                  placeholder="e.g., Write email subject lines that convey urgency about upcoming project deadlines..."
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm text-text-muted mb-1">Style</label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="bg-bg-raised border border-border-line rounded px-3 py-2 text-text-primary text-sm"
                >
                  {STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim()}
                className="w-full bg-accent-cyan text-bg-primary py-2.5 rounded font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                Generate {GENERATE_COUNT} Candidates
              </button>
            </div>
          )}

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

          {genError && !generating && (
            <div className="bg-bg-surface border border-error/30 rounded-lg p-6 mt-4">
              <h3 className="text-error font-medium mb-2">Generation Failed</h3>
              <p className="text-text-muted text-sm mb-3">{genError}</p>
              <button
                onClick={() => setGenError(null)}
                className="border border-border-line text-text-primary px-4 py-2 rounded text-sm hover:border-accent-cyan/50 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {step === 0 && (
            <div className="bg-bg-surface border border-border-line rounded-lg p-6">
              <h3 className="text-text-primary font-medium mb-2">Select a Target Zone</h3>
              <p className="text-text-muted text-sm leading-relaxed">
                Click a point to use its neighborhood, or lasso-select a region on the map.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {step === 2 && candidates.length > 0 && (
        <ErrorBoundary>
        <div className="mt-8">
          <div className="bg-bg-surface border border-success/30 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              {candidates.length} Candidates Ranked by Similarity
            </h2>
            <p className="text-text-muted text-sm mb-4">
              {onTarget.length > 0 && <><span className="text-success font-medium">{onTarget.length} on-target</span> (sim &gt; 0.8). </>}
              Top 5 are marked for saving. {saved ? 'Saved to corpus.' : 'Click below to save.'}
            </p>

            <div className="flex flex-wrap gap-2">
              {!saved ? (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-success text-bg-primary px-5 py-2 rounded text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {saving ? 'Saving...' : 'Save Top 5 to Corpus'}
                </button>
              ) : (
                <Link
                  to={`/corpus/${id}/explore`}
                  className="bg-accent-cyan text-bg-primary px-5 py-2 rounded text-sm font-medium no-underline hover:opacity-90 transition-opacity"
                >
                  View Updated Map
                </Link>
              )}
              <button
                onClick={() => exportGenerationReport(corpus, exemplars, candidates, zoneCenter)}
                className="border border-border-line text-text-primary px-5 py-2 rounded text-sm hover:border-accent-cyan/50 transition-colors"
              >
                Export Report
              </button>
              <button
                onClick={() => { setStep(1); setCandidates([]); setSaved(false); setGenError(null); }}
                className="border border-border-line text-text-muted px-5 py-2 rounded text-sm hover:border-accent-cyan/50 transition-colors"
              >
                Generate Again
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {candidates.map((candidate) => (
              <CandidateCard key={candidate.id} candidate={candidate} />
            ))}
          </div>
        </div>
        </ErrorBoundary>
      )}
    </div>
  );
}
