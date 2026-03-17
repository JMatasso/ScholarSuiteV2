"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  FileText, Plus, ChevronDown, ChevronUp, ChevronRight,
  Mail, Phone, Pencil, Trash2, ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Recommender {
  id: string; name: string; title: string | null; email: string | null
  phone: string | null; relationship: string | null; category: string
  status: string; requestedAt: string | null; dueDate: string | null
  receivedAt: string | null; notes: string | null; thankYouSent: boolean
  collegeApps: { collegeApp: { id: string; universityName: string } }[]
  scholarshipApps: { scholarshipApp: { scholarship: { id: string; name: string } } }[]
  createdAt: string
}

interface LinkedApp { id: string; label: string; type: "scholarship" | "college" }

const CATEGORIES = ["TEACHER","COUNSELOR","COACH","EMPLOYER","MENTOR","CLERGY","OTHER"] as const
const STATUSES = ["NOT_ASKED","REQUESTED","IN_PROGRESS","RECEIVED"] as const

const categoryLabel: Record<string, string> = {
  TEACHER: "Teacher", COUNSELOR: "Counselor", COACH: "Coach",
  EMPLOYER: "Employer", MENTOR: "Mentor", CLERGY: "Clergy", OTHER: "Other",
}
const statusLabel: Record<string, string> = {
  NOT_ASKED: "Not Asked", REQUESTED: "Requested",
  IN_PROGRESS: "In Progress", RECEIVED: "Received",
}
const statusColor: Record<string, string> = {
  NOT_ASKED: "bg-gray-100 text-gray-700 ring-gray-300",
  REQUESTED: "bg-amber-100 text-amber-700 ring-amber-300",
  IN_PROGRESS: "bg-blue-100 text-blue-700 ring-blue-300",
  RECEIVED: "bg-emerald-100 text-emerald-700 ring-emerald-300",
}
const dotColor: Record<string, string> = {
  RECEIVED: "bg-emerald-500", REQUESTED: "bg-blue-500",
  IN_PROGRESS: "bg-blue-500", NOT_ASKED: "bg-gray-400",
}

const emptyForm = {
  name: "", title: "", email: "", phone: "", category: "TEACHER",
  status: "NOT_ASKED", relationship: "", dueDate: "", notes: "",
  linkedAppIds: [] as string[],
}

