#!/usr/bin/env node
/**
 * Builds assets/narrative.docx — the lay-audience narrative essay
 * "The Shape of What You've Written". Content mirrors assets/narrative.md;
 * this script owns only the typography.
 *
 * Usage:  node assets/build_narrative_docx.cjs   (requires npm package `docx`)
 */

const fs = require('fs');
const path = require('path');
const {
  AlignmentType, BorderStyle, Document, ExternalHyperlink, Footer, ImageRun,
  LevelFormat, PageNumber, Packer, Paragraph, TextRun,
} = require('docx');

const ASSETS = __dirname;

const SERIF = 'Georgia';
const INK = '1f2328';
const MUTED = '59616b';
const ACCENT = '1f4e96';
const GOLD = '9a7500';

const BODY = { size: 24 }; // 12 pt
const SPACING = { after: 160, line: 324, lineRule: 'auto' }; // 8 pt after, 1.35 line

const t = (text, opts = {}) => new TextRun({ text, ...BODY, ...opts });
const b = (text, opts = {}) => t(text, { bold: true, ...opts });
const i = (text, opts = {}) => t(text, { italics: true, ...opts });
const bi = (text, opts = {}) => t(text, { bold: true, italics: true, ...opts });

const link = (text, url, opts = {}) =>
  new ExternalHyperlink({
    link: url,
    children: [t(text, { color: ACCENT, underline: {}, ...opts })],
  });

const body = (...runs) => new Paragraph({ spacing: SPACING, children: runs });

const chapter = (text) =>
  new Paragraph({
    spacing: { before: 400, after: 160 },
    keepNext: true,
    children: [b(text, { size: 31 })],
  });

const display = (...runs) =>
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 220, after: 220 },
    indent: { left: 720, right: 720 },
    children: runs,
  });

const bullet = (runs) =>
  new Paragraph({
    numbering: { reference: 'essay-bullets', level: 0 },
    spacing: { after: 120, line: 324, lineRule: 'auto' },
    children: runs,
  });

const step = (runs) =>
  new Paragraph({
    numbering: { reference: 'essay-steps', level: 0 },
    spacing: { after: 120, line: 324, lineRule: 'auto' },
    children: runs,
  });

const children = [];

