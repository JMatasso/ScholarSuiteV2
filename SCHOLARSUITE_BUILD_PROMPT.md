# ScholarSuite V2 — Full Build Prompt

## ROLE
You are a senior full-stack engineer and UI/UX designer building **ScholarSuite**, a professional EdTech SaaS platform for scholarship consulting firms. This is NOT a hackathon project — it must look and feel like a venture-backed product on par with Notion, Linear, or Ramp. Every pixel matters.

---

## DESIGN PHILOSOPHY & VISUAL REFERENCES

### Target Aesthetic
The design must match the **professional, clean, enterprise-grade aesthetic** seen in these reference products:
- **Notion's marketing site**: Warm neutral backgrounds (soft cream/off-white `#FAF8F5`), bold hero typography, generous whitespace, floating UI cards with subtle shadows, product screenshots as social proof
- **Notion's app UI**: Clean sidebar navigation with icon + label pairs, Kanban boards with status columns, minimal chrome, content-first layout
- The overall vibe is: **warm, trustworthy, institutional** — not startup-flashy, not cold-corporate

### Design Principles (NON-NEGOTIABLE)
1. **Whitespace is a feature** — generous padding (24px minimum between sections), no cramped layouts
2. **Typography hierarchy** — use a professional sans-serif system (Inter or similar). Hero text: 48-64px bold. Section headers: 28-36px semibold. Body: 16px regular. Never use more than 3 font weights per page.
3. **Color system** — Warm neutral base (`#FAFAF8` background, `#1A1A1A` text). One primary brand color (deep navy `#1E3A5F` or education blue `#2563EB`). One accent for CTAs (warm amber `#F59E0B` or coral `#EF4444`). Status colors: green/yellow/red for progress states. Never use pure black or pure white.
4. **Elevation & depth** — Cards use `shadow-sm` to `shadow-md` (no harsh drop shadows). Hover states add subtle lift (`translateY(-2px)` + shadow increase). Borders are `1px solid` with `#E5E5E5` or lighter.
5. **Rounded corners** — `rounded-lg` (8px) for cards, `rounded-xl` (12px) for modals, `rounded-full` for avatars and pills
6. **Animations** — Subtle, purposeful. Page transitions: 200ms fade. Hover: 150ms ease. Loading: skeleton screens (never spinners). No bouncing, no sliding from offscreen, no gratuitous motion.
7. **Icons** — Use Lucide React (consistent, clean line icons). 20px default size. Never mix icon libraries.
8. **Empty states** — Every list/table must have a designed empty state with illustration + helpful copy + CTA button
9. **Responsive** — Mobile-first design. Sidebar collapses to bottom nav on mobile. Tables become cards on small screens.
10. **Accessibility** — All interactive elements must have focus rings, proper aria labels, 4.5:1 contrast ratios minimum

### What "Not Vibecoded" Means
- NO default shadcn/ui styling without customization — every component must be themed
- NO generic placeholder text ("Lorem ipsum") — use realistic EdTech content
- NO unstyled error states or raw browser alerts
- NO layout shifts during loading
- NO inconsistent spacing or alignment
- NO icon-only buttons without tooltips
- NO raw data dumps — every table/list is sortable, filterable, paginated
- Every form has proper validation with inline error messages (not alerts)
- Every action has a loading state, success state, and error state

---

## TECH STACK

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 3.4+ with a custom theme configuration
- **Component Library**: shadcn/ui as the BASE, but every component must be extended and themed to match our design system
- **Icons**: Lucide React
- **Charts**: Recharts (for analytics dashboards)
- **Forms**: React Hook Form + Zod validation
- **State**: Zustand for client state, TanStack Query for server state
- **Tables**: TanStack Table for all data tables
- **Rich Text**: Tiptap for the essay editor
- **Date Handling**: date-fns
- **Animations**: Framer Motion (sparingly — only for page transitions and meaningful interactions)
- **Toast/Notifications**: Sonner

