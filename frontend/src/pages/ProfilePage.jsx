import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</p>
      <p className="mt-0.5 text-sm text-ink-900">{value || value === 0 ? value : '—'}</p>
    </div>
  );
}

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshProfile().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <LoadingSpinner label="Loading profile…" />;

  const isStudent = user?.role === 'STUDENT';
  const isFaculty = user?.role === 'FACULTY';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900">Profile</h1>
        <p className="text-sm text-ink-500">Your account and academic information</p>
      </div>

      <div className="card p-6">
        <h3 className="mb-4 font-semibold text-ink-900">Personal Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Full Name" value={profile?.fullName} />
          <Field label={isStudent ? 'Student ID' : isFaculty ? 'Faculty ID' : 'Role'} value={profile?.studentId || profile?.facultyId} />
          <Field label="Email" value={user?.email} />
          <Field label="Phone" value={profile?.phone} />
        </div>
      </div>

      {(isStudent || isFaculty) && (
        <div className="card p-6">
          <h3 className="mb-4 font-semibold text-ink-900">Academic Information</h3>
          <div className="grid grid-cols-2 gap-4">
            {isStudent && (
              <>
                <Field label="Program" value={profile?.course} />
                <Field label="Semester" value={profile?.semester} />
                <Field label="Section" value={profile?.section} />
                <Field label="Enrollment Year" value={profile?.enrollmentYear} />
              </>
            )}
            {isFaculty && (
              <>
                <Field label="Department" value={profile?.department} />
                <Field label="Assigned Subjects" value={profile?.assignedSubjectIds?.length ?? 0} />
              </>
            )}
          </div>
        </div>
      )}

      <div className="card p-6">
        <h3 className="mb-4 font-semibold text-ink-900">Account Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Role" value={user?.role} />
          <Field label="Account Status" value={user?.status} />
          <Field label="Joined" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : null} />
        </div>
      </div>
    </div>
  );
}
