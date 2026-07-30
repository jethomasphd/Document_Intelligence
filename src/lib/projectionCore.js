import { UMAP } from 'umap-js';

// Shared projection math for the semantic map. Runs either inside the
// projection Web Worker (the normal path) or on the main thread (fallback).
// All bulk data is kept in packed Float32Arrays: a corpus of N docs × 1024 dims
// as plain JS number arrays costs 3-4× the memory and made large corpora crash
// the tab before the projection ever finished.

const yieldToEventLoop = () => new Promise((r) => setTimeout(r, 0));

export const DEFAULT_PCA_DIMS = 50;

// PCA is fitted on at most this many rows; the resulting components are then
// applied to every row. Fitting on the full matrix is O(N·d²) and froze for
// minutes on 10K+ corpora, while a fitted sample of this size recovers the
// same principal directions for visualization purposes.
const PCA_FIT_SAMPLE = 2500;

// Rows processed between progress reports / event-loop yields.
const PCA_CHUNK = 512;

// Subspace (block power) iterations for the PCA eigenvector solve, run with
// PCA_OVERSAMPLE extra columns so weakly-separated eigenvalues near the cut
// don't limit accuracy; a Rayleigh-Ritz step then extracts the exact top-k
// within the converged subspace (the standard randomized-SVD recipe).
const PCA_ITERATIONS = 15;
const PCA_OVERSAMPLE = 25;

export function pickEpochs(nSamples) {
  if (nSamples < 50) return 500;
  if (nSamples < 500) return 300;
  if (nSamples < 2000) return 200;
  if (nSamples < 5000) return 150;
  if (nSamples < 10000) return 100;
  return 75;
}

// Pack an array of embeddings (Float32Array or number[] rows) into a single
// contiguous Float32Array so it can be transferred to a worker without copying.
export function packEmbeddings(embeddings) {
  const n = embeddings.length;
  const dim = embeddings[0].length;
  const data = new Float32Array(n * dim);
  for (let i = 0; i < n; i++) {
    const row = embeddings[i];
    if (row instanceof Float32Array) {
      data.set(row, i * dim);
    } else {
      const base = i * dim;
      for (let j = 0; j < dim; j++) data[base + j] = row[j];
    }
  }
  return { data, n, dim };
}

// Evenly-spaced sample indices (deterministic, spreads across any row ordering).
function sampleRowIndices(n, maxRows) {
  if (n <= maxRows) return null;
  const step = n / maxRows;
  const indices = new Array(maxRows);
  for (let i = 0; i < maxRows; i++) indices[i] = Math.floor(i * step);
  return indices;
}

