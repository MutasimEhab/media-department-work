import React, { useEffect, useMemo, useState } from 'react';
import { Menu, Bell, ChevronDown, LogOut, User as UserIcon, Wifi, WifiOff, Search, Sun, Moon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import organizationLogo from '../../assets/brand/organization-logo.png';

export const Topbar: React.FC = () => {
  const {
    language,
    currentUser,
    signOut,
    unreadNotificationCount,
    notifications,
    users,
    tasks,
    projects,
    circulars,
    workLogs,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    toggleSidebar,
    canAccess,
    theme,
    setTheme,
    t,
  } = useApp();

  const [openMenu, setOpenMenu] = useState<'notifications' | 'user' | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const location = useLocation();
  useEscapeKey(openMenu !== null, () => setOpenMenu(null));
  useEscapeKey(searchOpen, () => { setSearchOpen(false); setSearchQuery(''); });
  useEffect(() => setOpenMenu(null), [location.pathname]);
  useEffect(() => {
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => { window.removeEventListener('online', online); window.removeEventListener('offline', offline); };
  }, []);
  const navigate = useNavigate();

  const userNotifications = notifications.filter(n => n.userId === currentUser.id);
  const searchResults = useMemo(() => {
    const term = searchQuery.trim().toLocaleLowerCase('ar');
    if (!term) return [];
    return [
      ...tasks.filter(task => !task.isDraft && (canAccess('manage_assignments') || task.recipients.some(recipient => recipient.userId === currentUser.id)) && `${task.titleAr} ${task.id}`.toLocaleLowerCase('ar').includes(term)).map(task => ({ label: task.titleAr, detail: `تكليف · ${task.id}`, href: `/app/assignments/${task.id}` })),
      ...projects.filter(project => (canAccess('manage_projects') || project.ownerId === currentUser.id) && `${project.titleAr} ${project.id}`.toLocaleLowerCase('ar').includes(term)).map(project => ({ label: project.titleAr, detail: `مشروع · ${project.id}`, href: `/app/projects/${project.id}` })),
      ...circulars.filter(item => !item.isDraft && (canAccess('manage_circulars') || item.recipients.some(recipient => recipient.userId === currentUser.id)) && `${item.titleAr} ${item.id}`.toLocaleLowerCase('ar').includes(term)).map(item => ({ label: item.titleAr, detail: `تعميم · ${item.id}`, href: '/app/circulars' })),
      ...workLogs.filter(log => (canAccess('view_department_work_logs') || log.userId === currentUser.id) && `${log.activityAr} ${log.descriptionAr || ''} ${log.id} ${log.date}`.toLocaleLowerCase('ar').includes(term)).map(log => ({ label: log.activityAr, detail: `سجل عمل · ${log.date}`, href: canAccess('view_department_work_logs') ? '/app/management/work-logs' : '/app/work' })),
      ...(canAccess('manage_users') ? users.filter(user => `${user.arabicName} ${user.username || ''} ${user.email}`.toLocaleLowerCase('ar').includes(term)).map(user => ({ label: user.arabicName, detail: `مستخدم · ${user.username || user.email}`, href: `/app/admin/users/${user.id}` })) : []),
    ].slice(0, 8);
  }, [searchQuery, tasks, projects, circulars, workLogs, users, canAccess, currentUser.id]);

  return (
    <header className="sticky top-0 z-30 flex min-h-[64px] w-full items-center justify-between border-b border-brand-border bg-white px-3 shadow-sm sm:px-5 lg:px-7">
      <div className="flex min-w-0 items-center gap-3">
        <img src={organizationLogo} alt={t.app.subTitle} className="h-10 w-10 shrink-0 object-contain" />
        <div className="min-w-0">
          <h1 className="truncate text-xs font-bold text-brand-darkText sm:text-sm">{t.app.title}</h1>
          <p className="truncate text-[10px] text-brand-charcoal/75 sm:text-[11px]">{language === 'ar' ? currentUser.departmentAr : currentUser.departmentEn} · {t.app.subTitle}</p>
        </div>
      </div>

      {/* End: Controls (Language, Notifications, User) */}
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={language === 'ar' ? 'فتح القائمة الجانبية' : 'Open navigation menu'}
          className="flex h-10 w-10 items-center justify-center rounded-input text-brand-darkText hover:bg-brand-lightGray focus:outline-none focus:ring-2 focus:ring-brand-plum lg:hidden"
        ><Menu className="h-5 w-5" /></button>
        <span className={`hidden min-h-9 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-subheading sm:inline-flex ${isOnline ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-900'}`}>
          {isOnline ? <Wifi size={14}/> : <WifiOff size={14}/>} {isOnline ? (language === 'ar' ? 'متصل' : 'Online') : (language === 'ar' ? 'غير متصل' : 'Offline')}
        </span>
        <button type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'تفعيل الوضع النهاري' : 'تفعيل الوضع الليلي'} title={theme === 'dark' ? 'تفعيل الوضع النهاري' : 'تفعيل الوضع الليلي'} className="flex h-10 w-10 items-center justify-center rounded-input text-brand-plum hover:bg-brand-lightGray focus:outline-none focus:ring-2 focus:ring-brand-plum"><span className="sr-only">{theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}</span>{theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</button>
        <button type="button" onClick={() => { setSearchOpen(true); setOpenMenu(null); }} aria-label="بحث شامل" aria-expanded={searchOpen} className="flex h-10 w-10 items-center justify-center rounded-input text-brand-charcoal hover:bg-brand-lightGray focus:outline-none focus:ring-2 focus:ring-brand-plum"><Search className="h-5 w-5" /></button>
        {/* Notification Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenMenu(current => current === 'notifications' ? null : 'notifications')}
            aria-label={t.app.notifications}
            aria-expanded={openMenu === 'notifications'}
            className="relative w-10 h-10 rounded-input flex items-center justify-center text-brand-charcoal hover:bg-brand-lightGray focus:outline-none focus:ring-2 focus:ring-brand-plum"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationCount > 0 && (
              <span
                className="absolute top-1.5 end-1.5 w-4 h-4 rounded-full bg-brand-magenta text-white font-mono text-[10px] font-bold flex items-center justify-center"
                dir="ltr"
              >
                {unreadNotificationCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {openMenu === 'notifications' && (
            <div className="absolute end-0 mt-2 w-80 sm:w-96 bg-white rounded-card border border-brand-border shadow-dialog p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-2 border-b border-brand-border/60">
                <span className="text-sm font-subheading font-bold text-brand-darkText">
                  {t.app.notifications}
                </span>
                {unreadNotificationCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsAsRead}
                    className="text-xs text-brand-magenta hover:underline font-medium"
                  >
                    {t.app.markAllRead}
                  </button>
                )}
              </div>

              <div className="divide-y divide-brand-border/50 max-h-72 overflow-y-auto mt-1">
                {userNotifications.length === 0 ? (
                  <p className="py-6 text-center text-xs text-brand-charcoal/60">
                    {t.app.noNotifications}
                  </p>
                ) : (
                  userNotifications.map(item => (
                    <div
                      key={item.id}
                      onClick={() => {
                        markNotificationAsRead(item.id);
                        setOpenMenu(null);
                        navigate(item.actionUrl);
                      }}
                      className={`
                        py-2.5 px-2 rounded cursor-pointer transition-colors flex flex-col gap-1
                        ${item.isRead ? 'hover:bg-brand-lightGray/40 opacity-75' : 'bg-brand-magenta/5 hover:bg-brand-magenta/10 font-medium'}
                      `}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-brand-darkText">{language === 'ar' ? item.titleAr : item.titleEn}</span>
                        <span className="font-mono text-[10px] text-brand-charcoal/60" dir="ltr">
                          {item.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-brand-charcoal/80 leading-snug">{language === 'ar' ? item.messageAr : item.messageEn}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-brand-border/60 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setOpenMenu(null);
                    navigate('/app/notifications');
                  }}
                  className="text-xs text-brand-plum font-semibold hover:underline"
                >
                  {t.app.viewAll}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenMenu(current => current === 'user' ? null : 'user')}
            aria-expanded={openMenu === 'user'}
            className="flex items-center gap-2 p-1.5 rounded-input hover:bg-brand-lightGray focus:outline-none focus:ring-2 focus:ring-brand-plum min-h-[40px]"
          >
            <div className="w-8 h-8 rounded-full bg-brand-plum text-white font-bold text-xs flex items-center justify-center">
              {(language === 'ar' ? currentUser.arabicName : currentUser.englishName).charAt(0)}
            </div>
            <span className="text-xs font-bold text-brand-darkText hidden md:inline-block">
              {language === 'ar' ? currentUser.arabicName : currentUser.englishName}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-brand-charcoal/70 hidden md:inline-block" />
          </button>

          {openMenu === 'user' && (
            <div className="absolute end-0 mt-2 w-56 bg-white rounded-card border border-brand-border shadow-dialog p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-brand-border/60">
                <p className="text-xs font-bold text-brand-darkText">{language === 'ar' ? currentUser.arabicName : currentUser.englishName}</p>
                <p className="text-[11px] text-brand-charcoal/70 truncate">{currentUser.email}</p>
                <span className="inline-block mt-1 text-[10px] bg-brand-plum/10 text-brand-plum font-semibold px-2 py-0.5 rounded">
                  {t.roles[currentUser.role]}
                </span>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setOpenMenu(null);
                    navigate('/app/profile');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-brand-darkText hover:bg-brand-lightGray rounded transition-colors text-start"
                >
                  <UserIcon className="w-4 h-4 text-brand-charcoal/70" />
                  <span>{t.app.profile}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpenMenu(null);
                    signOut();
                    navigate('/auth/login');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded transition-colors text-start"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span>{t.app.signOut}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {searchOpen && <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 px-3 pt-[12vh]" onMouseDown={event => { if (event.target === event.currentTarget) { setSearchOpen(false); setSearchQuery(''); } }}>
        <section role="dialog" aria-modal="true" aria-label="بحث شامل" className="w-full max-w-2xl overflow-hidden rounded-2xl border border-brand-border bg-white shadow-dialog">
          <div className="flex items-center gap-3 border-b border-brand-border px-4 py-3"><Search size={20} className="shrink-0 text-brand-plum" /><input autoFocus value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="ابحث في التكليفات والمشاريع والتعاميم وسجلات العمل" className="min-h-11 flex-1 border-0 bg-transparent text-sm outline-none" /><button type="button" onClick={() => { setSearchOpen(false); setSearchQuery(''); }} aria-label="إغلاق البحث" className="rounded p-2 text-brand-charcoal hover:bg-brand-lightGray">×</button></div>
          {searchQuery.trim() ? <div className="max-h-[60vh] overflow-y-auto p-2">{searchResults.length ? searchResults.map((result, index) => <button key={`${result.href}-${index}`} type="button" onClick={() => { setSearchOpen(false); setSearchQuery(''); navigate(result.href); }} className="flex w-full flex-col items-start gap-1 rounded-lg px-3 py-3 text-start hover:bg-brand-lightGray"><span className="text-sm font-bold">{result.label}</span><span className="text-xs text-brand-charcoal/70">{result.detail}</span></button>) : <p className="p-6 text-center text-sm text-brand-charcoal/70">لا توجد نتائج مطابقة.</p>}</div> : <p className="px-5 py-6 text-center text-sm text-brand-charcoal/70">اكتب كلمة للبحث في البيانات التي تملك صلاحية عرضها.</p>}
        </section>
      </div>}
    </header>
  );
};
