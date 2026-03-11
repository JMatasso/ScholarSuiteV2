"use client"

import * as React from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, Mail, Phone, MoreHorizontal } from "lucide-react"
import { toast } from "sonner"

interface Prospect {
  id: string
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  source?: string | null
  serviceTier?: string | null
  stage: string
  createdAt: string
}

const stages = ["LEAD", "CONTACTED", "QUALIFIED", "ENROLLED", "LOST"] as const
const stageLabels: Record<string, string> = {
  LEAD: "Lead",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  ENROLLED: "Enrolled",
  LOST: "Lost",
}
const stageColors: Record<string, string> = {
  LEAD: "border-blue-200 bg-blue-50/50",
  CONTACTED: "border-amber-200 bg-amber-50/50",
  QUALIFIED: "border-purple-200 bg-purple-50/50",
  ENROLLED: "border-green-200 bg-green-50/50",
  LOST: "border-gray-200 bg-gray-50/50",
}
const stageHeaderColors: Record<string, string> = {
  LEAD: "text-blue-700",
  CONTACTED: "text-amber-700",
  QUALIFIED: "text-purple-700",
  ENROLLED: "text-green-700",
  LOST: "text-gray-500",
}
const tierBadgeColors: Record<string, string> = {
  Premium: "bg-purple-100 text-purple-700",
  Standard: "bg-blue-100 text-blue-700",
  Basic: "bg-gray-100 text-gray-600",
}

export default function CRMPage() {
  const [prospects, setProspects] = React.useState<Prospect[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showForm, setShowForm] = React.useState(false)
  const [form, setForm] = React.useState({
    firstName: "", lastName: "", email: "", phone: "",
    parentName: "", parentEmail: "", source: "", serviceTier: "", notes: ""
  })

  const loadProspects = React.useCallback(() => {
    fetch("/api/crm")
      .then(res => res.json())
      .then(d => { setProspects(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => { toast.error("Failed to load prospects"); setLoading(false) })
  }, [])

  React.useEffect(() => { loadProspects() }, [loadProspects])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success("Prospect added")
      setShowForm(false)
      setForm({ firstName: "", lastName: "", email: "", phone: "", parentName: "", parentEmail: "", source: "", serviceTier: "", notes: "" })
      loadProspects()
    } catch {
      toast.error("Failed to add prospect")
    }
  }

  const pipelineStats = stages.map(stage => ({
    stage,
    count: prospects.filter(p => p.stage === stage).length,
  }))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="CRM Pipeline"
        description="Track and manage your prospective client relationships."
        actions={
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="size-3.5" /> Add Prospect
          </Button>
        }
      />

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl bg-white p-5 ring-1 ring-foreground/10">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Add Prospect</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">First Name *</label>
              <input required type="text" value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Last Name *</label>
              <input required type="text" value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Phone</label>
              <input type="text" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Source</label>
              <select value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                <option value="">Select source</option>
                <option value="Website">Website</option>
                <option value="Referral">Referral</option>
                <option value="Social Media">Social Media</option>
                <option value="Event">Event</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Service Tier</label>
              <select value={form.serviceTier} onChange={e => setForm(p => ({ ...p, serviceTier: e.target.value }))}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                <option value="">Select tier</option>
                <option value="Basic">Basic</option>
                <option value="Standard">Standard</option>
                <option value="Premium">Premium</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm">Add Prospect</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {/* Pipeline Stats */}
      <div className="grid grid-cols-5 gap-3">
        {pipelineStats.map(({ stage, count }) => (
          <div key={stage} className="rounded-xl bg-white p-4 ring-1 ring-foreground/10 text-center">
            <p className={`text-xs font-medium uppercase tracking-wide ${stageHeaderColors[stage]}`}>{stageLabels[stage]}</p>
            <p className="text-2xl font-semibold text-foreground mt-1">{count}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">Loading prospects...</div>
      ) : (
        /* Kanban Board */
        <div className="grid grid-cols-5 gap-4">
          {stages.map((stage) => (
            <div key={stage} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className={`text-sm font-semibold ${stageHeaderColors[stage]}`}>{stageLabels[stage]}</h3>
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-muted text-[11px] font-medium text-muted-foreground">
                  {prospects.filter(p => p.stage === stage).length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {prospects
                  .filter(p => p.stage === stage)
                  .map((prospect) => {
                    const fullName = `${prospect.firstName} ${prospect.lastName}`
                    const initials = `${prospect.firstName[0] || ""}${prospect.lastName[0] || ""}`.toUpperCase()
                    return (
                      <div
                        key={prospect.id}
                        className={`rounded-lg border p-3 transition-shadow hover:shadow-sm ${stageColors[stage]}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Avatar size="sm">
                              <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium text-foreground">{fullName}</p>
                              <p className="text-[11px] text-muted-foreground">{prospect.email || "—"}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon-xs">
                            <MoreHorizontal className="size-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {prospect.serviceTier && (
                            <span className={`inline-flex h-4 items-center rounded-full px-1.5 text-[10px] font-medium ${tierBadgeColors[prospect.serviceTier] || "bg-gray-100 text-gray-600"}`}>
                              {prospect.serviceTier}
                            </span>
                          )}
                          {prospect.source && (
                            <span className="text-[10px] text-muted-foreground">{prospect.source}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          <Button variant="ghost" size="icon-xs"><Mail className="size-3" /></Button>
                          <Button variant="ghost" size="icon-xs"><Phone className="size-3" /></Button>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
