"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
} from "lucide-react";

const sidebarGroups = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", href: "/parent", icon: LayoutDashboard },
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
  const [collapsed, setCollapsed] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);

  const currentPage = breadcrumbMap[pathname] || "Dashboard";

  return (
    <div className="flex h-screen bg-[#FAFAF8]">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r border-gray-200 bg-white transition-all duration-300",
          collapsed ? "w-[68px]" : "w-64"
        )}
      >
        {/* Logo area */}
        <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-4">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#1E3A5F] text-white font-bold text-sm">
            S
          </div>
          {!collapsed && (
            <span className="text-base font-semibold text-[#1E3A5F] tracking-tight">
              ScholarSuite
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {sidebarGroups.map((group, gi) => (
            <div key={group.label} className={cn(gi > 0 && "mt-6")}>
              {!collapsed && (
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  {group.label}
                </p>
              )}
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const isActive =
                    item.href === "/parent"
                      ? pathname === "/parent"
                      : pathname.startsWith(item.href) && item.href !== "/parent";
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-[#1E3A5F]/5 text-[#1E3A5F]"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#1E3A5F]" />
                      )}
                      <item.icon
                        className={cn(
                          "size-[18px] shrink-0",
                          isActive ? "text-[#1E3A5F]" : "text-gray-400 group-hover:text-gray-600"
                        )}
                      />
                      {!collapsed && <span>{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse button */}
        <div className="border-t border-gray-200 p-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <>
                <ChevronLeft className="size-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">Parent Portal</span>
            <span className="text-gray-300">/</span>
            <span className="font-medium text-gray-700">{currentPage}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="relative flex size-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
              <Bell className="size-[18px]" />
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-red-500" />
            </button>

            <Separator orientation="vertical" className="h-6" />

            {/* Avatar dropdown */}
            <div className="relative">
              <button
                onClick={() => setAvatarOpen(!avatarOpen)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50 transition-colors"
              >
                <Avatar size="sm">
                  <AvatarFallback className="bg-[#1E3A5F] text-white text-xs font-medium">
                    MJ
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-700">Maria Johnson</p>
                      <p className="text-[11px] text-gray-400">Parent</p>
                    </div>
                    <ChevronDown className="size-3.5 text-gray-400" />
                  </>
                )}
              </button>
              {avatarOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg z-50">
                  <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <Settings className="size-4 text-gray-400" />
                    Settings
                  </button>
                  <div className="my-1 h-px bg-gray-100" />
                  <button onClick={() => signOut({ callbackUrl: "/login" })} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
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
    </div>
  );
}
