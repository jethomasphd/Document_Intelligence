import { useMemo, useState } from 'react';
import InfoHint from '../ui/InfoHint';

const CATEGORY_COLORS = ['#00d4ff', '#f0a500', '#10b981', '#a855f7', '#f43f5e', '#3b82f6', '#84cc16', '#fb923c'];

const FIELD_INFO = {
  id: {
    label: 'ID',
    required: false,
    tooltip: 'A unique identifier for each document. This could be a document number, transaction hash, ISBN, SKU, or any value that uniquely distinguishes one record from another. If not mapped, rows are numbered automatically.',
    placeholder: 'e.g., doc_id, isbn, sku, transaction_id',
  },
  content: {
    label: 'Content',
    required: true,
    tooltip: 'The actual body text of the document \u2014 the substance that will be semantically embedded. This is the most important field. For emails, this is the email body. For books, a chapter or abstract. For products, the description. The richer the content, the better the embedding.',
    placeholder: 'e.g., body, description, text, abstract',
  },
  title: {
    label: 'Title',
    required: false,
    tooltip: 'A short display name for each document. For books, this is the book title. For emails, the subject line. For websites, the page name (e.g., "Landing Page 007"). Used as labels on the map and in neighbor lists.',
    placeholder: 'e.g., title, name, subject, heading',
  },
};

