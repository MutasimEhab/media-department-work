# Business Requirements Document (BRD)
## Media Department Work Management System

**Version:** 0.1 (Draft for Review) · **Date:** October 31, 2026 · **Status:** Pending Project Owner Approval

> Methodology Note: Everything provided in your answers has been recorded as stated. Where information was not provided, I introduced an assumption and marked it as "[Assumption]." All assumptions and open questions have been compiled at the end of this document for confirmation.

## 1. Executive Summary

The project aims to build a bilingual (Arabic/English), cloud-based web platform that enables the Media Department to document daily work, assign and track tasks, manage projects, circulars, and notifications, and measure employee performance through accurate reports and statistics. The first release (MVP) will be delivered within 6–8 weeks by a team of two developers, prioritizing stability, security, and data integrity before expanding the feature set.

## 2. Background and Problem Statement

**Current Situation:** Tasks are assigned to employees through email and the website.

**Problems inferred from your objectives [Inference]:**

- There is no unified platform for documenting daily work and linking it to assigned tasks.
- It is difficult to track the status of each task and ensure delivery by the deadline.
- There are no accurate reports and statistics to support performance evaluation.
- There is no reliable evidence that circulars have been received and read.

## 3. Business Objectives and Success Metrics

| ID | Objective | Measurement After 6 Months |
|---|---|---|
| O1 | Organize and manage work: systematically document daily work and distribute tasks and projects | 95% of daily work and assigned tasks are consistently recorded through the system |
| O2 | Improve monitoring and oversight: track performance and achievements through reports and statistics | 90% of assigned tasks are completed by their deadlines, with accurate reports available to management |
| O3 | Increase efficiency and stability: facilitate administrative communication and ensure delivery of notifications and circulars through a secure, stable system | Reliable delivery of notifications and circulars, fewer system failures, and 90% user satisfaction |

**Additional Proposed Operational Metrics [Assumption]:** Monthly system availability ≥ 99.5%, internal notification delivery in less than one minute, and zero incidents of data loss.

**Ultimate Goal:** Adopt the system as an official administrative platform used daily, and measure actual results against these metrics six months after launch.

## 4. Scope

### 4.1 In Scope (First Release)

1. Manage employees, their accounts, and permissions.
2. Record daily work and track its completion.
3. Manage assigned tasks, projects, circulars, and notifications.
4. Provide a dashboard for reports, statistics, and performance monitoring.
5. Provide a mobile-responsive Arabic and English interface.

### 4.2 Currently Out of Scope

- Integration with external systems (HR systems, Active Directory, institutional email).
- A native mobile application (a responsive web application is sufficient).
- Uploading files into the system (Google Drive links only).
- Managerial approval of daily work entries.
- Employees viewing one another's work.
- A WhatsApp notification channel [Assumption: out of scope because it was not requested].

## 5. Stakeholders

| Stakeholder | Role in the Project | Primary Interest |
|---|---|---|
| Organization Management [Assumption] | Project sponsor and final approver | A stable, secure, official platform |
| Department Manager | Product owner and decision-maker | Monitoring, reporting, and issuing tasks and circulars |
| Deputy Department Manager | Administrative user | The same task and circular permissions as the Department Manager |
| System Administrator | Technical and administrative owner | User management, settings, and system stability |
| Employees (Photographer and Producer; Designer and Content Writer) | Daily users | Easy work logging, task receipt, and task submission |
| Development Team (Two Developers) | Design, implementation, and maintenance | Clear scope and a realistic schedule |
| External Service Providers | Cloud hosting, email, and SMS gateway | Availability and reliability |

## 6. Users and Permissions (Summary)

Roles: **Department Manager, Deputy Department Manager, System Administrator, Photographer and Producer, Designer and Content Writer.** The last two roles have the permissions of an "Employee."

| Permission | Department Manager | Deputy Manager | System Administrator | Employee |
|---|---|---|---|---|
| Manage users and roles | — | — | ✓ | — |
| Create and send assigned tasks | ✓ | ✓ | ✓ | — |
| Review and approve submissions [Assumption] | ✓ | ✓ | ✓ | — |
| Issue circulars | ✓ | ✓ | ✓ | — |
| Enable email/SMS when sending | ✓ | ✓ | ✓ | — |
| View all employees' work and reports | ✓ | ✓ | ✓ | — |
| System settings (letterhead, evaluation weights) [Assumption] | — | — | ✓ | — |
| Log daily work | — | — | — | ✓ |
| View only their own work and monthly report | — | — | — | ✓ |
| Acknowledge reading circulars | — | — | — | ✓ |

## 7. Target Business Processes

**Task Lifecycle:** Creation → Sending → Receipt → In Progress → Work Submission → Review and Approval → Closure.

**Daily Work Logging:** The employee records the nature of the work, date, day, year, work location, and work type (office-based or field-based), without requiring approval.

