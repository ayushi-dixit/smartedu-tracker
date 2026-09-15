import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { apiErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';
import EmptyState from '../components/EmptyState';

const TYPE_LABEL = {
  RISK_LEVEL_CHANGED: 'Risk Update',
  STUDENT_HIGH_RISK_ALERT: 'High Risk Alert',
  INTERVENTION_CREATED: 'Intervention',
  INTERVENTION_UPDATED: 'Intervention Update',
  FOLLOW_UP_DUE: 'Follow-up Due',
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const canViewStudentLink = user?.role === 'FACULTY' || user?.role === 'ADMIN';
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data.notifications);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead(id) {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function markAllRead() {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  if (loading) return <LoadingSpinner label="Loading notifications…" />;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">Notifications</h1>
          <p className="text-sm text-ink-500">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && <button onClick={markAllRead} className="btn-secondary text-xs">Mark all as read</button>}
      </div>

      <ErrorBanner message={error} />

      {notifications.length === 0 ? (
        <EmptyState title="No notifications yet" description="You'll see updates here when your risk level changes or faculty record an action." />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n._id} className={`card flex items-start justify-between gap-3 p-4 ${!n.read ? 'border-l-4 border-l-ink-700' : ''}`}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-600">
                    {TYPE_LABEL[n.type] || n.type}
                  </span>
                  {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-risk-high" />}
                </div>
                <p className="mt-1 text-sm font-medium text-ink-900">{n.title}</p>
                <p className="text-sm text-ink-600">{n.message}</p>
                <p className="mt-1 text-xs text-ink-400">{new Date(n.createdAt).toLocaleString()}</p>
                {n.relatedStudentId && canViewStudentLink && (
                  <Link to={`/faculty/students/${n.relatedStudentId}`} className="mt-1 inline-block text-xs font-medium text-ink-700 hover:underline">
                    View student →
                  </Link>
                )}
              </div>
              {!n.read && (
                <button onClick={() => markRead(n._id)} className="shrink-0 text-xs text-ink-400 hover:text-ink-700">Mark read</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
