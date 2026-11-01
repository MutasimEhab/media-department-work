# Software Requirements Specification (SRS)
## Media Department Work Management System

**Version:** 0.1 (Draft for Review) · **Date:** October 31, 2026 · **Based on:** BRD Version 0.1

> Items marked **[Assumption]** were not included in your answers and are suggestions from me. They should be reviewed alongside the open questions in the BRD (Section 16).

## 1. Introduction

### 1.1 Purpose

This document describes the functional and non-functional requirements for the first release (MVP) of the Media Department Work Management System in sufficient detail to design, develop, and test it. Acceptance tests will be derived from these requirements.

### 1.2 Scope

A bilingual (Arabic/English), mobile-responsive, cloud-based web platform covering accounts and permissions, daily work logs, assignments, projects, circulars, notifications, and reporting and performance dashboards. Exclusions are listed in Section 4.2 of the BRD.

### 1.3 Definitions

| Term | Meaning |
|---|---|
| ADMIN | System Administrator role |
| MANAGER | Department Manager role |
| DEPUTY | Deputy Department Manager role |
| EMPLOYEE | Employee role (photographer and video editor, designer and content writer, and any job title added later) |
| Assignee | Employee to whom an assignment has been assigned |
| Approver | Person who reviews a submission: MANAGER, DEPUTY, or ADMIN [Assumption] |
| Drive link | A link under the drive.google.com or docs.google.com domain |
| RBAC | Role-Based Access Control |
| Soft deletion | Marking a record as deleted without removing it from the database |

### 1.4 Priority Levels

**Critical:** Required before launch · **High:** Required for the MVP but may be simplified if necessary · **Medium:** First to be deferred if time is limited.

## 2. General Description

### 2.1 Product Perspective

A standalone system with no current integrations with other systems. Deliverable files remain on Google Drive; the system stores only their links.

### 2.2 User Classes

| Class | Approximate Count [Assumption] | Usage |
|---|---|---|
| MANAGER / DEPUTY | 2 | Assigning and reviewing work, issuing circulars, and viewing reports |
| ADMIN | 1–2 | Managing users and settings and monitoring system stability |
| EMPLOYEE | Up to 12 | Logging daily work, receiving assignments, and submitting deliverables |

### 2.3 Operating Environment

Modern browsers (the latest two versions of Chrome, Safari, Edge, and Firefox) on desktop and mobile devices, with cloud hosting over HTTPS.

### 2.4 Design Principles

1. **No data loss:** Soft deletion, backups, and an audit trail.
2. **Simplicity:** Daily work entry in less than one minute.
3. **Secure by default:** Permissions are checked server-side for every request, not only in the UI.
4. **Internal notifications first:** Email and SMS are supplementary channels on which the workflow does not depend.
5. **Scalability:** Avoid hardcoding role names and job titles in application code, and keep the business logic adaptable for other departments in the future.

## 3. Proposed Technology Stack and Architecture [Assumption]

No technology preference has been specified. The following is a suitable proposal for two developers working within a short timeframe. It may be replaced by technologies the team knows well without changing the remaining requirements.

| Layer | Proposal | Rationale |
|---|---|---|
| Backend | Laravel (PHP), a recent stable version | Built-in authentication, authorization, queues, notifications, email, and localization |
| Database | Managed PostgreSQL or MySQL | Reliability, backups, and point-in-time recovery |
| Queues and caching | Redis | Asynchronous notification and reminder delivery with retries |
| Frontend | Blade with Livewire, or Vue 3 with Inertia + Tailwind CSS | Fast development and RTL/LTR support through logical CSS properties |
| PDF reporting | Headless Chromium (Browsershot) | Correct rendering of Arabic characters and report headers |
| Excel reporting | PhpSpreadsheet / Laravel Excel | Multiple worksheets and header images |
| Email | SMTP through a reliable provider | Delivery status tracking |
| SMS | An abstract API adapter to allow easy provider replacement | Avoiding dependency on a single provider |
| Deployment and monitoring | CI/CD (e.g., GitHub Actions), a staging environment, and an error-tracking tool | Addressing concerns about downtime and updates |

**Deployment architecture:** One stateless application + a separate queue worker + a managed database + backup storage in a separate location.

## 4. Roles and Permissions

“Own” means the user's own records only. All access restrictions are enforced on the server.

