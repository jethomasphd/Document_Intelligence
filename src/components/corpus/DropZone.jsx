import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';

const DATA_SPECS = [
  { format: 'CSV', desc: 'Comma-separated values with a header row. Each row = one document.', example: 'id,title,content,category\n1,"Q3 Update","Revenue grew 15%...",earnings' },
  { format: 'JSON', desc: 'An array of objects. Each object = one document.', example: '[{"title": "Q3 Update", "content": "Revenue grew 15%...", "category": "earnings"}]' },
  { format: 'TXT', desc: 'Plain text. Each line = one document (no columns, just text).', example: 'Revenue grew 15% in Q3\nNew product launch exceeded targets' },
];

export default function DropZone({ onDataParsed }) {
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showSpecs, setShowSpecs] = useState(false);

  const parseCSV = (file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0 && results.data.length === 0) {
          setError('Failed to parse CSV: ' + results.errors[0].message);
          return;
        }
        const columns = results.meta.fields || [];
        setPreview({ data: results.data, columns, count: results.data.length });
        onDataParsed(results.data, columns);
      },
    });
  };

  const parseJSON = (text) => {
    try {
      const data = JSON.parse(text);
      const arr = Array.isArray(data) ? data : [data];
      if (arr.length === 0) {
        setError('JSON array is empty');
        return;
      }
      const columns = Object.keys(arr[0]);
      setPreview({ data: arr, columns, count: arr.length });
      onDataParsed(arr, columns);
    } catch (e) {
      setError('Invalid JSON: ' + e.message);
    }
  };

  const parseTXT = (text) => {
    const lines = text.split('\n').filter((l) => l.trim());
    if (lines.length === 0) {
      setError('File is empty');
      return;
    }
    const data = lines.map((line, i) => ({ id: String(i + 1), content: line.trim() }));
    const columns = ['id', 'content'];
    setPreview({ data, columns, count: data.length });
    onDataParsed(data, columns);
  };

  const onDrop = useCallback((accepted) => {
    setError(null);
    setPreview(null);

    if (accepted.length === 0) return;
    const file = accepted[0];
    const ext = file.name.split('.').pop().toLowerCase();

    if (ext === 'csv') {
      parseCSV(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        if (ext === 'json') parseJSON(text);
        else if (ext === 'txt') parseTXT(text);
        else setError('Unsupported file type: .' + ext);
      };
      reader.readAsText(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      'text/plain': ['.txt'],
    },
    multiple: false,
  });

  return (
    <div>
      {/* What counts as a "document" */}
      <div className="bg-bg-surface border border-border-line rounded-lg p-5 mb-6">
        <h3 className="text-text-primary font-medium mb-2">What counts as a &ldquo;document&rdquo; in this tool?</h3>
        <p className="text-text-muted text-sm leading-relaxed mb-3">
          A <strong className="text-text-primary">document</strong> is any single piece of text you want to analyze.
          It could be one sentence or several paragraphs &mdash; the tool works with both. Each document becomes one dot on the map.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-text-muted">
          <div className="bg-bg-raised rounded p-3">
            <div className="text-accent-cyan font-medium text-xs mb-1">Short documents</div>
            Email subject lines, tweet texts, headlines, product titles, taglines, one-liners
          </div>
          <div className="bg-bg-raised rounded p-3">
            <div className="text-accent-cyan font-medium text-xs mb-1">Long documents</div>
            Full emails, product descriptions, blog posts, research abstracts, chapters, reports
          </div>
        </div>
        <p className="text-text-muted text-xs mt-3 leading-relaxed">
          <strong className="text-text-primary">Key rule:</strong> Every row in your file = one document = one dot on the map.
          A file with 500 rows gives you a map of 500 points. The <strong className="text-text-primary">content</strong> column
          is the text that gets analyzed &mdash; everything else (title, category, ID) is metadata for labeling and filtering.
        </p>
      </div>

      {/* Data structure guide */}
      <div className="bg-bg-surface border border-accent-cyan/20 rounded-lg p-5 mb-6">
        <h3 className="text-text-primary font-medium mb-2">How to structure your data</h3>
        <p className="text-text-muted text-sm leading-relaxed mb-3">
          Your file should have <strong className="text-text-primary">one row per document</strong> and columns for each piece of information.
          Only one column is required: the text content. Everything else is optional but useful.
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-3">
            <span className="text-accent-cyan font-mono text-xs font-bold bg-accent-cyan/10 px-2 py-0.5 rounded shrink-0 mt-0.5">Required</span>
            <div>
              <strong className="text-text-primary">Content</strong>
              <span className="text-text-muted"> &mdash; The actual text to analyze. This is the substance: the email body, the product description, the review text, the abstract. Longer and richer text produces better results.</span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-text-muted font-mono text-xs bg-bg-raised px-2 py-0.5 rounded shrink-0 mt-0.5">Optional</span>
            <div>
              <strong className="text-text-primary">Title</strong>
              <span className="text-text-muted"> &mdash; A short label shown on the map and in lists. For emails: the subject line. For products: the product name. If you don't have one, the first few words of content are used.</span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-text-muted font-mono text-xs bg-bg-raised px-2 py-0.5 rounded shrink-0 mt-0.5">Optional</span>
            <div>
              <strong className="text-text-primary">Category</strong>
              <span className="text-text-muted"> &mdash; A group label that color-codes your map and enables population comparison. Examples: &ldquo;Top Performer&rdquo; vs. &ldquo;Other&rdquo;, department names, product lines, star ratings.</span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-text-muted font-mono text-xs bg-bg-raised px-2 py-0.5 rounded shrink-0 mt-0.5">Optional</span>
            <div>
              <strong className="text-text-primary">ID</strong>
              <span className="text-text-muted"> &mdash; A unique identifier (SKU, ISBN, transaction ID). If not provided, rows are numbered automatically.</span>
            </div>
          </div>
        </div>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-accent-cyan bg-accent-cyan/5'
            : 'border-border-line hover:border-accent-cyan/50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="text-4xl mb-4 opacity-30">+</div>
        <p className="text-text-primary mb-2">
          {isDragActive ? 'Drop your file here' : 'Drag & drop a file here, or click to browse'}
        </p>
        <p className="text-text-muted text-sm">Accepts .csv, .json, or .txt files</p>
      </div>

      {/* Data requirements */}
      <div className="mt-4">
        <button
          onClick={() => setShowSpecs(!showSpecs)}
          className="text-sm text-text-muted hover:text-accent-cyan transition-colors flex items-center gap-1"
        >
          <span>{showSpecs ? '\u25BC' : '\u25B6'}</span>
          Data format requirements
        </button>
        {showSpecs && (
          <div className="mt-3 bg-bg-surface border border-border-line rounded-lg p-4 space-y-3">
            <p className="text-text-muted text-sm">
              Your file must contain at least one column or field with the <strong className="text-text-primary">text content</strong> to analyze.
              The system works best with 10&ndash;10,000 documents. Very short texts (under 10 words) produce weaker embeddings.
            </p>
            {DATA_SPECS.map((spec) => (
              <div key={spec.format} className="flex gap-3 items-start">
                <span className="text-accent-cyan font-mono text-xs font-medium bg-accent-cyan/10 px-2 py-0.5 rounded shrink-0 mt-0.5">
                  {spec.format}
                </span>
                <div>
                  <p className="text-text-primary text-sm">{spec.desc}</p>
                  <code className="text-text-muted text-xs font-mono">{spec.example}</code>
                </div>
              </div>
            ))}
            <div className="border-t border-border-line pt-3">
              <p className="text-text-muted text-xs leading-relaxed">
                <strong className="text-text-primary">Recommended structure:</strong> Include a <em>content</em> column (the full text to embed),
                a <em>title</em> column (short display label), and optionally a <em>category</em> column (for population comparison).
                Avoid columns with very long HTML or binary data.
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-error/10 border border-error/30 rounded text-error text-sm">
          {error}
        </div>
      )}

      {preview && (
        <div className="mt-6">
          <h3 className="text-text-primary font-medium mb-2">
            Preview
            <span className="text-text-muted font-normal text-sm ml-2">
              {preview.count} documents, {preview.columns.length} columns
            </span>
          </h3>
          <div className="overflow-x-auto border border-border-line rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-bg-raised">
                <tr>
                  {preview.columns.map((col) => (
                    <th key={col} className="text-left px-3 py-2 text-text-muted font-mono font-medium">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.data.slice(0, 10).map((row, i) => (
                  <tr key={i} className="border-t border-border-line">
                    {preview.columns.map((col) => (
                      <td key={col} className="px-3 py-2 text-text-primary max-w-xs truncate">
                        {String(row[col] || '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.count > 10 && (
            <p className="text-text-muted text-xs mt-1">Showing 10 of {preview.count} rows</p>
          )}
        </div>
      )}
    </div>
  );
}
