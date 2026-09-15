import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Navbar({ onMenuClick }) {
  const { user, profile, logout } = useAuth();
  const displayName = profile?.fullName || user?.email;
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/notifications')
      .then((res) => {
        if (!cancelled) setUnreadCount(res.data.data.unreadCount);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-ink-100 bg-white px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="rounded-md p-1.5 text-ink-500 hover:bg-ink-100 md:hidden" aria-label="Open menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <div>
          <p className="text-sm text-ink-500">Welcome back,</p>
          <p className="font-semibold text-ink-900">{displayName}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        <span className="hidden rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-700 sm:inline-block">{user?.role}</span>
        <Link to="/notifications" className="relative rounded-md p-2 text-ink-500 hover:bg-ink-100" aria-label="Notifications">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-risk-high px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
        <button onClick={logout} className="btn-secondary text-xs md:text-sm">Log out</button>
      </div>
    </header>
  );
}