| Action | ADMIN | MANAGER | DEPUTY | EMPLOYEE |
|---|---|---|---|---|
| Create/edit/deactivate users | ✓ | — | — | — |
| Assign roles and job titles | ✓ | — | — | — |
| View user list | ✓ | ✓ | ✓ | — |
| Log daily work | — | — | — | Own |
| View daily work logs | All | All | All | Own |
| Create and send an assignment | ✓ | ✓ | ✓ | — |
| View assignments | All | All | All | Assigned to them |
| Acknowledge, update the status of, and submit an assignment | — | — | — | Assignee |
| Review a submission (approve/return) | ✓ | ✓ | ✓ | — |
| Comment on an assignment | ✓ | ✓ | ✓ | Own assignments |
| Create a project | ✓ | ✓ | ✓ | Own |
| View projects | All | All | All | Own |
| Issue circulars | ✓ | ✓ | ✓ | — |
| Read and acknowledge circulars | If addressed to them | If addressed to them | If addressed to them | If addressed to them |
| View acknowledgment status | ✓ | ✓ | ✓ | — |
| Enable email/SMS when sending | ✓ | ✓ | ✓ | — |
| Main dashboard | ✓ | ✓ | ✓ | Own dashboard |
| Reports and exports | All | All | All | Own |
| System settings, report header, and evaluation weights | ✓ | — | — | — |
| Audit log | ✓ | — | — | — |

## 5. Functional Requirements

### 5.1 Accounts and Authentication

| ID | Requirement | Priority |
|---|---|---|
| FR-AUTH-01 | Sign in using email address and password. | Critical |
| FR-AUTH-02 | Passwords must be at least 10 characters long, stored as secure hashes using a strong algorithm (Argon2id or bcrypt), and accounts must be locked for 15 minutes after 5 failed attempts. | Critical |
| FR-AUTH-03 | Password recovery via a one-time email link valid for one hour. | Critical |
| FR-AUTH-04 | Sessions expire after 30 minutes of inactivity (configurable), and other sessions are terminated when the password changes. | High |
| FR-AUTH-05 | Optional two-factor authentication (TOTP), recommended for ADMIN, MANAGER, and DEPUTY. | Medium |
| FR-USR-01 | ADMIN creates a user with the following information: Arabic and English names, email, mobile number, job title, role, and preferred language. The user receives an activation link. Self-registration is not allowed. | Critical |
| FR-USR-02 | Users can be edited, deactivated, and reactivated; permanent deletion is not permitted. | Critical |
| FR-USR-03 | Four fixed system roles (ADMIN, MANAGER, DEPUTY, EMPLOYEE) and an ADMIN-managed list of job titles that can be changed without code modifications. | Critical |
| FR-USR-04 | Deactivating a user immediately terminates their sessions while preserving their historical records. | Critical |
| FR-USR-05 | Reject any action that would leave the system without an active system administrator. | High |
| FR-USR-06 | A profile page for changing language, password, and contact details. | High |

### 5.2 Daily Work Logs

| ID | Requirement | Priority |
|---|---|---|
| FR-LOG-01 | Required fields: date (day and year are derived automatically), nature of work (free text), work area (free text), and work mode (office/field). | Critical |
| FR-LOG-02 | Optional fields: brief description, output link (Drive), and association with an assignment or project [Assumption]. | High |
| FR-LOG-03 | No fixed work categories; the system suggests values from the employee's previous entries to speed up data entry. | Medium |
| FR-LOG-04 | Entries are saved immediately without requiring approval. | Critical |
| FR-LOG-05 | Prevent future dates and allow backdated entries for up to 7 days (configurable) [Assumption]. | High |
| FR-LOG-06 | Entries can be edited and soft-deleted within 7 days. After that, they are locked and can only be unlocked by ADMIN. All changes are recorded in the audit log. | High |
| FR-LOG-07 | Warn users when they attempt to save a duplicate entry (same date and text). | High |
| FR-LOG-08 | A “My Logs” list with month, type, and search filters. | High |
| FR-LOG-09 | Management can view all employees' work logs with filters for employee, period, type, and area. | High |
| FR-LOG-10 | Logging compliance indicator = number of working days with recorded work ÷ number of working days in the month. Working days and holidays are defined in the settings. | High |

