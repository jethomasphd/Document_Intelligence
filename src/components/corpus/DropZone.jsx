import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';

export default function DropZone({ onDataParsed }) {
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);

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

      {error && (
        <div className="mt-4 p-3 bg-error/10 border border-error/30 rounded text-error text-sm">
          {error}
        </div>
      )}

      {preview && (
        <div className="mt-6">
          <h3 className="text-text-primary font-medium mb-2">
            Preview ({preview.count} documents, {preview.columns.length} columns)
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
