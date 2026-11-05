# Route index and design QA — Media Department prototype

## Implemented routes

| Route | Scope |
|---|---|
| `/auth/login`, `/auth/forgot-password`, `/auth/reset-password` | Demo authentication and recovery |
| `/app/dashboard`, `/app/my-dashboard` | Management and employee dashboards |
| `/app/work/new`, `/app/work`, `/app/management/work-logs` | Work entry, personal history, management log review |
| `/app/assignments`, `/app/assignments/new`, `/app/assignments/:id`, `/app/assignments/:id/edit`, `/app/assignments/:id/review` | Assignment list, editor, employee detail/submission, management review |
| `/app/projects`, `/app/projects/new`, `/app/projects/:id` | Projects and stage editor |
| `/app/circulars`, `/app/circulars/new`, `/app/circulars/:id/edit`, `/app/circulars/:id/tracking` | Inbox/acknowledgment, compose, tracking |
| `/app/notifications` | Personal notification center |
| `/app/reports/my`, `/app/reports/department` | Personal and department report previews |
| `/app/users`, `/app/admin/users/new`, `/app/admin/users/:id` | Admin user directory and editor |
| `/app/settings`, `/app/admin/settings` | Admin settings demonstration |
| `/app/admin/work-date-exceptions`, `/app/my-exceptions` | Admin grants/revocation and employee exception list |
| `/app/audit-log`, `/app/admin/audit` | Admin audit demonstration |
| `/app/system-health`, `/app/admin/health`, `/app/admin/deliveries` | Admin health and delivery monitoring |
| `/app/profile` | Current user profile and preferences |
| `/demo/components`, `/demo/quality-checks` | Shared components and QA gallery |

## Responsive and localization review

| Area | Status | Notes |
|---|---|---|
| Arabic RTL and English LTR | Pass | Language control updates document direction and labels; route/filter state is component-local. |
| 1440px desktop | Source review | Dashboard grids, tables, side navigation and forms use responsive grid/flex patterns; exact viewport measurement was not available. |
| 768px tablet | Review pending | Most tables collapse at `md`; exact-width viewport control was unavailable in the connected browser. |
| 390px mobile | Partial | User's screenshot confirmed the RTL drawer fix before the latest shared page-header styling; refresh and recheck the current UI. |
| 360px mobile | Pending | Needs a separate exact-width visual check. |
| Latin numerals and 12-hour times | Improved | Replaced localized native month/date controls with ISO text inputs (`YYYY-MM`, `YYYY-MM-DD`) and changed assignment time to validated 12-hour text (`hh:mm AM/PM`). Seed timestamps remain Latin. |
| Keyboard focus and validation | Partial | Tab navigation visibly focused the active sidebar item; native browser focus ring was visible. Escape handling is now wired to close the topmost open drawer, menu, multi-select, or dialog. A manual browser check after refresh is still needed. |
| Role scoping | Pass for primary routes | Employee dashboards, work history, reports, assignment detail and circular inbox apply current-user scoping. |
| Branding assets | Applied | Official logo is used without recoloring or distortion in the sidebar, mobile header, login screen, and report preview. |
| Font approval | Applied from supplied guide | Advertising ExtraBold is used for primary headings and Janna LT Regular/Bold for interface text, matching the supplied identity guide. |
| White surfaces / neutral borders | Provisional | Design System marks white and border neutrals pending stakeholder approval. |
| PDF/Excel export | Demo only | Preview/print messages are explicit; no PDF or Excel file is claimed to exist. |

This is a UI prototype with fictional in-memory data. Authentication, permission enforcement, audit immutability, delivery, backups, and policy enforcement require real backend implementation.



## Follow-up audit session (2026-11-02)

- At the available in-app browser width (~640px screenshot), dashboard stacked into a narrow two-column layout, collapsed the sidebar behind the hamburger, and showed no horizontal scrollbar.
- Tab focus was visible on the active navigation link.
- English toggle preserved the `/app/dashboard` route and the selected month `2026-10`.
- Screenshot exposed native month control rendering Arabic numerals in an English UI. Replaced month/date selectors with Latin ISO text inputs and made assignment time an explicit validated 12-hour text field.
- The requested exact 1440px, 768px, 390px and 360px viewport measurements remain unverified because the available IAB does not expose viewport override and the native Chrome control refused URL selection. Do not treat source review as a pass for those exact dimensions.
- User-supplied Chrome emulation screenshot at 390×554 exposed an RTL mobile drawer defect: a closed sidebar translated left even though it was anchored on the right, leaving it partly visible. Updated the drawer to anchor to the RTL/LTR inline start and translate fully off-screen in the matching direction. A refreshed 390×554 screenshot confirmed the drawer is now hidden correctly.
- Supplied identity guide and references reviewed. Added the unchanged organization logo to sidebar, mobile header, sign-in, and official report preview. Loaded the specified Advertising ExtraBold and Janna LT fonts locally and removed remote Google font loading. Official color tokens already matched the guide; white surfaces remain provisional because the guide does not define them for app UI.
- Follow-up interface refinement: collapsed the demo role simulator to a compact toolbar with an expandable, keyboard-dismissable user picker; shortened the mobile demo banner; redesigned manager and employee dashboard headers; moved manager display-state controls into a collapsed preview section; and added ADMIN-only system shortcuts. Production build passes; these latest layout refinements need a fresh browser review.
- Applied a shared branded page-header treatment to the referenced work-entry, personal history, project, circular, assignment, report, notification, profile, and admin screens. Removed developer route labels from their visible page headings and tucked assignment/work-log/network state toggles into expandable previews. Build passes; the 390px screenshot predates these changes.

- Reference UI alignment (2026-11-02): Add Work and employee/management dashboards now follow the supplied role-interface composition more closely while retaining official palette/fonts and existing demo data behavior. TypeScript check passed and /app/work/new returned HTTP 200. Visual browser review of these latest changes is still pending.

- 2026-11-04 visual alignment pass: global shell now follows reference placement (full-width brand header above right-hand role menu, content beside the menu, no extra breadcrumb strip); exact visual browser review remains outstanding because the computer-use helper could not determine the current browser URL.

- Role reference follow-up: shared Add Work and personal timesheet routes are available to all reference roles; manager/admin employee-log monitoring remains separate. The personal timesheet now uses a date-range filter and print/export actions similar to the supplied screenshot. TypeScript passes; automated browser visual review has not been completed.