### 5.3 Assignments

| ID | Requirement | Priority |
|---|---|---|
| FR-TSK-01 | Assignment fields: title, description, priority (low/medium/high/urgent), deadline (required), one or more employees, type (normal/social media deliverable), and an optional reference link. | Critical |
| FR-TSK-02 | Save an assignment as a draft before sending it. | Critical |
| FR-TSK-03 | Sending creates an internal notification for each assignee, with two optional delivery channels: email and SMS. | Critical |
| FR-TSK-04 | Each assignee has an independent status: Sent → Received → In Progress → Submitted → Approved, or Returned (which moves it back to In Progress). | Critical |
| FR-TSK-05 | A “Receive” button records the time; a reminder is sent if the assignment is not received within 24 hours (configurable). | High |
| FR-TSK-06 | Submission requires at least one valid Drive link (validated by domain) and may include an optional note. | Critical |
| FR-TSK-07 | Review options: “Approve” or “Return for Revision,” with a mandatory comment when returning. | Critical |
| FR-TSK-08 | An assignment closes automatically once every assignee has been approved [Assumption]. Its creator can also close it manually or cancel it with a stated reason. | Critical |
| FR-TSK-09 | Default reminders go out 24 hours and 2 hours before the deadline, then daily when overdue, only to assignees who have not submitted. Reminder settings can be adjusted per assignment. | Critical |
| FR-TSK-10 | “Overdue” is a calculated state (deadline has passed and submission has not occurred), shown with a clear indicator and included in reports. | Critical |
| FR-TSK-11 | Changing the deadline or priority after sending notifies assignees; the system retains the original deadline, and timeliness is calculated against the latest approved deadline [Assumption]. | High |
| FR-TSK-12 | Add an employee to or remove an employee from a sent assignment before they submit it. | Medium |
| FR-TSK-13 | Text comments (up to 2,000 characters) can include links, but file uploads are not allowed. A comment can be flagged as an “Issue” to alert the creator. | Critical |
| FR-TSK-14 | A separate comment thread for each assignee (between that assignee and the approvers) preserves the privacy of each employee's work [Assumption]. Comments are hidden rather than deleted, retaining an audit trail. | High |
| FR-TSK-15 | Assignment list with status, priority, employee, deadline, and overdue filters, plus searching and sorting. | High |
| FR-TSK-16 | A timeline for each assignment displays status changes, comments, the actors, and timestamps. | High |

### 5.4 Projects

A project is work created within the system to document, organize, and track employees' activities and their stages (such as a “Deliver Materials” stage). It differs from an assignment: an assignment is a specific task sent by the manager, deputy, or system administrator to one or more employees with a priority and deadline, and is tracked through submission, review, and approval (definition approved by the project owner).

| ID | Requirement | Priority |
|---|---|---|
| FR-PRJ-01 | Create a project with a title, description, owner (employee), status (in progress/completed/closed), start date, expected end date, and optional assignment association. Employees create their own projects; management can create projects for any employee. | High |
| FR-PRJ-02 | Project stages: an ordered list in which each stage has a title, status (pending/completed), completion date, and optional Drive link. | High |
| FR-PRJ-03 | Progress percentage = completed stages ÷ total stages. | Medium |
| FR-PRJ-04 | The project owner and management can modify stages (add/reorder/complete); changes are recorded. | High |
| FR-PRJ-05 | Project list with status, owner, and period filters. Employees see only their own projects. | High |
| FR-PRJ-06 | Projects may be closed by their owner or management. Closed projects are read-only and can be reopened by ADMIN. | High |
| FR-PRJ-07 | Projects are included in the employee's monthly report. | High |

### 5.5 Circulars

