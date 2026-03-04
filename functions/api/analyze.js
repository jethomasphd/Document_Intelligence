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

    const { populationA, populationB, avgSimilarity, domain } = await context.request.json();

    if (!populationA || !populationB) {
      return Response.json({ error: 'populationA and populationB are required' }, { status: 400, headers: CORS_HEADERS });
    }

    const systemPrompt = `You are a corpus analysis expert. Analyze two document populations and provide insights about their semantic relationship, similarities, differences, and potential explanations. Be specific and data-driven in your analysis. Keep your response under 400 words.`;

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
    const analysis = data.content[0].text;

    return Response.json({ analysis }, { headers: CORS_HEADERS });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}
