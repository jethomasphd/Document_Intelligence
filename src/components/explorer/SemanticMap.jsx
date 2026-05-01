import { useEffect, useRef, useState, useMemo } from 'react';
import Plot from 'react-plotly.js';
import { reduceToPlot } from '../../lib/umap';
import { saveCorpus } from '../../lib/storage';
import useStore from '../../store';

const PLOT_COLORS = ['#00d4ff', '#f0a500', '#10b981', '#a855f7', '#f43f5e', '#3b82f6', '#84cc16', '#fb923c'];

// Beyond this many points, switch from SVG scatter to WebGL. SVG falls over
// past a few thousand markers; scattergl handles 100K+ smoothly.
const SCATTERGL_THRESHOLD = 1500;

export default function SemanticMap({ corpus, setCorpus }) {
  const [computing, setComputing] = useState(false);
  const [progress, setProgress] = useState(null);
  const computingRef = useRef(false);
  const setSelectedPoint = useStore((s) => s.setSelectedPoint);
  const setLassoSelection = useStore((s) => s.setLassoSelection);

  useEffect(() => {
    if (corpus && !corpus.coords2d && !computingRef.current) {
      computeUMAP();
    }
  }, [corpus]);

  const computeUMAP = async () => {
    if (!corpus || corpus.documents.length < 3) return;
    computingRef.current = true;
    setComputing(true);
    setProgress({ phase: 'preparing', value: 0, total: 1 });

    // Yield once so React flushes the "computing" UI before we enter the
    // synchronous PCA / UMAP-init phase. Without this the loading state
    // never paints for large corpora.
    await new Promise((r) => setTimeout(r, 0));

    try {
      const embeddings = corpus.documents.map((d) => d.embedding);
      const { coords2d, umapModel } = await reduceToPlot(embeddings, {
        onProgress: (p) => setProgress(p),
      });

      const updated = { ...corpus, coords2d, umapModel };
      setCorpus(updated);
      await saveCorpus(updated);
    } catch (e) {
      console.error('UMAP computation failed:', e);
    }

    computingRef.current = false;
    setComputing(false);
    setProgress(null);
  };

  const selectedPoint = useStore((s) => s.selectedPoint);

  const traces = useMemo(() => {
    if (!corpus?.coords2d) return [];

    const nPoints = corpus.documents.length;
    const useGL = nPoints > SCATTERGL_THRESHOLD;
    const traceType = useGL ? 'scattergl' : 'scatter';
    const markerSize = nPoints > 5000 ? 4 : nPoints > 2000 ? 5 : 6;
    const markerOpacity = nPoints > 5000 ? 0.6 : 0.8;

    const categoryMap = {};

    corpus.documents.forEach((doc, i) => {
      const cat = doc.category || 'Uncategorized';
      if (!categoryMap[cat]) categoryMap[cat] = { x: [], y: [], text: [], ids: [], indices: [] };
      categoryMap[cat].x.push(corpus.coords2d[i][0]);
      categoryMap[cat].y.push(corpus.coords2d[i][1]);
      categoryMap[cat].text.push(
        `<b>${doc.title || doc.id}</b><br>${(doc.content || '').slice(0, 100)}...`
      );
      categoryMap[cat].ids.push(doc.id);
      categoryMap[cat].indices.push(i);
    });

    const catNames = Object.keys(categoryMap);
    const colorAssignment = {};
    if (corpus.categories) {
      corpus.categories.forEach((c) => {
        colorAssignment[c.name] = c.color;
      });
    }

    const result = catNames.map((cat, ci) => ({
      x: categoryMap[cat].x,
      y: categoryMap[cat].y,
      text: categoryMap[cat].text,
      customdata: categoryMap[cat].indices,
      type: traceType,
      mode: 'markers',
      name: cat,
      hoverinfo: 'text',
      marker: {
        color: colorAssignment[cat] || PLOT_COLORS[ci % PLOT_COLORS.length],
        size: markerSize,
        opacity: markerOpacity,
      },
    }));

    // Highlight selected point with a red ring
    if (selectedPoint) {
      const idx = corpus.documents.findIndex((d) => d.id === selectedPoint.id);
      if (idx >= 0 && corpus.coords2d[idx]) {
        result.push({
          x: [corpus.coords2d[idx][0]],
          y: [corpus.coords2d[idx][1]],
          text: [`<b>SELECTED:</b> ${selectedPoint.title || selectedPoint.id}`],
          type: traceType,
          mode: 'markers',
          name: 'Selected',
          hoverinfo: 'text',
          showlegend: false,
          marker: {
            color: 'rgba(0,0,0,0)',
            size: 16,
            line: { color: '#ef4444', width: 3 },
          },
        });
      }
    }

    return result;
  }, [corpus?.coords2d, corpus?.documents, corpus?.categories, selectedPoint]);

  if (computing) {
    const phaseLabel = {
      preparing: 'Preparing embeddings...',
      pca: 'Reducing dimensions (PCA)...',
      umap: 'Optimizing 2D layout (UMAP)...',
    }[progress?.phase] || 'Computing UMAP projection...';

    const pct = progress && progress.total > 0
      ? Math.min(100, Math.round((progress.value / progress.total) * 100))
      : null;
    const isUmap = progress?.phase === 'umap';

    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-text-primary mb-2">{phaseLabel}</div>
          <p className="text-text-muted text-sm">
            {corpus.documents.length.toLocaleString()} documents — this may take a minute for large corpora.
          </p>
          <div className="mt-4 w-64 mx-auto h-1 bg-bg-raised rounded overflow-hidden">
            {isUmap && pct !== null ? (
              <div
                className="h-full bg-accent-cyan rounded transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            ) : (
              <div className="h-full bg-accent-cyan rounded animate-pulse w-full" />
            )}
          </div>
          {isUmap && pct !== null && (
            <p className="text-text-muted text-xs font-mono mt-2">
              epoch {progress.value} / {progress.total} ({pct}%)
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!corpus?.coords2d) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-text-muted">
          {corpus.documents.length < 3
            ? 'Need at least 3 documents for visualization'
            : 'No projection data available'}
        </div>
      </div>
    );
  }

  return (
    <Plot
      data={traces}
      layout={{
        paper_bgcolor: '#0a0d14',
        plot_bgcolor: '#0a0d14',
        font: { family: 'DM Sans', color: '#64748b' },
        margin: { l: 30, r: 30, t: 30, b: 30 },
        xaxis: {
          showgrid: false,
          zeroline: false,
          showticklabels: false,
        },
        yaxis: {
          showgrid: false,
          zeroline: false,
          showticklabels: false,
        },
        legend: {
          bgcolor: 'rgba(17,24,39,0.8)',
          font: { color: '#e2e8f0', size: 11 },
          bordercolor: '#1e2d45',
          borderwidth: 1,
        },
        dragmode: 'lasso',
        hovermode: 'closest',
        autosize: true,
      }}
      config={{
        responsive: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['autoScale2d', 'resetScale2d'],
      }}
      style={{ width: '100%', height: '100%' }}
      useResizeHandler
      onClick={(data) => {
        if (data.points && data.points[0]) {
          const pt = data.points[0];
          const idx = pt.customdata;
          if (idx !== undefined) {
            setSelectedPoint(corpus.documents[idx]);
          }
        }
      }}
      onSelected={(data) => {
        if (data && data.points) {
          const indices = data.points.map((p) => p.customdata).filter((i) => i !== undefined);
          setLassoSelection(indices);
        }
      }}
    />
  );
}
