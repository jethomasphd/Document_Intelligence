import { packEmbeddings, computeProjection } from './projectionCore';

// Computes the 2D semantic map projection. The heavy math (PCA + UMAP) runs in
// a Web Worker so the UI stays responsive for large corpora; if the worker
// can't start it falls back to running on the main thread.
export async function reduceToPlot(embeddings, options = {}) {
  const { onProgress, ...computeOptions } = options;
  const report = (p) => {
    if (onProgress) onProgress(p);
  };

  report({ phase: 'preparing', value: 0, total: 1 });

  let result = null;
  if (typeof Worker !== 'undefined') {
    try {
      result = await runInWorker(packEmbeddings(embeddings), computeOptions, report);
    } catch (err) {
      console.warn('Projection worker failed, falling back to main thread:', err);
    }
  }
  if (!result) {
    // The transferred buffer is detached after a worker attempt, so repack.
    result = await computeProjection(packEmbeddings(embeddings), computeOptions, report);
  }

  return finalizeProjection(result);
}

function runInWorker(packed, options, report) {
  return new Promise((resolve, reject) => {
    let worker;
    try {
      worker = new Worker(new URL('./projection.worker.js', import.meta.url), {
        type: 'module',
      });
    } catch (err) {
      reject(err);
      return;
    }

    worker.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === 'progress') {
        report(msg.progress);
      } else if (msg.type === 'done') {
        worker.terminate();
        resolve(msg.result);
      } else if (msg.type === 'error') {
        worker.terminate();
        reject(new Error(msg.message));
      }
    };
    worker.onerror = (e) => {
      worker.terminate();
      reject(new Error(e.message || 'Projection worker crashed'));
    };

    worker.postMessage(
      { data: packed.data, n: packed.n, dim: packed.dim, options },
      [packed.data.buffer]
    );
  });
}

function finalizeProjection(result) {
  const { coords, reduced, reducedDim, pcaMean, pcaComponents, nNeighbors, minDist } = result;
  const n = coords.length / 2;
  const coords2d = new Array(n);
  for (let i = 0; i < n; i++) {
    coords2d[i] = [coords[i * 2], coords[i * 2 + 1]];
  }

  return {
    coords2d,
    umapModel: {
      version: 2,
      nNeighbors,
      minDist,
      nComponents: 2,
      pcaDims: reducedDim,
      // Packed Float32Arrays: ~4× smaller than the plain nested arrays the
      // v1 model stored, and structured-clone directly into IndexedDB.
      reducedPacked: reduced,
      reducedDim,
      coords2d,
      pcaMean,
      pcaComponents,
    },
  };
}

// True if the model can place new embeddings onto the existing map.
export function canTransform(umapModel) {
  if (!umapModel || !umapModel.coords2d) return false;
  return Boolean(umapModel.reducedPacked || umapModel.reduced);
}

export function transformNew(umapModel, newEmbeddings) {
  if (!canTransform(umapModel)) {
    throw new Error('UMAP model not available for transform');
  }
  return umapModel.reducedPacked
    ? transformPacked(umapModel, newEmbeddings)
    : transformLegacy(umapModel, newEmbeddings);
}

const KNN_K = 5;

function transformPacked(umapModel, newEmbeddings) {
  const { reducedPacked, reducedDim, coords2d, pcaMean, pcaComponents } = umapModel;
  const n = reducedPacked.length / reducedDim;
  const results = [];

  for (const emb of newEmbeddings) {
    // Project the new embedding through the PCA model (if one was fitted)
    let projected;
    if (pcaMean && pcaComponents) {
      const dim = pcaMean.length;
      projected = new Float32Array(reducedDim);
      for (let v = 0; v < dim; v++) {
        const centered = emb[v] - pcaMean[v];
        const cBase = v * reducedDim;
        for (let c = 0; c < reducedDim; c++) {
          projected[c] += centered * pcaComponents[cBase + c];
        }
      }
    } else {
      projected = emb;
    }

    // K nearest neighbors in reduced space (single pass, no full sort)
    const nnIdx = new Array(KNN_K).fill(-1);
    const nnDist = new Array(KNN_K).fill(Infinity);
    for (let i = 0; i < n; i++) {
      const base = i * reducedDim;
      let dist = 0;
      for (let j = 0; j < reducedDim; j++) {
        const d = projected[j] - reducedPacked[base + j];
        dist += d * d;
      }
      if (dist < nnDist[KNN_K - 1]) {
        let k = KNN_K - 1;
        while (k > 0 && nnDist[k - 1] > dist) {
          nnDist[k] = nnDist[k - 1];
          nnIdx[k] = nnIdx[k - 1];
          k--;
        }
        nnDist[k] = dist;
        nnIdx[k] = i;
      }
    }

    results.push(weightedPlacement(nnIdx, nnDist, coords2d));
  }

  return results;
}

function weightedPlacement(nnIdx, nnDist, coords2d) {
  let totalWeight = 0;
  for (let k = 0; k < nnIdx.length; k++) {
    if (nnIdx[k] < 0) continue;
    totalWeight += 1 / (nnDist[k] + 1e-10);
  }
  let x = 0;
  let y = 0;
  for (let k = 0; k < nnIdx.length; k++) {
    if (nnIdx[k] < 0) continue;
    const w = (1 / (nnDist[k] + 1e-10)) / totalWeight;
    x += w * coords2d[nnIdx[k]][0];
    y += w * coords2d[nnIdx[k]][1];
  }
  return [x, y];
}

// Placement for v1 models saved before the packed format existed. Preserved
// verbatim so old corpora keep behaving as they did; recomputing the map
// upgrades them to the packed model.
function transformLegacy(umapModel, newEmbeddings) {
  const { reduced, coords2d, pcaMean, pcaLoadings, pcaDims } = umapModel;
  const results = [];

  for (const emb of newEmbeddings) {
    const vec = emb instanceof Float32Array ? Array.from(emb) : emb;

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

    const distances = reduced.map((r, i) => {
      let dist = 0;
      for (let j = 0; j < projected.length; j++) {
        const d = projected[j] - (r[j] || 0);
        dist += d * d;
      }
      return { idx: i, dist };
    });

    distances.sort((a, b) => a.dist - b.dist);
    const nearest = distances.slice(0, KNN_K);

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
