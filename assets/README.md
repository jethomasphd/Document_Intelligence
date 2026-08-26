# Whitepaper Assets

This directory holds two renderings of the same true system.

1. **The whitepaper** — a technical account prepared as an arXiv-style preprint.
2. **The narrative** — *The Shape of What You've Written*, a story-driven essay for a lay reader arriving cold, meant to end in them opening the tool.

## Contents

| File | What it is |
|---|---|
| `whitepaper.md` | The technical manuscript source of record (Markdown, ~3,300 words). Renders on GitHub with the SVG figures. |
| `whitepaper.docx` | The Word manuscript — arXiv-preprint layout, US Letter, 8 pages, embedded figures with captions. |
| `whitepaper.pdf` | PDF rendering of the DOCX. For a non-TeX workflow this is the file arXiv actually accepts. |
| `references.bib` | All 12 citations in BibTeX, in manuscript order, for anyone porting the paper to LaTeX. |
| `build_whitepaper_docx.cjs` | Reproducible DOCX build script for the whitepaper (`docx` npm package). |
| `narrative.md` | The essay source of record (~2,200 words). No technical prerequisites; ends with a ten-minute on-ramp. |
| `narrative.docx` | The essay as a Word manuscript — book-style typography (Georgia, ragged right), 8 pages, with the story figure. |
| `narrative.pdf` | PDF rendering of the essay. |
| `build_narrative_docx.cjs` | Reproducible DOCX build script for the essay. |
| `figures/figure1_architecture.svg/.png` | Whitepaper Figure 1 — system architecture (client / edge proxy / model providers). |
| `figures/figure2_pipeline.svg/.png` | Whitepaper Figure 2 — the projection pipeline with data shapes (N×1,024 → N×50 → N×2) and the persisted model. |
| `figures/figure3_generation_loop.svg/.png` | Whitepaper Figure 3 — the generate-and-verify loop with the mini-map sketch. |
| `figures/figure4_story_map.svg/.png` | Essay figure — the subject-line story in two panels: the gap the map revealed, then the drafts that landed in it. |

SVGs are the figure sources; the PNGs (2,600 px wide, ~300 DPI at print width) are what the DOCX files embed.

## Style

The **whitepaper** is written in a Simplified-Technical-English register: short declarative sentences, active voice, one meaning per term (document, corpus, embedding, map, target zone, candidate), no synonym drift. Every number in the text — PCA sample size, block width, iteration count, UMAP parameters, batch sizes, thresholds, neighbor counts — is taken directly from the code in `src/lib/` and `worker/index.js`, not from memory.

The **narrative** drops those constraints and keeps only the truthfulness: same system, same behavior, no invented features — told as a story (the pile, the map, the two thousand subject lines, the gap, the stars that land) for a reader who has never heard the word "embedding."

## Rebuilding

```bash
# DOCX (from the repo root; does not touch package.json)
npm install --no-save docx
node assets/build_whitepaper_docx.cjs

# PDF (LibreOffice)
soffice --headless --convert-to pdf --outdir assets assets/whitepaper.docx

# Figures: PNGs from SVGs (any Chromium)
cd assets/figures
chromium --headless=new --hide-scrollbars --force-device-scale-factor=2 \
  --window-size=1300,690 --screenshot=figure1_architecture.png figure1_architecture.svg
# (window height = SVG height + ~90 px of headless chrome; crop to 2600 × 2·H afterwards)
```

## Submitting to arXiv

- **Format**: arXiv does not accept `.docx`. Upload `whitepaper.pdf` directly (permitted for documents not produced from TeX). If a TeX version is ever wanted, `whitepaper.md` plus `references.bib` port cleanly.
- **Suggested categories**: `cs.HC` (primary — interactive visual analytics), cross-list `cs.CL` and `cs.IR`.
- **Abstract**: the abstract in `whitepaper.md` is under arXiv's 1,920-character limit and can be pasted into the submission form as-is.
- **License**: the repository is MIT; any of arXiv's non-exclusive distribution licenses is compatible.
