export function exportCorpusJSON(corpus) {
  const data = {
    id: corpus.id,
    name: corpus.name,
    domain: corpus.domain,
    categories: corpus.categories,
    embeddingModel: corpus.embeddingModel,
    documentCount: corpus.documents.length,
    documents: corpus.documents.map((d) => ({
      id: d.id,
      title: d.title,
      content: d.content,
      category: d.category,
      embedding: d.embedding ? Array.from(d.embedding) : null,
    })),
    exportedAt: new Date().toISOString(),
  };

  downloadFile(
    JSON.stringify(data),
    `${sanitize(corpus.name)}_corpus_with_embeddings.json`,
    'application/json'
  );
}

export function exportNeighborsCSV(neighbors, sourceName) {
  const header = 'rank,id,title,category,similarity\n';
  const rows = neighbors
    .map((n, i) => `${i + 1},"${esc(n.id)}","${esc(n.title || '')}","${esc(n.category || '')}",${n.similarity.toFixed(4)}`)
    .join('\n');

  downloadFile(header + rows, `neighbors_${sanitize(sourceName)}.csv`, 'text/csv');
}

export function exportCategoryNeighborsCSV(corpus, categoryName, knnFn, k = 25) {
  const catDocs = corpus.documents.filter((d) => d.category === categoryName);
  const otherDocs = corpus.documents.filter((d) => d.category !== categoryName);
  if (catDocs.length === 0 || otherDocs.length === 0) return;

  // Collect unique neighbors across all docs in category
  const neighborMap = new Map();
  for (const doc of catDocs) {
    const neighbors = knnFn(doc.embedding, otherDocs, k);
    for (const n of neighbors) {
      const existing = neighborMap.get(n.id);
      if (!existing || n.similarity > existing.bestSimilarity) {
        neighborMap.set(n.id, {
          id: n.id,
          title: n.title || '',
          category: n.category || '',
          content: (n.content || '').slice(0, 200),
          bestSimilarity: n.similarity,
          sourceCount: (existing?.sourceCount || 0) + 1,
          bestSourceTitle: doc.title || doc.id,
        });
      } else {
        existing.sourceCount++;
      }
    }
  }

  const unique = [...neighborMap.values()].sort((a, b) => b.bestSimilarity - a.bestSimilarity);

  const header = 'id,title,category,best_similarity,source_count,best_source,content_preview\n';
  const rows = unique
    .map((n) => `"${esc(n.id)}","${esc(n.title)}","${esc(n.category)}",${n.bestSimilarity.toFixed(4)},${n.sourceCount},"${esc(n.bestSourceTitle)}","${esc(n.content)}"`)
    .join('\n');

  downloadFile(
    header + rows,
    `${sanitize(categoryName)}_unique_neighbors_k${k}.csv`,
    'text/csv'
  );

  return unique.length;
}

export function exportPointNeighborsCSV(neighbors, sourceDoc, k = 25) {
  const header = 'rank,id,title,category,similarity,content_preview\n';
  const rows = neighbors.slice(0, k)
    .map((n, i) => `${i + 1},"${esc(n.id)}","${esc(n.title || '')}","${esc(n.category || '')}",${n.similarity.toFixed(4)},"${esc((n.content || '').slice(0, 200))}"`)
    .join('\n');

  downloadFile(
    header + rows,
    `neighbors_top${k}_${sanitize(sourceDoc.title || sourceDoc.id)}.csv`,
    'text/csv'
  );
}

