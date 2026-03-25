import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCorpus } from '../lib/storage';
import { knn } from '../lib/knn';
import { analyze } from '../lib/api';
import { exportComparisonReport } from '../lib/export';
import InfoHint from '../components/ui/InfoHint';

export default function Comparator() {
  const { id } = useParams();
  const [corpus, setCorpus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [popA, setPopA] = useState('');
  const [popB, setPopB] = useState('');
  const [results, setResults] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [insight, setInsight] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [showSimilarityGuide, setShowSimilarityGuide] = useState(false);

  useEffect(() => {
    getCorpus(id).then((c) => {
      setCorpus(c);
      setLoading(false);
    });
  }, [id]);

  const categories = useMemo(() => {
    if (!corpus) return [];
    return [...new Set(corpus.documents.map((d) => d.category))].filter(Boolean);
  }, [corpus]);

  const runAnalysis = () => {
    if (!popA || !popB || !corpus) return;
    setAnalyzing(true);
    setResults(null);
    setInsight(null);

    const docsA = corpus.documents.filter((d) => d.category === popA);
    const docsB = corpus.documents.filter((d) => d.category === popB);

    const neighborRows = [];
    const similarities = [];

    for (const docA of docsA) {
      const neighbors = knn(docA.embedding, docsB, 25);
      for (const n of neighbors) {
        neighborRows.push({
          sourceId: docA.id,
          sourceTitle: docA.title || docA.id,
          neighborId: n.id,
          neighborTitle: n.title || n.id,
          similarity: n.similarity,
        });
        similarities.push(n.similarity);
      }
    }

    neighborRows.sort((a, b) => b.similarity - a.similarity);
    setResults({ neighborRows, similarities, docsA, docsB });
    setAnalyzing(false);
  };

  const runInsight = async () => {
    if (!results) return;
    setInsightLoading(true);
    try {
      const sampleA = results.docsA.slice(0, 5).map((d) => d.content?.slice(0, 300));
      const sampleB = results.docsB.slice(0, 5).map((d) => d.content?.slice(0, 300));
      const resp = await analyze({
        populationA: { name: popA, samples: sampleA },
        populationB: { name: popB, samples: sampleB },
        avgSimilarity: (results.similarities.reduce((a, b) => a + b, 0) / results.similarities.length).toFixed(3),
        domain: corpus.domain,
      });
      setInsight(resp.analysis);
    } catch (e) {
      setInsight('Error: ' + e.message);
    }
    setInsightLoading(false);
  };

  const exportCSV = () => {
    if (!results) return;
    const header = 'source_id,source_title,neighbor_id,neighbor_title,similarity\n';
    const rows = results.neighborRows
      .map((r) => `"${r.sourceId}","${r.sourceTitle}","${r.neighborId}","${r.neighborTitle}",${r.similarity.toFixed(4)}`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comparison_${popA}_vs_${popB}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold text-text-primary mb-2">Population Comparator</h1>
      <p className="text-text-muted mb-6">
        How similar are two document categories? For each document in Population A, this finds the 25 nearest neighbors in Population B and measures cosine similarity &mdash; revealing where populations overlap and where they diverge.
      </p>

      {/* Cosine similarity explainer */}
      <div className="mb-6">
        <button
          onClick={() => setShowSimilarityGuide(!showSimilarityGuide)}
          className="text-sm text-text-muted hover:text-accent-cyan transition-colors flex items-center gap-1"
        >
          <span>{showSimilarityGuide ? '\u25BC' : '\u25B6'}</span>
          What is cosine similarity and why does it matter?
        </button>
        {showSimilarityGuide && (
          <div className="mt-3 bg-bg-surface border border-border-line rounded-lg p-5 text-sm text-text-muted leading-relaxed space-y-3">
            <p>
              <strong className="text-text-primary">Cosine similarity</strong> measures the angle between two document vectors in semantic space.
              It ranges from 0 to 1:
            </p>
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-bg-raised rounded p-2 text-center">
                <div className="text-success font-mono font-medium">0.8&ndash;1.0</div>
                <div className="text-xs text-success">Very Similar</div>
                <div className="text-[10px] mt-1">Nearly identical meaning</div>
              </div>
              <div className="bg-bg-raised rounded p-2 text-center">
                <div className="text-accent-cyan font-mono font-medium">0.6&ndash;0.8</div>
                <div className="text-xs text-accent-cyan">Related</div>
                <div className="text-[10px] mt-1">Same topic/theme</div>
              </div>
              <div className="bg-bg-raised rounded p-2 text-center">
                <div className="text-warning font-mono font-medium">0.3&ndash;0.6</div>
                <div className="text-xs text-warning">Loosely Related</div>
                <div className="text-[10px] mt-1">Some overlap</div>
              </div>
              <div className="bg-bg-raised rounded p-2 text-center">
                <div className="text-error font-mono font-medium">0.0&ndash;0.3</div>
                <div className="text-xs text-error">Unrelated</div>
                <div className="text-[10px] mt-1">Different domains</div>
              </div>
            </div>
            <p>
              Unlike simple word overlap, cosine similarity captures <em>semantic</em> relationships.
              Two documents about "revenue growth" and "fiscal performance" can score 0.85+ even with zero shared words.
              This makes it powerful for discovering non-obvious connections between documents.
            </p>
          </div>
        )}
      </div>

      {categories.length < 2 ? (
        <div className="bg-bg-surface border border-border-line rounded-lg p-8 text-center">
          <p className="text-text-muted mb-2">Your corpus needs at least 2 categories to compare populations.</p>
          <p className="text-text-muted text-sm mb-4">
            When creating a corpus, map a "Category" column to split documents into groups.
          </p>
          <Link
            to={`/corpus/${id}/explore`}
            className="text-accent-cyan text-sm no-underline hover:opacity-80"
          >
            &larr; Back to Explorer
          </Link>
        </div>
      ) : (
        <>
          <div className="flex items-end gap-4 mb-8">
            <div>
              <label className="block text-sm text-text-muted mb-1">
                Population A
                <InfoHint text="The source population. For each document here, we find its 25 closest semantic matches in Population B. Choose the population you're most curious about." />
              </label>
              <select
                value={popA}
                onChange={(e) => setPopA(e.target.value)}
                className="bg-bg-raised border border-border-line rounded px-3 py-2 text-text-primary"
              >
                <option value="">Select category...</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1">
                Population B
                <InfoHint text="The comparison population. We search for neighbors of A's documents within B. This is directional: A\u2192B may differ from B\u2192A." />
              </label>
              <select
                value={popB}
                onChange={(e) => setPopB(e.target.value)}
                className="bg-bg-raised border border-border-line rounded px-3 py-2 text-text-primary"
              >
                <option value="">Select category...</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <button
              onClick={runAnalysis}
              disabled={!popA || !popB || popA === popB || analyzing}
              className="bg-accent-cyan text-bg-primary px-6 py-2 rounded font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              {analyzing ? 'Analyzing...' : 'Run Analysis'}
            </button>
          </div>

          {results && (
            <div>
              {/* Similarity distribution */}
              <div className="bg-bg-surface border border-border-line rounded-lg p-6 mb-6">
                <h3 className="text-text-primary font-medium mb-1">
                  Similarity Distribution
                  <InfoHint text="This histogram shows how cross-population cosine similarities are distributed. A peak near 1.0 means many documents in A have close semantic matches in B. A peak near 0.3 means the populations are quite different." />
                </h3>
                <p className="text-text-muted text-xs mb-4">
                  Each bar represents a similarity range. Taller bars = more document pairs with that similarity level.
                </p>
                <div className="flex items-end gap-1 h-32">
                  {(() => {
                    const bins = Array(20).fill(0);
                    results.similarities.forEach((s) => {
                      const idx = Math.min(Math.floor(s * 20), 19);
                      bins[idx]++;
                    });
                    const maxBin = Math.max(...bins, 1);
                    return bins.map((count, i) => {
                      let barColor = 'bg-error/60 hover:bg-error';
                      if (i >= 12) barColor = 'bg-accent-cyan/60 hover:bg-accent-cyan';
                      else if (i >= 6) barColor = 'bg-warning/60 hover:bg-warning';
                      return (
                        <div
                          key={i}
                          className={`flex-1 rounded-t transition-colors cursor-help ${barColor}`}
                          style={{ height: `${(count / maxBin) * 100}%` }}
                          title={`Similarity ${(i / 20).toFixed(2)}\u2013${((i + 1) / 20).toFixed(2)}: ${count} pairs`}
                        />
                      );
                    });
                  })()}
                </div>
                <div className="flex justify-between text-xs text-text-muted mt-1 font-mono">
                  <span className="text-error">0.0 (unrelated)</span>
                  <span className="text-warning">0.5</span>
                  <span className="text-accent-cyan">1.0 (identical)</span>
                </div>
                <div className="mt-3 text-sm text-text-muted">
                  Mean similarity: <span className="text-text-primary font-mono">
                    {(results.similarities.reduce((a, b) => a + b, 0) / results.similarities.length).toFixed(4)}
                  </span>
                  {' | '}
                  Pairs analyzed: <span className="text-text-primary font-mono">{results.neighborRows.length.toLocaleString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mb-6 items-start">
                <div>
                  <button
                    onClick={runInsight}
                    disabled={insightLoading}
                    className="bg-accent-gold text-bg-primary px-4 py-2 rounded font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
                  >
                    {insightLoading ? 'Analyzing...' : 'AI Insight'}
                  </button>
                  <p className="text-text-muted text-[10px] mt-1 max-w-[200px]">
                    Claude reads samples from both populations and explains what distinguishes them.
                  </p>
                </div>
                <div>
                  <button
                    onClick={exportCSV}
                    className="border border-border-line text-text-primary px-4 py-2 rounded hover:border-accent-cyan/50 transition-colors"
                  >
                    Export CSV
                  </button>
                  <p className="text-text-muted text-[10px] mt-1 max-w-[200px]">
                    Downloads all document pairs with similarity scores. Open in Excel or use for further analysis.
                  </p>
                </div>
                <div>
                  <button
                    onClick={() => exportComparisonReport(corpus, popA, popB, results, insight)}
                    className="border border-border-line text-text-primary px-4 py-2 rounded hover:border-accent-cyan/50 transition-colors"
                  >
                    Full Report
                  </button>
                  <p className="text-text-muted text-[10px] mt-1 max-w-[200px]">
                    Markdown report with stats, top pairs, distribution, and AI insight (if generated).
                  </p>
                </div>
              </div>

              {/* AI Insight */}
              {insight && (
                <div className="bg-bg-raised border border-accent-gold/30 rounded-lg p-6 mb-6">
                  <h3 className="text-accent-gold font-medium mb-2">AI Insight</h3>
                  <p className="text-text-primary text-sm whitespace-pre-wrap">{insight}</p>
                </div>
              )}

              {/* Neighbor table */}
              <div className="bg-bg-surface border border-border-line rounded-lg overflow-hidden">
                <div className="px-4 py-2 border-b border-border-line bg-bg-raised flex items-center justify-between">
                  <p className="text-text-muted text-xs">
                    Top document pairs ranked by cosine similarity. Higher scores = more semantically similar content.
                  </p>
                </div>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-bg-raised sticky top-0">
                      <tr>
                        <th className="text-left px-4 py-2 text-text-muted font-medium">Source ({popA})</th>
                        <th className="text-left px-4 py-2 text-text-muted font-medium">Neighbor ({popB})</th>
                        <th className="text-right px-4 py-2 text-text-muted font-medium">
                          Similarity
                          <InfoHint text="Cosine similarity from 0 to 1. Values above 0.8 indicate very strong semantic overlap between these two documents." position="left" />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.neighborRows.slice(0, 100).map((row, i) => {
                        let simColor = 'text-error';
                        if (row.similarity >= 0.8) simColor = 'text-success';
                        else if (row.similarity >= 0.6) simColor = 'text-accent-cyan';
                        else if (row.similarity >= 0.4) simColor = 'text-warning';
                        return (
                          <tr key={i} className="border-t border-border-line hover:bg-bg-raised/50">
                            <td className="px-4 py-2 text-text-primary">{row.sourceTitle}</td>
                            <td className="px-4 py-2 text-text-primary">{row.neighborTitle}</td>
                            <td className={`px-4 py-2 text-right font-mono ${simColor}`}>{row.similarity.toFixed(4)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {results.neighborRows.length > 100 && (
                  <div className="px-4 py-2 text-xs text-text-muted border-t border-border-line">
                    Showing 100 of {results.neighborRows.length.toLocaleString()} pairs. Use Export CSV for the complete dataset.
                  </div>
                )}
              </div>

              {/* Session end: next steps */}
              <div className="mt-6 bg-bg-surface border border-border-line rounded-lg p-5">
                <h3 className="text-text-primary font-medium mb-2">Next Steps</h3>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/corpus/${id}/explore`}
                    className="text-text-muted text-sm no-underline border border-border-line px-4 py-2 rounded hover:border-accent-cyan/50 transition-colors"
                  >
                    &larr; Back to Explorer
                  </Link>
                  <Link
                    to={`/corpus/${id}/generate`}
                    className="text-accent-cyan text-sm no-underline border border-accent-cyan/30 px-4 py-2 rounded hover:bg-accent-cyan/10 transition-colors"
                  >
                    Generate documents targeting {popA} zone &rarr;
                  </Link>
                </div>
                <p className="text-text-muted text-[10px] mt-2">
                  Use what you learned here to guide generation: target the semantic zone of one population and create more documents like it.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
