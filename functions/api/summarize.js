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

    const { content, context: docContext } = await context.request.json();

    if (!content) {
      return Response.json({ error: 'content is required' }, { status: 400, headers: CORS_HEADERS });
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
      return Response.json(
        { error: `Anthropic API error: ${resp.status}`, details: errBody },
        { status: resp.status, headers: CORS_HEADERS }
      );
    }

    const data = await resp.json();
    const summary = data.content[0].text;

    return Response.json({ summary }, { headers: CORS_HEADERS });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}
