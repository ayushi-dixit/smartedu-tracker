import { useEffect, useState } from 'react';
import api, { apiErrorMessage } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';

export default function FacultyManagement() {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ facultyId: '', fullName: '', email: '', password: '', department: 'MCA' });

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/faculty');
      setFaculty(res.data.data.faculty);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.post('/faculty', form);
      setShowForm(false);
      setForm({ facultyId: '', fullName: '', email: '', password: '', department: 'MCA' });
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner label="Loading faculty…" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">Faculty Management</h1>
          <p className="text-sm text-ink-500">{faculty.length} faculty members</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary">{showForm ? 'Cancel' : 'Add Faculty'}</button>
      </div>

      <ErrorBanner message={error} />

      {showForm && (
        <form onSubmit={handleCreate} className="card grid grid-cols-2 gap-3 p-6">
          <input required placeholder="Faculty ID (e.g. FAC011)" className="input" value={form.facultyId} onChange={(e) => setForm({ ...form, facultyId: e.target.value })} />
          <input required placeholder="Full name" className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <input required type="email" placeholder="Email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input required type="password" placeholder="Temporary password (min 8 chars)" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <input placeholder="Department" className="input col-span-2" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          <button type="submit" disabled={saving} className="btn-primary col-span-2">{saving ? 'Saving…' : 'Create Faculty Account'}</button>
        </form>
      )}

      <div className="card overflow-x-auto p-6">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-500">
              <th className="py-2 pr-4">Faculty</th>
              <th className="py-2 pr-4">Department</th>
              <th className="py-2 pr-4">Assigned Subjects</th>
              <th className="py-2 pr-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {faculty.map((f) => (
              <tr key={f._id} className="border-b border-ink-50">
                <td className="py-2.5 pr-4">
                  <p className="font-medium text-ink-900">{f.fullName}</p>
                  <p className="text-xs text-ink-400">{f.facultyId} · {f.email}</p>
                </td>
                <td className="py-2.5 pr-4">{f.department}</td>
                <td className="py-2.5 pr-4">{f.assignedSubjectIds?.length || 0}</td>
                <td className="py-2.5 pr-4">{f.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
