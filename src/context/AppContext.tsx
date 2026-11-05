import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Task, Project, Circular, WorkLog, NotificationItem, UserRole, WorkDateException } from '../types';
import {
  MOCK_USERS,
  MOCK_TASKS,
  MOCK_PROJECTS,
  MOCK_CIRCULARS,
  MOCK_WORK_LOGS,
  MOCK_NOTIFICATIONS,
  FROZEN_DEMO_DATE,
} from '../data/mockData';
import { translations, Language } from '../i18n/translations';
import { ALL_PERMISSIONS, AppPermission, DEFAULT_ROLE_PERMISSIONS, roleHasPermission, RolePermissionOverrides } from '../auth/permissions';

export type DisplayTheme = 'light' | 'dark';

interface AppContextType {
  theme: DisplayTheme;
  setTheme: (theme: DisplayTheme) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  isAuthenticated: boolean;
  signOut: () => void;
  users: User[];
  tasks: Task[];
  projects: Project[];
  circulars: Circular[];
  workLogs: WorkLog[];
  pendingWork: WorkLog[];
  queueWorkLog: (log: Omit<WorkLog, 'id'>) => void;
  retryPendingWork: () => void;
  removePendingWork: (id: string) => void;
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  frozenDate: string;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  acknowledgeCircular: (circularId: string, userId: string) => void;
  addWorkLog: (log: Omit<WorkLog, 'id'>) => void;
  saveTask: (task: Task) => void;
  sendTask: (task: Task) => void;
  updateTask: (taskId: string, update: (task: Task) => Task) => void;
  updateProjects: (update: (projects: Project[]) => Project[]) => void;
  saveCircular: (circular: Circular, publish: boolean) => void;
  updateUser: (user: User) => boolean;
  addUser: (user: User) => boolean;
  canAccess: (permission: AppPermission) => boolean;
  rolePermissions: RolePermissionOverrides;
  updateRolePermission: (role: UserRole, permission: AppPermission, enabled: boolean) => void;
  exceptions: WorkDateException[];
  addException: (exception: WorkDateException) => void;
  revokeException: (id: string) => void;
  t: typeof translations['ar'];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language] = useState<Language>('ar');
  const [theme, setTheme] = useState<DisplayTheme>(() => {
    try { return localStorage.getItem('official_display_theme') === 'light' ? 'light' : 'dark'; }
    catch { return 'dark'; }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const savedId = sessionStorage.getItem('demo_session_user');
      const savedUsers = JSON.parse(localStorage.getItem('official_users') || '[]') as User[];
      return MOCK_USERS.some(user => user.id === savedId) || savedUsers.some(user => user.id === savedId && user.isActive);
    } catch { return false; }
  });
  // Keep a harmless fallback for pages such as sign-in; AppShell blocks every internal route until authentication.
  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const savedId = sessionStorage.getItem('demo_session_user');
      const savedUsers = JSON.parse(localStorage.getItem('official_users') || '[]') as User[];
      return savedUsers.find(user => user.id === savedId) || MOCK_USERS.find(user => user.id === savedId) || MOCK_USERS.find(user => user.id === 'U-002') || MOCK_USERS[0];
    } catch { return MOCK_USERS.find(user => user.id === 'U-002') || MOCK_USERS[0]; }
  });

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('official_users') || '[]') as User[];
      return [...MOCK_USERS.filter(user => !saved.some(entry => entry.id === user.id)), ...saved];
    } catch { return MOCK_USERS; }
  });
  const [rolePermissions, setRolePermissions] = useState<RolePermissionOverrides>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('official_role_permissions') || '{}') as RolePermissionOverrides;
      return Object.fromEntries(Object.entries(saved).map(([role, permissions]) => [
        role,
        Array.isArray(permissions) ? permissions.filter(permission => ALL_PERMISSIONS.includes(permission as AppPermission)) : [],
      ])) as RolePermissionOverrides;
    } catch { return {}; }
  });
  const [exceptions, setExceptions] = useState<WorkDateException[]>(() => { try { return JSON.parse(localStorage.getItem('demo_work_exceptions')||'[]') as WorkDateException[]; } catch { return []; } });
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('demo_task_drafts') || '[]') as Task[];
      return [...MOCK_TASKS.filter(t => !saved.some(s => s.id === t.id)), ...saved];
    } catch { return MOCK_TASKS; }
  });
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [circulars, setCirculars] = useState<Circular[]>(() => {
    try { const drafts=JSON.parse(localStorage.getItem('demo_circular_drafts')||'[]') as Circular[];return [...MOCK_CIRCULARS.filter(c=>!drafts.some(d=>d.id===c.id)),...drafts]; } catch { return MOCK_CIRCULARS; }
  });
  const [workLogs, setWorkLogs] = useState<WorkLog[]>(MOCK_WORK_LOGS);
  const [pendingWork, setPendingWork] = useState<WorkLog[]>(() => {
    try { return JSON.parse(localStorage.getItem('demo_pending_work') || '[]') as WorkLog[]; }
    catch { return []; }
  });
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('official_app_notifications') || '[]') as NotificationItem[];
      return [...MOCK_NOTIFICATIONS.filter(item => !saved.some(entry => entry.id === item.id)), ...saved];
    } catch { return MOCK_NOTIFICATIONS; }
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // The approved product interface is Arabic-only. Keep this compatibility
  // method for older components, but never switch the application locale.
  const setLanguage = (_lang: Language) => undefined;

  useEffect(() => {
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';
  }, [language]);

  useEffect(() => {
    try { localStorage.setItem('official_display_theme', theme); } catch { /* apply for this session */ }
  }, [theme]);

  useEffect(() => {
    try { localStorage.setItem('official_app_notifications', JSON.stringify(notifications)); } catch { /* current tab retains alerts */ }
  }, [notifications]);

  useEffect(() => {
    try { localStorage.setItem('official_users', JSON.stringify(users)); } catch { /* current session retains account updates */ }
  }, [users]);

  useEffect(() => {
    try { localStorage.setItem('demo_pending_work', JSON.stringify(pendingWork)); } catch { /* current tab retains the queue */ }
  }, [pendingWork]);

  useEffect(() => {
    const checkMissingWork = () => {
      let config: { timezone?: string; workdays?: string[]; missingWorkAlertsEnabled?: boolean; missingWorkAlertTime?: string } = {};
      try { config = JSON.parse(localStorage.getItem('official_system_settings') || '{}'); } catch { /* use institutional defaults */ }
      if (config.missingWorkAlertsEnabled === false) return;
      const timezone = config.timezone || 'Asia/Gaza';
      const now = new Date();
      const dayName = new Intl.DateTimeFormat('ar', { timeZone: timezone, weekday: 'long' }).format(now);
      const workdays = config.workdays || ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس'];
      if (!workdays.includes(dayName)) return;
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
      const currentTime = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now);
      if (currentTime < (config.missingWorkAlertTime || '15:00')) return;
      const sentKey = `missing_work_alerts_sent_${today}`;
      try { if (localStorage.getItem(sentKey)) return; } catch { /* continue with in-memory duplicate check */ }
      const missing = users.filter(user => user.role === 'EMPLOYEE' && user.isActive && !workLogs.some(log => log.userId === user.id && log.date === today));
      if (!missing.length) return;
      const timestamp = new Intl.DateTimeFormat('ar', { timeZone: timezone, dateStyle: 'short', timeStyle: 'short' }).format(now);
      const newNotifications: NotificationItem[] = missing.map(user => ({
        id: `NTF-MISSING-${today}-${user.id}`, userId: user.id, type: 'WORK_LOG_MISSING',
        titleAr: 'تذكير بتسجيل العمل اليومي', titleEn: 'Daily work log reminder',
        messageAr: `لم يظهر لك سجل عمل لهذا اليوم (${today}). يرجى تسجيل عملك أو التواصل مع مدير الدائرة.`,
        messageEn: `No work log was found for today (${today}). Please submit your work or contact your manager.`,
        timestamp, isRead: false, actionUrl: '/app/work/new',
      }));
      const missingNames = missing.map(user => user.arabicName).join('، ');
      const authorizedRecipients = users.filter(user => user.isActive && roleHasPermission(user.role, 'receive_missing_work_alerts', rolePermissions));
      for (const recipient of authorizedRecipients) newNotifications.push({
        id: `NTF-MISSING-SUMMARY-${today}-${recipient.id}`, userId: recipient.id, type: 'WORK_LOG_MISSING',
        titleAr: 'متابعة سجلات العمل غير المسجلة', titleEn: 'Missing daily work logs follow-up',
        messageAr: `لم يظهر سجل عمل يومي لـ ${missing.length} موظفًا حتى موعد الفحص (${config.missingWorkAlertTime || '15:00'}). الأسماء: ${missingNames}.`,
        messageEn: `${missing.length} employee(s) have no work log by the configured check time.`,
        timestamp, isRead: false, actionUrl: '/app/management/work-logs',
      });
      try { localStorage.setItem(sentKey, 'sent'); } catch { /* in-memory notifications still prevent repeat in this tab */ }
      setNotifications(previous => [...newNotifications.filter(item => !previous.some(old => old.id === item.id)), ...previous]);
    };
    checkMissingWork();
    const timer = window.setInterval(checkMissingWork, 60_000);
    return () => window.clearInterval(timer);
  }, [users, workLogs, rolePermissions]);

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
  const signIn = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    try { sessionStorage.setItem('demo_session_user', user.id); } catch { /* session remains active until the tab closes */ }
  };
  const signOut = () => {
    setIsAuthenticated(false);
    setCurrentUser(MOCK_USERS.find(user => user.id === 'U-002') || MOCK_USERS[0]);
    try { sessionStorage.removeItem('demo_session_user'); } catch { /* session state still clears in memory */ }
  };

  const userNotifications = notifications.filter(n => n.userId === currentUser.id);
  const unreadNotificationCount = userNotifications.filter(n => !n.isRead).length;

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(item => (item.id === id ? { ...item, isRead: true } : item))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev =>
      prev.map(item => (item.userId === currentUser.id ? { ...item, isRead: true } : item))
    );
  };

  const acknowledgeCircular = (circularId: string, userId: string) => {
    setCirculars(prev =>
      prev.map(cir => {
        if (cir.id === circularId) {
          const updatedRecipients = cir.recipients.map(r =>
            r.userId === userId
              ? { ...r, hasAcknowledged: true, acknowledgedAt: '09:15 ص' }
              : r
          );
          return { ...cir, recipients: updatedRecipients };
        }
        return cir;
      })
    );
  };

  const addWorkLog = (logData: Omit<WorkLog, 'id'>) => {
    const newLog: WorkLog = {
      ...logData,
      id: `LOG-${400 + workLogs.length + 1}`,
    };
    setWorkLogs(prev => [newLog, ...prev]);
  };

  const queueWorkLog = (logData: Omit<WorkLog, 'id'>) => {
    setPendingWork(prev => [{ ...logData, id: `PENDING-${Date.now()}` }, ...prev]);
  };
  const removePendingWork = (id: string) => setPendingWork(prev => prev.filter(item => item.id !== id));
  const retryPendingWork = () => {
    if (!navigator.onLine || !pendingWork.length) return;
    setWorkLogs(prev => [...pendingWork.map((item, index) => ({ ...item, id: `LOG-${400 + prev.length + index + 1}` })), ...prev]);
    setPendingWork([]);
  };
  useEffect(() => {
    const sync = () => retryPendingWork();
    window.addEventListener('online', sync);
    if (navigator.onLine && pendingWork.length) sync();
    return () => window.removeEventListener('online', sync);
  }, [pendingWork]);

  const saveTask = (task: Task) => {
    setTasks(prev => prev.some(t => t.id === task.id) ? prev.map(t => t.id === task.id ? task : t) : [...prev, task]);
    if (task.isDraft) {
      try {
        const drafts = JSON.parse(localStorage.getItem('demo_task_drafts') || '[]') as Task[];
        localStorage.setItem('demo_task_drafts', JSON.stringify([...drafts.filter(t => t.id !== task.id), task]));
      } catch { /* storage may be unavailable; current session still retains the draft */ }
    }
  };

  const sendTask = (task: Task) => {
    if (notifications.some(n => n.type === 'TASK_ASSIGNED' && n.actionUrl.endsWith(task.id))) return;
    const sent = { ...task, isDraft: false };
    setTasks(prev => prev.some(t => t.id === sent.id) ? prev.map(t => t.id === sent.id ? sent : t) : [...prev, sent]);
    const newItems: NotificationItem[] = sent.recipients.map((recipient, index) => ({
      id: `NTF-DEMO-${sent.id}-${recipient.userId}`, userId: recipient.userId, type: 'TASK_ASSIGNED',
      titleAr: 'تكليف عمل جديد', titleEn: 'New assignment',
      messageAr: `تم إسناد تكليف جديد إليك (${sent.id}).`, messageEn: `A new assignment was sent to you (${sent.id}).`,
      timestamp: '2026-10-31 09:15 AM', isRead: false, actionUrl: `/app/assignments/${sent.id}`,
    }));
    setNotifications(prev => [...newItems.filter(n => !prev.some(old => old.id === n.id)), ...prev]);
    try { localStorage.setItem('demo_task_drafts', JSON.stringify((JSON.parse(localStorage.getItem('demo_task_drafts') || '[]') as Task[]).filter(t => t.id !== sent.id))); } catch { /* current session remains authoritative */ }
  };
  const updateTask = (taskId: string, update: (task: Task) => Task) => {
    setTasks(prev => prev.map(task => task.id === taskId ? update(task) : task));
  };
  const updateProjects = (update: (current: Project[]) => Project[]) => {
    setProjects(prev => update(prev));
  };
  const saveCircular = (circular: Circular, publish: boolean) => {
    setCirculars(prev => prev.some(c => c.id === circular.id) ? prev.map(c => c.id === circular.id ? circular : c) : [circular, ...prev]);
    if (publish) {
      const newItems: NotificationItem[] = circular.recipients.map(r => ({
        id: `NTF-CIR-${circular.id}-${r.userId}`, userId: r.userId, type: 'CIRCULAR_PUBLISHED',
        titleAr: 'تعميم جديد', titleEn: 'New circular', messageAr: circular.titleAr, messageEn: circular.titleEn,
        timestamp: circular.issuedAt, isRead: false, actionUrl: `/app/circulars/${circular.id}`,
      }));
      setNotifications(prev => [...newItems.filter(n => !prev.some(p => p.id === n.id)), ...prev]);
      try { localStorage.setItem('demo_circular_drafts', JSON.stringify((JSON.parse(localStorage.getItem('demo_circular_drafts') || '[]') as Circular[]).filter(c => c.id !== circular.id))); } catch { /* keep session state */ }
    } else {
      try { const drafts=JSON.parse(localStorage.getItem('demo_circular_drafts')||'[]') as Circular[];localStorage.setItem('demo_circular_drafts',JSON.stringify([...drafts.filter(c=>c.id!==circular.id),circular])); } catch { /* keep session state */ }
    }
  };
  const updateUser = (user: User) => {
    if (user.id === currentUser.id && !user.isActive) return false;
    if (users.some(existing => existing.id !== user.id && user.username && existing.username?.toLowerCase() === user.username.toLowerCase())) return false;
    if (user.role === 'ADMIN' && !user.isActive && users.filter(u=>u.role==='ADMIN'&&u.isActive&&u.id!==user.id).length===0) return false;
    setUsers(prev=>prev.map(u=>u.id===user.id?user:u));
    if(currentUser.id===user.id)signIn(user);
    return true;
  };
  const addUser = (user:User) => { if(users.some(u=>u.email.toLowerCase()===user.email.toLowerCase()||Boolean(user.username&&u.username?.toLowerCase()===user.username.toLowerCase())))return false;setUsers(prev=>[...prev,user]);return true; };
  const canAccess = (permission: AppPermission) => roleHasPermission(currentUser.role, permission, rolePermissions);
  const updateRolePermission = (role: UserRole, permission: AppPermission, enabled: boolean) => {
    if (currentUser.role !== 'ADMIN' || role === 'ADMIN') return;
    setRolePermissions(previous => {
      const current = previous[role] || [...DEFAULT_ROLE_PERMISSIONS[role]];
      const nextForRole = enabled
        ? [...new Set([...current, permission])]
        : current.filter(item => item !== permission);
      const next = { ...previous, [role]: nextForRole };
      try { localStorage.setItem('official_role_permissions', JSON.stringify(next)); } catch { /* current session still applies */ }
      return next;
    });
  };
  const addException = (exception: WorkDateException) => {
    setExceptions(prev=>{const next=[exception,...prev];try{localStorage.setItem('demo_work_exceptions',JSON.stringify(next));}catch{}return next;});
    const n:NotificationItem={id:`NTF-EX-${exception.id}`,userId:exception.userId,type:'TASK_ASSIGNED',titleAr:'استثناء تاريخ عمل',titleEn:'Work date exception granted',messageAr:`تم منحك استثناء للتسجيل عن: ${exception.dates.join(', ')}`,messageEn:`You have a work-log exception for: ${exception.dates.join(', ')}`,timestamp:exception.createdAt,isRead:false,actionUrl:'/app/admin/work-date-exceptions'};
    setNotifications(prev=>prev.some(x=>x.id===n.id)?prev:[n,...prev]);
  };
  const revokeException = (id:string) => {setExceptions(prev=>{const next=prev.map(x=>x.id===id?{...x,revokedAt:'2026-10-31 09:15 AM'}:x);try{localStorage.setItem('demo_work_exceptions',JSON.stringify(next));}catch{}return next;});};

  const t = translations[language];

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        language,
        setLanguage,
        currentUser,
        setCurrentUser: signIn,
        isAuthenticated,
        signOut,
        users,
        tasks,
        projects,
        circulars,
        workLogs,
        pendingWork,
        queueWorkLog,
        retryPendingWork,
        removePendingWork,
        notifications,
        unreadNotificationCount,
        frozenDate: FROZEN_DEMO_DATE,
        isSidebarOpen,
        setIsSidebarOpen,
        toggleSidebar,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        acknowledgeCircular,
        addWorkLog,
        saveTask,
        sendTask,
        updateTask,
        updateProjects,
        saveCircular,
        updateUser,
        addUser,
        canAccess,
        rolePermissions,
        updateRolePermission,
        exceptions,
        addException,
        revokeException,
        t,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
