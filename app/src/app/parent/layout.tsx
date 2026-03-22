"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { motion, AnimatePresence, useMotionValue } from "motion/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserProfileSidebar } from "@/components/ui/menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationDropdown } from "@/components/ui/notification-dropdown";
import { ChatWidget } from "@/components/chat/chat-widget"
import { AnimatedLogo } from "@/components/ui/animated-logo"
import {
  ArrowLeft,
  MessageSquare,
  Video,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  Menu,
  User,
} from "@/lib/icons";
import { Icon3D } from "@/components/ui/icon-3d";

const sidebarGroups = [
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
];

const breadcrumbMap: Record<string, string> = {
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
};

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const userName = session?.user?.name || "User";
  const userEmail = session?.user?.email || "";
  const userInitials = userName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = React.useRef<HTMLDivElement>(null);
  const [notifCount, setNotifCount] = useState(0);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const dragX = useMotionValue(0);

  const handleDragEnd = (_event: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x < -100) setMobileOpen(false);
    dragX.set(0);
  };

  // Role guard: redirect non-parent users to their correct portal
  useEffect(() => {
    if (session?.user) {
      const role = (session.user as { role?: string }).role;
      if (role === "ADMIN") {
        router.replace("/admin");
        return;
      }
      if (role === "STUDENT") {
        router.replace("/student");
        return;
      }
      if (session.user.mustChangePassword) {
        router.push("/change-password");
      }
    }
  }, [session, router]);

  // First-login detection: redirect to onboarding if profile incomplete
  useEffect(() => {
    if (pathname === "/parent/onboarding" || pathname === "/parent/settings") return;
    fetch("/api/auth/onboarding-status")
      .then(r => r.json())
      .then(data => {
        if (data.needsOnboarding) router.push("/parent/onboarding");
      })
      .catch(() => {});
  }, [pathname, router]);

  useEffect(() => {
    fetch("/api/notifications?unread=true")
      .then(r => r.json())
      .then(data => setNotifCount(Array.isArray(data) ? data.length : 0))
      .catch(() => {});
  }, []);

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

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [profileOpen]);

  const currentPage = breadcrumbMap[pathname] || "Dashboard";

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
          <div className="flex h-16 items-center gap-2 border-b border-border px-4">
            <Link href="/parent"><AnimatedLogo size="sm" /></Link>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {(() => { let i = 0; return sidebarGroups.map((group, gi) => (
              <div key={group.label} className={cn(gi > 0 && "mt-6")}>
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{group.label}</p>
                <div className="flex flex-col gap-0.5">
                  {group.items.map((item) => {
                    const isActive = item.href === "/parent" ? pathname === "/parent" : pathname.startsWith(item.href) && item.href !== "/parent";
                    const idx = i++;
                    return (
                      <motion.div key={item.href} initial={{ x: -40, opacity: 0 }} animate={mobileOpen ? { x: 0, opacity: 1, transition: { delay: 0.05 + idx * 0.04, type: "spring", stiffness: 260, damping: 24 } } : { x: -40, opacity: 0 }}>
                        <Link href={item.href} onClick={() => setMobileOpen(false)} className={cn("group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all", isActive ? "bg-accent text-secondary-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground")}>
                          <motion.div whileHover={{ scale: 1.12, rotate: 6 }} whileTap={{ scale: 0.95 }} className="flex h-8 w-8 shrink-0 items-center justify-center">
                            <Icon3D name={item.icon3d} size={28} />
                          </motion.div>
                          <span>{item.name}</span>
                        </Link>
                      </motion.div>
                    );
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
          "hidden lg:flex flex-col border-r border-border bg-card transition-all duration-300",
          collapsed ? "w-[68px]" : "w-64"
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-border px-4">
          <Link href="/parent"><AnimatedLogo size="sm" showText={!collapsed} /></Link>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {(() => { let i = 0; return sidebarGroups.map((group, gi) => (
            <div key={group.label} className={cn(gi > 0 && "mt-6")}>
              {!collapsed && <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{group.label}</p>}
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const isActive = item.href === "/parent" ? pathname === "/parent" : pathname.startsWith(item.href) && item.href !== "/parent";
                  const idx = i++;
                  return (
                    <motion.div key={item.href} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: idx * 0.03 } }}>
                      <Link href={item.href} className={cn("group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all", isActive ? "bg-accent text-secondary-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground")}>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                          <Icon3D name={item.icon3d} size={28} />
                        </div>
                        {!collapsed && <span>{item.name}</span>}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )); })()}
        </nav>
        <div className="border-t border-border p-3">
          <button onClick={() => setCollapsed(!collapsed)} className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            {collapsed ? <ChevronRight className="size-4" /> : <><ChevronLeft className="size-4" /><span>Collapse</span></>}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6">
          <div className="flex items-center gap-2 text-sm">
            <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            {pathname !== "/parent" && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => router.back()}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <span className="text-muted-foreground">Parent Portal</span>
            <span className="text-muted-foreground/40">/</span>
            <span className="font-medium text-foreground">{currentPage}</span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            {/* Messages */}
            <Link href="/parent/messages" className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <MessageSquare className="h-4 w-4" />
              {unreadMsgCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                  {unreadMsgCount > 9 ? "9+" : unreadMsgCount}
                </span>
              )}
            </Link>

            {/* Meetings */}
            <Link href="/parent/meetings" className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <Video className="h-4 w-4" />
            </Link>

            {/* Notifications */}
            <NotificationDropdown />

            <Separator orientation="vertical" className="h-6" />

            {/* Avatar dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors"
              >
                <Avatar size="sm">
                  {session?.user?.image && <AvatarImage src={session.user.image} alt={userName} />}
                  <AvatarFallback className="bg-[#1E3A5F] text-white text-xs font-medium">
                    {userInitials}
                  </AvatarFallback>
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
                      { icon: <User className="h-full w-full" />, label: "My Profile", href: "/parent/profile" },
                      { icon: <Settings className="h-full w-full" />, label: "Settings", href: "/parent/settings" },
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
          <div className="mx-auto max-w-7xl px-6 py-6">{children}</div>
        </main>
      </div>

      {/* AI Chat Widget */}
      <ChatWidget role="PARENT" />
    </div>
  );
}
