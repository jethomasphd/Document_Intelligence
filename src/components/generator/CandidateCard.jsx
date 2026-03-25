import clsx from 'clsx';

const BADGE = {
  'on-target': {
    label: 'On Target',
    color: 'bg-success text-bg-primary',
    description: 'Landed within the target zone (>0.8 similarity)',
  },
  adjacent: {
    label: 'Adjacent',
    color: 'bg-warning text-bg-primary',
    description: 'Close to the target zone (0.6-0.8 similarity)',
  },
  'off-target': {
    label: 'Off Target',
    color: 'bg-error text-bg-primary',
    description: 'Landed outside the target zone (<0.6 similarity)',
  },
};

export default function CandidateCard({ candidate, onVerify, onAccept }) {
  return (
    <div className="bg-bg-surface border border-border-line rounded-lg p-5">
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-text-primary font-medium">{candidate.title || 'Untitled'}</h4>
        <div className="flex items-center gap-2">
          {candidate.placement && (
            <span
              className={clsx('text-xs px-2 py-0.5 rounded font-medium', BADGE[candidate.placement]?.color)}
              title={BADGE[candidate.placement]?.description}
            >
              {BADGE[candidate.placement]?.label}
            </span>
          )}
          {candidate.similarity !== undefined && (
            <span className="text-xs text-text-muted font-mono" title="Cosine similarity to the zone centroid">
              sim: {candidate.similarity.toFixed(3)}
            </span>
          )}
        </div>
      </div>

      <div className="text-text-primary text-sm mb-3 bg-bg-raised rounded p-3 max-h-40 overflow-y-auto">
        {candidate.content}
      </div>

      {candidate.rationale && (
        <p className="text-text-muted text-xs mb-3 italic">
          <span className="text-text-muted/70 not-italic font-medium">Why it fits: </span>
          {candidate.rationale}
        </p>
      )}

      <div className="flex gap-2 items-center">
        {!candidate.verified && !candidate.accepted && (
          <button
            onClick={onVerify}
            className="border border-accent-cyan text-accent-cyan px-4 py-1.5 rounded text-sm hover:bg-accent-cyan/10 transition-colors"
          >
            Verify Placement
          </button>
        )}
        {candidate.verified && !candidate.accepted && (
          <button
            onClick={onAccept}
            className="bg-success text-bg-primary px-4 py-1.5 rounded text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Accept to Corpus
          </button>
        )}
        {candidate.accepted && (
          <span className="text-success text-sm font-medium">Added to corpus</span>
        )}
        {!candidate.verified && !candidate.accepted && (
          <span className="text-text-muted text-xs ml-2">
            Embeds the text and checks where it lands on the semantic map
          </span>
        )}
      </div>
    </div>
  );
}
