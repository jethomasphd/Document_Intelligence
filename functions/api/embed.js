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
    const apiKey = context.env.VOYAGE_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'VOYAGE_API_KEY not configured' }, { status: 500, headers: CORS_HEADERS });
    }

    const { texts, model = 'voyage-3-lite' } = await context.request.json();

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return Response.json({ error: 'texts must be a non-empty array' }, { status: 400, headers: CORS_HEADERS });
    }

    const CHUNK_SIZE = 128;
    const allEmbeddings = [];

    for (let i = 0; i < texts.length; i += CHUNK_SIZE) {
      const chunk = texts.slice(i, i + CHUNK_SIZE);

      const resp = await fetch('https://api.voyageai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          input: chunk,
          model,
        }),
      });

      if (!resp.ok) {
        const errBody = await resp.text();
        return Response.json(
          { error: `Voyage API error: ${resp.status}`, details: errBody },
          { status: resp.status, headers: CORS_HEADERS }
        );
      }

      const data = await resp.json();
      const embeddings = data.data.map((d) => d.embedding);
      allEmbeddings.push(...embeddings);
    }

    return Response.json({ embeddings: allEmbeddings }, { headers: CORS_HEADERS });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}
