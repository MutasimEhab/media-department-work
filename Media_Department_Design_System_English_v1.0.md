---
title: "Design System — Media Department Work Management System"
organization: "Hearing and Sight Association for Development and Social Rehabilitation"
version: "1.0"
date: "2026-10-31"
status: "Proposed design specification — only outstanding decisions require approval"
language: "en"
direction: "ltr"
numerals: "latn (0-9)"
sources:
  - "BRD_Media_Department_Work_Management_System_EN(1).md — v0.1"
  - "SRS_Media_Department_Work_Management_System_EN(1).md — v0.1"
  - "Approved Visual Identity Guide — Association 2026.pdf (original Arabic title: دليل الهوية البصرية المعتمدة – المؤسسة 2026.pdf)"
---

# Comprehensive Design System
## Media Department Work Management System — Hearing and Sight Association

**Version:** 1.0 — **Prepared:** 31/10/2026  
**Document scope:** System interface identity, user experience, interactions, components, technical standards, responsive design, accessibility, and test scenarios.  
**Approved numerals throughout the interfaces and reports:** Latin `0 1 2 3 4 5 6 7 8 9`.  
**Languages:** Arabic first (RTL) and English (LTR).  
**References:** The Association's Visual Identity Guide, BRD, and SRS. This document does not supersede the requirements documents or decisions made by the project owner.

> **Status legend:** **[Approved by Brand Guide]** = explicitly defined in the visual identity guide; **[Documented in BRD/SRS]** = a requirement in the requirements documents; **[Design Recommendation]** = a proposed, reviewable decision; **[Approval Required]** = an unresolved decision or conflict with a material impact. Recommendations must not be represented as approved requirements.

---

## 1. Executive Summary and Initial Assessment

The BRD and SRS define the functional domains, roles, and workflows for assignments, projects, circulars, notifications, and reports. The Association's guide provides the approved logo, colors, and fonts. **The current gap is not the absence of functional requirements; it is the absence of a single, detailed UI/UX specification** covering dimensions, components, states, interface behavior, and resolution of conflicting decisions.

| Area | Already Available | What This Document Defines | Status |
|---|---|---|---|
| Identity | Logo, typefaces, brand colors | Application of colors to UI elements; logo compliance | Brand guide is authoritative |
| Interface | Screen inventory and general rules | Layout, navigation, sizes, responsiveness | Design recommendation |
| Components | Functional needs without a UI library | Components, states, and usage patterns | Design recommendation |
| Workflows | Clearly defined functional flows | Actions, screens, empty/error/loading states | BRD/SRS + design |
| Permissions | Role matrix | Action visibility and availability per role | Documented; enforced server-side |
| Reporting | Content and export formats | Preview design, issuance states, bilingual headers | Documented + design |
| Accessibility | WCAG 2.1 AA target | Practical typography, focus, contrast, and interaction requirements | Documented + recommendations |
| Backdated work logs | SRS allows entry up to 7 days back | Same-day logging rule and exceptions | **Conflict requiring resolution** |

### 1.1 Design Quality Objectives
1. Make the main action on each screen unmistakable; avoid competing primary buttons in the same context.
2. Allow an employee to log daily work in under 60 seconds and with no more than 5 clicks after opening the form [SRS].
3. Display only true, current states, with no stale data or misleading metrics.
4. Support mobile layouts, text direction, keyboard navigation, and loading/error states on every screen.
5. Use consistent behavior everywhere: notifications, confirmations, saving, canceling, search, and export.
6. Reuse design elements without altering permissions, data, or system functionality during visual improvements.

### 1.2 Out of Scope
- **Not** redesigning the logo, renaming roles, or inventing permissions.
- **Not** introducing new colors outside the Association's approved identity.
- **Not** enabling system file uploads; submissions use Google Drive links only, except for the report header image permitted by the SRS.
- **Not** building a native mobile app in the MVP; a responsive web interface is required.
- **Not** uploading or deleting production data as part of interface design work.

---

## 2. Approved Visual Identity Rules

### 2.1 Logo
**[Approved by Brand Guide]**
- The sole source is the official logo stored in the `Logo` folder within the Association's identity assets.
- Changing its colors, proportions, dimensions, edges, decorative elements, shadows, or gradients is prohibited.
- Clear space must be maintained around the logo. **The attached guide does not specify a numeric clear-space measurement**; this must be derived from the original artwork or approved by the identity owner before implementation.
- Show the original logo in the sidebar header, login screen, and report header without cropping or stretching it.
- Do not redraw a substitute logo or use text in its place except as a fallback when the original fails to load; do not present such a fallback as the official logo.
- Load the approved PNG or SVG as an asset; do not reconstruct it programmatically.

### 2.2 Color Palette
**All HEX values below come from the approved Visual Identity Guide.**

| Token | Name | Color | Proposed Interface Use |
|---|---|---|---|
| `brand.magenta` | Magenta Primary | `#C80893` | Primary action, action links, selected emphasis |
| `brand.plum` | Dark Plum | `#871281` | Header areas, keyboard focus, distinctive secondary action |
| `brand.charcoal` | Charcoal Gray | `#444444` | Main text, subtitles, icons |
| `brand.green` | Fresh Green | `#83C704` | Completed-status background with dark text; not for light text |
| `brand.lime` | Light Lime Green | `#A9D203` | Supporting emphasis and non-text progress indicators |
| `brand.lightGray` | Light Gray Background | `#E6E7E9` | Overall background, borders, dividers, and understated elements |

**Important constraints:**
- **[Approved by Brand Guide]** Any color outside the approved palette requires the Media Department's approval.
- Using `#FFFFFF` for cards and input surfaces is **[Approval Required]**. White is proposed as a neutral UI surface, but the guide does not explicitly include it in its HEX palette. Pending approval, use `#E6E7E9` for backgrounds and distinguish regions through spacing and borders.
- Do not automatically introduce semantic red, yellow, or blue for errors and priorities. Use approved brand colors together with an icon and descriptive text until semantic-color exceptions are authorized by the identity owner.
- Color must never be the sole indication of a status; provide a status name, icon, or description.

### 2.3 Contrast Checks on Approved Colors
The following are **approximate ratios calculated using the WCAG contrast formula**:

