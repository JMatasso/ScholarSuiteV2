"use client"

import { useState, useEffect, useCallback } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchInput } from "@/components/ui/search-input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import LoaderOne from "@/components/ui/loader-one"
import { cn } from "@/lib/utils"
import {
  Plus, RefreshCw, Check, X, Pencil, Trash2, Loader2, ChevronDown,
  MapPin, DollarSign, Calendar, Building2, AlertTriangle, CheckCircle, Clock, Users,
} from "lucide-react"
import { StatCard } from "@/components/ui/stat-card"

interface Provider { id: string; name: string; type: string; county: string | null; state: string | null }

interface LocalScholarship {
  id: string; name: string; provider: string | null; amount: number | null
  amountMax: number | null; deadline: string | null; description: string | null
  url: string | null; isActive: boolean; county: string | null; source: string
  cycleStatus: string | null; cycleYear: string | null; autoMatch: boolean
  providerOrg: Provider | null; _count: { applications: number }; createdAt: string
}

type CycleStatus = "ALL" | "CONFIRMED" | "PENDING_CONFIRMATION" | "NOT_RENEWED" | "UNKNOWN"
type Tab = "active" | "pending"

const CYCLE_COLORS: Record<string, { dot: string; badge: string; label: string }> = {
  CONFIRMED: { dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "Confirmed" },
  PENDING_CONFIRMATION: { dot: "bg-amber-500", badge: "bg-amber-100 text-amber-700 border-amber-200", label: "Pending" },
  NOT_RENEWED: { dot: "bg-rose-500", badge: "bg-rose-100 text-rose-700 border-rose-200", label: "Not Renewed" },
  UNKNOWN: { dot: "bg-muted-foreground", badge: "bg-muted text-muted-foreground border-border", label: "Unknown" },
}

const COUNTIES = [
  "All Counties", "Los Angeles", "Orange", "San Diego", "San Bernardino", "Riverside",
  "Santa Clara", "Alameda", "Sacramento", "San Francisco", "Fresno",
]

const emptyForm = {
  name: "", providerId: "", providerName: "", amount: "", amountMax: "",
  deadline: "", description: "", url: "", county: "", state: "",
  isRecurring: false, autoMatch: true,
}

