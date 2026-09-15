import { Link } from 'react-router-dom';
import RiskBadge from './RiskBadge';

export default function StudentTable({ students, basePath = '/faculty/students' }) {
  if (!students || students.length === 0) {
    return <p className="py-8 text-center text-sm text-ink-400">No students match the current filter.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-500">
            <th className="py-2 pr-4">Student</th>
            <th className="py-2 pr-4">Attendance</th>
            <th className="py-2 pr-4">Academic Avg</th>
            <th className="py-2 pr-4">Assignment %</th>
            <th className="py-2 pr-4">Trend</th>
            <th className="py-2 pr-4">Risk Score</th>
            <th className="py-2 pr-4">Risk Level</th>
            <th className="py-2 pr-4"></th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => {
            const r = s.currentRisk;
            return (
              <tr key={s._id} className="border-b border-ink-50 hover:bg-ink-50/60">
                <td className="py-2.5 pr-4">
                  <p className="font-medium text-ink-900">{s.fullName}</p>
                  <p className="text-xs text-ink-400">{s.studentId}</p>
                </td>
                <td className="py-2.5 pr-4">{r ? `${r.attendancePercentage}%` : '—'}</td>
                <td className="py-2.5 pr-4">{r ? `${r.academicAverage}%` : '—'}</td>
                <td className="py-2.5 pr-4">{r ? `${r.assignmentCompletionPercentage}%` : '—'}</td>
                <td className="py-2.5 pr-4">{r ? r.trendStatus : '—'}</td>
                <td className="py-2.5 pr-4">{r ? r.totalRiskScore : '—'}</td>
                <td className="py-2.5 pr-4"><RiskBadge level={r?.riskLevel} /></td>
                <td className="py-2.5 pr-4">
                  <Link to={`${basePath}/${s._id}`} className="text-sm font-medium text-ink-700 hover:underline">
                    View →
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
