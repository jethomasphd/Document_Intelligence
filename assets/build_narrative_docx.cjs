#!/usr/bin/env node
/**
 * Builds assets/narrative.docx — "The Shape of What You've Written" as a
 * designed two-page piece. Content mirrors assets/narrative.md; this script
 * owns only the typography and layout.
 *
 * Usage:  node assets/build_narrative_docx.cjs   (requires npm package `docx`)
 */

const fs = require('fs');
const path = require('path');
const {
  AlignmentType, BorderStyle, Document, ExternalHyperlink, ImageRun,
  LevelFormat, Packer, PageBreak, Paragraph, TextRun,
} = require('docx');

const ASSETS = __dirname;
const FIG = (f) => path.join(ASSETS, 'figures', f);

const SERIF = 'Georgia';
const INK = '1f2328';
const MUTED = '59616b';
const GOLD = '9a7500';
const LINK = '0b7f9a';

const BODY = { size: 21 }; // 10.5 pt
const SPACING = { after: 120, line: 300, lineRule: 'auto' }; // 6 pt after, 1.25 line

const t = (text, opts = {}) => new TextRun({ text, ...BODY, ...opts });
const b = (text, opts = {}) => t(text, { bold: true, ...opts });
const i = (text, opts = {}) => t(text, { italics: true, ...opts });
const bi = (text, opts = {}) => t(text, { bold: true, italics: true, ...opts });

const link = (text, url, opts = {}) =>
  new ExternalHyperlink({
    link: url,
    children: [t(text, { color: LINK, underline: {}, ...opts })],
  });

const body = (...runs) => new Paragraph({ spacing: SPACING, children: runs });

// Small-caps gold eyebrow instead of a full heading — buys space, reads designed.
const eyebrow = (text, first = false) =>
  new Paragraph({
    spacing: { before: first ? 40 : 150, after: 55 },
    keepNext: true,
    children: [
      new TextRun({ text, font: SERIF, size: 18, bold: true, allCaps: true, color: GOLD, characterSpacing: 36 }),
    ],
  });

const display = (text) =>
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 110, after: 110 },
    indent: { left: 540, right: 540 },
    children: [b(text, { size: 27 })],
  });

const image = (file, w, h, opts = {}) =>
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: opts.before ?? 0, after: opts.after ?? 100 },
    keepNext: opts.keepNext ?? false,
    children: [
      ...(opts.pageBreakBefore ? [new PageBreak()] : []),
      new ImageRun({ type: 'png', data: fs.readFileSync(FIG(file)), transformation: { width: w, height: h } }),
    ],
  });

const children = [];

