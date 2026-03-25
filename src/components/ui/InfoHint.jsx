import Tooltip from './Tooltip';

export default function InfoHint({ text, position = 'top' }) {
  return (
    <Tooltip text={text} position={position}>
      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-text-muted/40 text-text-muted text-[10px] cursor-help ml-1 hover:border-accent-cyan hover:text-accent-cyan transition-colors">
        ?
      </span>
    </Tooltip>
  );
}