| Color Combination | Approximate Contrast | Assessment |
|---|---:|---|
| `#444444` on `#E6E7E9` | `7.87:1` | Suitable for normal text |
| `#871281` on `#E6E7E9` | `6.97:1` | Suitable for normal text |
| `#C80893` on `#E6E7E9` | `4.34:1` | **Below 4.5:1** for normal small text; use Plum or Charcoal |
| `#C80893` on white *if approved* | `5.37:1` | Suitable for normal text |
| `#83C704` on white *if approved* | `2.07:1` | Unsuitable for small text |
| `#A9D203` on white *if approved* | `1.76:1` | Unsuitable for small text |
| `#444444` on `#83C704` | `4.70:1` | Suitable for text on a green surface |
| `#444444` on `#A9D203` | `5.52:1` | Suitable for text on a lime surface |

**Application rule:** Use Charcoal or Plum for primary text, and Charcoal for text on green surfaces. Verify each finished combination before approval; these examples do not automatically guarantee accessibility in every context.

### 2.4 Typography
**[Approved by Brand Guide]**

| Role | Font | Usage |
|---|---|---|
| Headline / Display | `AdvertisingExtraBold` | Primary interface title and occasional prominent headings |
| Subheading / Emphasis | `Janna LT Bold` | Section/card headings and emphasized text |
| Body / Input / Table | `Janna LT Regular` | Body copy, details, form controls, and tables |
| Technical fallback | Set according to the actual font files' character coverage | Avoid unapproved external font loading |

- Use the actual licensed/approved font files, not approximate alternatives.
- Do not apply a simulated `font-weight: 700` to the Regular file when the approved Bold file exists; map the correct file to each weight.
- Verify English character and Latin numeral support. If a file lacks coverage, request approval for an explicit fallback rather than introducing an unapproved typeface.
- Do not distribute the original font files as public attachments; keep them within licensed project assets.

### 2.5 Proposed Type Scale

| Token | Desktop | Mobile | Line Height | Use |
|---|---:|---:|---:|---|
| `type.pageTitle` | `28px` | `24px` | `1.4` | Page title |
| `type.section` | `22px` | `20px` | `1.5` | Section heading |
| `type.cardTitle` | `18px` | `17px` | `1.55` | Cards and tabs |
| `type.body` | `16px` | `16px` | `1.7` | Body copy and forms |
| `type.secondary` | `14px` | `14px` | `1.6` | Supporting details |
| `type.caption` | `12px` | `12px` | `1.55` | Noncritical information; not essential instructions |
| `type.metric` | `30px` | `26px` | `1.2` | Latin-numeral statistics |

**[Design Recommendation]** These initial sizes must be visually tested with the actual Janna font files, as Arabic type metrics differ from those of other typefaces.

---

## 3. Design Foundations

### 3.1 Grid and Spacing
- Base spacing unit: `4px`; proposed scale: `4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64px`.
- Default card padding: `20–24px` on desktop and `16px` on mobile.
- Space between fields: `16px`; between sections: `24–32px`.
- Core control height: `44–48px`; interactive target area at least `44×44px` where practicable.
- Align content to the start edge according to the current language direction; keep essential reading symbols in the text flow.

### 3.2 Border Radii and Borders
| Element | Proposed Radius | Borders |
|---|---:|---|
| Input / Select | `8px` | `1px` in light gray, or Plum on focus |
| Button | `8px` | Based on button variant |
| Card | `12px` | Subtle border or separation through spacing |
| Dialog | `16px` | Clear visual separation |
| Status badge | `6px` | Legible status label and meaning |

Shadows are not a required part of the brand identity. Prefer layout spacing and dividers. **Never apply a shadow to the logo.**

### 3.3 Application Shell

```text
App Shell
├─ Top Bar: System title / contextual search / language / alerts / account
├─ Sidebar (Desktop): Role-aware navigation
├─ Main Content
│  ├─ Breadcrumb + Page Title
│  ├─ Page Action Bar
│  ├─ Filters + Content
│  └─ Feedback Region (Toast / Dialog)
└─ Mobile Navigation: Compact menu + additional options
```

- `Desktop ≥ 1200px`: Proposed `248px` sidebar and flexible content area.
- `Tablet 768–1199px`: Collapsed sidebar or on-demand drawer.
- `Mobile 360–767px`: Compact header, navigation menu, and cards instead of wide tables.
- `360px` is the minimum supported viewport width per the SRS.
- Avoid page-level horizontal scrolling; if a long desktop data table requires scrolling, contain it within the table.
- Large-screen support does not mean stretching text inputs across the entire width; cap content width and preserve readable line lengths.

### 3.4 Content Hierarchy
`Page Title → Important Summary → Primary Action → Search/Filters → Results → Additional Details`.  
On mobile, show the most frequent action first; do not scatter unnecessary duplicate action buttons throughout the screen.

---

## 4. Navigation and Information Architecture (IA)

### 4.1 Management and Administrator Navigation
1. Dashboard.
2. Daily Work / Employee Work Logs.
3. Assignments.
4. Projects.
5. Circulars.
6. Notifications.
7. Reports and Statistics.
8. Users and Permissions **(ADMIN only)**.
9. Settings **(ADMIN only)**.
10. Audit Log and System Health **(ADMIN only)**.
11. Profile.

### 4.2 Employee Navigation
1. Dashboard.
2. Log Today's Work / My Work.
3. My Assignments.
4. My Projects.
5. Circulars Addressed to Me.
6. Notifications.
7. My Monthly Report.
8. Profile.

> **Functional security:** Hiding an unauthorized button is not sufficient protection. Every action and data request must check the user's permissions and ownership on the server [SRS].

### 4.3 Unified Interface Terminology

| Concept | Arabic | English | Avoid |
|---|---|---|---|
| Assignment | تكليف | Assignment | Calling an assignment a “Project” |
| Project | مشروع | Project | Confusing it with an assignment |
| Work log | عمل يومي | Daily Work | Vague labels |
| Circular | تعميم | Circular | Calling a circular a notification |
| Acknowledgment | قرأت التعميم | I Have Read It | Treating opening as acknowledgment |
| Submitted | تم التسليم | Submitted | “Completed” before approval |
| Approved | معتمد | Approved | Confusing with receipt only |
| Returned | أُعيد للتعديل | Returned for Revision | Treating it as final rejection |
| Overdue | متأخر | Overdue | Presenting it as a separately stored workflow state |

---

## 5. Numerals, Dates, Times, and Directionality

**[Approved Project Owner Preference]** Display Latin numerals `0–9` in both Arabic and English, including dashboard cards, tables, notification badges, reports, dates, times, and input fields.

