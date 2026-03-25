# Document Intelligence

**Meaning has geometry.** Documents with similar meaning occupy the same neighborhoods in high-dimensional vector space. Document Intelligence makes that geometry visible, navigable, and generative.

Upload a collection of documents — emails, speeches, product descriptions, research abstracts, anything — and watch them arrange themselves into a semantic landscape. Explore clusters. Compare populations. Then generate entirely new documents that target specific regions of meaning.

[Live Demo](https://document-intelligence.pages.dev) | [Architecture](#architecture) | [User Guide](#user-guide) | [Deployment](#deployment)

---

## Philosophy

Most text analysis tools treat documents as bags of words. They count frequencies, extract keywords, and build topic models — all useful, but blind to the deeper structure of meaning.

Document Intelligence takes a different approach. It uses neural embeddings ([Voyage AI](https://www.voyageai.com/)) to represent each document as a point in 1024-dimensional space, where **proximity encodes semantic similarity**. Two documents about "quarterly revenue growth" and "fiscal performance improvements" land near each other — not because they share words, but because they share meaning.

The platform then uses [UMAP](https://umap-learn.readthedocs.io/) to project that high-dimensional space down to a 2D map you can see and interact with. What emerges is a topography of meaning: clusters, gradients, outliers, and boundaries between concepts.

The real power comes from the generative layer. Once you can see where meaning lives, you can point to a region and say "generate something that belongs here." Claude doesn't just write — it writes *with semantic intent*, producing documents that land in the neighborhood you specified. You verify this by embedding the output and checking where it actually falls on the map.

This is not search. This is not summarization. This is **spatial reasoning over meaning**.

---

## What It Does

### Cinematic Entry
First-time visitors experience a three-stage cinematic reveal that frames the core insight: your documents have a hidden geometric structure, and this tool makes it visible.

### Home Dashboard
The dashboard orients you with a workflow overview (Upload → Explore → Compare & Generate), key concept definitions (semantic embedding, cosine similarity, UMAP projection, target zone), and quick access to your corpus library.

### 1. Corpus Builder
Upload your document collection and transform it into an explorable semantic space.

- **Accepts** CSV, JSON, or plain text files (with expandable data format specifications)
- **Maps** your columns to the document schema with rich explanations:
  - **ID** — A unique identifier: document number, transaction hash, ISBN, SKU
  - **Content** — The actual body text that gets embedded: email body, book chapter, product description
  - **Title** — A short display label: book title, email subject, page name
  - **Category** — High-level taxonomy: fiction vs. non-fiction, department, product line
- **Pro tip on Category** — Use categories strategically for performance analysis: label top-performing documents (best sellers, highest engagement) as a "Top" category, then use the Comparator to find what semantic patterns distinguish winners, and the Generator to produce more content like your best content
- **Embeds** every document using Voyage AI (batched, with automatic retry)
- **Stores** everything locally in your browser (IndexedDB) — your data never hits a database

### 2. Semantic Explorer
An interactive 2D scatter plot where every point is a document, positioned by meaning.

- **Conceptual guide** explains how to read the map: what dots represent, what colors mean, what clusters indicate, how proximity encodes similarity
- **Color-coded** by category — tight clusters indicate semantic coherence; intermixed colors show overlap
- **Category legend** overlay for quick reference
- **Click** any point to open the Document Inspector:
  - Full document text and metadata
  - AI-powered summarization via Claude
  - **15 nearest neighbors** with color-coded similarity badges (Very Similar, Related, Loosely Related, Distant)
  - Category filter to see neighbors from specific populations
  - One-click navigation to the Generator with pre-selected neighborhood
- **Lasso select** to highlight and inspect regions
- **Search** by title or content
- **Export** corpus as JSON (explanatory tooltips describe what each export contains)

### 3. Population Comparator
Select two document categories and understand exactly how they relate semantically.

- **Expandable cosine similarity guide** explains the metric with color-coded ranges (0.8–1.0 Very Similar → 0.0–0.3 Unrelated)
- **Cross-neighborhood analysis**: For every document in Population A, find its 25 nearest neighbors in Population B
- **Color-coded similarity histogram**: bars colored by similarity range (green=high, yellow=moderate, red=low) with labeled axes
- **AI Insight**: Claude analyzes sample documents from both populations and explains what distinguishes them
- **Color-coded similarity table**: score colors in the results table match the histogram ranges
- **Export CSV**: downloadable with explanatory note about what it contains and how to use it

### 4. Document Generator
Point to a region on the semantic map and synthesize new documents that belong there. The system handles the hard part automatically.

- **Select a target zone** by clicking a point (uses its 10 nearest neighbors) or lasso-selecting a region (computes centroid)
- **Persistent target zone**: stays visible as a reference throughout the process
- **Configure**: describe what you want, choose a style (Formal, Conversational, Urgent, Playful, Minimal, Persuasive)
- **Automatic pipeline**: one click triggers the full flow:
  1. Claude generates **10 candidates**
  2. All 10 are **embedded into semantic space** via Voyage AI
  3. All 10 are **projected onto the existing UMAP map**
  4. Ranked by **cosine similarity** to the target zone centroid
  5. **Top 5 closest** are automatically added to the corpus
- **Visual results**: all 10 candidates shown on the map — gold stars for accepted (top 5), gray circles for the rest
- **Ranked display**: candidates listed by rank with placement badges (On Target / Adjacent / Off Target)
- **Clear exit**: success panel shows accepted count, links to View Updated Map, Export Report, Generate Another Round, or return to Dashboard

---

## Understanding Cosine Similarity

Cosine similarity is the core metric throughout Document Intelligence. It measures the angle between two document vectors in semantic space, producing a score from 0 to 1:

| Score Range | Label | Meaning |
|------------|-------|---------|
| **0.8 – 1.0** | Very Similar | Nearly identical meaning. These documents cover the same topic in the same way. |
| **0.6 – 0.8** | Related | Same general topic or theme. Strong semantic overlap. |
| **0.3 – 0.6** | Loosely Related | Some thematic connection but substantially different content. |
| **0.0 – 0.3** | Unrelated | Different domains or topics entirely. |

Unlike simple word overlap, cosine similarity captures *semantic* relationships. "Revenue growth exceeded projections" and "Fiscal performance surpassed forecasts" score 0.85+ despite sharing zero words. This makes it powerful for discovering non-obvious connections.

---

## Data Exports

Document Intelligence provides several export options:

| Export | Format | What It Contains | Use Case |
|--------|--------|-----------------|----------|
| **Corpus JSON** | `.json` | All documents with titles, content, categories, **and embeddings** | Full backup, import into Python/R, re-embed analysis, share with colleagues |
| **Top 25 Neighbors** | `.csv` | A single document's nearest neighbors with similarity + content preview | Analyze a specific document's semantic neighborhood |
| **Category Neighbors** | `.csv` | Unique neighbors across ALL docs in a category, deduplicated, with source counts | Find what content is semantically adjacent to an entire population |
| **Comparison CSV** | `.csv` | All cross-population document pairs with similarity scores | Deep analysis of population overlap in external tools |
| **Comparison Report** | `.md` | Stats, distribution table, AI insight, top 50 pairs | Shareable analysis report with narrative |
| **Generation Report** | `.md` | Target zone exemplars, all candidates ranked, accepted docs with full content | Document what was generated and why |

Exports are available via buttons in the Explorer (top bar), Document Inspector (neighbor list), and Comparator (results section).

---

## Architecture

```
Browser (Client)                          Cloudflare (Edge)
+---------------------------+             +---------------------------+
|  React 19 + Vite          |   HTTPS     |  Worker (API Proxy)       |
|  Tailwind CSS + Plotly    | ----------> |  worker/index.js          |
|  Zustand (state)          |             |                           |
|  IndexedDB (storage)      |             |  Secrets:                 |
|                           |             |    VOYAGE_API_KEY          |
|  Client-side compute:     |             |    ANTHROPIC_API_KEY       |
|    PCA (ml-pca)           |             +---------------------------+
|    UMAP (umap-js)         |                    |            |
|    KNN (cosine sim)       |                    v            v
+---------------------------+             Voyage AI      Anthropic
                                          (embeddings)   (Claude)
```

### Why This Architecture?

| Decision | Rationale |
|----------|-----------|
| **Client-side UMAP/PCA** | No server roundtrips for dimensionality reduction. Works offline after embedding. |
| **Client-side IndexedDB** | Your documents stay in your browser. No server database to manage or secure. |
| **Separate Worker for API keys** | Secrets never touch the static frontend. The Worker is a thin proxy — no business logic on the server. |
| **Cloudflare Pages + Workers** | Global edge deployment. The static site loads fast everywhere; the Worker handles API calls with minimal latency. |
| **Voyage AI embeddings** | Purpose-built for retrieval and similarity. 1024-dimensional vectors balance quality and performance. |
| **Claude for generation** | Sonnet for high-quality document synthesis. Haiku for fast summarization and analysis. |

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| UI Framework | [React 19](https://react.dev/) | Component-based interface |
| Build Tool | [Vite 7](https://vite.dev/) | Fast development and optimized production builds |
| Styling | [Tailwind CSS 3](https://tailwindcss.com/) | Utility-first dark theme |
| State | [Zustand 5](https://zustand.docs.pmnd.rs/) | Lightweight global state management |
| Visualization | [Plotly.js 3](https://plotly.com/javascript/) | Interactive scatter plots with lasso selection |
| Storage | [idb-keyval](https://github.com/nicedoc/idb-keyval) | Simple IndexedDB abstraction |
| Dimensionality Reduction | [umap-js](https://github.com/PAIR-code/umap-js) + [ml-pca](https://github.com/mljs/pca) | 1024D → 50D (PCA) → 2D (UMAP) |
| File Parsing | [Papa Parse](https://www.papaparse.com/) | CSV parsing; native JSON/TXT handling |
| Embeddings API | [Voyage AI](https://www.voyageai.com/) | voyage-3.5-lite (fast) or voyage-3.5 (quality) |
| LLM API | [Anthropic Claude](https://www.anthropic.com/) | claude-sonnet-4-6 (generation), claude-haiku-4-5 (summarization) |
| Hosting | [Cloudflare Pages](https://pages.cloudflare.com/) | Static site hosting with auto-deploy from GitHub |
| API Proxy | [Cloudflare Workers](https://workers.cloudflare.com/) | Edge-deployed API proxy holding secrets |

---

## User Guide

### Getting Started

#### Step 1: Create a Corpus

1. Click **+ New Corpus** from the home dashboard
2. **Upload** a file (expandable data format specs are available inline):
   - **CSV**: Each row is a document. Must have a header row. You'll map columns in the next step.
   - **JSON**: An array of objects `[{"title": "...", "content": "..."}, ...]`
   - **TXT**: Each line becomes a separate document automatically.
   - Best results with 10–10,000 documents. Richer text (10+ words per document) produces better embeddings.
3. **Configure** your corpus:
   - **Corpus Name**: A label for this collection (e.g., "Q4 Email Subjects")
   - **Domain**: Describe the document type — be specific, this context helps Claude later
   - **Content** (required): The column containing the text to embed — the actual substance of each document
   - **Title**: A short display label (book title, email subject, page name)
   - **ID**: A unique identifier (document number, transaction hash, ISBN)
   - **Category**: The high-level grouping — this is where strategic thinking pays off:
     - Basic taxonomy: fiction vs. non-fiction, department, product line
     - **Performance analysis**: Label top performers as a "Top" category, then compare to see what semantic patterns distinguish winners, and generate more content like your best
   - **Embedding Model**: `voyage-3.5-lite` is faster/cheaper; `voyage-3.5` is higher quality
4. **Embed**: Documents are batched (100 at a time) with automatic retry on rate limits. ~30-60 seconds for 1,000 documents.

#### Step 2: Explore the Semantic Map

The Explorer opens with a conceptual guide banner explaining how to read the map. Key interactions:

- **Read the map**: Each dot = a document. Proximity = semantic similarity. Colors = categories. Clusters = shared themes.
- **Click a point**: Opens the Document Inspector with full text, AI summarization, and 15 nearest neighbors with color-coded similarity badges.
- **Lasso select**: Drag to select a region of points.
- **Search**: Find specific documents by title or content.
- **Navigate neighbors**: Click any neighbor to jump to it — traverse the semantic graph.
- **Filter**: In the inspector, filter neighbors by category to see cross-population connections.

#### Step 3: Compare Populations

1. Select **Population A** and **Population B**
2. Click **Run Analysis** — computes cross-neighborhood similarities
3. Read the **color-coded histogram**: green bars = high similarity pairs, red bars = low similarity pairs
4. Check the **mean similarity** — above 0.7 means the populations are semantically close
5. Click **AI Insight** for Claude's analysis of what distinguishes the populations
6. **Export CSV** for deeper analysis in external tools (Excel, Python, R)

#### Step 4: Generate New Documents

1. **Select a target zone** on the map (click a point or lasso-select)
2. **Review exemplars** — the target zone panel stays visible as your reference
3. **Write a specific prompt** — "Write formal product descriptions for enterprise SaaS tools" beats "Write something similar"
4. **Click "Generate 10 & Auto-Select Top 5"** — the system handles everything:
   - Generates 10 candidates via Claude
   - Embeds all 10 into semantic space
   - Projects all 10 onto the UMAP map
   - Ranks by cosine similarity to the target zone
   - Automatically adds the top 5 to your corpus
5. **Review results** — all 10 candidates are displayed ranked by similarity with placement badges. The map shows gold stars for accepted (top 5) and gray circles for the rest.
6. **Export or continue** — download a generation report, view the updated map, or generate another round with a refined prompt.

---

## Deployment

### Prerequisites
- A [Cloudflare](https://dash.cloudflare.com/) account
- A [Voyage AI](https://www.voyageai.com/) API key
- An [Anthropic](https://console.anthropic.com/) API key

### 1. Deploy the Worker (API Proxy)

1. In the Cloudflare dashboard, go to **Workers & Pages** → **Create** → **Create Worker**
2. Name it `document-intelligence-api` and click **Deploy**
3. Click **Edit Code**, delete the placeholder, and paste the contents of `worker/index.js`
4. Click **Deploy**
5. Go to the Worker's **Settings** → **Variables and Secrets**
6. Add two encrypted variables:
   - `ANTHROPIC_API_KEY` = your Anthropic key
   - `VOYAGE_API_KEY` = your Voyage AI key

Your Worker URL will be: `https://document-intelligence-api.<your-account>.workers.dev`

### 2. Deploy the Frontend (Cloudflare Pages)

1. Go to **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. Select the `Document_Intelligence` repository
3. Configure:
   - **Production branch**: `main`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Click **Save and Deploy**

### 3. Update the API URL

If your Worker URL differs from the one hardcoded in `src/lib/api.js`, update line 3:
```js
const API_BASE = import.meta.env.DEV
  ? 'http://localhost:8788'
  : 'https://your-worker-name.your-account.workers.dev';
```

### Local Development

```bash
git clone https://github.com/jethomasphd/Document_Intelligence.git
cd Document_Intelligence
npm install

# Create .dev.vars for local Worker secrets
echo "VOYAGE_API_KEY=your-key" > .dev.vars
echo "ANTHROPIC_API_KEY=your-key" >> .dev.vars

# Run frontend + Worker locally
npx wrangler pages dev -- npm run dev
```

---

## Project Structure

```
Document_Intelligence/
  src/
    pages/
      Landing.jsx            # Cinematic reveal entry experience
      Home.jsx               # Dashboard with workflow guide + corpus library
      CorpusNew.jsx          # 3-step corpus creation wizard
      Explorer.jsx           # Semantic map + document inspector
      Comparator.jsx         # Population cross-analysis
      Generator.jsx          # Generative document synthesis
    components/
      Layout.jsx             # App shell (header, navigation)
      ui/
        Tooltip.jsx           # Hover tooltip component
        InfoHint.jsx          # (?) contextual help icons
        StepGuide.jsx         # Step-by-step progress indicator
      corpus/
        DropZone.jsx          # File upload with data format specs
        FieldMapper.jsx       # Column mapping with field explanations
        EmbedProgress.jsx     # Batch embedding progress bar
      explorer/
        SemanticMap.jsx       # Plotly 2D scatter plot + UMAP compute
        PointInspector.jsx    # Document detail + neighbors with similarity badges
        SearchBar.jsx         # Full-text search with results dropdown
      generator/
        MiniMap.jsx           # Compact map for zone selection
        TargetZone.jsx        # Persistent exemplar list with reset
        CandidateCard.jsx     # Generated candidate with verify/accept
    lib/
      api.js                 # Fetch wrappers for Worker API routes
      storage.js             # IndexedDB CRUD with binary embedding encoding
      umap.js                # PCA preprocessing + UMAP projection + transform
      knn.js                 # Cosine similarity, KNN search, zone centroid
      export.js              # JSON, CSV, Markdown export utilities
    store/
      index.js               # Zustand global state
    main.jsx                 # React entry point + routing
    index.css                # Tailwind directives + dark theme CSS
  worker/
    index.js                 # Cloudflare Worker: API proxy for Voyage + Anthropic
  public/                    # Static assets
  index.html                 # HTML entry point
  package.json               # Dependencies and scripts
  vite.config.js             # Vite config with code-splitting
  tailwind.config.js         # Dark theme color palette and fonts
  wrangler.toml              # Cloudflare Pages configuration
```

---

## Example Use Cases

| Corpus | What You Learn | What You Generate |
|--------|---------------|-------------------|
| **Email subject lines** by department | Which departments write similarly; who's an outlier | New subjects matching a specific department's voice |
| **Product descriptions** by category | How product language clusters; where categories blur | Descriptions for new products that fit an existing category |
| **Political speeches** by era | How rhetoric shifts over decades; which eras echo each other | Speeches in the style of a specific historical period |
| **Customer reviews** by rating | What separates 5-star language from 1-star | Review text targeting a specific sentiment zone |
| **Job postings** by industry | How industries describe roles differently | Postings that match a target industry's semantic signature |
| **Research abstracts** by field | Where disciplines overlap; emerging interdisciplinary zones | Abstracts positioned at the boundary of two fields |
| **Top performers** vs. rest | What semantic patterns distinguish winners | More content like your best-performing documents |

---

## License

[MIT](LICENSE)
