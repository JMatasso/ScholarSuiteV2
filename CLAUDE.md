# ScholarSuiteV2 - Claude Code Guide

## Project Overview
Multi-role scholarship and college preparation platform. Roles: **STUDENT**, **PARENT**, **ADMIN**.

## Tech Stack
- **Framework:** Next.js 16 (App Router, Turbopack)
- **UI:** React 19, Tailwind CSS v4, shadcn/ui, lucide-react, recharts, framer-motion
- **Auth:** next-auth v5 (beta) with JWT strategy, credentials provider, bcryptjs
- **Database:** PostgreSQL via Prisma 7 with `@prisma/adapter-pg`
- **Forms:** react-hook-form + zod
- **State:** zustand (sidebar, notifications), @tanstack/react-query
- **Toasts:** sonner
- **Rich text:** tiptap

## Directory Structure
```
app/                    # Next.js project root
├── src/
│   ├── app/
│   │   ├── admin/      # Admin pages (17 pages)
│   │   ├── student/    # Student pages (13 pages)
│   │   ├── parent/     # Parent pages (7 pages)
│   │   ├── api/        # API routes (19 endpoints)
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── components/
│   │   ├── layout/     # Layout components
│   │   └── ui/         # shadcn UI primitives
│   ├── lib/
│   │   ├── db.ts       # Prisma singleton
│   │   ├── auth.ts     # NextAuth config
│   │   ├── store.ts    # Zustand stores
│   │   └── utils.ts    # cn() utility
│   ├── types/
│   │   └── next-auth.d.ts  # Session/user type extensions
│   └── generated/prisma/   # Auto-generated Prisma client
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── Dockerfile
└── package.json
```

## Key Scripts
```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run db:generate  # npx prisma generate
npm run db:push      # npx prisma db push
npm run db:migrate   # npx prisma migrate dev
npm run db:seed      # tsx prisma/seed.ts
npm run db:studio    # Prisma Studio
```

## Database / Prisma
- Client import: `import { db } from "@/lib/db"`
- Generated client at: `@/generated/prisma/client` (NOT `@prisma/client`)
- Uses PrismaPg pooling adapter
- Always run `npm run db:generate` after schema changes

## Auth Pattern
```typescript
import { auth } from "@/lib/auth"

// In API routes:
const session = await auth()
if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
const userId = session.user.id
const userRole = session.user.role  // "STUDENT" | "PARENT" | "ADMIN"
```

## API Route Pattern
```typescript
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const data = await db.modelName.findMany({ where: { userId: session.user.id } })
    return NextResponse.json(data)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
```

## Page Data-Fetching Pattern (Client Component)
```typescript
"use client"
import { useEffect, useState } from "react"

export default function Page() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/endpoint")
      .then(res => res.json())
      .then(data => { setData(data); setLoading(false) })
  }, [])
}
```

## Current State: CRITICAL - Frontend Not Connected to Backend

**ALL pages use hardcoded mock data. Zero API calls are made from any page.**

### Connection Status by Feature

| Feature | API Route | Status |
|---------|-----------|--------|
| Students (admin) | `/api/students` | MOCK-ONLY |
| Scholarships (admin+student) | `/api/scholarships` | MOCK-ONLY |
| Messages (all roles) | `/api/messages` | MOCK-ONLY |
| Tasks (student) | `/api/tasks` | MOCK-ONLY |
| Applications (student) | `/api/applications` | MOCK-ONLY |
| Essays (student) | `/api/essays` | MOCK-ONLY |
| Documents (student) | `/api/documents` | MOCK-ONLY |
| Meetings (all roles) | `/api/meetings` | MOCK-ONLY |
| Financial (student+admin) | `/api/financial` | MOCK-ONLY |
| Learning (student+admin) | `/api/learning` | MOCK-ONLY |
| Activities (student) | `/api/activities` | MOCK-ONLY |
| Announcements (admin) | `/api/announcements` | MOCK-ONLY |
| CRM (admin) | `/api/crm` | MOCK-ONLY |
| Cohorts (admin) | `/api/cohorts` | MOCK-ONLY |
| Support (admin) | `/api/support` | MOCK-ONLY |
| Audit (admin) | `/api/audit` | MOCK-ONLY |
| Notifications | `/api/notifications` | MOCK-ONLY |
| CSV Import | none | NOT BUILT |
| Onboarding | none | FAKES delay, saves nothing |

