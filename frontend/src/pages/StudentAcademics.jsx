import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { apiErrorMessage } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';
import EmptyState from '../components/EmptyState';
import TrendChart from '../components/TrendChart';

export default function StudentAcademics() {
  const { profile } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!profile?._id) return;
    setLoading(true);
    setError(null);
    Promise.all([
      api.get(`/attendance/student/${profile._id}`),
      api.get(`/assessments/student/${profile._id}`),
      api.get(`/assignments/student/${profile._id}`),
      api.get(`/risk/history/${profile._id}`),
    ])
      .then(([a, s, asg, h]) => {
        setAttendance(a.data.data.attendance);
        setAssessments(s.data.data.assessments);
        setAssignments(asg.data.data.assignments);
        setHistory(h.data.data.history);
      })
      .catch((err) => setError(apiErrorMessage(err, 'Could not load academic data.')))
      .finally(() => setLoading(false));
  }, [profile]);

  if (loading) return <LoadingSpinner label="Loading your academic performance…" />;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900">Academic Performance</h1>
        <p className="text-sm text-ink-500">Your marks, attendance, assignments and risk history</p>
      </div>

      <ErrorBanner message={error} />

      <div className="card p-6">
        <h3 className="mb-4 font-semibold text-ink-900">Risk History</h3>
        <TrendChart data={history} />
      </div>

      <div className="card p-6">
        <h3 className="mb-3 font-semibold text-ink-900">Attendance Records</h3>
        {attendance.length === 0 ? (
          <EmptyState title="No attendance recorded yet" />
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-500">
                <th className="py-2 pr-4">Subject</th>
                <th className="py-2 pr-4">Attended / Total</th>
                <th className="py-2 pr-4">%</th>
                <th className="py-2 pr-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((a) => (
                <tr key={a._id} className="border-b border-ink-50">
                  <td className="py-2 pr-4">{a.subjectId?.subjectCode || '—'}</td>
                  <td className="py-2 pr-4">{a.attendedClasses} / {a.totalClasses}</td>
                  <td className="py-2 pr-4">{a.attendancePercentage}%</td>
                  <td className="py-2 pr-4">{new Date(a.recordDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card p-6">
        <h3 className="mb-3 font-semibold text-ink-900">Assessments</h3>
        {assessments.length === 0 ? (
          <EmptyState title="No assessments recorded yet" />
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-500">
                <th className="py-2 pr-4">Subject</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Marks</th>
                <th className="py-2 pr-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((a) => (
                <tr key={a._id} className="border-b border-ink-50">
                  <td className="py-2 pr-4">{a.subjectId?.subjectCode || '—'}</td>
                  <td className="py-2 pr-4">{a.assessmentType.replaceAll('_', ' ')}</td>
                  <td className="py-2 pr-4">{a.marksObtained} / {a.maxMarks}</td>
                  <td className="py-2 pr-4">{new Date(a.assessmentDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card p-6">
        <h3 className="mb-3 font-semibold text-ink-900">Assignments</h3>
        {assignments.length === 0 ? (
          <EmptyState title="No assignments recorded yet" />
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-500">
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">Subject</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Score</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a._id} className="border-b border-ink-50">
                  <td className="py-2 pr-4">{a.assignmentTitle}</td>
                  <td className="py-2 pr-4">{a.subjectId?.subjectCode || '—'}</td>
                  <td className="py-2 pr-4">{a.status.replaceAll('_', ' ')}</td>
                  <td className="py-2 pr-4">{a.obtainedScore ?? '—'} / {a.maxScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
