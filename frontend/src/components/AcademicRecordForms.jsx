import { useEffect, useState } from 'react';
import api, { apiErrorMessage } from '../services/api';

const ASSESSMENT_TYPES = ['INTERNAL_1', 'INTERNAL_2', 'INTERNAL_3', 'QUIZ', 'MID_TERM', 'PRACTICAL'];
const ASSIGNMENT_STATUSES = ['SUBMITTED_ON_TIME', 'SUBMITTED_LATE', 'NOT_SUBMITTED'];

/** Compact tabbed forms so faculty can add attendance/assessment/assignment records for a student, then recalculate risk. */
export default function AcademicRecordForms({ studentId, onSaved }) {
  const [tab, setTab] = useState('attendance');
  const [subjects, setSubjects] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    api.get('/subjects').then((res) => setSubjects(res.data.data.subjects)).catch(() => {});
  }, []);

  const [attendance, setAttendance] = useState({ subjectId: '', totalClasses: 20, attendedClasses: 15 });
  const [assessment, setAssessment] = useState({ subjectId: '', assessmentType: 'INTERNAL_1', marksObtained: 30, maxMarks: 50 });
  const [assignment, setAssignment] = useState({ subjectId: '', assignmentTitle: '', maxScore: 10, status: 'SUBMITTED_ON_TIME', dueDate: '' });

  async function submitAttendance(e) {
    e.preventDefault();
    setSaving(true); setError(null); setSuccess(null);
    try {
      await api.post('/attendance', { studentId, ...attendance });
      setSuccess('Attendance recorded.');
      onSaved();
    } catch (err) { setError(apiErrorMessage(err)); } finally { setSaving(false); }
  }

  async function submitAssessment(e) {
    e.preventDefault();
    setSaving(true); setError(null); setSuccess(null);
    try {
      await api.post('/assessments', { studentId, ...assessment });
      setSuccess('Assessment recorded.');
      onSaved();
    } catch (err) { setError(apiErrorMessage(err)); } finally { setSaving(false); }
  }

  async function submitAssignment(e) {
    e.preventDefault();
    setSaving(true); setError(null); setSuccess(null);
    try {
      await api.post('/assignments', { studentId, ...assignment });
      setSuccess('Assignment recorded.');
      onSaved();
    } catch (err) { setError(apiErrorMessage(err)); } finally { setSaving(false); }
  }

  return (
    <div className="card p-6">
      <h3 className="font-semibold text-ink-900">Add Academic Data</h3>
      <div className="mt-3 flex gap-2">
        {['attendance', 'assessment', 'assignment'].map((t) => (
          <button key={t} onClick={() => { setTab(t); setError(null); setSuccess(null); }} className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${tab === t ? 'bg-ink-800 text-white' : 'bg-ink-100 text-ink-600'}`}>
            {t}
          </button>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-risk-high">{error}</p>}
      {success && <p className="mt-3 text-sm text-risk-low">{success} Remember to recalculate risk to see the effect.</p>}

      {tab === 'attendance' && (
        <form onSubmit={submitAttendance} className="mt-4 grid grid-cols-2 gap-3">
          <select required className="input col-span-2" value={attendance.subjectId} onChange={(e) => setAttendance({ ...attendance, subjectId: e.target.value })}>
            <option value="">Select subject…</option>
            {subjects.map((s) => <option key={s._id} value={s._id}>{s.subjectCode} — {s.subjectName}</option>)}
          </select>
          <div><label className="label">Total Classes</label><input type="number" min="1" required className="input" value={attendance.totalClasses} onChange={(e) => setAttendance({ ...attendance, totalClasses: e.target.value })} /></div>
          <div><label className="label">Attended Classes</label><input type="number" min="0" required className="input" value={attendance.attendedClasses} onChange={(e) => setAttendance({ ...attendance, attendedClasses: e.target.value })} /></div>
          <button type="submit" disabled={saving} className="btn-primary col-span-2">{saving ? 'Saving…' : 'Add Attendance'}</button>
        </form>
      )}

      {tab === 'assessment' && (
        <form onSubmit={submitAssessment} className="mt-4 grid grid-cols-2 gap-3">
          <select required className="input col-span-2" value={assessment.subjectId} onChange={(e) => setAssessment({ ...assessment, subjectId: e.target.value })}>
            <option value="">Select subject…</option>
            {subjects.map((s) => <option key={s._id} value={s._id}>{s.subjectCode} — {s.subjectName}</option>)}
          </select>
          <select className="input col-span-2" value={assessment.assessmentType} onChange={(e) => setAssessment({ ...assessment, assessmentType: e.target.value })}>
            {ASSESSMENT_TYPES.map((t) => <option key={t} value={t}>{t.replaceAll('_', ' ')}</option>)}
          </select>
          <div><label className="label">Marks Obtained</label><input type="number" min="0" required className="input" value={assessment.marksObtained} onChange={(e) => setAssessment({ ...assessment, marksObtained: e.target.value })} /></div>
          <div><label className="label">Max Marks</label><input type="number" min="1" required className="input" value={assessment.maxMarks} onChange={(e) => setAssessment({ ...assessment, maxMarks: e.target.value })} /></div>
          <button type="submit" disabled={saving} className="btn-primary col-span-2">{saving ? 'Saving…' : 'Add Assessment'}</button>
        </form>
      )}

      {tab === 'assignment' && (
        <form onSubmit={submitAssignment} className="mt-4 grid grid-cols-2 gap-3">
          <select required className="input col-span-2" value={assignment.subjectId} onChange={(e) => setAssignment({ ...assignment, subjectId: e.target.value })}>
            <option value="">Select subject…</option>
            {subjects.map((s) => <option key={s._id} value={s._id}>{s.subjectCode} — {s.subjectName}</option>)}
          </select>
          <input required placeholder="Assignment title" className="input col-span-2" value={assignment.assignmentTitle} onChange={(e) => setAssignment({ ...assignment, assignmentTitle: e.target.value })} />
          <div><label className="label">Max Score</label><input type="number" min="1" required className="input" value={assignment.maxScore} onChange={(e) => setAssignment({ ...assignment, maxScore: e.target.value })} /></div>
          <div><label className="label">Status</label>
            <select className="input" value={assignment.status} onChange={(e) => setAssignment({ ...assignment, status: e.target.value })}>
              {ASSIGNMENT_STATUSES.map((s) => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}
            </select>
          </div>
          <div className="col-span-2"><label className="label">Due Date</label><input type="date" required className="input" value={assignment.dueDate} onChange={(e) => setAssignment({ ...assignment, dueDate: e.target.value })} /></div>
          <button type="submit" disabled={saving} className="btn-primary col-span-2">{saving ? 'Saving…' : 'Add Assignment'}</button>
        </form>
      )}
    </div>
  );
}
