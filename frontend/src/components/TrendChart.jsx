import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * Generic risk-score-over-time line chart.
 * data: array of { createdAt, totalRiskScore } (oldest -> newest).
 */
export default function TrendChart({ data, dataKey = 'totalRiskScore', label = 'Risk Score' }) {
  if (!data || data.length === 0) {
    return <p className="py-8 text-center text-sm text-ink-400">No history yet — calculate risk at least twice to see a trend.</p>;
  }

  const formatted = data.map((d) => ({
    date: new Date(d.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    value: d[dataKey],
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={formatted} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e6eaf5" />
        <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#54619f' }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#54619f' }} />
        <Tooltip formatter={(value) => [value, label]} />
        <Line type="monotone" dataKey="value" stroke="#333c68" strokeWidth={2} dot={{ r: 3 }} name={label} />
      </LineChart>
    </ResponsiveContainer>
  );
}
