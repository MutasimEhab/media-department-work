import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';
import { User, Task, Project, Circular, WorkLog, NotificationItem, UserRole, WorkDateException } from '../types';
import {
  MOCK_USERS,
  FROZEN_DEMO_DATE,
} from '../data/mockData';
import { translations, Language } from '../i18n/translations';
import { AppPermission, DEFAULT_ROLE_PERMISSIONS, roleHasPermission, RolePermissionOverrides } from '../auth/permissions';
import { ToastItem, ToastType } from '../components/ui/Toast';

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
  notify: (message: string, type?: ToastType) => void;
  dismissToast: (id: string) => void;
  toasts: ToastItem[];
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
  updateRolePermission: (role: string, permission: AppPermission, enabled: boolean) => Promise<boolean>;
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
  accountTypeCode?: string;
  accountTypeNameAr?: string;
  jobTitleAr: string;
  employeeNumber?: string;
  avatar?: string;
  email?: string;
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
    accountTypeCode: user.accountTypeCode,
    accountTypeNameAr: user.accountTypeNameAr,
    jobTitleAr: user.jobTitleAr,
    employeeNumber: user.employeeNumber,
    avatar: user.avatar,
    jobTitleEn: user.jobTitleAr,
    email: user.email,
    mobile: user.mobile,
    isActive: user.isActive,
    departmentId: user.departmentId,
    departmentAr: user.departmentAr,
    departmentEn: user.departmentAr,
    preferredLanguage: 'ar',
  };
}