| ID | Requirement | Priority |
|---|---|---|
| FR-CIR-01 | Circulars issued by MANAGER, DEPUTY, or ADMIN include a title, body (basic formatting: bold, lists, links), target audience, optional Drive links, and email and SMS options. | Critical |
| FR-CIR-02 | Audience options: “Everyone” (all active users), “Employees Only” (EMPLOYEE role), and “Specific People” (multi-select). | Critical |
| FR-CIR-03 | At publication, the recipient list is captured as a fixed snapshot, so later user changes do not affect it. | High |
| FR-CIR-04 | Save as a draft before publication. After publication, the text cannot be edited to preserve archive integrity; a linked “Correction” circular may be issued. | High |
| FR-CIR-05 | Acknowledgment requires an explicit “I Have Read” button. Merely opening a circular does not count as acknowledgment. The acknowledgment time is recorded. | Critical |
| FR-CIR-06 | Circular tracking screen for management: number of recipients, acknowledged and unacknowledged recipients, and a named list with acknowledgment times, plus export. | Critical |
| FR-CIR-07 | Automatic reminders to unacknowledged recipients after 24 hours, then every 48 hours for up to 3 reminders (configurable), plus a manual reminder button. | High |
| FR-CIR-08 | Archive of all published circulars with title, date, and issuer search. Employees see only circulars addressed to them. | High |
| FR-CIR-09 | Archiving does not delete a circular; it is marked “Archived” and hidden from the main list. | Medium |

### 5.6 Notifications

| ID | Requirement | Priority |
|---|---|---|
| FR-NTF-01 | Internal notification center: bell with an unread counter, chronological list, mark-as-read functionality, and direct links to the relevant assignment or circular. | Critical |
| FR-NTF-02 | Notifications are generated for the events listed in Section 9. | Critical |
| FR-NTF-03 | Email and SMS are optional: checkboxes are offered when sending an assignment or circular and are not enabled by default. Internal notifications are always sent. Assignment reminders use the channels chosen when the assignment was sent. | Critical |
| FR-NTF-04 | Delivery runs through an asynchronous queue with up to 3 retries at increasing intervals, logging the status of each attempt (pending/sent/failed). | High |
| FR-NTF-05 | Prevent duplicates through a unique key for each (event, recipient, channel) combination. | High |
| FR-NTF-06 | Delivery history screen for ADMIN to monitor failures and resend. | Medium |
| FR-NTF-07 | Do not send to users without valid email addresses or mobile numbers; record the outcome as “Unable to Deliver” and alert the sender. | High |
| FR-NTF-08 | Bilingual templates; each message uses the recipient's preferred language. | High |
| FR-NTF-09 | Short SMS messages contain a brief title and a system link, with no sensitive text. | Medium |

### 5.7 Performance, Reports, and Dashboards

| ID | Requirement | Priority |
|---|---|---|
| FR-RPT-01 | Calculate monthly indicators C, T, and S and the final score for each employee according to Section 10 of the BRD. | Critical |
| FR-RPT-02 | Attribute an assignment to the month of its approved deadline, label the current month “Provisional,” and exclude cancelled assignments. | Critical |
| FR-RPT-03 | An assignment is considered on time if the first submission timestamp ≤ the approved deadline. Resubmission after a return does not change that determination [Assumption]. | Critical |
| FR-RPT-04 | Formula weights and rating thresholds are configurable by ADMIN, and a snapshot of the weights used is stored with every issued report. | High |
| FR-RPT-05 | Employee monthly report: header, name, job title, month, issue date, indicator and score summary, daily work table, assignment table (title, priority, deadline, submission date, status, on-time/overdue), and projects. | Critical |
| FR-RPT-06 | Report formats: on-screen, PDF, and Excel (worksheets: Summary, Work Logs, Assignments, Projects). The header appears in the PDF and at the top of the first Excel worksheet. | Critical |
| FR-RPT-07 | ADMIN uploads the report header (PNG/SVG logo up to 2 MB, organization name, additional text), which is applied to all reports. | Critical |
| FR-RPT-08 | Report language follows the interface language at export time, with an option to choose the other language. | High |
| FR-RPT-09 | Employees can view and export only their own reports; management can export any employee's report. All exports are recorded in the audit log. | Critical |
| FR-RPT-10 | Department-wide report comparing employees for a selected month (PDF/Excel), available to management. | High |
| FR-DSH-01 | Management dashboard: cards (active assignments, overdue assignments, awaiting review, unacknowledged circulars) and charts (assignments by status, on-time performance across months, office/field work breakdown, employee ranking by score), with month and employee filters. | High |
| FR-DSH-02 | Employee dashboard: my active and overdue assignments, my work logs this month, my provisional score, and unacknowledged circulars. | High |
| FR-DSH-03 | Each dashboard metric opens its underlying detailed list. | Medium |

### 5.8 General Requirements, Auditing, and Backups

