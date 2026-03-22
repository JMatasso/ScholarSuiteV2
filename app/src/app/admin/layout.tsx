"use client"

import { RoleLayout } from "@/components/layout/role-layout"
import { adminNavGroups } from "@/lib/nav-config"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleLayout
      role="ADMIN"
      basePath="/admin"
      navGroups={adminNavGroups}
      showTopbarSearch
    >
      {children}
    </RoleLayout>
  )
}
