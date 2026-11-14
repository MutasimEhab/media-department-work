export type UserRole = 'ADMIN' | 'MANAGER' | 'DEPUTY' | 'EMPLOYEE';

export interface User {
  id: string; // U-001, etc.
  arabicName: string;
  englishName: string;
  role: UserRole;
  accountTypeCode?: string;
  accountTypeNameAr?: string;
  jobTitleAr: string;
  jobTitleEn: string;
  username?: string;
  employeeNumber?: string;
  email?: string;
  avatar?: string;
  isActive: boolean;
  departmentAr: string;
  departmentEn: string;
  departmentId?: string;
  mobile?: string;
  preferredLanguage?: 'ar' | 'en';
  lastSignIn?: string;
}

export interface WorkDateException {
  id: string; userId: string; dates: string[]; grantedBy: string; createdAt: string; reason: string; expiresAt?: string; revokedAt?: string;
}

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskType = 'NORMAL' | 'SOCIAL_MEDIA';
export type AssignmentCategory = 'MATERIALS_REQUIRED' | 'SOCIAL_MEDIA';
export type TaskRecipientStatus = 'RECEIVED' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'RETURNED_FOR_REVISION';

export interface TaskRecipient {
  userId: string;
  userNameAr: string;
  userNameEn: string;
  status: TaskRecipientStatus;
  statusUpdatedAt: string; // 12h format or ISO
  submissionLink?: string; // Google Drive link only
  submissionNote?: string;
  reviewedBy?: string;
  reviewNote?: string;
  submissionLinks?: string[];
  firstSubmittedAt?: string;
}

export interface Task {
  id: string; // TSK-101
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  creatorId: string;
  creatorNameAr: string;
  creatorNameEn: string;
  priority: TaskPriority;
  type: TaskType;
  types?: AssignmentCategory[];
  deadline: string; // e.g. "2026-11-02 05:00 PM"
  createdAt: string;
  isDraft: boolean;
  projectId?: string;
  referenceUrl?: string;
  reminderOptions?: string[];
  emailDelivery?: boolean;
  smsDelivery?: boolean;
  recipients: TaskRecipient[];
  isOverdue?: boolean;
}

export interface ProjectStage {
  id: number;
  titleAr: string;
  titleEn: string;
  isCompleted: boolean;
  dueDate?: string;
  completedAt?: string;
  driveLink?: string;
}

export interface Project {
  id: string; // PRJ-201
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  ownerId: string;
  ownerNameAr: string;
  ownerNameEn: string;
  memberIds?: string[];
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CLOSED';
  expectedEndDate?: string;
  startedAt?: string;
  stages: ProjectStage[];
  relatedTaskId?: string;
}

export interface CircularRecipient {
  userId: string;
  userNameAr: string;
  userNameEn: string;
  hasAcknowledged: boolean;
  acknowledgedAt?: string; // e.g. "09:05 AM"
  reminderCount?: number;
}

export interface Circular {
  id: string; // CIR-301
  departmentId?: string;
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
  issuerId: string;
  issuerNameAr: string;
  issuerNameEn: string;
  issuedAt: string; // e.g. "2026-10-31 08:30 AM"
  targetAudience: 'EMPLOYEES_ONLY' | 'MANAGEMENT_ONLY' | 'EVERYONE' | 'SPECIFIC';
  isDraft: boolean;
  recipients: CircularRecipient[];
  parentId?: string;
  emailDelivery?: boolean;
  smsDelivery?: boolean;
}

export type WorkLocation = 'OFFICE' | 'FIELD';

export interface WorkLog {
  id: string; // LOG-401
  userId: string;
  userNameAr: string;
  userNameEn: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "10:15 AM"
  activityAr: string;
  activityEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  location: WorkLocation;
  area?: string;
  relatedTaskId?: string;
  projectId?: string;
  projectTitleAr?: string;
  projectTitleEn?: string;
  outputLink?: string; // Google drive link only
  isException?: boolean;
}

export type NotificationType = 'TASK_ASSIGNED' | 'TASK_SUBMITTED' | 'PROJECT_ASSIGNED' | 'CIRCULAR_PUBLISHED' | 'TASK_AWAITING_REVIEW' | 'WORK_LOG_MISSING' | 'WORK_DATE_EXCEPTION';

export interface NotificationItem {
  id: string; // NTF-501
  userId: string; // recipient
  type: NotificationType;
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  timestamp: string;
  isRead: boolean;
  actionUrl: string;
}

export interface MonthlyScoreFixture {
  userId: string;
  month: string; // "10/2026"
  eligibleAssignments: number;
  completedAssignments: number;
  completedOnTime: number;
  requiredSocialMediaMaterials: number;
  submittedSocialMediaMaterials: number;
  scoreC: number; // Completion rate
  scoreT: number; // On-time rate
  scoreS: number; // Social media completion rate
  totalScore: number; // Weighted 40/40/20 provisional
}
