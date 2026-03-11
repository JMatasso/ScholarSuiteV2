"use client"

import * as React from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, Mail, Phone, MoreHorizontal } from "lucide-react"

interface Prospect {
  id: string
  name: string
  email: string
  phone: string
  source: string
  tier: string
  stage: string
  initials: string
  createdDate: string
}

const prospects: Prospect[] = [
  { id: "1", name: "Olivia Martinez", email: "olivia.m@email.com", phone: "(555) 111-2233", source: "Website", tier: "Premium", stage: "Lead", initials: "OM", createdDate: "Mar 8, 2026" },
  { id: "2", name: "Tyler Brooks", email: "tyler.b@email.com", phone: "(555) 222-3344", source: "Referral", tier: "Standard", stage: "Contacted", initials: "TB", createdDate: "Mar 6, 2026" },
  { id: "3", name: "Emma Watson", email: "emma.w@email.com", phone: "(555) 333-4455", source: "Social Media", tier: "Premium", stage: "Qualified", initials: "EW", createdDate: "Mar 3, 2026" },
  { id: "4", name: "Noah Kim", email: "noah.k@email.com", phone: "(555) 444-5566", source: "Event", tier: "Standard", stage: "Lead", initials: "NK", createdDate: "Mar 7, 2026" },
  { id: "5", name: "Ava Johnson", email: "ava.j@email.com", phone: "(555) 555-6677", source: "Referral", tier: "Premium", stage: "Enrolled", initials: "AJ", createdDate: "Feb 28, 2026" },
  { id: "6", name: "Liam Nguyen", email: "liam.n@email.com", phone: "(555) 666-7788", source: "Website", tier: "Basic", stage: "Contacted", initials: "LN", createdDate: "Mar 5, 2026" },
  { id: "7", name: "Isabella Chen", email: "isabella.c@email.com", phone: "(555) 777-8899", source: "Event", tier: "Premium", stage: "Qualified", initials: "IC", createdDate: "Mar 1, 2026" },
  { id: "8", name: "Mason Davis", email: "mason.d@email.com", phone: "(555) 888-9900", source: "Website", tier: "Standard", stage: "Lost", initials: "MD", createdDate: "Feb 20, 2026" },
  { id: "9", name: "Sophia Patel", email: "sophia.p@email.com", phone: "(555) 999-0011", source: "Referral", tier: "Premium", stage: "Lead", initials: "SP", createdDate: "Mar 9, 2026" },
  { id: "10", name: "James Wright", email: "james.w@email.com", phone: "(555) 000-1122", source: "Social Media", tier: "Basic", stage: "Lost", initials: "JW", createdDate: "Feb 15, 2026" },
]

const stages = ["Lead", "Contacted", "Qualified", "Enrolled", "Lost"] as const
const stageColors: Record<string, string> = {
  Lead: "border-blue-200 bg-blue-50/50",
  Contacted: "border-amber-200 bg-amber-50/50",
  Qualified: "border-purple-200 bg-purple-50/50",
  Enrolled: "border-green-200 bg-green-50/50",
  Lost: "border-gray-200 bg-gray-50/50",
}
const stageHeaderColors: Record<string, string> = {
  Lead: "text-blue-700",
  Contacted: "text-amber-700",
  Qualified: "text-purple-700",
  Enrolled: "text-green-700",
  Lost: "text-gray-500",
}
const tierBadgeColors: Record<string, string> = {
  Premium: "bg-purple-100 text-purple-700",
  Standard: "bg-blue-100 text-blue-700",
  Basic: "bg-gray-100 text-gray-600",
}

export default function CRMPage() {
  const pipelineStats = stages.map((stage) => ({
    stage,
    count: prospects.filter((p) => p.stage === stage).length,
  }))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="CRM Pipeline"
        description="Track and manage your prospective client relationships."
        actions={
          <Button size="sm">
            <Plus className="size-3.5" /> Add Prospect
          </Button>
        }
      />

      {/* Pipeline Stats */}
      <div className="grid grid-cols-5 gap-3">
        {pipelineStats.map(({ stage, count }) => (
          <div key={stage} className="rounded-xl bg-white p-4 ring-1 ring-foreground/10 text-center">
            <p className={`text-xs font-medium uppercase tracking-wide ${stageHeaderColors[stage]}`}>{stage}</p>
            <p className="text-2xl font-semibold text-foreground mt-1">{count}</p>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-5 gap-4">
        {stages.map((stage) => (
          <div key={stage} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-semibold ${stageHeaderColors[stage]}`}>{stage}</h3>
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-muted text-[11px] font-medium text-muted-foreground">
                {prospects.filter((p) => p.stage === stage).length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {prospects
                .filter((p) => p.stage === stage)
                .map((prospect) => (
                  <div
                    key={prospect.id}
                    className={`rounded-lg border p-3 transition-shadow hover:shadow-sm ${stageColors[stage]}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar size="sm">
                          <AvatarFallback>{prospect.initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-foreground">{prospect.name}</p>
                          <p className="text-[11px] text-muted-foreground">{prospect.email}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon-xs">
                        <MoreHorizontal className="size-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`inline-flex h-4 items-center rounded-full px-1.5 text-[10px] font-medium ${tierBadgeColors[prospect.tier]}`}>
                        {prospect.tier}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{prospect.source}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <Button variant="ghost" size="icon-xs"><Mail className="size-3" /></Button>
                      <Button variant="ghost" size="icon-xs"><Phone className="size-3" /></Button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
