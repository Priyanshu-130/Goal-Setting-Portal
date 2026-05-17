import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';

// Employee
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import GoalSheet from './pages/employee/GoalSheet';
import QuarterlyCheckIn from './pages/employee/QuarterlyCheckIn';

// Manager
import ManagerDashboard from './pages/manager/ManagerDashboard';
import TeamGoals from './pages/manager/TeamGoals';
import PerformanceAnalytics from './pages/manager/PerformanceAnalytics';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import AuditLogs from './pages/admin/AuditLogs';
import CycleConfig from './pages/admin/CycleConfig';
import Reports from './pages/admin/Reports';
import Settings from './pages/Settings';

function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#fafafa]"><div className="h-8 w-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    const redirect = { employee: '/employee', manager: '/manager', admin: '/admin' }[currentUser.role] || '/login';
    return <Navigate to={redirect} replace />;
  }
  return children;
}

function RootRedirect() {
  const { currentUser, loading } = useAuth();
  if (loading) return null;
  if (!currentUser) return <Navigate to="/login" replace />;
  const redirect = { employee: '/employee', manager: '/manager', admin: '/admin' }[currentUser.role] || '/login';
  return <Navigate to={redirect} replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<RootRedirect />} />

            {/* Employee Routes */}
            <Route path="/employee" element={
              <ProtectedRoute allowedRoles={['employee']}>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route index element={<EmployeeDashboard />} />
              <Route path="goals"   element={<GoalSheet />} />
              <Route path="checkin" element={<QuarterlyCheckIn />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Manager Routes */}
            <Route path="/manager" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route index element={<ManagerDashboard />} />
              <Route path="team-goals" element={<TeamGoals />} />
              <Route path="analytics"  element={<PerformanceAnalytics />} />
              <Route path="settings"   element={<Settings />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="users"   element={<UserManagement />} />
              <Route path="audit"   element={<AuditLogs />} />
              <Route path="cycle"   element={<CycleConfig />} />
              <Route path="analytics" element={<PerformanceAnalytics />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
