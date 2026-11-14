import React from 'react';
import { AuthPage } from './pages/auth/AuthPage';
import { ManagementDashboard } from './pages/dashboard/ManagementDashboard';
import { EmployeeDashboard } from './pages/dashboard/EmployeeDashboard';
import { QuickWorkEntry } from './pages/work/QuickWorkEntry';
import { WorkHistory } from './pages/work/WorkHistory';
import { ManagementWorkLogs } from './pages/work/ManagementWorkLogs';
import { AssignmentList } from './pages/assignments/AssignmentList';
import { AssignmentEditor } from './pages/assignments/AssignmentEditor';
import { AssignmentDetail } from './pages/assignments/AssignmentDetail';
import { ProjectWorkspace } from './pages/projects/ProjectWorkspace';
import { CircularInbox } from './pages/circulars/CircularInbox';
import { CircularEditor } from './pages/circulars/CircularEditor';
import { CircularTracking } from './pages/circulars/CircularTracking';
import { NotificationCenter } from './pages/notifications/NotificationCenter';
import { Reports } from './pages/reports/Reports';
import { AdminPages } from './pages/admin/AdminPages';
import { AuditLog } from './pages/admin/AuditLog';
import { SystemHealth } from './pages/admin/SystemHealth';
import { AdminTools } from './pages/admin/AdminTools';
import { RecordsExport } from './pages/admin/RecordsExport';
import { MediaWorkflow } from './pages/work/MediaWorkflow';
import { PendingSync } from './pages/work/PendingSync';
import { Profile } from './pages/profile/Profile';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AppShell } from './components/layout/AppShell';
import { PermissionGuard } from './components/guards/PermissionGuard';
import { useApp } from './context/AppContext';
import { EnglishDigits } from './components/ui/EnglishDigits';

