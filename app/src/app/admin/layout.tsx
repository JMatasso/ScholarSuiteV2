"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence, useMotionValue } from "motion/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  LayoutDashboard,
  Users,
  UserPlus,
  UserCheck,
  Layers,
  School,
  Award,
  ListTodo,
  BookOpen,
  PenTool,
  MessageSquare,
  Megaphone,
  Video,
  Briefcase,
  ClipboardCheck,
  BarChart3,
  FileBarChart,
  DollarSign,
  LifeBuoy,
  Settings,
  Shield,
  PanelLeftClose,
  PanelLeft,
  Bell,
  Search,
  LogOut,
  CalendarDays,
  Menu,
  User,
  MapPin,
  Building2,
  type LucideIcon,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserProfileSidebar } from "@/components/ui/menu"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { NotificationDropdown } from "@/components/ui/notification-dropdown"
import { signOut, useSession } from "next-auth/react"
import { AnimatedLogo } from "@/components/ui/animated-logo"

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
      { label: "Calendar", href: "/admin/calendar", icon: CalendarDays },
    ],
  },
  {
    title: "Communication",
    items: [
      { label: "Messages", href: "/admin/messages", icon: MessageSquare },
      { label: "Announcements", href: "/admin/announcements", icon: Megaphone },
      { label: "Meetings", href: "/admin/meetings", icon: Video },
      { label: "Essays", href: "/admin/essays", icon: PenTool },
    ],
  },
  {
    title: "People",
    items: [
      { label: "Students", href: "/admin/students", icon: Users },
      { label: "Parents", href: "/admin/parents", icon: UserPlus },
      { label: "Access Requests", href: "/admin/access-requests", icon: UserCheck },
      { label: "Cohorts", href: "/admin/cohorts", icon: Layers },
      { label: "Schools", href: "/admin/schools", icon: School },
      { label: "Colleges", href: "/admin/colleges", icon: Building2 },
    ],
  },
  {
    title: "Content",
    items: [
      { label: "Scholarships", href: "/admin/scholarships", icon: Award },
      { label: "Local Scholarships", href: "/admin/scholarships/local", icon: MapPin },
      { label: "Providers", href: "/admin/scholarships/providers", icon: Building2 },
      { label: "Task Templates", href: "/admin/templates", icon: ListTodo },
      { label: "Learning", href: "/admin/learning", icon: BookOpen },
    ],
  },
  {
    title: "Business",
    items: [
      { label: "CRM", href: "/admin/crm", icon: Briefcase },
      { label: "Reviews", href: "/admin/reviews", icon: ClipboardCheck },
      { label: "Reports", href: "/admin/reports", icon: FileBarChart },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
      { label: "Financial", href: "/admin/financial", icon: DollarSign },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Team", href: "/admin/team", icon: Users },
      { label: "Support", href: "/admin/support", icon: LifeBuoy },
      { label: "Settings", href: "/admin/settings", icon: Settings },
      { label: "Audit Log", href: "/admin/audit", icon: Shield },
    ],
  },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = React.useState("")
  const userName = session?.user?.name || "User"
  const userEmail = session?.user?.email || ""
  const userInitials = userName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
  const [collapsed, setCollapsed] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [profileOpen, setProfileOpen] = React.useState(false)
  const profileRef = React.useRef<HTMLDivElement>(null)
  const dragX = useMotionValue(0)

  const handleDragEnd = (_event: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x < -100) setMobileOpen(false)
    dragX.set(0)
  }

  // Role guard: redirect non-admin users to their correct portal
  React.useEffect(() => {
    if (session?.user) {
      const role = (session.user as { role?: string }).role
      if (role === "STUDENT") {
        router.replace("/student")
        return
      }
      if (role === "PARENT") {
        router.replace("/parent")
        return
      }
      if (session.user.mustChangePassword) {
        router.push("/change-password")
      }
    }
  }, [session, router])

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false)
      }
    }
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [profileOpen])

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin"
    return pathname.startsWith(href)
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <motion.aside
        initial={{ x: "-100%" }}
        animate={{ x: mobileOpen ? 0 : "-100%" }}
        transition={{ type: "spring", stiffness: 200, damping: 30, mass: 0.8 }}
        drag="x"
        dragConstraints={{ left: -280, right: 0 }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
        style={{ x: mobileOpen ? dragX : "-100%" }}
        className="fixed inset-y-0 left-0 z-50 w-64 bg-card shadow-2xl lg:hidden"
      >
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center gap-2 border-b border-border px-4">
            <AnimatedLogo size="sm" />
          </div>
          <nav className="flex-1 overflow-y-auto px-2 py-3">
            {(() => { let i = 0; return navGroups.map((group) => (
              <div key={group.title} className="mb-4">
                <p className="mb-1 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">{group.title}</p>
                <div className="flex flex-col gap-0.5">
                  {group.items.map((item) => {
                    const active = isActive(item.href)
                    const idx = i++
                    return (
                      <motion.div key={item.href} initial={{ x: -40, opacity: 0 }} animate={mobileOpen ? { x: 0, opacity: 1, transition: { delay: 0.05 + idx * 0.03, type: "spring", stiffness: 260, damping: 24 } } : { x: -40, opacity: 0 }}>
                        <Link href={item.href} onClick={() => setMobileOpen(false)} className={cn("group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all", active ? "bg-accent text-secondary-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground")}>
                          <motion.div whileHover={{ scale: 1.12, rotate: 6 }} whileTap={{ scale: 0.95 }} className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200", active ? "bg-[#2563EB] text-white shadow-sm" : "bg-muted/60 text-muted-foreground group-hover:bg-[#2563EB] group-hover:text-white group-hover:shadow-sm")}>
                            <item.icon className="size-4" />
                          </motion.div>
                          <span>{item.label}</span>
                        </Link>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )); })()}
          </nav>
        </div>
      </motion.aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex h-full flex-col border-r border-border bg-card transition-all duration-200",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <AnimatedLogo size="sm" showText={!collapsed} />
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {(() => { let i = 0; return navGroups.map((group) => (
            <div key={group.title} className="mb-4">
              {!collapsed && <p className="mb-1 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">{group.title}</p>}
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href)
                  const idx = i++
                  return (
                    <motion.div key={item.href} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: idx * 0.02 } }}>
                      <Link href={item.href} className={cn("group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all", active ? "bg-accent text-secondary-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground", collapsed && "justify-center px-1")}>
                        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200", active ? "bg-[#2563EB] text-white shadow-sm" : "bg-muted/60 text-muted-foreground group-hover:bg-[#2563EB] group-hover:text-white group-hover:shadow-sm")}>
                          <item.icon className="size-4" />
                        </div>
                        {!collapsed && <span>{item.label}</span>}
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )); })()}
        </nav>
        <div className="border-t border-border p-2">
          <Button variant="ghost" size="sm" className={cn("w-full", collapsed ? "justify-center" : "justify-start")} onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
            {!collapsed && <span className="ml-2">Collapse</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            {pathname !== "/admin" && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => router.back()}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search students, scholarships..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    router.push(`/admin/students?search=${encodeURIComponent(searchQuery.trim())}`)
                  }
                }}
                className="h-8 w-64 rounded-lg border border-input bg-transparent pl-8 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {/* Messages */}
            <Link href="/admin/messages" className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <MessageSquare className="h-4 w-4" />
            </Link>

            {/* Meetings */}
            <Link href="/admin/meetings" className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <Video className="h-4 w-4" />
            </Link>

            <NotificationDropdown />
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors"
              >
                <Avatar size="sm">
                  {session?.user?.image && <AvatarImage src={session.user.image} alt={userName} />}
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
                <div className="hidden text-left sm:block">
                  <p className="text-xs font-medium text-foreground">{userName}</p>
                  <p className="text-[11px] text-muted-foreground">{userEmail}</p>
                </div>
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 z-50" onClick={() => setProfileOpen(false)}>
                  <UserProfileSidebar
                    user={{
                      name: userName,
                      email: userEmail,
                      avatarUrl: session?.user?.image || `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%231E3A5F" width="100" height="100" rx="50"/><text x="50" y="55" font-size="40" fill="white" text-anchor="middle" dominant-baseline="middle" font-family="system-ui">${userInitials}</text></svg>`)}`,
                    }}
                    navItems={[
                      { icon: <User className="h-full w-full" />, label: "My Profile", href: "/admin/settings" },
                      { icon: <Settings className="h-full w-full" />, label: "Settings", href: "/admin/settings" },
                      { icon: <Shield className="h-full w-full" />, label: "Audit Log", href: "/admin/audit" },
                    ]}
                    logoutItem={{
                      icon: <LogOut className="h-full w-full" />,
                      label: "Sign Out",
                      onClick: () => signOut({ redirect: false }).then(() => { window.location.href = "/login" }),
                    }}
                  />
                </div>
              )}
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
