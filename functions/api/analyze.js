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

    const { populationA, populationB, avgSimilarity, domain } = await context.request.json();

    if (!populationA || !populationB) {
      return jsonResponse({ error: 'populationA and populationB are required' }, 400);
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
      return jsonResponse(
        { error: `Anthropic API error: ${resp.status}`, details: errBody },
        resp.status
      );
    }

    const data = await resp.json();
    const analysis = data.content[0].text;

    return jsonResponse({ analysis });
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}
