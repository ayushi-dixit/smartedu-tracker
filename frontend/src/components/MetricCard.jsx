export default function MetricCard({ label, value, suffix = '', tone = 'default', hint }) {
  const toneClass =
    tone === 'good' ? 'text-risk-low' : tone === 'warn' ? 'text-risk-medium' : tone === 'bad' ? 'text-risk-high' : 'text-ink-900';
  return (
    <div className="card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${toneClass}`}>
        {value === null || value === undefined ? '—' : value}
        {value !== null && value !== undefined ? suffix : ''}
      </p>
      {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
    </div>
  );
}
