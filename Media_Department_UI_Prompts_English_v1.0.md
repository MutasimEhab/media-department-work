---
title: "Complete Sequential UI Prompts — Media Department Work Management System"
version: "1.0"
date: "2026-10-31"
language: "English"
artifact_type: "UI generation prompt pack"
prototype_data: "100% fictional, in-memory mock data"
references:
  - "BRD v0.1"
  - "SRS v0.1"
  - "Media Department Design System English v1.0"
  - "2026 Association Approved Visual Identity Guide"
---

# Media Department Work Management System — Complete UI Prompt Pack

## How to use this document

1. Paste **Prompt 00 — Project Foundation** into your AI UI builder/coding assistant **once**.
2. Build the numbered screens **in order**, one prompt at a time, inside the same project. Do not paste all prompts simultaneously.
3. Before each new screen, retain the existing application shell, components, fake records, routes, and mock state. Never regenerate the whole project unless instructed.
4. Review desktop Arabic, mobile Arabic, desktop English, and mobile English at every milestone.
5. This pack builds **UI and demo interactions using fake data only**. It does **not** prove the real API, email/SMS, delivery guarantees, authentication, authorization, backups, or production readiness.
6. For implementation, the approved brand logo is an existing static asset and must be supplied by the project owner. Do not invent or redraw it.

### Source of truth and unresolved decisions

- The BRD/SRS supply functions, core permissions, entities, and workflows; the Design System v1.0 provides interface recommendations. The prompts below are **a proposed UI implementation**, not a silently approved revision to the SRS.
- **Work logging discrepancy:** SRS FR-LOG-05/06 permits backdated entries (7 days); the owner's newer operational requirement is **today only**, with explicit ADMIN date exceptions. For this prototype, visually demonstrate the **newer operational flow**, mark it `PROVISIONAL / PENDING SRS APPROVAL`, and do not represent it as accepted in the SRS until amended.
- **Fonts discrepancy:** The brand guide permits AdvertisingExtraBold and Janna LT Regular/Bold. Cairo files were supplied separately but **are not formally in the approved brand guide**; do not activate Cairo without approval.
- **Surface color:** White (`#FFFFFF`) was not formally listed among the brand HEX values. Use listed colors; if a neutral white card is truly necessary, label it `pending brand approval` rather than silently adding it to the approved palette.
- **Review permissions, scoring weights, deletion policy, and circular popup policy** include provisional decisions. Flag relevant prototypes for stakeholder sign-off.

---

## Prompt 00 — Global foundation / project-wide instruction (paste FIRST)

```text
Act as a senior product designer, UI/UX architect, and frontend engineer. We are building a professional, bilingual (Arabic-first RTL, English LTR), responsive Media Department Work Management System for the Hearing and Sight Association for Development and Social Rehabilitation. Build an extensible UI prototype, screen by screen, using 100% fictional in-memory seed data. Do not connect to production systems, real SMS/email, Google Drive, or an authentication backend. Show a visible “DEMO DATA” indication in the development prototype.

IMPORTANT SOURCES: Follow the existing BRD v0.1, SRS v0.1, Media Department Design System English v1.0, and the Association's official 2026 Visual Identity Guide. Do not invent business rules or permissions when they conflict with these references. Mark unresolved choices as prototype assumptions.

OFFICIAL BRAND COLORS ONLY:
- Primary Magenta: #C80893
- Dark Plum: #871281
- Charcoal: #444444
- Fresh Green: #83C704
- Light Lime Green: #A9D203
- Light Gray Background: #E6E7E9
Do not introduce arbitrary blues, oranges, reds, or new decorative colors. For warnings/errors, combine approved colors with icons, text, and clear labels. The use of unlisted neutral whites needs explicit brand approval.

OFFICIAL FONTS: AdvertisingExtraBold for major display headings; Janna LT Regular and Janna LT Bold for body copy, forms, tables, and navigation. Font files will be supplied. Cairo is not officially approved in the guide and should remain disabled pending approval. Use no replacement/modified logo; only display the original uploaded asset with preserved proportions, colors, and safe space. If the official logo is not available, show a clearly labeled empty logo slot, not a fabricated brand mark.

LOCALES: Arabic is default with full right-to-left layout; English reverses to left-to-right. Internationalize every label, message, status, validation error, and chart caption. Preserve current route, filters, form inputs, and mock state during language change. Always display Latin numerals 0–9, including in Arabic screens, dates, counters, badges, reports, and exports. Use a 12-hour time presentation (ص/م in Arabic, AM/PM in English) as a PROVISIONAL display preference. Use an explicit configurable time zone.

INTERFACE: Use a calm institutional admin design. Desktop sidebar + topbar + content region, mobile drawer + compact topbar + card views for tables. Use logical CSS directions, a consistent 8px spacing rhythm, accessible focus indicators, tooltips, tabs, filter controls, and a shared component library. The shell includes: official logo area, current section, navigation by role, search as appropriate, language toggle, notification bell with unread count, user menu, and demo-role switcher. Primary actions must be visually consistent. Avoid visual clutter and heavy gradients, stock photos, invented hero illustrations, or ornamental elements.

ROLES: ADMIN, MANAGER, DEPUTY, EMPLOYEE. Role-specific links and actions must be controlled by mock permissions. ADMIN manages user accounts, settings, audit and system health. MANAGER/DEPUTY/ADMIN can issue assignments and circulars, review submissions, and view department-wide reports. EMPLOYEE can record their own work, access their own projects and assignments, acknowledge addressed circulars, and see their own reports. Avoid showing employees their peers' private work. UI visibility is only illustrative: real backend access control remains required.

FUNCTIONAL DOMAINS: authentication and recovery, manager dashboard, employee dashboard, daily work logs, assignments, projects, circulars and acknowledgments, notification center, monthly and department reports, users, settings, same-day date exceptions (owner's provisional update), audit log, delivery monitoring, system health, and personal profile. Assignment recipients maintain independent statuses. Internal notifications are primary; email/SMS are optional delivery choices. Assignment deliverables and daily work output links use Google Drive links ONLY (no user file uploads). An admin-only report header/logo upload is a separate documented exception.

COMPONENT QUALITY: Every screen must include a realistic populated state and also a representative loading, empty, error, form-validation, permission-denied, and success state when appropriate. Realistic fake interactions must update in-memory state, including counters and lists. Never claim a real email/SMS was delivered. Use accessible labels, keyboard navigation, 360px minimum mobile width, and desktop layouts. Design at 1440px and 390px representative widths.

TECHNICAL EXECUTION: Use the project's existing frontend stack. If no stack has been selected yet, you may use React + TypeScript + Tailwind strictly for the UI prototype, with reusable components, centralized mock data, simple mock API adapters, localization dictionaries, and route-based screens. Do not force this prototype-stack decision upon the final backend stack (the SRS only offers a proposal). Put fixtures into a dedicated mock-data module. Keep components modular and type-safe. No real secrets, external network calls, real accounts, or production changes.

WORKFLOW: After each next prompt, implement ONLY its requested screen(s), reusing all shared components. Show the route, the role(s), its desktop/mobile compositions, the actions it supports with fake data, and any unresolved assumption. Do not rewrite completed screens or change existing workflows unless absolutely necessary.

START by setting up the app shell, navigation model, translation keys, design tokens, reusable components, routes, role simulator, and mock data types. Then stop and wait for the next numbered screen prompt.
```