| ID | Requirement | Priority |
|---|---|---|
| FR-GEN-01 | Arabic (RTL) and English (LTR), with instant switching saved to the user profile; all UI text is stored in translation files, and names have separate fields for each language. | Critical |
| FR-GEN-02 | Gregorian dates and Latin numerals by default [Assumption], with a configurable time zone. | High |
| FR-GEN-03 | Responsive interface from a width of 360 pixels; tables turn into cards on mobile. | Critical |
| FR-GEN-04 | ADMIN settings: organization name and report header, time zone, working days and holidays, log editing window, reminder values, evaluation weights, and session policy. | Critical |
| FR-AUD-01 | Immutable audit log that cannot be edited or deleted through the interface: actor, timestamp, action, entity, before/after values, and IP address. | Critical |
| FR-AUD-02 | Audit events include successful and failed logins, user and role management, assignment and status changes, circular publication, settings, exports, and edits or deletions of daily work logs. | Critical |
| FR-AUD-03 | ADMIN can search audit records with actor, action, and date-range filters. | High |
| FR-BKP-01 | Automatically encrypted daily backups stored off the primary server and retained for 30 days, plus weekly backups retained for 12 weeks [Assumption]. | Critical |
| FR-BKP-02 | A documented monthly restoration test, with a written recovery procedure. | High |
| FR-BKP-03 | A basic system health dashboard for ADMIN: most recent successful backup, queue size, and failed notifications. | Medium |

## 6. State Machines

### 6.1 Assignment State (Assignment Level)

**Draft → Sent (Active) → Closed**. Cancellation is possible from either “Draft” or “Active” → **Cancelled**, with a reason. An assignment closes automatically once all assignees have been approved, or manually by its creator.

### 6.2 Assignee State (Independently for Each Employee)

| From | To | Actor | Condition | Effect |
|---|---|---|---|---|
| — | Sent | Creator | A deadline and at least one employee are specified | Internal notification, and email/SMS if selected |
| Sent | Received | Assignee | — | Record `received_at` |
| Received | In Progress | Assignee | — | Record `started_at` |
| In Progress | Submitted | Assignee | Valid Drive link | Record `delivered_at` (the first submission time is retained and never changed), and notify the creator |
| Submitted | Approved | Approver | — | Record `approved_at`, and notify the employee |
| Submitted | In Progress (Returned) | Approver | Mandatory comment | Notify the employee and record the return in the timeline |
| Any state other than Approved | Cancelled | Creator | Reason provided | Notify the employee and exclude it from performance calculations |

**Rules:** No skipping states or moving backward except when a submission is returned. State transitions use optimistic locking or a state condition in the query so double-clicking or two concurrent requests cannot produce duplicate transitions or duplicate notifications. “Overdue” is a calculated state, not a stored state.

## 7. Use Cases

| ID | Name | Actor | Main Flow | Exceptions |
|---|---|---|---|---|
| UC-01 | Sign in | Everyone | Enter email and password; the system verifies them and opens the dashboard appropriate to the role. | Invalid credentials: generic message and attempt counter; lock for 15 minutes after 5 attempts. Deactivated account: reject. |
| UC-02 | Create user | ADMIN | Enter details, role, and job title; save; an activation link is sent so the user can set a password. | Duplicate email: reject. Expired link: resend. |
| UC-03 | Log daily work | EMPLOYEE | Click “Add Work,” enter date, nature of work, area, and type; save; the entry appears in the employee's logs. | Duplicate entry: warn. Future date or date outside the allowed window: reject. |
| UC-04 | Create and send assignment | MANAGER / DEPUTY / ADMIN | Create an assignment and save it as a draft; select employees, deadline, and priority; optionally enable email/SMS; send. | Deadline in the past or no employees: reject. Email/SMS failure: internal notification remains, and the failure is logged. |
| UC-05 | Receive, execute, and submit assignment | EMPLOYEE | Receive, start, add Drive link, and submit. | Invalid link: reject. Returned assignment: revert to In Progress with comment. |
| UC-06 | Review submission | Approver | Open the link; approve or return with a comment. | Return without a comment: reject. |
| UC-07 | Comment on assignment | Assignment participants | Write a comment or include a link; notify the other participant. | Empty comment or one exceeding the length limit: reject. |
| UC-08 | Issue circular | MANAGER / DEPUTY / ADMIN | Write the circular, choose audience and channels, then publish; a recipient record and notification are created for each recipient. | No recipients: reject. |
| UC-09 | Acknowledge circular | Recipient | Open the circular and click “I Have Read.” | Repeated acknowledgment: ignore without error. |
| UC-10 | Track circular | Management | Open the tracking screen, view who has and has not acknowledged, and send a reminder. | — |
| UC-11 | Manage project and stages | EMPLOYEE / Management | Create a project, add stages, update them, and close the project. | Attempt to edit a closed project: reject. |
| UC-12 | Generate monthly report | EMPLOYEE (own report) / Management | Select employee, month, and format; generate the report with its header. | Month with no data: empty report with a note. Employee requests another employee's report: reject. |
| UC-13 | Configure report header and settings | ADMIN | Upload a logo and configure text, weights, and working days; save. | File larger than 2 MB or unsupported format: reject. |

