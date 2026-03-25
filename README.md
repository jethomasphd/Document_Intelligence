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

### 1. Corpus Builder
Upload your document collection and transform it into an explorable semantic space.

- **Accepts** CSV, JSON, or plain text files
- **Maps** your columns to the document schema (content, title, category, ID)
- **Embeds** every document using Voyage AI's neural embedding models
- **Stores** everything locally in your browser (IndexedDB) — your data never hits a database

### 2. Semantic Explorer
An interactive 2D scatter plot where every point is a document, positioned by meaning.

- **Color-coded** by category so population structure is immediately visible
- **Click** any point to inspect the full document, its metadata, and its 15 nearest semantic neighbors
- **Search** across your entire corpus with real-time text matching
- **Summarize** any document on demand via Claude
- **Export** your corpus as JSON, neighbor lists as CSV, or full reports as Markdown

### 3. Population Comparator
Select two document categories and understand exactly how they relate semantically.

- **Cross-neighborhood analysis**: For every document in Population A, find its 25 nearest neighbors in Population B
- **Similarity distribution**: A histogram showing where the cross-population similarities concentrate
- **AI Insight**: Claude analyzes sample documents from both populations and explains what distinguishes them
- **Export** all pairwise similarity scores as CSV

### 4. Document Generator
Point to a region on the semantic map and synthesize new documents that belong there.

- **Select a target zone** by clicking a point (uses its neighborhood) or lasso-selecting a region
- **Configure generation**: describe what you want, choose a style (Formal, Conversational, Urgent, Playful, Minimal, Persuasive), set the count (1-10)
- **Verify placement**: each generated candidate gets embedded and projected onto the existing map, with a similarity badge showing how close it landed to the target zone
  - **On Target** (>0.8 cosine similarity to zone centroid)
  - **Adjacent** (0.6-0.8)
  - **Off Target** (<0.6)
