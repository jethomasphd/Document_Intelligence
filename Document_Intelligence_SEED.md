# Document Intelligence — Project Seed
### A Full-Stack Semantic Corpus Analysis & Generative Document Platform

---

## Vision

Document Intelligence is a self-service platform for mapping any collection of text documents into semantic vector space, exploring the structure of that space, and **generating new documents that target specific regions of it**. It is domain-agnostic: the same engine works for email subject lines, presidential speeches, book chapters, social media posts, product descriptions, job postings, or any other text corpus.

The core insight: **meaning has geometry**. Documents that mean similar things occupy the same neighborhood in a high-dimensional vector space. If you can see that geography, you can navigate it — finding high-performing neighbors, diagnosing problematic clusters, and synthesizing new documents that would appear exactly where you want them in the map.

This repo is `Document_Intelligence`, deployed on Cloudflare Pages with a Pages Functions Worker handling all AI API calls.

---

## Architecture

```
User Browser
    │
    ├── React App (Cloudflare Pages)
    │       ├── Corpus Builder    (upload, configure, label)
    │       ├── Map Explorer      (2D scatter, click to inspect)
    │       ├── Comparator        (two-population cross-analysis)
    │       └── Generator         (target a region → synthesize documents)
    │
    └── Cloudflare Pages Functions (/functions/api/*)
            ├── /api/embed        → Voyage AI embeddings
            ├── /api/generate     → Anthropic Claude generation
            ├── /api/summarize    → Anthropic Claude summarization
            └── /api/analyze      → Anthropic Claude corpus analysis

External APIs (called only from Worker, keys never reach browser):
    ├── Voyage AI  (https://api.voyageai.com)  — embeddings
    └── Anthropic  (https://api.anthropic.com) — Claude (generation, summarization)
```

**Why Voyage AI for embeddings?** Anthropic does not currently expose an embeddings endpoint. Voyage AI is Anthropic's official embeddings partner and deeply integrated into the Anthropic ecosystem. Use `voyage-3-lite` for speed/cost, `voyage-3` for production quality.

**Why Cloudflare Pages Functions?** Zero separate Worker deployment — functions in `functions/api/*.js` automatically become Worker routes under the same `pages.dev` domain. One `wrangler deploy` command ships everything. Secrets (API keys) are set once in the dashboard.

**Client-side computation:** UMAP dimensionality reduction runs in the browser using `umap-js`. This keeps the Worker stateless and avoids Cloudflare's CPU time limits. Embeddings (high-dimensional vectors) are computed by the Worker (Voyage API call), returned to the client, and the client performs the 2D projection locally.

---

## Repository Structure

```
Document_Intelligence/
│
├── README.md
├── package.json              # Root: Vite + React + deps
├── vite.config.js
├── tailwind.config.js
├── wrangler.toml             # Cloudflare Pages config
│
├── src/                      # React frontend
│   ├── main.jsx
│   ├── App.jsx               # Router + global state (Zustand)
│   ├── index.css             # Tailwind + custom CSS variables
│   │
│   ├── pages/
│   │   ├── Home.jsx          # Landing page, corpus library
│   │   ├── CorpusBuilder.jsx # Upload → Configure → Embed flow
│   │   ├── Explorer.jsx      # 2D map + inspector panel
│   │   ├── Comparator.jsx    # Two-population analysis
│   │   └── Generator.jsx     # Generative synthesis interface
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx
│   │   │   └── TopBar.jsx
│   │   ├── corpus/
│   │   │   ├── DropZone.jsx        # Drag-and-drop file upload
│   │   │   ├── FieldMapper.jsx     # Map CSV columns → schema
│   │   │   ├── CategoryPicker.jsx  # Assign population labels
│   │   │   └── EmbedProgress.jsx   # Batch embedding progress bar
│   │   ├── map/
│   │   │   ├── SemanticMap.jsx     # Plotly scatter wrapper
│   │   │   ├── PointInspector.jsx  # Side panel: metadata + neighbors
│   │   │   ├── ClusterLabels.jsx   # AI-generated cluster names overlay
│   │   │   └── SearchBar.jsx       # Fuzzy search → highlight point
│   │   ├── generator/
│   │   │   ├── TargetPicker.jsx    # Select target zone on map
│   │   │   ├── GeneratorForm.jsx   # Prompt + constraints input
│   │   │   ├── CandidateCard.jsx   # Generated doc + similarity score
│   │   │   └── PlacementVerifier.jsx # Plot candidates on existing map
│   │   └── shared/
│   │       ├── Button.jsx
│   │       ├── Badge.jsx
│   │       └── Modal.jsx
│   │
│   ├── hooks/
│   │   ├── useCorpus.js        # Corpus CRUD + embedding state
│   │   ├── useMap.js           # UMAP/PCA reduction + plot data
│   │   ├── useNeighbors.js     # KNN search (client-side)
│   │   └── useGenerator.js     # Generation + verification loop
│   │
│   ├── lib/
│   │   ├── api.js              # fetch wrappers for /api/* routes
│   │   ├── umap.js             # umap-js wrapper + PCA fallback
│   │   ├── knn.js              # cosine similarity + k-nearest neighbors
│   │   ├── storage.js          # IndexedDB via idb-keyval (corpus persistence)
│   │   └── export.js           # Export corpus, neighbors, report
│   │
│   └── store/
│       └── index.js            # Zustand global store
│
├── functions/
│   └── api/
│       ├── embed.js            # POST /api/embed → Voyage AI
│       ├── generate.js         # POST /api/generate → Claude
│       ├── summarize.js        # POST /api/summarize → Claude
│       └── analyze.js          # POST /api/analyze → Claude
│
└── public/
    └── favicon.svg
```