---

## Fictional shared demo data (reused in EVERY prompt)

All names, emails, phone numbers and Google Drive links below are **invented examples**, not actual employees or accessible files. Reuse these same mock records across screens.

| ID | Arabic name | English name | Role / job title | Demo email |
|---|---|---|---|---|
| U-001 | ريم الخطيب | Reem Al-Khatib | ADMIN / System Administrator | reem.admin@example.com |
| U-002 | عمر النجار | Omar Al-Najjar | MANAGER / Media Department Manager | omar.manager@example.com |
| U-003 | ليان يوسف | Layan Youssef | DEPUTY / Deputy Manager | layan.deputy@example.com |
| U-004 | نور حمدان | Noor Hamdan | EMPLOYEE / Graphic Designer & Content Writer | noor.designer@example.com |
| U-005 | سامر عادل | Samer Adel | EMPLOYEE / Photographer & Video Editor | samer.video@example.com |
| U-006 | مريم سليم | Maryam Salim | EMPLOYEE / Graphic Designer & Content Writer | maryam.content@example.com |
| U-007 | كريم شاهين | Kareem Shaheen | EMPLOYEE / Photographer & Video Editor | kareem.media@example.com |
| U-008 | هبة عيسى | Hiba Issa | EMPLOYEE / Graphic Designer & Content Writer, inactive | hiba.inactive@example.com |

**Frozen demo date:** `2026-10-31`, in the demo time zone. Every “Today” summary is based on this date, NOT the viewer's actual clock, to make screenshots reproducible. Use 12-hour times (`09:15 AM`, `11:30 AM`; Arabic `09:15 ص`, `11:30 ص`). **October 2026** is the demo reporting month.

**Reusable tasks:**
- `TSK-101` — “October Campaign Social Media Cards”; creator Omar; assignees Noor and Maryam; priority High; deadline `2026-11-02 05:00 PM`; Noor In Progress, Maryam Received; social_media type.
- `TSK-102` — “Water Distribution Photo Coverage”; creator Layan; assignee Samer; priority Urgent; deadline `2026-10-30 04:00 PM`; Submitted, Overdue based on first submission; normal type.
- `TSK-103` — “Edit Program Recap Video”; creator Omar; assignee Kareem; priority Medium; deadline `2026-11-03 02:00 PM`; Approved; normal type.
- `TSK-104` — “Write Publication Captions”; creator Layan; assignee Noor; priority Low; deadline `2026-11-05 01:00 PM`; Draft (never assigned until Send).
- `TSK-105` — “Prepare Event Photo Selection”; creator Omar; assignee Samer; priority Medium; deadline `2026-11-01 10:00 AM`; Submitted, awaiting review.

**Reusable projects:**
- `PRJ-201` — “Autumn Media Campaign”; owner Noor; 3 of 5 stages complete; In Progress; optional relation `TSK-101`.
- `PRJ-202` — “Community Program Documentation”; owner Samer; 2 of 4 stages complete; In Progress.
- `PRJ-203` — “Monthly Publication Archive”; owner Maryam; 4 of 4 stages complete; Completed.

**Reusable circulars:**
- `CIR-301` — “Daily Work Logging Policy”; issued by Omar on `2026-10-31 08:30 AM`; Employees Only; Noor: unacknowledged, Samer: acknowledged `09:05 AM`, Maryam: unacknowledged, Kareem: acknowledged `09:10 AM`. This may trigger the provisional new-circular popup only once per publishing event until acknowledged, following the proposed UX policy.
- `CIR-302` — “November Content Planning Meeting”; issued by Layan on `2026-10-29 01:00 PM`; Everyone; previously acknowledged by Noor; visible in archive, **not** a new-circular popup.
- `CIR-303` — “Updated Media Delivery Instructions”; Draft; issuer Omar; not visible to recipients.

**Reusable demo work logs:**
- `LOG-401` — Noor, `2026-10-31`, “Design campaign social cards”, “Office”, `10:15 AM`, linked to `PRJ-201`.
- `LOG-402` — Samer, `2026-10-31`, “Photograph field activity”, “Field”, `11:20 AM`, linked to `PRJ-202`.
- `LOG-403` — Maryam, `2026-10-30`, “Write content plan”, “Office”, `03:25 PM` (yesterday, **must not count as a today log**).
- `LOG-404` — Kareem, `2026-10-27`, “Edit recap footage”, “Office”, `02:00 PM` (older, **must not count as a today log**).

**Fictional Google Drive URLs:** `https://drive.google.com/file/d/DEMO_FAKE_ID_001/view` and `https://drive.google.com/file/d/DEMO_FAKE_ID_002/view`. Treat as non-working placeholders and mark them `Demo Link`; URL domain is syntactically correct for UI validation examples.

**Demo notifications:** `NTF-501` TSK-101 assigned to Noor (unread); `NTF-502` CIR-301 published for Noor (unread); `NTF-503` TSK-102 submitted to Layan (read); `NTF-504` TSK-105 awaiting review for Omar (unread). Seed counters by logged-in user, never globally.

**Demo report:** For Noor's illustrative **separate monthly score fixture**: 10 eligible assignments, 9 completed, 8 completed on time, 5 required social-media materials, and 4 submitted. Score `C=90`, `T=88.89`, `S=80`, total `87.56` with provisional 40/40/20 weights. Label these as an independent aggregate reporting fixture, not a count inferred from the five UI sample tasks. Never derive fake dashboard totals from absent detailed records unless an explicit aggregate fixture exists.

**Role switcher:** Reem (ADMIN), Omar (MANAGER), Layan (DEPUTY), Noor (EMPLOYEE). Demo login changes mock identity only; no real authentication occurs. Maintain coherent fake state changes across the application.

---
## Prompt 01 — Design foundations, components, and navigation shell

**Route:** `/app`  
**Access:** All roles