| Element | Proposed Display |
|---|---|
| Short date | `31/10/2026` |
| Report month | `10/2026` |
| Arabic time | `09:45 م` or `09:45 ص` |
| English time | `09:45 PM` / `09:45 AM` |
| Notification count | `3` |
| Percentage | `87.5%` |
| Count | `1,250`, using an appropriate thousands separator |

- **[Design Recommendation]** Use a 12-hour clock with `ص/م` in Arabic and `AM/PM` in English, based on the project's earlier operational preference; reconfirm if required.
- **[Documented in SRS]** Use Gregorian dates and an admin-configured time zone.
- Store timestamps consistently (e.g., UTC) and render them using the selected organizational time zone.
- In HTML, isolate English numbers and URLs with `dir="ltr"` or `bdi` so they do not reorder unexpectedly in Arabic text.
- Prefer `numberingSystem: "latn"` in JavaScript and report generation; do not rely on CSS alone to substitute numeral glyphs.
- Persist language selection in the user's profile and switch instantly without losing form state or page position [SRS].

---

## 6. Component Library

For every component, document: properties, size, states, labels, keyboard behavior, accessibility, RTL/LTR behavior, and error messaging.

| Component | Proposed Variants | Required States | Key Requirements |
|---|---|---|---|
| `Button` | Primary / Secondary / Text / Destructive | default, hover, focus, loading, disabled | Prevent duplicate submission; clarify primary action |
| `IconButton` | Bell / Close / Search / Menu | default, focus, disabled | Accessible name and function description |
| `TextField` | Text / Email / Phone / Search | empty, filled, focus, error, disabled | Persistent label; adjacent error |
| `TextArea` | Description / Comment | same | Character counter and suitable height |
| `Select` | Single / Multi | same | Search in long employee lists |
| `Checkbox` | Channel choice / Filter | checked, unchecked, disabled | Grouped with its label |
| `RadioGroup` | Office / Field | selected, unselected | Exclusive choice |
| `DateTimePicker` | Deadline / Work day | chosen, invalid, blocked | Disallowed dates cannot be selected |
| `Badge` | Priority / Status / Count | semantic variants | Label + color/icon |
| `Toast` | Success / Notice / Error | visible, dismissing | Never lose entered data |
| `Dialog` | Confirmation / Review | open, submitting, error | Move and restore focus |
| `Drawer` | Mobile navigation / Details | open, closed | Clear closing action without content loss |
| `Tabs` | Lists / Sections | active, inactive | Keyboard navigation |
| `DataTable` | Sorting / Selection / Filters | loading, empty, error, populated | Desktop-friendly |
| `RecordCard` | Assignment / Work / Project | same | Mobile alternative to tables |
| `Pagination` | Pages / Page size | same | Latin numerals and correct refresh behavior |
| `FilterBar` | Employee / Date / Status | applied, reset | Display active filters |
| `StatCard` | Number + explanation | loading, zero, error | Link to actual underlying records |
| `Progress` | Project stage completion | 0–100 / unknown | Percentage, label, and formula explanation |
| `Timeline` | Assignment events | initial / history | Chronology and responsible actor |
| `NotificationItem` | Assignment / Comment / Circular | unread, read, action-required | Link to the correct entity |
| `CircularCard` | New / Read / Archived | published, acknowledged | Acknowledge separately from opening |
| `LinkField` | Google Drive | invalid, valid, loading | Validate URL and domain server-side |
| `Skeleton` | Page / Card / Table | loading | Must not look like actual data |
| `EmptyState` | No content | empty | Explain the reason and next action |
| `ErrorState` | Network / Permission / Data | error | Appropriate retry without losing data |
| `ReportPreview` | Monthly / Department-wide | preparing, ready, failed | Preview before PDF/Excel export |

### 6.1 Button Rules
- Primary: One prominent action per form or work area (`Save Work`, `Send Assignment`).
- Secondary: `Save as Draft`, `Cancel`, `Back`.
- Destructive: Cancel assignment or deactivate account; differentiate with **a warning icon, explicit wording, and confirmation**, not an unapproved new color.
- During submission, disable repeat activation or enforce idempotency and display `Saving…`; disabling a UI button alone cannot prevent duplicates [SRS].
- Do not display a `Sent` success toast until the server confirms the operation.

### 6.2 Form Feedback Messages
| Scenario | Proposed Arabic Text (Original) | Behavior |
|---|---|---|
| Required field | `هذا الحقل مطلوب.` (“This field is required.”) | Show beside the field and guide focus |
| Invalid URL | `أدخل رابط Google Drive صحيحًا.` (“Enter a valid Google Drive link.”) | Block submission, retain the input |
| Past deadline | `موعد التسليم لا يمكن أن يكون في الماضي.` (“The deadline cannot be in the past.”) | Block submission |
| Possible duplicate | `يوجد عمل مشابه مسجل بهذا التاريخ. راجعه قبل الحفظ.` (“Similar work was logged on this date. Review before saving.”) | Warn and allow review |
| Connection loss | `تعذّر الاتصال. بقيت بيانات النموذج محفوظة مؤقتًا على هذا الجهاز.` (“Connection failed. Form data remains temporarily saved on this device.”) | Do not claim server-side persistence |
| Session expired | `انتهت الجلسة. سجّل الدخول للمتابعة.` (“Your session has expired. Sign in to continue.”) | Safely preserve a nonsensitive draft if policy allows |
| Unauthorized access | `ليس لديك صلاحية لعرض هذه الصفحة.` (“You do not have permission to view this page.”) | Secure 403/404 error page |
| Save success | `تم حفظ العمل بنجاح.` (“Work saved successfully.”) | Refresh the list and counters |

### 6.3 Shared Data States
Each data screen must support `Initial`, `Loading`, `Ready`, `Empty`, `No Search Results`, `Validation Error`, `Network Error`, `Permission Denied`, and `Partial Data` where multiple services are involved.  
**Showing nothing is not a substitute for a clear loading or error state.**

---
## 7. Screen Specifications and User Journeys

### 7.1 Login and Account Recovery
**Content:** Official logo, system name, language switcher, email, password, Sign In button, and password recovery link.  
**Interaction:** Generic error messages that do not reveal whether an email is registered; account lockout as specified by the SRS; correct keyboard behavior; redirect to the role-appropriate dashboard.  
**Mobile:** Single-column layout with no horizontal scrolling.  
**Security:** No public account creation; only the ADMIN creates user accounts.

