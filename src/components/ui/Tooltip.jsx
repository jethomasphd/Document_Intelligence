import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

export default function Tooltip({ text, children, position = 'top' }) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);

  const show = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const pad = 12;
    const tipW = 320;

    // Default: center above the trigger
    let top = rect.top - pad;
    let left = rect.left + rect.width / 2 - tipW / 2;

    // If positioning below
    if (position === 'bottom') {
      top = rect.bottom + pad;
    }

    // Clamp horizontal so it never clips the viewport
    if (left < pad) left = pad;
    if (left + tipW > window.innerWidth - pad) left = window.innerWidth - pad - tipW;

    // If there's no room above, flip to below
    if (position === 'top' && top < pad) {
      top = rect.bottom + pad;
    }

    setCoords({ top, left });
    setVisible(true);
  }, [position]);

  return (
    <span
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && createPortal(
        <span
          style={{ top: coords.top, left: coords.left, width: 320 }}
          className="fixed z-[9999] px-3 py-2 text-sm text-text-primary bg-bg-raised border border-border-line rounded-lg shadow-lg whitespace-normal pointer-events-none leading-relaxed"
        >
          {text}
        </span>,
        document.body
      )}
    </span>
  );
}