```text
Continue in the SAME existing UI prototype. Reuse Prompt 00, the official brand assets and fonts, all shared mock fixtures, localization dictionaries, role guards, and components. Implement ONLY this next screen/flow; preserve completed screens and data.

Create the reusable visual language and responsive application shell only; no full dashboard yet. Set up all approved color tokens and typography, right-to-left sidebar and topbar, English left-to-right mirroring, active navigation, breadcrumb, notification count, role-based menu, avatar/initials, language control, demo-role switcher, and privacy-safe page guards. Build reusable Button, TextField, Textarea, DatePicker, TimePicker, Select, MultiSelect, RadioGroup, Checkbox, Badge, Card, Table, responsive MobileCardList, Tabs, FilterBar, SearchInput, Modal, Drawer, Toast, Tooltip, Skeleton, ProgressBar, Stepper, ActivityTimeline, Pagination, and EmptyState. Showcase component states in a developer-only /demo/components page. Use existing shared seed data, not new people. Try 1440px and 390px with long Arabic strings. Navigation must route to placeholders, not broken links. Keep focus/hover/disabled states accessible; status always includes a text label. Do not change any domain rules.

Delivery checklist for this step: (1) rendered screen and working local route; (2) consistent preloaded fake data; (3) realistic working in-memory interactions; (4) Arabic RTL and English LTR; (5) desktop and mobile layouts; (6) relevant loading/empty/error/permission states; (7) no live API, real messages, or invented identity assets; (8) list any unresolved business-rule assumption instead of silently deciding it. Stop after finishing this screen.
```

---
## Prompt 02 — Sign in and recover password

**Route:** `/auth/login, /auth/forgot-password, /auth/reset-password`  
**Access:** All roles

```text
Continue in the SAME existing UI prototype. Reuse Prompt 00, the official brand assets and fonts, all shared mock fixtures, localization dictionaries, role guards, and components. Implement ONLY this next screen/flow; preserve completed screens and data.

Create a clean institutional sign-in experience with the original logo slot, product name, email, password show/hide, remember session option only if compliant with the SRS session rule, language toggle, “Forgot password?” and an accessible Submit action. Add separate forgot-password request and one-time reset screen designs; explain that all email/password operations are mocked. Provide fixture credentials or a “Choose demo user” panel without implying genuine security. Fake states: invalid email, invalid password, required fields, account inactive (Hiba), 5 failed attempts / 15-minute lock (simulated), submitting spinner, mock success redirect to the role-specific dashboard, and expired reset link. On small screens show no cut-off. Maintain clear Arabic and English translations and Latin numbers.

Delivery checklist for this step: (1) rendered screen and working local route; (2) consistent preloaded fake data; (3) realistic working in-memory interactions; (4) Arabic RTL and English LTR; (5) desktop and mobile layouts; (6) relevant loading/empty/error/permission states; (7) no live API, real messages, or invented identity assets; (8) list any unresolved business-rule assumption instead of silently deciding it. Stop after finishing this screen.
```

---
## Prompt 03 — Management dashboard

**Route:** `/app/dashboard`  
**Access:** MANAGER, DEPUTY, ADMIN

```text
Continue in the SAME existing UI prototype. Reuse Prompt 00, the official brand assets and fonts, all shared mock fixtures, localization dictionaries, role guards, and components. Implement ONLY this next screen/flow; preserve completed screens and data.

Build the management overview for Omar by default with an October 2026 month filter. Header greeting, last demo refresh label, 4 KPI cards: active assignments, overdue assignments, awaiting review, and unacknowledged circulars; each card links to its filtered list. Add assignments-by-state chart, monthly on-time performance chart using explicitly labeled aggregate demo metrics, office-vs-field breakdown, employee performance view without inventing production totals, recent activity feed, today's logged-work table (ONLY Noor and Samer from 2026-10-31), pending approvals (TSK-105), recent circular acknowledgments, and quick actions to assign tasks or publish circulars. Include no-data/loading/error visual variations. Never show Maryam or Kareem under “Logged work today” since their logs are older. Ensure cards and filters update coherently in memory and no chart numbers contradict the shared fixture.

Delivery checklist for this step: (1) rendered screen and working local route; (2) consistent preloaded fake data; (3) realistic working in-memory interactions; (4) Arabic RTL and English LTR; (5) desktop and mobile layouts; (6) relevant loading/empty/error/permission states; (7) no live API, real messages, or invented identity assets; (8) list any unresolved business-rule assumption instead of silently deciding it. Stop after finishing this screen.
```

---
## Prompt 04 — Employee dashboard

**Route:** `/app/my-dashboard`  
**Access:** EMPLOYEE

```text
Continue in the SAME existing UI prototype. Reuse Prompt 00, the official brand assets and fonts, all shared mock fixtures, localization dictionaries, role guards, and components. Implement ONLY this next screen/flow; preserve completed screens and data.

Design Noor’s personalized employee landing page. Show greeting, today's date (Latin digits), one large “Log Today’s Work” CTA, current-month recorded-work-day count (from explicit seed fixture), assigned tasks with state and priority, overdue/near-deadline notices, unacknowledged circular alert for CIR-301, 2 unread notifications, and compact provisional score widget showing Noor’s sample 87.56 score. Show next steps rather than management-wide charts. The “I Have Read” action should only be available inside the circular detail or its authorized popup. Do not leak other employees’ work. Add empty state for a newly hired user and a mobile view with focused quick actions. Show that score weights are provisional.

Delivery checklist for this step: (1) rendered screen and working local route; (2) consistent preloaded fake data; (3) realistic working in-memory interactions; (4) Arabic RTL and English LTR; (5) desktop and mobile layouts; (6) relevant loading/empty/error/permission states; (7) no live API, real messages, or invented identity assets; (8) list any unresolved business-rule assumption instead of silently deciding it. Stop after finishing this screen.
```

---
## Prompt 05 — Quick daily work entry

**Route:** `/app/work/new`  
**Access:** EMPLOYEE

```text
Continue in the SAME existing UI prototype. Reuse Prompt 00, the official brand assets and fonts, all shared mock fixtures, localization dictionaries, role guards, and components. Implement ONLY this next screen/flow; preserve completed screens and data.

Design an exceptionally fast daily work form that can be completed under 60 seconds. Required fields: date fixed to the demo's TODAY 2026-10-31, nature of work (free text), work area (free text), and work mode (Office/Field). Day/year are derived automatically; optional short description, Google Drive output URL, assignment selector, project selector. Autofill suggestions can come from Noor’s own previous inputs; no fixed work categories. Clear Save Work button, unsaved changes protection, inline URL validation, duplicate-entry warning, spinner, saved confirmation, and only one submitted record per user action (double-click safe). Important provisional owner rule: no earlier date can be selected without a valid ADMIN-issued date exception; show explanatory locked date UI and link to “My Exceptions” when relevant. Display a visible note that this supersedes the draft SRS's 7-day rule PENDING FORMAL APPROVAL. No files uploaded; use Drive links only. Simulate saving a new record and immediately update My Work and Today dashboard metrics.

Delivery checklist for this step: (1) rendered screen and working local route; (2) consistent preloaded fake data; (3) realistic working in-memory interactions; (4) Arabic RTL and English LTR; (5) desktop and mobile layouts; (6) relevant loading/empty/error/permission states; (7) no live API, real messages, or invented identity assets; (8) list any unresolved business-rule assumption instead of silently deciding it. Stop after finishing this screen.
```

