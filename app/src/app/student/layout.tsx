"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { motion, AnimatePresence, useMotionValue } from "motion/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserProfileSidebar } from "@/components/ui/menu"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { NotificationDropdown } from "@/components/ui/notification-dropdown"
import { ChatWidget } from "@/components/chat/chat-widget"
import {
  LayoutDashboard,
  Search,
  FileText,
  Trophy,
  CheckSquare,
  PenTool,
  FolderOpen,
  BookOpen,
  DollarSign,
  Activity,
  Clock,
  MessageSquare,
  Video,
  ChevronLeft,
  ChevronRight,
  Bell,
  Settings,
  LogOut,
  User,
  Menu,
  CalendarDays,
} from "lucide-react"

const navGroups = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", href: "/student", icon: LayoutDashboard },
      { name: "Calendar", href: "/student/calendar", icon: CalendarDays },
    ],
  },
  {
    label: "Scholarships",
    items: [
      { name: "Discovery", href: "/student/scholarships", icon: Search },
      { name: "Applications", href: "/student/applications", icon: FileText },
      { name: "Won Awards", href: "/student/awards", icon: Trophy },
    ],
  },
  {
    label: "Academics",
    items: [
      { name: "Tasks", href: "/student/tasks", icon: CheckSquare },
      { name: "Essays", href: "/student/essays", icon: PenTool },
      { name: "Resume", href: "/student/resume", icon: FileText },
      { name: "Documents", href: "/student/documents", icon: FolderOpen },
      { name: "Learning", href: "/student/learning", icon: BookOpen },
    ],
  },
  {
    label: "Planning",
    items: [
      { name: "Financial Plan", href: "/student/financial", icon: DollarSign },
      { name: "Activities", href: "/student/activities", icon: Activity },
      { name: "Timeline", href: "/student/timeline", icon: Clock },
    ],
  },
  {
    label: "Communication",
    items: [
      { name: "Messages", href: "/student/messages", icon: MessageSquare },
      { name: "Meetings", href: "/student/meetings", icon: Video },
    ],
  },
]

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean)
  const crumbs = segments.map((seg, i) => ({
    label: seg.charAt(0).toUpperCase() + seg.slice(1),
    href: "/" + segments.slice(0, i + 1).join("/"),
  }))
  return crumbs
}

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const userName = session?.user?.name || "User"
  const userEmail = session?.user?.email || ""
  const userInitials = userName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = React.useRef<HTMLDivElement>(null)
  const [notifCount, setNotifCount] = useState(0)
  const [profileCompletion, setProfileCompletion] = useState(100)
  const breadcrumbs = getBreadcrumbs(pathname)

  // Fetch profile completion
  useEffect(() => {
    fetch("/api/students/profile/completion")
      .then(r => r.json())
      .then(data => { if (typeof data.percentage === "number") setProfileCompletion(data.percentage) })
      .catch(() => {})
  }, [])

  // Force password change redirect
  useEffect(() => {
    if (session?.user?.mustChangePassword) {
      router.push("/change-password")
    }
  }, [session, router])

  // First-login detection: redirect to onboarding if profile incomplete
  useEffect(() => {
    if (pathname === "/student/onboarding" || pathname === "/student/settings" || pathname === "/student/profile") return
    fetch("/api/auth/onboarding-status")
      .then(r => r.json())
      .then(data => {
        if (data.needsOnboarding) router.push("/student/onboarding")
      })
      .catch(() => {})
  }, [pathname, router])

  useEffect(() => {
    fetch("/api/notifications?unread=true")
      .then(r => r.json())
      .then(data => setNotifCount(Array.isArray(data) ? data.length : 0))
      .catch(() => {})
  }, [])

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
    if (href === "/student") return pathname === "/student"
    return pathname.startsWith(href)
  }

  const dragX = useMotionValue(0)

  const handleDragEnd = (_event: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x < -100) setMobileOpen(false)
    dragX.set(0)
  }

  // Flatten nav items for stagger index
  let globalIndex = 0

  const sidebarContent = (isMobile = false) => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn("flex h-16 items-center border-b px-4", collapsed && !isMobile && "justify-center px-2")}>
        {(!collapsed || isMobile) ? (
          <Link href="/student" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E3A5F] text-white text-sm font-bold">
              S
            </div>
            <span className="text-base font-semibold text-[#1E3A5F]">ScholarSuite</span>
          </Link>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E3A5F] text-white text-sm font-bold">
            S
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {(() => { globalIndex = 0; return null })()}
        {navGroups.map((group) => (
          <div key={group.label} className="mb-6">
            {(!collapsed || isMobile) && (
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                const idx = globalIndex++
                return (
                  <motion.div
                    key={item.href}
                    initial={isMobile ? { x: -40, opacity: 0 } : { opacity: 0, y: 8 }}
                    animate={isMobile
                      ? (mobileOpen ? { x: 0, opacity: 1, transition: { delay: 0.05 + idx * 0.04, type: "spring", stiffness: 260, damping: 24 } } : { x: -40, opacity: 0 })
                      : { opacity: 1, y: 0, transition: { delay: idx * 0.03 } }
                    }
                  >
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-all",
                        active
                          ? "bg-[#1E3A5F]/5 text-[#1E3A5F]"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                        collapsed && !isMobile && "justify-center px-2"
                      )}
                    >
                      <motion.div
                        whileHover={{ scale: 1.12, rotate: 6 }}
                        whileTap={{ scale: 0.95 }}
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200",
                          active
                            ? "bg-[#2563EB] text-white shadow-sm"
                            : "bg-muted/60 text-muted-foreground group-hover:bg-[#2563EB] group-hover:text-white group-hover:shadow-sm"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </motion.div>
                      {(!collapsed || isMobile) && <span>{item.name}</span>}
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Profile completion indicator */}
      {(!collapsed || isMobile) && profileCompletion < 100 && (
        <div className="border-t px-3 py-3">
          <Link href="/student/profile" className="block">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-muted-foreground">Profile</span>
              <span className="text-xs font-semibold text-primary">{profileCompletion}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Complete your profile for better matches</p>
          </Link>
        </div>
      )}

      {/* Collapse toggle */}
      <div className="hidden border-t p-3 lg:block">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )

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
        {sidebarContent(true)}
      </motion.aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden border-r border-border bg-card transition-all duration-200 lg:flex lg:flex-col",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {sidebarContent()}</aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
              {breadcrumbs.map((crumb, i) => (
                <React.Fragment key={crumb.href}>
                  {i > 0 && <span className="text-muted-foreground/40">/</span>}
                  {i === breadcrumbs.length - 1 ? (
                    <span className="font-medium text-foreground">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} className="hover:text-foreground transition-colors">
                      {crumb.label}
                    </Link>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
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
                      { icon: <User className="h-full w-full" />, label: "My Profile", href: "/student/profile" },
                      { icon: <Settings className="h-full w-full" />, label: "Settings", href: "/student/settings" },
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

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* AI Chat Widget */}
      <ChatWidget role="STUDENT" />
    </div>
  )
}
