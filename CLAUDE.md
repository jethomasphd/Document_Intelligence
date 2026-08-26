# Document Intelligence

## Project Overview
Semantic corpus analysis and generative document platform. Users upload document collections, embed them via Voyage AI, visualize in 2D (UMAP), compare populations, and generate new documents targeting specific semantic regions using Claude.

## Architecture
- **Frontend**: React 19 + Vite 7 + Tailwind CSS 3 + Zustand 5 + Plotly.js 3
- **API Proxy**: Standalone Cloudflare Worker (`worker/index.js`) — holds secrets, proxies to Voyage AI and Anthropic
- **Static Hosting**: Cloudflare Pages (builds from `dist/`)
- **Storage**: Client-side IndexedDB via idb-keyval (no server DB)
- **Embeddings**: Voyage AI (voyage-3.5-lite / voyage-3.5, 1024-dimensional)
- **LLM**: Anthropic Claude (Sonnet for generation, Haiku for summarization/analysis)

## Key Directories
```
src/pages/        — Landing, Home, About, CorpusNew, Explorer, Comparator, Generator
src/components/   — Layout, ui/ (Tooltip, InfoHint, StepGuide, ErrorBoundary),
                    corpus/ (DropZone, FieldMapper, EmbedProgress),
                    explorer/ (SemanticMap, PointInspector, SearchBar),
                    generator/ (MiniMap, TargetZone, CandidateCard)
src/lib/          — api.js, storage.js, umap.js, knn.js, export.js
src/store/        — Zustand global state
worker/           — Standalone Cloudflare Worker (API proxy with secrets)
assets/           — Publication assets: technical whitepaper + two-page narrative
                    (md/docx/pdf each), figures (SVG + PNG), DOCX build scripts.
                    Keep whitepaper claims in sync with the code; see assets/README.md
```

## Development
```bash
npm install
npm run dev          # Vite dev server (frontend only)
npm run build        # Production build → dist/
npm run lint         # ESLint
```

## Deployment
- **Pages**: Auto-deploys from `main` branch. Build: `npm run build`, output: `dist/`
- **Worker**: Deployed separately at `document-intelligence-api.jethomasphd.workers.dev`
  - Must be redeployed manually via Cloudflare dashboard when `worker/index.js` changes
- Worker secrets: `VOYAGE_API_KEY`, `ANTHROPIC_API_KEY`
- Frontend hardcodes Worker URL in `src/lib/api.js`

## Important Notes
- All heavy computation (UMAP, PCA, KNN) runs client-side in the browser
- The map projection (PCA + UMAP) runs in a Web Worker (`src/lib/projection.worker.js`, math in `src/lib/projectionCore.js`) with a main-thread fallback; PCA is a sampled covariance + subspace-iteration solve, not a full SVD
- Embeddings are stored in IndexedDB as native Float32Arrays (structured clone); corpora saved by older versions used base64 strings and are decoded on read, upgraded on next save
- Each corpus has a lightweight `corpusmeta:<id>` record so listing corpora never loads full documents
- Generator flow: generates 10 candidates → embeds all → projects onto map → ranks by cosine similarity → marks top 5 → exports as CSV (does NOT save to corpus)
- Corpus JSON export includes embeddings (full 1024-dim vectors)
- The `umapModel` stored on corpus includes PCA model data for projecting new points; v2 models store packed Float32Arrays (`reducedPacked`, `pcaMean`, `pcaComponents`), v1 models (`reduced`, `pcaLoadings`) are still readable via a legacy path in `src/lib/umap.js`
- `functions/` directory was removed — all API logic lives in `worker/index.js`
- Do NOT modify `worker/index.js` without also updating the deployed Worker

## Worker Endpoints
| Endpoint | Model | max_tokens | Purpose |
|----------|-------|-----------|---------|
| POST /api/embed | Voyage AI | — | Batch embed texts (128/chunk) |
| POST /api/generate | claude-sonnet-4-6 | 16384 | Generate document candidates |
| POST /api/summarize | claude-haiku-4-5 | 4096 | Summarize/analyze documents |
| POST /api/analyze | claude-haiku-4-5 | 4096 | Compare two populations |
