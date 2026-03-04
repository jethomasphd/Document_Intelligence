const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS_HEADERS });
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS_HEADERS });
}

export async function onRequestPost(context) {
  try {
    const apiKey = context.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return jsonResponse({ error: 'ANTHROPIC_API_KEY not configured' }, 500);
    }

    const { content, context: docContext } = await context.request.json();

    if (!content) {
      return jsonResponse({ error: 'content is required' }, 400);
    }

    const systemPrompt = `You are a precise document summarizer. Provide a concise summary of the given document content. Focus on key themes, topics, and distinguishing characteristics. Keep the summary under 200 words.`;

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
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!resp.ok) {
      const errBody = await resp.text();
      return jsonResponse(
        { error: `Anthropic API error: ${resp.status}`, details: errBody },
        resp.status
      );
    }

    const data = await resp.json();
    const summary = data.content[0].text;

    return jsonResponse({ summary });
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}