### Backend
- **Runtime**: Node.js
- **API**: Next.js API routes (Route Handlers) or a separate Express/Fastify server — your choice, but be consistent
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: NextAuth.js v5 (Auth.js) with credentials + future SSO support
- **File Storage**: S3-compatible (AWS S3 or Supabase Storage)
- **Real-time**: Socket.io for messaging
- **Email**: Resend or Nodemailer with SMTP
- **AI**: Claude API (Anthropic SDK) for AI features
- **Video**: Jitsi Meet integration for meetings
- **Payments (2026)**: Stripe

### Design Documentation to Search & Use
Before building ANY component, search for and reference the latest official documentation:
- **shadcn/ui docs** — for component APIs, theming, and customization patterns
- **Tailwind CSS docs** — for utility classes, custom theme config, responsive design
- **Radix UI docs** — for accessible primitive behaviors (shadcn is built on Radix)
- **Next.js App Router docs** — for layouts, loading states, error boundaries, server components
- **TanStack Table docs** — for column definitions, sorting, filtering, pagination
- **React Hook Form docs** — for form patterns, validation integration
- **Framer Motion docs** — for animation patterns
- **Prisma docs** — for schema design, relations, migrations

When in doubt about a component pattern, search the official docs first. Do not guess at APIs.

---

## APPLICATION ARCHITECTURE

### Three Portals (Role-Based)
```
/                         → Marketing/landing page
/login                    → Shared auth page
/student/*                → Student Dashboard
/admin/*                  → Admin/Consultant Dashboard
/parent/*                 → Parent Dashboard
```

### Shared Layout Pattern
Every dashboard portal follows this structure:
```
┌─────────────────────────────────────────┐
│  Topbar (breadcrumb, search, notifs, avatar) │
├──────────┬──────────────────────────────┤
│          │                              │
│ Sidebar  │     Main Content Area        │
│ (nav)    │     (with page header)       │
│          │                              │
│          │                              │
└──────────┴──────────────────────────────┘
```

- **Sidebar**: 256px wide, collapsible to 64px (icon-only). Grouped nav sections with labels. Active state: left border accent + background tint. Smooth collapse animation.
- **Topbar**: 64px height. Breadcrumb trail on left. Global search (Cmd+K) in center. Notification bell + user avatar dropdown on right.
- **Main Content**: Max-width 1280px, centered. Page header with title + description + primary action button. Content below with consistent 24px gap.

---

## MARKETING / LANDING PAGE DESIGN

The landing page must match the Notion-style aesthetic from the screenshots:

### Hero Section
- Large bold headline (48-64px): "Your scholarship journey, organized."
- Subtitle (18-20px, muted): "ScholarSuite helps students discover scholarships, track applications, and plan their financial future — with expert guidance every step of the way."
- Two CTAs: Primary filled button ("Get Started Free") + Secondary outline button ("Request a Demo")
- Below: A floating product screenshot/mockup in a browser frame with subtle shadow, slightly rotated or with perspective for depth

### Social Proof Section
- "Trusted by schools and consultants nationwide"
- Logo bar of partner schools/organizations (placeholder logos styled consistently)

### Feature Sections (alternating layout)
Each section: left text + right product screenshot (alternating sides)
- **Smart Scholarship Matching** — "AI-powered matching finds scholarships you actually qualify for"
- **Application Tracking** — "Kanban boards keep every application on track" (reference the Notion Kanban style from the screenshot)
- **Financial Planning** — "See your full college cost picture, semester by semester"
- **Built for Teams** — "Consultants, students, and parents — all on the same page"

### Agent/AI Section (reference the "Meet your 24/7 AI teammates" section from screenshots)
- Headline: "Meet your AI scholarship advisor"
- Show a chat-style UI mockup with example student questions and AI responses
- Cards showing AI capabilities: intake summaries, essay feedback, scholarship recommendations

### CTA Section
- Dark background section with white text
- "Ready to transform your scholarship practice?"
- Email input + "Get Started" button

### Footer
- 4-column grid: Product, Resources, Company, Legal
- Social links, copyright

---

## FEATURE MODULES (FROM PRD)

### STUDENT DASHBOARD

