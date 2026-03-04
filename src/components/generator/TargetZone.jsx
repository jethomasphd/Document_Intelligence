export default function TargetZone({ exemplars }) {
  return (
    <div className="bg-bg-surface border border-border-line rounded-lg p-4">
      <h3 className="text-text-primary font-medium mb-3">
        Target Zone <span className="text-text-muted font-normal text-sm">({exemplars.length} exemplars)</span>
      </h3>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {exemplars.map((doc, i) => (
          <div key={doc.id || i} className="flex items-start gap-3 text-sm">
            <span className="text-text-muted font-mono shrink-0 w-12 text-right">
              {doc.similarity ? doc.similarity.toFixed(3) : '—'}
            </span>
            <div className="min-w-0">
              <div className="text-text-primary truncate">{doc.title || doc.id}</div>
              <div className="text-text-muted text-xs truncate">{doc.content?.slice(0, 80)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
