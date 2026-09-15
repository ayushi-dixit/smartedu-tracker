import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LINK_SETS = {
  STUDENT: [
    { to: '/student', label: 'My Dashboard' },
    { to: '/student/academics', label: 'Academic Performance' },
    { to: '/notes', label: 'My Notes' },
    { to: '/notifications', label: 'Notifications' },
  ],
  FACULTY: [
    { to: '/faculty', label: 'Dashboard' },
    { to: '/faculty/import', label: 'CSV Import' },
    { to: '/notes', label: 'Faculty Notes' },
    { to: '/notifications', label: 'Notifications' },
  ],
  ADMIN: [
    { to: '/admin', label: 'Overview' },
    { to: '/admin/students', label: 'Students' },
    { to: '/admin/faculty', label: 'Faculty' },
    { to: '/admin/subjects', label: 'Subjects' },
    { to: '/notifications', label: 'Notifications' },
  ],
};

const COMMON_LINKS = [
  { to: '/profile', label: 'Profile' },
  { to: '/settings', label: 'Settings' },
  { to: '/help', label: 'Help & Tutorial' },
];

export default function Sidebar({ mobileOpen, onClose }) {
  const { user } = useAuth();
  const links = LINK_SETS[user?.role] || [];

  const content = (
    <>
      <div className="flex h-16 items-center gap-2 px-6">
        <div className="h-2.5 w-2.5 rounded-full bg-risk-low" />
        <span className="font-display text-lg font-semibold text-white">SmartEdu</span>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={['/student', '/faculty', '/admin'].includes(link.to)}
            onClick={onClose}
            className={({ isActive }) =>
              `mb-1 block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? 'bg-ink-700 text-white' : 'text-ink-300 hover:bg-ink-800 hover:text-white'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
        <div className="my-3 border-t border-ink-800" />
        {COMMON_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onClose}
            className={({ isActive }) =>
              `mb-1 block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? 'bg-ink-700 text-white' : 'text-ink-300 hover:bg-ink-800 hover:text-white'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-6 py-4 text-xs text-ink-400">Academic early-warning system</div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-ink-100 bg-ink-900 text-ink-100">
        {content}
      </aside>

      {/* Mobile off-canvas sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-ink-950/50" onClick={onClose} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-ink-900 text-ink-100 shadow-xl">{content}</aside>
        </div>
      )}
    </>
  );
}
