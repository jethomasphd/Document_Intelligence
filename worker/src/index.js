// Document Intelligence API Worker
// Standalone Cloudflare Worker handling all API routes.
// Secrets (ANTHROPIC_API_KEY, VOYAGE_API_KEY) are set via:
//   wrangler secret put ANTHROPIC_API_KEY
//   wrangler secret put VOYAGE_API_KEY

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

// ── Route: POST /api/embed ──────────────────────────────────────────────
async function handleEmbed(request, env) {
  const apiKey = env.VOYAGE_API_KEY;
  if (!apiKey) return json({ error: 'VOYAGE_API_KEY not configured' }, 500);

  const { texts, model = 'voyage-3.5-lite' } = await request.json();

  if (!texts || !Array.isArray(texts) || texts.length === 0) {
    return json({ error: 'texts must be a non-empty array' }, 400);
  }

  const CHUNK_SIZE = 128;
  const allEmbeddings = [];

  for (let i = 0; i < texts.length; i += CHUNK_SIZE) {
    const chunk = texts.slice(i, i + CHUNK_SIZE);

    const resp = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ input: chunk, model }),
    });

    if (!resp.ok) {
      const errBody = await resp.text();
      return json({ error: `Voyage API error: ${resp.status}`, details: errBody }, resp.status);
    }

    const data = await resp.json();
    allEmbeddings.push(...data.data.map((d) => d.embedding));
  }

  return json({ embeddings: allEmbeddings });
}

// ── Route: POST /api/summarize ──────────────────────────────────────────
async function handleSummarize(request, env) {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) return json({ error: 'ANTHROPIC_API_KEY not configured' }, 500);

  const { content, context: docContext } = await request.json();
  if (!content) return json({ error: 'content is required' }, 400);

  const userMessage = docContext
    ? `Context: ${docContext}\n\nDocument:\n${content}`
    : `Document:\n${content}`;

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system:
        'You are a precise document summarizer. Provide a concise summary of the given document content. Focus on key themes, topics, and distinguishing characteristics. Keep the summary under 200 words.',
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!resp.ok) {
    const errBody = await resp.text();
    return json({ error: `Anthropic API error: ${resp.status}`, details: errBody }, resp.status);
  }

  const data = await resp.json();
  return json({ summary: data.content[0].text });
}

// ── Route: POST /api/generate ───────────────────────────────────────────
async function handleGenerate(request, env) {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) return json({ error: 'ANTHROPIC_API_KEY not configured' }, 500);

  const { domain, exemplars, prompt, style, count = 3 } = await request.json();
  if (!exemplars || !prompt) return json({ error: 'exemplars and prompt are required' }, 400);

  const exemplarText = exemplars
    .map((e, i) => `Example ${i + 1} (${e.category || 'uncategorized'}):\nTitle: ${e.title}\nContent: ${e.content}`)
    .join('\n\n');

  const systemPrompt = `You are a document generation expert. You generate new documents that semantically fit within a specific zone of a document corpus.

You MUST respond with valid JSON in this exact format:
{
  "candidates": [
    { "title": "...", "content": "...", "rationale": "..." }
  ]
}

Generate exactly ${count} candidate document(s). Each should:
1. Fit semantically near the provided exemplar documents
2. Match the requested style: ${style}
3. Be appropriate for the domain: ${domain || 'general'}
4. Be original — do not copy exemplar content directly
5. Include a brief rationale explaining why this document fits the target zone`;

  const userMessage = `Here are exemplar documents from the target semantic zone:\n\n${exemplarText}\n\nUser request: ${prompt}\n\nGenerate ${count} new document(s) in ${style} style that would fit in this semantic neighborhood. Respond with JSON only.`;

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!resp.ok) {
    const errBody = await resp.text();
    return json({ error: `Anthropic API error: ${resp.status}`, details: errBody }, resp.status);
  }

  const data = await resp.json();
  const text = data.content[0].text;

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    return json(parsed);
  } catch {
    return json({ error: 'Failed to parse generation response as JSON', raw: text }, 500);
  }
}

// ── Route: POST /api/analyze ────────────────────────────────────────────
async function handleAnalyze(request, env) {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) return json({ error: 'ANTHROPIC_API_KEY not configured' }, 500);

  const { populationA, populationB, avgSimilarity, domain } = await request.json();
  if (!populationA || !populationB) {
    return json({ error: 'populationA and populationB are required' }, 400);
  }

  const userMessage = `Domain: ${domain || 'general'}

Population A ("${populationA.name}") sample documents:
${populationA.samples.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Population B ("${populationB.name}") sample documents:
${populationB.samples.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Average cross-population cosine similarity: ${avgSimilarity}

Provide a narrative analysis of:
1. Key themes in each population
2. Where they overlap semantically
3. Where they diverge
4. What the similarity score suggests about their relationship`;

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system:
        'You are a corpus analysis expert. Analyze two document populations and provide insights about their semantic relationship, similarities, differences, and potential explanations. Be specific and data-driven in your analysis. Keep your response under 400 words.',
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!resp.ok) {
    const errBody = await resp.text();
    return json({ error: `Anthropic API error: ${resp.status}`, details: errBody }, resp.status);
  }

  const data = await resp.json();
  return json({ analysis: data.content[0].text });
}

// ── Router ──────────────────────────────────────────────────────────────
const routes = {
  '/api/embed': handleEmbed,
  '/api/summarize': handleSummarize,
  '/api/generate': handleGenerate,
  '/api/analyze': handleAnalyze,
};

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const handler = routes[url.pathname];

    if (!handler) {
      return json({ error: 'Not found', path: url.pathname }, 404);
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    try {
      return await handler(request, env);
    } catch (err) {
      return json({ error: err.message || 'Internal server error' }, 500);
    }
  },
};
