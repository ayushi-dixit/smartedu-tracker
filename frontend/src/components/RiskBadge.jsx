const STYLES = {
  LOW: 'bg-risk-lowBg text-risk-low border-risk-low/30',
  MEDIUM: 'bg-risk-mediumBg text-risk-medium border-risk-medium/30',
  HIGH: 'bg-risk-highBg text-risk-high border-risk-high/30',
};

/** Risk levels are never conveyed by color alone — the text label is always shown. */
export default function RiskBadge({ level, size = 'md' }) {
  if (!level) {
    return <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold bg-ink-100 text-ink-500 border-ink-200">NO DATA</span>;
  }
  const padding = size === 'lg' ? 'px-4 py-1.5 text-sm' : 'px-2.5 py-1 text-xs';
  return (
    <span className={`inline-flex items-center rounded-full border font-semibold ${padding} ${STYLES[level] || ''}`}>
      {level} RISK
    </span>
  );
}