---
## Prompt 06 — My work history and record detail

**Route:** `/app/work`  
**Access:** EMPLOYEE

```text
Continue in the SAME existing UI prototype. Reuse Prompt 00, the official brand assets and fonts, all shared mock fixtures, localization dictionaries, role guards, and components. Implement ONLY this next screen/flow; preserve completed screens and data.

Create a list of Noor’s personal daily work entries with list/cards, search, filters for month, work mode and work area, clear record count, and a link to add new work. Open a detail drawer with date, description, project/assignment links, optional Drive URL and activity history. Add Edit and Archive actions only if enabled by the provisional current date/exception policy; otherwise show explicit reasons why an older entry is locked. Mock soft-delete/archive behavior and confirm dialogs; never silently erase historical data. Show 0-results, empty first use, loading, and a duplicate warning. Desktop data table and mobile stacked cards. Do not expose Samer, Maryam, or Kareem's entries to Noor.

Delivery checklist for this step: (1) rendered screen and working local route; (2) consistent preloaded fake data; (3) realistic working in-memory interactions; (4) Arabic RTL and English LTR; (5) desktop and mobile layouts; (6) relevant loading/empty/error/permission states; (7) no live API, real messages, or invented identity assets; (8) list any unresolved business-rule assumption instead of silently deciding it. Stop after finishing this screen.
```

---
## Prompt 07 — Management employee work logs

**Route:** `/app/management/work-logs`  
**Access:** ADMIN, MANAGER, DEPUTY

```text
Continue in the SAME existing UI prototype. Reuse Prompt 00, the official brand assets and fonts, all shared mock fixtures, localization dictionaries, role guards, and components. Implement ONLY this next screen/flow; preserve completed screens and data.

Build a comprehensive management log review table with filters for employee, month, exact date, office/field, location/area, and keyword. Show Noor’s LOG-401 and Samer’s LOG-402 when “Today 2026-10-31” is selected; exclude LOG-403/404 from that today subset. Columns: employee, job title, date, nature of work, area, mode, associated project/assignment, entered at, view detail. Add “Today’s Active Loggers” summary, explicit no-submission indicator for Maryam and Kareem, download/export preview (demo only), and read-only log detail. Managers can view department data but cannot forge employee work entries. Provide responsive mobile employee cards, strong loading/error states, and explain that user-submitted logs do not require approval.

Delivery checklist for this step: (1) rendered screen and working local route; (2) consistent preloaded fake data; (3) realistic working in-memory interactions; (4) Arabic RTL and English LTR; (5) desktop and mobile layouts; (6) relevant loading/empty/error/permission states; (7) no live API, real messages, or invented identity assets; (8) list any unresolved business-rule assumption instead of silently deciding it. Stop after finishing this screen.
```

---
## Prompt 08 — Assignment list and advanced filters

**Route:** `/app/assignments`  
**Access:** All roles with scoped access

```text
Continue in the SAME existing UI prototype. Reuse Prompt 00, the official brand assets and fonts, all shared mock fixtures, localization dictionaries, role guards, and components. Implement ONLY this next screen/flow; preserve completed screens and data.

Create a responsive assignments page with tabs for Active, Awaiting Review, Overdue, Completed, Drafts (authorized creators only), and Cancelled/Archived. Provide search, assigned employee selector for management, priority, deadline window, assignment kind, sorting, counts that match seeded fixtures, and create button visible only to ADMIN/MANAGER/DEPUTY. Employees only see their own assigned tasks, including individual status for multi-assignee assignments. Show TSK-101 through TSK-105 depending on role; do NOT show draft TSK-104 to employees until sent. Row fields: ID, title, priority, due date with AM/PM, assigned users, per-user progress, derived overdue state, last change, actions. On mobile transform tables into cards. Provide details links, empty states, skeletons, and filtered-results state with clear-reset action.

Delivery checklist for this step: (1) rendered screen and working local route; (2) consistent preloaded fake data; (3) realistic working in-memory interactions; (4) Arabic RTL and English LTR; (5) desktop and mobile layouts; (6) relevant loading/empty/error/permission states; (7) no live API, real messages, or invented identity assets; (8) list any unresolved business-rule assumption instead of silently deciding it. Stop after finishing this screen.
```

---
## Prompt 09 — Create/edit assignment and draft

**Route:** `/app/assignments/new, /app/assignments/:id/edit`  
**Access:** ADMIN, MANAGER, DEPUTY

```text
Continue in the SAME existing UI prototype. Reuse Prompt 00, the official brand assets and fonts, all shared mock fixtures, localization dictionaries, role guards, and components. Implement ONLY this next screen/flow; preserve completed screens and data.

Design a structured assignment editor for a new assignment and draft TSK-104. Required: bilingual-friendly title, description, priority Low/Medium/High/Urgent, future due date and time, one or more active employee assignees, kind Normal/Social Media, optional reference Google Drive URL. Split into logical sections rather than a long cluttered form. Include Save Draft and Send Assignment actions with distinct confirmation, selected recipients preview, optional Email and SMS toggles OFF by default, and always-on internal notifications. Add per-assignment reminder options (24h/2h/daily overdue default). Validate future due dates, no employees, duplicate employee choice, invalid URL, and network-like errors. Save Draft keeps content across navigation and manual refresh in the demo. Sending updates assignees and notification counters exactly once, even on double click; label email/SMS as simulated, not delivered. Respect current owner/date assumptions.

Delivery checklist for this step: (1) rendered screen and working local route; (2) consistent preloaded fake data; (3) realistic working in-memory interactions; (4) Arabic RTL and English LTR; (5) desktop and mobile layouts; (6) relevant loading/empty/error/permission states; (7) no live API, real messages, or invented identity assets; (8) list any unresolved business-rule assumption instead of silently deciding it. Stop after finishing this screen.
```

---
## Prompt 10 — Employee assignment details and submission

**Route:** `/app/assignments/:id`  
**Access:** EMPLOYEE, assigned assignee only

```text
Continue in the SAME existing UI prototype. Reuse Prompt 00, the official brand assets and fonts, all shared mock fixtures, localization dictionaries, role guards, and components. Implement ONLY this next screen/flow; preserve completed screens and data.

Build the assignee view for Noor on TSK-101: detail header, title, owner, description, priority, deadline, assigned employees listed only in a non-sensitive way, and a personal status stepper Sent → Received → In Progress → Submitted → Approved, with Returned leading back to In Progress. Clear role- and state-appropriate actions Receive, Start Work, Submit Work. Submission opens a modal requiring at least one Google Drive URL, supports multiple URLs and an optional note; reject non-Drive domains. Show read-only submission history, first delivery timestamp, personal timeline, comment thread limited to the assignee and authorized approvers, and “Flag issue” checkbox. Use realistic seeded comments. Status buttons must respect valid transitions and prevent repeated notifications. Show a Returned example in a storybook state, overdue as derived date condition, and a permission denied view when employee accesses an unrelated task. No local file attachment controls.

Delivery checklist for this step: (1) rendered screen and working local route; (2) consistent preloaded fake data; (3) realistic working in-memory interactions; (4) Arabic RTL and English LTR; (5) desktop and mobile layouts; (6) relevant loading/empty/error/permission states; (7) no live API, real messages, or invented identity assets; (8) list any unresolved business-rule assumption instead of silently deciding it. Stop after finishing this screen.
```