### 7.2 Management Dashboard
**Priority:** Today's decisions and work requiring intervention.  
**First row:** Active assignments, overdue assignments, awaiting review, and unacknowledged circulars.  
**Second row:** Actual work logged today, activity of employees who logged work today, and project-based status.  
**Third row:** Charts of assignments by status, on-time performance by month, office/field breakdown, and performance scores.  
**Filters:** Month, employee, period, and status, with a `Clear Filters` action.  
**Rules:** Do not display a number without indicating its last refresh time and scope; clicking a metric opens the underlying records [SRS].

**Additional note from current operational requirements:** The “Employees Who Logged Work Today” list includes **only** employees with an actual work entry dated today in the approved organizational time zone. Having a user account or old assignments does not qualify an employee for this list.

### 7.3 Employee Dashboard
- Summary of current and overdue assignments, including those awaiting receipt or submission.
- A clearly visible primary `Log Today's Work` button.
- Summary of work recorded during the month and a **Provisional** performance score if the data is not final.
- Circulars awaiting acknowledgment with an `I Have Read It` button.
- A “Recent Activity” feed limited to the employee's own information; never expose colleagues' work.

### 7.4 Daily Work — Log Work
**Core form:** Today's date (pre-filled), nature of work, work area, and work mode `Office / Field`.  
**Optional under the SRS:** Short description, Google Drive link, and association with an assignment or project.  
**Interaction:** Suggestions based on the employee's previous entries if enabled; duplicate warning; `Save Work` button; success message; immediate list refresh.  
**Daily work entries do not require managerial approval** [BRD/SRS].

#### Work Date Restrictions — Conflict Requiring an SRS Amendment
- **Current SRS — FR-LOG-05/06:** Allows logging/editing dates up to 7 days in the past and then locks them.
- **More recent operational requirement:** Work must be logged **on the day it is performed**. Yesterday's work cannot be entered the next day, except where ADMIN grants a date-specific exception to an identified employee and notifies that employee.
- **[Approval Required as an Official Requirement and SRS Update]** Proposed UI: Display only today's date by default; prevent selection of past dates unless there is an active exception for that employee and date; display `Exception available for 29/10/2026` to the beneficiary; audit who granted and used the exception. This changes UI, backend, and reporting behavior, not just the form.
- Resolve permitted dates and exceptions using the organizational time zone, not solely the user's device clock.
- Employees must not receive a general “exception” control to bypass the rule; exceptions belong in a separate ADMIN screen, after confirming the permission scope.

### 7.5 My Work / Employee Work Logs
- Desktop table: Date, nature of work, area, mode, description, link, and available actions.
- Mobile: Compact expandable cards.
- Search and month/date/employee/mode filtering, as authorized by role.
- `Edit` and `Archive` or `Soft Delete` only when business rules permit; no permanent-delete button without an approved policy.
- When no work is logged today, show `You have not logged work today. Add your first entry now.` rather than an unexplained zero.

### 7.6 Assignment List
**Columns/card contents:** Title, priority, sender, date sent, deadline, user-specific status, and overdue indicator if applicable.  
**Filters:** Status, priority, employee (management only), date, overdue status; search and sorting.  
**Quick actions:** `Details`, `Receive`, `Start Work`, `Add Submission Link`, `Review` depending on state and permission.  
**Important:** Do not confuse an assignment's overall state with the independent state of each assignee; one employee may already be approved while another is overdue.

### 7.7 Create Assignment
**Required fields:** Title, description, priority, deadline, at least one employee, and assignment type.  
**Optional:** Reference link, reminder settings, email and SMS channels (off by default).  
**Actions:** `Save as Draft` and `Send Assignment`.  
**Pre-send review:** Recipients, deadline, priority, and delivery channels.  
**After sending:** One success confirmation per operation, duplicate prevention, and internal notification to the assignee in accordance with the SRS.

### 7.8 Assignment Details, Submission, and Review
The page is divided into:
1. Assignment details, deadline, and priority.
2. Assignee list and individual assignee statuses (management only).
3. Event timeline with actor and timestamp.
4. Participant comments; a separate thread per assignee under the SRS.
5. Google Drive submission links with URL validation.
6. Review area for an authorized reviewer: `Approve` or `Return for Revision`, requiring a comment on return.

**Deadline:** `Overdue` is calculated from the current time and submission timestamp; it is not a separate stored workflow state.  
**Changes:** Updating the deadline or priority after sending is recorded and recipients are notified.  
**Closure:** After approval for all assignees (an SRS assumption that must be confirmed), or manual closure by the authorized party.

### 7.9 Project Management
**List:** Name, owner, status, start date, expected end date, and progress based on stages.  
**Details:** Ordered stages; each stage is `Pending / Completed` and may have a completion date and optional link.  
**Interactions:** Add stage, reorder, mark completed, close, and reopen by the authorized administrator.  
**Rule:** Progress percentage = number of completed stages ÷ total stages. If there are no stages, show `No Stages` instead of dividing by zero.  
**Distinction:** Projects organize work through stages; assignments are sent by management to one or more recipients with priority, deadline, submission, and review.

### 7.10 Circulars — Inbox
**Items:** Title, issuer, publication time, whether acknowledgment is required, and current state.  
**Opening a circular does not count as official acknowledgment:** A separate `✓ I Have Read It` button records acknowledgment time [SRS].  
**Targeting:** Show circulars only to recipients captured in the audience snapshot when published.  
**Archived:** An archived circular does not appear as new but remains available to an authorized recipient through the archive.

### 7.11 Issue Circular
- Title and body supporting basic formatting (bold, lists, links).
- Audience: Everyone, Employees Only, or Specific People.
- Optional Drive links; separate, opt-in email and SMS choices disabled by default.
- `Save as Draft` and `Publish`, with an audience review before publication.
- Once published, the body is not editable; issue a linked correction circular as specified in the SRS.
- Automatically create the recipient records and acknowledgment tracking.

### 7.12 New Circular Popup (Additional Proposal Based on Current Usage)
**Goal:** Draw attention to a *new, relevant, unacknowledged circular* when a user signs in, without replaying old circulars or showing the popup repeatedly on page refresh.

