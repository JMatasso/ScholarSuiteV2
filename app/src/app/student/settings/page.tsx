"use client"

import { PageHeader } from "@/components/ui/page-header"
import { ProfileSettings } from "@/components/ui/profile-settings"

export default function StudentSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Manage your account and preferences."
      />
      <ProfileSettings />
    </div>
  )
}