---
## Prompt 11 — Management assignment review and activity timeline

**Route:** `/app/assignments/:id/review`  
**Access:** ADMIN, MANAGER, DEPUTY

```text
Continue in the SAME existing UI prototype. Reuse Prompt 00, the official brand assets and fonts, all shared mock fixtures, localization dictionaries, role guards, and components. Implement ONLY this next screen/flow; preserve completed screens and data.

Design management detail/review for TSK-105 and multi-assignee TSK-101. At top show assignment-level overview, original/current deadline if changed, creator, priority, recipients and progress. Each recipient gets an independent status card and separate comments/activity thread; approving one must not approve others. When a submission is present show Google Drive links, note, initial submission time and Approve / Return for Revision actions. Return requires a written reason. Display one audit-like timeline for status changes, comments, reassignment, deadline modifications, and notifications with Latin numerals. Add Close/Cancel actions with permission-aware confirmation and reason; mark unclear cancellation policy as provisional. TSK-102 illustrates overdue submission. Add loading, concurrent-change, repeated-click and no-submission states. Never make the UI claim real notifications or real Drive access.

Delivery checklist for this step: (1) rendered screen and working local route; (2) consistent preloaded fake data; (3) realistic working in-memory interactions; (4) Arabic RTL and English LTR; (5) desktop and mobile layouts; (6) relevant loading/empty/error/permission states; (7) no live API, real messages, or invented identity assets; (8) list any unresolved business-rule assumption instead of silently deciding it. Stop after finishing this screen.
```

---
## Prompt 12 — Projects overview

**Route:** `/app/projects`  
**Access:** ADMIN, MANAGER, DEPUTY, EMPLOYEE with scoped data

```text
Continue in the SAME existing UI prototype. Reuse Prompt 00, the official brand assets and fonts, all shared mock fixtures, localization dictionaries, role guards, and components. Implement ONLY this next screen/flow; preserve completed screens and data.

Build an organized Projects workspace distinct from Assignments. Include cards/table view, ownership and status filters, date range, progress bar based on completed stages/total stages, expected end date, optional linked assignment, and clear “Create Project” action. Management sees PRJ-201/202/203; Noor sees only PRJ-201. Showcase In Progress, Completed, and Closed visual states. No invented approval lifecycle: projects document work/stages rather than being manager-issued assignments. For closed projects show read-only state. Use responsive list cards and accessible progress descriptions like “3 of 5 stages completed”. Provide empty states, filter reset, and saved in-memory selection.

Delivery checklist for this step: (1) rendered screen and working local route; (2) consistent preloaded fake data; (3) realistic working in-memory interactions; (4) Arabic RTL and English LTR; (5) desktop and mobile layouts; (6) relevant loading/empty/error/permission states; (7) no live API, real messages, or invented identity assets; (8) list any unresolved business-rule assumption instead of silently deciding it. Stop after finishing this screen.
```

---
## Prompt 13 — Project creation and stage editor

**Route:** `/app/projects/new, /app/projects/:id`  
**Access:** Project owner and authorized management

```text
Continue in the SAME existing UI prototype. Reuse Prompt 00, the official brand assets and fonts, all shared mock fixtures, localization dictionaries, role guards, and components. Implement ONLY this next screen/flow; preserve completed screens and data.

Create Project form with title, description, owner selector restricted by role, start date, expected end date, optional assignment association, and Save. Detail view for PRJ-201 should include 5 ordered stages, 3 completed, stage status, completion timestamp, optional Drive link, add stage, reorder stage (drag/drop plus accessible up/down controls), mark complete, edit stage, and close project. Project owner or management can edit stages; a Closed project is read-only and may only be reopened by ADMIN per SRS. Progress recalculates immediately using demo state. Show activity history, empty-stage design, confirm dialogs, and mobile-friendly stage list. No system file uploads and no accidental conversion into an assignment.

Delivery checklist for this step: (1) rendered screen and working local route; (2) consistent preloaded fake data; (3) realistic working in-memory interactions; (4) Arabic RTL and English LTR; (5) desktop and mobile layouts; (6) relevant loading/empty/error/permission states; (7) no live API, real messages, or invented identity assets; (8) list any unresolved business-rule assumption instead of silently deciding it. Stop after finishing this screen.
```

---
## Prompt 14 — Circular inbox, archive, reading and acknowledgment

**Route:** `/app/circulars`  
**Access:** All roles, addressed recipients only

```text
Continue in the SAME existing UI prototype. Reuse Prompt 00, the official brand assets and fonts, all shared mock fixtures, localization dictionaries, role guards, and components. Implement ONLY this next screen/flow; preserve completed screens and data.

Build a circular center with unread/unacknowledged inbox, read/acknowledged sections, archive and keyword/date/issuer filters. Noor sees CIR-301 unacknowledged and CIR-302 acknowledged; not draft CIR-303. Circular detail displays title, issuer, publication time, formatted body and optional Drive links. Show explicit “I Have Read It” button; merely opening does NOT mark acknowledged. Clicking it once sets acknowledged timestamp, updates management tracking and the employee counter, and disables duplicate acknowledgments. Include archive/read-history, search, empty, loading, and permission-denied views. For a newly published relevant circular, create a separate one-time attention dialog: should not reappear after refresh just because the user has not acknowledged an old one; display policy is PROVISIONAL and separate from acknowledgment. Never show a circular to a non-recipient.

Delivery checklist for this step: (1) rendered screen and working local route; (2) consistent preloaded fake data; (3) realistic working in-memory interactions; (4) Arabic RTL and English LTR; (5) desktop and mobile layouts; (6) relevant loading/empty/error/permission states; (7) no live API, real messages, or invented identity assets; (8) list any unresolved business-rule assumption instead of silently deciding it. Stop after finishing this screen.
```

---
## Prompt 15 — Compose and publish a circular

**Route:** `/app/circulars/new, /app/circulars/:id/edit`  
**Access:** ADMIN, MANAGER, DEPUTY