#### Module 1: Intake & Profile
- 7-step multi-step onboarding wizard with progress stepper at top
- Steps: Personal Info → Academic Background → Background & Demographics → Financial Situation → Activities & Interests → Goals & Preferences → Review & Submit
- Each step is its own card with clear section title, helper text, and form fields
- Journey stage selector: 4 visual cards (Early Exploration, Active Prep, Application Phase, Post-Acceptance) with icons and descriptions — student clicks to select
- Profile page: Avatar upload with crop/resize, completion tracker (circular progress ring), editable sections matching intake steps
- Post-secondary path toggle: visual selector (College, Trade School, Military, Workforce) with icons

#### Module 2: Scholarship Discovery
- Main view: card grid (default) or table view (toggle)
- Each scholarship card: name, amount, deadline, match score (percentage badge), key eligibility tags (pills), quick-action buttons (Save, Dismiss, Apply)
- Match score breakdown: expandable section showing why matched ("GPA 3.5 ≥ 3.0 minimum", "State: California ✓", etc.) with green checkmarks
- Filter sidebar: collapsible, with sections for Amount Range (slider), Deadline, Field of Study, State, GPA Range, tags
- Search bar with autocomplete
- Tabs: "Matched for You" | "All Scholarships" | "Saved" | "Dismissed"

#### Module 3: Application Tracking
- **Scholarship Applications**: Kanban board (Not Started → In Progress → Submitted → Awarded → Denied) matching the Notion-style board from screenshots. Cards show scholarship name, amount, deadline, completion percentage
- Per-application detail drawer (slide-in from right): checklist items with checkboxes, linked essay, documents, notes, timeline of status changes
- **Won Scholarships**: summary cards with total awarded amount, individual award details, disbursement schedule table
- **College Applications**: separate Kanban or table view with columns for university name, type (RD/ED/EA/Rolling), status, deadline, cost, dream/safety flag (star icon)

#### Module 4: Task & Workflow
- Task list view grouped by phase (Introduction → Phase 1 → Phase 2 → Ongoing → Final)
- Each task: checkbox, title, due date (color-coded: green = upcoming, yellow = soon, red = overdue), priority badge, track tag (scholarship/college_prep)
- Filter by: track, phase, status, priority
- Calendar view option showing tasks on a monthly calendar

#### Module 5: Essay Module
- Left panel: list of essays with status indicators
- Right panel: Tiptap rich text editor with formatting toolbar
- Version history: sidebar showing past versions with timestamps, click to diff
- Submit for review button → status changes to "Under Review" → consultant feedback appears inline
- Prompt library: modal with categorized prompts, search, word count indicators

#### Module 6: Document Module
- File manager grid/list view with thumbnails for images/PDFs
- Upload zone: drag-and-drop with file type icons
- Document requests: notification-style cards ("Your consultant requested: Official Transcript — Due: March 15")
- Folder organization by type (Transcripts, Letters, Financial, Other)

#### Module 7: Learning Module
- Course catalog: card grid with module icon, title, lesson count, progress bar, category tag
- Module detail: ordered lesson list with completion checkmarks, lesson type icons (video/text/link)
- Lesson view: full-width content area, video player or text content, "Mark Complete" button, quiz at end
- Quiz: clean question cards with radio/checkbox options, submit → instant score with explanations

#### Module 8: Financial Planning
- Semester-by-semester table/grid: columns for each cost category (Tuition, Housing, Food, Transportation, Books, Personal, Other)
- Income source mapping: assign scholarships/grants/loans/savings to specific semesters
- Gap analysis: visual bar chart showing total cost vs. total aid per semester, with unmet need highlighted in red
- Summary dashboard: total 4-year cost, total aid secured, remaining gap — large stat cards at top

#### Module 9: Activities & Extracurricular
- Activity list with category grouping (Athletics, Arts, Academic, Volunteer, Work, Other)
- Each entry: title, organization, role, date range, hours, description
- Community service section with hour totals and verification badges
- Awards section with achievement cards

