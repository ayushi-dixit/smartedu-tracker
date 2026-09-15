import { useState } from 'react';
import api, { apiErrorMessage } from '../services/api';

export default function CsvImportPage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError(null);
    setSummary(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/import/students', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSummary(res.data.data);
    } catch (err) {
      setError(apiErrorMessage(err, 'CSV import failed.'));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900">CSV Import</h1>
        <p className="text-sm text-ink-500">Bulk-import student academic data. Risk is always recalculated by the backend — values from the CSV are never trusted directly.</p>
      </div>

      <div className="card p-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Expected columns</p>
        <code className="block overflow-x-auto rounded bg-ink-50 p-3 text-xs text-ink-700">
          student_id,student_name,email,course,semester,section,attendance_pct,internal_1,internal_2,assignments_total,assignments_submitted,previous_semester_avg
        </code>
        <p className="mt-2 text-xs text-ink-400">
          Note: a student must already have a login account (created via registration) before their academic data can be imported for the first time.
        </p>

        <form onSubmit={handleUpload} className="mt-4">
          <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} className="input" />
          <button type="submit" disabled={!file || uploading} className="btn-primary mt-3 w-full">
            {uploading ? 'Uploading…' : 'Upload & Import'}
          </button>
        </form>
      </div>

      {error && <div className="rounded-md border border-risk-high/30 bg-risk-highBg px-4 py-3 text-sm text-risk-high">{error}</div>}

      {summary && (
        <div className="card p-6">
          <h3 className="mb-3 font-semibold text-ink-900">Import Summary</h3>
          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            <div><p className="text-ink-400">Total Rows</p><p className="text-lg font-semibold">{summary.totalRows}</p></div>
            <div><p className="text-ink-400">Successful</p><p className="text-lg font-semibold text-risk-low">{summary.successful}</p></div>
            <div><p className="text-ink-400">Failed</p><p className="text-lg font-semibold text-risk-high">{summary.failed}</p></div>
            <div><p className="text-ink-400">Duplicate</p><p className="text-lg font-semibold text-risk-medium">{summary.duplicate}</p></div>
          </div>
          {summary.errors?.length > 0 && (
            <div className="mt-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-500">Row errors</p>
              <ul className="max-h-48 space-y-1 overflow-y-auto text-xs text-ink-600">
                {summary.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