```text
Continue in the SAME existing UI prototype. Reuse Prompt 00, the official brand assets and fonts, all shared mock fixtures, localization dictionaries, role guards, and components. Implement ONLY this next screen/flow; preserve completed screens and data.

Create an official-looking circular editor. Fields: title, rich-text body with only bold/lists/links, optional Drive links, audience selector Everyone / Employees Only / Specific People, multi-person recipient selector, and optional Email/SMS toggles off by default. Show selected recipient preview and count based on active users, message preview in Arabic/English, Save Draft and Publish actions. Publication creates a frozen recipient snapshot, internal notifications always, and demo external delivery statuses marked Simulated. Disallow publishing with 0 recipients. Once published, text is immutable; offer a “Publish Correction” flow linked to the original rather than editing historical content. Include confirmation modal, draft persistence, loading/errors, and consistent record update in inbox and tracking. Never give employees a publish button.

Delivery checklist for this step: (1) rendered screen and working local route; (2) consistent preloaded fake data; (3) realistic working in-memory interactions; (4) Arabic RTL and English LTR; (5) desktop and mobile layouts; (6) relevant loading/empty/error/permission states; (7) no live API, real messages, or invented identity assets; (8) list any unresolved business-rule assumption instead of silently deciding it. Stop after finishing this screen.
```

---
## Prompt 16 — Circular tracking and recipient matrix

**Route:** `/app/circulars/:id/tracking`  
**Access:** ADMIN, MANAGER, DEPUTY

```text
Continue in the SAME existing UI prototype. Reuse Prompt 00, the official brand assets and fonts, all shared mock fixtures, localization dictionaries, role guards, and components. Implement ONLY this next screen/flow; preserve completed screens and data.

Design a tracking screen for CIR-301 with issuer, published timestamp, audience, total intended recipients 4, acknowledged 2 (Samer, Kareem), unacknowledged 2 (Noor, Maryam), labeled proportion chart and recipient table. Fields: recipient, role/job title, acknowledgment status, timestamp, number of reminders sent, last reminder attempt. Filters for acknowledged/unacknowledged and search. Add Send Reminder action only for unacknowledged recipients, count preview, confirmation, and explicit simulated delivery status. Include Export Preview/CSV mock action and detailed per-person history. Acknowledgment is based on explicit action only. Refreshing or switching screens should preserve demo state. Avoid exposing recipient status to ordinary employees.

Delivery checklist for this step: (1) rendered screen and working local route; (2) consistent preloaded fake data; (3) realistic working in-memory interactions; (4) Arabic RTL and English LTR; (5) desktop and mobile layouts; (6) relevant loading/empty/error/permission states; (7) no live API, real messages, or invented identity assets; (8) list any unresolved business-rule assumption instead of silently deciding it. Stop after finishing this screen.
```

---
## Prompt 17 — Notification bell and notification center

**Route:** `/app/notifications`  
**Access:** All roles, own records only

```text
Continue in the SAME existing UI prototype. Reuse Prompt 00, the official brand assets and fonts, all shared mock fixtures, localization dictionaries, role guards, and components. Implement ONLY this next screen/flow; preserve completed screens and data.

Build compact topbar notification popover and full Notification Center. Bell with accurate unread count for current demo user, chronological grouped-by-day list with assignment/circular/comment/reminder icons from approved-color system, actor, concise summary, created time, and a direct link to the relevant object. Add Mark as Read, Mark All as Read, Unread filter, type filter and empty state. Clicking a notification does NOT silently acknowledge a circular or receive an assignment. Events must have stable dedupe IDs; simulate no duplicates upon rerender/refresh/re-entry. For Noor start with NTF-501 and NTF-502 unread. Include a network-error variant, pagination and accessible popover controls. On mobile provide a dedicated page. External Email/SMS channels are not real integrations.

Delivery checklist for this step: (1) rendered screen and working local route; (2) consistent preloaded fake data; (3) realistic working in-memory interactions; (4) Arabic RTL and English LTR; (5) desktop and mobile layouts; (6) relevant loading/empty/error/permission states; (7) no live API, real messages, or invented identity assets; (8) list any unresolved business-rule assumption instead of silently deciding it. Stop after finishing this screen.
```

---
## Prompt 18 — Employee monthly report preview and export

**Route:** `/app/reports/my`  
**Access:** EMPLOYEE

```text
Continue in the SAME existing UI prototype. Reuse Prompt 00, the official brand assets and fonts, all shared mock fixtures, localization dictionaries, role guards, and components. Implement ONLY this next screen/flow; preserve completed screens and data.

Create Noor’s personal monthly report for October 2026. Month filter, preview with original organization's letterhead/logo placeholder asset, name and role, issued-at timestamp, score cards C 90%, T 88.89%, S 80%, final 87.56 (Very Good) from a separately labeled aggregate fixture using provisional 40/40/20 weights. Show daily work table, assignments with deadline/first submission/on-time, project stage summary, and footnote explaining provisional scores until month finalization. Provide formats On-Screen, PDF, Excel; for demo, implement working preview and a clearly marked mock download or a valid local export if feasible; never claim a PDF/Excel exists if not implemented. Ensure Arabic RTL letters render correctly and Latin numerals stay Latin. Employees cannot choose another person's report. Include month with no data, loading, and export error states.

Delivery checklist for this step: (1) rendered screen and working local route; (2) consistent preloaded fake data; (3) realistic working in-memory interactions; (4) Arabic RTL and English LTR; (5) desktop and mobile layouts; (6) relevant loading/empty/error/permission states; (7) no live API, real messages, or invented identity assets; (8) list any unresolved business-rule assumption instead of silently deciding it. Stop after finishing this screen.
```

---
## Prompt 19 — Department reporting and employee comparison

**Route:** `/app/reports/department`  
**Access:** ADMIN, MANAGER, DEPUTY

```text
Continue in the SAME existing UI prototype. Reuse Prompt 00, the official brand assets and fonts, all shared mock fixtures, localization dictionaries, role guards, and components. Implement ONLY this next screen/flow; preserve completed screens and data.

Build a management reporting hub with selectable October 2026 month, department summary, employee selector, sortable employee comparison table, scoring component tooltips, assignment completion trends, compliance indicator by working day, office/field split, export controls and per-person report links. Use coherent explicitly defined mock aggregate metrics; for Noor show 87.56 from seed aggregate and label others as illustrative independently seeded aggregates. Filters should affect table/charts, and privacy is enforced by demo role. Design meaningful chart empty states and clear language about provisional versus finalized months. Do not create an undisclosed fourth performance metric. Show preview and status feedback for PDF/Excel exports with official header. Include a no-records scenario.

Delivery checklist for this step: (1) rendered screen and working local route; (2) consistent preloaded fake data; (3) realistic working in-memory interactions; (4) Arabic RTL and English LTR; (5) desktop and mobile layouts; (6) relevant loading/empty/error/permission states; (7) no live API, real messages, or invented identity assets; (8) list any unresolved business-rule assumption instead of silently deciding it. Stop after finishing this screen.
```

---
## Prompt 20 — User directory and account administration

**Route:** `/app/admin/users`  
**Access:** ADMIN only

