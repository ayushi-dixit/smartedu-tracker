import { useState } from 'react';

/** Small "?" contextual-help indicator. Click/tap to toggle (works on touch, not just hover). */
export default function HelpTip({ text }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block align-middle">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-ink-100 text-[10px] font-bold text-ink-500 hover:bg-ink-200"
        aria-label="Help"
      >
        ?
      </button>
      {open && (
        <span className="absolute left-1/2 top-6 z-20 w-56 -translate-x-1/2 rounded-md border border-ink-100 bg-white p-2 text-xs font-normal normal-case text-ink-600 shadow-lg">
          {text}
        </span>
      )}
    </span>
  );
}