### Priority Order for Connecting
1. Admin: Students (core — everything depends on real users existing)
2. Admin: Scholarships + CSV import
3. Messaging (all roles)
4. Student: Scholarships, Tasks, Applications
5. Student: Essays, Documents, Meetings
6. Parent: all pages
7. Admin: remaining pages (CRM, Cohorts, Announcements, etc.)

## Key Prisma Models (abbreviated)
- `User` — id, email, name, role (STUDENT|PARENT|ADMIN), isActive
- `StudentProfile` — userId, gpa, gradeLevel, journeyStage, status
- `ParentProfile` — userId
- `ParentStudent` — parentId, studentId (linking table)
- `Scholarship` — name, provider, amount, deadline, tags, eligibility fields
- `ScholarshipApplication` — studentId, scholarshipId, status
- `Task` — studentId, title, phase, track, status, priority, dueDate
- `Message` — senderId, receiverId, content, read, reactions
- `Essay` — studentId, title, status, versions
- `Document` — userId, type, url, filename
- `Meeting` — title, scheduledAt, status, participants
- `FinancialPlan` — studentId, semesters, incomeSources
- `LearningModule` — title, lessons, progress tracking
- `Activity` — studentId, name, category, hours
- `Announcement` — title, content, role targeting, pinned
- `Prospect` / `Invoice` — CRM models
- `Cohort` / `CohortMember` — group management
- `SupportTicket` / `TicketComment` — helpdesk
- `AuditLog` — action tracking

## Design System

### Color Palette (ALWAYS use these exact hex values)
| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#1E3A5F` | Headings, sidebar, primary brand color, icon backgrounds |
| Accent / CTA | `#2563EB` | Primary action buttons, links, active icon color, focus rings |
| Accent hover | `#2563EB/90` | Hover state on accent buttons (`hover:bg-[#2563EB]/90`) |
| Primary dark | `#162d4a` | Hover state on primary buttons (`hover:bg-[#162d4a]`) |
| Background | `#FAFAF8` | Page background (`bg-[#FAFAF8]`) |
| Body text | `#1A1A1A` | Primary text color |
| Muted text | `text-muted-foreground` | Secondary/subtitle text, labels |
| Card background | `bg-white` | All card surfaces |
| Border | `border-gray-200` | Default borders on inputs, cards |
| Danger | `text-rose-600` / `bg-rose-50` | Delete actions, at-risk status |
| Warning | `text-amber-600` / `bg-amber-50` | Pending items, deadline alerts |
| Success | `text-emerald-600` / `bg-emerald-50` | Awarded, completed, active status |

### Typography
- Page title: `text-2xl font-semibold text-[#1E3A5F]`
- Page subtitle: `text-muted-foreground mt-1`
- Section heading: `text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide`
- Card title: `CardTitle` component (uses shadcn default, `text-sm` variant common)
- Body: `text-sm`
- Meta/label: `text-xs text-muted-foreground`

### Page Layout Pattern
Every page MUST follow this structure:
```tsx
<div className="space-y-6">
  {/* Page header */}
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-semibold text-[#1E3A5F]">Page Title</h1>
      <p className="mt-1 text-muted-foreground">Short description of this section.</p>
    </div>
    {/* Optional action buttons */}
    <div className="flex items-center gap-2">
      <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2">
        <Plus className="h-4 w-4" />
        Add Item
      </Button>
    </div>
  </div>

  {/* Page content sections */}
</div>
```

