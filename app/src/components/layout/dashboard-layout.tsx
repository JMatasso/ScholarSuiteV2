"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Sidebar, type SidebarGroup } from "./sidebar";
import { Topbar } from "./topbar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebarGroups: SidebarGroup[];
  userName?: string;
  userEmail?: string;
  userImage?: string | null;
  notificationCount?: number;
  onSignOut?: () => void;
}

export function DashboardLayout({
  children,
  sidebarGroups,
  userName,
  userEmail,
  userImage,
  notificationCount,
  onSignOut,
}: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#FAFAF8]">
      {/* Sidebar */}
      <Sidebar
        groups={sidebarGroups}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main area offset by sidebar width */}
      <div
        className={cn(
          "flex flex-1 flex-col transition-all duration-200",
          sidebarCollapsed ? "ml-16" : "ml-64"
        )}
      >
        {/* Topbar */}
        <Topbar
          userName={userName}
          userEmail={userEmail}
          userImage={userImage}
          notificationCount={notificationCount}
          onSignOut={onSignOut}
        />

        {/* Main content */}
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
