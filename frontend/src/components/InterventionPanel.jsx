import { useState } from 'react';
import api, { apiErrorMessage } from '../services/api';
import HelpTip from './HelpTip';

const TYPES = ['ATTENDANCE_COUNSELLING', 'ACADEMIC_COUNSELLING', 'DOUBT_SESSION', 'ASSIGNMENT_REMINDER', 'STUDY_SUPPORT', 'FACULTY_FOLLOW_UP', 'OTHER'];

const OUTCOME_STYLE = {
  IMPROVED: 'text-risk-low',
  STABLE: 'text-ink-500',
  WORSENED: 'text-risk-high',
  PENDING_REVIEW: 'text-risk-medium',
};

export default function InterventionPanel({ studentId, interventions, hasRisk, onChanged }) {
  const [showForm, setShowForm] = useState(false);
  const [interventionType, setType] = useState(TYPES[0]);
  const [reason, setReason] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.post('/interventions', { studentId, interventionType, reason, actionTaken, followUpDate: followUpDate || undefined });
      setShowForm(false);
      setReason('');
      setActionTaken('');
      setFollowUpDate('');
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save intervention.'));
    } finally {
      setSaving(false);
    }
  }

  async function closeFollowUp(interventionId) {
    if (!window.confirm('Recalculate this student\'s risk now and close the follow-up? This uses their current academic data.')) return;
    setSaving(true);
    setError(null);
    try {
      await api.put(`/interventions/${interventionId}`, { closeFollowUp: true, status: 'COMPLETED' });
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not close follow-up.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-ink-900">
          Interventions
          <HelpTip text="An action taken by faculty to support a student who may be at academic risk — recorded with a type, reason, status and follow-up." />
        </h3>
        <button onClick={() => setShowForm((v) => !v)} disabled={!hasRisk} className="btn-secondary text-xs">
          {showForm ? 'Cancel' : 'Record Intervention'}
        </button>
      </div>
      {!hasRisk && <p className="mt-2 text-xs text-ink-400">Calculate risk before recording an intervention.</p>}
      {error && <p className="mt-2 text-sm text-risk-high">{error}</p>}

      {showForm && (
        <form onSubmit={submit} className="mt-4 space-y-3 rounded-md border border-ink-100 p-4">
          <div>
            <label className="label">Intervention Type</label>
            <select className="input" value={interventionType} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((t) => (
                <option key={t} value={t}>{t.replaceAll('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Reason</label>
            <textarea className="input" required rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <div>
            <label className="label">Action Taken (optional)</label>
            <textarea className="input" rows={2} value={actionTaken} onChange={(e) => setActionTaken(e.target.value)} />
          </div>
          <div>
            <label className="label">Follow-up Date (optional)</label>
            <input type="date" className="input" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Saving…' : 'Save Intervention'}</button>
        </form>
      )}

      <div className="mt-4 space-y-3">
        {(!interventions || interventions.length === 0) && <p className="text-sm text-ink-400">No interventions recorded yet.</p>}
        {interventions?.map((iv) => (
          <div key={iv._id} className="rounded-md border border-ink-100 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-ink-900">{iv.interventionType.replaceAll('_', ' ')}</p>
              <span className="text-xs text-ink-400">{iv.status}</span>
            </div>
            <p className="mt-1 text-sm text-ink-600">{iv.reason}</p>
            {iv.actionTaken && <p className="mt-1 text-xs text-ink-500">Action: {iv.actionTaken}</p>}
            <div className="mt-2 flex items-center justify-between text-xs">
              <span>
                Previous risk: <strong>{iv.previousRiskScore}</strong>
                {iv.newRiskScore !== null && iv.newRiskScore !== undefined && (
                  <> → New risk: <strong>{iv.newRiskScore}</strong></>
                )}
              </span>
              <span className={`font-semibold ${OUTCOME_STYLE[iv.outcome]}`}>{iv.outcome.replaceAll('_', ' ')}</span>
            </div>
            {iv.status === 'PENDING' && (
              <button onClick={() => closeFollowUp(iv._id)} disabled={saving} className="btn-secondary mt-3 text-xs">
                Recalculate risk & close follow-up
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