export default function FieldMapper({ columns, data, config, setConfig, onNext, onBack }) {
  const [singlePop, setSinglePop] = useState(false);
  const [showCategoryTip, setShowCategoryTip] = useState(false);

  const updateField = (field, value) => {
    setConfig((prev) => ({
      ...prev,
      fieldMap: { ...prev.fieldMap, [field]: value },
    }));
  };

  const categories = useMemo(() => {
    if (singlePop || !config.fieldMap.category) return [];
    const catCol = config.fieldMap.category;
    const unique = [...new Set(data.map((d) => d[catCol]).filter(Boolean))];
    return unique.map((name, i) => ({
      name,
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    }));
  }, [data, config.fieldMap.category, singlePop]);

  const canProceed =
    config.name.trim() &&
    config.fieldMap.content &&
    (singlePop || config.fieldMap.category);

  return (
    <div>
      {/* Corpus identity */}
      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-sm mb-1">
            <span className="text-text-muted">Corpus Name</span>
            <span className="text-accent-cyan ml-1">*</span>
          </label>
          <input
            value={config.name}
            onChange={(e) => setConfig((prev) => ({ ...prev, name: e.target.value }))}
            className={`w-full bg-bg-raised border rounded px-3 py-2 text-text-primary transition-colors ${config.name.trim() ? 'border-success/40' : 'border-accent-cyan/50'}`}
            placeholder="My Document Corpus"
          />
          {!config.name.trim() && (
            <p className="text-accent-cyan text-xs mt-1">Give your corpus a name so you can find it later.</p>
          )}
        </div>
        <div>
          <label className="block text-sm text-text-muted mb-1">
            Domain
            <InfoHint text="Describe what these documents are. This context helps Claude generate better content later and provides framing for AI-powered analysis. Be specific: 'B2B SaaS product descriptions' works better than 'product descriptions'." />
          </label>
          <input
            value={config.domain}
            onChange={(e) => setConfig((prev) => ({ ...prev, domain: e.target.value }))}
            className="w-full bg-bg-raised border border-border-line rounded px-3 py-2 text-text-primary"
            placeholder="e.g., email subject lines, product descriptions, research abstracts..."
          />
          <p className="text-text-muted text-xs mt-1">Optional but recommended. Helps the AI understand your content when generating or analyzing.</p>
        </div>
      </div>

      {/* Field mapping */}
      <h3 className="text-text-primary font-medium mb-2">Map Your Columns</h3>
      <p className="text-text-muted text-sm mb-4">
        Tell the system which columns in your data correspond to each field.
        Only <strong className="text-accent-cyan">Content</strong> is required &mdash; this is the text that gets embedded into semantic space.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {Object.entries(FIELD_INFO).map(([key, info]) => {
          const isMapped = !!config.fieldMap[key];
          return (
            <div key={key} className={`rounded-lg border p-3 transition-colors ${info.required && !isMapped ? 'border-accent-cyan/50 bg-accent-cyan/5' : isMapped ? 'border-success/30 bg-success/5' : 'border-border-line'}`}>
              <label className="block text-sm mb-1.5">
                <span className={isMapped ? 'text-success' : info.required ? 'text-accent-cyan' : 'text-text-muted'}>{info.label}</span>
                {info.required && <span className="text-accent-cyan ml-1">*</span>}
                {isMapped && <span className="text-success text-xs ml-2">&#10003;</span>}
                <InfoHint text={info.tooltip} />
              </label>
              <select
                value={config.fieldMap[key]}
                onChange={(e) => updateField(key, e.target.value)}
                className={`w-full bg-bg-raised border rounded px-3 py-2 text-text-primary transition-colors ${info.required && !isMapped ? 'border-accent-cyan/50' : isMapped ? 'border-success/30' : 'border-border-line'}`}
              >
                <option value="">{info.required ? `\u2190 Select your ${info.label.toLowerCase()} column` : `\u2014 Select column (optional) \u2014`}</option>
                {columns.map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
              {info.required && !isMapped && (
                <p className="text-accent-cyan text-xs mt-1.5">Which column contains the {info.label.toLowerCase() === 'content' ? 'text you want to analyze' : info.label.toLowerCase()}?</p>
              )}
              {!info.required && !isMapped && (
                <p className="text-text-muted text-xs mt-1">{info.placeholder}</p>
              )}
            </div>
          );
        })}

        {/* Category - special treatment */}
        <div className={`rounded-lg border p-3 transition-colors ${!singlePop && !config.fieldMap.category ? 'border-accent-cyan/50 bg-accent-cyan/5' : (singlePop || config.fieldMap.category) ? 'border-success/30 bg-success/5' : 'border-border-line'}`}>
          <label className="block text-sm mb-1.5">
            <span className={(singlePop || config.fieldMap.category) ? 'text-success' : 'text-accent-cyan'}>Category</span>
            <span className="text-accent-cyan ml-1">*</span>
            {(singlePop || config.fieldMap.category) && <span className="text-success text-xs ml-2">&#10003;</span>}
            <InfoHint text="The high-level grouping for each document. This splits your corpus into color-coded populations on the map. For books: fiction vs. non-fiction. For emails: department. For products: product line." />
          </label>
          <div className="flex items-center gap-2">
            {!singlePop && (
              <select
                value={config.fieldMap.category}
                onChange={(e) => updateField('category', e.target.value)}
                className={`flex-1 bg-bg-raised border rounded px-3 py-2 text-text-primary transition-colors ${!config.fieldMap.category ? 'border-accent-cyan/50' : 'border-success/30'}`}
              >
                <option value="">&larr; Select your category column</option>
                {columns.map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            )}
            <label className="flex items-center gap-1.5 text-sm text-text-muted whitespace-nowrap cursor-pointer">
              <input
                type="checkbox"
                checked={singlePop}
                onChange={(e) => {
                  setSinglePop(e.target.checked);
                  if (e.target.checked) updateField('category', '');
                }}
                className="accent-accent-cyan"
              />
              No categories &mdash; treat as single group
            </label>
          </div>
          {!singlePop && !config.fieldMap.category && (
            <p className="text-accent-cyan text-xs mt-1.5">Select a column, or check the box if all documents belong to one group.</p>
          )}
        </div>
      </div>

      {/* Category insight - the top performers idea */}
      {!singlePop && (
        <div className="bg-bg-raised/50 border border-accent-gold/20 rounded-lg p-4 mb-6">
          <button
            onClick={() => setShowCategoryTip(!showCategoryTip)}
            className="flex items-center gap-2 text-sm text-accent-gold font-medium w-full text-left"
          >
            <span>{showCategoryTip ? '\u25BC' : '\u25B6'}</span>
            Pro tip: Use Category strategically
          </button>
          {showCategoryTip && (
            <div className="mt-3 text-sm text-text-muted leading-relaxed space-y-2">
              <p>
                Category isn't just for labeling &mdash; it's a powerful analytical lens.
                Beyond basic taxonomy (fiction vs. non-fiction), consider using it to encode <strong className="text-text-primary">performance data</strong>:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  <strong className="text-text-primary">Top Performers vs. Others</strong> &mdash; Label your best-performing documents (top sellers, highest engagement, most cited) as a "Top" category.
                  Then use the Comparator to see where top performers cluster and what semantic patterns distinguish them.
                </li>
                <li>
                  <strong className="text-text-primary">Nearest Neighbors of Winners</strong> &mdash; In the Explorer, click a top-performing document and examine its nearest neighbors.
                  The hypothesis: documents semantically close to proven winners may also perform well. Use this to identify hidden gems in your corpus.
                </li>
                <li>
                  <strong className="text-text-primary">Generate More Winners</strong> &mdash; Select the top-performer zone in the Generator and synthesize new documents that target that region.
                  You're essentially saying "create more content like my best content."
                </li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Category colors */}
      {categories.length > 0 && (
        <div className="mb-6">
          <h3 className="text-text-primary font-medium mb-3">
            Detected Categories
            <span className="text-text-muted font-normal text-sm ml-2">({categories.length} found)</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <div
                key={cat.name}
                className="flex items-center gap-2 bg-bg-raised border border-border-line rounded px-3 py-1.5"
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-sm text-text-primary">{cat.name}</span>
              </div>
            ))}
          </div>
          <p className="text-text-muted text-xs mt-2">
            Each category gets its own color on the semantic map. You can compare any two categories in the Comparator.
          </p>
        </div>
      )}

      {/* Embedding model */}
      <div className="mb-8">
        <label className="block text-sm text-text-muted mb-2">Embedding Model</label>
        <div className="space-y-2">
          <label className={`flex gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${config.embeddingModel === 'voyage-3.5-lite' ? 'border-accent-cyan bg-accent-cyan/5' : 'border-border-line bg-bg-raised hover:border-border-line/80'}`}>
            <input
              type="radio"
              name="embeddingModel"
              value="voyage-3.5-lite"
              checked={config.embeddingModel === 'voyage-3.5-lite'}
              onChange={(e) => setConfig((prev) => ({ ...prev, embeddingModel: e.target.value }))}
              className="accent-accent-cyan mt-0.5"
            />
            <div>
              <div className="text-text-primary font-medium text-sm">voyage-3.5-lite <span className="text-text-muted font-normal">(recommended for most use cases)</span></div>
              <p className="text-text-muted text-xs leading-relaxed mt-1">
                Fast and cost-effective. Best for short-to-medium documents: email subject lines, tweets, product titles, headlines, social media posts.
                Also the right choice for large corpora (1,000+ documents) where embedding speed matters. 1,024 dimensions.
              </p>
            </div>
          </label>
          <label className={`flex gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${config.embeddingModel === 'voyage-3.5' ? 'border-accent-cyan bg-accent-cyan/5' : 'border-border-line bg-bg-raised hover:border-border-line/80'}`}>
            <input
              type="radio"
              name="embeddingModel"
              value="voyage-3.5"
              checked={config.embeddingModel === 'voyage-3.5'}
              onChange={(e) => setConfig((prev) => ({ ...prev, embeddingModel: e.target.value }))}
              className="accent-accent-cyan mt-0.5"
            />
            <div>
              <div className="text-text-primary font-medium text-sm">voyage-3.5 <span className="text-text-muted font-normal">(higher fidelity)</span></div>
              <p className="text-text-muted text-xs leading-relaxed mt-1">
                Higher-quality semantic representations. Best for complex, nuanced documents: research papers, book chapters, legal contracts, technical documentation, long-form articles.
                Takes longer to process but captures subtle distinctions that the lite model may miss. 1,024 dimensions.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Completion checklist */}
      {!canProceed && (
        <div className="bg-bg-surface border border-accent-cyan/20 rounded-lg p-4 mb-4">
          <p className="text-text-muted text-sm font-medium mb-2">Still needed before you can continue:</p>
          <ul className="text-sm space-y-1">
            {!config.name.trim() && <li className="text-accent-cyan">&#8226; Give your corpus a name</li>}
            {!config.fieldMap.content && <li className="text-accent-cyan">&#8226; Select which column contains your document text (Content)</li>}
            {!singlePop && !config.fieldMap.category && <li className="text-accent-cyan">&#8226; Select a category column, or check &ldquo;No categories&rdquo;</li>}
          </ul>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="border border-border-line text-text-primary px-6 py-2 rounded hover:border-accent-cyan/50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => {
            if (singlePop) {
              setConfig((prev) => ({
                ...prev,
                categories: [{ name: 'All', color: CATEGORY_COLORS[0] }],
              }));
            } else {
              setConfig((prev) => ({ ...prev, categories }));
            }
            onNext();
          }}
          disabled={!canProceed}
          className={`px-6 py-2 rounded font-medium transition-all ${canProceed ? 'bg-accent-cyan text-bg-primary hover:opacity-90' : 'bg-bg-raised text-text-muted border border-border-line cursor-not-allowed'}`}
        >
          {canProceed ? 'Continue to Embedding \u2192' : 'Complete the fields above to continue'}
        </button>
      </div>
    </div>
  );
}
