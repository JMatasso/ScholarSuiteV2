"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, PanelLeftClose, PanelLeft, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

export interface SidebarItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}

interface SidebarProps {
  items?: SidebarItem[];
  groups?: SidebarGroup[];
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ items, groups, collapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();

  const allGroups: SidebarGroup[] = groups
    ? groups
    : items
      ? [{ title: "", items }]
      : [];

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-card transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-border px-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#1E3A5F] text-white">
          <GraduationCap className="size-5" />
        </div>
        {!collapsed && (
          <span className="text-lg font-semibold tracking-tight text-secondary-foreground">
            ScholarSuite
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <TooltipProvider>
          {allGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-4">
              {group.title && !collapsed && (
                <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {group.title}
                </p>
              )}
              {group.title && collapsed && groupIndex > 0 && (
                <Separator className="my-2" />
              )}
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;

                  const linkContent = (
                    <Link
                      href={item.href}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "border-l-2 border-[#1E3A5F] bg-accent text-secondary-foreground"
                          : "border-l-2 border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
                        collapsed && "justify-center px-2"
                      )}
                    >
                      <Icon className={cn("size-5 shrink-0", isActive && "text-secondary-foreground")} />
                      {!collapsed && (
                        <>
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <span className="ml-auto inline-flex size-5 items-center justify-center rounded-full bg-[#1E3A5F] text-[10px] font-semibold text-white">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  );

                  if (collapsed) {
                    return (
                      <li key={item.href}>
                        <Tooltip>
                          <TooltipTrigger render={linkContent} />
                          <TooltipContent side="right" sideOffset={8}>
                            {item.label}
                            {item.badge && (
                              <span className="ml-1.5 inline-flex size-4 items-center justify-center rounded-full bg-[#1E3A5F] text-[10px] font-semibold text-white">
                                {item.badge}
                              </span>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </li>
                    );
                  }

                  return <li key={item.href}>{linkContent}</li>;
                })}
              </ul>
            </div>
          ))}
        </TooltipProvider>
      </nav>

      {/* Collapse toggle */}
      <div className="shrink-0 border-t border-border p-3">
        <button
          onClick={onToggleCollapse}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            collapsed && "justify-center px-2"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeft className="size-5" />
          ) : (
            <>
              <PanelLeftClose className="size-5" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
