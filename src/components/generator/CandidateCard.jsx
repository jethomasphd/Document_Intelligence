import clsx from 'clsx';

const BADGE = {
  'on-target': {
    label: 'On Target',
    color: 'bg-success/20 text-success border-success/30',
    description: 'Landed within the target zone (>0.8 similarity)',
  },
  adjacent: {
    label: 'Adjacent',
    color: 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/30',
    description: 'Close to the target zone (0.6-0.8 similarity)',
  },
  'off-target': {
    label: 'Off Target',
    color: 'bg-error/10 text-error border-error/30',
    description: 'Outside the target zone (<0.6 similarity)',
  },
};

export default function CandidateCard({ candidate }) {
  const badge = BADGE[candidate.placement];

  return (
    <div
      className={clsx(
        'bg-bg-surface border rounded-lg p-4',
        candidate.accepted
          ? 'border-success/30'
          : 'border-border-line opacity-60'
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-text-muted font-mono text-xs shrink-0 w-6 text-right">
            #{candidate.rank}
          </span>
          <h4 className="text-text-primary font-medium text-sm truncate">
            {candidate.title || 'Untitled'}
          </h4>
          {candidate.accepted && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-gold/20 text-accent-gold border border-accent-gold/30 shrink-0">
              Top 5
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {badge && (
            <span
              className={clsx('text-[10px] px-1.5 py-0.5 rounded border', badge.color)}
              title={badge.description}
            >
              {badge.label}
            </span>
          )}
          {candidate.similarity !== undefined && (
            <span className="text-xs text-text-muted font-mono" title="Cosine similarity to the zone centroid">
              {candidate.similarity.toFixed(3)}
            </span>
          )}
        </div>
      </div>

      <div className="text-text-primary text-sm bg-bg-raised rounded p-3 max-h-28 overflow-y-auto ml-8">
        {candidate.content}
      </div>

      {candidate.rationale && (
        <p className="text-text-muted text-xs mt-2 ml-8 italic">
          <span className="not-italic font-medium">Why it fits: </span>
          {candidate.rationale}
        </p>
      )}
    </div>
  );
}
