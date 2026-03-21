"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronRight,
  LogOut,
  Search,
  Settings,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/format";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface TopbarProps {
  userName?: string;
  userEmail?: string;
  userImage?: string | null;
  notificationCount?: number;
  onSignOut?: () => void;
}

function buildBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];
  let currentPath = "";

  for (const segment of segments) {
    currentPath += `/${segment}`;
    const label = segment
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    crumbs.push({ label, href: currentPath });
  }

  return crumbs;
}

export function Topbar({
  userName,
  userEmail,
  userImage,
  notificationCount = 0,
  onSignOut,
}: TopbarProps) {
  const pathname = usePathname();
  const breadcrumbs = buildBreadcrumbs(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center border-b border-border bg-white/80 backdrop-blur-sm">
      <div className="flex w-full items-center justify-between px-6">
        {/* Left: Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.href}>
              {index > 0 && (
                <ChevronRight className="size-3.5 text-muted-foreground" />
              )}
              {index === breadcrumbs.length - 1 ? (
                <span className="font-medium text-foreground">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* Center: Search trigger */}
        <button
          className="hidden items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted md:inline-flex"
          onClick={() => {
            // Search trigger - can be wired to a command palette
            document.dispatchEvent(
              new KeyboardEvent("keydown", { key: "k", metaKey: true })
            );
          }}
        >
          <Search className="size-4" />
          <span>Search...</span>
          <kbd className="pointer-events-none ml-4 inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>

        {/* Right: Notifications + Avatar */}
        <div className="flex items-center gap-3">
          {/* Notification bell */}
          <button
            className="relative inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="size-5" />
            {notificationCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-[#1E3A5F] text-[10px] font-bold text-white">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </button>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-muted focus:outline-none">
              <Avatar size="sm">
                {userImage && <AvatarImage src={userImage} alt={userName || "User"} />}
                <AvatarFallback>{getInitials(userName)}</AvatarFallback>
              </Avatar>
              {userName && (
                <span className="hidden text-sm font-medium text-foreground md:inline-block">
                  {userName}
                </span>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{userName || "User"}</span>
                  {userEmail && (
                    <span className="text-xs text-muted-foreground">
                      {userEmail}
                    </span>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  render={<Link href="/profile" />}
                >
                  <User className="size-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  render={<Link href="/settings" />}
                >
                  <Settings className="size-4" />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onSignOut}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="size-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