export function exportComparisonReport(corpus, popA, popB, results, insight) {
  const avgSim = results.similarities.reduce((a, b) => a + b, 0) / results.similarities.length;

  const lines = [
    `# Comparison Report: ${popA} vs ${popB}`,
    '',
    `**Corpus:** ${corpus.name}`,
    `**Domain:** ${corpus.domain || 'Not specified'}`,
    `**Population A:** ${popA} (${results.docsA.length} documents)`,
    `**Population B:** ${popB} (${results.docsB.length} documents)`,
    `**Mean Cross-Similarity:** ${avgSim.toFixed(4)}`,
    `**Total Pairs Analyzed:** ${results.neighborRows.length}`,
    `**Exported:** ${new Date().toISOString()}`,
    '',
  ];

  if (insight) {
    lines.push('## AI Insight', '', insight, '');
  }

  lines.push('## Top 50 Most Similar Pairs', '');
  lines.push('| Source | Neighbor | Similarity |');
  lines.push('|---|---|---|');
  for (const row of results.neighborRows.slice(0, 50)) {
    lines.push(`| ${row.sourceTitle} | ${row.neighborTitle} | ${row.similarity.toFixed(4)} |`);
  }
  lines.push('');

  // Distribution summary
  const bins = Array(10).fill(0);
  results.similarities.forEach((s) => {
    bins[Math.min(Math.floor(s * 10), 9)]++;
  });
  lines.push('## Similarity Distribution', '');
  lines.push('| Range | Count | Percentage |');
  lines.push('|---|---|---|');
  for (let i = 0; i < 10; i++) {
    const pct = ((bins[i] / results.similarities.length) * 100).toFixed(1);
    lines.push(`| ${(i / 10).toFixed(1)}–${((i + 1) / 10).toFixed(1)} | ${bins[i]} | ${pct}% |`);
  }
  lines.push('');

  downloadFile(
    lines.join('\n'),
    `comparison_${sanitize(popA)}_vs_${sanitize(popB)}_report.md`,
    'text/markdown'
  );
}

export function exportGenerationReport(corpus, exemplars, candidates, zoneCenter) {
  const accepted = candidates.filter((c) => c.accepted);
  const verified = candidates.filter((c) => c.verified);
  const onTarget = verified.filter((c) => c.placement === 'on-target');

  const lines = [
    `# Generation Report`,
    '',
    `**Corpus:** ${corpus.name}`,
    `**Domain:** ${corpus.domain || 'Not specified'}`,
    `**Exported:** ${new Date().toISOString()}`,
    '',
    `## Target Zone`,
    `**Exemplars:** ${exemplars.length}`,
    '',
    ...exemplars.map((e, i) => `${i + 1}. **${e.title || e.id}** (sim: ${e.similarity?.toFixed(3) || '—'}) — ${(e.content || '').slice(0, 100)}...`),
    '',
    `## Results Summary`,
    `- **Generated:** ${candidates.length}`,
    `- **Verified:** ${verified.length}`,
    `- **On Target:** ${onTarget.length}`,
    `- **Accepted:** ${accepted.length}`,
    '',
  ];

  if (accepted.length > 0) {
    lines.push('## Accepted Documents', '');
    for (const c of accepted) {
      lines.push(`### ${c.title || 'Untitled'}`, '');
      lines.push(`**Similarity:** ${c.similarity?.toFixed(3) || '—'} | **Placement:** ${c.placement || '—'}`, '');
      lines.push(c.content, '');
      if (c.rationale) lines.push(`> *${c.rationale}*`, '');
      lines.push('---', '');
    }
  }

  if (verified.length > accepted.length) {
    lines.push('## Other Verified Candidates', '');
    for (const c of verified.filter((v) => !v.accepted)) {
      lines.push(`- **${c.title || 'Untitled'}** (sim: ${c.similarity?.toFixed(3)}, ${c.placement})`);
    }
    lines.push('');
  }

  downloadFile(
    lines.join('\n'),
    `generation_report_${sanitize(corpus.name)}.md`,
    'text/markdown'
  );
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
    `${sanitize(corpus.name)}_report.md`,
    'text/markdown'
  );
}

function esc(str) {
  return String(str).replace(/"/g, '""').replace(/\n/g, ' ');
}

function sanitize(str) {
  return String(str).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);
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
