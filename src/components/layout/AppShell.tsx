import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { DemoBanner } from './DemoBanner';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { AdminNavigation } from './AdminNavigation';

export const AppShell: React.FC = () => {
  const { isAuthenticated, theme } = useApp();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />;
  return (
    <div className={`${theme === 'dark' ? 'app-theme-dark' : 'app-theme-light'} min-h-screen bg-brand-lightGray text-brand-darkText flex flex-col`}>
      <DemoBanner />
      <Topbar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <div className="min-w-0 flex-1 overflow-y-auto">
          <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-5 lg:p-7">
            {(location.pathname.startsWith('/app/admin/') || ['/app/users','/app/settings','/app/audit-log','/app/system-health'].includes(location.pathname)) && <AdminNavigation />}
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
