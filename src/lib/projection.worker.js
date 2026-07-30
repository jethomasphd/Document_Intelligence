import { computeProjection } from './projectionCore';

// Runs the PCA + UMAP projection off the main thread. Input embeddings arrive
// as a single transferred Float32Array; results transfer back the same way.

self.onmessage = async (e) => {
  const { data, n, dim, options } = e.data;
  try {
    const result = await computeProjection({ data, n, dim }, options, (progress) => {
      self.postMessage({ type: 'progress', progress });
    });

    const transfers = [result.coords.buffer, result.reduced.buffer];
    if (result.pcaMean) transfers.push(result.pcaMean.buffer);
    if (result.pcaComponents) transfers.push(result.pcaComponents.buffer);

    self.postMessage({ type: 'done', result }, transfers);
  } catch (err) {
    self.postMessage({ type: 'error', message: err?.message || String(err) });
  }
};
