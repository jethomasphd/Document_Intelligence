# Document Intelligence

**You have thousands of documents. Somewhere inside them is a pattern: what works, what doesn't, and why. But that pattern is invisible when you're reading one file at a time.**

Document Intelligence maps your entire document collection into a single semantic landscape. Every document becomes a point, positioned by meaning. Similar content clusters together. Gaps reveal where nothing exists yet. The next thing worth creating becomes obvious.

[Live Demo](https://document-intelligence.pages.dev)

---

## What It Does

### 1. Corpus Builder
Upload CSV, JSON, or plain text. Map your columns to the document schema (content, title, category, ID). Choose an embedding model. The system batches your documents through Voyage AI and stores everything locally in your browser.

### 2. Semantic Explorer
An interactive 2D scatter plot where every point is a document, positioned by meaning. Click any point to inspect it, see its 25 nearest neighbors with color-coded similarity badges, summarize it with AI, and export its neighborhood. Selected points are highlighted with a red ring. Lasso-select regions. Search by text.

### 3. Population Comparator
Select two categories. For every document in Population A, the system finds its 25 nearest neighbors in Population B and measures cosine similarity. The result is a color-coded histogram showing where populations overlap and diverge. Get AI-powered narrative analysis. Export results as CSV or a full Markdown report.

### 4. Document Generator
Select a target zone on the map. The system generates 10 candidates via Claude, embeds all 10 into the same vector space, projects them onto the 2D map, and ranks by cosine similarity to the zone centroid. The target zone stays highlighted in red throughout. Gold stars mark the top 5 candidates. Gray circles show the rest. Export results as CSV.

Generated documents are **not** saved to your corpus. They exist as their own export, cleanly separated from your source data.

---

## How Generation Works

1. **Claude generates text** based on your exemplar documents and prompt
2. **Voyage AI embeds** each candidate into a 1024-dimensional vector (same model as your corpus)
3. **Cosine similarity** scores each candidate against the zone centroid
4. **UMAP projection** places candidates on the existing 2D map via nearest-neighbor interpolation in PCA-reduced space
5. **Ranking** sorts all 10 by similarity. Top 5 are highlighted.

The map is the ground truth. If a candidate lands near your target zone, it genuinely shares the semantic characteristics of that region.

---

## Understanding Cosine Similarity

| Score | Label | Meaning |
|-------|-------|---------|
| **0.8 - 1.0** | Very Similar | Nearly identical meaning |
| **0.6 - 0.8** | Related | Same topic or theme |
| **0.3 - 0.6** | Loosely Related | Some thematic overlap |
| **0.0 - 0.3** | Unrelated | Different domains entirely |

Unlike keyword matching, cosine similarity captures *semantic* relationships. "Revenue growth" and "fiscal performance" score 0.85+ despite sharing zero words.

---

## Data Exports

| Export | Format | Available From | Contents |
|--------|--------|---------------|----------|
| **Corpus CSV** | `.csv` | Explorer | Documents with id, title, category, content |
| **Corpus JSON** | `.json` | Explorer | Full backup with embeddings (1024-dim vectors) |
| **Top 25 Neighbors** | `.csv` | Explorer (Inspector) | A single document's nearest neighbors with similarity scores |
| **Category Neighbors** | `.csv` | Explorer (Inspector) | Unique neighbors across all docs in a category, deduplicated |
| **Comparison CSV** | `.csv` | Comparator | All cross-population document pairs with similarity scores |
| **Comparison Report** | `.md` | Comparator | Stats, distribution, AI insight, top 50 pairs |
| **Generated Top 5** | `.csv` | Generator | Top 5 candidates with rank, similarity, placement |
| **Generated All 10** | `.csv` | Generator | All candidates ranked |

All data is stored locally in your browser via IndexedDB. Nothing is sent to a server except during embedding and generation API calls.

---

## Architecture

```
Browser (Client)                          Cloudflare (Edge)
+---------------------------+             +---------------------------+
|  React 19 + Vite 7        |   HTTPS     |  Worker (API Proxy)       |
|  Tailwind CSS + Plotly     | ---------> |  worker/index.js          |
|  Zustand (state)           |             |                           |
|  IndexedDB (storage)       |             |  Secrets:                 |
|                            |             |    VOYAGE_API_KEY          |
|  Client-side compute:      |             |    ANTHROPIC_API_KEY       |
|    PCA (ml-pca)            |             +---------------------------+
|    UMAP (umap-js)          |                    |            |
|    KNN (cosine sim)        |                    v            v
+---------------------------+             Voyage AI      Anthropic
                                          (embeddings)   (Claude)
```

| Decision | Rationale |
|----------|-----------|
| Client-side UMAP/PCA | No server roundtrips for dimensionality reduction |
| Client-side IndexedDB | Your documents never leave your browser |
| Separate Worker | Secrets never touch the static frontend |
| Cloudflare Pages + Workers | Global edge deployment, fast everywhere |
| Voyage AI | Purpose-built embeddings for semantic similarity |
| Claude Sonnet/Haiku | Sonnet for generation quality, Haiku for fast analysis |

---

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| UI | [React](https://react.dev/) | 19 |
| Build | [Vite](https://vite.dev/) | 7 |
| Styling | [Tailwind CSS](https://tailwindcss.com/) | 3 |
| State | [Zustand](https://zustand.docs.pmnd.rs/) | 5 |
| Visualization | [Plotly.js](https://plotly.com/javascript/) | 3 |
| Storage | [idb-keyval](https://github.com/nicedoc/idb-keyval) | 6 |
| Dimensionality | [umap-js](https://github.com/PAIR-code/umap-js) + [ml-pca](https://github.com/mljs/pca) | — |
| Parsing | [Papa Parse](https://www.papaparse.com/) | 5 |
| Embeddings | [Voyage AI](https://www.voyageai.com/) | voyage-3.5-lite / voyage-3.5 |
| LLM | [Anthropic Claude](https://www.anthropic.com/) | Sonnet 4.6 / Haiku 4.5 |
| Hosting | [Cloudflare Pages](https://pages.cloudflare.com/) + [Workers](https://workers.cloudflare.com/) | — |

---

## User Guide

### Step 1: Create a Corpus

1. Click **+ New Corpus**
2. Upload a CSV, JSON, or TXT file (10-10,000+ documents, richer text = better embeddings)
3. Map columns: **Content** (required), Title, ID, Category
4. Choose embedding model:
   - **voyage-3.5-lite**: fast, good for short docs (subject lines, tweets, headlines)
   - **voyage-3.5**: higher fidelity, good for complex docs (papers, chapters, legal)
5. Wait for embedding (~30-60 seconds for 1,000 documents)

**Pro tip**: Use Category to tag top-performing documents. Then compare top performers vs. the rest to find what semantic patterns distinguish winners.

### Step 2: Explore the Map

- **Dots** = documents. **Proximity** = semantic similarity. **Colors** = categories.
- **Click** a point to inspect it: full content, AI summary, 25 nearest neighbors with similarity badges
- **Lasso select** to highlight a region
- **Search** by title or content
- **Export** as CSV (documents) or JSON (with embeddings)

### Step 3: Compare Populations

1. Select Population A and Population B
2. Click **Run Analysis**
3. Read the color-coded histogram (green = high similarity, red = low)
4. Click **AI Insight** for Claude's narrative analysis
5. Export as CSV or full Markdown report

### Step 4: Generate New Documents

1. Select a target zone on the map (click a point or lasso-select)
2. Write a specific prompt and choose a style
3. Click **Generate 10 Candidates**
4. Review: all 10 are ranked by similarity, projected onto the map
5. Export the top 5 or all 10 as CSV

---

## Deployment

### Prerequisites
- [Cloudflare](https://dash.cloudflare.com/) account
- [Voyage AI](https://www.voyageai.com/) API key
- [Anthropic](https://console.anthropic.com/) API key

### Deploy the Worker (API Proxy)
1. Cloudflare dashboard > Workers & Pages > Create Worker
2. Name it `document-intelligence-api`, deploy
3. Edit Code > paste contents of `worker/index.js` > Deploy
4. Settings > Variables and Secrets > add `ANTHROPIC_API_KEY` and `VOYAGE_API_KEY` as encrypted

### Deploy the Frontend (Pages)
1. Workers & Pages > Create > Pages > Connect to Git
2. Select the repository, branch: `main`
3. Build command: `npm run build`, output: `dist`
4. Deploy

### Local Development
```bash
git clone https://github.com/jethomasphd/Document_Intelligence.git
cd Document_Intelligence
npm install
echo "VOYAGE_API_KEY=your-key" > .dev.vars
echo "ANTHROPIC_API_KEY=your-key" >> .dev.vars
npx wrangler pages dev -- npm run dev
```

---

## Project Structure

```
src/
  pages/
    Landing.jsx            Cinematic intro (3-act reveal)
    Home.jsx               Dashboard, corpus library, storage disclosure
    About.jsx              Deep narrative, conceptual models, tech overview
    CorpusNew.jsx          3-step wizard (upload, configure, embed)
    Explorer.jsx           Semantic map + document inspector
    Comparator.jsx         Population cross-analysis
    Generator.jsx          Target zone selection, generation, ranking
  components/
    Layout.jsx             App shell (header: Home, About, + New Corpus)
    ui/
      Tooltip.jsx          Wide hover tooltips (w-80, z-9999)
      InfoHint.jsx         (?) contextual help icons
      StepGuide.jsx        Step progress indicator with descriptions
      ErrorBoundary.jsx    React error boundary for graceful failures
    corpus/
      DropZone.jsx         File upload with format specs
      FieldMapper.jsx      Column mapping, category strategy, model selector
      EmbedProgress.jsx    Batch embedding progress bar
    explorer/
      SemanticMap.jsx      Plotly scatter + UMAP compute + red selection ring
      PointInspector.jsx   Document detail, neighbors, summary, exports
      SearchBar.jsx        Full-text search dropdown
    generator/
      MiniMap.jsx          Map with target zone (red), candidates (gold/gray)
      TargetZone.jsx       Exemplar list with reset
      CandidateCard.jsx    Ranked candidate with placement badge
  lib/
    api.js                 Fetch wrappers (embed, summarize, generate, analyze)
    storage.js             IndexedDB CRUD with binary embedding encoding
    umap.js                PCA + UMAP projection + transformNew for new points
    knn.js                 Cosine similarity, KNN search, zone centroid
    export.js              8 export functions (CSV, JSON, Markdown)
  store/
    index.js               Zustand state (corpus list, selections, map)
  main.jsx                 Routes (/, /home, /about, /corpus/*)
  index.css                Tailwind + dark theme + Plotly overrides
worker/
  index.js                 Cloudflare Worker: 4 API endpoints
```

---

## Example Use Cases

| Corpus | What You Learn | What You Generate |
|--------|---------------|-------------------|
| Email subject lines by department | Which departments write similarly | Subjects matching a specific voice |
| Product descriptions by category | How product language clusters | Descriptions for new products |
| Customer reviews by rating | What separates 5-star from 1-star | Review text targeting a sentiment zone |
| Job postings by industry | How industries describe roles | Postings matching an industry signature |
| Research abstracts by field | Where disciplines overlap | Abstracts at the boundary of two fields |
| Top performers vs. rest | What semantic patterns distinguish winners | More content like your best |

---

## License

[MIT](LICENSE)