export default function LocalScholarshipsPage() {
  const [scholarships, setScholarships] = useState<LocalScholarship[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [county, setCounty] = useState("All Counties")
  const [cycleFilter, setCycleFilter] = useState<CycleStatus>("ALL")
  const [tab, setTab] = useState<Tab>("active")
  const [addOpen, setAddOpen] = useState(false)
  const [cycleOpen, setCycleOpen] = useState(false)
  const [cycleYear, setCycleYear] = useState("2027-2028")
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ source: "LOCAL" })
      if (county !== "All Counties") params.set("county", county)
      if (cycleFilter !== "ALL") params.set("cycleStatus", cycleFilter)
      if (search) params.set("search", search)
      if (tab === "pending") params.set("pending", "true")
      const res = await fetch(`/api/scholarships/local?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setScholarships(Array.isArray(data) ? data : data.scholarships ?? [])
    } catch { toast.error("Failed to load scholarships") }
    setLoading(false)
  }, [county, cycleFilter, search, tab])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => {
    fetch("/api/providers").then(r => r.json()).then(d => setProviders(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [])

  const counts = {
    CONFIRMED: scholarships.filter(s => s.cycleStatus === "CONFIRMED").length,
    PENDING_CONFIRMATION: scholarships.filter(s => s.cycleStatus === "PENDING_CONFIRMATION").length,
    NOT_RENEWED: scholarships.filter(s => s.cycleStatus === "NOT_RENEWED").length,
    UNKNOWN: scholarships.filter(s => !s.cycleStatus || s.cycleStatus === "UNKNOWN").length,
  }

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error("Name is required")
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        name: form.name, source: "LOCAL", county: form.county || null,
        amount: form.amount ? parseFloat(form.amount) : null,
        amountMax: form.amountMax ? parseFloat(form.amountMax) : null,
        deadline: form.deadline || null, description: form.description || null,
        url: form.url || null, state: form.state || null, autoMatch: form.autoMatch,
        isRecurring: form.isRecurring,
      }
      if (form.providerId) body.providerId = form.providerId
      else if (form.providerName) body.providerName = form.providerName

      const method = editId ? "PATCH" : "POST"
      const url = editId ? `/api/scholarships/${editId}` : "/api/scholarships"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error()
      toast.success(editId ? "Scholarship updated" : "Scholarship created")
      setAddOpen(false); setEditId(null); setForm(emptyForm); fetchData()
    } catch { toast.error("Failed to save") }
    setSaving(false)
  }

  const handleConfirm = async (id: string) => {
    try {
      const res = await fetch("/api/scholarships/local/confirm", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scholarshipId: id }),
      })
      if (!res.ok) throw new Error()
      toast.success("Confirmed for current cycle")
      fetchData()
    } catch { toast.error("Failed to confirm") }
  }

  const handleNotRenewed = async (id: string) => {
    try {
      const res = await fetch(`/api/scholarships/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycleStatus: "NOT_RENEWED" }),
      })
      if (!res.ok) throw new Error()
      toast.success("Marked as not renewed"); fetchData()
    } catch { toast.error("Failed to update") }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this scholarship?")) return
    try {
      const res = await fetch(`/api/scholarships/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Deleted"); fetchData()
    } catch { toast.error("Failed to delete") }
  }

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/scholarships/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true, cycleStatus: "CONFIRMED" }),
      })
      if (!res.ok) throw new Error()
      toast.success("Approved and confirmed"); fetchData()
    } catch { toast.error("Failed to approve") }
  }

  const handleRollover = async () => {
    if (!cycleYear.trim()) return toast.error("Cycle year required")
    setSaving(true)
    try {
      const res = await fetch("/api/scholarships/local/rollover", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycleYear }),
      })
      if (!res.ok) throw new Error()
      toast.success("New cycle started"); setCycleOpen(false); fetchData()
    } catch { toast.error("Failed to start cycle") }
    setSaving(false)
  }

  const openEdit = (s: LocalScholarship) => {
    setEditId(s.id)
    setForm({
      name: s.name, providerId: s.providerOrg?.id ?? "", providerName: s.providerOrg?.name ?? s.provider ?? "",
      amount: s.amount?.toString() ?? "", amountMax: s.amountMax?.toString() ?? "",
      deadline: s.deadline?.slice(0, 10) ?? "", description: s.description ?? "",
      url: s.url ?? "", county: s.county ?? "", state: s.providerOrg?.state ?? "",
      isRecurring: false, autoMatch: s.autoMatch,
    })
    setAddOpen(true)
  }

  const fmtAmount = (s: LocalScholarship) => {
    if (!s.amount) return "--"
    const a = `$${s.amount.toLocaleString()}`
    return s.amountMax && s.amountMax !== s.amount ? `${a} - $${s.amountMax.toLocaleString()}` : a
  }

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "--"

  return (
    <div className="space-y-6">
      <PageHeader
        title="Local Scholarships"
        description="Manage county-level scholarship partnerships."
        actions={
          <>
            <Button variant="outline" className="gap-2" onClick={() => setCycleOpen(true)}>
              <RefreshCw className="h-4 w-4" /> Start New Cycle
            </Button>
            <Button className="gap-2" onClick={() => { setEditId(null); setForm(emptyForm); setAddOpen(true) }}>
              <Plus className="h-4 w-4" /> Add Local Scholarship
            </Button>
          </>
        }
      />

      {!loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Local" value={scholarships.length} icon={MapPin} index={0} />
          <StatCard title="Confirmed" value={counts.CONFIRMED} description={`${counts.PENDING_CONFIRMATION} pending`} icon={CheckCircle} index={1} />
          <StatCard title="Total Value" value={`$${scholarships.reduce((s, x) => s + (x.amount || 0), 0).toLocaleString()}`} icon={DollarSign} index={2} />
          <StatCard title="Students Matched" value={scholarships.reduce((s, x) => s + (x._count?.applications || 0), 0)} description="auto-matched applications" icon={Users} index={3} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <select
            value={county}
            onChange={e => setCounty(e.target.value)}
            className="h-8 rounded-lg border border-border bg-card pl-8 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] appearance-none"
          >
            {COUNTIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <MapPin className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>
        <SearchInput value={search} onValueChange={setSearch} placeholder="Search scholarships..." className="w-64" />
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-0.5">
          {(["ALL", "CONFIRMED", "PENDING_CONFIRMATION", "NOT_RENEWED", "UNKNOWN"] as CycleStatus[]).map(s => (
            <button
              key={s}
              onClick={() => setCycleFilter(s)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                cycleFilter === s ? "bg-[#1E3A5F] text-white" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s === "ALL" ? "All" : CYCLE_COLORS[s]?.label ?? s}
            </button>
          ))}
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-6 rounded-lg border border-border bg-card px-4 py-2.5 text-sm">
        {Object.entries(counts).map(([key, val]) => (
          <span key={key} className="flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full", CYCLE_COLORS[key]?.dot ?? "bg-muted-foreground")} />
            <span className="font-medium">{val}</span>
            <span className="text-muted-foreground">{CYCLE_COLORS[key]?.label ?? key}</span>
          </span>
        ))}
      </div>

      {/* Tab toggle */}
      <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-0.5 w-fit">
        {([["active", "Active Scholarships"], ["pending", "Pending Submissions"]] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              tab === t ? "bg-[#1E3A5F] text-white" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr_0.5fr_auto] gap-2 border-b border-border bg-muted/50/60 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide min-w-[800px]">
          <span>Name</span><span>Provider</span><span>County</span><span>Amount</span>
          <span>Deadline</span><span>Cycle Status</span><span className="text-center">Apps</span><span>Actions</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16"><LoaderOne /></div>
        ) : scholarships.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Building2 className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">No local scholarships found.</p>
          </div>
        ) : (
          scholarships.map(s => (
            <div key={s.id} className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr_0.5fr_auto] gap-2 items-center border-b border-border px-4 py-2.5 text-sm hover:bg-muted/50/50 transition-colors min-w-[800px]">
              <span className="font-medium text-foreground truncate">{s.name}</span>
              <span className="text-muted-foreground truncate">{s.providerOrg?.name ?? s.provider ?? "--"}</span>
              <span className="text-muted-foreground">{s.county ?? "--"}</span>
              <span className="font-medium">{fmtAmount(s)}</span>
              <span className="text-muted-foreground">{fmtDate(s.deadline)}</span>
              <span>
                {s.cycleStatus && CYCLE_COLORS[s.cycleStatus] ? (
                  <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium", CYCLE_COLORS[s.cycleStatus].badge)}>
                    {CYCLE_COLORS[s.cycleStatus].label}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium bg-muted text-muted-foreground border-border">Unknown</span>
                )}
              </span>
              <span className="text-center text-muted-foreground">{s._count?.applications ?? 0}</span>
              <div className="flex items-center gap-0.5">
                {tab === "pending" ? (
                  <>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleApprove(s.id)} title="Approve">
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(s.id)} title="Reject">
                      <X className="h-3.5 w-3.5 text-rose-600" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleConfirm(s.id)} title="Confirm">
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleNotRenewed(s.id)} title="Not renewed">
                      <X className="h-3.5 w-3.5 text-rose-600" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(s)} title="Edit">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(s.id)} title="Delete">
                      <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={addOpen} onOpenChange={o => { if (!o) { setAddOpen(false); setEditId(null) } }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Local Scholarship" : "Add Local Scholarship"}</DialogTitle>
            <DialogDescription>{editId ? "Update this scholarship's details." : "Create a new local scholarship entry."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-1">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Provider</label>
              <div className="relative">
                <select
                  value={form.providerId}
                  onChange={e => {
                    const p = providers.find(p => p.id === e.target.value)
                    setForm(f => ({ ...f, providerId: e.target.value, providerName: p?.name ?? "", county: p?.county ?? f.county, state: p?.state ?? f.state }))
                  }}
                  className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] appearance-none"
                >
                  <option value="">-- Select or type below --</option>
                  {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>
              {!form.providerId && (
                <Input placeholder="Or type new provider name" value={form.providerName} onChange={e => setForm(f => ({ ...f, providerName: e.target.value }))} />
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Name *</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Scholarship name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Amount</label>
                <Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="Min amount" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Amount Max</label>
                <Input type="number" value={form.amountMax} onChange={e => setForm(f => ({ ...f, amountMax: e.target.value }))} placeholder="Max amount" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Deadline</label>
              <Input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Description</label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Brief description..." />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Application URL</label>
              <Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">County</label>
                <Input value={form.county} onChange={e => setForm(f => ({ ...f, county: e.target.value }))} placeholder="County" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">State</label>
                <Input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} placeholder="State" />
              </div>
            </div>
            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={form.isRecurring} onCheckedChange={v => setForm(f => ({ ...f, isRecurring: !!v }))} />
                Is Recurring
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={form.autoMatch} onCheckedChange={v => setForm(f => ({ ...f, autoMatch: !!v }))} />
                Auto Match
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddOpen(false); setEditId(null) }}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {editId ? "Save Changes" : "Create Scholarship"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Start New Cycle Dialog */}
      <Dialog open={cycleOpen} onOpenChange={setCycleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start New Cycle</DialogTitle>
            <DialogDescription>Roll over confirmed scholarships to begin a new application cycle.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Cycle Year</label>
              <Input value={cycleYear} onChange={e => setCycleYear(e.target.value)} placeholder="e.g. 2027-2028" />
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/30 p-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800">This will move all <strong>Confirmed</strong> scholarships to <strong>Pending Confirmation</strong> for the new cycle year.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCycleOpen(false)}>Cancel</Button>
            <Button onClick={handleRollover} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Start Cycle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
