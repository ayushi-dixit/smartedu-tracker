import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorBanner from '../components/ErrorBanner';

export default function Register() {
  const { registerStudent, loading, error } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ studentId: '', fullName: '', email: '', password: '', course: 'MCA', semester: 1, section: '' });
  const [localError, setLocalError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLocalError(null);
    try {
      await registerStudent(form);
      navigate('/student');
    } catch (err) {
      setLocalError(err.message);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-900 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="font-display text-2xl font-semibold text-white">Create a Student Account</p>
        </div>
        <div className="card p-6">
          <ErrorBanner message={localError || error} />
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
            <input required placeholder="Student ID" className="input col-span-2" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} />
            <input required placeholder="Full name" className="input col-span-2" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            <input required type="email" placeholder="Email" className="input col-span-2" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input required type="password" placeholder="Password (min 8 chars)" className="input col-span-2" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <input placeholder="Course" className="input" value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} />
            <input type="number" min="1" max="8" placeholder="Semester" className="input" value={form.semester} onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })} />
            <input placeholder="Section" className="input col-span-2" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} />
            <button type="submit" disabled={loading} className="btn-primary col-span-2">{loading ? 'Creating account…' : 'Create account'}</button>
          </form>
          <p className="mt-4 text-center text-sm text-ink-500">
            Already have an account? <Link to="/login" className="font-medium text-ink-800 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
