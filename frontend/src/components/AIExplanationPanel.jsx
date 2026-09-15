import { useState } from 'react';
import api, { apiErrorMessage } from '../services/api';

export default function AIExplanationPanel({ studentId, hasRisk }) {
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState(null);
  const [unavailableReason, setUnavailableReason] = useState(null);
  const [error, setError] = useState(null);

  async function generate() {
    setLoading(true);
    setError(null);
    setUnavailableReason(null);
    try {
      const res = await api.post(`/ai/explanation/${studentId}`);
      const data = res.data.data;
      if (data.available) {
        setExplanation(data.explanation);
      } else {
        setUnavailableReason(data.reason);
      }
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not generate an explanation.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-ink-900">AI Explanation & Recommendations</h3>
        <button onClick={generate} disabled={!hasRisk || loading} className="btn-secondary text-xs">
          {loading ? 'Generating…' : explanation ? 'Regenerate' : 'Generate explanation'}
        </button>
      </div>

      {!hasRisk && <p className="mt-3 text-sm text-ink-400">Calculate risk first to enable an AI explanation.</p>}
      {error && <p className="mt-3 text-sm text-risk-high">{error}</p>}
      {unavailableReason && <p className="mt-3 text-sm text-risk-medium">{unavailableReason}</p>}

      {explanation && (
        <div className="mt-4 space-y-4">
          <p className="text-sm leading-relaxed text-ink-700">{explanation.summary}</p>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-500">Main reasons</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-ink-700">
              {explanation.mainReasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-500">Recommended actions</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-ink-700">
              {explanation.recommendations.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
