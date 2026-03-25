export default function TargetZone({ exemplars, onReset }) {
  return (
    <div className="bg-bg-surface border border-accent-cyan/30 rounded-lg p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-text-primary font-medium">
          Target Zone
          <span className="text-text-muted font-normal text-sm ml-2">({exemplars.length} exemplars)</span>
        </h3>
        {onReset && (
          <button
            onClick={onReset}
            className="text-text-muted text-xs hover:text-error transition-colors"
          >
            Reset zone
          </button>
        )}
      </div>
      <p className="text-text-muted text-xs mb-3">
        These documents define the semantic neighborhood you're targeting.
        Claude sees these as examples of the kind of content to produce.
        Generated documents are verified against this zone's centroid.
      </p>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {exemplars.map((doc, i) => (
          <div key={doc.id || i} className="flex items-start gap-3 text-sm">
            <span
              className="text-text-muted font-mono shrink-0 w-12 text-right"
              title="Cosine similarity to the zone centroid. Higher = more central to the zone."
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