## 8. Data Model

Identifiers are UUIDs or auto-incrementing numbers. Every table has `created_at` and `updated_at`; core tables also have `deleted_at` for soft deletion.

| Entity | Main Fields | Notes |
|---|---|---|
| `users` | `id`, `name_ar`, `name_en`, `email`, `mobile`, `password_hash`, `role`, `job_title_id`, `locale`, `is_active`, `last_login_at` | Unique `email`; `role` has four allowed values |
| `job_titles` | `id`, `name_ar`, `name_en`, `is_active` | Admin-managed |
| `work_logs` | `id`, `user_id`, `work_date`, `work_nature`, `work_area`, `work_mode`, `description`, `output_link`, `assignment_id`, `project_id` | Index on (`user_id`, `work_date`); `work_mode`: office/field |
| `assignments` | `id`, `title`, `description`, `priority`, `deadline`, `original_deadline`, `kind`, `reference_link`, `created_by`, `status`, `notify_email`, `notify_sms`, `closed_at`, `cancel_reason` | `kind`: normal/social_media; `status`: draft/active/closed/cancelled |
| `assignment_assignees` | `id`, `assignment_id`, `user_id`, `status`, `received_at`, `started_at`, `delivered_at`, `approved_at`, `return_count`, `delivery_note` | Unique (`assignment_id`, `user_id`) |
| `assignment_deliveries` | `id`, `assignee_id`, `drive_url`, `created_at` | Delivery links; multiple links allowed |
| `assignment_comments` | `id`, `assignee_id`, `author_id`, `body`, `is_problem`, `is_hidden` | Separate thread per assignee |
| `assignment_events` | `id`, `assignment_id`, `assignee_id`, `actor_id`, `event_type`, `payload` | Feeds the timeline |
| `projects` | `id`, `title`, `description`, `owner_id`, `status`, `start_date`, `expected_end_date`, `assignment_id` | Optional `assignment_id` |
| `project_stages` | `id`, `project_id`, `title`, `sort_order`, `status`, `completed_at`, `link` | — |
| `circulars` | `id`, `title`, `body`, `audience_type`, `issued_by`, `status`, `published_at`, `parent_id`, `notify_email`, `notify_sms` | `audience_type`: all/employees/specific; `parent_id` for corrections |
| `circular_recipients` | `id`, `circular_id`, `user_id`, `acked_at`, `reminders_sent` | Unique (`circular_id`, `user_id`) |
| `notifications` | `id`, `user_id`, `type`, `title`, `body`, `entity_type`, `entity_id`, `read_at` | Internal notifications |
| `notification_deliveries` | `id`, `notification_id`, `channel`, `status`, `attempts`, `last_error`, `sent_at`, `dedupe_key` | Unique `dedupe_key` |
| `settings` | `key`, `value` | Report header, time zone, weights, holidays |
| `audit_logs` | `id`, `actor_id`, `action`, `entity_type`, `entity_id`, `before`, `after`, `ip`, `created_at` | Append-only |

**Constraints and indexes:** Foreign keys use restricted deletion; indexes on (`status`, `deadline`) and (`user_id`, `work_date`); unique constraints on the pairs (assignment, employee) and (circular, recipient), plus `dedupe_key` to prevent duplicates.

## 9. Notification Matrix

