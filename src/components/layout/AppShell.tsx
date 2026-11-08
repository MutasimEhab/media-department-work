import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { DemoBanner } from './DemoBanner';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { EnglishDigits } from '../ui/EnglishDigits';

export const AppShell: React.FC = () => {
  const { isAuthenticated, isAuthLoading, theme } = useApp();
  const location = useLocation();
  if (isAuthLoading) return <main role="status" className="min-h-screen grid place-items-center bg-brand-lightGray text-brand-charcoal">جارٍ التحقق من جلسة الدخول…</main>;
  if (!isAuthenticated) return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />;
  return (
    <div className={`${theme === 'dark' ? 'app-theme-dark' : 'app-theme-light'} min-h-screen bg-brand-lightGray text-brand-darkText flex flex-col`}>
      <EnglishDigits />
      <DemoBanner />
      <Topbar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <div className="min-w-0 flex-1 overflow-y-auto">
          <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-5 lg:p-7">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