```text
Continue in the SAME existing UI prototype. Reuse Prompt 00, the official brand assets and fonts, all shared mock fixtures, localization dictionaries, role guards, and components. Implement ONLY this next screen/flow; preserve completed screens and data.

Create a professional user management list populated with U-001 through U-008. Show name Arabic/English, job title, role, account status, preferred language, last sign-in, contact placeholder, search, role/job filter and active/inactive filter. Make Hiba visibly inactive and excluded from active assignee and recipient selectors. Add actions View, Edit, Deactivate/Reactivate, Resend Activation (simulated), and Add User. Provide confirmation for deactivation and warn about historical records retained. Enforce mock rule preventing deactivation of the LAST active system administrator. Show no data, pagination, loading, failed-save, and permission-denied variants. Management users who are not ADMIN must not see admin user-edit controls.

Delivery checklist for this step: (1) rendered screen and working local route; (2) consistent preloaded fake data; (3) realistic working in-memory interactions; (4) Arabic RTL and English LTR; (5) desktop and mobile layouts; (6) relevant loading/empty/error/permission states; (7) no live API, real messages, or invented identity assets; (8) list any unresolved business-rule assumption instead of silently deciding it. Stop after finishing this screen.
```

---
## Prompt 21 — Create/edit user, profile permissions, and deactivation

**Route:** `/app/admin/users/new, /app/admin/users/:id`  
**Access:** ADMIN only

```text
Continue in the SAME existing UI prototype. Reuse Prompt 00, the official brand assets and fonts, all shared mock fixtures, localization dictionaries, role guards, and components. Implement ONLY this next screen/flow; preserve completed screens and data.

Design an admin user editor with name_ar/name_en, email, mobile (use clearly dummy values), job title, system role, preferred language, active status, and password activation via one-time email link (mock). Validate duplicate email, missing fields, invalid email, and prohibited self-registration. Provide account detail tabs Profile, Role & Access (read-only matrix explanation), Recent Activity, and Account State. Role picker contains only ADMIN, MANAGER, DEPUTY, EMPLOYEE; job titles are managed data independent from roles. Demonstrate disabling last active ADMIN is rejected. Include unsaved draft persistence, success toast, simulated activation invite status, and responsive layout. Do not expose password hashes or real credentials.

Delivery checklist for this step: (1) rendered screen and working local route; (2) consistent preloaded fake data; (3) realistic working in-memory interactions; (4) Arabic RTL and English LTR; (5) desktop and mobile layouts; (6) relevant loading/empty/error/permission states; (7) no live API, real messages, or invented identity assets; (8) list any unresolved business-rule assumption instead of silently deciding it. Stop after finishing this screen.
```

---
## Prompt 22 — Administrative settings

**Route:** `/app/admin/settings`  
**Access:** ADMIN only

```text
Continue in the SAME existing UI prototype. Reuse Prompt 00, the official brand assets and fonts, all shared mock fixtures, localization dictionaries, role guards, and components. Implement ONLY this next screen/flow; preserve completed screens and data.

Build settings as categorized tabs: Organization & official report header (this admin-only logo/header file upload is permitted by SRS), Locale/Timezone, Working Days & Holidays, Notification Reminder Defaults, Performance Formula, Sessions & Security, and Work Entry Policy. Make all text and values mock, with Apply/Cancel, unsaved-change guard, validation, and audit-preview. Formula defaults to provisional 40/40/20 and must total 100%. Work entry policy visibly distinguishes draft-SRS 7-day rule from owner's proposed Same-Day-Only + ADMIN Exceptions; show an “Awaiting requirements approval” label and DO NOT imply that this UI alone changes backend enforcement. Reminder defaults 24h and 2h before due date, overdue daily; circular acknowledgment reminders after 24h then every 48h, up to 3. Allow letterhead upload only here, not on work submissions. Preserve admin role-only access.

Delivery checklist for this step: (1) rendered screen and working local route; (2) consistent preloaded fake data; (3) realistic working in-memory interactions; (4) Arabic RTL and English LTR; (5) desktop and mobile layouts; (6) relevant loading/empty/error/permission states; (7) no live API, real messages, or invented identity assets; (8) list any unresolved business-rule assumption instead of silently deciding it. Stop after finishing this screen.
```

---
## Prompt 23 — Same-day work-log exception center (provisional requirement)

**Route:** `/app/admin/work-date-exceptions`  
**Access:** ADMIN only

```text
Continue in the SAME existing UI prototype. Reuse Prompt 00, the official brand assets and fonts, all shared mock fixtures, localization dictionaries, role guards, and components. Implement ONLY this next screen/flow; preserve completed screens and data.

Build a dedicated ADMIN-only exceptions console to reflect the product owner's later operational request, explicitly tagged PROVISIONAL UNTIL SRS IS AMENDED. Manager and employee cannot grant exemptions. Table of issued date exceptions with employee, one or more allowed work dates, granted by, created timestamp, optional expiration/revocation, reason, status. A clean Grant Exception modal selects one employee and specific past date(s), shows read-only impact preview, asks for reason, and on Confirm updates a demo exceptions store and generates an internal “You have been granted an exception for [date]” notification to that employee. Revocation requires confirmation and is audit-logged. Give the employee a small “My Exceptions” view linked from the work form showing their currently allowed dates; the date picker enables ONLY today and explicit granted dates. Validate duplicate/revoked grants and never assume a 7-day default. Include desktop table/mobile cards, loading and error states.

Delivery checklist for this step: (1) rendered screen and working local route; (2) consistent preloaded fake data; (3) realistic working in-memory interactions; (4) Arabic RTL and English LTR; (5) desktop and mobile layouts; (6) relevant loading/empty/error/permission states; (7) no live API, real messages, or invented identity assets; (8) list any unresolved business-rule assumption instead of silently deciding it. Stop after finishing this screen.
```

---
## Prompt 24 — Admin audit log and change details

**Route:** `/app/admin/audit`  
**Access:** ADMIN only

```text
Continue in the SAME existing UI prototype. Reuse Prompt 00, the official brand assets and fonts, all shared mock fixtures, localization dictionaries, role guards, and components. Implement ONLY this next screen/flow; preserve completed screens and data.

Build a read-only, immutable audit history UI. Search by actor, action, entity, date range; include example events: Omar published CIR-301, Noor logged LOG-401, admin granted a work-date exception, an assignment deadline changed, Hiba was deactivated. Show exact Latin-formatted timestamps, action badges in approved colors with text, entity link, actor and expandable before/after changes (redact secrets). Distinguish prototype demonstration from an actual tamper-proof backend. No Delete/Edit audit entry actions. Include pagination, export preview, sparse/error/loading states and mobile collapsible event cards. Show permission denied for everyone other than ADMIN.

Delivery checklist for this step: (1) rendered screen and working local route; (2) consistent preloaded fake data; (3) realistic working in-memory interactions; (4) Arabic RTL and English LTR; (5) desktop and mobile layouts; (6) relevant loading/empty/error/permission states; (7) no live API, real messages, or invented identity assets; (8) list any unresolved business-rule assumption instead of silently deciding it. Stop after finishing this screen.
```

