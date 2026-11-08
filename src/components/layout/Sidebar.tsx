import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  FolderKanban,
  FileText,
  Bell,
  BarChart3,
  BriefcaseBusiness,
  User,
  CalendarCheck,
  CloudUpload,
  PackageCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useEscapeKey } from '../../hooks/useEscapeKey';

export const Sidebar: React.FC = () => {
  const { currentUser, unreadNotificationCount, isSidebarOpen, setIsSidebarOpen, t, language, canAccess } = useApp();
  const location = useLocation();
  const isRtl = language === 'ar';
  useEscapeKey(isSidebarOpen, () => setIsSidebarOpen(false));

  const role = currentUser.role;

  interface NavItem {
    to: string;
    label: string;
    icon: React.ReactNode;
    roles: ('ADMIN' | 'MANAGER' | 'DEPUTY' | 'EMPLOYEE')[];
    badge?: number;
    permission?: import('../../auth/permissions').AppPermission;
  }

  const navItems: NavItem[] = [
    {
      to: role === 'EMPLOYEE' ? '/app/my-dashboard' : '/app/dashboard',
      label: t.nav.dashboard,
      icon: <LayoutDashboard className="w-5 h-5" />,
      roles: ['ADMIN', 'MANAGER', 'DEPUTY', 'EMPLOYEE'],
      permission: role === 'EMPLOYEE' ? 'view_employee_dashboard' : 'view_management_dashboard',
    },
    {
      to: '/app/work/new',
      label: t.nav.addWork,
      icon: <BriefcaseBusiness className="w-5 h-5" />,
      roles: ['ADMIN', 'MANAGER', 'DEPUTY', 'EMPLOYEE'],
      permission: 'create_work_log',
    },
    {
      to: '/app/work',
      label: t.nav.myTimesheet,
      icon: <CalendarCheck className="w-5 h-5" />,
      roles: ['ADMIN', 'MANAGER', 'DEPUTY', 'EMPLOYEE'],
      permission: 'view_own_work_logs',
    },
    {
      to: '/app/my-exceptions',
      label: 'استثناءات تواريخ عملي',
      icon: <CalendarCheck className="w-5 h-5" />,
      roles: ['EMPLOYEE'],
      permission: 'view_own_exceptions',
    },
    {
      to: '/app/management/work-logs',
      label: t.nav.dailyWork,
      icon: <CalendarCheck className="w-5 h-5" />,
      roles: ['ADMIN', 'MANAGER', 'DEPUTY'],
      permission: 'view_department_work_logs',
    },
    {
      to: '/app/assignments',
      label: role === 'EMPLOYEE' ? t.nav.myAssignments : t.nav.assignments,
      icon: <ClipboardList className="w-5 h-5" />,
      roles: ['ADMIN', 'MANAGER', 'DEPUTY', 'EMPLOYEE'],
      permission: 'view_assignments',
    },
    {
      to: '/app/projects',
      label: role === 'EMPLOYEE' ? t.nav.myProjects : t.nav.projects,
      icon: <FolderKanban className="w-5 h-5" />,
      roles: ['ADMIN', 'MANAGER', 'DEPUTY', 'EMPLOYEE'],
      permission: 'view_projects',
    },
    {
      to: '/app/media',
      label: 'المواد الإعلامية',
      icon: <PackageCheck className="w-5 h-5" />,
      roles: ['ADMIN', 'MANAGER', 'DEPUTY', 'EMPLOYEE'],
      permission: 'view_assignments',
    },
    {
      to: '/app/work/pending',
      label: 'الأعمال غير المتزامنة',
      icon: <CloudUpload className="w-5 h-5" />,
      roles: ['ADMIN', 'MANAGER', 'DEPUTY', 'EMPLOYEE'],
      permission: 'view_own_work_logs',
    },
    {
      to: '/app/circulars',
      label: role === 'EMPLOYEE' ? t.nav.myCirculars : t.nav.circulars,
      icon: <FileText className="w-5 h-5" />,
      roles: ['ADMIN', 'MANAGER', 'DEPUTY', 'EMPLOYEE'],
      permission: 'view_circulars',
    },
    {
      to: '/app/notifications',
      label: t.nav.notifications,
      icon: <Bell className="w-5 h-5" />,
      roles: ['ADMIN', 'MANAGER', 'DEPUTY', 'EMPLOYEE'],
      permission: 'view_notifications',
      badge: unreadNotificationCount,
    },
    {
      to: role === 'EMPLOYEE' ? '/app/reports/my' : '/app/reports/department',
      label: role === 'EMPLOYEE' ? t.nav.myReport : t.nav.reports,
      icon: <BarChart3 className="w-5 h-5" />,
      roles: ['ADMIN', 'MANAGER', 'DEPUTY', 'EMPLOYEE'],
      permission: role === 'EMPLOYEE' ? 'view_own_report' : 'view_department_reports',
    },
    {
      to: '/app/profile',
      label: t.nav.profile,
      icon: <User className="w-5 h-5" />,
      roles: ['ADMIN', 'MANAGER', 'DEPUTY', 'EMPLOYEE'],
    },
  ];

  const allowedNav = navItems.filter(item => !item.permission || canAccess(item.permission));
  const renderNavItem = (item: NavItem) => {
    const isWorkHistory = item.to === '/app/work' && location.pathname.startsWith('/app/work/') && !['/app/work/new','/app/work/pending'].includes(location.pathname);
    const isActive = location.pathname === item.to || isWorkHistory || (!['/app/work', '/app/work/new'].includes(item.to) && location.pathname.startsWith(`${item.to}/`));
    return <NavLink key={item.to} to={item.to} onClick={() => setIsSidebarOpen(false)} className={`flex min-h-[46px] items-center justify-between rounded-input px-3 py-2.5 text-xs font-subheading transition-colors focus:outline-none focus:ring-2 focus:ring-brand-plum sm:text-sm ${isActive ? 'bg-brand-magenta font-bold text-white shadow-sm' : 'text-brand-charcoal hover:bg-brand-lightGray/70 hover:text-brand-darkText'}`}>
      <div className="flex min-w-0 items-center gap-3"><span className={`shrink-0 ${isActive ? 'text-white' : 'text-brand-charcoal/80'}`}>{item.icon}</span><span className="truncate">{item.label}</span></div>
      {typeof item.badge === 'number' && item.badge > 0 && <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-mono text-[10px] font-bold ${isActive ? 'bg-white text-brand-magenta' : 'bg-brand-magenta text-white'}`} dir="ltr">{item.badge}</span>}
    </NavLink>;
  };

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-x-0 bottom-0 top-24 z-40 bg-brand-darkText/45 backdrop-blur-[1px] transition-opacity lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed ${isRtl ? 'right-0' : 'left-0'} top-24 bottom-0 z-50 flex w-64 flex-col border-e border-brand-border bg-white transition-transform duration-200 ease-in-out lg:w-56
          lg:sticky lg:top-24 lg:h-[calc(100vh-6rem)] lg:shrink-0 lg:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : `${isRtl ? 'translate-x-full' : '-translate-x-full'} lg:translate-x-0`}
        `}
      >
        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-3 pt-4 space-y-1">
          {allowedNav.map(renderNavItem)}
        </nav>

        {/* Footer info */}
        <div className="p-3 border-t border-brand-border bg-white text-[10px] text-brand-charcoal/60 text-center font-mono" dir="ltr">
          {language === 'ar' ? 'مؤسسة السمع والبصر · نسخة تجريبية' : 'HSF · Prototype'}
        </div>
      </aside>
    </>
  );
};