---

## Core Data Model

```javascript
// A single document in the corpus
Document = {
  id: string,           // UUID or user-supplied
  content: string,      // The text to embed
  title: string,        // Display name
  category: string,     // Population label (e.g. "SL Bank", "Top SL")
  metadata: object,     // Any extra fields from the source CSV
  embedding: float32[], // High-dimensional vector (1024d from Voyage)
  coords2d: [x, y],     // UMAP/PCA 2D projection for visualization
  clusterId: number,    // Assigned cluster (k-means, optional)
}

// A corpus is the unit of work
Corpus = {
  id: string,           // UUID
  name: string,         // User-supplied name
  description: string,  // Brief description
  domain: string,       // e.g. "email subject lines", "speeches"
  createdAt: timestamp,
  updatedAt: timestamp,
  documents: Document[],
  categories: string[], // Unique population labels
  embeddingModel: string, // "voyage-3-lite" | "voyage-3"
  reductionMethod: string, // "umap" | "pca"
  neighborK: number,    // Default 25
}

// A neighbor relationship
Neighbor = {
  sourceId: string,
  targetId: string,
  similarity: float,    // Cosine similarity [0, 1]
  rank: number,
}

// A generated candidate document
Candidate = {
  id: string,
  content: string,
  targetZoneDescription: string,
  exemplarIds: string[],     // IDs of exemplar docs used as generation anchors
  embedding: float32[],      // Computed after generation
  coords2d: [x, y],          // Placed in existing map space
  nearestNeighborIds: string[], // Closest docs in corpus
  avgSimilarityToTarget: float,
  verifiedAt: timestamp,
}
```

---

## API Contract (Cloudflare Pages Functions)

### `POST /api/embed`

Batch embed documents using Voyage AI.

```
Request:
{
  texts: string[],          // Array of content strings (max 128 per request)
  model: "voyage-3-lite" | "voyage-3",
  input_type: "document" | "query"
}

Response:
{
  embeddings: float[][],    // Array of embedding vectors
  model: string,
  usage: { total_tokens: number }
}
```

Worker implementation: Forward to `https://api.voyageai.com/v1/embeddings` with `Authorization: Bearer ${env.VOYAGE_API_KEY}`. Batch large corpora — split texts into chunks of 128, call sequentially, concatenate results.

### `POST /api/summarize`

Summarize a document or cluster using Claude.

```
Request:
{
  documents: [{ title, content, category }], // 1–20 docs
  task: "document" | "cluster" | "neighborhood"
}

Response:
{
  summary: string,
  keyThemes: string[],
  tone: string
}
```

Worker: Construct a tight prompt. For clusters, pass all docs. Use `claude-haiku-4-5` for speed/cost.

### `POST /api/generate`

