"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Layers,
  Award,
  ListTodo,
  BookOpen,
  PenTool,
  MessageSquare,
  Megaphone,
  Video,
  Briefcase,
  BarChart3,
  DollarSign,
  LifeBuoy,
  Settings,
  Shield,
  PanelLeftClose,
  PanelLeft,
  Bell,
  Search,
  type LucideIcon,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    title: "People",
    items: [
      { label: "Students", href: "/admin/students", icon: Users },
      { label: "Parents", href: "/admin/parents", icon: UserPlus },
      { label: "Cohorts", href: "/admin/cohorts", icon: Layers },
    ],
  },
  {
    title: "Content",
    items: [
      { label: "Scholarships", href: "/admin/scholarships", icon: Award },
      { label: "Task Templates", href: "/admin/templates", icon: ListTodo },
      { label: "Learning", href: "/admin/learning", icon: BookOpen },
      { label: "Essays", href: "/admin/essays", icon: PenTool },
    ],
  },
  {
    title: "Communication",
    items: [
      { label: "Messages", href: "/admin/messages", icon: MessageSquare },
      { label: "Announcements", href: "/admin/announcements", icon: Megaphone },
      { label: "Meetings", href: "/admin/meetings", icon: Video },
    ],
  },
  {
    title: "Business",
    items: [
      { label: "CRM", href: "/admin/crm", icon: Briefcase },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
      { label: "Financial", href: "/admin/financial", icon: DollarSign },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Support", href: "/admin/support", icon: LifeBuoy },
      { label: "Settings", href: "/admin/settings", icon: Settings },
      { label: "Audit Log", href: "/admin/audit", icon: Shield },
    ],
  },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = React.useState(false)

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin"
    return pathname.startsWith(href)
  }

  return (
    <div className="flex h-screen bg-[#FAFAF8]">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex h-full flex-col border-r border-border bg-white transition-all duration-200",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#1E3A5F] text-white font-semibold text-sm">
            S
          </div>
          {!collapsed && (
            <span className="text-sm font-semibold text-foreground tracking-tight">
              ScholarSuite
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {navGroups.map((group) => (
            <div key={group.title} className="mb-4">
              {!collapsed && (
                <p className="mb-1 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                  {group.title}
                </p>
              )}
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-[#1E3A5F]/5 text-[#1E3A5F]"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        collapsed && "justify-center px-0"
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#1E3A5F]" />
                      )}
                      <item.icon className="size-4 shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse Toggle */}
        <div className="border-t border-border p-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn("w-full", collapsed ? "justify-center" : "justify-start")}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
            {!collapsed && <span className="ml-2">Collapse</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-white px-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search students, scholarships..."
                className="h-8 w-64 rounded-lg border border-input bg-transparent pl-8 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon">
              <Bell className="size-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Avatar size="sm">
                <AvatarFallback>AC</AvatarFallback>
              </Avatar>
              <div className="hidden text-left sm:block">
                <p className="text-xs font-medium text-foreground">Admin Console</p>
                <p className="text-[11px] text-muted-foreground">Consultant</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