Internal notifications are always sent. Email and SMS are selected by the sender (manager, deputy, or system administrator) when sending an assignment or circular. For events triggered by the system or an employee, ADMIN configures these channels in the settings for each event type.

| Event | Recipient | Internal | Email / SMS |
|---|---|---|---|
| New assignment | Assignee | ✓ | Sender's choice |
| Receipt reminder (after 24 hours) | Assignee | ✓ | According to the channels selected at sending |
| Approaching deadline (24 hours, 2 hours) | Assignee who has not submitted | ✓ | According to the channels selected at sending |
| Overdue assignment | Assignee and creator | ✓ | According to the channels selected at sending |
| Deadline or priority changed | Assignee | ✓ | According to the channels selected at sending |
| Work submitted | Creator | ✓ | According to ADMIN settings |
| Approved or returned for revision | Assignee | ✓ | According to ADMIN settings |
| New comment | Other participant in the thread | ✓ | According to ADMIN settings |
| Comment flagged as “Issue” | Creator and approvers | ✓ | According to ADMIN settings |
| Assignment cancelled | Assignee | ✓ | According to the channels selected at sending |
| New circular | Recipients | ✓ | Issuer's choice |
| Acknowledgment reminder | Those who have not acknowledged | ✓ | According to the channels selected at publication |
| Email or SMS delivery failure | Sender and ADMIN | ✓ | — |
| Account activation or password recovery | User | — | Mandatory email |

Acknowledging a circular does not trigger an individual notification to management; instead, it appears on the tracking screen (FR-CIR-06) [Assumption, to avoid unnecessary notifications].

## 10. Screens and UI Rules

| Screen | Role | Main Content |
|---|---|---|
| Sign-in and password recovery | Everyone | Simple forms and language switcher |
| Dashboard | Management / Employee | Role-based cards, charts, and shortcuts |
| My Daily Work | EMPLOYEE | Quick entry form, list, and filters |
| Employee Work Logs | Management | Filterable and exportable table |
| Assignments | Everyone, according to permissions | List, create/edit, details (status, timeline, comments, submission, review) |
| Projects | EMPLOYEE / Management | List, details, and stages |
| Circulars | Everyone | Inbox, issuance, acknowledgment tracking, archive |
| Notifications | Everyone | List and compact center in the top bar |
| Reports | Everyone, according to permissions | Select employee, month, and format; preview and export |
| Users | ADMIN | List, create, deactivate |
| Settings and Report Header | ADMIN | Report header, time zone, holidays, weights, reminders |
| Audit, Delivery History, and Health | ADMIN | Search, filters, and resend |
| Profile | Everyone | Language, password, contact details |

**UI rules:** Mobile-first design; one clear primary action per screen; confirmation before any irreversible action (cancel, close); understandable error messages in the user's language; and empty states that explain the next step.

## 11. Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-PERF-01 | Performance | Main pages load in ≤ 3 seconds (95th percentile) with 50 concurrent users. |
| NFR-PERF-02 | Performance | Monthly reports are generated in ≤ 10 seconds; longer-running reports are processed through the queue, with a notification when ready. |
| NFR-PERF-03 | Performance | Internal notifications arrive in ≤ 60 seconds and emails in ≤ 5 minutes under normal conditions. |
| NFR-AVL-01 | Availability | ≥ 99.5% monthly uptime, excluding maintenance announced in advance. |
| NFR-REL-01 | Reliability | RPO ≤ 24 hours and RTO ≤ 4 hours; target RPO ≤ 1 hour if point-in-time recovery is enabled. |
| NFR-REL-02 | Reliability | Multi-step operations run inside database transactions so that partially completed data is not left behind. |
| NFR-SEC-01 | Security | HTTPS only, with HSTS and TLS 1.2 or higher. |
| NFR-SEC-02 | Security | Hash passwords securely, encrypt backups, and use encryption at rest according to the provider's capabilities. |
| NFR-SEC-03 | Security | Protect against major OWASP vulnerabilities: CSRF, XSS, and SQL injection (parameterized queries); verify ownership on every request to prevent unauthorized access to others' data (IDOR); and apply rate limiting. |
| NFR-SEC-04 | Security | Security headers (CSP and others), environment secrets kept out of code, and a least-privilege database account. |
| NFR-SEC-05 | Security | Dependency scanning and a basic security assessment before launch. |
| NFR-PRV-01 | Privacy | A data-retention policy to be determined with management [Open Question], and no sensitive content in SMS messages. |
| NFR-USE-01 | Usability | Log daily work in less than one minute and no more than 5 clicks after opening the form. |
| NFR-USE-02 | Usability | Target WCAG 2.1 Level AA for contrast and keyboard navigation [Assumption]. |
| NFR-I18N-01 | Internationalization | No hardcoded UI text; RTL/LTR support across all screens and reports. |
| NFR-MNT-01 | Maintainability | Automated tests of critical logic (permissions, states, and performance scoring), with ≥ 70% overall coverage, and peer code review between the two developers before merging. |
| NFR-MNT-02 | Maintainability | Automated deployments with rapid rollback; database migrations are first tested in staging using an anonymized copy of the data. |
| NFR-MNT-03 | Maintainability | Monitoring and alerts for application errors, queue failures, disk capacity, and failed backups. |
| NFR-SCL-01 | Scalability | Stateless application, off-server sessions, and the ability to scale application instances and workers horizontally. |
| NFR-CMP-01 | Compatibility | Latest two versions of Chrome, Safari, Edge, and Firefox, and recent iOS and Android versions. |

