# Document Intelligence

## Project Overview
Semantic corpus analysis and generative document platform. Users upload document collections, embed them via Voyage AI, visualize in 2D (UMAP), compare populations, and generate new documents targeting specific semantic regions using Claude.

## Architecture
- **Frontend**: React 19 + Vite + Tailwind CSS + Zustand + Plotly.js
- **API Proxy**: Standalone Cloudflare Worker (`worker/index.js`) — holds secrets, proxies to Voyage AI and Anthropic
- **Static Hosting**: Cloudflare Pages (builds from `dist/`)
- **Storage**: Client-side IndexedDB via idb-keyval (no server DB)
- **Embeddings**: Voyage AI (voyage-3.5-lite / voyage-3.5, 1024-dimensional)
- **LLM**: Anthropic Claude (Sonnet for generation, Haiku for summarization/analysis)

## Key Directories
- `src/pages/` — Route pages: Home, CorpusNew, Explorer, Comparator, Generator
- `src/components/` — React components organized by feature (corpus/, explorer/, generator/)
- `src/lib/` — Utilities: api.js, storage.js, umap.js, knn.js, export.js
- `src/store/` — Zustand global state
- `worker/` — Standalone Cloudflare Worker (API proxy with secrets)

## Development
```bash
npm install
npm run dev          # Vite dev server (frontend only)
npm run build        # Production build → dist/
npm run lint         # ESLint
```

## Deployment
- **Pages**: Auto-deploys from `main` branch. Build command: `npm run build`, output: `dist/`
- **Worker**: Deployed separately at `document-intelligence-api.jethomasphd.workers.dev`
- Worker secrets: `VOYAGE_API_KEY`, `ANTHROPIC_API_KEY`
- Frontend hardcodes Worker URL in `src/lib/api.js`

## Important Notes
- All heavy computation (UMAP, PCA, KNN) runs client-side in the browser
- Embeddings are base64-encoded Float32Arrays in IndexedDB for storage efficiency
- Generator flow: generates 25 candidates → embeds all → ranks by cosine similarity → auto-accepts top 5
- Corpus JSON export includes embeddings (full 1024-dim vectors)
- The `umapModel` stored on corpus includes PCA model data for projecting new points
- `functions/` directory was removed — all API logic lives in `worker/index.js`
- Do NOT modify `worker/index.js` without also updating the deployed Worker via the Cloudflare dashboard