export default function LettersPage() {
  const [recs, setRecs] = useState<Recommender[]>([])
  const [loading, setLoading] = useState(true)
  const [tipsOpen, setTipsOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [apps, setApps] = useState<LinkedApp[]>([])

  const fetchRecs = useCallback(async () => {
    try {
      const res = await fetch("/api/recommenders")
      if (res.ok) setRecs(await res.json())
    } catch { /* silent */ } finally { setLoading(false) }
  }, [])

  const fetchApps = useCallback(async () => {
    try {
      const [sRes, cRes] = await Promise.all([
        fetch("/api/applications"), fetch("/api/college-applications"),
      ])
      const list: LinkedApp[] = []
      if (sRes.ok) {
        const sa = await sRes.json()
        const items = Array.isArray(sa) ? sa : sa.applications ?? []
        items.forEach((a: any) =>
          list.push({ id: a.id, label: a.scholarship?.name ?? a.scholarshipName ?? "Scholarship App", type: "scholarship" }))
      }
      if (cRes.ok) {
        const ca = await cRes.json()
        const items = Array.isArray(ca) ? ca : ca.applications ?? []
        items.forEach((a: any) =>
          list.push({ id: a.id, label: a.universityName ?? "College App", type: "college" }))
      }
      setApps(list)
    } catch { /* silent */ }
  }, [])

  useEffect(() => { fetchRecs(); fetchApps() }, [fetchRecs, fetchApps])

  const openAdd = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true) }
  const openEdit = (r: Recommender) => {
    setEditId(r.id)
    const linked = [
      ...r.scholarshipApps.map(a => a.scholarshipApp.scholarship.id),
      ...r.collegeApps.map(a => a.collegeApp.id),
    ]
    setForm({
      name: r.name, title: r.title ?? "", email: r.email ?? "",
      phone: r.phone ?? "", category: r.category, status: r.status,
      relationship: r.relationship ?? "", dueDate: r.dueDate?.split("T")[0] ?? "",
      notes: r.notes ?? "", linkedAppIds: linked,
    })
    setDialogOpen(true)
  }

  const save = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return }
    setSaving(true)
    try {
      const body = { ...form, dueDate: form.dueDate || null }
      const res = editId
        ? await fetch(`/api/recommenders/${editId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch("/api/recommenders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error()
      toast.success(editId ? "Recommender updated" : "Recommender added")
      setDialogOpen(false); fetchRecs()
    } catch { toast.error("Failed to save") } finally { setSaving(false) }
  }

  const remove = async (id: string) => {
    try {
      const res = await fetch(`/api/recommenders/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Recommender removed"); fetchRecs()
    } catch { toast.error("Failed to delete") }
  }

  const quickStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/recommenders/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Marked as ${statusLabel[status]}`); fetchRecs()
    } catch { toast.error("Failed to update") }
  }

  const toggleThankYou = async (r: Recommender) => {
    try {
      const res = await fetch(`/api/recommenders/${r.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thankYouSent: !r.thankYouSent }),
      })
      if (!res.ok) throw new Error()
      toast.success(r.thankYouSent ? "Thank you unmarked" : "Thank you sent!")
      fetchRecs()
    } catch { toast.error("Failed to update") }
  }

  const counts = {
    total: recs.length,
    received: recs.filter(r => r.status === "RECEIVED").length,
    inProgress: recs.filter(r => r.status === "IN_PROGRESS" || r.status === "REQUESTED").length,
    notAsked: recs.filter(r => r.status === "NOT_ASKED").length,
  }

  const linkedCount = (r: Recommender) => r.collegeApps.length + r.scholarshipApps.length

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Letters of Recommendation"
        description="Track your recommendation letters and share your brag sheet."
        actions={
          <div className="flex flex-col sm:flex-row gap-2">
            <Link href="/student/resume">
              <Button variant="outline" className="w-full sm:w-auto">View Brag Sheet</Button>
            </Link>
            <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2" onClick={openAdd}>
              <Plus className="h-4 w-4" /> Add Recommender
            </Button>
          </div>
        }
      />

      {/* Tips card */}
      <Card>
        <button
          className="flex w-full items-center justify-between px-4 py-3 text-left"
          onClick={() => setTipsOpen(o => !o)}
        >
          <span className="text-sm font-semibold text-[#1E3A5F]">Tips for Recommendation Letters</span>
          {tipsOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
        {tipsOpen && (
          <CardContent className="pt-0 pb-4 space-y-1.5 text-sm text-muted-foreground">
            <ul className="list-disc pl-5 space-y-1">
              <li>Ask teachers who know you well, not just those who gave you the best grades.</li>
              <li>Ask 4-6 weeks before your earliest deadline.</li>
              <li>Provide your brag sheet so they can write a detailed letter.</li>
              <li>Send a thank-you note after the letter is submitted.</li>
              <li>Waive your right to view the letter &mdash; admissions committees prefer it.</li>
            </ul>
            <Link href="/student/learning/scholarships" className="inline-flex items-center gap-1 text-[#2563EB] hover:underline text-xs mt-2">
              Learn more about recommendations <ExternalLink className="h-3 w-3" />
            </Link>
          </CardContent>
        )}
      </Card>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
      ) : recs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No recommenders yet"
          description="Add your first recommender to start tracking letters."
          action={<Button className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2" onClick={openAdd}><Plus className="h-4 w-4" /> Add Recommender</Button>}
        />
      ) : (
        <>
          {/* Summary stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <span className="font-medium text-[#1A1A1A]">{counts.total} recommender{counts.total !== 1 ? "s" : ""}</span>
            <span className="flex items-center gap-1.5"><span className={cn("h-2 w-2 rounded-full", dotColor.RECEIVED)} />{counts.received} received</span>
            <span className="flex items-center gap-1.5"><span className={cn("h-2 w-2 rounded-full", dotColor.IN_PROGRESS)} />{counts.inProgress} in progress</span>
            <span className="flex items-center gap-1.5"><span className={cn("h-2 w-2 rounded-full", dotColor.NOT_ASKED)} />{counts.notAsked} not asked</span>
          </div>

          {/* Table */}
          <div className="rounded-lg border border-gray-200 bg-white overflow-x-auto">
            <div className="min-w-[650px]">
            <div className="hidden sm:grid grid-cols-[1fr_120px_80px_110px_100px_160px] gap-2 px-4 py-2 text-xs font-medium text-muted-foreground border-b bg-gray-50/60">
              <span>Writer</span><span>Category</span><span>For</span><span>Status</span><span>Due Date</span><span>Actions</span>
            </div>
            {recs.map(r => (
              <div key={r.id} className="border-b last:border-b-0">
                <div
                  className="grid sm:grid-cols-[1fr_120px_80px_110px_100px_160px] gap-2 px-4 py-3 items-center cursor-pointer hover:bg-gray-50/50 transition-colors min-w-[650px]"
                  onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                >
                  <div className="flex items-center gap-2">
                    <ChevronRight className={cn("h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform", expanded === r.id && "rotate-90")} />
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]">{r.name}</p>
                      {r.title && <p className="text-xs text-muted-foreground">{r.title}</p>}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{categoryLabel[r.category] ?? r.category}</span>
                  <span className="text-xs text-muted-foreground">{linkedCount(r)} app{linkedCount(r) !== 1 ? "s" : ""}</span>
                  <span className={cn("inline-flex h-5 w-fit items-center rounded-full px-2 text-[11px] font-medium ring-1 ring-inset", statusColor[r.status])}>
                    {statusLabel[r.status]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {r.dueDate ? new Date(r.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "\u2014"}
                  </span>
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    {r.status === "NOT_ASKED" && (
                      <Button size="xs" variant="outline" onClick={() => quickStatus(r.id, "REQUESTED")}>Requested</Button>
                    )}
                    {(r.status === "REQUESTED" || r.status === "IN_PROGRESS") && (
                      <Button size="xs" variant="outline" onClick={() => quickStatus(r.id, "RECEIVED")}>Received</Button>
                    )}
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon-sm" className="hover:text-rose-600" onClick={() => remove(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>

                {expanded === r.id && (
                  <div className="px-4 pb-4 pl-4 sm:pl-10 space-y-3 text-sm w-full">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {r.email && <div className="flex items-center gap-1.5 text-muted-foreground"><Mail className="h-3.5 w-3.5" />{r.email}</div>}
                      {r.phone && <div className="flex items-center gap-1.5 text-muted-foreground"><Phone className="h-3.5 w-3.5" />{r.phone}</div>}
                      {r.relationship && <div><span className="text-xs font-medium text-muted-foreground">Relationship:</span> <span className="text-xs">{r.relationship}</span></div>}
                    </div>
                    {r.notes && <p className="text-xs text-muted-foreground italic">{r.notes}</p>}
                    {(r.scholarshipApps.length > 0 || r.collegeApps.length > 0) && (
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">Linked applications:</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {r.scholarshipApps.map(a => (
                            <span key={a.scholarshipApp.scholarship.id} className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-blue-50 text-blue-700">{a.scholarshipApp.scholarship.name}</span>
                          ))}
                          {r.collegeApps.map(a => (
                            <span key={a.collegeApp.id} className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-purple-50 text-purple-700">{a.collegeApp.universityName}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Checkbox checked={r.thankYouSent} onCheckedChange={() => toggleThankYou(r)} />
                      <span className="text-xs text-muted-foreground">Thank-you note sent</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
            </div>
          </div>
        </>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Recommender" : "Add Recommender"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Name *</label>
                <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Dr. Jane Smith" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Title / Role</label>
                <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="AP English Teacher" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="jsmith@school.edu" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Phone</label>
                <Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="(555) 123-4567" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Category</label>
                <Select value={form.category} onValueChange={v => set("category", v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{categoryLabel[c]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <Select value={form.status} onValueChange={v => set("status", v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => <SelectItem key={s} value={s}>{statusLabel[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Relationship</label>
              <Textarea value={form.relationship} onChange={e => set("relationship", e.target.value)} placeholder="AP English teacher, taught me junior and senior year" rows={2} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Due Date</label>
              <Input type="date" value={form.dueDate} onChange={e => set("dueDate", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Notes</label>
              <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Please emphasize my leadership in debate club" rows={2} />
            </div>
            {apps.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Linked Applications</label>
                <div className="max-h-32 overflow-y-auto space-y-2 rounded-lg border border-gray-200 p-2">
                  {apps.map(a => (
                    <label key={a.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={form.linkedAppIds.includes(a.id)}
                        onCheckedChange={() =>
                          set("linkedAppIds", form.linkedAppIds.includes(a.id)
                            ? form.linkedAppIds.filter(x => x !== a.id)
                            : [...form.linkedAppIds, a.id])
                        }
                      />
                      <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium", a.type === "college" ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700")}>
                        {a.type === "college" ? "College" : "Scholarship"}
                      </span>
                      <span className="truncate">{a.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90" onClick={save} disabled={saving}>
              {saving ? "Saving..." : editId ? "Save Changes" : "Add Recommender"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
