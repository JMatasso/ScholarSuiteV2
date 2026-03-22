"use client"

import { RoleLayout } from "@/components/layout/role-layout"
import { studentNavGroups } from "@/lib/nav-config"

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleLayout
      role="STUDENT"
      basePath="/student"
      navGroups={studentNavGroups}
      showProfileCompletion
      showChatWidget
      hideChatOnPaths={["/student/assistant"]}
    >
      {children}
    </RoleLayout>
  )
}