// ---------- title block ----------
children.push(
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 480, after: 200 },
    children: [b('The Shape of What You’ve Written', { size: 54 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    indent: { left: 720, right: 720 },
    spacing: { after: 200, line: 300, lineRule: 'auto' },
    children: [
      i('You have more documents than you can read. Here is how to see all of them at once — and how to write into the spaces between them.', { size: 26, color: MUTED }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [t('J. E. Thomas', { size: 22 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 320 },
    children: [
      t('There is a working version of everything described here. It runs in your browser: ', { size: 19, color: MUTED }),
      link('document-intelligence.pages.dev', 'https://document-intelligence.pages.dev', { size: 19 }),
    ],
  })
);

// ---------- The pile ----------
children.push(
  chapter('The pile'),
  body(t('Somewhere in your files there is a folder you avoid opening.')),
  body(
    t('Maybe it holds a year of marketing emails. Maybe it holds every product description in your catalog, or every customer review you’ve ever received, or ten years of grant abstracts, or the chapters of a book you keep circling. Each document in that folder exists because someone sat down and made it. Each one was, briefly, the most important thing on somebody’s screen.')
  ),
  body(t('And now they form a pile, and the pile keeps a secret.')),
  body(
    t('The secret is not in any single document — you’ve read those, or you could. The secret is in the '),
    i('relationships'),
    t(': which documents are quietly saying the same thing in different words, which one is unlike all the others, what your best work has in common, and what nobody has written yet. Those are the questions that actually matter to you. And they are exactly the questions a pile refuses to answer, because you can only read one document at a time, and the relationships live between them.')
  ),
  body(
    t('Search doesn’t help as much as it should. Search is a flashlight: it finds what you already know to name. The pattern you’ve never named — the thing your five best emails share that your fifty average ones don’t — stays in the dark, not because it’s hidden, but because no one has ever been able to stand far enough back to see it.')
  ),
  body(t('This is the story of a tool built for standing back.'))
);

// ---------- A strange fact about meaning ----------
children.push(
  chapter('A strange fact about meaning'),
  body(
    t('In the last few years, language models quietly learned to do something that still feels like a card trick: they can turn a piece of writing into a '),
    b('location'),
    t('.')
  ),
  body(
    t('Feed one of these models a sentence, a paragraph, a whole chapter — it hands you back a point in space. Not a summary, not a keyword list. Coordinates. A thousand and twenty-four of them, which is a space no human can picture, and the good news is that you never have to. Only one property of that space matters, and it is the whole trick:')
  ),
  display(b('Texts that mean similar things land close together.', { size: 27 })),
  body(
    t('Not texts that share words. Texts that share '),
    i('meaning'),
    t('. An email about “fiscal Q3 performance” and one about “quarterly revenue results” have almost no vocabulary in common, and they land side by side anyway, because the model has read enough of the world to know they are the same thought wearing different clothes. A complaint written in fury and a complaint written in icy politeness land in the same neighborhood, because underneath the manners they are the same complaint.')
  ),
  body(t('Meaning, it turns out, has geography.')),
  body(
    t('Which raises an obvious, slightly vertiginous question: if every document you’ve ever written has a location — what does the map look like?')
  )
);

// ---------- The map ----------
children.push(
  chapter('The map'),
  body(
    t('Document Intelligence exists to answer that question, and it insists on doing it in the least ceremonial way possible: in a browser tab.')
  ),
  body(
    t('You bring a spreadsheet. One row per document, one column holding the text — subject lines, descriptions, reviews, abstracts, whatever your pile is made of. You drop it in. The tool sends each row out to be measured, gets back each document’s coordinates, and then does the thing you actually came for: it flattens that unpicturable thousand-dimensional space down to two dimensions, carefully, so that near things stay near. (The flattening is done by a pair of techniques with wonderful names — principal component analysis and UMAP — and you are free to never think about either of them again.)')
  ),
  body(
    t('Then the dots settle onto your screen, and you are looking at something genuinely new: '),
    b('every document you gave it, all at once, arranged by what they mean.')
  ),
  body(
    t('The first time, people tend to just look for a while. It reads like an aerial photograph of a city you’ve been living in at street level:')
  ),
  bullet([
    b('Neighborhoods. '),
    t('Dots bunch into clusters — documents that share a theme, a tone, a move. You didn’t tag them. Nobody sorted them. They found each other.'),
  ]),
  bullet([
    b('Borders. '),
    t('Where two clusters blur into each other live your bridge documents — the ones that belong to two conversations at once. These are often your most interesting pieces, and the map finds them for free.'),
  ]),
  bullet([
    b('Empty lots. '),
    t('And between the neighborhoods: open space. Regions adjacent to everything you do, where nothing you’ve written currently lives. Hold that thought. The empty space turns out to be the most valuable real estate on the map.'),
  ]),
  body(
    t('Every dot is still a real document. Click one and it opens — full text, and beside it the twenty-five documents nearest to it in meaning, ranked, including the ones you would never have shelved together. The map is not a diagram '),
    i('about'),
    t(' your writing. It '),
    i('is'),
    t(' your writing, standing in formation for the first time.')
  )
);

// ---------- Two thousand subject lines ----------
children.push(
  chapter('Two thousand subject lines'),
  body(t('Here is the story I tell people when they ask what this is for.')),
  body(
    t('A marketing team has two thousand email subject lines from the past year. They know the open rate of every single one — that part they’ve always had. Some lines were hits, most were fine, a few sank. And every Monday, someone on that team writes new subject lines the way everyone writes them: by feel, by memory of what worked, by staring at the ceiling.')
  ),
  body(
    t('They give the pile to the map. It takes about a minute. They tag their hits — the top of the open-rate table — as '),
    b('Top Performers'),
    t(', and everything else as '),
    b('Other'),
    t(', so the winners show up in gold.')
  ),
  body(
    t('The map loads, and the room goes quiet, because the gold is not sprinkled evenly across the picture. It has '),
    i('condensed'),
    t('. Two tight islands.')
  ),
  body(
    t('One island is urgency: deadlines, closing windows, tonight. The other island, across a stretch of open water, is curiosity: the unopened box, the question mark, the one thing nobody tells you. Around and between the islands, the fifteen hundred average subject lines hang like fog — a little of everything, committed to nothing.')
  ),
  body(
    t('A year of intuition, confirmed and sharpened in one glance: '),
    i('this team’s audience opens two kinds of email. '),
    t('Not a slide of quarterly guesswork. A shape.')
  ),
  body(
    t('But the shape holds one more thing, and it’s the part that changes behavior. Between the two gold islands — between urgency and curiosity, bordering both — there is an empty lot. A region where a subject line would carry a deadline’s pressure '),
    i('and'),
    t(' a secret’s pull.')
  ),
  body(t('Nobody on the team has ever written that line. The map doesn’t just show them what works.')),
  body(t('It shows them what’s missing.')),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 80 },
    keepNext: true,
    children: [
      new ImageRun({
        type: 'png',
        data: fs.readFileSync(path.join(ASSETS, 'figures', 'figure4_story_map.png')),
        transformation: { width: 566, height: 279 },
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    indent: { left: 540, right: 540 },
    spacing: { after: 240 },
    children: [
      i('Left: two thousand subject lines arranged by meaning — the winners condensed into two islands, with an empty region between them. Right: ten generated drafts, measured and placed on the same map; five landed where the team pointed.', { size: 19, color: MUTED }),
    ],
  })
);

// ---------- Asking why ----------
children.push(
  chapter('Asking why'),
  body(
    t('A map that only made you say '),
    i('huh'),
    t(' would be a poster. This one takes questions.')
  ),
  body(
    t('You can put any two groups side by side and ask how they actually relate. The tool takes every document in the first group, finds its closest relatives in the second, and lays out the whole pattern of kinship as a distribution — not one bland average but a shape, with peaks where the groups echo each other and a tail where they don’t. Five-star reviews against one-star reviews. This year’s proposals against the ones that got funded. Your team’s writing against the competitor pages you admire.')
  ),
  body(
    t('And when you want the pattern in words, you can ask for that too. The tool hands real samples from both groups to a language model and has it report back, in a few plain paragraphs, what distinguishes them — a narrator with the documents open in front of it, describing what it sees. You stay the judge. But you no longer have to be the one reading two thousand documents to get a verdict.')
  )
);

// ---------- Writing into the gap ----------
children.push(
  chapter('Writing into the gap'),
  body(
    t('Everything so far, some very good tools can approximate. Here is the part that feels different.')
  ),
  body(t('On this map, you can '), i('point'), t('.')),
  body(
    t('The team from our story circles the empty lot between their two winning islands. The tool quietly gathers the ten real subject lines nearest that spot — the true natives of the region — and hands them, along with one sentence of intent from the team, to a language model with a precise brief: '),
    i('write ten new lines that belong exactly here.')
  ),
  body(t('Ten candidates come back. And now the tool does the thing that makes this more than a toy.')),
  display(b('It doesn’t take the writer’s word for it.', { size: 27 })),
  body(
    t('Each new line is sent out and measured — turned into coordinates by the same instrument that measured the original two thousand — scored against the center of the target, and then dropped onto the map in front of you. Five gold stars for the candidates that landed closest to where you pointed. Gray circles for the ones that drifted.')
  ),
  body(
    t('Sit with how unusual that is. The generator makes a claim — '),
    i('this belongs there'),
    t(' — and the map, which was built before the generator ever spoke, checks the claim and shows you the result. When a star lands inside your circle, that’s not the AI grading its own homework; it’s an independent measurement. And when a candidate lands wide, that’s not a failure — it’s information. The miss shows you the difference between what you asked for and what that region actually contains, which is sometimes the most useful thing you learn all day.')
  ),
  body(
    t('The new drafts never contaminate your originals; they export as their own file, scores attached. Your corpus stays a record of what you actually wrote. The map stays honest.')
  ),
  body(
    t('You’ve stopped asking '),
    i('“write me something good.” '),
    t('You’ve started saying '),
    bi('“write me something that lives here”'),
    t(' — and checking the address.')
  )
);

// ---------- Yours ----------
children.push(
  chapter('Yours'),
  body(
    t('A quiet fact about all of this, easy to miss and worth saying plainly: '),
    b('your documents stay with you.')
  ),
  body(
    t('There is no account. There is no company database with your pile in it. The corpus — text, coordinates, map — lives in your own browser’s storage, on your own machine. Text leaves only in the moment of being measured or written, passing through a relay that holds the service keys and keeps nothing: no storage, no logs. Delete a corpus and it is simply gone, because there was never another copy anywhere to chase down.')
  ),
  body(
    t('And one honest note about the picture itself, because this tool would rather be trusted than impressive: the 2-D map is a flattening of something far bigger, and flattenings distort — trust the neighborhoods, not millimeters of distance. That’s exactly why every number you’re ever shown — every neighbor ranking, every comparison, every gold star — is measured back in the full space, where nothing was flattened. The map is where you look.')
  ),
  body(t('The measurements are where you stand.'))
);

// ---------- Ten minutes ----------
children.push(
  chapter('Ten minutes'),
  body(t('Here’s how small the barrier actually is.')),
  body(
    t('You need a spreadsheet with a column of text in it. That’s the whole entry fee. Subject lines, product descriptions, reviews, abstracts, chapters, job postings, docstrings, song lyrics — if it can be pasted into a cell, it can be a dot on a map.')
  ),
  step([
    t('Open '),
    link('document-intelligence.pages.dev', 'https://document-intelligence.pages.dev'),
    t(' and choose '),
    b('New Corpus'),
    t('.'),
  ]),
  step([
    t('Drop in the file, and point the tool at your text column. If you can, add a category column — even just '),
    i('“Best”'),
    t(' and '),
    i('“Other”'),
    t(' is enough to make your winners glow.'),
  ]),
  step([t('Give it a minute. Watch the dots settle.')]),
  body(t('Then try the three moves, in order:')),
  bullet([
    b('Find the loner. '),
    t('Click the dot sitting far from everything. Read it. There’s usually a story.'),
  ]),
  bullet([
    b('Compare your best against the rest. '),
    t('Look at the shape of the difference — you’re seeing what your intuition has been trying to tell you for years.'),
  ]),
  bullet([
    b('Find the empty lot next to your best work. '),
    t('Circle it. Ask for ten drafts that belong there, and watch where the stars land.'),
  ]),
  body(
    t('You’ve been building a territory for years, one document at a time, always at street level.')
  ),
  body(b('Come see it from above.')),
  new Paragraph({
    spacing: { before: 320 },
    border: { top: { style: BorderStyle.SINGLE, size: 6, color: '999999' } },
    children: [
      i('The tool described here is free and open source (MIT). Code: github.com/jethomasphd/Document_Intelligence. For the technical account of the same system — architecture, projection mathematics, and the generate-and-verify loop — see the companion whitepaper in this directory.', { size: 19, color: MUTED }),
    ],
  })
);

// ---------- document ----------
const doc = new Document({
  creator: 'J. E. Thomas',
  title: 'The Shape of What You’ve Written',
  description: 'A narrative introduction to Document Intelligence.',
  styles: {
    default: { document: { run: { font: SERIF, size: 24, color: INK } } },
  },
  numbering: {
    config: [
      {
        reference: 'essay-bullets',
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: '•',
            alignment: AlignmentType.START,
            style: { paragraph: { indent: { left: 520, hanging: 260 } } },
          },
        ],
      },
      {
        reference: 'essay-steps',
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: '%1.',
            alignment: AlignmentType.START,
            style: { paragraph: { indent: { left: 520, hanging: 260 } } },
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
          margin: { top: 1584, bottom: 1584, left: 1872, right: 1872 },
        },
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ children: [PageNumber.CURRENT], font: SERIF, size: 18, color: MUTED })],
            }),
          ],
        }),
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
