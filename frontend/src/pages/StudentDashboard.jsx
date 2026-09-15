import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api, { apiErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import RiskCard from '../components/RiskCard';
import MetricCard from '../components/MetricCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';
import TrendChart from '../components/TrendChart';
import AIExplanationPanel from '../components/AIExplanationPanel';
import SimulatorPanel from '../components/SimulatorPanel';

const QUICK_ACTIONS = [
  { to: '/student/academics', label: 'View Performance' },
  { to: '#risk', label: 'View Risk' },
  { to: '#recommendations', label: 'View Recommendations' },
  { to: '#simulator', label: 'Run What-if Simulation' },
];

export default function StudentDashboard() {
  const { profile } = useAuth();
  const [risk, setRisk] = useState(null);
  const [history, setHistory] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!profile?._id) return;
    setLoading(true);
    setError(null);
    try {
      const [studentRes, historyRes, notificationsRes] = await Promise.all([
        api.get(`/students/${profile._id}`),
        api.get(`/risk/history/${profile._id}`),
        api.get('/notifications'),
      ]);
      setRisk(studentRes.data.data.currentRisk);
      setMetrics(studentRes.data.data.metrics);
      setHistory(historyRes.data.data.history);
      setRecentNotifications(notificationsRes.data.data.notifications.slice(0, 3));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load your dashboard.'));
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingSpinner label="Loading your dashboard…" />;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900">Welcome, {profile?.fullName}</h1>
        <p className="text-sm text-ink-500">
          {profile?.course} · Semester {profile?.semester} {profile?.section ? `· ${profile.section}` : ''}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((a) => (
          <a key={a.label} href={a.to} className="rounded-full bg-ink-100 px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-200">
            {a.label}
          </a>
        ))}
      </div>

      <ErrorBanner message={error} />

      {!metrics?.isComplete && (
        <div className="rounded-md border border-risk-medium/30 bg-risk-mediumBg px-4 py-3 text-sm text-risk-medium">
          Insufficient academic data for a complete risk assessment yet. Missing: {metrics?.missing?.join(', ') || 'unknown'}.
          Ask your faculty to enter this data — your dashboard will fill in automatically once it's added.
        </div>
      )}

      {recentNotifications.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Recent Notifications</p>
            <Link to="/notifications" className="text-xs font-medium text-ink-700 hover:underline">View all →</Link>
          </div>
          <div className="mt-2 space-y-2">
            {recentNotifications.map((n) => (
              <div key={n._id} className="flex items-center gap-2 text-sm">
                {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-risk-high" />}
                <span className={!n.read ? 'font-medium text-ink-900' : 'text-ink-500'}>{n.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div id="risk">
        <RiskCard risk={risk} />
      </div>

      {risk && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <MetricCard label="Attendance" value={risk.attendancePercentage} suffix="%" tone={risk.attendancePercentage >= 75 ? 'good' : risk.attendancePercentage >= 60 ? 'warn' : 'bad'} />
          <MetricCard label="Academic Average" value={risk.academicAverage} suffix="%" tone={risk.academicAverage >= 60 ? 'good' : risk.academicAverage >= 40 ? 'warn' : 'bad'} />
          <MetricCard label="Assignment Completion" value={risk.assignmentCompletionPercentage} suffix="%" tone={risk.assignmentCompletionPercentage >= 75 ? 'good' : risk.assignmentCompletionPercentage >= 50 ? 'warn' : 'bad'} />
          <MetricCard label="Performance Trend" value={risk.trendStatus} />
        </div>
      )}

      {risk && (
        <div id="recommendations">
          <AIExplanationPanel studentId={profile._id} hasRisk={!!risk} />
        </div>
      )}

      <div className="card p-6">
        <h3 className="mb-4 font-semibold text-ink-900">Risk History</h3>
        <TrendChart data={history} />
      </div>

      <div id="simulator">
        <SimulatorPanel
          studentId={profile._id}
          initial={
            risk
              ? {
                  attendancePercentage: risk.attendancePercentage,
                  academicAverage: risk.academicAverage,
                  assignmentCompletionPercentage: risk.assignmentCompletionPercentage,
                  trendDelta: risk.trendDelta,
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
