export function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export function knn(query, docs, k = 10, categoryFilter = null) {
  // query can be an embedding array or a doc object with .embedding
  const queryEmb = Array.isArray(query) || query instanceof Float32Array ? query : query.embedding;

  const scored = docs
    .filter((d) => d.embedding && (!categoryFilter || d.category === categoryFilter))
    .map((d) => ({
      ...d,
      similarity: cosineSimilarity(queryEmb, d.embedding),
    }));

  scored.sort((a, b) => b.similarity - a.similarity);

  // Skip self-matches (similarity ~1.0 and same id)
  const results = [];
  for (const item of scored) {
    if (results.length >= k) break;
    // Skip if it's probably the query itself
    if (item.similarity > 0.9999) continue;
    results.push(item);
  }

  return results.length > 0 ? results : scored.slice(0, k);
}

export function zoneCentroid(docs) {
  if (docs.length === 0) return null;

  const dim = docs[0].embedding.length;
  const centroid = new Float32Array(dim);

  for (const doc of docs) {
    for (let i = 0; i < dim; i++) {
      centroid[i] += doc.embedding[i];
    }
  }

  for (let i = 0; i < dim; i++) {
    centroid[i] /= docs.length;
  }

  return centroid;
}
