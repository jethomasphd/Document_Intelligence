import { useMemo } from 'react';
import Plot from 'react-plotly.js';

const PLOT_COLORS = ['#00d4ff', '#f0a500', '#10b981', '#a855f7', '#f43f5e', '#3b82f6', '#84cc16', '#fb923c'];

export default function MiniMap({ corpus, onPointSelect, onLassoSelect, candidates = [] }) {
  const traces = useMemo(() => {
    if (!corpus?.coords2d) return [];

    const categoryMap = {};
    corpus.documents.forEach((doc, i) => {
      const cat = doc.category || 'Uncategorized';
      if (!categoryMap[cat]) categoryMap[cat] = { x: [], y: [], text: [], indices: [] };
      categoryMap[cat].x.push(corpus.coords2d[i][0]);
      categoryMap[cat].y.push(corpus.coords2d[i][1]);
      categoryMap[cat].text.push(doc.title || doc.id);
      categoryMap[cat].indices.push(i);
    });

    const colorAssignment = {};
    if (corpus.categories) {
      corpus.categories.forEach((c) => { colorAssignment[c.name] = c.color; });
    }

    const catNames = Object.keys(categoryMap);
    const corpusTraces = catNames.map((cat, ci) => ({
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
        size: 5,
        opacity: 0.6,
      },
    }));

    // Add candidate points
    if (candidates.length > 0) {
      corpusTraces.push({
        x: candidates.map((c) => c.coords[0]),
        y: candidates.map((c) => c.coords[1]),
        text: candidates.map((c) => c.title || 'Generated'),
        type: 'scatter',
        mode: 'markers',
        name: 'Generated',
        hoverinfo: 'text',
        marker: {
          color: '#f0a500',
          size: 12,
          symbol: 'star',
          line: { color: '#fff', width: 1 },
        },
      });
    }

    return corpusTraces;
  }, [corpus?.coords2d, corpus?.documents, corpus?.categories, candidates]);

  if (!corpus?.coords2d) {
    return (
      <div className="bg-bg-surface border border-border-line rounded-lg p-8 text-center">
        <p className="text-text-muted">No map data available. Visit the Explorer first to compute UMAP projection.</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-surface border border-border-line rounded-lg overflow-hidden">
      <Plot
        data={traces}
        layout={{
          paper_bgcolor: '#111827',
          plot_bgcolor: '#0a0d14',
          font: { family: 'DM Sans', color: '#64748b', size: 10 },
          margin: { l: 20, r: 20, t: 20, b: 20 },
          xaxis: { showgrid: false, zeroline: false, showticklabels: false },
          yaxis: { showgrid: false, zeroline: false, showticklabels: false },
          legend: {
            bgcolor: 'rgba(17,24,39,0.8)',
            font: { color: '#e2e8f0', size: 10 },
            bordercolor: '#1e2d45',
            borderwidth: 1,
          },
          dragmode: 'lasso',
          hovermode: 'closest',
          height: 400,
        }}
        config={{
          responsive: true,
          displaylogo: false,
          modeBarButtonsToRemove: ['autoScale2d', 'resetScale2d'],
        }}
        style={{ width: '100%' }}
        onClick={(data) => {
          if (data.points && data.points[0]) {
            const idx = data.points[0].customdata;
            if (idx !== undefined) onPointSelect(idx);
          }
        }}
        onSelected={(data) => {
          if (data && data.points) {
            const indices = data.points.map((p) => p.customdata).filter((i) => i !== undefined);
            if (indices.length > 0) onLassoSelect(indices);
          }
        }}
      />
    </div>
  );
}