Generate new documents targeting a semantic region.

```
Request:
{
  domain: string,           // "email subject lines", "speech excerpts", etc.
  exemplars: [{ title, content, similarity }], // Top-k neighbors from target zone
  targetDescription: string, // User's text description of desired zone
  userPrompt: string,        // Additional constraints
  count: number,             // How many candidates to generate (1–10)
  style: string              // Optional: "formal" | "conversational" | "urgent" etc.
}

Response:
{
  candidates: [
    { content: string, rationale: string }
  ]
}
```

Worker: Use `claude-sonnet-4-6`. System prompt establishes the task as semantic targeting. Include exemplars verbatim. Prompt Claude to generate documents that would occupy the same semantic neighborhood. Return JSON-parsed candidates.

Claude system prompt template:
```
You are a semantic document synthesizer. Your task is to generate new [domain] documents
that would occupy the same region of semantic space as the provided exemplars.

The target region is characterized by: [targetDescription]

Exemplars from the target region (ordered by similarity):
[exemplars formatted as numbered list]

Generate exactly [count] new [domain] documents that:
1. Share the semantic DNA of the exemplars above
2. Are distinct from one another
3. Satisfy this additional constraint: [userPrompt]
4. Sound natural, not like AI-generated content

Respond ONLY with valid JSON: { "candidates": [{ "content": "...", "rationale": "..." }] }
```

### `POST /api/analyze`

Analyze corpus structure and generate cluster names.

```
Request:
{
  clusters: [
    { clusterId: number, documents: [{ title, content }] }  // Sample docs per cluster
  ],
  domain: string
}

Response:
{
  clusterAnalysis: [
    { clusterId, name, description, themes: string[] }
  ],
  overallInsights: string
}
```

---

## Key Algorithms (Client-Side)

### Embedding Pipeline (`lib/umap.js`, `hooks/useCorpus.js`)

```
1. User uploads CSV / pastes text / uploads JSON
2. FieldMapper maps columns → { id, content, title, category, ...metadata }
3. EmbedProgress batches documents → POST /api/embed (128 at a time)
4. Embeddings stored in corpus.documents[i].embedding
5. Full corpus saved to IndexedDB via storage.js
6. Trigger UMAP reduction on all embeddings
```

### Dimensionality Reduction (`lib/umap.js`)

```javascript
import { UMAP } from 'umap-js';

function reduceToPlot(embeddings, { nNeighbors = 15, minDist = 0.1 } = {}) {
  // Step 1: PCA to 50 dims (speeds up UMAP, required for large corpora)
  const pca50 = runPCA(embeddings, 50);
  
  // Step 2: UMAP to 2D
  const umap = new UMAP({ nNeighbors, minDist, nComponents: 2 });
  return umap.fit(pca50);  // returns [[x,y], ...]
}
```

For PCA, use `ml-pca` from the `ml` npm ecosystem.

### KNN Search (`lib/knn.js`)

Run entirely client-side using typed arrays for performance.

```javascript
function cosineSimilarity(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-12);
}

function knn(queryEmbedding, corpus, k = 25, categoryFilter = null) {
  const candidates = categoryFilter
    ? corpus.documents.filter(d => d.category === categoryFilter)
    : corpus.documents;

  return candidates
    .map(doc => ({
      doc,
      similarity: cosineSimilarity(queryEmbedding, doc.embedding)
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, k);
}
```

### Generative Verification Loop (`hooks/useGenerator.js`)

```
1. User selects "target zone" by:
   a. Clicking a cluster on the map, OR
   b. Lasso-selecting a region, OR
   c. Clicking a specific document and targeting its neighborhood
2. System extracts top-K documents from that zone (KNN of zone centroid)
3. User writes a prompt describing constraints
4. POST /api/generate → Claude returns N candidates
5. POST /api/embed each candidate
6. Project candidates into existing UMAP space (UMAP transform, not refit)
7. Compute each candidate's distance to target zone centroid
8. Show candidates on map with color-coded placement accuracy
9. User accepts/rejects/iterates
```

