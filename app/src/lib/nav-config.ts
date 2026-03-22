import type { ReactNode } from "react"

export interface NavItem {
  name: string
  href: string
  icon3d: string
  beta?: boolean
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export interface ProfileNavItem {
  icon: ReactNode
  label: string
  href: string
}

export interface ProfileLogoutItem {
  icon: ReactNode
  label: string
  onClick: () => void
}

export interface RoleLayoutConfig {
  role: "STUDENT" | "PARENT" | "ADMIN"
  basePath: string
  navGroups: NavGroup[]
  showProfileCompletion?: boolean
  showChatWidget?: boolean
  showTopbarSearch?: boolean
  /** If provided, uses this map for breadcrumbs instead of auto-generating from pathname */
  breadcrumbMap?: Record<string, string>
}

// ─── Student Nav ────────────────────────────────────────────

export const studentNavGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", href: "/student", icon3d: "LayoutDashboard" },
      { name: "ScholarSuite AI", href: "/student/assistant", icon3d: "Bot", beta: true },
      { name: "Tasks", href: "/student/tasks", icon3d: "CheckSquare" },
      { name: "Calendar", href: "/student/calendar", icon3d: "CalendarDays" },
      { name: "Learning", href: "/student/learning", icon3d: "BookOpen" },
    ],
  },
  {
    label: "Scholarships",
    items: [
      { name: "Overview", href: "/student/overview", icon3d: "Trophy" },
      { name: "Discovery", href: "/student/scholarships", icon3d: "Search" },
      { name: "Applications", href: "/student/applications", icon3d: "FileText" },
    ],
  },
  {
    label: "Colleges",
    items: [
      { name: "Colleges", href: "/student/colleges", icon3d: "GraduationCap" },
      { name: "Visits", href: "/student/colleges/visits", icon3d: "CalendarDays" },
      { name: "Financial Plan", href: "/student/financial", icon3d: "DollarSign" },
    ],
  },
  {
    label: "Academics",
    items: [
      { name: "Course Planner", href: "/student/academics", icon3d: "BookOpen" },
      { name: "Documents", href: "/student/documents", icon3d: "FolderOpen" },
      { name: "Activity Brag Sheet", href: "/student/activities", icon3d: "Activity" },
      { name: "Essays", href: "/student/essays", icon3d: "PenTool", beta: true },
      { name: "Letters of Rec", href: "/student/letters", icon3d: "Mail", beta: true },
      { name: "Resume", href: "/student/resume", icon3d: "FileText", beta: true },
    ],
  },
]

// ─── Admin Nav ──────────────────────────────────────────────

export const adminNavGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", href: "/admin", icon3d: "LayoutDashboard" },
      { name: "Calendar", href: "/admin/calendar", icon3d: "CalendarDays" },
    ],
  },
  {
    label: "Communication",
    items: [
      { name: "Messages", href: "/admin/messages", icon3d: "MessageSquare" },
      { name: "Announcements", href: "/admin/announcements", icon3d: "Megaphone" },
      { name: "Meetings", href: "/admin/meetings", icon3d: "Video" },
      { name: "Essays", href: "/admin/essays", icon3d: "PenTool" },
    ],
  },
  {
    label: "People",
    items: [
      { name: "Students", href: "/admin/students", icon3d: "Users" },
      { name: "Parents", href: "/admin/parents", icon3d: "UserPlus" },
      { name: "Access Requests", href: "/admin/access-requests", icon3d: "UserCheck" },
      { name: "Cohorts", href: "/admin/cohorts", icon3d: "Layers" },
      { name: "Schools", href: "/admin/schools", icon3d: "School" },
      { name: "Colleges", href: "/admin/colleges", icon3d: "Building2" },
    ],
  },
  {
    label: "Content",
    items: [
      { name: "Scholarships", href: "/admin/scholarships", icon3d: "Award" },
      { name: "Local Scholarships", href: "/admin/scholarships/local", icon3d: "MapPin" },
      { name: "Providers", href: "/admin/scholarships/providers", icon3d: "Building2" },
      { name: "Task Templates", href: "/admin/templates", icon3d: "ListTodo" },
      { name: "Learning", href: "/admin/learning", icon3d: "BookOpen" },
    ],
  },
  {
    label: "Business",
    items: [
      { name: "CRM", href: "/admin/crm", icon3d: "Briefcase" },
      { name: "Reviews", href: "/admin/reviews", icon3d: "ClipboardCheck" },
      { name: "Reports", href: "/admin/reports", icon3d: "FileText" },
      { name: "Analytics", href: "/admin/analytics", icon3d: "BarChart3" },
      { name: "Financial", href: "/admin/financial", icon3d: "DollarSign" },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Team", href: "/admin/team", icon3d: "Users" },
      { name: "Support", href: "/admin/support", icon3d: "LifeBuoy" },
      { name: "Settings", href: "/admin/settings", icon3d: "Settings" },
      { name: "Audit Log", href: "/admin/audit", icon3d: "Shield" },
    ],
  },
]

// ─── Parent Nav ─────────────────────────────────────────────

export const parentNavGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", href: "/parent", icon3d: "LayoutDashboard" },
      { name: "Updates", href: "/parent/updates", icon3d: "Bell" },
      { name: "Calendar", href: "/parent/calendar", icon3d: "CalendarDays" },
      { name: "Timeline", href: "/parent/timeline", icon3d: "Clock" },
    ],
  },
  {
    label: "My Student",
    items: [
      { name: "Profile", href: "/parent/profile", icon3d: "User" },
      { name: "Applications", href: "/parent/applications", icon3d: "FileText" },
      { name: "Tasks", href: "/parent/tasks", icon3d: "CheckSquare" },
    ],
  },
  {
    label: "Colleges",
    items: [
      { name: "Overview", href: "/parent/colleges", icon3d: "GraduationCap" },
      { name: "Decisions", href: "/parent/colleges/decisions", icon3d: "CheckCircle" },
      { name: "Visits", href: "/parent/colleges/visits", icon3d: "MapPin" },
    ],
  },
  {
    label: "Resources",
    items: [
      { name: "Documents", href: "/parent/documents", icon3d: "FolderOpen" },
      { name: "Learning", href: "/parent/learning", icon3d: "BookOpen" },
    ],
  },
]

export const parentBreadcrumbMap: Record<string, string> = {
  "/parent": "Dashboard",
  "/parent/profile": "Student Profile",
  "/parent/applications": "Applications",
  "/parent/tasks": "Tasks",
  "/parent/messages": "Messages",
  "/parent/meetings": "Meetings",
  "/parent/documents": "Documents & Resources",
  "/parent/learning": "Learning Library",
  "/parent/colleges": "College Applications",
  "/parent/colleges/decisions": "College Decisions",
  "/parent/colleges/visits": "College Visits",
}
