"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { motion, AnimatePresence, useMotionValue } from "motion/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationDropdown } from "@/components/ui/notification-dropdown";
import { ChatWidget } from "@/components/chat/chat-widget"
import {
  LayoutDashboard,
  User,
  FileText,
  CheckSquare,
  MessageSquare,
  Video,
  FolderOpen,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Settings,
  Bell,
  CalendarDays,
  Menu,
} from "lucide-react";

const sidebarGroups = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", href: "/parent", icon: LayoutDashboard },
      { name: "Calendar", href: "/parent/calendar", icon: CalendarDays },
    ],
  },
  {
    label: "My Student",
    items: [
      { name: "Profile", href: "/parent/profile", icon: User },
      { name: "Applications", href: "/parent/applications", icon: FileText },
      { name: "Tasks", href: "/parent/tasks", icon: CheckSquare },
    ],
  },
  {
    label: "Communication",
    items: [
      { name: "Messages", href: "/parent/messages", icon: MessageSquare },
      { name: "Meetings", href: "/parent/meetings", icon: Video },
    ],
  },
  {
    label: "Resources",
    items: [
      { name: "Documents", href: "/parent/documents", icon: FolderOpen },
      { name: "Learning Progress", href: "/parent/documents#progress", icon: BookOpen },
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
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const dragX = useMotionValue(0);

  const handleDragEnd = (_event: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x < -100) setMobileOpen(false);
    dragX.set(0);
  };

  // Force password change redirect
  useEffect(() => {
    if (session?.user?.mustChangePassword) {
      router.push("/change-password");
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
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#1E3A5F] text-white font-bold text-sm">S</div>
            <span className="text-base font-semibold text-[#1E3A5F] tracking-tight">ScholarSuite</span>
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
                        <Link href={item.href} onClick={() => setMobileOpen(false)} className={cn("group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all", isActive ? "bg-[#1E3A5F]/5 text-[#1E3A5F]" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground")}>
                          <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200", isActive ? "bg-[#2563EB] text-white shadow-sm" : "bg-muted/60 text-muted-foreground group-hover:bg-[#2563EB] group-hover:text-white group-hover:shadow-sm")}>
                            <item.icon className="size-[16px]" />
                          </div>
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
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#1E3A5F] text-white font-bold text-sm">S</div>
          {!collapsed && <span className="text-base font-semibold text-[#1E3A5F] tracking-tight">ScholarSuite</span>}
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
                      <Link href={item.href} className={cn("group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all", isActive ? "bg-[#1E3A5F]/5 text-[#1E3A5F]" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground")}>
                        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200", isActive ? "bg-[#2563EB] text-white shadow-sm" : "bg-muted/60 text-muted-foreground group-hover:bg-[#2563EB] group-hover:text-white group-hover:shadow-sm")}>
                          <item.icon className="size-[16px]" />
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
            <span className="text-muted-foreground">Parent Portal</span>
            <span className="text-muted-foreground/40">/</span>
            <span className="font-medium text-foreground">{currentPage}</span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {/* Notifications */}
            <NotificationDropdown />

            <Separator orientation="vertical" className="h-6" />

            {/* Avatar dropdown */}
            <div className="relative">
              <button
                onClick={() => setAvatarOpen(!avatarOpen)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors"
              >
                <Avatar size="sm">
                  <AvatarFallback className="bg-[#1E3A5F] text-white text-xs font-medium">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <>
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">{userName}</p>
                      <p className="text-[11px] text-muted-foreground">Parent</p>
                    </div>
                    <ChevronDown className="size-3.5 text-muted-foreground" />
                  </>
                )}
              </button>
              {avatarOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-border bg-card py-1 shadow-lg z-50">
                  <button
                    onClick={() => { setAvatarOpen(false); router.push("/parent/settings"); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted"
                  >
                    <Settings className="size-4 text-muted-foreground" />
                    Settings
                  </button>
                  <div className="my-1 h-px bg-border" />
                  <button onClick={() => signOut({ redirect: false }).then(() => { window.location.href = "/login" })} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                    <LogOut className="size-4" />
                    Sign Out
                  </button>
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
