import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorBanner from '../components/ErrorBanner';

const ROLE_HOME = { STUDENT: '/student', FACULTY: '/faculty', ADMIN: '/admin' };

export default function Login() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLocalError(null);
    try {
      const user = await login(email, password);
      navigate(ROLE_HOME[user.role] || '/');
    } catch (err) {
      setLocalError(err.message);
    }
  }

  function fillDemo(role) {
    const map = {
      ADMIN: 'admin@smartedu.local',
      FACULTY: 'faculty1@smartedu.local',
      STUDENT: 'student1@smartedu.local',
    };
    setEmail(map[role]);
    setPassword('Passw0rd!123');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="font-display text-2xl font-semibold text-white">SmartEdu Tracker</p>
          <p className="mt-1 text-sm text-ink-300">AI-powered academic early-warning system</p>
        </div>

        <div className="card p-6">
          <ErrorBanner message={localError || error} />
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@smartedu.local" />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-5 border-t border-ink-100 pt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-400">Quick demo login</p>
            <div className="flex gap-2">
              <button onClick={() => fillDemo('STUDENT')} className="btn-secondary flex-1 text-xs">Student</button>
              <button onClick={() => fillDemo('FACULTY')} className="btn-secondary flex-1 text-xs">Faculty</button>
              <button onClick={() => fillDemo('ADMIN')} className="btn-secondary flex-1 text-xs">Admin</button>
            </div>
            <p className="mt-2 text-xs text-ink-400">Fills the demo credentials from the seed data — password is the same for all.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
