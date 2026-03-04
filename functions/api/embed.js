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
    const apiKey = context.env.VOYAGE_API_KEY;
    if (!apiKey) {
      return jsonResponse({ error: 'VOYAGE_API_KEY not configured' }, 500);
    }

    const { texts, model = 'voyage-3.5-lite' } = await context.request.json();

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return jsonResponse({ error: 'texts must be a non-empty array' }, 400);
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
        return jsonResponse(
          { error: `Voyage API error: ${resp.status}`, details: errBody },
          resp.status
        );
      }

      const data = await resp.json();
      const embeddings = data.data.map((d) => d.embedding);
      allEmbeddings.push(...embeddings);
    }

    return jsonResponse({ embeddings: allEmbeddings });
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}