function permissionKeyForUser(user: Pick<User, 'accountTypeCode' | 'role'>): string {
  const accountTypeCode = user.accountTypeCode;
  if (accountTypeCode === 'system_admin') return 'ADMIN';
  if (accountTypeCode === 'department_manager') return 'MANAGER';
  if (accountTypeCode === 'deputy_manager') return 'DEPUTY';
  if (accountTypeCode === 'employee') return 'EMPLOYEE';
  return accountTypeCode || user.role;
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
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const dismissToast = useCallback((id: string) => setToasts(previous => previous.filter(item => item.id !== id)), []);
  const notify = useCallback((message: string, type: ToastType = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts(previous => [...previous.slice(-3), { id, type, message }]);
    window.setTimeout(() => setToasts(previous => previous.filter(item => item.id !== id)), 5000);
  }, []);
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

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    const refreshNotifications = async () => {
      if (document.visibilityState === 'hidden') return;
      try {
        const response = await fetch('/api/notifications', { credentials: 'include', cache: 'no-store' });
        if (!response.ok) return;
        const payload = await response.json() as { notifications?: NotificationItem[] };
        if (!cancelled && payload.notifications) setNotifications(payload.notifications);
      } catch { /* Keep the last saved notification list while offline. */ }
    };
    void refreshNotifications();
    const interval = window.setInterval(() => void refreshNotifications(), 15_000);
    const onFocus = () => void refreshNotifications();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [isAuthenticated, currentUser.id]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    fetch('/api/role-permissions', { credentials: 'include' })
      .then(async response => {
        const payload = await response.json() as { rolePermissions?: RolePermissionOverrides };
        if (!response.ok) return null;
        return payload.rolePermissions;
      })
      .then(permissions => { if (!cancelled && permissions) setRolePermissions(permissions); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [isAuthenticated, currentUser.id]);

  const [users, setUsers] = useState<User[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermissionOverrides>({
    MANAGER: [...DEFAULT_ROLE_PERMISSIONS.MANAGER],
    DEPUTY: [...DEFAULT_ROLE_PERMISSIONS.DEPUTY],
    EMPLOYEE: [...DEFAULT_ROLE_PERMISSIONS.EMPLOYEE],
  });
  const [exceptions, setExceptions] = useState<WorkDateException[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [pendingWork, setPendingWork] = useState<WorkLog[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
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
          setWorkLogs(payload.workLogs!);
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
        setNotifications(notificationPayload.notifications!);
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


  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
  const clearAccountData = () => {
    setUsers([]); setTasks([]); setProjects([]); setCirculars([]); setWorkLogs([]);
    setPendingWork([]); setNotifications([]); setExceptions([]);
    setRolePermissions({
      MANAGER: [...DEFAULT_ROLE_PERMISSIONS.MANAGER],
      DEPUTY: [...DEFAULT_ROLE_PERMISSIONS.DEPUTY],
      EMPLOYEE: [...DEFAULT_ROLE_PERMISSIONS.EMPLOYEE],
    });
  };
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
      clearAccountData();
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
    clearAccountData();
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
        notify('تعذر حفظ حالة الإشعار.', 'error');
        return;
      }
    }
    setNotifications(prev => prev.map(item => item.id === id ? { ...item, isRead: true } : item));
    notify('تم تحديث حالة الإشعار.', 'success');
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', { method: 'POST', credentials: 'include' });
      if (!response.ok) throw new Error('notification update failed');
    } catch {
      notify('تعذر حفظ حالة الإشعارات.', 'error');
      return;
    }
    setNotifications(prev => prev.map(item => item.userId === currentUser.id ? { ...item, isRead: true } : item));
    notify('تم تعليم الإشعارات كمقروءة.', 'success');
  };

  const acknowledgeCircular = async (circularId: string, userId: string) => {
    try {
      const response = await fetch(`/api/circulars/${encodeURIComponent(circularId)}/acknowledge`, {
        method: 'PATCH', credentials: 'include',
      });
      const payload = await response.json() as { acknowledgedAt?: string; message?: string };
      if (!response.ok) {
        const message = payload.message || 'تعذر حفظ إقرار القراءة.';
        notify(message, 'error');
        return { ok: false, message };
      }
      setCirculars(previous => previous.map(circular => circular.id !== circularId ? circular : {
        ...circular,
        recipients: circular.recipients.map(recipient => recipient.userId === userId
          ? { ...recipient, hasAcknowledged: true, acknowledgedAt: payload.acknowledgedAt }
          : recipient),
      }));
      notify('تم تسجيل إقرار قراءة التعميم.', 'success');
      return { ok: true };
    } catch {
      const message = 'تعذر الاتصال بالخادم؛ لم يُحفظ إقرار القراءة.';
      notify(message, 'error');
      return { ok: false, message };
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
      if (!response.ok || !payload.workLog) {
        const message = payload.message || 'تعذر حفظ سجل العمل.';
        notify(message, 'error');
        return { ok: false, message };
      }
      setWorkLogs(previous => [payload.workLog!, ...previous.filter(log => log.id !== payload.workLog!.id)]);
      notify('تم حفظ سجل العمل بنجاح.', 'success');
      return { ok: true };
    } catch {
      const message = 'تعذر الاتصال بالخادم؛ لم يُحفظ سجل العمل.';
      notify(message, 'error');
      return { ok: false, message };
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
      if (!response.ok || !payload.workLog) {
        const message = payload.message || 'تعذر تعديل السجل.';
        notify(message, 'error');
        return { ok: false, message };
      }
      setWorkLogs(previous => previous.map(log => log.id === id ? payload.workLog! : log));
      notify('تم تعديل سجل العمل.', 'success');
      return { ok: true };
    } catch {
      const message = 'تعذر الاتصال بالخادم؛ لم يُعدّل السجل.';
      notify(message, 'error');
      return { ok: false, message };
    }
  };

  const deleteWorkLog = async (id: string) => {
    try {
      const response = await fetch(`/api/work-logs/${encodeURIComponent(id)}`, {
        method: 'DELETE', credentials: 'include',
      });
      const payload = await response.json() as { message?: string };
      if (!response.ok) {
        const message = payload.message || 'تعذر حذف السجل.';
        notify(message, 'error');
        return { ok: false, message };
      }
      setWorkLogs(previous => previous.filter(log => log.id !== id));
      notify('تم حذف سجل العمل نهائياً.', 'success');
      return { ok: true };
    } catch {
      const message = 'تعذر الاتصال بالخادم؛ لم يُحذف السجل.';
      notify(message, 'error');
      return { ok: false, message };
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
      if (!response.ok || !payload.task) {
        const message = payload.message || 'تعذر حفظ التكليف.';
        notify(message, 'error');
        return { ok: false, message };
      }
      setTasks(previous => previous.some(existing => existing.id === payload.task!.id)
        ? previous.map(existing => existing.id === payload.task!.id ? payload.task! : existing)
        : [payload.task!, ...previous]);
      notify(task.isDraft ? 'تم حفظ التكليف كمسودة.' : 'تم إرسال التكليف وإشعار الموظفين.', 'success');
      return { ok: true, task: payload.task };
    } catch {
      const message = 'تعذر الاتصال بالخادم؛ لم يُحفظ التكليف.';
      notify(message, 'error');
      return { ok: false, message };
    }
  };
  const saveTask = (task: Task) => persistTask({ ...task, isDraft: true });

  const sendTask = async (task: Task) => {
    const result = await persistTask({ ...task, isDraft: false });
    if (!result.ok) return result;
    try {
      const response = await fetch('/api/notifications', { credentials: 'include', cache: 'no-store' });
      if (response.ok) {
        const payload = await response.json() as { notifications?: NotificationItem[] };
        if (payload.notifications) setNotifications(payload.notifications);
      }
    } catch { /* Notification polling will refresh the list; assignment send already succeeded. */ }
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
        if (!response.ok) {
          const message = payload.message || 'تعذر حفظ تحديث التكليف.';
          notify(message, 'error');
          return { ok: false, message };
        }
      } catch {
        const message = 'تعذر الاتصال بالخادم؛ لم يُحفظ تحديث التكليف.';
        notify(message, 'error');
        return { ok: false, message };
      }
    }
    setTasks(previous => previous.map(task => task.id === taskId ? updated : task));
    notify('تم تحديث حالة التكليف.', 'success');
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
        notify(message, 'error');
        return { ok: false, message };
      }
      setProjects(created
        ? [payload.project!, ...projects]
        : next);
      notify(created ? 'تم إنشاء المشروع.' : 'تم تحديث المشروع.', 'success');
      return { ok: true };
    } catch {
      const message = 'تعذر الاتصال بالخادم؛ لم يُحفظ المشروع.';
      notify(message, 'error');
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
        notify(message, 'error');
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
      notify(publish ? 'تم نشر التعميم وإرسال إشعار للمستلمين.' : 'تم حفظ التعميم كمسودة.', 'success');
      return { ok: true, circular: payload.circular };
    } catch {
      const message = 'تعذر الاتصال بالخادم؛ لم يُحفظ التعميم.';
      notify(message, 'error');
      return { ok: false, message };
    }
  };
  const recordCircularReminder = async (circularId: string, userId: string) => {
    try {
      const response = await fetch(`/api/circulars/${encodeURIComponent(circularId)}/recipients/${encodeURIComponent(userId)}/reminder`, {
        method: 'POST', credentials: 'include',
      });
      const payload = await response.json() as { reminderCount?: number; message?: string };
      if (!response.ok || payload.reminderCount === undefined) {
        const message = payload.message || 'تعذر حفظ محاولة التذكير.';
        notify(message, 'error');
        return { ok: false, message };
      }
      setCirculars(previous => previous.map(circular => circular.id !== circularId ? circular : {
        ...circular,
        recipients: circular.recipients.map(recipient => recipient.userId === userId
          ? { ...recipient, reminderCount: payload.reminderCount }
          : recipient),
      }));
      notify('تم تسجيل التذكير.', 'success');
      return { ok: true, reminderCount: payload.reminderCount };
    } catch {
      const message = 'تعذر الاتصال بالخادم؛ لم تُحفظ محاولة التذكير.';
      notify(message, 'error');
      return { ok: false, message };
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
  const addUser = (user:User) => { if(users.some(u=>(Boolean(u.email)&&Boolean(user.email)&&u.email?.toLowerCase()===user.email?.toLowerCase())||Boolean(user.username&&u.username?.toLowerCase()===user.username.toLowerCase())))return false;setUsers(prev=>[...prev,user]);return true; };
  const canAccess = (permission: AppPermission) => currentUser.role === 'ADMIN' || roleHasPermission(permissionKeyForUser(currentUser), permission, rolePermissions);
  const updateRolePermission = async (role: string, permission: AppPermission, enabled: boolean) => {
    if (currentUser.role !== 'ADMIN' || role === 'ADMIN' || role === 'system_admin') return false;
    const current = rolePermissions[role] || [...(DEFAULT_ROLE_PERMISSIONS[role as UserRole] || [])];
    const nextPermissions = enabled
      ? [...new Set([...current, permission])]
      : current.filter(item => item !== permission);
    try {
      const response = await fetch(`/api/role-permissions/${encodeURIComponent(role)}`, {
        method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissionCodes: nextPermissions }),
      });
      const payload = await response.json() as { message?: string };
      if (!response.ok) throw new Error(payload.message || 'تعذر حفظ الصلاحية.');
      setRolePermissions(previous => ({ ...previous, [role]: nextPermissions }));
      notify('تم تحديث صلاحيات نوع الحساب.', 'success');
      return true;
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : 'تعذر الاتصال بالخادم؛ لم تُحفظ الصلاحية.', 'error');
      return false;
    }
  };
  const refreshExceptions = async () => {
    try {
      const response = await fetch('/api/work-date-exceptions', { credentials: 'include' });
      const payload = await response.json() as { exceptions?: WorkDateException[] };
      if (response.ok && payload.exceptions) setExceptions(payload.exceptions);
    } catch { /* show the existing server-backed list on the next load */ }
  };
  const addException = (exception: WorkDateException) => {
    void fetch('/api/work-date-exceptions', {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: exception.userId, workDate: exception.dates[0], reason: exception.reason }),
    }).then(async response => {
      const payload = await response.json() as { message?: string };
      if (!response.ok) throw new Error(payload.message || 'تعذر حفظ الاستثناء.');
      await refreshExceptions();
      notify('تم تسجيل الاستثناء وإشعار الموظف.', 'success');
    }).catch(cause => notify(cause instanceof Error ? cause.message : 'تعذر الاتصال بالخادم.', 'error'));
  };
  const revokeException = (id: string) => {
    void fetch(`/api/work-date-exceptions/${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include' })
      .then(async response => { const payload = await response.json() as { message?: string }; if (!response.ok) throw new Error(payload.message || 'تعذر إلغاء الاستثناء.'); await refreshExceptions(); notify('تم إلغاء الاستثناء.', 'success'); })
      .catch(cause => notify(cause instanceof Error ? cause.message : 'تعذر الاتصال بالخادم.', 'error'));
  };
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
        notify,
        dismissToast,
        toasts,
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
