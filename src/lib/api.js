// In production, set VITE_API_URL to your Worker URL, e.g.:
//   https://document-intelligence-api.<your-subdomain>.workers.dev
// For local dev, run the worker with `cd worker && npx wrangler dev` (defaults to port 8787)
const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8787' : '');

async function post(path, body) {
  const resp = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(data.error || `API error: ${resp.status}`);
  }

  return data;
}

export async function embed({ texts, model = 'voyage-3.5-lite' }) {
  return post('/api/embed', { texts, model });
}

export async function summarize({ content, context }) {
  return post('/api/summarize', { content, context });
}

export async function generate({ domain, exemplars, prompt, style, count }) {
  return post('/api/generate', { domain, exemplars, prompt, style, count });
}

export async function analyze({ populationA, populationB, avgSimilarity, domain }) {
  return post('/api/analyze', { populationA, populationB, avgSimilarity, domain });
}
