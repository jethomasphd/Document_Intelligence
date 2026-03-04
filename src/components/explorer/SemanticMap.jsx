import { useEffect, useState, useMemo } from 'react';
import Plot from 'react-plotly.js';
import { reduceToPlot } from '../../lib/umap';
import { saveCorpus } from '../../lib/storage';
import useStore from '../../store';

const PLOT_COLORS = ['#00d4ff', '#f0a500', '#10b981', '#a855f7', '#f43f5e', '#3b82f6', '#84cc16', '#fb923c'];

export default function SemanticMap({ corpus, setCorpus }) {
  const [computing, setComputing] = useState(false);
  const setSelectedPoint = useStore((s) => s.setSelectedPoint);
  const setLassoSelection = useStore((s) => s.setLassoSelection);

  useEffect(() => {
    if (corpus && !corpus.coords2d && !computing) {
      computeUMAP();
    }
  }, [corpus]);

  const computeUMAP = async () => {
    if (!corpus || corpus.documents.length < 3) return;
    setComputing(true);

    try {
      const embeddings = corpus.documents.map((d) => d.embedding);
      const { coords2d, umapModel } = await reduceToPlot(embeddings);

      const updated = { ...corpus, coords2d, umapModel };
      setCorpus(updated);
      await saveCorpus(updated);
    } catch (e) {
      console.error('UMAP computation failed:', e);
    }

    setComputing(false);
  };

  const { traces, allIndices } = useMemo(() => {
    if (!corpus?.coords2d) return { traces: [], allIndices: [] };

    const categoryMap = {};
    const allIdx = [];

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
      allIdx.push(i);
    });

    const catNames = Object.keys(categoryMap);
    const colorAssignment = {};
    if (corpus.categories) {
      corpus.categories.forEach((c) => {
        colorAssignment[c.name] = c.color;
      });
    }

    return {
      traces: catNames.map((cat, ci) => ({
        x: categoryMap[cat].x,
        y: categoryMap[cat].y,
        text: categoryMap[cat].text,
        customdata: categoryMap[cat].indices,
        type: 'scatter',
        mode: 'markers',
        name: cat,
        hoverinfo: 'text',
        marker: {
          color: colorAssignment[cat] || PLOT_COLORS[ci % PLOT_COLORS.length],
          size: 6,
          opacity: 0.8,
        },
      })),
      allIndices: allIdx,
    };
  }, [corpus?.coords2d, corpus?.documents, corpus?.categories]);

  if (computing) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-text-primary mb-2">Computing UMAP projection...</div>
          <p className="text-text-muted text-sm">This may take a moment for large corpora.</p>
          <div className="mt-4 w-48 mx-auto h-1 bg-bg-raised rounded overflow-hidden">
            <div className="h-full bg-accent-cyan rounded animate-pulse w-full" />
          </div>
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
