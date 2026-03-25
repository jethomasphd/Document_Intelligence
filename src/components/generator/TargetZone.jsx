export default function TargetZone({ exemplars }) {
  return (
    <div className="bg-bg-surface border border-border-line rounded-lg p-4">
      <h3 className="text-text-primary font-medium mb-1">
        Target Zone <span className="text-text-muted font-normal text-sm">({exemplars.length} exemplars)</span>
      </h3>
      <p className="text-text-muted text-xs mb-3">
        These documents define the semantic neighborhood. Generated content will aim to fit among them.
      </p>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {exemplars.map((doc, i) => (
          <div key={doc.id || i} className="flex items-start gap-3 text-sm">
            <span
              className="text-text-muted font-mono shrink-0 w-12 text-right"
              title="Cosine similarity to the zone centroid"
            >
              {doc.similarity ? doc.similarity.toFixed(3) : '\u2014'}
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