**Zone centroid computation:**
```javascript
function zoneCentroid(documents) {
  const dim = documents[0].embedding.length;
  const centroid = new Float32Array(dim);
  for (const doc of documents) {
    for (let i = 0; i < dim; i++) centroid[i] += doc.embedding[i];
  }
  for (let i = 0; i < dim; i++) centroid[i] /= documents.length;
  return centroid;
}
```

**UMAP transform** (project new points into existing UMAP space without refitting):
`umap-js` exposes `umap.transform(newPoints)` — use this so candidates are placed in the existing map geometry.

---

## UI/UX Specification

### Design Language
- **Aesthetic**: Scientific dark interface — dark slate backgrounds (`#0a0d14`), electric cyan accent (`#00d4ff`), data-gold secondary (`#f0a500`), monospace type for data, sans-serif for UI chrome
- **Font stack**: `IBM Plex Mono` for data/labels, `DM Sans` for UI text
- **Feel**: Like a lab instrument — precise, purposeful, no decoration that doesn't carry information
- **Inspiration**: Bloomberg Terminal × Observable × a map of the cosmos

### Home Page
- Grid of corpus cards (name, doc count, domain, last updated)
- "New Corpus" CTA → CorpusBuilder
- Import corpus from JSON button

### Corpus Builder (3-step wizard)
```
Step 1: Upload
  - Drag-and-drop zone accepts: CSV, JSON, TXT (one doc per line), PDF (future)
  - Paste text mode with line-delimited input
  - Preview table of first 10 rows

Step 2: Configure
  - FieldMapper: dropdowns to assign CSV columns to id/content/title/category
  - Category editor: view/rename unique categories, assign colors
  - Embedding model selector: voyage-3-lite (fast) / voyage-3 (accurate)
  - Neighbor count: slider 10–50

Step 3: Embed
  - Progress bar showing batch progress (e.g., "Embedding 247 / 1,420 documents...")
  - Estimated time remaining
  - On completion: "Visualize Corpus" CTA → Explorer
```

### Explorer
```
Layout: 75% map | 25% inspector panel (collapsible)

Map Panel:
  - Plotly scatter with hover tooltips (title + category + truncated content)
  - Color by category (uses category colors assigned in builder)
  - Toggle: color by cluster (AI-named clusters from /api/analyze)
  - Search bar: type to fuzzy-find + highlight point
  - Lasso select: highlight a region → shows aggregate stats in inspector
  - "Generate from this region" button appears on lasso selection

Inspector Panel (click a point):
  - Document metadata card (title, category, content preview)
  - "AI Summary" button → POST /api/summarize for that doc
  - Nearest Neighbors list (sorted by similarity)
    - Each neighbor: title | category | similarity score | "Jump to" button
  - Population filter: "Show only neighbors from [Category X]"
```

### Comparator
```
Two-panel selection: Population A | Population B (dropdowns from category list)
"Run Analysis" button

Output:
  - Cross-neighbor table: for each doc in Pop A, top K nearest from Pop B
  - Similarity distribution chart (histogram)
  - AI Insight card: "Population A documents about X tend to cluster near
    Population B documents about Y. The bridge between them is..."
  - Export: neighbors CSV, full report markdown
```

### Generator
```
Step 1: Target Zone Selection
  - Map shown in mini-view
  - Click or lasso to select target region
  - Selected zone: shows centroid coordinates, K exemplar documents
  - OR: "Describe zone" text input (Claude analyzes and finds matching region)

Step 2: Generation Prompt
  - Domain confirmation (auto-filled from corpus domain)
  - User prompt textarea: "Generate [domain] that [constraint]..."
  - Style selector: Formal / Conversational / Urgent / Minimal / Persuasive
  - Count: 1–10 candidates
  - Advanced: temperature-equivalent hint in prompt

Step 3: Results
  - Generated candidates shown as cards
  - Each card: content | rationale | "Verify Placement" button
  - Verify: embed candidate → project onto map → show where it lands
  - Placement quality badge: "On Target" (>0.8 sim) / "Adjacent" / "Off Target"
  - Accept → add to corpus as new category "Generated [timestamp]"
  - Iterate: "Regenerate" with modified prompt
```

---

## Cloudflare Pages Functions (Worker Code)

### `functions/api/embed.js`