## 12. Testing and Acceptance

**Test types:** Unit tests for critical logic, integration tests for the interfaces and database, full permissions-matrix testing for each role, end-to-end (E2E) tests for key user journeys, a basic security assessment, backup restoration testing, and user acceptance testing (UAT) with management and two employees.

| ID | Acceptance Scenario | Expected Result |
|---|---|---|
| AC-01 | An employee directly opens a link to another employee's assignment or report. | Denied (403 or 404) without exposing any data. |
| AC-02 | An assignment has two assignees: one submits and the other does not. | It remains active and automatically closes when both are approved. |
| AC-03 | Double-click or concurrent requests on “Send” or “Approve.” | A single transition and a single notification. |
| AC-04 | A circular is addressed to “Employees Only.” | MANAGER, DEPUTY, and ADMIN do not receive it. |
| AC-05 | The SMS gateway fails. | The internal notification is delivered, and the failure is recorded and visible to ADMIN. |
| AC-06 | Test data: 10 assignments, 9 approved, including 8 on time; 5 social media deliverables, including 4 submitted. | C=90, T≈88.89, S=80, and final score ≈ 87.56 (“Very Good”). |
| AC-07 | Switch language from Arabic to English. | Direction and text change immediately while retaining the current page and state. |
| AC-08 | Export an Arabic PDF report. | The report header is displayed, Arabic characters are correctly shaped and joined, and tables are not cut off. |
| AC-09 | Restore a backup in a test environment. | Restoration completes and record counts match. |
| AC-10 | Log work with a future date or a date outside the editing window. | Rejected with a clear message. |

## 13. Traceability Matrix (BRD → SRS)

| Business Requirement | Covered By |
|---|---|
| BR-01, BR-02 | FR-AUTH-01..05, FR-USR-01..06 |
| BR-03 | FR-LOG-01..10 |
| BR-04 | FR-TSK-01..12, FR-TSK-15..16 |
| BR-05 | FR-TSK-13..14 |
| BR-06 | FR-TSK-06, FR-LOG-02 |
| BR-07 | FR-PRJ-01..07 |
| BR-08 | FR-CIR-01..09 |
| BR-09, BR-10 | FR-NTF-01..09 and Section 9 |
| BR-11 | FR-RPT-01..04 |
| BR-12 | FR-DSH-01..03 |
| BR-13 | FR-RPT-05..10 |
| BR-14, BR-15 | FR-GEN-01..03, NFR-I18N-01, NFR-USE-01..02, NFR-CMP-01 |
| BR-16 | FR-AUD-01..03, FR-BKP-01..03, NFR-REL-01..02 |
| BR-17 | NFR-SCL-01 and Principle 5 in Section 2.4 |

## 14. Items Deferred Until After the First Release

- A “Work Quality” indicator based on the manager's evaluation (a fourth indicator in the scoring formula).
- Time tracking and calculation of working hours.
- Recurring assignments and a deadline calendar.
- WhatsApp notification channel.
- Single sign-on or integration with an HR system.
- Progressive Web App (PWA) or mobile application.
- In-system file uploads if the decision changes.
- Multi-department support.