- **Accept** verified candidates directly into your corpus

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
| Dimensionality Reduction | [umap-js](https://github.com/PAIR-code/umap-js) + [ml-pca](https://github.com/mljs/pca) | 1024D -> 50D (PCA) -> 2D (UMAP) |
| File Parsing | [Papa Parse](https://www.papaparse.com/) | CSV parsing; native JSON/TXT handling |
| Embeddings API | [Voyage AI](https://www.voyageai.com/) | voyage-3.5-lite (fast) or voyage-3.5 (quality) |
| LLM API | [Anthropic Claude](https://www.anthropic.com/) | claude-sonnet-4-6 (generation), claude-haiku-4-5 (summarization) |
| Hosting | [Cloudflare Pages](https://pages.cloudflare.com/) | Static site hosting with auto-deploy from GitHub |
| API Proxy | [Cloudflare Workers](https://workers.cloudflare.com/) | Edge-deployed API proxy holding secrets |

---

## User Guide

### Getting Started

#### Step 1: Create a Corpus

1. Click **+ New Corpus** from the home page
2. **Upload** a file:
   - **CSV**: Each row is a document. You'll map columns in the next step.
   - **JSON**: An array of objects. Same column mapping.
   - **TXT**: Each line becomes a document automatically.
3. **Configure** your corpus:
   - **Corpus Name**: A label for this collection (e.g., "Q4 Email Subjects")
   - **Domain**: Describe the document type — this context helps Claude generate better content later
   - **Content**: Select the column containing the text to embed (required)
   - **Title**: Select a display label column (optional)
   - **Category**: Select a column to split documents into populations for comparison (optional)
   - **Embedding Model**: `voyage-3.5-lite` is faster; `voyage-3.5` is higher quality
4. **Embed**: The system batches your documents (100 at a time) and sends them to Voyage AI. A progress bar tracks completion. For 1,000 documents, expect about 30-60 seconds.

After embedding completes, you're automatically taken to the Explorer.

#### Step 2: Explore the Semantic Map

The Explorer is where you spend most of your time. When you first arrive, the system computes a UMAP projection (this can take a few seconds for large corpora).

**Reading the Map:**
- Each **point** is a document. Hover to see its title and content preview.
- **Colors** correspond to categories. Documents of the same type naturally cluster together — this is the geometry of meaning at work.
- **Clusters** indicate semantic similarity. Tight clusters share strong thematic overlap. Scattered points are semantically diverse.
- **Bridges** between clusters suggest documents that share aspects of both populations.

**Interacting:**
- **Click** a point to open the Document Inspector on the right. You'll see the full text, metadata, category, and 15 nearest neighbors ranked by cosine similarity.
- **Lasso select** by dragging on the map to select a region of points.
- **Search** using the search bar to find specific documents by title or content.
- **Summarize** a document by clicking the gold "Summarize" button in the inspector — Claude produces a concise summary.
- **Jump** to any neighbor in the list to navigate the semantic graph.

**Navigation bar links:**
- **Compare** — takes you to the Population Comparator for this corpus
- **Generate** — takes you to the Document Generator
- **Export** — downloads the corpus as JSON (without embeddings, for portability)

#### Step 3: Compare Populations

If your corpus has multiple categories, the Comparator reveals how they relate.

1. Select **Population A** and **Population B** from the dropdown menus
2. Click **Run Analysis**
3. Review the results:
   - **Histogram**: Shows the distribution of cross-population cosine similarities. A peak near 1.0 means the populations are semantically similar. A peak near 0.5 means they're quite different.
   - **Mean Similarity**: The average across all cross-population neighbor pairs.
   - **AI Insight**: Click the gold button to have Claude analyze sample documents from both populations and explain what distinguishes them — what themes overlap, what diverges, and what the similarity score suggests.
4. **Export CSV** to download all pairwise similarity scores for further analysis.

#### Step 4: Generate New Documents

The Generator lets you synthesize new documents that target a specific semantic zone.

1. **Select a target zone** on the mini-map:
   - **Click a point** to use its semantic neighborhood (10 nearest neighbors become exemplars)
   - **Lasso select** a region to use those documents as the zone (centroid computed automatically)
2. **Review exemplars**: The Target Zone panel shows the documents defining your zone, ranked by similarity to the centroid.
3. **Write a prompt**: Describe what you want generated. Be specific — "Write formal product descriptions for enterprise SaaS tools" works better than "Write something similar."
4. **Choose a style**: Formal, Conversational, Urgent, Playful, Minimal, or Persuasive.
5. **Set count**: How many candidates to generate (1-10).
6. **Click Generate**: Claude produces candidates based on the exemplars and your prompt.
7. **Verify each candidate**: Click "Verify Placement" to embed the generated text and see where it actually lands on the semantic map:
   - A gold star appears on the mini-map showing its projected position
   - A badge shows similarity to the zone centroid (On Target / Adjacent / Off Target)
8. **Accept** verified candidates to add them permanently to your corpus.

---

## Deployment

### Prerequisites
- A [Cloudflare](https://dash.cloudflare.com/) account
- A [Voyage AI](https://www.voyageai.com/) API key
- An [Anthropic](https://console.anthropic.com/) API key

### 1. Deploy the Worker (API Proxy)

1. In the Cloudflare dashboard, go to **Workers & Pages** > **Create** > **Create Worker**
2. Name it `document-intelligence-api` and click **Deploy**
3. Click **Edit Code**, delete the placeholder, and paste the contents of `worker/index.js`
4. Click **Deploy**
5. Go to the Worker's **Settings** > **Variables and Secrets**
6. Add two encrypted variables:
   - `ANTHROPIC_API_KEY` = your Anthropic key
   - `VOYAGE_API_KEY` = your Voyage AI key

Your Worker URL will be: `https://document-intelligence-api.<your-account>.workers.dev`

### 2. Deploy the Frontend (Cloudflare Pages)

1. Go to **Workers & Pages** > **Create** > **Pages** > **Connect to Git**
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

Commit, push, and Pages will auto-rebuild.

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
      Home.jsx              # Corpus library grid
      CorpusNew.jsx         # 3-step corpus creation wizard
      Explorer.jsx          # Semantic map + document inspector
      Comparator.jsx        # Population cross-analysis
      Generator.jsx         # Generative document synthesis
    components/
      Layout.jsx            # App shell (header, navigation)
      corpus/
        DropZone.jsx         # File upload (CSV/JSON/TXT)
        FieldMapper.jsx      # Column-to-field mapping
        EmbedProgress.jsx    # Batch embedding progress bar
      explorer/
        SemanticMap.jsx      # Plotly 2D scatter plot + UMAP compute
        PointInspector.jsx   # Document detail + neighbors panel
        SearchBar.jsx        # Full-text search with results dropdown
      generator/
        MiniMap.jsx          # Compact map for zone selection
        TargetZone.jsx       # Exemplar list panel
        CandidateCard.jsx    # Generated candidate with verify/accept
    lib/
      api.js                # Fetch wrappers for Worker API routes
      storage.js            # IndexedDB CRUD with binary embedding encoding
      umap.js               # PCA preprocessing + UMAP projection + transform
      knn.js                # Cosine similarity, KNN search, zone centroid
      export.js             # JSON, CSV, Markdown export utilities
    store/
      index.js              # Zustand global state (corpus list, selections, map)
    main.jsx                # React entry point + routing
    index.css               # Tailwind directives + dark theme CSS variables
  worker/
    index.js                # Cloudflare Worker: API proxy for Voyage + Anthropic
  public/                   # Static assets
  index.html                # HTML entry point with font imports
  package.json              # Dependencies and scripts
  vite.config.js            # Vite config with code-splitting
  tailwind.config.js        # Dark theme color palette and fonts
  wrangler.toml             # Cloudflare Pages configuration
  eslint.config.js          # ESLint rules
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

---

## License

[MIT](LICENSE)