```javascript
export async function onRequestPost(context) {
  const { texts, model = 'voyage-3-lite', input_type = 'document' } = await context.request.json();

  // Batch in chunks of 128 (Voyage API limit)
  const BATCH_SIZE = 128;
  const allEmbeddings = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const res = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${context.env.VOYAGE_API_KEY}`
      },
      body: JSON.stringify({ input: batch, model, input_type })
    });

    if (!res.ok) {
      const err = await res.text();
      return new Response(JSON.stringify({ error: err }), { status: res.status });
    }

    const data = await res.json();
    allEmbeddings.push(...data.data.map(d => d.embedding));
  }

  return new Response(JSON.stringify({ embeddings: allEmbeddings }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### `functions/api/generate.js`

```javascript
export async function onRequestPost(context) {
  const { domain, exemplars, targetDescription, userPrompt, count = 5, style } = await context.request.json();

  const exemplarText = exemplars
    .map((e, i) => `${i + 1}. [${e.category}] (similarity: ${e.similarity.toFixed(3)})\n   "${e.content}"`)
    .join('\n');

  const systemPrompt = `You are a semantic document synthesizer for the domain: ${domain}.
Generate documents that occupy the same semantic region as the provided exemplars.
Always respond with valid JSON only. No markdown, no explanation outside the JSON.`;

  const userMessage = `Target zone: ${targetDescription}

Exemplar documents from the target region:
${exemplarText}

Generate exactly ${count} new ${domain} document(s) that:
- Share the semantic DNA of the exemplars
- Are distinct from each other
- Style: ${style || 'match exemplar tone'}
- Additional constraint: ${userPrompt || 'none'}

Respond with: { "candidates": [{ "content": "...", "rationale": "..." }] }`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': context.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    })
  });

  const data = await res.json();
  const raw = data.content[0].text.replace(/```json|```/g, '').trim();

  try {
    const parsed = JSON.parse(raw);
    return new Response(JSON.stringify(parsed), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Parse failed', raw }), { status: 500 });
  }
}
```

### `functions/api/summarize.js`

```javascript
export async function onRequestPost(context) {
  const { documents, task } = await context.request.json();

  const docText = documents
    .map(d => `[${d.category}] ${d.title}: "${d.content}"`)
    .join('\n');

  const taskPrompt = {
    document: `Summarize this document in 2-3 sentences. Extract: summary, keyThemes (array), tone.`,
    cluster: `Analyze this cluster of documents. What semantic territory do they share? Extract: summary, keyThemes (array), tone, clusterName.`,
    neighborhood: `Analyze these neighboring documents to explain why they cluster together. Extract: summary, keyThemes (array), tone, sharedPattern.`
  }[task] || taskPrompt.document;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': context.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `${taskPrompt}\n\nDocuments:\n${docText}\n\nRespond with JSON only.`
      }]
    })
  });

  const data = await res.json();
  const raw = data.content[0].text.replace(/```json|```/g, '').trim();

  return new Response(raw, { headers: { 'Content-Type': 'application/json' } });
}
```

---

## `wrangler.toml`

```toml
name = "document-intelligence"
compatibility_date = "2024-09-01"
pages_build_output_dir = "dist"

[vars]
APP_NAME = "Document Intelligence"

# Secrets set via dashboard or `wrangler secret put`:
# ANTHROPIC_API_KEY
# VOYAGE_API_KEY
```

---

## `package.json` (root)

```json
{
  "name": "document-intelligence",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "deploy": "vite build && wrangler pages deploy dist"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.26.0",
    "zustand": "^4.5.0",
    "react-dropzone": "^14.2.0",
    "plotly.js-dist-min": "^2.34.0",
    "react-plotly.js": "^2.6.0",
    "umap-js": "^1.3.3",
    "ml-pca": "^4.1.1",
    "idb-keyval": "^6.2.1",
    "papaparse": "^5.4.1",
    "clsx": "^2.1.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "vite": "^5.4.0",
    "wrangler": "^3.80.0"
  }
}
```

---

## Storage Strategy

**Client-side (IndexedDB via `idb-keyval`):**
- Corpora stored locally in browser — no backend database required
- Embeddings stored as `Float32Array` serialized to JSON
- Multiple corpora supported; listed on Home page
- Export corpus as `.json` file for sharing/backup
- Import corpus from `.json` file

**No server-side persistence required** — the Worker is stateless. All state lives in the browser. This keeps the architecture simple, private (user data never leaves their browser), and free of database costs.

**IndexedDB schema:**
```
store: "corpora"
  key: corpus.id (UUID)
  value: Corpus object (with all documents + embeddings)

store: "candidates"
  key: candidate.id
  value: Candidate object (per-corpus, linked by corpusId)
```

---

## Deployment Instructions

```bash
# 1. Clone and install
git clone https://github.com/[username]/Document_Intelligence
cd Document_Intelligence
npm install

# 2. Local dev (Functions run locally via wrangler)
npx wrangler pages dev --compatibility-date=2024-09-01

# 3. Set secrets (one time)
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put VOYAGE_API_KEY

# 4. Deploy
npm run deploy
# → Builds React app to /dist
# → Deploys to Cloudflare Pages
# → Functions auto-deployed as Workers under /api/*
```

---

## Build Phases

### Phase 1 — Foundation
- [ ] Scaffold repo: Vite + React + Tailwind + Wrangler
- [ ] Implement `/api/embed` Worker (Voyage AI)
- [ ] Corpus Builder: DropZone → FieldMapper → EmbedProgress
- [ ] IndexedDB storage layer
- [ ] Basic corpus list on Home page

### Phase 2 — Exploration
- [ ] UMAP/PCA reduction pipeline (client-side)
- [ ] SemanticMap (Plotly scatter with hover + click)
- [ ] PointInspector (metadata + KNN)
- [ ] SearchBar (fuzzy highlight)
- [ ] Export: neighbors CSV

### Phase 3 — Comparison
- [ ] Comparator page: two-population cross-neighbor analysis
- [ ] `/api/summarize` Worker + AI Insight card
- [ ] `/api/analyze` Worker + cluster naming overlay

### Phase 4 — Generation
- [ ] TargetPicker (click/lasso zone selection)
- [ ] GeneratorForm + `/api/generate` Worker
- [ ] CandidateCard + PlacementVerifier (embed → transform → plot)
- [ ] Iteration loop (regenerate, accept to corpus)

### Phase 5 — Polish
- [ ] PDF upload support (extract text client-side)
- [ ] Cluster auto-naming on map
- [ ] Export full report (markdown)
- [ ] Corpus sharing via JSON import/export
- [ ] "Describe zone" → Claude finds matching region

---

## Example Use Cases (to drive testing)

1. **Email Subject Lines** — Upload `subject_lines_deduped.csv` with `Category` = "SL Bank" | "Top SL". Find semantic neighborhoods of top performers. Generate new subject lines that land in those zones.

2. **Presidential Speeches** — Upload State of the Union texts. Compare Obama era vs. Trump era vs. Biden era. Find semantic bridges. Generate a new speech excerpt targeting the "economic optimism" cluster.

3. **Social Media Posts** — Upload viral vs. non-viral posts. Identify the semantic territory of viral content. Generate new posts with placement verification.

4. **Job Postings** — Upload high-apply vs. low-apply job descriptions. Map what "high-apply" means semantically. Generate new postings for open roles.

5. **Book Chapters** — Upload chapters from multiple books. Find thematic clusters. Generate a new chapter excerpt in the style of a specific semantic region.

---

## Key Design Decisions & Rationale

| Decision | Choice | Rationale |
|---|---|---|
| Embeddings API | Voyage AI | Anthropic's official embeddings partner; `voyage-3` outperforms OpenAI `text-embedding-3-large` on most benchmarks |
| LLM | Anthropic Claude | Sonnet for generation (quality), Haiku for summarization (speed/cost) |
| Dimensionality reduction | Client-side UMAP | Workers have CPU limits; browser handles this fine for <10k docs |
| KNN | Brute-force cosine | No server, runs in-browser; fast enough for <50k docs without FAISS |
| Persistence | IndexedDB | No DB costs, fully private, exportable |
| Deployment | Cloudflare Pages + Functions | One deploy command, zero cold starts, global edge |
| Framework | React + Zustand | Lightweight, no overkill; Zustand for corpus/map state |

---

*Seed authored for repo: `Document_Intelligence` | Cloudflare Pages + Workers + Voyage AI + Anthropic Claude*
