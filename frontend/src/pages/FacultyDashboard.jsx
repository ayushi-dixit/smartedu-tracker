import { useEffect, useState, useCallback } from 'react';
import api, { apiErrorMessage } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';
import MetricCard from '../components/MetricCard';
import StudentTable from '../components/StudentTable';

export default function FacultyDashboard() {
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [semesterFilter, setSemesterFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filter !== 'ALL') params.risk = filter;
      if (semesterFilter !== 'ALL') params.semester = semesterFilter;
      if (search) params.search = search;
      const res = await api.get('/students', { params });
      setStudents(res.data.data.students);
      setSummary(res.data.data.summary);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load your students.'));
    } finally {
      setLoading(false);
    }
  }, [filter, semesterFilter, search]);

  useEffect(() => {
    const t = setTimeout(load, 250); // light debounce for search
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900">Faculty Dashboard</h1>
        <p className="text-sm text-ink-500">Students assigned to you — all numbers below come from live data, not fixed values.</p>
      </div>

      <ErrorBanner message={error} />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <MetricCard label="Total Students" value={summary?.total ?? students.length} />
        <MetricCard label="Low Risk" value={summary?.low ?? 0} tone="good" />
        <MetricCard label="Medium Risk" value={summary?.medium ?? 0} tone="warn" />
        <MetricCard label="High Risk" value={summary?.high ?? 0} tone="bad" />
        <MetricCard label="Follow-ups Due" value={summary?.followUpsDue ?? 0} tone={summary?.followUpsDue ? 'warn' : 'default'} hint="Pending, due now or overdue" />
        <MetricCard label="Attendance Alerts" value={summary?.attendanceAlerts ?? 0} tone={summary?.attendanceAlerts ? 'bad' : 'default'} hint="Below 65% attendance" />
      </div>

      <div className="card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {['ALL', 'LOW', 'MEDIUM', 'HIGH'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${filter === f ? 'bg-ink-800 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'}`}
              >
                {f}
              </button>
            ))}
            <select className="input w-auto py-1 text-xs" value={semesterFilter} onChange={(e) => setSemesterFilter(e.target.value)}>
              <option value="ALL">All semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => <option key={s} value={s}>Semester {s}</option>)}
            </select>
          </div>
          <input
            className="input max-w-xs"
            placeholder="Search by name, ID or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? <LoadingSpinner label="Loading students…" /> : <StudentTable students={students} basePath="/faculty/students" />}
      </div>
    </div>
  );
}