#### Module 10: Communication
- Chat interface matching modern messaging apps (think iMessage/Slack hybrid)
- Left: conversation list with avatar, name, last message preview, timestamp, unread badge
- Right: message thread with bubbles, image messages, reactions, edit indicators
- System notifications: separate tab with categorized alerts (deadlines, task updates, awards)
- Announcements: pinned banner at top of dashboard for active announcements

#### Module 11: Meetings
- Upcoming meetings list/calendar view
- Meeting card: title, date/time, participants, "Join Meeting" button (Jitsi link)
- Meeting proposal: form to request time with consultant (date picker, time slots, agenda)

#### Module 12: Timeline
- Horizontal or vertical timeline visualization for grades 9-12
- Milestone nodes with icons, completion status, linked resources
- Current position indicator ("You are here")
- Click milestone → opens detail with linked tasks/modules

---

### ADMIN DASHBOARD

#### Module 1: User Management
- User table: avatar, name, email, role badge, status badge, last login, actions dropdown
- Create user modal: role selector, form fields change based on role
- CSV import: drag-drop zone → preview table → confirm import → progress bar
- Bulk actions toolbar: appears when rows selected

#### Module 2: Student Management
- Student roster: data table with inline status badges (NEW=blue, ACTIVE=green, AT_RISK=amber, INACTIVE=gray, GRADUATED=purple)
- Click row → student detail page with tabbed sections (Profile, Applications, Tasks, Essays, Documents, Financial, Activity, Notes)
- Consultant notes: private textarea per student with save/timestamp
- Bulk operations: multi-select → bulk status update, bulk task assign

#### Module 3: Parent Management
- Parent accounts table with linked students shown as avatar chips
- Create parent + link to student(s) flow
- Snapshot report generator: select student → preview report → send via email

#### Module 4: Scholarship Database
- Full CRUD table with inline editing for quick updates
- Eligibility criteria builder: multi-field form with conditional logic (if GPA required → show min GPA field)
- CSV import with field mapping UI
- Tags: colorful pill badges, filterable

#### Module 5: Matching & Assignment
- "Run Matching" button → progress indicator → results table showing matches with scores
- Match detail: expandable rows showing scoring breakdown
- Manual assignment: search student + search scholarship → assign
- Essay rubric builder: criteria rows with weight sliders and description fields

#### Module 6: Task Templates
- Template builder: drag-to-reorder task list with phase groupings
- Assignment flow: select template → select students/cohort → confirm → assignment summary
- Default template toggle for auto-assignment on student creation

#### Module 7: Communication (Admin)
- Inbox with all conversations
- Broadcast composer: select recipients (all, cohort, role) → compose → schedule or send
- Message templates: CRUD with category tags and variable placeholders
- Announcement manager: create/edit with targeting (role, school), pin toggle, date range

#### Module 8: Meeting & Scheduling
- Calendar view (week/month) with drag-to-create
- Availability manager: weekly grid where admin sets open slots
- Meeting requests: approval queue with accept/deny/propose alternative
- Recurring meeting setup

#### Module 9: Document Management
- All-documents browser with student filter
- Document request builder: select students/cohort → document type → due date → send request
- Request tracking table: student name, document type, status (pending/submitted/reviewed), due date

#### Module 10: Learning Content
- Module builder: drag-and-drop lesson ordering, icon picker, category selector
- Lesson editor: rich text + video URL + external link fields
- Quiz builder: question cards with option inputs, correct answer selector, explanation field
- Prerequisite chain: visual dependency graph or dropdown selector

#### Module 11: School Management
- School directory: cards or table with logo, name, student count, location
- School detail: edit info, manage join code (generate/regenerate), assign counselor, view school-specific analytics
- School analytics: charts for student engagement, scholarship success, application completion

#### Module 12: Cohort Module
- Cohort list with color-coded labels and member counts
- Cohort detail: member table + bulk action toolbar (message, assign tasks, request docs)
- Create cohort: name, description, color picker, add members search

#### Module 13: CRM
- Pipeline view: Kanban board (Lead → Contacted → Qualified → Enrolled → Lost)
- Contact detail: side drawer with all info, interaction timeline, linked invoices
- Invoice table: status badges (Draft, Sent, Paid, Overdue), amount, due date, download PDF
- Time tracking: log entries with student, category, duration, date

