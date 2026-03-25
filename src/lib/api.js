const API_BASE = import.meta.env.DEV
  ? 'http://localhost:8788'
  : 'https://document-intelligence-api.jethomasphd.workers.dev';

async function post(path, body) {
  const resp = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const text = await resp.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON from ${path} (${resp.status}): ${text.slice(0, 200)}`);
  }

  if (!resp.ok) {
    throw new Error(data.error || `API error: ${resp.status}`);
  }

  return data;
}

export async function embed({ texts, model = 'voyage-3.5-lite' }) {
  return post('/api/embed', { texts, model });
}

export async function summarize({ content, context, title, category, neighbors }) {
  return post('/api/summarize', { content, context, title, category, neighbors });
}

export async function generate({ domain, exemplars, prompt, style, count }) {
  return post('/api/generate', { domain, exemplars, prompt, style, count });
}

export async function analyze({ populationA, populationB, avgSimilarity, domain }) {
  return post('/api/analyze', { populationA, populationB, avgSimilarity, domain });
}
