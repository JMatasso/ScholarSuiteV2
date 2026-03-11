"use client"

import * as React from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Plus, Pin, Clock, Users, UserPlus, Shield } from "lucide-react"

interface Announcement {
  id: string
  title: string
  body: string
  targetRole: string
  targetIcon: React.ElementType
  status: "Active" | "Expired" | "Pinned"
  createdDate: string
  author: string
}

const announcements: Announcement[] = [
  {
    id: "1",
    title: "FAFSA Deadline Reminder",
    body: "The priority FAFSA deadline is March 15, 2026. Please ensure all financial aid documents are submitted before this date.",
    targetRole: "Students",
    targetIcon: Users,
    status: "Pinned",
    createdDate: "Mar 1, 2026",
    author: "Admin",
  },
  {
    id: "2",
    title: "New Scholarship Added: Cameron Impact",
    body: "We have added the Cameron Impact Scholarship to our database. Deadline is September 14. This is a great fit for students with strong leadership profiles.",
    targetRole: "Students",
    targetIcon: Users,
    status: "Active",
    createdDate: "Mar 5, 2026",
    author: "Admin",
  },
  {
    id: "3",
    title: "Parent Meeting Scheduled",
    body: "Our quarterly parent information session is scheduled for March 20 at 6:00 PM via Zoom. Topics: financial aid strategy and summer program planning.",
    targetRole: "Parents",
    targetIcon: UserPlus,
    status: "Active",
    createdDate: "Mar 8, 2026",
    author: "Admin",
  },
  {
    id: "4",
    title: "System Maintenance Notice",
    body: "ScholarSuite will undergo scheduled maintenance on Saturday, March 15 from 2:00 AM to 4:00 AM EST. The platform may be briefly unavailable.",
    targetRole: "All Users",
    targetIcon: Shield,
    status: "Active",
    createdDate: "Mar 10, 2026",
    author: "System",
  },
  {
    id: "5",
    title: "Holiday Break Schedule",
    body: "The office will be closed December 23 through January 2 for the holiday break. All consultations will resume January 3.",
    targetRole: "All Users",
    targetIcon: Shield,
    status: "Expired",
    createdDate: "Dec 15, 2025",
    author: "Admin",
  },
]

const statusConfig: Record<string, { bg: string; text: string; icon?: React.ElementType }> = {
  Active: { bg: "bg-green-50 ring-green-300", text: "text-green-700" },
  Expired: { bg: "bg-gray-100 ring-gray-300", text: "text-gray-600" },
  Pinned: { bg: "bg-blue-50 ring-blue-300", text: "text-blue-700", icon: Pin },
}

export default function AnnouncementsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Announcements"
        description="Create and manage announcements for students and parents."
        actions={
          <Button size="sm">
            <Plus className="size-3.5" /> New Announcement
          </Button>
        }
      />

      <div className="flex flex-col gap-4">
        {announcements.map((ann) => {
          const sc = statusConfig[ann.status]
          const TargetIcon = ann.targetIcon
          return (
            <div key={ann.id} className="rounded-xl bg-white p-5 ring-1 ring-foreground/10 transition-shadow hover:shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-foreground">{ann.title}</h3>
                    <span className={`inline-flex h-5 items-center gap-1 rounded-full px-2 text-xs font-medium ring-1 ring-inset ${sc.bg} ${sc.text}`}>
                      {sc.icon && <Pin className="size-3" />}
                      {ann.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{ann.body}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <TargetIcon className="size-3" /> {ann.targetRole}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" /> {ann.createdDate}
                    </span>
                    <span>By {ann.author}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm">Edit</Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