// ---------- page 1: title over the settle band ----------
children.push(
  image('narrative_band.png', 653, 75, { after: 140 }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [b('The Shape of What You’ve Written', { size: 46 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    indent: { left: 900, right: 900 },
    spacing: { after: 110, line: 280, lineRule: 'auto' },
    children: [
      i('You have more documents than you can read. Here is how to see all of them at once — and how to write into the spaces between them.', { size: 23, color: MUTED }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 140 },
    children: [
      t('J. E. Thomas   ·   the tool is live in your browser: ', { size: 18, color: MUTED }),
      link('document-intelligence.pages.dev', 'https://document-intelligence.pages.dev', { size: 18 }),
    ],
  })
);

children.push(
  eyebrow('The pile', true),
  body(
    t('Somewhere in your files there is a folder you avoid opening. A year of emails. Every product description. Every review, every abstract, every chapter. Each one was, briefly, the most important thing on somebody’s screen.')
  ),
  body(
    t('Now they form a pile, and the pile keeps a secret. Not in any single document — '),
    i('between'),
    t(' them: which ones say the same thing in different words, what your best work has in common, what nobody has written yet. Search can’t reach it. Search is a flashlight; it finds what you already know to name.')
  ),

  eyebrow('A strange fact about meaning'),
  body(
    t('Language models learned to do something that still feels like a card trick: they can turn a piece of writing into a '),
    b('location'),
    t(' — a thousand and twenty-four coordinates you never have to picture, with one property that matters:')
  ),
  display('Texts that mean similar things land close together.'),
  body(
    t('“Fiscal Q3 performance” sits beside “quarterly revenue results” with barely a word in common. Meaning, it turns out, has geography. So: what does '),
    i('your'),
    t(' map look like?')
  ),

  eyebrow('The map'),
  body(
    t('Document Intelligence answers in a browser tab. Bring a spreadsheet — one row per document. A minute later the dots settle, and you are looking at every document you gave it, all at once, arranged by what it means. '),
    b('Neighborhoods'),
    t(': themes that found each other, untagged. '),
    b('Borders'),
    t(': your bridge pieces. '),
    b('Empty lots'),
    t(': territory next to everything you do, where nothing you’ve written lives. Hold that thought.')
  ),

  eyebrow('Two thousand subject lines'),
  body(
    t('A marketing team maps a year of subject lines and tags their hits gold. The gold doesn’t scatter — it '),
    b('condenses into two islands'),
    t(': urgency ('),
    i('“Final hours: registration closes tonight”'),
    t(') and curiosity ('),
    i('“The one metric nobody reports”'),
    t('). The fifteen hundred average lines hang between them like fog.')
  ),
  body(
    t('And bordering both islands: an empty lot. A region where a line would carry a deadline’s pressure '),
    i('and'),
    t(' a secret’s pull. Nobody has ever written it. The map doesn’t just show what works — '),
    b('it shows what’s missing.')
  )
);

// ---------- page 2: the figure, then the payoff ----------
children.push(
  image('figure4_story_map.png', 480, 236, { pageBreakBefore: true, after: 30, keepNext: true }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [
      i('The winners condensed into two islands; ten drafts measured onto the same map — five landed in the gap.', { size: 17, color: MUTED }),
    ],
  }),

  eyebrow('Writing into the gap', true),
  body(
    t('On this map, you can '),
    i('point'),
    t('. Circle the empty lot, and the tool gathers the ten real lines nearest it, then asks a language model for ten drafts that belong exactly there. Then comes the honest part:')
  ),
  display('It doesn’t take the writer’s word for it.'),
  body(
    t('Every draft is measured by the same instrument that measured your originals, scored against the target, and dropped onto the map. Five gold stars land inside the circle. The drifters land wide — and even the misses teach you what that region really contains. Your originals stay untouched; new drafts export separately, scores attached. You’ve stopped asking '),
    i('“write me something good.” '),
    t('You’ve started saying '),
    bi('“write me something that lives here”'),
    t(' — and checking the address.')
  ),

  eyebrow('Yours'),
  body(
    t('No account. No server database. The corpus lives in your browser, on your machine; text leaves only to be measured or written, through a relay that keeps nothing. Delete a corpus and it is simply gone. One honest note: the 2-D picture is a flattening — trust neighborhoods, not millimeters; every score is measured in the full, unflattened space. The map is where you look. The measurements are where you stand.')
  ),

  eyebrow('Ten minutes'),
  body(t('All you need is a spreadsheet with a column of text.')),
  new Paragraph({
    numbering: { reference: 'steps', level: 0 },
    spacing: { after: 30, line: 300, lineRule: 'auto' },
    children: [
      t('Open '),
      link('document-intelligence.pages.dev', 'https://document-intelligence.pages.dev'),
      t(' → '),
      b('New Corpus'),
      t('.'),
    ],
  }),
  new Paragraph({
    numbering: { reference: 'steps', level: 0 },
    spacing: { after: 30, line: 300, lineRule: 'auto' },
    children: [t('Drop the file. Point at your text column. Tag your best rows '), i('“Best.”')],
  }),
  new Paragraph({
    numbering: { reference: 'steps', level: 0 },
    spacing: { after: 100, line: 300, lineRule: 'auto' },
    children: [t('Watch the dots settle.')],
  }),
  body(
    t('Then three moves: '),
    b('find the loner'),
    t(' and read it; '),
    b('compare your best against the rest'),
    t('; '),
    b('find the empty lot'),
    t(' next to your best work and ask for ten drafts.')
  ),
  body(
    t('You’ve been building a territory for years — one document at a time, always at street level.')
  ),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 50 },
    children: [b('Come see it from above.', { size: 26 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [link('document-intelligence.pages.dev', 'https://document-intelligence.pages.dev', { size: 20, bold: true })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 20 },
    children: [
      i('free & open source (MIT) · github.com/jethomasphd/Document_Intelligence', { size: 15, color: MUTED }),
    ],
  })
);

const doc = new Document({
  creator: 'J. E. Thomas',
  title: 'The Shape of What You’ve Written',
  description: 'A two-page narrative introduction to Document Intelligence.',
  styles: {
    default: { document: { run: { font: SERIF, size: 21, color: INK } } },
  },
  numbering: {
    config: [
      {
        reference: 'steps',
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: '%1.',
            alignment: AlignmentType.START,
            style: { paragraph: { indent: { left: 460, hanging: 230 } } },
          },
        ],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 }, // US Letter
          margin: { top: 1152, bottom: 1152, left: 1224, right: 1224 }, // 0.8" / 0.85"
        },
      },
      children,
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  const out = path.join(ASSETS, 'narrative.docx');
  fs.writeFileSync(out, buffer);
  console.log('wrote', out, buffer.length, 'bytes');
});