**Proposed UX rules [Approval Required for Popup Behavior]:**
- Show the popup only for a recently published circular addressed to the user, not yet acknowledged and not previously shown to that user as a popup. A specific recency policy must be approved.
- Store `popup_seen_at` per (circular, user) **separately** from `acked_at`, so seeing the popup is not treated as having read the circular.
- Closing the popup leaves the circular in the notification center and `Needs Acknowledgment` list until the user clicks `I Have Read It`.
- When a user returns after being offline, show relevant new notifications missed during absence without creating duplicates.
- If several new circulars exist, show one consolidated list or a limited sequence, not multiple stacked popups.
- Do not rely solely on `localStorage` to suppress the popup; persist per-recipient state on the server.

### 7.13 Notification Center
- Bell in the top bar with a Latin-numeral unread counter.
- Tabs or filters: `All / Unread / Action Required`.
- Each item includes type, short summary, time, destination link, and read state.
- Distinguish “read notification,” “acknowledge circular,” and “receive assignment”; these are three different actions.
- Deduplicate events per recipient/channel server-side so the same event appears only once in the list.
- Notification sound is **optional** with a mute setting; receiving an assignment must not depend on hearing audio.
- Email/SMS failures must not prevent an internal notification.

### 7.14 Circular Acknowledgment Tracking
- Summary counts: `Recipients`, `Acknowledged`, `Not Acknowledged`.
- Table: Employee, acknowledgment status, acknowledgment time, and reminder action when authorized.
- Secure management-only export under the SRS.
- Simply opening the popup or viewing the circular does not mark it acknowledged.

### 7.15 Reports and Performance Evaluation
- Inputs: Employee (management alone can select any employee), month, language, and report type.
- Pre-export preview: Official organization header, metric summary, daily logs, assignments, and projects.
- Export formats `PDF` and `Excel`; support preparation and failure states. Do not download an empty file when generation fails.
- Label current reports `Provisional` when their reporting cycle is not complete [SRS].
- Department-wide reports are for authorized management; no employee may receive another employee's data.
- Charts show title, unit, period, and no-data state. Never display unverified figures.

**Evaluation model specified in the BRD:**

```text
C = (Completed assignments / Assigned assignments) × 100
T = (Assignments completed on time / All completed assignments) × 100
S = (Social media materials submitted / Social media materials required) × 100
Total Score = 0.40 × C + 0.40 × T + 0.20 × S
```

- The `40/40/20` weights are **proposed in the BRD and configurable by ADMIN**, not immutable final policy.
- If no social media materials were assigned to an employee that month, redistribute the S weight according to the BRD and explain this through a tooltip.
- If there were no assignments at all, do not invent a 0% or 100% success rate; display `Insufficient Data` according to the evaluation policy.

### 7.16 Users and Permissions — ADMIN
- User table: Arabic/English name, role, job title, status, last login, and actions.
- Create-user form: Arabic and English names, email, mobile, role, job title, preferred language.
- States: Active / Deactivated. Deactivating a user ends active sessions while retaining historical records [SRS].
- Do not show deactivated users in active-assignee selectors; they may appear in historical records with a status label.
- Never permit deactivation of the last active ADMIN [SRS].
- Do not invent system roles or mix system administration privileges with project permissions.

### 7.17 Settings — ADMIN
- Report identity/header, time zone, working days and holidays, reminders, session settings, evaluation weights, logging policy, and exceptions if officially approved.
- Changes to high-impact settings require a review dialog and an audit record.
- Do not allow unrestricted changes to brand fonts, colors, or logo through general settings; report-header uploads must respect the approved logo and identity process.

### 7.18 Audit and System Health — ADMIN
- Searchable audit log filtered by actor, action, and date, ordered newest first.
- Health view: Last successful backup, notification queue size, and failed deliveries.
- Notification delivery interface: Pending / Sent / Failed / Retry.
- Never expose sensitive addresses or content in general error messages.
- **The UI cannot substitute for real backend logs or monitoring systems.**

---

## 8. System States and Semantics

### 8.1 Assignment States

```text
Assignment: Draft → Active (once sent) → Closed
                    ↘ Cancelled (reason recorded)

Per-assignee state:
Sent → Received → In Progress → Submitted → Approved
                       ↑              │
                       └─ Returned for Revision ─┘
```

**Important:** The interface and API must not permit skipping workflow stages, except for the specified return-for-revision transition. Double clicks and concurrent requests require atomic, conditional state changes as specified in the SRS.

| State | Proposed Badge | Employee Action | Management Action |
|---|---|---|---|
| Draft | `Draft` | None | Edit / Send |
| Sent | `Awaiting Receipt` | Receive | Monitor |
| Received | `Received` | Start Work | Monitor |
| In Progress | `In Progress` | Add Drive link and submit | Comment |
| Submitted | `Awaiting Review` | Follow up | Approve / Return |
| Approved | `Approved ✓` | View result | Close according to the rule |
| Returned for Revision | `Revision Required` | Read comment and resubmit | Monitor |
| Overdue (calculated) | `Overdue` | Submit / Explain | Follow up and report |
| Cancelled | `Cancelled` | View reason | Audit trail |

### 8.2 Assignment Priority
`Low / Medium / High / Urgent`, each with **persistent text, an icon, and a badge shape**; status distinctions must not depend on the badge color alone. Plum, Magenta, and Charcoal can be used where contrast is sufficient, without automatically introducing extra red or yellow.

### 8.3 Reading Is Not Execution
- Notification `read_at`: The user viewed the notification.
- Assignment `received_at`: The assignee clicked `Receive`.
- Circular `acked_at`: The recipient clicked `I Have Read It`.
- Assignment `delivered_at`: The assignee submitted a valid link.
- `approved_at`: An authorized reviewer approved the submission.

**Keeping these fields distinct is essential for accurate system indicators and UI state.**

---

## 9. Interaction Design and Feedback

| Event | UI Behavior | Backend Guarantee |
|---|---|---|
| Save work log | Brief loading followed by confirmed success | Exactly one operation; date restriction enforced |
| Save draft | Show `Draft Saved` | Confirmed, timestamped persistence |
| Send assignment | Review dialog, disabled button during sending | Duplicate send prevention |
| Submit Drive link | Format check before sending | Independent server-side validation |
| Approve/Return | Confirm where needed; mandatory return comment | Atomic state transition |
| Acknowledge circular | Update status across all screens | Idempotent acknowledgment |
| Export report | Preparing → Ready → Download | Valid file link and export log |
| Concurrent edits | Warn `A Newer Version Exists` | Version checking / conditional updates |
| Soft delete | Confirmation with effects explained | Audit + Soft Delete according to policy |
| Network loss | Explicit message and retry action | No duplicate creation on reconnection |

