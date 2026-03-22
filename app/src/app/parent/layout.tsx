"use client"

import { RoleLayout } from "@/components/layout/role-layout"
import { parentNavGroups, parentBreadcrumbMap } from "@/lib/nav-config"

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleLayout
      role="PARENT"
      basePath="/parent"
      navGroups={parentNavGroups}
      showChatWidget
      breadcrumbMap={parentBreadcrumbMap}
    >
      {children}
    </RoleLayout>
  )
}
