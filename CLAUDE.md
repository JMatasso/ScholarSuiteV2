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

## Important Notes
- Node >= 22.12.0 required
- `"use client"` directive required on all interactive pages
- shadcn components live in `src/components/ui/`
- Sidebar state managed by `useSidebarStore` from `@/lib/store`
- Notification badge managed by `useNotificationStore`
- Toast notifications use `sonner` — import `toast` from `"sonner"`
- All env vars set in Railway at runtime (not baked into Docker build)