// Deterministic PRNG for eigenvector initialization (reproducible fits).
function makeLcg(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

// Modified Gram-Schmidt on the k columns of Q (dim × k, row-major). Columns
// that collapse to ~zero norm (rank-deficient data) are re-randomized so the
// iteration never divides by zero.
function orthonormalizeColumns(Q, dim, k, rand) {
  for (let c = 0; c < k; c++) {
    for (let p = 0; p < c; p++) {
      let dot = 0;
      for (let v = 0; v < dim; v++) dot += Q[v * k + c] * Q[v * k + p];
      for (let v = 0; v < dim; v++) Q[v * k + c] -= dot * Q[v * k + p];
    }
    let norm = 0;
    for (let v = 0; v < dim; v++) norm += Q[v * k + c] * Q[v * k + c];
    norm = Math.sqrt(norm);
    if (norm < 1e-12) {
      for (let v = 0; v < dim; v++) Q[v * k + c] = rand() - 0.5;
      c--;
      continue;
    }
    for (let v = 0; v < dim; v++) Q[v * k + c] /= norm;
  }
}

// Jacobi eigendecomposition of a small symmetric matrix B (m × m, row-major,
// destroyed in place). Returns eigenvalues plus eigenvectors as columns of V.
function jacobiEigen(B, m) {
  const V = new Float64Array(m * m);
  for (let i = 0; i < m; i++) V[i * m + i] = 1;

  for (let sweep = 0; sweep < 50; sweep++) {
    let off = 0;
    for (let p = 0; p < m - 1; p++) {
      for (let q = p + 1; q < m; q++) off += B[p * m + q] * B[p * m + q];
    }
    if (off < 1e-18) break;

    for (let p = 0; p < m - 1; p++) {
      for (let q = p + 1; q < m; q++) {
        const bpq = B[p * m + q];
        if (Math.abs(bpq) < 1e-15) continue;
        const theta = (B[q * m + q] - B[p * m + p]) / (2 * bpq);
        const t = (theta >= 0 ? 1 : -1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1);
        const s = t * c;
        for (let i = 0; i < m; i++) {
          const bip = B[i * m + p];
          const biq = B[i * m + q];
          B[i * m + p] = c * bip - s * biq;
          B[i * m + q] = s * bip + c * biq;
        }
        for (let i = 0; i < m; i++) {
          const bpi = B[p * m + i];
          const bqi = B[q * m + i];
          B[p * m + i] = c * bpi - s * bqi;
          B[q * m + i] = s * bpi + c * bqi;
        }
        for (let i = 0; i < m; i++) {
          const vip = V[i * m + p];
          const viq = V[i * m + q];
          V[i * m + p] = c * vip - s * viq;
          V[i * m + q] = s * vip + c * viq;
        }
      }
    }
  }

  const lambdas = new Array(m);
  for (let i = 0; i < m; i++) lambdas[i] = B[i * m + i];
  return { lambdas, V };
}

// Top-k PCA via covariance matrix + subspace iteration, all in typed arrays.
// A full SVD (ml-pca) computes every component and took ~45s for a 2500×1024
// fit sample; this computes only the k needed components in a few seconds.
// Returns { mean: Float32Array(dim), components: Float32Array(dim × k) } with
// components row-major by variable, sorted by descending eigenvalue.
async function fitPCA(data, n, dim, k, report) {
  const sampleIdx = sampleRowIndices(n, PCA_FIT_SAMPLE);
  const fitCount = sampleIdx ? sampleIdx.length : n;

  const mean = new Float64Array(dim);
  for (let i = 0; i < fitCount; i++) {
    const base = (sampleIdx ? sampleIdx[i] : i) * dim;
    for (let v = 0; v < dim; v++) mean[v] += data[base + v];
  }
  for (let v = 0; v < dim; v++) mean[v] /= fitCount;

  // Upper-triangular covariance accumulation, chunked for progress/yielding.
  const cov = new Float64Array(dim * dim);
  const centered = new Float64Array(dim);
  for (let start = 0; start < fitCount; start += PCA_CHUNK) {
    const end = Math.min(fitCount, start + PCA_CHUNK);
    for (let i = start; i < end; i++) {
      const base = (sampleIdx ? sampleIdx[i] : i) * dim;
      for (let v = 0; v < dim; v++) centered[v] = data[base + v] - mean[v];
      for (let a = 0; a < dim; a++) {
        const xa = centered[a];
        const rowBase = a * dim;
        for (let b = a; b < dim; b++) {
          cov[rowBase + b] += xa * centered[b];
        }
      }
    }
    report({ phase: 'pca', value: end, total: fitCount + n });
    await yieldToEventLoop();
  }
  const denom = Math.max(1, fitCount - 1);
  for (let a = 0; a < dim; a++) {
    for (let b = a; b < dim; b++) {
      const value = cov[a * dim + b] / denom;
      cov[a * dim + b] = value;
      cov[b * dim + a] = value;
    }
  }

  // Subspace iteration with oversampling: Q ← orthonormalize(C·Q).
  const m = Math.min(k + PCA_OVERSAMPLE, dim);
  const rand = makeLcg(0x9e3779b9);
  let Q = new Float64Array(dim * m);
  for (let i = 0; i < Q.length; i++) Q[i] = rand() - 0.5;
  orthonormalizeColumns(Q, dim, m, rand);

  let Z = new Float64Array(dim * m);
  const multiplyCov = (src, dst) => {
    dst.fill(0);
    for (let a = 0; a < dim; a++) {
      const rowBase = a * dim;
      const outBase = a * m;
      for (let v = 0; v < dim; v++) {
        const cv = cov[rowBase + v];
        if (cv === 0) continue;
        const qBase = v * m;
        for (let c = 0; c < m; c++) {
          dst[outBase + c] += cv * src[qBase + c];
        }
      }
    }
  };

  for (let iter = 0; iter < PCA_ITERATIONS; iter++) {
    multiplyCov(Q, Z);
    orthonormalizeColumns(Z, dim, m, rand);
    const tmp = Q;
    Q = Z;
    Z = tmp;
    if (iter % 5 === 4) await yieldToEventLoop();
  }

  // Rayleigh-Ritz: eigendecompose B = QᵀCQ (m × m) to get the exact top-k
  // directions within the converged subspace, properly ordered.
  multiplyCov(Q, Z); // Z = C·Q
  const B = new Float64Array(m * m);
  for (let i = 0; i < m; i++) {
    for (let j = i; j < m; j++) {
      let sum = 0;
      for (let v = 0; v < dim; v++) sum += Q[v * m + i] * Z[v * m + j];
      B[i * m + j] = sum;
      B[j * m + i] = sum;
    }
  }
  const { lambdas, V } = jacobiEigen(B, m);
  const order = lambdas
    .map((lambda, col) => ({ lambda, col }))
    .sort((a, b) => b.lambda - a.lambda)
    .slice(0, k);

  // components[:, c] = Q · V[:, order[c]]
  const components = new Float32Array(dim * k);
  for (let v = 0; v < dim; v++) {
    const qBase = v * m;
    const outBase = v * k;
    for (let c = 0; c < k; c++) {
      const col = order[c].col;
      let sum = 0;
      for (let j = 0; j < m; j++) sum += Q[qBase + j] * V[j * m + col];
      components[outBase + c] = sum;
    }
  }

  return { mean: Float32Array.from(mean), components, fitCount };
}

export async function computeProjection({ data, n, dim }, options = {}, report = () => {}) {
  const {
    pcaDims = DEFAULT_PCA_DIMS,
    nNeighbors = 15,
    minDist = 0.1,
    nEpochs,
  } = options;

  // --- Step 1: PCA to reduce dimensions (if embedding dim > pcaDims) ---
  let reduced = data;
  let reducedDim = dim;
  let pcaMean = null;       // Float32Array [dim]
  let pcaComponents = null; // Float32Array [dim × reducedDim], row-major by variable

  if (dim > pcaDims) {
    report({ phase: 'pca', value: 0, total: n });
    await yieldToEventLoop();

    reducedDim = Math.min(pcaDims, dim, n);
    const { mean, components, fitCount } = await fitPCA(data, n, dim, reducedDim, report);
    pcaMean = mean;
    pcaComponents = components;

    reduced = new Float32Array(n * reducedDim);
    for (let start = 0; start < n; start += PCA_CHUNK) {
      const end = Math.min(n, start + PCA_CHUNK);
      for (let i = start; i < end; i++) {
        const base = i * dim;
        const out = i * reducedDim;
        for (let v = 0; v < dim; v++) {
          const centered = data[base + v] - pcaMean[v];
          const cBase = v * reducedDim;
          for (let c = 0; c < reducedDim; c++) {
            reduced[out + c] += centered * pcaComponents[cBase + c];
          }
        }
      }
      report({ phase: 'pca', value: fitCount + end, total: fitCount + n });
      await yieldToEventLoop();
    }
  }

  // --- Step 2: UMAP to 2D ---
  const effectiveNeighbors = Math.min(nNeighbors, Math.max(2, n - 1));
  const targetEpochs = nEpochs ?? pickEpochs(n);

  // The k-NN graph build inside fitAsync is synchronous and is the longest
  // single step for large corpora — surface it as its own phase.
  report({ phase: 'umap-init', value: 0, total: 1 });
  await yieldToEventLoop();

  const rows = new Array(n);
  for (let i = 0; i < n; i++) {
    rows[i] = reduced.subarray(i * reducedDim, (i + 1) * reducedDim);
  }

  const umap = new UMAP({
    nNeighbors: effectiveNeighbors,
    minDist,
    nComponents: 2,
    nEpochs: targetEpochs,
  });

  const embedding = await umap.fitAsync(rows, (epoch) => {
    report({ phase: 'umap', value: epoch, total: targetEpochs });
    return true;
  });

  const coords = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    coords[i * 2] = embedding[i][0];
    coords[i * 2 + 1] = embedding[i][1];
  }

  return {
    coords,
    reduced,
    reducedDim,
    pcaMean,
    pcaComponents,
    nNeighbors: effectiveNeighbors,
    minDist,
  };
}