### 9.1 Draft Persistence
- **[Design Recommendation]** Warn before leaving a form with unsaved changes.
- Optionally persist a temporary local draft of nonsensitive content according to privacy policy; never misrepresent it as a server-saved draft.
- Assignment and circular drafts required by the SRS must be saved on the server and display their last saved time.

### 9.2 Consistent Message Tone
Use concise, formal, clear UI language without exaggeration or slang. Examples: `Sent`, `Review Required`, `Update Failed`, `No Matching Results`.

---

## 10. Responsive Behavior

| Component | Desktop | Mobile |
|---|---|---|
| Sidebar | Expanded or collapsed | Closable drawer |
| DataTable | Clear columns + sorting | Cards with four key details and a `Details` action |
| Dashboard | 3–4 columns depending on width | One or two KPI columns, followed by content |
| Filters | Responsive horizontal row | `Filter` button opens a separate panel |
| Assignment Detail | Side-by-side sections when space allows | Vertical sequence |
| Modals | Constrained width | Comfortable dialog or bottom sheet as needed |
| Actions | Organized button group | Visible primary action; others in an actions menu |
| Timeline | Spacious detail layout | Vertical timeline |
| Reports | Preview with controls | Fitted preview + clear download action |

**Required testing widths:** `360px`, `390px`, `768px`, `1024px`, `1280px`, and `1440px`, in Arabic and English, including 200% text zoom and verification that buttons remain accessible without overlap.

---

## 11. Accessibility

**[SRS]** WCAG 2.1 AA is the initial target. **[Recommendation]** Review WCAG 2.2 AA at implementation time when tooling permits.

1. Normal text contrast **≥ 4.5:1** and large text **≥ 3:1**.
2. Priority, error, and success indicators must not rely only on color.
3. Provide understandable field, icon, and button names in both Arabic and English.
4. Support complete keyboard navigation with a visible, suitably contrasted focus indicator using approved brand colors.
5. Move focus into an open dialog and restore it to the triggering element when the dialog closes.
6. Announce success/failure appropriately to screen readers without repeatedly announcing long notifications.
7. Associate error messages with their fields and explain how to correct them.
8. Use proper column headers in report tables and provide chart descriptions or equivalent data tables.
9. Respect `prefers-reduced-motion`; movement must never be essential to understanding an action.
10. Do not disable mobile browser zoom.

---

## 12. Bilingual Localization (RTL/LTR)

- All UI text must come from translation keys; do not scatter hardcoded strings across components [SRS].
- Use logical CSS properties for spacing and borders: `padding-inline-start`, `margin-inline-end`, `border-inline-start`.
- Set page direction with `dir="rtl"` or `dir="ltr"`, not through `text-align` alone.
- Mirror directional icons such as Back and chronological arrows when the language changes; do not mirror nondirectional icons.
- Google Drive URLs and email fields remain LTR even inside Arabic screens.
- Do not arbitrarily transliterate employee names; use `name_ar` and `name_en` as required by the SRS, falling back to the available name if one field is empty.
- Never automatically convert numerals into Eastern Arabic digits in either language; use `latn`.
- Test joined Arabic glyphs in PDF exports and correct English alignment after changing direction.

---

## 13. Icons, Charts, and Data

### 13.1 Icons
- Use a consistent icon library with uniform stroke weight and clear meaning. Library selection is **[Recommendation]**, not permission to introduce new brand colors.
- Dangerous-action buttons use text plus an icon, not an icon alone.
- Display unread counts as clear bell badges rather than an unexplained symbol.

### 13.2 Charts
- Each chart needs a title, time range, measurement unit, access to exact values (tooltip/table), and a zero/no-data state.
- Never invent data while loading; use a skeleton distinctly different from real values.
- With more than 6 series, consider a comparison table or filter to reduce clutter.
- Use the approved green for positive emphasis with dark text. Semantic gradations must remain within approved colors and be legible.
- Monthly evaluations must explain each metric, its source, and refresh frequency so provisional data is not mistaken for final performance.

---

## 14. PDF and Excel Report Standards

- Use the original approved organization report header without alteration.
- Include employee name/role, month/year, issue date, evaluation indicators, work logs, assignments, and projects [SRS].
- The report's export language must not change the language setting of the employee's account.
- Use Latin numerals in both Arabic and English reports.
- Correctly format Arabic table direction and column width, and repeat table headers when content flows across PDF pages.
- Test for split PDF rows, malformed Arabic glyphs, and inappropriate header repetition.
- Excel worksheets: `Summary / Work Logs / Assignments / Projects`, or their translations based on export language; place the report header at the top of the first worksheet [SRS].
- When a period contains no records, display `No Data for This Period` instead of an unexplained empty table.
- The audit log records who exported a report and when, according to permissions; it does not necessarily record the report's contents.
- **Note:** Social media and print sizes specified by the brand guide are not application viewport dimensions; they apply to creative deliverables when exported, not the web application's layout.

---

## 15. Permissions Affecting the UI

| Capability | ADMIN | Manager | Deputy | Employee |
|---|---|---|---|---|
| Log daily work | — | — | — | Own |
| View employee work logs | All | All | All | Own only |
| Create assignment | Yes | Yes | Yes | No |
| Receive/submit assignment | Only if assigned; ADMIN is not an assignee under the SRS assumption | No by default | No by default | Assigned to them only |
| Review submission | Yes | Yes | Yes | No |
| Create project | Yes | Yes | Yes | Own project |
| Issue circular | Yes | Yes | Yes | No |
| Acknowledge circular | If a recipient | If a recipient | If a recipient | If a recipient |
| Other employees' reports | Yes | Yes | Yes | No |
| Users and system settings | Yes | No | No | No |
| Audit and system health | Yes | No | No | No |

> **[Approval Required]** Under the formal SRS, the Manager, Deputy, and ADMIN do not log daily work, while the BRD explicitly asks whether they should. Keep the SRS matrix as the provisional design until the project owner decides. Also confirm whether a submission may be reviewed by any authorized reviewer or only by the assignment's creator.

---
## 16. Engineering Notes for UI/Data Consistency

