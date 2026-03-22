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
import { AnimatedLogo } from "@/components/ui/animated-logo"
import { NavIcon } from "@/lib/nav-icons"
import type { NavGroup, ProfileNavItem, ProfileLogoutItem } from "@/lib/nav-config"
import {
  MessageSquare,
  Video,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Settings,
  Shield,
  LogOut,
  User,
  Menu,
  Search,
} from "@/lib/icons"

interface RoleLayoutProps {
  children: React.ReactNode
  role: "STUDENT" | "PARENT" | "ADMIN"
  basePath: string
  navGroups: NavGroup[]
  showProfileCompletion?: boolean
  showChatWidget?: boolean
  showTopbarSearch?: boolean
  breadcrumbMap?: Record<string, string>
  hideChatOnPaths?: string[]
}

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean)
  return segments.map((seg, i) => ({
    label: seg.charAt(0).toUpperCase() + seg.slice(1),
    href: "/" + segments.slice(0, i + 1).join("/"),
  }))
}

export function RoleLayout({
  children,
  role,
  basePath,
  navGroups,
  showProfileCompletion = false,
  showChatWidget = false,
  showTopbarSearch = false,
  breadcrumbMap,
  hideChatOnPaths = [],
}: RoleLayoutProps) {
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
  const [unreadMsgCount, setUnreadMsgCount] = useState(0)
  const [profileCompletion, setProfileCompletion] = useState(100)
  const [searchQuery, setSearchQuery] = useState("")
  const dragX = useMotionValue(0)

  // Fetch profile completion (student only)
  useEffect(() => {
    if (!showProfileCompletion) return
    fetch("/api/students/profile/completion")
      .then(r => r.json())
      .then(data => { if (typeof data.percentage === "number") setProfileCompletion(data.percentage) })
      .catch(() => {})
  }, [showProfileCompletion])

  // Role guard: redirect users to their correct portal
  useEffect(() => {
    if (session?.user) {
      const userRole = (session.user as { role?: string }).role
      if (userRole !== role) {
        if (userRole === "ADMIN") router.replace("/admin")
        else if (userRole === "PARENT") router.replace("/parent")
        else if (userRole === "STUDENT") router.replace("/student")
        return
      }
      if (session.user.mustChangePassword) {
        router.push("/change-password")
      }
    }
  }, [session, router, role])

  // First-login onboarding check (student + parent)
  useEffect(() => {
    if (role === "ADMIN") return
    const skipPaths = [`${basePath}/onboarding`, `${basePath}/settings`, `${basePath}/profile`]
    if (skipPaths.some(p => pathname === p)) return
    fetch("/api/auth/onboarding-status")
      .then(r => r.json())
      .then(data => {
        if (data.needsOnboarding) router.push(`${basePath}/onboarding`)
      })
      .catch(() => {})
  }, [pathname, router, role, basePath])

  // Fetch notification count
  useEffect(() => {
    fetch("/api/notifications?unread=true")
      .then(r => r.json())
      .then(data => setNotifCount(Array.isArray(data) ? data.length : 0))
      .catch(() => {})
  }, [])

  // Fetch unread message count
  useEffect(() => {
    fetch("/api/messages")
      .then(r => r.json())
      .then(msgs => {
        if (Array.isArray(msgs)) {
          const unread = msgs.filter((m: { senderId: string; read?: boolean; isRead?: boolean }) =>
            m.senderId !== session?.user?.id && !(m.read ?? m.isRead ?? true)
          ).length
          setUnreadMsgCount(unread)
        }
      })
      .catch(() => {})
  }, [session?.user?.id])

  // Close profile dropdown on outside click
  useEffect(() => {
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
    if (href === basePath) return pathname === basePath
    return pathname.startsWith(href)
  }

  const handleDragEnd = (_event: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x < -100) setMobileOpen(false)
    dragX.set(0)
  }

  // Build breadcrumbs
  const breadcrumbs = breadcrumbMap
    ? [
        { label: role === "PARENT" ? "Parent Portal" : role.charAt(0) + role.slice(1).toLowerCase(), href: basePath },
        ...(breadcrumbMap[pathname] ? [{ label: breadcrumbMap[pathname], href: pathname }] : []),
      ]
    : getBreadcrumbs(pathname)

  // Build profile nav items
  const profileNavItems: ProfileNavItem[] = [
    { icon: <User className="h-full w-full" />, label: "My Profile", href: `${basePath}/profile` },
    { icon: <Settings className="h-full w-full" />, label: "Settings", href: `${basePath}/settings` },
    ...(role === "ADMIN" ? [{ icon: <Shield className="h-full w-full" />, label: "Audit Log", href: "/admin/audit" }] : []),
  ]

  const logoutItem: ProfileLogoutItem = {
    icon: <LogOut className="h-full w-full" />,
    label: "Sign Out",
    onClick: () => signOut({ redirect: false }).then(() => { window.location.href = "/login" }),
  }

  // Flatten nav items for stagger index
  let globalIndex = 0

  const sidebarContent = (isMobile = false) => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn("flex h-16 items-center border-b px-4", collapsed && !isMobile && "justify-center px-2")}>
        <Link href={basePath}>
          <AnimatedLogo size="sm" showText={!collapsed || isMobile} />
        </Link>
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
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                        collapsed && !isMobile && "justify-center px-2",
                        active
                          ? "bg-accent text-secondary-foreground"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                      )}
                      title={collapsed && !isMobile ? item.name : undefined}
                    >
                      <NavIcon name={item.icon3d} className={cn("h-4 w-4 shrink-0", active ? "text-[#2563EB]" : "text-muted-foreground")} />
                      {(!collapsed || isMobile) && (
                        <span className="flex items-center gap-1.5">
                          {item.name}
                          {item.beta && (
                            <span className="rounded bg-amber-100 px-1 py-px text-[9px] font-bold uppercase leading-tight text-amber-700">
                              Beta
                            </span>
                          )}
                        </span>
                      )}
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Profile completion indicator (student only) */}
      {showProfileCompletion && (!collapsed || isMobile) && profileCompletion < 100 && (
        <div className="border-t px-3 py-3">
          <Link href={`${basePath}/profile`} className="block">
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
        {sidebarContent()}
      </aside>

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
            {/* Back button */}
            {pathname !== basePath && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => router.back()}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {/* Search bar (admin only) */}
            {showTopbarSearch && (
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
            )}
            {/* Breadcrumbs (non-search mode) */}
            {!showTopbarSearch && (
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
            )}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            {/* Messages */}
            <Link href={`${basePath}/messages`} className="relative flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline text-xs font-medium">Messages</span>
              {unreadMsgCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                  {unreadMsgCount > 9 ? "9+" : unreadMsgCount}
                </span>
              )}
            </Link>

            {/* Meetings */}
            <Link href={`${basePath}/meetings`} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline text-xs font-medium">Meetings</span>
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
                    navItems={profileNavItems}
                    logoutItem={logoutItem}
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
      {showChatWidget && !hideChatOnPaths.some(p => pathname.startsWith(p)) && (
        <ChatWidget role={role as "STUDENT" | "PARENT"} />
      )}
    </div>
  )
}
