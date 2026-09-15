import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import StudentDetails from './pages/StudentDetails';
import CsvImportPage from './pages/CsvImportPage';
import AdminDashboard from './pages/AdminDashboard';
import StudentManagement from './pages/StudentManagement';
import FacultyManagement from './pages/FacultyManagement';
import SubjectManagement from './pages/SubjectManagement';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import NotesPage from './pages/NotesPage';
import NotificationsPage from './pages/NotificationsPage';
import HelpTutorialPage from './pages/HelpTutorialPage';
import StudentAcademics from './pages/StudentAcademics';

import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';

const ROLE_HOME = { STUDENT: '/student', FACULTY: '/faculty', ADMIN: '/admin' };

function RoleRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_HOME[user.role] || '/login'} replace />;
}

/** Routes usable by any authenticated role, wrapped in AppLayout. */
function AnyRole({ children }) {
  return (
    <ProtectedRoute roles={['STUDENT', 'FACULTY', 'ADMIN']}>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<RoleRedirect />} />

      <Route
        path="/student"
        element={
          <ProtectedRoute roles={['STUDENT']}>
            <AppLayout><StudentDashboard /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/academics"
        element={
          <ProtectedRoute roles={['STUDENT']}>
            <AppLayout><StudentAcademics /></AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/faculty"
        element={
          <ProtectedRoute roles={['FACULTY']}>
            <AppLayout><FacultyDashboard /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/import"
        element={
          <ProtectedRoute roles={['FACULTY', 'ADMIN']}>
            <AppLayout><CsvImportPage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/students/:id"
        element={
          <ProtectedRoute roles={['FACULTY', 'ADMIN']}>
            <AppLayout><StudentDetails /></AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <AppLayout><AdminDashboard /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <AppLayout><StudentManagement /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/faculty"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <AppLayout><FacultyManagement /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/subjects"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <AppLayout><SubjectManagement /></AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Shared across all roles */}
      <Route path="/profile" element={<AnyRole><ProfilePage /></AnyRole>} />
      <Route path="/settings" element={<AnyRole><SettingsPage /></AnyRole>} />
      <Route path="/help" element={<AnyRole><HelpTutorialPage /></AnyRole>} />
      <Route path="/notes" element={<AnyRole><NotesPage /></AnyRole>} />
      <Route path="/notifications" element={<AnyRole><NotificationsPage /></AnyRole>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
