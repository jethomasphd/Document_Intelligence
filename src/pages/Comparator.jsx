import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { getCorpus } from '../lib/storage';
import { knn } from '../lib/knn';
import { analyze } from '../lib/api';
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
      <p className="text-text-muted mb-8">
        Select two document categories to compare their semantic relationship.
        For each document in Population A, this finds the 25 nearest neighbors in Population B and measures cosine similarity.
      </p>

      {categories.length < 2 ? (
        <div className="bg-bg-surface border border-border-line rounded-lg p-8 text-center">
          <p className="text-text-muted mb-2">Your corpus needs at least 2 categories to compare populations.</p>
          <p className="text-text-muted text-sm">
            When creating a corpus, map a "Category" column to split documents into groups.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-end gap-4 mb-8">
            <div>
              <label className="block text-sm text-text-muted mb-1">
                Population A
                <InfoHint text="The source population. For each document here, we find its closest matches in Population B." />
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
                <InfoHint text="The target population to find neighbors in." />
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
                  <InfoHint text="Shows how cosine similarities are distributed across all cross-population neighbor pairs. A peak near 1.0 means the populations share very similar language. A peak near 0.3-0.5 means they're semantically distinct." />
                </h3>
                <p className="text-text-muted text-xs mb-4">Each bar represents a similarity range. Taller bars = more document pairs in that range.</p>
                <div className="flex items-end gap-1 h-32">
                  {(() => {
                    const bins = Array(20).fill(0);
                    results.similarities.forEach((s) => {
                      const idx = Math.min(Math.floor(s * 20), 19);
                      bins[idx]++;
                    });
                    const maxBin = Math.max(...bins, 1);
                    return bins.map((count, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-accent-cyan/60 rounded-t hover:bg-accent-cyan transition-colors cursor-help"
                        style={{ height: `${(count / maxBin) * 100}%` }}
                        title={`Similarity ${(i / 20).toFixed(2)}–${((i + 1) / 20).toFixed(2)}: ${count} pairs`}
                      />
                    ));
                  })()}
                </div>
                <div className="flex justify-between text-xs text-text-muted mt-1 font-mono">
                  <span>0.0 (different)</span>
                  <span>0.5</span>
                  <span>1.0 (identical)</span>
                </div>
                <div className="mt-3 text-sm text-text-muted">
                  Mean similarity: <span className="text-text-primary font-mono">
                    {(results.similarities.reduce((a, b) => a + b, 0) / results.similarities.length).toFixed(4)}
                  </span>
                  {' | '}
                  Pairs analyzed: <span className="text-text-primary font-mono">{results.neighborRows.length}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={runInsight}
                  disabled={insightLoading}
                  className="bg-accent-gold text-bg-primary px-4 py-2 rounded font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
                >
                  {insightLoading ? 'Analyzing...' : 'AI Insight'}
                </button>
                <button
                  onClick={exportCSV}
                  className="border border-border-line text-text-primary px-4 py-2 rounded hover:border-accent-cyan/50 transition-colors"
                >
                  Export CSV
                </button>
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
                <div className="px-4 py-2 border-b border-border-line bg-bg-raised">
                  <p className="text-text-muted text-xs">
                    Top document pairs ranked by cosine similarity. Higher similarity = more semantically similar content.
                  </p>
                </div>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-bg-raised sticky top-0">
                      <tr>
                        <th className="text-left px-4 py-2 text-text-muted font-medium">Source ({popA})</th>
                        <th className="text-left px-4 py-2 text-text-muted font-medium">Neighbor ({popB})</th>
                        <th className="text-right px-4 py-2 text-text-muted font-medium">Similarity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.neighborRows.slice(0, 100).map((row, i) => (
                        <tr key={i} className="border-t border-border-line hover:bg-bg-raised/50">
                          <td className="px-4 py-2 text-text-primary">{row.sourceTitle}</td>
                          <td className="px-4 py-2 text-text-primary">{row.neighborTitle}</td>
                          <td className="px-4 py-2 text-right font-mono text-accent-cyan">{row.similarity.toFixed(4)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {results.neighborRows.length > 100 && (
                  <div className="px-4 py-2 text-xs text-text-muted border-t border-border-line">
                    Showing 100 of {results.neighborRows.length} pairs. Export CSV for the full dataset.
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
