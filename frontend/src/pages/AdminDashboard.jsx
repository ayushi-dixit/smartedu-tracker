import { useEffect, useState } from 'react';
import api, { apiErrorMessage } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';
import MetricCard from '../components/MetricCard';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = { LOW: '#1E8A5F', MEDIUM: '#B8860B', HIGH: '#C0392B', unassessed: '#a2b0d6' };

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get('/admin/stats')
      .then((res) => setStats(res.data.data))
      .catch((err) => setError(apiErrorMessage(err, 'Could not load statistics.')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner label="Loading system statistics…" />;

  const pieData = stats
    ? [
        { name: 'Low', value: stats.riskDistribution.low, color: COLORS.LOW },
        { name: 'Medium', value: stats.riskDistribution.medium, color: COLORS.MEDIUM },
        { name: 'High', value: stats.riskDistribution.high, color: COLORS.HIGH },
        { name: 'Not yet assessed', value: stats.riskDistribution.unassessed, color: COLORS.unassessed },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900">Admin Overview</h1>
        <p className="text-sm text-ink-500">System-wide statistics</p>
      </div>

      <ErrorBanner message={error} />

      {stats && (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <MetricCard label="Total Students" value={stats.totalStudents} />
            <MetricCard label="Total Faculty" value={stats.totalFaculty} />
            <MetricCard label="Total Subjects" value={stats.totalSubjects} />
            <MetricCard label="Interventions Completed" value={stats.interventionsCompleted} />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="card p-6">
              <h3 className="mb-4 font-semibold text-ink-900">Risk Distribution</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-6">
              <h3 className="mb-4 font-semibold text-ink-900">Intervention Outcomes</h3>
              <ul className="space-y-2 text-sm">
                {stats.interventionOutcomes.map((o) => (
                  <li key={o._id} className="flex items-center justify-between border-b border-ink-50 py-2">
                    <span className="text-ink-600">{o._id?.replaceAll('_', ' ') || 'Unknown'}</span>
                    <span className="font-semibold text-ink-900">{o.count}</span>
                  </li>
                ))}
                {stats.interventionOutcomes.length === 0 && <p className="text-ink-400">No interventions recorded yet.</p>}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
