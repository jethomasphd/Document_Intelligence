import { useMemo, useState } from 'react';
import InfoHint from '../ui/InfoHint';

const CATEGORY_COLORS = ['#00d4ff', '#f0a500', '#10b981', '#a855f7', '#f43f5e', '#3b82f6', '#84cc16', '#fb923c'];

export default function FieldMapper({ columns, data, config, setConfig, onNext, onBack }) {
  const [singlePop, setSinglePop] = useState(false);

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
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm text-text-muted mb-1">Corpus Name</label>
          <input
            value={config.name}
            onChange={(e) => setConfig((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full bg-bg-raised border border-border-line rounded px-3 py-2 text-text-primary"
            placeholder="My Document Corpus"
          />
        </div>
        <div>
          <label className="block text-sm text-text-muted mb-1">
            Domain
            <InfoHint text="Describe what these documents are (e.g., 'email subject lines', 'product descriptions'). This helps Claude generate better content later." />
          </label>
          <input
            value={config.domain}
            onChange={(e) => setConfig((prev) => ({ ...prev, domain: e.target.value }))}
            className="w-full bg-bg-raised border border-border-line rounded px-3 py-2 text-text-primary"
            placeholder="e.g., email subject lines, product descriptions, news articles..."
          />
        </div>
      </div>

      <h3 className="text-text-primary font-medium mb-3">Map Columns to Fields</h3>
      <p className="text-text-muted text-sm mb-4">
        Tell us which columns in your data correspond to each field. <strong>Content</strong> is the text that will be embedded — this is the only required mapping.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {[
          { key: 'id', label: 'ID', tooltip: 'Unique identifier for each document' },
          { key: 'content', label: 'Content *', tooltip: 'The main text to embed and analyze' },
          { key: 'title', label: 'Title', tooltip: 'Short label for display (optional)' },
        ].map(({ key, label, tooltip }) => (
          <div key={key}>
            <label className="block text-sm text-text-muted mb-1" title={tooltip}>
              {label}
            </label>
            <select
              value={config.fieldMap[key]}
              onChange={(e) => updateField(key, e.target.value)}
              className="w-full bg-bg-raised border border-border-line rounded px-3 py-2 text-text-primary"
            >
              <option value="">— Select column —</option>
              {columns.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
        ))}
        <div>
          <label className="block text-sm text-text-muted mb-1">Category</label>
          <div className="flex items-center gap-2">
            {!singlePop && (
              <select
                value={config.fieldMap.category}
                onChange={(e) => updateField('category', e.target.value)}
                className="flex-1 bg-bg-raised border border-border-line rounded px-3 py-2 text-text-primary"
              >
                <option value="">— Select column —</option>
                {columns.map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            )}
            <label className="flex items-center gap-1 text-sm text-text-muted whitespace-nowrap cursor-pointer">
              <input
                type="checkbox"
                checked={singlePop}
                onChange={(e) => {
                  setSinglePop(e.target.checked);
                  if (e.target.checked) updateField('category', '');
                }}
                className="accent-accent-cyan"
              />
              Single population
            </label>
          </div>
        </div>
      </div>

      {/* Category colors */}
      {categories.length > 0 && (
        <div className="mb-6">
          <h3 className="text-text-primary font-medium mb-3">Category Colors</h3>
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
        </div>
      )}

      {/* Embedding model */}
      <div className="mb-6">
        <label className="block text-sm text-text-muted mb-1">
          Embedding Model
          <InfoHint text="voyage-3.5-lite is faster and cheaper. voyage-3.5 produces higher quality embeddings. Both output 1024-dimensional vectors." />
        </label>
        <select
          value={config.embeddingModel}
          onChange={(e) => setConfig((prev) => ({ ...prev, embeddingModel: e.target.value }))}
          className="bg-bg-raised border border-border-line rounded px-3 py-2 text-text-primary"
        >
          <option value="voyage-3.5-lite">voyage-3.5-lite (1024d, faster)</option>
          <option value="voyage-3.5">voyage-3.5 (1024d, higher quality)</option>
        </select>
      </div>

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
          className="bg-accent-cyan text-bg-primary px-6 py-2 rounded font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          Continue to Embedding
        </button>
      </div>
    </div>
  );
}
