import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';
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
  login: (identifier: string, password: string) => Promise<{ ok: boolean; code?: string; user?: User }>;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  welcomeGreetingOpen: boolean;
  dismissWelcomeGreeting: () => void;
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
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  acknowledgeCircular: (circularId: string, userId: string) => Promise<{ ok: boolean; message?: string }>;
  addWorkLog: (log: Omit<WorkLog, 'id'>) => Promise<{ ok: boolean; message?: string }>;
  updateWorkLog: (id: string, update: Partial<WorkLog>) => Promise<{ ok: boolean; message?: string }>;
  deleteWorkLog: (id: string) => Promise<{ ok: boolean; message?: string }>;
  saveTask: (task: Task) => Promise<{ ok: boolean; message?: string }>;
  sendTask: (task: Task) => Promise<{ ok: boolean; message?: string }>;
  updateTask: (taskId: string, update: (task: Task) => Task) => Promise<{ ok: boolean; message?: string }>;
  updateProjects: (update: (projects: Project[]) => Project[]) => Promise<{ ok: boolean; message?: string }>;
  saveCircular: (circular: Circular, publish: boolean) => Promise<{ ok: boolean; circular?: Circular; message?: string }>;
  recordCircularReminder: (circularId: string, userId: string) => Promise<{ ok: boolean; reminderCount?: number; message?: string }>;
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

interface BackendUser {
  id: string;
  username: string;
  arabicName: string;
  role: UserRole;
  jobTitleAr: string;
  employeeNumber?: string;
  avatar?: string;
  email: string;
  mobile?: string;
  isActive: boolean;
  departmentId?: string;
  departmentAr: string;
}