**Circulars:** The Department Manager, Deputy Manager, or System Administrator issues a circular to everyone, selected individuals, or employees only. Each recipient confirms "I Have Read It," and the acknowledgment becomes visible to management.

**Distinction Between an Assigned Task and a Project (Definition Approved by the Project Owner):** An assigned task is a specific assignment sent by the Department Manager, Deputy Manager, or System Administrator to one or more employees to carry out particular work, with a specified priority and deadline, and is tracked through submission, review, and approval. A project, on the other hand, is a work item created in the system to document and organize employees' work and track its stages, such as the materials submission stage.

## 8. Business Requirements

| ID | Requirement | Priority | Release |
|---|---|---|---|
| BR-01 | Manage employee accounts, roles, and permissions | Critical | MVP |
| BR-02 | Secure login, role-based access control, and prevention of unauthorized access | Critical | MVP |
| BR-03 | Log daily work using flexible, unrestricted work types, without approval | Critical | MVP |
| BR-04 | Manage assigned tasks for multiple employees, including priority, deadline, reminders, and a complete lifecycle | Critical | MVP |
| BR-05 | Comments and discussions within each assigned task | Critical | MVP |
| BR-06 | Attach Google Drive links only for work submissions | Critical | MVP |
| BR-07 | Document projects and their stages | High | MVP |
| BR-08 | Circulars with flexible recipient targeting, read acknowledgments, and an archive [Assumption: archive] | Critical | MVP |
| BR-09 | In-system notifications for task events, circulars, and reminders | Critical | MVP |
| BR-10 | Optional email and SMS notifications when sending | High (SMS depends on gateway readiness) | MVP |
| BR-11 | Performance indicators and a configurable evaluation formula | High | MVP |
| BR-12 | Management dashboard and statistics | High | MVP |
| BR-13 | Monthly report for each employee (on-screen, PDF, Excel), with the organization's letterhead | Critical | MVP |
| BR-14 | Arabic/English interface (RTL/LTR) | High | MVP |
| BR-15 | Mobile-responsive interface | Critical | MVP |
| BR-16 | Audit log of changes and periodic backups | Critical | MVP |
| BR-17 | Future scalability (departments, features, integrations) | Medium | Architectural Design |

## 9. Business Rules

- **BRL-01:** Employees can see only their own data, not their colleagues' work.
- **BRL-02:** Only the Department Manager, Deputy Manager, and System Administrator can create assigned tasks.
- **BRL-03:** Daily work entries do not require managerial approval.
- **BRL-04:** Files cannot be uploaded into the system; submissions must use Google Drive links only.
- **BRL-05:** A circular is not considered read until the recipient explicitly acknowledges it.
- **BRL-06:** Sending email and SMS is optional and decided by the sender for each task or circular.
- **BRL-07:** On-time completion is calculated by comparing the work submission time against the deadline [Assumption].
- **BRL-08:** Assigned tasks, circulars, and work entries are not permanently deleted; archiving is used while retaining an audit log [Assumption].
- **BRL-09:** All recorded system data is backed up periodically, and all sensitive changes are logged.

## 10. Proposed Performance Evaluation Model

You asked me to propose an evaluation formula. The following is my proposal (the weights can be adjusted by the System Administrator). The three indicators are drawn from your answers:

| Indicator | Formula | Weight |
|---|---|---|
| Completion Rate (C) | Tasks completed during the month ÷ Tasks assigned to the employee × 100 | 40% |
| On-Time Completion Rate (T) | Tasks completed by the deadline ÷ Total completed tasks × 100 | 40% |
| Social Media Material Submission Rate (S) | Materials submitted ÷ Materials required × 100 | 20% |

**Final Score = 0.40 × C + 0.40 × T + 0.20 × S**

**Calculation Rules:** Canceled tasks are excluded from the denominator. If an employee is not assigned any social media materials during the month, the weight of S is redistributed proportionally between the other two indicators.

**Proposed Performance Ratings:** 90 and above: "Excellent"; 75–89: "Very Good"; 60–74: "Good"; below 60: "Needs Improvement."

This requires each assigned task to carry a tag indicating whether it is a **Social Media Material** or not.

## 11. Assumptions, Constraints, and Dependencies

### 11.1 Assumptions

- **A1:** The number of users is small (up to approximately 15 users), because five roles were mentioned but no user counts were provided.
- **A2:** Submissions are reviewed and approved by the Department Manager, Deputy Manager, or System Administrator (you did not specify who approves them).
- **A3:** If a submission is rejected during review, the task returns to "In Progress" with a comment explaining what is required.
- **A4:** Accounts are created only by the System Administrator; there is no self-registration.
- **A5:** The required daily work fields are those you specified. Optional fields (a brief description and an output link) are added without preventing submission.
- **A6:** Events that generate notifications include task assignment, status change, new comment, approaching deadline, late submission, new circular, and a reminder about an unacknowledged circular.
- **A7:** The circular archive is enabled by default.