### Card Pattern
```tsx
<Card className="hover:shadow-sm transition-shadow">
  <CardHeader>
    <CardTitle className="text-sm">Title</CardTitle>
  </CardHeader>
  <CardContent className="space-y-3">
    {/* content */}
  </CardContent>
</Card>
```
- Stats/KPI cards: use `<StatCard>` from `components/ui/stat-card.tsx`
- Content cards: `<Card>` with `CardHeader` + `CardContent`
- Warning cards: `className="border-amber-200 bg-amber-50/30"`

### Button Variants
| Use Case | Code |
|----------|------|
| Primary CTA | `<Button className="bg-[#2563EB] hover:bg-[#2563EB]/90">` |
| Secondary | `<Button variant="outline">` |
| Destructive | `<Button variant="ghost" className="hover:text-rose-600">` |
| Icon-only (small) | `<Button variant="ghost" size="icon-sm">` |
| Inline/compact | `<Button size="xs">` or `<Button size="sm">` |

### Badge / Status Pill Pattern
Use `<StatusBadge>` from `components/ui/status-badge.tsx` for status indicators.
Color map for custom inline badges:
- Active/Awarded/Done → `bg-emerald-100 text-emerald-700 border-emerald-200`
- Pending/In Progress → `bg-amber-100 text-amber-700 border-amber-200`
- At Risk/Denied → `bg-rose-100 text-rose-700 border-rose-200`
- Inactive/Unknown → `bg-gray-100 text-gray-600 border-gray-200`
- New/Submitted → `bg-blue-100 text-blue-700 border-blue-200`

### Icon Usage
- Always use `lucide-react` icons
- Standard sizes: `h-4 w-4` (body), `h-5 w-5` (medium), `h-8 w-8` (hero)
- Icon in colored box: `<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1E3A5F]/10 text-[#1E3A5F]"><Icon className="h-5 w-5" /></div>`
- Active nav icon: `text-[#2563EB]`

### Loading & Empty States
- Use `<Skeleton>` from `components/ui/skeleton.tsx` for loading placeholders
- Use `<EmptyState>` from `components/ui/empty-state.tsx` for no-data views
- Simple loading fallback: `<div className="flex items-center justify-center py-16 text-muted-foreground"><p className="text-sm">Loading...</p></div>`

### Grid Layout Pattern
- Card grids: `className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"`
- Two-col grids: `className="grid gap-4 sm:grid-cols-2"`
- Four-col stat grids: `className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"`

### Form Input Pattern
```tsx
<div className="space-y-1.5">
  <label className="text-xs font-medium text-muted-foreground">Field Label</label>
  <Input placeholder="Placeholder text" />
</div>
```
- Auth page inputs: `className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-shadow"`

### Tag/Chip Pattern
```tsx
<span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-blue-50 text-blue-700">
  Tag Name
</span>
```

### Do Not
- Do NOT use arbitrary purple/teal/orange colors not in this palette
- Do NOT use inline `style={}` for colors — always use Tailwind classes
- Do NOT create new color tokens — reuse the palette above
- Do NOT use `bg-primary` or `text-primary` Tailwind tokens — use explicit hex values (`#1E3A5F`, `#2563EB`)
- Do NOT skip `"use client"` on interactive pages

## Code Standards

### Component Rules
- **Never define reusable UI inline in a page file.** If a component takes props and could be used elsewhere (dropdowns, dialogs, multi-selects, pickers, form sections), extract it to `components/`.
- **Page files must stay under ~300 lines.** If a page exceeds that, split it into composable components imported from `components/`.
- **Always use existing shadcn primitives** — `<Input>`, `<Textarea>`, `<Select>`, `<Badge>`, `<Dialog>`, `<Card>`, `<Button>`, `<Switch>`, `<Checkbox>`, etc. Never write raw `<input>`, `<select>`, or `<textarea>` with hand-rolled classNames.
- **Check the shared component registry below before building anything new.** If a component already exists, use it.

