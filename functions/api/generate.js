const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { headers: CORS_HEADERS });
}

export async function onRequestPost(context) {
  try {
    const apiKey = context.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500, headers: CORS_HEADERS });
    }

    const { domain, exemplars, prompt, style, count = 3 } = await context.request.json();

    if (!exemplars || !prompt) {
      return Response.json({ error: 'exemplars and prompt are required' }, { status: 400, headers: CORS_HEADERS });
    }

    const exemplarText = exemplars
      .map((e, i) => `Example ${i + 1} (${e.category || 'uncategorized'}):\nTitle: ${e.title}\nContent: ${e.content}`)
      .join('\n\n');

    const systemPrompt = `You are a document generation expert. You generate new documents that semantically fit within a specific zone of a document corpus.

You MUST respond with valid JSON in this exact format:
{
  "candidates": [
    {
      "title": "...",
      "content": "...",
      "rationale": "..."
    }
  ]
}

Generate exactly ${count} candidate document(s). Each should:
1. Fit semantically near the provided exemplar documents
2. Match the requested style: ${style}
3. Be appropriate for the domain: ${domain || 'general'}
4. Be original — do not copy exemplar content directly
5. Include a brief rationale explaining why this document fits the target zone`;

    const userMessage = `Here are exemplar documents from the target semantic zone:

${exemplarText}

User request: ${prompt}

Generate ${count} new document(s) in ${style} style that would fit in this semantic neighborhood. Respond with JSON only.`;

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
      return Response.json(
        { error: `Anthropic API error: ${resp.status}`, details: errBody },
        { status: resp.status, headers: CORS_HEADERS }
      );
    }

    const data = await resp.json();
    const text = data.content[0].text;

    // Parse JSON from response (handle potential markdown wrapping)
    let parsed;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      return Response.json(
        { error: 'Failed to parse generation response as JSON', raw: text },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    return Response.json(parsed, { headers: CORS_HEADERS });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}