function mapBackendUser(user: BackendUser): User {
  return {
    id: user.id,
    username: user.username,
    arabicName: user.arabicName,
    englishName: user.arabicName,
    role: user.role,
    jobTitleAr: user.jobTitleAr,
    employeeNumber: user.employeeNumber,
    avatar: user.avatar,
    jobTitleEn: user.jobTitleAr,
    email: user.email,
    mobile: user.mobile,
    isActive: user.isActive,
    departmentAr: user.departmentAr,
    departmentEn: user.departmentAr,
    preferredLanguage: 'ar',
  };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language] = useState<Language>('ar');
  const [theme, setTheme] = useState<DisplayTheme>(() => {
    try { return localStorage.getItem('official_display_theme') === 'light' ? 'light' : 'dark'; }
    catch { return 'dark'; }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [welcomeGreetingOpen, setWelcomeGreetingOpen] = useState(false);
  const dismissWelcomeGreeting = useCallback(() => setWelcomeGreetingOpen(false), []);
  // Keep a harmless fallback for pages such as sign-in; AppShell blocks every internal route until authentication.
  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const savedUsers = JSON.parse(localStorage.getItem('official_users') || '[]') as User[];
      return savedUsers[0] || MOCK_USERS.find(user => user.id === 'U-002') || MOCK_USERS[0];
    } catch { return MOCK_USERS.find(user => user.id === 'U-002') || MOCK_USERS[0]; }
  });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me', { credentials: 'include' })
      .then(async response => {
        if (!response.ok) return null;
        return await response.json() as { user?: BackendUser };
      })
      .then(payload => {
        if (cancelled || !payload?.user) return;
        setCurrentUser(mapBackendUser(payload.user));
        setIsAuthenticated(true);
        setWelcomeGreetingOpen(true);
      })
      .catch(() => undefined)
      .finally(() => { if (!cancelled) setIsAuthLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setExceptions([]);
      return;
    }
    let cancelled = false;
    fetch('/api/work-date-exceptions', { credentials: 'include' })
      .then(async response => {
        if (!response.ok) return null;
        return await response.json() as { exceptions?: WorkDateException[] };
      })
      .then(payload => {
        if (!cancelled && payload?.exceptions) setExceptions(payload.exceptions);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [isAuthenticated, currentUser.id]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    fetch('/api/system-settings', { credentials: 'include' })
      .then(async response => {
        if (!response.ok) return null;
        return await response.json() as { settings?: Record<string, unknown> | null };
      })
      .then(payload => {
        if (cancelled || !payload?.settings) return;
        try { localStorage.setItem('official_system_settings', JSON.stringify(payload.settings)); } catch { /* settings stay available from server on next session */ }
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [isAuthenticated, currentUser.id]);

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

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    fetch('/api/work-logs/mine', { credentials: 'include' })
      .then(async response => {
        if (!response.ok) return null;
        return await response.json() as { workLogs?: WorkLog[] };
      })
      .then(payload => {
        if (!cancelled && payload?.workLogs) {
          setWorkLogs(previous => [
            ...payload.workLogs!,
            ...previous.filter(log => log.userId !== currentUser.id),
          ]);
        }
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [isAuthenticated, currentUser.id]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    Promise.all([
      fetch('/api/assignments', { credentials: 'include' }),
      fetch('/api/users', { credentials: 'include' }),
      fetch('/api/projects', { credentials: 'include' }),
      fetch('/api/circulars', { credentials: 'include' }),
      fetch('/api/notifications', { credentials: 'include' }),
    ]).then(async ([assignmentResponse, userResponse, projectResponse, circularResponse, notificationResponse]) => {
      const [assignmentPayload, userPayload, projectPayload, circularPayload, notificationPayload] = await Promise.all([
        assignmentResponse.json() as Promise<{ tasks?: Task[]; message?: string }>,
        userResponse.json() as Promise<{ users?: BackendUser[] }>,
        projectResponse.json() as Promise<{ projects?: Project[]; message?: string }>,
        circularResponse.json() as Promise<{ circulars?: Circular[] }>,
        notificationResponse.json() as Promise<{ notifications?: NotificationItem[] }>,
      ]);
      if (cancelled) return;
      if (assignmentResponse.ok && assignmentPayload.tasks) setTasks(assignmentPayload.tasks);
      if (userResponse.ok && userPayload.users) setUsers(userPayload.users.map(mapBackendUser));
      if (projectResponse.ok && projectPayload.projects) setProjects(projectPayload.projects);
      if (circularResponse.ok && circularPayload.circulars) setCirculars(circularPayload.circulars);
      if (notificationResponse.ok && notificationPayload.notifications) {
        setNotifications(previous => {
          const persistedIds = new Set(notificationPayload.notifications!.map(item => item.id));
          return [...notificationPayload.notifications!, ...previous.filter(item => item.userId !== currentUser.id || !persistedIds.has(item.id))];
        });
      }
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [isAuthenticated, currentUser.id]);

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
  };
  const login = async (identifier: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ identifier, password }),
      });
      const payload = await response.json() as { code?: string; user?: BackendUser };
      if (!response.ok || !payload.user) return { ok: false, code: payload.code || 'LOGIN_UNAVAILABLE' };
      const user = mapBackendUser(payload.user);
      setCurrentUser(user);
      setIsAuthenticated(true);
      setWelcomeGreetingOpen(true);
      return { ok: true, user };
    } catch {
      return { ok: false, code: 'LOGIN_UNAVAILABLE' };
    }
  };
  const signOut = () => {
    void fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => undefined);
    setIsAuthenticated(false);
    setCurrentUser(MOCK_USERS.find(user => user.id === 'U-002') || MOCK_USERS[0]);
  };

  const userNotifications = notifications.filter(n => n.userId === currentUser.id);
  const unreadNotificationCount = userNotifications.filter(n => !n.isRead).length;

  const markNotificationAsRead = async (id: string) => {
    const notification = notifications.find(item => item.id === id && item.userId === currentUser.id);
    if (!notification) return;
    if (!notification.id.startsWith('NTF-')) {
      try {
        const response = await fetch(`/api/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH', credentials: 'include' });
        if (!response.ok) throw new Error('notification update failed');
      } catch {
        window.alert('تعذر حفظ حالة الإشعار.');
        return;
      }
    }
    setNotifications(prev => prev.map(item => item.id === id ? { ...item, isRead: true } : item));
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', { method: 'POST', credentials: 'include' });
      if (!response.ok) throw new Error('notification update failed');
    } catch {
      window.alert('تعذر حفظ حالة الإشعارات.');
      return;
    }
    setNotifications(prev => prev.map(item => item.userId === currentUser.id ? { ...item, isRead: true } : item));
  };

  const acknowledgeCircular = async (circularId: string, userId: string) => {
    try {
      const response = await fetch(`/api/circulars/${encodeURIComponent(circularId)}/acknowledge`, {
        method: 'PATCH', credentials: 'include',
      });
      const payload = await response.json() as { acknowledgedAt?: string; message?: string };
      if (!response.ok) return { ok: false, message: payload.message || 'تعذر حفظ إقرار القراءة.' };
      setCirculars(previous => previous.map(circular => circular.id !== circularId ? circular : {
        ...circular,
        recipients: circular.recipients.map(recipient => recipient.userId === userId
          ? { ...recipient, hasAcknowledged: true, acknowledgedAt: payload.acknowledgedAt }
          : recipient),
      }));
      return { ok: true };
    } catch {
      return { ok: false, message: 'تعذر الاتصال بالخادم؛ لم يُحفظ إقرار القراءة.' };
    }
  };

  const addWorkLog = async (logData: Omit<WorkLog, 'id'>) => {
    try {
      const response = await fetch('/api/work-logs', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: logData.userId,
          workDate: logData.date,
          area: logData.area,
          workMode: logData.location,
          description: logData.activityAr,
          outputLink: logData.outputLink,
        }),
      });
      const payload = await response.json() as { workLog?: WorkLog; message?: string };
      if (!response.ok || !payload.workLog) return { ok: false, message: payload.message || 'تعذر حفظ سجل العمل.' };
      setWorkLogs(previous => [payload.workLog!, ...previous.filter(log => log.id !== payload.workLog!.id)]);
      return { ok: true };
    } catch {
      return { ok: false, message: 'تعذر الاتصال بالخادم؛ لم يُحفظ سجل العمل.' };
    }
  };

  const updateWorkLog = async (id: string, update: Partial<WorkLog>) => {
    try {
      const response = await fetch(`/api/work-logs/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          area: update.area,
          workMode: update.location,
          description: update.activityAr,
          outputLink: update.outputLink || '',
        }),
      });
      const payload = await response.json() as { workLog?: WorkLog; message?: string };
      if (!response.ok || !payload.workLog) return { ok: false, message: payload.message || 'تعذر تعديل السجل.' };
      setWorkLogs(previous => previous.map(log => log.id === id ? payload.workLog! : log));
      return { ok: true };
    } catch {
      return { ok: false, message: 'تعذر الاتصال بالخادم؛ لم يُعدّل السجل.' };
    }
  };

  const deleteWorkLog = async (id: string) => {
    try {
      const response = await fetch(`/api/work-logs/${encodeURIComponent(id)}`, {
        method: 'DELETE', credentials: 'include',
      });
      const payload = await response.json() as { message?: string };
      if (!response.ok) return { ok: false, message: payload.message || 'تعذر حذف السجل.' };
      setWorkLogs(previous => previous.filter(log => log.id !== id));
      return { ok: true };
    } catch {
      return { ok: false, message: 'تعذر الاتصال بالخادم؛ لم يُحذف السجل.' };
    }
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

  const persistTask = async (task: Task) => {
    try {
      const response = await fetch(task.id.match(/^[0-9a-f]{8}-/i) ? `/api/assignments/${encodeURIComponent(task.id)}` : '/api/assignments', {
        method: task.id.match(/^[0-9a-f]{8}-/i) ? 'PUT' : 'POST',
        credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titleAr: task.titleAr, descriptionAr: task.descriptionAr, priority: task.priority,
          type: task.type, deadline: task.deadline, isDraft: task.isDraft,
          assigneeIds: task.recipients.map(recipient => recipient.userId),
          referenceUrl: task.referenceUrl, reminderOptions: task.reminderOptions,
          emailDelivery: task.emailDelivery, smsDelivery: task.smsDelivery,
        }),
      });
      const payload = await response.json() as { task?: Task; message?: string };
      if (!response.ok || !payload.task) return { ok: false, message: payload.message || 'تعذر حفظ التكليف.' };
      setTasks(previous => previous.some(existing => existing.id === payload.task!.id)
        ? previous.map(existing => existing.id === payload.task!.id ? payload.task! : existing)
        : [payload.task!, ...previous]);
      return { ok: true };
    } catch {
      return { ok: false, message: 'تعذر الاتصال بالخادم؛ لم يُحفظ التكليف.' };
    }
  };
  const saveTask = (task: Task) => persistTask({ ...task, isDraft: true });

  const sendTask = async (task: Task) => {
    const result = await persistTask({ ...task, isDraft: false });
    if (!result.ok) return result;
    const sent = { ...task, isDraft: false };
    const newItems: NotificationItem[] = sent.recipients.map(recipient => ({
      id: `NTF-${sent.id}-${recipient.userId}`, userId: recipient.userId, type: 'TASK_ASSIGNED',
      titleAr: 'تكليف عمل جديد', titleEn: 'New assignment',
      messageAr: `تم إسناد تكليف جديد: ${sent.titleAr}.`, messageEn: `A new assignment was sent: ${sent.titleAr}.`,
      timestamp: new Date().toISOString(), isRead: false, actionUrl: `/app/assignments/${sent.id}`,
    }));
    setNotifications(previous => [...newItems.filter(item => !previous.some(old => old.id === item.id)), ...previous]);
    return { ok: true };
  };
  const updateTask = async (taskId: string, update: (task: Task) => Task) => {
    const existing = tasks.find(task => task.id === taskId);
    if (!existing) return { ok: false, message: 'التكليف غير موجود.' };
    const updated = update(existing);
    const changedRecipient = updated.recipients.find(recipient => {
      const previous = existing.recipients.find(item => item.userId === recipient.userId);
      return previous && JSON.stringify(previous) !== JSON.stringify(recipient);
    });
    if (changedRecipient && /^[0-9a-f]{8}-/i.test(taskId)) {
      try {
        const response = await fetch(`/api/assignments/${encodeURIComponent(taskId)}/recipients/${encodeURIComponent(changedRecipient.userId)}`, {
          method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: changedRecipient.status,
            submissionLinks: changedRecipient.submissionLinks || (changedRecipient.submissionLink ? [changedRecipient.submissionLink] : []),
            submissionNote: changedRecipient.submissionNote,
            reviewNote: changedRecipient.reviewNote,
          }),
        });
        const payload = await response.json() as { message?: string };
        if (!response.ok) return { ok: false, message: payload.message || 'تعذر حفظ تحديث التكليف.' };
      } catch {
        return { ok: false, message: 'تعذر الاتصال بالخادم؛ لم يُحفظ تحديث التكليف.' };
      }
    }
    setTasks(previous => previous.map(task => task.id === taskId ? updated : task));
    return { ok: true };
  };
  const updateProjects = async (update: (current: Project[]) => Project[]) => {
    const next = update(projects);
    const created = next.find(project => !projects.some(existing => existing.id === project.id));
    const changed = next.find(project => {
      const existing = projects.find(item => item.id === project.id);
      return existing && JSON.stringify(existing) !== JSON.stringify(project);
    });
    const project = created || changed;
    if (!project) return { ok: true };
    const body = {
      titleAr: project.titleAr, descriptionAr: project.descriptionAr, ownerId: project.ownerId,
      status: project.status, startDate: project.startedAt || '', expectedEndDate: project.expectedEndDate || '',
      relatedTaskId: project.relatedTaskId || '',
      stages: project.stages.map(stage => ({ ...stage, titleAr: stage.titleAr, dueDate: stage.dueDate || '' })),
    };
    try {
      const response = await fetch(created ? '/api/projects' : `/api/projects/${encodeURIComponent(project.id)}`, {
        method: created ? 'POST' : 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const payload = await response.json() as { project?: Project; message?: string };
      if (!response.ok || (created && !payload.project)) {
        const message = payload.message || 'تعذر حفظ المشروع.';
        window.alert(message);
        return { ok: false, message };
      }
      setProjects(created
        ? [payload.project!, ...projects]
        : next);
      return { ok: true };
    } catch {
      const message = 'تعذر الاتصال بالخادم؛ لم يُحفظ المشروع.';
      window.alert(message);
      return { ok: false, message };
    }
  };
  const saveCircular = async (circular: Circular, publish: boolean) => {
    try {
      const isDraftUpdate = !circular.id.startsWith('CIR-') && circulars.some(item => item.id === circular.id && item.isDraft);
      const response = await fetch(isDraftUpdate ? `/api/circulars/${encodeURIComponent(circular.id)}` : '/api/circulars', {
        method: isDraftUpdate ? 'PUT' : 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titleAr: circular.titleAr, contentAr: circular.contentAr, targetAudience: circular.targetAudience,
          recipientIds: circular.recipients.map(recipient => recipient.userId),
          notifyEmail: circular.emailDelivery, notifySms: circular.smsDelivery,
          parentId: circular.parentId, publish,
        }),
      });
      const payload = await response.json() as { circular?: Circular; message?: string };
      if (!response.ok || !payload.circular) {
        const message = payload.message || 'تعذر حفظ التعميم.';
        window.alert(message);
        return { ok: false, message };
      }
      setCirculars(previous => [payload.circular!, ...previous.filter(item => item.id !== payload.circular!.id)]);
      if (publish) {
        try {
          const notificationResponse = await fetch('/api/notifications', { credentials: 'include' });
          if (notificationResponse.ok) {
            const notificationPayload = await notificationResponse.json() as { notifications?: NotificationItem[] };
            if (notificationPayload.notifications) {
              setNotifications(previous => [
                ...notificationPayload.notifications!,
                ...previous.filter(item => item.userId !== currentUser.id || !notificationPayload.notifications!.some(saved => saved.id === item.id)),
              ]);
            }
          }
        } catch { /* the published circular is already saved; notifications reload at next sign-in */ }
      }
      return { ok: true, circular: payload.circular };
    } catch {
      const message = 'تعذر الاتصال بالخادم؛ لم يُحفظ التعميم.';
      window.alert(message);
      return { ok: false, message };
    }
  };
  const recordCircularReminder = async (circularId: string, userId: string) => {
    try {
      const response = await fetch(`/api/circulars/${encodeURIComponent(circularId)}/recipients/${encodeURIComponent(userId)}/reminder`, {
        method: 'POST', credentials: 'include',
      });
      const payload = await response.json() as { reminderCount?: number; message?: string };
      if (!response.ok || payload.reminderCount === undefined) return { ok: false, message: payload.message || 'تعذر حفظ محاولة التذكير.' };
      setCirculars(previous => previous.map(circular => circular.id !== circularId ? circular : {
        ...circular,
        recipients: circular.recipients.map(recipient => recipient.userId === userId
          ? { ...recipient, reminderCount: payload.reminderCount }
          : recipient),
      }));
      return { ok: true, reminderCount: payload.reminderCount };
    } catch {
      return { ok: false, message: 'تعذر الاتصال بالخادم؛ لم تُحفظ محاولة التذكير.' };
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
        login,
        isAuthenticated,
        isAuthLoading,
        welcomeGreetingOpen,
        dismissWelcomeGreeting,
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
        updateWorkLog,
        deleteWorkLog,
        saveTask,
        sendTask,
        updateTask,
        updateProjects,
        saveCircular,
        recordCircularReminder,
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