### Shared Logic Rules
- **If the same logic appears in 2+ files, extract it** to `lib/` (pure utilities) or `hooks/` (stateful/React logic).
- Formatting helpers (dates, times, initials, currency) → `lib/format.ts`
- CSV/file parsing → `lib/csv-parser.ts`
- Shared fetching or domain logic → `hooks/use<Feature>.ts`

### API Route Rules
- Use the `withAuth()` wrapper from `lib/api-middleware.ts` instead of copy-pasting session checks and try/catch in every route.
- Role-specific checks should use `withRole()` variant.

### Before Writing Any New Page
1. Check `components/ui/` and `components/` for existing components
2. Check `hooks/` for existing logic you can reuse
3. Check `lib/` for existing utilities
4. If you need a new reusable component, create it in `components/` FIRST, then import it
5. If the page will exceed 300 lines, plan the component breakdown before writing

## Shared Component Registry

### UI Primitives (`components/ui/`)
| Component | File | Use For |
|-----------|------|---------|
| Input | `input.tsx` | All text inputs — never use raw `<input>` |
| Textarea | `textarea.tsx` | Multi-line text — never use raw `<textarea>` |
| Select | `select.tsx` | Single-value dropdowns — never use raw `<select>` |
| MultiSelect | `multi-select.tsx` | Searchable multi-pick with checkboxes |
| Button | `button.tsx` | All buttons |
| Badge | `badge.tsx` | Status labels, role tags |
| StatusBadge | `status-badge.tsx` | Colored status indicators |
| Card | `card.tsx` | Content containers |
| Dialog | `dialog.tsx` | Modal overlays |
| Switch | `switch.tsx` | Boolean toggles |
| Checkbox | `checkbox.tsx` | Checkboxes |
| Tabs | `tabs.tsx` | Tab navigation |
| Table | `table.tsx` | Data tables |
| DataTable | `data-table.tsx` | Sortable/filterable tables |
| Avatar | `avatar.tsx` | User avatars |
| SearchInput | `search-input.tsx` | Search fields |
| PageHeader | `page-header.tsx` | Page title + description + actions |
| StatCard | `stat-card.tsx` | Dashboard metric cards |
| EmptyState | `empty-state.tsx` | No-data placeholders |
| Skeleton | `skeleton.tsx` | Loading placeholders |
| ProfileSettings | `profile-settings.tsx` | Account editing (name, email, password, photo) |
| ThemeToggle | `theme-toggle.tsx` | Light/dark/system switcher |
| SignIn | `sign-in.tsx` | Login page layout |

### Shared Hooks (`hooks/`)
| Hook | File | Use For |
|------|------|---------|
| useMessaging | `use-messaging.ts` | Conversation list, send/receive, filtering (used by all 3 message pages) |

### Shared Utilities (`lib/`)
| Utility | File | Use For |
|---------|------|---------|
| format | `format.ts` | `formatDate()`, `formatTime()`, `getInitials()`, `formatCurrency()` |
| csv-parser | `csv-parser.ts` | `parseCSV()` for CSV import |
| api-middleware | `api-middleware.ts` | `withAuth()`, `withRole()` wrappers for API routes |
| db | `db.ts` | Prisma client singleton |
| auth | `auth.ts` | NextAuth config |
| store | `store.ts` | Zustand stores (sidebar, notifications) |
| utils | `utils.ts` | `cn()` class merge utility |

## MCP Servers

### 21st.dev Magic
- **Tool:** `21st-dev-magic`
- **Purpose:** Pull modern, high-quality React/Tailwind components
- **Usage:** Use when building new UI components to get production-ready starting points that align with our shadcn/Tailwind stack
- **Note:** API key configured in MCP settings (not stored in repo)

## Important Notes
- Node >= 22.12.0 required
- `"use client"` directive required on all interactive pages
- shadcn components live in `src/components/ui/`
- Sidebar state managed by `useSidebarStore` from `@/lib/store`
- Notification badge managed by `useNotificationStore`
- Toast notifications use `sonner` — import `toast` from `"sonner"`
- All env vars set in Railway at runtime (not baked into Docker build)
