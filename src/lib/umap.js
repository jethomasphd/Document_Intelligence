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
  let pcaModel = null;
  if (matrix[0].length > pcaDims) {
    pcaModel = new PCA(matrix);
    reduced = pcaModel.predict(matrix, { nComponents: pcaDims }).to2DArray();
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
      reduced,   // PCA-reduced data needed for transform
      coords2d,  // 2D coordinates for neighbor interpolation
      pcaMean: pcaModel ? Array.from(pcaModel.means) : null,
      pcaLoadings: pcaModel
        ? pcaModel.getLoadings().to2DArray().map((row) => row.slice(0, pcaDims))
        : null,
      pcaDims,
    },
  };
}

export function transformNew(umapModel, newEmbeddings) {
  if (!umapModel || !umapModel.reduced || !umapModel.coords2d) {
    throw new Error('UMAP model not available for transform');
  }

  const { reduced, coords2d, pcaMean, pcaLoadings, pcaDims } = umapModel;
  const results = [];

  for (const emb of newEmbeddings) {
    const vec = emb instanceof Float32Array ? Array.from(emb) : emb;

    // Project new embedding through PCA if the original data was PCA-reduced
    let projected;
    if (pcaMean && pcaLoadings) {
      const centered = vec.map((v, i) => v - (pcaMean[i] || 0));
      projected = new Array(pcaDims).fill(0);
      for (let d = 0; d < pcaDims; d++) {
        for (let i = 0; i < centered.length; i++) {
          projected[d] += centered[i] * (pcaLoadings[i]?.[d] || 0);
        }
      }
    } else {
      projected = vec.slice(0, reduced[0].length);
    }

    // Find 5 nearest neighbors in PCA-reduced space
    const distances = reduced.map((r, i) => {
      let dist = 0;
      for (let j = 0; j < projected.length; j++) {
        const d = projected[j] - (r[j] || 0);
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
      x += w * coords2d[n.idx][0];
      y += w * coords2d[n.idx][1];
    }

    results.push([x, y]);
  }

  return results;
}
