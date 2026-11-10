import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { EnglishDigits } from '../ui/EnglishDigits';
import { WelcomeGreeting } from './WelcomeGreeting';
import { Toast } from '../ui/Toast';

export const AppShell: React.FC = () => {
  const { isAuthenticated, isAuthLoading, theme, toasts, dismissToast, institutionLogo } = useApp();
  const location = useLocation();
  React.useEffect(() => {
    let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!institutionLogo) { favicon?.remove(); return; }
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = institutionLogo;
  }, [institutionLogo]);
  if (isAuthLoading) return <main role="status" className="min-h-screen grid place-items-center bg-brand-lightGray text-brand-charcoal">جارٍ التحقق من جلسة الدخول…</main>;
  if (!isAuthenticated) return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />;
  return (
    <div className={`${theme === 'dark' ? 'app-theme-dark' : 'app-theme-light'} min-h-screen bg-brand-lightGray text-brand-darkText flex flex-col`}>
      <EnglishDigits />
      <Topbar />
      <WelcomeGreeting />
      <Toast toasts={toasts} onDismiss={dismissToast} />
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