### 11.2 Constraints

- The timeline is 6–8 weeks, with only two developers.
- Hosting is cloud-based, and the budget has not yet been determined.
- There is currently no integration with external systems.
- Work is submitted via Google Drive links only, without file uploads.
- Quality and stability take precedence over the launch date.

### 11.3 Dependencies

A cloud hosting provider, domain name and SSL certificate, email service (SMTP), SMS gateway, the organization's logo and letterhead files, and initial employee data.

## 12. Risks and Mitigation Plans

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Recurring technical failures | Medium | High | Staging environment, automated tests, monitoring and alerts, phased deployment |
| R2 | Data loss or duplication | Low | High | Encrypted daily backups, monthly restore tests, database uniqueness constraints, prevention of duplicate submissions, and soft deletion instead of permanent deletion |
| R3 | Delayed notifications | Medium | Medium | Asynchronous processing queues, automatic retries, delivery status logs, and in-system notifications as the primary channel independent of external providers |
| R4 | Permission failures | Low | High | Centralized permission management, authorization tests for each role, and a pre-launch security review |
| R5 | Updates affecting existing functionality | Medium | High | Controlled data migration scripts, automated deployment (CI/CD) with rollback capability, and regression testing |
| R6 | Employee resistance to adoption | Medium | High | Simple interface, work logging in under a minute, brief training, and a pilot period |
| R7 | Tight timeline and small team | High | Medium | Freeze scope, establish a clear feature cutoff (Section 13), and deliver incrementally |
| R8 | Confusion between the definitions of "project" and "assigned task" | Low | Medium | Resolved through confirmation by the Project Owner (Section 7) |

## 13. First Release (MVP) Plan

| Phase | Duration | Deliverables |
|---|---|---|
| 0. Preparation | Before development begins | Approval of both documents, resolution of open questions, technology selection, setup of development, staging, and production environments, and an automated deployment pipeline |
| 1. Foundation | Weeks 1–2 | Login, users, roles and permissions, audit log, and a responsive bilingual interface template |
| 2. Core Workflows | Weeks 3–4 | Daily work logging; assigned tasks (lifecycle, multiple assignees, priority, deadline, reminders, comments, and Drive links) |
| 3. Communication | Week 5 | Projects, circulars with read acknowledgments and archives, internal notifications, and email |
| 4. Performance and Reporting | Week 6 | Dashboard, evaluation formula, monthly report (on-screen, PDF, Excel) with letterhead, and SMS integration |
| 5. Stability and Launch | Weeks 7–8 | Comprehensive testing, user acceptance testing, security review, backup restore testing, training, a pilot with two employees, and then a full launch |

**Priority Order if Time Is Limited** (defer starting from the bottom of the list): ① Users, permissions, daily work, and assigned tasks ② Circulars, in-system notifications, and email ③ Dashboard and monthly reports ④ SMS messages and advanced charts.

**Proposed Division of Work Between the Two Developers [Assumption]:** The first developer handles the backend, database, security, and notifications; the second handles the user interfaces, both languages, and reports.

## 14. Cost Components

The budget has not yet been determined. The following items need to be priced: development fees (two developers for 6–8 weeks), monthly cloud hosting, domain name and SSL certificate, email service, SMS messages (usually billed per message), backup storage, and post-launch maintenance and support.

## 15. First Release Acceptance Criteria

1. All "Critical" and "High" priority requirements are completed and tested.
2. No employee can access another employee's data through any route (user interface or API).
3. Circular read acknowledgments are visible to the Department Manager, Deputy Manager, and System Administrator.
4. Monthly reports (PDF and Excel) match the recorded data and include the organization's letterhead.
5. A backup has been successfully restored in the test environment.
6. The system works on the latest versions of Chrome, Safari, Edge, and Firefox, as well as on mobile devices.
7. Main pages load in under three seconds under normal conditions [Assumption].
8. There are no outstanding Critical or High severity defects.
9. The Department Manager approves the system following acceptance testing.

## 16. Open Questions for Confirmation

1. What type of organization is this, and approximately how many employees are in the department?
2. Who approves task submissions: any of the three authorized roles, or only the person who issued the task?
3. Do the Department Manager and Deputy Manager log daily work, or only employees?
4. Should "Work Duration" be added to daily work logging? (This would be necessary if you want to calculate work hours later.)
5. Which SMS provider do you prefer, and do you already have an account or agreement?
6. Which technologies are the two developers proficient in? (I will propose technologies in the SRS, and these can be changed.)
7. What is the data retention policy (how many years), and are there any restrictions on the geographic location of the hosting service?
8. Do you approve the performance evaluation weights (40/40/20)?
9. Do you have ready-made logo and letterhead files in PNG or SVG format?