#### Module 14: Financial Oversight
- Dashboard: aggregate stats cards (Total Aid Secured, Average Gap, Students At Full Fund)
- Per-student drill-down: click student → see their full financial plan
- Gap analysis heatmap: students ranked by unmet need

#### Module 15: Analytics & Reporting
- Dashboard with chart widgets: engagement over time (line), awards by category (bar), application funnel (funnel chart), module completion (donut)
- Filters: date range, school, cohort, status
- Export: PDF report generation with ScholarSuite branding
- Audit log table: timestamp, user, action, resource, details — searchable and filterable

#### Module 16: Support
- Ticket table: priority badges, status badges, assigned to, category
- Ticket detail: description, threaded comments, status timeline, resolution notes
- Quick assignment: dropdown to assign staff member

#### Module 17: AI Assistant
- Chat interface for consultant to ask questions about students
- Rate limit indicator
- Suggested prompts

#### Module 18: Settings
- Tabbed settings page: General, Email (SMTP config + test), Security, API, Audit Log
- Key-value settings editor with save confirmation

---

### PARENT DASHBOARD

#### Module 1: Onboarding
- Simple 3-step flow: Create Account → Link to Student(s) → Set Notification Preferences
- Student linking: enter student email → verification sent → confirmed link

#### Module 2: Student Monitoring
- Read-only profile card with student photo, key stats, current phase
- Progress dashboard: visual cards for task completion %, applications submitted, scholarships won, financial gap

#### Module 3: Task Oversight
- Task list (read-only) with status filters
- Overdue task alerts: red banner at top if any tasks past due
- Acknowledge button on completed tasks

#### Module 4: Application Tracking
- Scholarship applications table (read-only): name, status badge, amount, deadline
- College applications table (read-only): school name, type, status, deadline
- Awards summary: total amount, individual awards list

#### Module 5: Communication
- Chat with consultant (same messaging UI as student)
- Notification center
- Email snapshot history

#### Module 6: Meetings
- Upcoming meetings list
- Accept/decline meeting invitations

#### Module 7: Documents & Resources
- Student documents (read-only view)
- Learning progress: module list with student's completion status

---

## BUILD ORDER

1. **Project scaffolding**: Next.js + Tailwind + shadcn/ui + Prisma + auth setup
2. **Design system**: Custom Tailwind theme, shared component library (Button, Card, Badge, Table, Modal, Sidebar, Topbar, EmptyState, StatCard, StatusBadge, etc.)
3. **Landing page**: Marketing site with all sections
4. **Auth flows**: Login, registration, forgot password, role-based routing
5. **Student Dashboard**: Modules 1-12 in order
6. **Admin Dashboard**: Modules 1-18 in order
7. **Parent Dashboard**: Modules 1-7 in order
8. **Real-time features**: Messaging, notifications
9. **AI features**: Scholarship advisor, essay feedback, intake summaries
10. **Polish**: Loading states, error boundaries, empty states, animations, responsive testing

---

## CRITICAL REMINDERS

- **Search the official documentation** for every framework/library before implementing. Do not guess at APIs. Specifically search: Next.js App Router docs, shadcn/ui component docs, Tailwind CSS docs, Prisma schema docs, TanStack Table docs.
- **Every component must have**: loading state (skeleton), empty state (illustration + text + CTA), error state (friendly message + retry)
- **Every form must have**: Zod schema validation, inline error messages, loading/disabled submit button, success toast
- **Every table must have**: sortable columns, search/filter, pagination, responsive card view on mobile, row selection for bulk actions
- **Consistent spacing**: Use Tailwind's spacing scale. `gap-6` between cards, `p-6` inside cards, `space-y-8` between page sections
- **Test with realistic data**: Use actual scholarship names, real university names, realistic GPA values, genuine-sounding student names
- This platform handles **student PII (FERPA-protected data)** — never log sensitive data, always use HTTPS, sanitize all inputs