const AppHome: React.FC = () => {
  const { currentUser } = useApp();
  return <Navigate to={currentUser.role === 'EMPLOYEE' ? '/app/my-dashboard' : '/app/dashboard'} replace />;
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <EnglishDigits />
      <BrowserRouter>
        <Routes>
          {/* Root redirect to App */}
          <Route path="/" element={<Navigate to="/auth/login" replace />} />

          {/* Authentication Routes (Prompt 02) */}
          <Route path="/auth/login" element={<AuthPage />} />
          <Route path="/auth/forgot-password" element={<AuthPage />} />
          <Route path="/auth/reset-password" element={<AuthPage />} />
          {/* App Shell Protected Routes */}
          <Route path="/app" element={<AppShell />}>
            <Route index element={<AppHome />} />

            {/* Management and employee dashboards */}
            <Route path="dashboard" element={<PermissionGuard permission="view_management_dashboard"><ManagementDashboard /></PermissionGuard>} />
            <Route path="my-dashboard" element={<PermissionGuard permission="view_employee_dashboard"><EmployeeDashboard /></PermissionGuard>} />
            <Route path="work/new" element={<PermissionGuard permission="create_work_log"><QuickWorkEntry /></PermissionGuard>} />
            <Route path="work/pending" element={<PermissionGuard permission="view_own_work_logs"><PendingSync /></PermissionGuard>} />
            <Route path="admin/add-work" element={<PermissionGuard permission="manage_users"><QuickWorkEntry /></PermissionGuard>} />
            <Route path="work" element={<PermissionGuard permission="view_own_work_logs"><WorkHistory /></PermissionGuard>} />
            <Route path="management/work-logs" element={<PermissionGuard permission="view_department_work_logs"><ManagementWorkLogs /></PermissionGuard>} />
            <Route path="assignments" element={<PermissionGuard permission="view_assignments"><AssignmentList /></PermissionGuard>} />
            <Route path="assignments/new" element={<PermissionGuard permission="manage_assignments"><AssignmentEditor /></PermissionGuard>} />
            <Route path="assignments/:id/edit" element={<PermissionGuard permission="manage_assignments"><AssignmentEditor /></PermissionGuard>} />
            <Route path="assignments/:id/review" element={<PermissionGuard permission="review_assignments"><AssignmentDetail review /></PermissionGuard>} />
            <Route path="assignments/:id" element={<PermissionGuard permission="view_assignments"><AssignmentDetail /></PermissionGuard>} />
            <Route path="projects" element={<PermissionGuard permission="view_projects"><ProjectWorkspace /></PermissionGuard>} />
            <Route path="projects/new" element={<PermissionGuard permission="manage_projects"><ProjectWorkspace /></PermissionGuard>} />
            <Route path="projects/:id" element={<PermissionGuard permission="view_projects"><ProjectWorkspace /></PermissionGuard>} />
            <Route path="media" element={<PermissionGuard permission="view_assignments"><MediaWorkflow /></PermissionGuard>} />
            <Route path="circulars" element={<PermissionGuard permission={['view_circulars','manage_circulars','track_circulars']}><CircularInbox /></PermissionGuard>} />
            <Route path="circulars/new" element={<PermissionGuard permission="manage_circulars"><CircularEditor /></PermissionGuard>} />
            <Route path="circulars/:id/edit" element={<PermissionGuard permission="manage_circulars"><CircularEditor /></PermissionGuard>} />
            <Route path="circulars/:id/tracking" element={<PermissionGuard permission={['track_circulars','manage_circulars']}><CircularTracking /></PermissionGuard>} />
            <Route path="admin/users/new" element={<PermissionGuard permission="manage_users"><AdminPages /></PermissionGuard>} />
            <Route path="admin/users/:id" element={<PermissionGuard permission="manage_users"><AdminPages /></PermissionGuard>} />
            <Route path="admin/settings" element={<PermissionGuard permission="manage_system_settings"><AdminPages /></PermissionGuard>} />
            <Route path="admin/work-date-exceptions" element={<PermissionGuard permission="manage_work_exceptions"><AdminPages /></PermissionGuard>} />
            <Route path="admin/records" element={<PermissionGuard permission="view_department_reports"><RecordsExport /></PermissionGuard>} />
            <Route path="admin/workflow" element={<PermissionGuard permission="manage_system_settings"><AdminTools /></PermissionGuard>} />
            <Route path="admin/account-types" element={<PermissionGuard permission="manage_users"><AdminTools /></PermissionGuard>} />
            <Route path="admin/custom-fields" element={<PermissionGuard permission="manage_system_settings"><AdminTools /></PermissionGuard>} />
            <Route path="admin/backup" element={<PermissionGuard permission="manage_system_settings"><AdminTools /></PermissionGuard>} />
            <Route path="my-exceptions" element={<PermissionGuard permission="view_own_exceptions"><AdminPages /></PermissionGuard>} />
            <Route path="admin/audit" element={<PermissionGuard permission="view_audit_log"><AuditLog /></PermissionGuard>} />
            <Route path="admin/health" element={<PermissionGuard permission="view_system_health"><SystemHealth /></PermissionGuard>} />
            <Route path="admin/deliveries" element={<PermissionGuard permission="view_system_health"><SystemHealth /></PermissionGuard>} />
            <Route path="notifications" element={<PermissionGuard permission="view_notifications"><NotificationCenter /></PermissionGuard>} />
            <Route path="reports/my" element={<PermissionGuard permission="view_own_report"><Reports /></PermissionGuard>} />
            <Route path="reports/department" element={<PermissionGuard permission="view_department_reports"><Reports department /></PermissionGuard>} />
            <Route path="daily-work" element={<Navigate to="/app/work" replace />} />

            {/* Admin Only Routes (Prompt 20 - 25) */}
            <Route path="users" element={<PermissionGuard permission="manage_users"><AdminPages /></PermissionGuard>} />

            <Route path="settings" element={<PermissionGuard permission="manage_system_settings"><AdminPages /></PermissionGuard>} />

            <Route path="audit-log" element={<PermissionGuard permission="view_audit_log"><AuditLog /></PermissionGuard>} />

            <Route path="system-health" element={<PermissionGuard permission="view_system_health"><SystemHealth /></PermissionGuard>} />

            <Route path="profile" element={<Profile />} />

          </Route>

          {/* Catch all redirect */}
          <Route path="*" element={<Navigate to="/auth/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
};









