export function exportCorpusJSON(corpus) {
  const data = {
    id: corpus.id,
    name: corpus.name,
    domain: corpus.domain,
    categories: corpus.categories,
    embeddingModel: corpus.embeddingModel,
    documents: corpus.documents.map((d) => ({
      id: d.id,
      title: d.title,
      content: d.content,
      category: d.category,
    })),
    exportedAt: new Date().toISOString(),
  };

  downloadFile(
    JSON.stringify(data, null, 2),
    `${corpus.name.replace(/\s+/g, '_')}_corpus.json`,
    'application/json'
  );
}

export function exportNeighborsCSV(neighbors, sourceName) {
  const header = 'rank,id,title,category,similarity\n';
  const rows = neighbors
    .map((n, i) => `${i + 1},"${n.id}","${n.title || ''}","${n.category || ''}",${n.similarity.toFixed(4)}`)
    .join('\n');

  downloadFile(header + rows, `neighbors_${sourceName}.csv`, 'text/csv');
}

export function exportReportMarkdown(corpus, sections = {}) {
  const lines = [
    `# Corpus Report: ${corpus.name}`,
    '',
    `**Domain:** ${corpus.domain || 'Not specified'}`,
    `**Documents:** ${corpus.documents.length}`,
    `**Categories:** ${corpus.categories?.map((c) => c.name).join(', ') || 'None'}`,
    `**Embedding Model:** ${corpus.embeddingModel || 'voyage-3.5-lite'}`,
    `**Exported:** ${new Date().toISOString()}`,
    '',
  ];

  if (sections.clusters) {
    lines.push('## Cluster Analysis', '', sections.clusters, '');
  }

  if (sections.topPairs) {
    lines.push('## Top Neighbor Pairs', '');
    lines.push('| Document A | Document B | Similarity |');
    lines.push('|---|---|---|');
    for (const pair of sections.topPairs) {
      lines.push(`| ${pair.a} | ${pair.b} | ${pair.similarity.toFixed(4)} |`);
    }
    lines.push('');
  }

  if (sections.insights) {
    lines.push('## AI Insights', '', sections.insights, '');
  }

  downloadFile(
    lines.join('\n'),
    `${corpus.name.replace(/\s+/g, '_')}_report.md`,
    'text/markdown'
  );
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
