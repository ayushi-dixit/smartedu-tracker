import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { apiErrorMessage } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';
import RiskBadge from '../components/RiskBadge';

const EMPTY_FORM = {
  studentId: '', fullName: '', email: '', phone: '', password: '',
  course: 'MCA', semester: 1, section: '', enrollmentYear: new Date().getFullYear(),
  facultyIds: [],
  includeInitialData: false,
  attendancePct: '', internal1: '', internal2: '', assignmentsTotal: '', assignmentsSubmitted: '', previousSemesterAverage: '',
};

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [semesterFilter, setSemesterFilter] = useState('ALL');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search) params.search = search;
      if (riskFilter !== 'ALL') params.risk = riskFilter;
      if (semesterFilter !== 'ALL') params.semester = semesterFilter;
      const [studentsRes, facultyRes] = await Promise.all([api.get('/students', { params }), api.get('/faculty')]);
      setStudents(studentsRes.data.data.students);
      setFaculty(facultyRes.data.data.faculty);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, riskFilter, semesterFilter]);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        studentId: form.studentId, fullName: form.fullName, email: form.email, phone: form.phone, password: form.password,
        course: form.course, semester: form.semester, section: form.section, enrollmentYear: form.enrollmentYear,
        facultyIds: form.facultyIds,
      };
      if (form.includeInitialData) {
        Object.assign(payload, {
          attendancePct: form.attendancePct,
          internal1: form.internal1,
          internal2: form.internal2,
          assignmentsTotal: form.assignmentsTotal,
          assignmentsSubmitted: form.assignmentsSubmitted,
          previousSemesterAverage: form.previousSemesterAverage || null,
        });
      }
      await api.post('/students', payload);
      setShowForm(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not create student.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">Student Management</h1>
          <p className="text-sm text-ink-500">{students.length} students shown</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary">{showForm ? 'Cancel' : 'Add New Student'}</button>
      </div>

      <ErrorBanner message={error} />

      {showForm && (
        <form onSubmit={handleCreate} className="card space-y-6 p-6">
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">Personal Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <input required placeholder="Full name" className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              <input required placeholder="Student ID (e.g. S221)" className="input" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} />
              <input required type="email" placeholder="Email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input placeholder="Phone (optional)" className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <input required type="password" placeholder="Temporary password (min 8 chars)" className="input col-span-2" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">Academic Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Program" className="input" value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} />
              <input required type="number" min="1" max="8" placeholder="Semester" className="input" value={form.semester} onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })} />
              <input placeholder="Section" className="input" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} />
              <input type="number" placeholder="Enrollment Year" className="input" value={form.enrollmentYear} onChange={(e) => setForm({ ...form, enrollmentYear: Number(e.target.value) })} />
              <select multiple className="input col-span-2 h-24" value={form.facultyIds} onChange={(e) => setForm({ ...form, facultyIds: Array.from(e.target.selectedOptions, (o) => o.value) })}>
                {faculty.map((f) => <option key={f._id} value={f._id}>{f.fullName} ({f.facultyId})</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-ink-900">
              <input type="checkbox" checked={form.includeInitialData} onChange={(e) => setForm({ ...form, includeInitialData: e.target.checked })} />
              Enter initial academic data now (recommended — lets risk be calculated immediately)
            </label>

            {form.includeInitialData && (
              <div className="mt-3 grid grid-cols-2 gap-3 rounded-md border border-ink-100 p-4">
                <div><label className="label">Attendance %</label><input required type="number" min="0" max="100" className="input" value={form.attendancePct} onChange={(e) => setForm({ ...form, attendancePct: e.target.value })} /></div>
                <div><label className="label">Previous Semester Average %</label><input type="number" min="0" max="100" className="input" value={form.previousSemesterAverage} onChange={(e) => setForm({ ...form, previousSemesterAverage: e.target.value })} /></div>
                <div><label className="label">Internal Assessment 1 %</label><input required type="number" min="0" max="100" className="input" value={form.internal1} onChange={(e) => setForm({ ...form, internal1: e.target.value })} /></div>
                <div><label className="label">Internal Assessment 2 %</label><input required type="number" min="0" max="100" className="input" value={form.internal2} onChange={(e) => setForm({ ...form, internal2: e.target.value })} /></div>
                <div><label className="label">Assignments Total</label><input required type="number" min="0" className="input" value={form.assignmentsTotal} onChange={(e) => setForm({ ...form, assignmentsTotal: e.target.value })} /></div>
                <div><label className="label">Assignments Submitted</label><input required type="number" min="0" className="input" value={form.assignmentsSubmitted} onChange={(e) => setForm({ ...form, assignmentsSubmitted: e.target.value })} /></div>
                <p className="col-span-2 text-xs text-ink-400">
                  Performance Trend isn't entered directly — it's derived automatically by the risk engine from Internal 1 vs Internal 2, the same way it works for every student.
                </p>
              </div>
            )}
            {!form.includeInitialData && (
              <p className="mt-2 text-xs text-ink-400">
                You can skip this and add attendance/marks/assignments later from the student's detail page — their dashboard will show an "insufficient data" state until then, not an error.
              </p>
            )}
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Creating…' : 'Create Student'}</button>
        </form>
      )}

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <input className="input max-w-xs" placeholder="Search by name, ID or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="input w-auto" value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
            <option value="ALL">All risk levels</option>
            <option value="LOW">Low risk</option>
            <option value="MEDIUM">Medium risk</option>
            <option value="HIGH">High risk</option>
          </select>
          <select className="input w-auto" value={semesterFilter} onChange={(e) => setSemesterFilter(e.target.value)}>
            <option value="ALL">All semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => <option key={s} value={s}>Semester {s}</option>)}
          </select>
        </div>
      </div>

      <div className="card overflow-x-auto p-6">
        {loading ? (
          <LoadingSpinner label="Loading students…" />
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-500">
                <th className="py-2 pr-4">Student</th>
                <th className="py-2 pr-4">Course / Sem</th>
                <th className="py-2 pr-4">Assigned Faculty</th>
                <th className="py-2 pr-4">Risk</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s._id} className="border-b border-ink-50">
                  <td className="py-2.5 pr-4">
                    <p className="font-medium text-ink-900">{s.fullName}</p>
                    <p className="text-xs text-ink-400">{s.studentId}</p>
                  </td>
                  <td className="py-2.5 pr-4">{s.course} · Sem {s.semester}</td>
                  <td className="py-2.5 pr-4">{s.facultyIds?.length || 0} assigned</td>
                  <td className="py-2.5 pr-4"><RiskBadge level={s.currentRisk?.riskLevel} /></td>
                  <td className="py-2.5 pr-4">
                    <Link to={`/faculty/students/${s._id}`} className="text-xs font-medium text-ink-700 hover:underline">View →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