---
## Prompt 25 — System health and notification delivery monitoring

**Route:** `/app/admin/health, /app/admin/deliveries`  
**Access:** ADMIN only

```text
Continue in the SAME existing UI prototype. Reuse Prompt 00, the official brand assets and fonts, all shared mock fixtures, localization dictionaries, role guards, and components. Implement ONLY this next screen/flow; preserve completed screens and data.

Design an admin operational console with tabs System Health and Delivery History. Health cards: latest successful backup (fake), queue pending jobs (fake), failed notifications (fake), demo application status, last checks, and monitoring disclaimer (all simulated). Delivery history table shows notification, recipient, channel Internal/Email/SMS, status Pending/Sent/Failed/Unable to Deliver, attempts, last error, mock timestamp. Add “Retry” action where applicable with simulated status updates; never state that real SMS/email was delivered. Show that internal notifications remain available when an external channel fails. Include filters, search, alert text and clear technical detail panels. Align with the SRS's retry and deduplication concepts. Don't claim to restore backups in a UI prototype.

Delivery checklist for this step: (1) rendered screen and working local route; (2) consistent preloaded fake data; (3) realistic working in-memory interactions; (4) Arabic RTL and English LTR; (5) desktop and mobile layouts; (6) relevant loading/empty/error/permission states; (7) no live API, real messages, or invented identity assets; (8) list any unresolved business-rule assumption instead of silently deciding it. Stop after finishing this screen.
```

---
## Prompt 26 — Personal profile and preferences

**Route:** `/app/profile`  
**Access:** All roles, own profile

```text
Continue in the SAME existing UI prototype. Reuse Prompt 00, the official brand assets and fonts, all shared mock fixtures, localization dictionaries, role guards, and components. Implement ONLY this next screen/flow; preserve completed screens and data.

Create a personal settings screen for current demo user with name, job title (read-only if admin-controlled), demo email/contact, preferred UI language, password change form (simulated), session information, and profile activity. Let users edit only their own allowed profile fields. Provide Save and Cancel, valid/invalid passwords, accessibility-safe password visibility controls, unsaved changes warning, simulated sign-out, and a “Change language” action that preserves route and state. Show Arabic/English mirrored layouts with Latin digits. Do not surface anyone else's private profile information or suggest real password changes happen in mock mode.

Delivery checklist for this step: (1) rendered screen and working local route; (2) consistent preloaded fake data; (3) realistic working in-memory interactions; (4) Arabic RTL and English LTR; (5) desktop and mobile layouts; (6) relevant loading/empty/error/permission states; (7) no live API, real messages, or invented identity assets; (8) list any unresolved business-rule assumption instead of silently deciding it. Stop after finishing this screen.
```

---
## Prompt 27 — Global states, permissions, and accessibility review

**Route:** `/demo/quality-checks`  
**Access:** Developer QA only

```text
Continue in the SAME existing UI prototype. Reuse Prompt 00, the official brand assets and fonts, all shared mock fixtures, localization dictionaries, role guards, and components. Implement ONLY this next screen/flow; preserve completed screens and data.

Create a developer-only QA gallery, not a production business screen, which renders representative populated/empty/loading/error/403/404/offline/validation/success/disabled states for shared components and critical screens. Demonstrate: unread count 0 and 99+; long Arabic text; mobile 360px; two assignees with independent status; duplicate Send prevented; a circular is viewed but not acknowledged; old circular popup does not repeat; today logger list includes only Noor and Samer; unauthorized employee attempts another employee report; Arabic PDF preview text shape; language toggle preserves current filters; dates and counters always use Latin digits. For every state, provide a short acceptance assertion with pass/fail UI (mock evaluation). No production API calls.

Delivery checklist for this step: (1) rendered screen and working local route; (2) consistent preloaded fake data; (3) realistic working in-memory interactions; (4) Arabic RTL and English LTR; (5) desktop and mobile layouts; (6) relevant loading/empty/error/permission states; (7) no live API, real messages, or invented identity assets; (8) list any unresolved business-rule assumption instead of silently deciding it. Stop after finishing this screen.
```

---
## Prompt 28 — Responsive audit and English localization finishing pass

**Route:** `All existing routes`  
**Access:** All roles

```text
Continue in the SAME existing UI prototype. Reuse Prompt 00, the official brand assets and fonts, all shared mock fixtures, localization dictionaries, role guards, and components. Implement ONLY this next screen/flow; preserve completed screens and data.

Run a scoped design-only review of every implemented page WITHOUT changing business logic. Verify desktop 1440px, tablet 768px, mobile 390px and minimum 360px. Confirm RTL Arabic and LTR English mirroring, proper Arabic line breaking, English fallback font approval flag, all numerals Latin, 12-hour times labeled provisional, no horizontal overflow, long table-to-card transitions, visible tab/drawer keyboard focus, readable form validation, sufficient contrast, and official logo not distorted. Ensure role-dependent navigation does not expose private records. Fix only defects found, list changed screens/components, and avoid rebuilding or replacing working features. Finish with a route index and design QA status table.

Delivery checklist for this step: (1) rendered screen and working local route; (2) consistent preloaded fake data; (3) realistic working in-memory interactions; (4) Arabic RTL and English LTR; (5) desktop and mobile layouts; (6) relevant loading/empty/error/permission states; (7) no live API, real messages, or invented identity assets; (8) list any unresolved business-rule assumption instead of silently deciding it. Stop after finishing this screen.
```

---
## Suggested review checkpoints

| Checkpoint | After prompt | Review focus |
|---|---|---|
| Foundation | 01 | Branding, fonts, logo placeholder, RTL/LTR, components, routes |
| Authentication and landing | 04 | Login and distinct management/employee home screens |
| Work logging | 07 | Today's-only provisional rule, own records, manager filtering |
| Assignments | 11 | Multi-assignee statuses, submission via Drive, review and comments |
| Projects | 13 | Stage-based progress distinct from assignments |
| Circulars and notifications | 17 | Explicit acknowledgment, recipient snapshot, nonrepeated modal, deduplication |
| Reporting | 19 | Score arithmetic, letterhead, own vs full department access |
| Administration | 25 | Roles, date exceptions, settings, logs and health mock |
| Release-quality UI | 28 | Responsive, access, accessibility and localization audit |

## Notes for implementation after UI approval

- The fake data is a **design fixture**, not a production database specification. Match real API contracts to the final approved SRS after resolving open decisions.
- Creating a polished UI is not proof of stable backend workflows, protected data, correctly queued notifications, or real report generation. Test these separately in staging.
- Build production authorization on the server for every request; hiding buttons in the UI is not security.
- Do not permit real user file uploads for task deliverables or work outputs; Google Drive links are the intended delivery mechanism. The report header image in ADMIN settings is a distinct SRS exception.
- Update Prompt 00 design tokens, route map, mock fixtures, and requirements version if the project owner approves a newer Design System or SRS revision.