1. Use a single source of truth for state; never derive one employee's status from another employee's records.
2. Use unique identifiers for assignments, circulars, and recipient notifications to prevent duplication during retries.
3. Show the last KPI refresh time; refreshing the dashboard must not recreate a circular popup.
4. Never show success before API confirmation; never discard typed text when saving fails.
5. Update relevant lists after a successful operation rather than forcing full-page reloads every time.
6. Use server time and the organizational time zone for time-sensitive policies, especially blocking yesterday's work entries.
7. Do not change sensitive settings without explaining the consequences, checking permissions, and recording the event.
8. Never permanently delete a record through the UI contrary to the archiving and audit policies.
9. Direct navigation to an assignment or report URL must undergo the same authorization checks.
10. Notification and circular states must be read from actual recipient records, not from the “latest general notification.”
11. Multi-assignee comment threads must preserve the employee privacy required by the SRS.
12. UI component design does not prescribe a technology stack; implementation may use any approved stack while preserving states and data semantics.

---

## 17. Implementation-Oriented CSS Design Tokens (Initial Draft)

> This is an initial engineering reference, **not** a production-ready library. Font asset names and paths must match the actual project files. Using `surface = #FFFFFF` **requires approval** from the identity owner before production use.

```css
:root {
  /* Official visual identity — exact approved values */
  --brand-magenta: #C80893;
  --brand-plum: #871281;
  --brand-charcoal: #444444;
  --brand-green: #83C704;
  --brand-lime: #A9D203;
  --brand-light-gray: #E6E7E9;

  /* Semantic mapping without new brand colors */
  --color-text: var(--brand-charcoal);
  --color-heading: var(--brand-plum);
  --color-page-background: var(--brand-light-gray);
  --color-accent: var(--brand-magenta);
  --color-focus: var(--brand-plum);
  --color-border: var(--brand-light-gray);
  --color-success-fill: var(--brand-green);
  --color-success-text: var(--brand-charcoal);
  /* --color-surface: #FFFFFF;  Approval required */

  --font-display: "AdvertisingExtraBold";
  --font-body: "Janna LT";
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --radius-input: 8px;
  --radius-card: 12px;
  --radius-dialog: 16px;
  --control-min-height: 44px;
  --sidebar-width: 248px;
  --focus-width: 3px;
}

html[dir="rtl"] { direction: rtl; }
html[dir="ltr"] { direction: ltr; }
body { font-family: var(--font-body); color: var(--color-text); }
h1 { font-family: var(--font-display); color: var(--color-heading); }
:focus-visible { outline: var(--focus-width) solid var(--color-focus); outline-offset: 2px; }
.ltr-data { direction: ltr; unicode-bidi: isolate; }

/* Example: semantic layout using logical properties */
.page-content { padding-inline: var(--space-6); }
.field-label { margin-block-end: var(--space-2); }
```

**Font configuration:** Map `@font-face` only to approved attachments, with weight `400` for Janna LT Regular and `700` for Janna LT Bold. Set `font-display: swap` and verify RTL behavior when fonts first load.

---

## 18. Figma / Frontend Component Naming Structure

| Layer | Proposed Names |
|---|---|
| Foundation | `foundations/colors`, `foundations/typography`, `foundations/spacing`, `foundations/grid` |
| UI primitives | `Button`, `Input`, `Select`, `Badge`, `Checkbox`, `Dialog`, `Toast` |
| App layout | `AppShell`, `TopBar`, `Sidebar`, `PageHeader`, `MobileNav` |
| Business components | `AssignmentCard`, `TaskStatusTimeline`, `CircularAckButton`, `WorkLogForm`, `ProjectStageList` |
| Data components | `KpiCard`, `ReportFilters`, `MonthlyReportPreview`, `AuditLogTable` |
| States | `LoadingState`, `EmptyState`, `ErrorState`, `PermissionDeniedState` |
| Variants | `variant=primary/secondary`, `size=sm/md/lg`, `state=default/loading/disabled` |

**Rule:** Do not build 10 different button implementations for 10 screens or encode authorization rules in multiple copies of the same component. Components should receive trustworthy permission information from the application layer, while the server independently enforces authorization.

---

## 19. Design Acceptance Tests (Design QA)

| ID | Scenario | Acceptance Criterion |
|---|---|---|
| DS-01 | Logo display | Official artwork, with no cropping or changes to color, proportions, or effects |
| DS-02 | Color audit | Every HEX code is from the approved palette or has a documented exception |
| DS-03 | Font audit | Approved AdvertisingExtraBold and Janna LT files are used |
| DS-04 | Numerals | `0–9` on every screen, notification, table, PDF, and Excel export |
| DS-05 | Language switching | Correct RTL/LTR, with no lost input or shifted elements |
| DS-06 | `360px` viewport | No page-level horizontal scrolling or inaccessible buttons |
| DS-07 | Employee authorization | Other employees' work remains invisible and inaccessible by direct URL |
| DS-08 | Work saving | Clear loading, one record only, success after server confirmation |
| DS-09 | Same-day restriction | Today's date shown; older dates blocked except under an approved exception, after policy is finalized |
| DS-10 | Multiple assignees | Independent recipient states without applying one person's status to everyone |
| DS-11 | Approval/return | Valid state transitions and mandatory comment on return |
| DS-12 | New circular | Appropriate popup for an eligible recipient, not repeated on Refresh |
| DS-13 | Circular acknowledgment | Only clicking `I Have Read It` registers acknowledgment |
| DS-14 | Notifications | Unread count matches recipient records; no duplicate event creation |
| DS-15 | Today's employee activity | Only employees who logged actual work today appear |
| DS-16 | Arabic PDF | Correct letterhead, joined Arabic letters, no cut-off tables, Latin numerals |
| DS-17 | Excel | Openable files; worksheet and report data match the database |
| DS-18 | Accessibility | Contrast, keyboard navigation, button labels, and visible focus |
| DS-19 | Error states | Network/permission/validation failures are never presented as success or misleading empty lists |
| DS-20 | Safe updates | Visual and functional testing before release; existing functionality stays intact |

### 19.1 Visual Test Set for Each Screen
- **Desktop Arabic**, **Desktop English**, **Mobile Arabic**, and **Mobile English**.
- Data scenarios: No records, one record, many records, long Arabic name, long English text, and partial data.
- States: Slow loading, 403, 500, offline, retry, and success.
- Properties: 200% zoom, keyboard navigation, notification count `0` or `99+`, Latin dates and numerals.

---

## 20. Outstanding Decisions and Conflicts

**The items below must be resolved before approving the final design for implementation.**

