import { UMAP } from 'umap-js';
import { PCA } from 'ml-pca';

export async function reduceToPlot(embeddings, options = {}) {
  const {
    pcaDims = 50,
    nNeighbors = 15,
    minDist = 0.1,
    nEpochs = 200,
  } = options;

  // Convert to plain arrays if needed
  const matrix = embeddings.map((e) =>
    e instanceof Float32Array ? Array.from(e) : e
  );

  // Step 1: PCA to reduce dimensions (if embedding dim > pcaDims)
  let reduced = matrix;
  if (matrix[0].length > pcaDims) {
    const pca = new PCA(matrix);
    reduced = pca.predict(matrix, { nComponents: pcaDims }).to2DArray();
  }

  // Step 2: UMAP to 2D
  const nSamples = reduced.length;
  const effectiveNeighbors = Math.min(nNeighbors, Math.max(2, nSamples - 1));

  const umap = new UMAP({
    nNeighbors: effectiveNeighbors,
    minDist,
    nComponents: 2,
    nEpochs: Math.min(nEpochs, nSamples < 50 ? 500 : nEpochs),
  });

  const coords2d = umap.fit(reduced);

  return {
    coords2d,
    umapModel: {
      nNeighbors: effectiveNeighbors,
      minDist,
      nComponents: 2,
      reduced, // PCA-reduced data needed for transform
    },
  };
}

export function transformNew(umapModel, newEmbeddings) {
  // Simple projection: find nearest neighbors in the PCA space and interpolate positions
  // This is a simplified approach since umap-js doesn't have a full transform method
  if (!umapModel || !umapModel.reduced) {
    throw new Error('UMAP model not available for transform');
  }

  // For now, use a simple nearest-neighbor interpolation in the reduced space
  const pcaDims = umapModel.reduced[0].length;
  const results = [];

  for (const emb of newEmbeddings) {
    const vec = emb instanceof Float32Array ? Array.from(emb) : emb;
    // Truncate or pad to PCA dims
    const truncated = vec.slice(0, pcaDims);

    // Find 5 nearest neighbors in PCA space
    const distances = umapModel.reduced.map((r, i) => {
      let dist = 0;
      for (let j = 0; j < truncated.length; j++) {
        const d = truncated[j] - (r[j] || 0);
        dist += d * d;
      }
      return { idx: i, dist };
    });

    distances.sort((a, b) => a.dist - b.dist);
    const nearest = distances.slice(0, 5);

    // Weighted average of nearest neighbors' 2D coordinates
    const totalWeight = nearest.reduce((s, n) => s + 1 / (n.dist + 1e-10), 0);
    let x = 0, y = 0;
    for (const n of nearest) {
      const w = (1 / (n.dist + 1e-10)) / totalWeight;
      // coords2d will be provided via the stored corpus
      x += w * (n.x || 0);
      y += w * (n.y || 0);
    }

    results.push([x, y]);
  }

  return results;
}
