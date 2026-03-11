"use client"

import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, Users, MoreHorizontal } from "lucide-react"

interface Cohort {
  id: string
  name: string
  color: string
  memberCount: number
  description: string
  createdDate: string
  members: { initials: string }[]
}

const cohorts: Cohort[] = [
  {
    id: "1",
    name: "Class of 2026",
    color: "bg-blue-500",
    memberCount: 42,
    description: "Current seniors working on college and scholarship applications for the 2026-2027 academic year.",
    createdDate: "Aug 1, 2025",
    members: [{ initials: "MC" }, { initials: "JW" }, { initials: "CR" }, { initials: "PS" }],
  },
  {
    id: "2",
    name: "Class of 2027",
    color: "bg-purple-500",
    memberCount: 38,
    description: "Current juniors in the research and preparation phase. Focus on test prep and early scholarship identification.",
    createdDate: "Aug 1, 2025",
    members: [{ initials: "AP" }, { initials: "DT" }, { initials: "SR" }],
  },
  {
    id: "3",
    name: "STEM Scholars",
    color: "bg-green-500",
    memberCount: 15,
    description: "Students pursuing STEM-focused scholarships and programs. Cross-class cohort for specialized advising.",
    createdDate: "Sep 15, 2025",
    members: [{ initials: "MC" }, { initials: "LP" }, { initials: "EK" }],
  },
  {
    id: "4",
    name: "First-Gen College Students",
    color: "bg-amber-500",
    memberCount: 22,
    description: "Students who will be the first in their family to attend college. Additional support for financial aid navigation.",
    createdDate: "Sep 1, 2025",
    members: [{ initials: "CR" }, { initials: "MJ" }, { initials: "JW" }],
  },
]

export default function CohortsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Cohorts"
        description="Organize students into groups for targeted communication and task assignment."
        actions={
          <Button size="sm">
            <Plus className="size-3.5" /> Create Cohort
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {cohorts.map((cohort) => (
          <div key={cohort.id} className="rounded-xl bg-white p-5 ring-1 ring-foreground/10 transition-shadow hover:shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className={`size-3 rounded-full ${cohort.color}`} />
                <h3 className="text-sm font-semibold text-foreground">{cohort.name}</h3>
              </div>
              <Button variant="ghost" size="icon-xs"><MoreHorizontal className="size-3.5" /></Button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{cohort.description}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  {cohort.members.map((member, i) => (
                    <Avatar key={i} size="sm" className="ring-2 ring-white">
                      <AvatarFallback>{member.initials}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="size-3" /> {cohort.memberCount} members
                </span>
              </div>
              <span className="text-xs text-muted-foreground">Created {cohort.createdDate}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