| ID | Topic | Current Situation | Required Decision |
|---|---|---|---|
| DEC-01 | Backdated work logs | SRS allows 7 days; current operational requirements prohibit this | Officially revise FR-LOG-05/06 and define the exception model |
| DEC-02 | Card surface color | White is not explicitly included in the HEX palette | Approve it as a neutral UI color or prohibit its use |
| DEC-03 | Logo | The guide requires the original asset from `Logo` | Provide the final artwork and establish numeric clear space |
| DEC-04 | English UI typeface | The guide specifies only the three approved font files/styles | Test Latin character coverage and approve a fallback if necessary |
| DEC-05 | Circular popup policy | Not detailed in the SRS | Define what counts as “new,” its display window, and nonrepetition |
| DEC-06 | Cancellation/deletion | BRD/SRS favor archiving; some operational requests refer to deletion for everyone | Define soft deletion, permissions, and visibility of historical data |
| DEC-07 | Assignment review | Approval by Manager/Deputy/ADMIN is an SRS assumption | Any authorized reviewer or only the assignment sender? |
| DEC-08 | Management work logging | BRD asks the question; SRS excludes it | Confirm who can log daily work |
| DEC-09 | Performance weights | `40/40/20` is proposed | Approve or customize before publishing scores |
| DEC-10 | 12-hour time format | Earlier operational preference; SRS does not specify the display template | Approve `ص/م` and `AM/PM` |
| DEC-11 | Administrative exceptions | Not yet documented in the SRS | Define grant/revoke behavior, auditing, and notification |
| DEC-12 | Session/filter limits | Only partially defined by the SRS | Test these alongside draft persistence and navigation behavior |
| DEC-13 | Actual font files | Font names approved; this document does not embed font binaries | Map the correct approved font assets into the project code |

---

## 21. Proposed Implementation Phases (Aligned with MVP Scope)

| Phase | Deliverables | Exit Condition |
|---|---|---|
| 0. Requirements Alignment | Resolve UI/business-impacting DEC items; approve identity assets | Project owner sign-off |
| 1. Foundations | Colors, typography, tokens, directionality, grid, accessibility baselines | Desktop/mobile UI review |
| 2. Core Components | Buttons, fields, tables, cards, badges, dialogs, toasts | State and contrast tests |
| 3. Employee Flows | Login, employee dashboard, daily logging, assignments, projects, circulars | Real user testing |
| 4. Management Flows | Dashboard, creation/sending, review, circular tracking, reports | Role/permission matrix check |
| 5. Admin Flows | Users, settings, approved exceptions, audit, system health | Full authorization testing |
| 6. Integration & QA | API binding, reactive updates, notifications, reports, responsive tests | Staging acceptance tests |
| 7. Release | Controlled deployment with rollback when needed | No Critical or High defects |

### 21.1 Protecting the Existing System
1. Wherever possible, isolate visual improvements from business logic and data changes.
2. Never edit Production directly without first validating changes in Staging.
3. Preserve field names, identifiers, permissions, and data structures; avoid incidental changes.
4. Re-test critical user journeys after each design change.
5. Record what changed and what remained unchanged in `CHANGELOG`.

---

## 22. Design and Development Handover Deliverables

### 22.1 UI/UX Designer Package
- Figma file with Foundations, Components, Variants, and Patterns.
- Information architecture and role-based user flow diagrams.
- All required screens in Arabic and English, Mobile and Desktop.
- Loading/Empty/Error/Success/Disabled variants for each screen.
- Prototype for work logging, assignment submission, approval, circulars, and reporting.
- Contrast review sheet and logo/icon clearance guidelines.

### 22.2 Frontend Team Package
- Design tokens, font names, and logo assets.
- A unified, reusable component library.
- Arabic/English translation dictionary.
- API state specification, permission fields, and state-dependent buttons.
- End-to-end tests covering screens, language switching, and responsiveness.
- A list of decisions requiring approval before final development.

### 22.3 Quality Assurance Package
- Documented results for `DS-01..DS-20`.
- Desktop/mobile screenshots in both language directions.
- Report of visual, security, and functional nonconformities, including severity and impact.
- Final design approval by the project owner and visual identity owner.

---

## 23. Final Approval Criteria (Definition of Done)

The Design System is ready for institutional implementation only when **all** of the following are satisfied:

- [ ] The identity matches: original logo, approved colors and typefaces, no prohibited effects.
- [ ] Any additional neutral UI surface color has been approved, if needed.
- [ ] Numerals are Latin `0–9` in Arabic and English and in exported documents.
- [ ] Every screen has desktop/mobile and RTL/LTR designs.
- [ ] Every component specifies loading/error/disabled/success behavior.
- [ ] Every action displays the actual server-confirmed outcome without duplicates or data loss.
- [ ] All role-specific screens match the SRS after resolving exceptions.
- [ ] Same-day logging and exceptions have a unified, approved rule across product, UI, and API.
- [ ] Notifications and circulars correctly distinguish reading, receipt, and acknowledgment.
- [ ] Reports can be previewed/exported while preserving the official header and text direction.
- [ ] Contrast, keyboard accessibility, and small-screen tests pass.
- [ ] Staging tests are completed before any production change.

---

## 24. References and Traceability Notes

1. **Official Visual Identity Guide:** `دليل الهوية البصرية المعتمدة – المؤسسة 2026.pdf` — pages 1–3. Page 1 defines the logo, colors, and fonts. Pages 2–3 cover creative-media publication and print standards, not direct web application layout requirements.
2. **BRD — v0.1:** Sections 4–10, 13, 15, and 16 (scope, roles, workflows, evaluation, acceptance, and open questions).
3. **SRS — v0.1:** Sections 4, 5, 6, 9, 10, 11, and 12 (permissions, functional requirements, state machines, notifications, screens, nonfunctional requirements, and acceptance).
4. **Operational decisions communicated for the project:** Same-day work logging, ADMIN exceptions, nonrepeating circular popup, showing only employees who logged work today, and 12-hour time format. **These do not constitute formal SRS changes until its approved version is updated.**

### Conclusion
**The proposed Design System is an institutional design specification that adopts rather than replaces the Association's approved visual identity and unifies components and interactions throughout the Media Department Work Management System.** The largest pre-implementation challenge is not picking border radii or colors, but **resolving conflicting business rules, standardizing notification/reading/exception behavior, and ensuring every screen reflects the actual, secure state of system data**.
