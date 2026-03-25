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
              desc: 'Select a target zone on the map. The system generates 10 candidates, embeds all of them, projects them onto the map, ranks by proximity to the target, and automatically keeps the top 5. The map is the ground truth: if a generated document lands near your target, it genuinely shares the semantic characteristics of that zone.',
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
