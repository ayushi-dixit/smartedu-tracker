import { useState } from 'react';
import api, { apiErrorMessage } from '../services/api';
import RiskBadge from './RiskBadge';
import HelpTip from './HelpTip';

function diffLabel(value) {
  if (value === undefined || value === null) return '—';
  if (value > 0) return `+${value}`;
  return `${value}`;
}
function diffTone(value, higherIsWorse = false) {
  if (!value) return 'text-ink-500';
  const isImprovement = higherIsWorse ? value < 0 : value > 0;
  return isImprovement ? 'text-risk-low' : 'text-risk-high';
}

/**
 * What-if simulator. Sends raw hypothetical inputs to POST /api/simulator/risk.
 * Never mutates real student data — server-side guarantee, this UI just displays results.
 * Pre-fills from the student's ACTUAL current values (passed in as `initial`) —
 * arbitrary defaults are only ever shown when no real data exists yet.
 */
export default function SimulatorPanel({ studentId, initial }) {
  const hasRealData = !!initial;
  const [attendancePercentage, setAttendance] = useState(initial?.attendancePercentage ?? 70);
  const [academicAverage, setAcademic] = useState(initial?.academicAverage ?? 60);
  const [assignmentCompletionPercentage, setAssignment] = useState(initial?.assignmentCompletionPercentage ?? 70);
  const [trendDelta, setTrendDelta] = useState(initial?.trendDelta ?? 0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function resetToCurrent() {
    if (!initial) return;
    setAttendance(initial.attendancePercentage);
    setAcademic(initial.academicAverage);
    setAssignment(initial.assignmentCompletionPercentage);
    setTrendDelta(initial.trendDelta);
  }

  async function runSimulation(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/simulator/risk', {
        studentId,
        attendancePercentage: Number(attendancePercentage),
        academicAverage: Number(academicAverage),
        assignmentCompletionPercentage: Number(assignmentCompletionPercentage),
        trendDelta: Number(trendDelta),
      });
      setResult(res.data.data);
    } catch (err) {
      setError(apiErrorMessage(err, 'Simulation failed.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-ink-900">
          What-if Simulator
          <HelpTip text="Explore hypothetical academic improvements without changing your actual records." />
        </h3>
        {hasRealData && <button type="button" onClick={resetToCurrent} className="text-xs text-ink-500 hover:underline">Reset to current values</button>}
      </div>
      <p className="mt-1 text-xs text-ink-500">
        {hasRealData
          ? "Pre-filled with this student's actual current numbers. Adjust any field to see the effect."
          : 'No calculated risk yet for this student, so the fields below start at neutral defaults rather than real data.'}
      </p>

      <form onSubmit={runSimulation} className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <label className="label">Attendance %</label>
          <input type="number" min="0" max="100" step="0.1" className="input" value={attendancePercentage} onChange={(e) => setAttendance(e.target.value)} />
        </div>
        <div>
          <label className="label">Academic Average %</label>
          <input type="number" min="0" max="100" step="0.1" className="input" value={academicAverage} onChange={(e) => setAcademic(e.target.value)} />
        </div>
        <div>
          <label className="label">Assignment Completion %</label>
          <input type="number" min="0" max="100" step="0.1" className="input" value={assignmentCompletionPercentage} onChange={(e) => setAssignment(e.target.value)} />
        </div>
        <div>
          <label className="label">Trend Delta (-25 to +25)</label>
          <input type="number" min="-25" max="25" step="0.1" className="input" value={trendDelta} onChange={(e) => setTrendDelta(e.target.value)} />
        </div>
        <div className="col-span-2">
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Simulating…' : 'Run simulation'}
          </button>
        </div>
      </form>

      {error && <p className="mt-3 text-sm text-risk-high">{error}</p>}

      {result && (
        <div className="mt-5 space-y-4 border-t border-ink-100 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Current</p>
              <p className="mt-1 text-xl font-semibold text-ink-900">{result.currentRiskScore ?? '—'}</p>
              <div className="mt-1"><RiskBadge level={result.currentRiskLevel} /></div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Simulated</p>
              <p className="mt-1 text-xl font-semibold text-ink-900">{result.simulatedRiskScore}</p>
              <div className="mt-1"><RiskBadge level={result.simulatedRiskLevel} /></div>
            </div>
          </div>

          {result.difference && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-500">Change vs. current</p>
              <table className="w-full text-left text-sm">
                <tbody>
                  <tr className="border-b border-ink-50">
                    <td className="py-1.5 text-ink-500">Risk Score</td>
                    <td className={`py-1.5 text-right font-semibold ${diffTone(result.difference.totalRiskScore, true)}`}>{diffLabel(result.difference.totalRiskScore)}</td>
                  </tr>
                  <tr className="border-b border-ink-50">
                    <td className="py-1.5 text-ink-500">Attendance %</td>
                    <td className={`py-1.5 text-right font-semibold ${diffTone(result.difference.attendancePercentage)}`}>{diffLabel(result.difference.attendancePercentage)}</td>
                  </tr>
                  <tr className="border-b border-ink-50">
                    <td className="py-1.5 text-ink-500">Academic Average %</td>
                    <td className={`py-1.5 text-right font-semibold ${diffTone(result.difference.academicAverage)}`}>{diffLabel(result.difference.academicAverage)}</td>
                  </tr>
                  <tr className="border-b border-ink-50">
                    <td className="py-1.5 text-ink-500">Assignment Completion %</td>
                    <td className={`py-1.5 text-right font-semibold ${diffTone(result.difference.assignmentCompletionPercentage)}`}>{diffLabel(result.difference.assignmentCompletionPercentage)}</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 text-ink-500">Trend Delta</td>
                    <td className={`py-1.5 text-right font-semibold ${diffTone(result.difference.trendDelta)}`}>{diffLabel(result.difference.trendDelta)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <p className="rounded-md bg-ink-50 px-3 py-2 text-xs italic text-ink-500">{result.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
