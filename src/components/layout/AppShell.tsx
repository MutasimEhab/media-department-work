import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { WelcomeGreeting } from './WelcomeGreeting';
import { Toast } from '../ui/Toast';

export const AppShell: React.FC = () => {
  const { isAuthenticated, isAuthLoading, authCheckError, retryAuthCheck, theme, toasts, dismissToast, institutionLogo, markNotificationAsRead } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  React.useEffect(() => {
    const root = document.documentElement;
    const isDark = isAuthenticated && theme === 'dark';
    root.classList.toggle('app-theme-dark', isDark);
    root.classList.toggle('app-theme-light', isAuthenticated && theme === 'light');
    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (themeColor) themeColor.content = isDark ? '#101116' : '#e6e7e9';
    return () => {
      root.classList.remove('app-theme-dark', 'app-theme-light');
      if (themeColor) themeColor.content = '#e6e7e9';
    };
  }, [isAuthenticated, theme]);
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
  if (authCheckError) return <main className="min-h-screen grid place-items-center bg-brand-lightGray p-4 text-brand-charcoal"><section role="alert" className="w-full max-w-md rounded-2xl border border-brand-border bg-white p-6 text-center shadow-lg"><h1 className="text-xl font-bold">تعذر تحميل الصفحة</h1><p className="mt-3 text-sm">{authCheckError}</p><button type="button" onClick={retryAuthCheck} className="mt-5 rounded-lg bg-brand-magenta px-5 py-3 font-semibold text-white hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-brand-magenta focus:ring-offset-2">إعادة المحاولة</button></section></main>;
  if (!isAuthenticated) return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />;
  return (
    <div className={`${theme === 'dark' ? 'app-theme-dark' : 'app-theme-light'} min-h-screen bg-brand-lightGray text-brand-darkText flex flex-col`}>
      <Topbar />
      <WelcomeGreeting />
      <Toast toasts={toasts} onDismiss={dismissToast} onAction={(id, url, notificationId) => { dismissToast(id); if (notificationId) void markNotificationAsRead(notificationId, { quiet: true }); navigate(url); }} />
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
