import { useEffect, useState } from 'react';
import api, { apiErrorMessage } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';

export default function SubjectManagement() {
  const [subjects, setSubjects] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ subjectCode: '', subjectName: '', semester: 1, credits: 3, facultyId: '' });

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [subjectsRes, facultyRes] = await Promise.all([api.get('/subjects'), api.get('/faculty')]);
      setSubjects(subjectsRes.data.data.subjects);
      setFaculty(facultyRes.data.data.faculty);
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
      await api.post('/subjects', { ...form, facultyId: form.facultyId || undefined });
      setShowForm(false);
      setForm({ subjectCode: '', subjectName: '', semester: 1, credits: 3, facultyId: '' });
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleAssign(subjectId, facultyId) {
    setError(null);
    try {
      await api.put(`/subjects/${subjectId}`, { facultyId: facultyId || null });
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  if (loading) return <LoadingSpinner label="Loading subjects…" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">Subject Management</h1>
          <p className="text-sm text-ink-500">{subjects.length} subjects</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary">{showForm ? 'Cancel' : 'Add Subject'}</button>
      </div>

      <ErrorBanner message={error} />

      {showForm && (
        <form onSubmit={handleCreate} className="card grid grid-cols-2 gap-3 p-6">
          <input required placeholder="Subject Code (e.g. MCA303)" className="input" value={form.subjectCode} onChange={(e) => setForm({ ...form, subjectCode: e.target.value })} />
          <input required placeholder="Subject Name" className="input" value={form.subjectName} onChange={(e) => setForm({ ...form, subjectName: e.target.value })} />
          <input required type="number" min="1" max="8" placeholder="Semester" className="input" value={form.semester} onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })} />
          <input required type="number" min="1" max="10" placeholder="Credits" className="input" value={form.credits} onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })} />
          <select className="input col-span-2" value={form.facultyId} onChange={(e) => setForm({ ...form, facultyId: e.target.value })}>
            <option value="">Unassigned</option>
            {faculty.map((f) => <option key={f._id} value={f._id}>{f.fullName}</option>)}
          </select>
          <button type="submit" disabled={saving} className="btn-primary col-span-2">{saving ? 'Saving…' : 'Create Subject'}</button>
        </form>
      )}

      <div className="card overflow-x-auto p-6">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-500">
              <th className="py-2 pr-4">Code</th>
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Sem</th>
              <th className="py-2 pr-4">Credits</th>
              <th className="py-2 pr-4">Faculty</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((s) => (
              <tr key={s._id} className="border-b border-ink-50">
                <td className="py-2.5 pr-4 font-medium text-ink-900">{s.subjectCode}</td>
                <td className="py-2.5 pr-4">{s.subjectName}</td>
                <td className="py-2.5 pr-4">{s.semester}</td>
                <td className="py-2.5 pr-4">{s.credits}</td>
                <td className="py-2.5 pr-4">
                  <select className="input py-1 text-xs" value={s.facultyId?._id || s.facultyId || ''} onChange={(e) => handleAssign(s._id, e.target.value)}>
                    <option value="">Unassigned</option>
                    {faculty.map((f) => <option key={f._id} value={f._id}>{f.fullName}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
