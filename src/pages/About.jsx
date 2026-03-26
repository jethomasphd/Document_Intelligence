import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link to="/home" className="text-text-muted text-sm no-underline hover:text-accent-cyan transition-colors mb-6 inline-block">
        &larr; Back to Dashboard
      </Link>

      <h1 className="text-3xl font-semibold text-text-primary mb-4">About Document Intelligence</h1>
      <p className="text-text-muted text-lg leading-relaxed mb-10">
        A platform for people who have more content than they can read, and need to understand what it all means together.
      </p>

      {/* The Problem */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-text-primary mb-3">The Problem</h2>
        <p className="text-text-muted leading-relaxed mb-4">
          Every organization sits on a growing pile of documents. Email campaigns, product descriptions, research papers, marketing copy, internal memos. Each one was written for a reason. But nobody can hold the full picture in their head.
        </p>
        <p className="text-text-muted leading-relaxed mb-4">
          You search by keyword. You organize into folders. You read things one at a time. And you make decisions about what to write next based on gut feeling, because the actual patterns across your content library are invisible at the scale you operate.
        </p>
        <p className="text-text-muted leading-relaxed">
          The cost is subtle but real: you create content that duplicates what already exists, miss gaps that your audience is looking for, and have no systematic way to understand why some documents perform and others don't.
        </p>
      </section>

      {/* What Can I Do */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-text-primary mb-3">What Can I Do With My Documents?</h2>
        <p className="text-text-muted leading-relaxed mb-4">
          If you have a collection of documents &mdash; any size, any kind &mdash; this tool lets you do things that were previously impossible without reading every single one:
        </p>
        <div className="space-y-3 mb-4">
          {[
            { q: 'See the big picture', a: 'Upload 500 product descriptions and instantly see which ones sound alike, which ones stand alone, and where there are gaps in your catalog.' },
            { q: 'Find out why your best content works', a: 'Tag your top-performing emails, blog posts, or ads as a group. The map shows you what they have in common — not in word choice, but in the deeper patterns of how they communicate.' },
            { q: 'Discover hidden connections', a: 'That legal brief and that marketing email might be saying the same thing in different language. This tool sees through word choice to the meaning underneath.' },
            { q: 'Compare two groups of documents', a: 'Are your East Coast and West Coast sales teams writing differently? Do your 5-star reviews share themes your 1-star reviews don\'t? Select two groups and see exactly how they overlap or diverge.' },
            { q: 'Generate more of what works', a: 'Point to the region where your best-performing content lives, and the AI writes new documents designed to belong there. Then it verifies that they actually landed in the right spot.' },
            { q: 'Find the gaps', a: 'The map shows you not just where your content is, but where it isn\'t. Empty areas between clusters are opportunities — topics adjacent to what you already cover that nobody has written about yet.' },
          ].map((item, i) => (
            <div key={i} className="bg-bg-surface border border-border-line rounded-lg p-4">
              <div className="text-accent-cyan font-medium text-sm mb-1">{item.q}</div>
              <p className="text-text-muted text-sm leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* A Concrete Example */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-text-primary mb-3">An Example: From Spreadsheet to Strategy</h2>
        <div className="bg-bg-surface border border-accent-gold/20 rounded-lg p-6 text-sm text-text-muted leading-relaxed space-y-3">
          <p>
            A marketing team has <strong className="text-text-primary">2,000 email subject lines</strong> from the past year. Some had great open rates, most were average, some flopped. They've been writing new subject lines based on gut feeling.
          </p>
          <p>
            They upload all 2,000 subject lines and tag each one as <strong className="text-accent-gold">"Top Performer"</strong> or <strong className="text-text-primary">"Other"</strong> based on open rates.
          </p>
          <p>
            The map reveals something surprising: <strong className="text-text-primary">their top performers cluster into two tight groups</strong> — one around urgency-driven language, another around curiosity-driven language. The average performers are scattered everywhere.
          </p>
          <p>
            They also spot a <strong className="text-text-primary">gap</strong>: a region near both winning clusters where no subject lines exist at all. It seems to be where urgency and curiosity overlap.
          </p>
          <p>
            They point the Generator at that gap and ask it to write 10 subject lines that blend urgency and curiosity. The AI generates them, checks that they land in the right area on the map, and keeps the best 5. The team now has <strong className="text-accent-gold">data-informed candidates</strong> for their next campaign — not guesses.
          </p>
        </div>
      </section>

      {/* Plain English Glossary */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-text-primary mb-3">Plain English Glossary</h2>
        <p className="text-text-muted leading-relaxed mb-4">
          This tool uses some technical vocabulary. Here's what every term actually means:
        </p>
        <div className="bg-bg-surface border border-border-line rounded-lg divide-y divide-border-line text-sm">
          {[
            { term: 'Corpus', plain: 'Your collection of documents. It could be 50 emails, 5,000 product descriptions, or 200 research abstracts. Whatever you upload together is your corpus.' },
            { term: 'Embedding', plain: 'A way of converting text into a list of numbers that captures its meaning. Think of it like a GPS coordinate, but for ideas instead of locations. Two documents about the same idea get similar "coordinates" even if they use completely different words.' },
            { term: 'Semantic', plain: 'Just means "related to meaning." When we say "semantic similarity," we mean two documents are about the same thing — not that they use the same words.' },
            { term: 'Vector / Vector Space', plain: 'The list of numbers that represents a document (the embedding). "Vector space" is just the mathematical space where all these number-lists live. Think of it as the map before it\'s drawn on screen.' },
            { term: 'Cosine Similarity', plain: 'A score from 0 to 1 that measures how similar two documents are in meaning. 0.9 = almost the same thing. 0.5 = loosely related. 0.1 = totally different topics. It\'s like a "similarity percentage" for meaning.' },
            { term: 'UMAP', plain: 'The algorithm that takes the invisible, high-dimensional "idea coordinates" and flattens them into a 2D map you can actually look at — while keeping similar documents close together. It\'s the thing that makes the map possible.' },
            { term: 'PCA', plain: 'A pre-processing step that removes noise from the data before UMAP draws the map. Like cleaning a photograph before printing it — the picture is clearer.' },
            { term: 'Dimensionality Reduction', plain: 'The process of going from 1,024 numbers per document (too many to visualize) down to just 2 numbers (an X and Y position on a flat map). That\'s what PCA and UMAP do together.' },
            { term: 'Cluster', plain: 'A group of dots that bunch together on the map. When documents cluster, it means they\'re about similar things.' },
            { term: 'Nearest Neighbors', plain: 'The documents closest to any given document on the map. If you click a document, its nearest neighbors are the ones most similar in meaning.' },
            { term: 'Target Zone', plain: 'A region you select on the map where you want to generate new content. You\'re telling the AI: "write something that belongs here."' },
            { term: 'Centroid', plain: 'The center point of a group of documents. When you select a target zone, the system calculates the centroid — the "average position" — and aims new content at it.' },
            { term: 'Population', plain: 'A named group of documents within your corpus, defined by category. For example, "Top Performers" and "Others" are two populations.' },
            { term: 'Projection', plain: 'Placing a new document onto the existing map based on its meaning. When the system generates a new document, it "projects" it onto the map to see where it actually lands.' },
          ].map((item, i) => (
            <div key={i} className="flex gap-4 p-3">
              <div className="text-accent-cyan font-mono font-medium w-48 shrink-0">{item.term}</div>
              <div className="text-text-muted">{item.plain}</div>
            </div>
          ))}
        </div>
      </section>

      {/* The Insight */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-text-primary mb-3">The Insight: Meaning Has Geometry</h2>
        <p className="text-text-muted leading-relaxed mb-4">
          Modern neural language models don't just read text. They compress it into a mathematical representation called an <strong className="text-text-primary">embedding</strong>: a list of 1,024 numbers that encodes what the text <em>means</em>. Not the words it uses, but the concepts it expresses.
        </p>
        <p className="text-text-muted leading-relaxed mb-4">
          This means every document you've ever written can be placed as a point in a 1,024-dimensional space. And in that space, a remarkable property emerges: <strong className="text-text-primary">documents with similar meaning are physically close together</strong>.
        </p>
        <p className="text-text-muted leading-relaxed">
          An email about "fiscal Q3 performance" lands near one about "quarterly revenue results" even though they share almost no words. A product description for enterprise security software clusters with other enterprise tools, not with consumer apps. The geometry of the space encodes the semantic structure of your content.
        </p>
      </section>

      {/* The Map Metaphor */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-text-primary mb-3">From Spreadsheet to Landscape</h2>
        <div className="bg-bg-surface border border-border-line rounded-lg p-6 mb-4">
          <p className="text-text-primary leading-relaxed mb-4">
            Think of your document library as a city seen from above.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-bg-raised rounded p-4">
              <div className="text-accent-cyan font-medium mb-2">Neighborhoods</div>
              <p className="text-text-muted">Documents that share a topic or tone cluster into neighborhoods. Marketing copy in one area, technical docs in another, thought leadership in a third.</p>
            </div>
            <div className="bg-bg-raised rounded p-4">
              <div className="text-accent-gold font-medium mb-2">Borders</div>
              <p className="text-text-muted">Where neighborhoods meet, you find documents that bridge two areas. These are often your most interesting and versatile content pieces.</p>
            </div>
            <div className="bg-bg-raised rounded p-4">
              <div className="text-accent-cyan font-medium mb-2">Empty Lots</div>
              <p className="text-text-muted">Visible gaps between clusters are semantic territory nobody has claimed yet. These are content opportunities: topics adjacent to what you already cover, but that nobody has written about.</p>
            </div>
          </div>
        </div>
        <p className="text-text-muted leading-relaxed">
          Document Intelligence uses an algorithm called <strong className="text-text-primary">UMAP</strong> to compress 1,024 dimensions down to a 2D map while preserving these neighborhood relationships. What you see on the map is mathematically faithful to the actual semantic structure of your content.
        </p>
      </section>

      {/* The Top Performer Insight */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-text-primary mb-3">The Top Performer Strategy</h2>
        <p className="text-text-muted leading-relaxed mb-4">
          This is where it gets powerful. If you tag your best-performing documents (highest engagement, most conversions, best click rates) as a category, something becomes visible immediately:
        </p>
        <div className="bg-bg-raised border border-accent-gold/20 rounded-lg p-5 mb-4 space-y-3 text-sm text-text-muted leading-relaxed">
          <p>
            <strong className="text-accent-gold">Winners cluster.</strong> High-performing content doesn't scatter randomly across the map. It concentrates in specific semantic neighborhoods. This means there are identifiable patterns in what makes content work.
          </p>
          <p>
            <strong className="text-accent-gold">Neighbors are candidates.</strong> Documents that sit close to your top performers in semantic space share their characteristics. They're either already performing well (and you didn't know it), or they're one revision away from breaking through.
          </p>
          <p>
            <strong className="text-accent-gold">Gaps are opportunities.</strong> When you can see where your winners live, you can also see where they <em>don't</em>. Adjacent regions with no top performers are places where content with winning characteristics could be placed but doesn't exist yet.
          </p>
        </div>
        <p className="text-text-muted leading-relaxed">
          This is exactly what the Generator does. You point to a semantic zone, and the system creates new documents designed to land there. It's not random generation. It's targeted synthesis.
        </p>
      </section>

      {/* How It Works */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-text-primary mb-3">How It Works, Step by Step</h2>
        <div className="space-y-4">
          {[
            {
              num: '1',
              title: 'Upload your documents',
              desc: 'CSV, JSON, or plain text. Each document needs at minimum a body of text. Optionally include titles and categories. The system accepts 10 to 10,000+ documents.',
            },
            {
              num: '2',
              title: 'Embedding',
              desc: 'Every document is sent to Voyage AI, which returns a 1,024-dimensional vector encoding its meaning. This happens in batches of 100 with automatic retry. For 1,000 documents, expect about 30 seconds.',
            },
            {
              num: '3',
              title: 'Projection',
              desc: 'The vectors are compressed: first from 1,024 to 50 dimensions using PCA (removing noise), then from 50 to 2 using UMAP (preserving neighborhoods). The result is a 2D scatter plot where proximity equals semantic similarity.',
            },
            {
              num: '4',
              title: 'Exploration',
              desc: 'Click any point to see its full content, its category, and its 25 nearest neighbors with similarity scores. Search across the corpus. Summarize documents with AI. Export neighborhoods.',
            },
            {
              num: '5',
              title: 'Comparison',
              desc: 'Select two categories and see exactly how they overlap. A cross-neighborhood analysis measures cosine similarity between every document in Population A and its nearest neighbors in Population B. The result is a distribution that shows you where they converge and diverge.',
            },
            {
              num: '6',
              title: 'Generation',
              desc: 'Select a target zone on the map. The system generates 10 candidates, embeds all of them into the same vector space, projects them onto the 2D map, and ranks by proximity to your target. Gold stars mark the top 5. Export the results as CSV to use alongside your corpus. The map is the ground truth: if a generated document lands near your target, it genuinely shares the semantic characteristics of that zone.',
            },
          ].map((step) => (
            <div key={step.num} className="flex gap-4">
              <div className="shrink-0 w-7 h-7 rounded-full bg-accent-cyan/15 flex items-center justify-center mt-0.5">
                <span className="text-accent-cyan font-mono text-xs font-bold">{step.num}</span>
              </div>
              <div>
                <h3 className="text-text-primary font-medium text-sm mb-1">{step.title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cosine Similarity */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-text-primary mb-3">Understanding Cosine Similarity</h2>
        <p className="text-text-muted leading-relaxed mb-4">
          Cosine similarity is the core metric throughout the platform. It measures the angle between two document vectors, producing a score from 0 to 1. Unlike keyword matching, it captures semantic relationships: "revenue growth" and "fiscal performance" can score 0.85+ despite sharing zero words.
        </p>
        <div className="grid grid-cols-4 gap-2 text-sm mb-4">
          <div className="bg-bg-surface border border-success/30 rounded p-3 text-center">
            <div className="text-success font-mono font-medium">0.8 – 1.0</div>
            <div className="text-xs text-success mt-1">Very Similar</div>
            <p className="text-[10px] text-text-muted mt-1">Nearly identical meaning</p>
          </div>
          <div className="bg-bg-surface border border-accent-cyan/30 rounded p-3 text-center">
            <div className="text-accent-cyan font-mono font-medium">0.6 – 0.8</div>
            <div className="text-xs text-accent-cyan mt-1">Related</div>
            <p className="text-[10px] text-text-muted mt-1">Same topic or theme</p>
          </div>
          <div className="bg-bg-surface border border-warning/30 rounded p-3 text-center">
            <div className="text-warning font-mono font-medium">0.3 – 0.6</div>
            <div className="text-xs text-warning mt-1">Loosely Related</div>
            <p className="text-[10px] text-text-muted mt-1">Some overlap</p>
          </div>
          <div className="bg-bg-surface border border-error/30 rounded p-3 text-center">
            <div className="text-error font-mono font-medium">0.0 – 0.3</div>
            <div className="text-xs text-error mt-1">Unrelated</div>
            <p className="text-[10px] text-text-muted mt-1">Different domains</p>
          </div>
        </div>
      </section>

      {/* Technology */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-text-primary mb-3">Technology</h2>
        <div className="bg-bg-surface border border-border-line rounded-lg p-5 text-sm space-y-2 text-text-muted">
          <p><strong className="text-text-primary">Embeddings:</strong> Voyage AI (voyage-3.5-lite or voyage-3.5), 1,024-dimensional vectors optimized for semantic similarity.</p>
          <p><strong className="text-text-primary">LLM:</strong> Anthropic Claude. Sonnet for document generation. Haiku for summarization and analysis.</p>
          <p><strong className="text-text-primary">Dimensionality Reduction:</strong> PCA (1,024 → 50) followed by UMAP (50 → 2). All computed client-side in your browser.</p>
          <p><strong className="text-text-primary">Storage:</strong> IndexedDB in your browser. Your documents never leave your machine. No server database.</p>
          <p><strong className="text-text-primary">Hosting:</strong> Cloudflare Pages (static frontend) + Cloudflare Workers (API proxy holding secrets). Global edge deployment.</p>
          <p><strong className="text-text-primary">Frontend:</strong> React 19, Vite, Tailwind CSS, Plotly.js, Zustand.</p>
        </div>
      </section>

      <div className="text-center">
        <Link
          to="/corpus/new"
          className="bg-accent-cyan text-bg-primary px-8 py-3 rounded-lg font-medium no-underline hover:opacity-90 transition-opacity"
        >
          Create Your First Corpus
        </Link>
      </div>
    </div>
  );
}
