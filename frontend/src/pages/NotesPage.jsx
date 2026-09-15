import { useEffect, useState } from 'react';
import api, { apiErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';
import EmptyState from '../components/EmptyState';

export default function NotesPage() {
  const { user } = useAuth();
  const isFaculty = user?.role === 'FACULTY';
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', studentId: '' });
  const [students, setStudents] = useState([]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/notes');
      setNotes(res.data.data.notes);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    if (isFaculty) {
      api.get('/students').then((res) => setStudents(res.data.data.students)).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = { title: form.title, content: form.content };
      if (isFaculty) payload.studentId = form.studentId;
      await api.post('/notes', payload);
      setForm({ title: '', content: '', studentId: '' });
      setShowForm(false);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function togglePin(note) {
    try {
      await api.put(`/notes/${note._id}`, { pinned: !note.pinned });
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this note? This cannot be undone.')) return;
    try {
      await api.delete(`/notes/${id}`);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  if (loading) return <LoadingSpinner label="Loading notes…" />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">{isFaculty ? 'Faculty Notes' : 'My Notes'}</h1>
          <p className="text-sm text-ink-500">{isFaculty ? 'Private notes about your assigned students.' : 'Personal study notes and reminders — visible only to you.'}</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary">{showForm ? 'Cancel' : 'New Note'}</button>
      </div>

      <ErrorBanner message={error} />

      {showForm && (
        <form onSubmit={handleCreate} className="card space-y-3 p-6">
          {isFaculty && (
            <select required className="input" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}>
              <option value="">Select student…</option>
              {students.map((s) => <option key={s._id} value={s._id}>{s.fullName} ({s.studentId})</option>)}
            </select>
          )}
          <input placeholder="Title (optional)" className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea required rows={4} placeholder="Write your note…" className="input" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Saving…' : 'Save Note'}</button>
        </form>
      )}

      {notes.length === 0 ? (
        <EmptyState title="No notes yet" description={isFaculty ? 'Notes you write about a student will appear here.' : 'Jot down a study reminder to get started.'} />
      ) : (
        <div className="space-y-3">
          {notes.map((n) => (
            <div key={n._id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  {n.title && <p className="font-medium text-ink-900">{n.title}</p>}
                  <p className="mt-1 whitespace-pre-wrap text-sm text-ink-600">{n.content}</p>
                  <p className="mt-2 text-xs text-ink-400">{new Date(n.updatedAt).toLocaleString()}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => togglePin(n)} className="text-xs text-ink-400 hover:text-ink-700">{n.pinned ? 'Unpin' : 'Pin'}</button>
                  <button onClick={() => handleDelete(n._id)} className="text-xs text-risk-high hover:underline">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
