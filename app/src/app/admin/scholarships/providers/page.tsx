"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchInput } from "@/components/ui/search-input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import LoaderOne from "@/components/ui/loader-one"
import {
  Plus, Pencil, Trash2, ChevronDown, ChevronUp, Building2, Users,
  UserPlus, UserMinus, Loader2, Globe, Mail, Phone, User,
} from "lucide-react"

interface Provider {
  id: string
  name: string
  type: string
  county: string | null
  state: string | null
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  website: string | null
  notes: string | null
  status: string
  lastContactedAt: string | null
  _count: { scholarships: number }
  createdAt: string
  updatedAt: string
}

const TYPE_LABELS: Record<string, string> = {
  FOUNDATION: "Foundation",
  COMMUNITY_ORG: "Community Org",
  BUSINESS: "Business",
  GOVERNMENT: "Government",
  SCHOOL_DISTRICT: "School District",
  FAITH_BASED: "Faith-Based",
  CIVIC_GROUP: "Civic Group",
  MEMORIAL: "Memorial",
  OTHER: "Other",
}

const STATUS_OPTIONS = ["PROSPECT", "ACTIVE", "INACTIVE"] as const
const TYPE_OPTIONS = Object.keys(TYPE_LABELS)

const emptyForm = {
  name: "", type: "FOUNDATION", county: "", state: "", contactName: "",
  contactEmail: "", contactPhone: "", website: "", notes: "", status: "PROSPECT",
}

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [countyFilter, setCountyFilter] = useState("")
  const [stateFilter, setStateFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchProviders = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (countyFilter) params.set("county", countyFilter)
      if (stateFilter) params.set("state", stateFilter)
      if (statusFilter !== "ALL") params.set("status", statusFilter)
      const res = await fetch(`/api/providers?${params}`)
      if (!res.ok) throw new Error("Failed to fetch")
      setProviders(await res.json())
    } catch {
      toast.error("Failed to load providers")
    } finally {
      setLoading(false)
    }
  }, [search, countyFilter, stateFilter, statusFilter])

  useEffect(() => { fetchProviders() }, [fetchProviders])

  const stats = {
    total: providers.length,
    active: providers.filter(p => p.status === "ACTIVE").length,
    prospect: providers.filter(p => p.status === "PROSPECT").length,
    inactive: providers.filter(p => p.status === "INACTIVE").length,
  }

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true) }
  const openEdit = (p: Provider) => {
    setEditingId(p.id)
    setForm({
      name: p.name, type: p.type, county: p.county ?? "", state: p.state ?? "",
      contactName: p.contactName ?? "", contactEmail: p.contactEmail ?? "",
      contactPhone: p.contactPhone ?? "", website: p.website ?? "",
      notes: p.notes ?? "", status: p.status,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return }
    setSaving(true)
    try {
      const url = editingId ? `/api/providers/${editingId}` : "/api/providers"
      const method = editingId ? "PATCH" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      if (!res.ok) throw new Error("Save failed")
      toast.success(editingId ? "Provider updated" : "Provider created")
      setDialogOpen(false)
      fetchProviders()
    } catch { toast.error("Failed to save provider") }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this provider?")) return
    try {
      const res = await fetch(`/api/providers/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
      toast.success("Provider deleted")
      fetchProviders()
    } catch { toast.error("Failed to delete provider") }
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      PROSPECT: "bg-amber-100 text-amber-700 border-amber-200",
      ACTIVE: "bg-emerald-100 text-emerald-700 border-emerald-200",
      INACTIVE: "bg-gray-100 text-gray-600 border-gray-200",
    }
    return (
      <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium", map[status] ?? map.INACTIVE)}>
        {status}
      </span>
    )
  }

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Providers"
        description="Manage local scholarship provider organizations."
        actions={
          <Button className="gap-2" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add Provider
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onValueChange={setSearch} placeholder="Search providers..." className="w-64" />
        <Input placeholder="County" value={countyFilter} onChange={e => setCountyFilter(e.target.value)} className="h-8 w-36" />
        <Input placeholder="State" value={stateFilter} onChange={e => setStateFilter(e.target.value)} className="h-8 w-36" />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="ALL">All Status</option>
          <option value="PROSPECT">Prospect</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Providers", value: stats.total, icon: Building2, color: "text-[#1E3A5F]" },
          { label: "Active", value: stats.active, icon: Users, color: "text-emerald-600" },
          { label: "Prospect", value: stats.prospect, icon: UserPlus, color: "text-amber-600" },
          { label: "Inactive", value: stats.inactive, icon: UserMinus, color: "text-gray-500" },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-3 rounded-xl border bg-white p-4">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-[#1E3A5F]/10", s.color)}>
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-semibold text-[#1E3A5F]">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <LoaderOne />
        </div>
      ) : providers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Building2 className="h-8 w-8 mb-2 opacity-40" />
          <p className="text-sm">No providers found.</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white overflow-x-auto">
          <div className="grid grid-cols-[2fr_1fr_1.2fr_0.8fr_0.8fr_1fr_0.6fr] gap-2 border-b bg-gray-50/80 px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide min-w-[700px]">
            <span>Name</span><span>Type</span><span>County / State</span><span>Scholarships</span><span>Status</span><span>Last Contacted</span><span className="text-right">Actions</span>
          </div>
          <AnimatePresence initial={false}>
            {providers.map(p => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
              >
                <div
                  className="grid grid-cols-[2fr_1fr_1.2fr_0.8fr_0.8fr_1fr_0.6fr] gap-2 items-center border-b px-4 py-3 text-sm hover:bg-gray-50/50 cursor-pointer transition-colors min-w-[700px]"
                  onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                >
                  <span className="font-medium text-[#1E3A5F] flex items-center gap-1.5">
                    {expandedId === p.id ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                    {p.name}
                  </span>
                  <span className="text-muted-foreground">{TYPE_LABELS[p.type] ?? p.type}</span>
                  <span className="text-muted-foreground">{[p.county, p.state].filter(Boolean).join(", ") || "—"}</span>
                  <span>{p._count.scholarships}</span>
                  <span>{statusBadge(p.status)}</span>
                  <span className="text-muted-foreground text-xs">
                    {p.lastContactedAt ? new Date(p.lastContactedAt).toLocaleDateString() : "—"}
                  </span>
                  <span className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon-sm" className="hover:text-rose-600" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4" /></Button>
                  </span>
                </div>
                <AnimatePresence>
                  {expandedId === p.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                      className="border-b bg-gray-50/30 px-4 py-3"
                    >
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                        {p.contactName && <div className="flex items-center gap-2 text-muted-foreground"><User className="h-4 w-4" /> {p.contactName}</div>}
                        {p.contactEmail && <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" /> <a href={`mailto:${p.contactEmail}`} className="text-[#2563EB] hover:underline">{p.contactEmail}</a></div>}
                        {p.contactPhone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" /> {p.contactPhone}</div>}
                        {p.website && <div className="flex items-center gap-2 text-muted-foreground"><Globe className="h-4 w-4" /> <a href={p.website} target="_blank" rel="noopener noreferrer" className="text-[#2563EB] hover:underline truncate">{p.website}</a></div>}
                      </div>
                      {p.notes && <p className="mt-2 text-xs text-muted-foreground">{p.notes}</p>}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Provider" : "Add Provider"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Name *</label>
                <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Organization name" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Type</label>
                <select value={form.type} onChange={e => set("type", e.target.value)} className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                  {TYPE_OPTIONS.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">County</label>
                <Input value={form.county} onChange={e => set("county", e.target.value)} placeholder="e.g. Los Angeles" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">State</label>
                <Input value={form.state} onChange={e => set("state", e.target.value)} placeholder="e.g. CA" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Contact Name</label>
                <Input value={form.contactName} onChange={e => set("contactName", e.target.value)} placeholder="John Doe" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <Input value={form.contactEmail} onChange={e => set("contactEmail", e.target.value)} placeholder="john@example.com" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Phone</label>
                <Input value={form.contactPhone} onChange={e => set("contactPhone", e.target.value)} placeholder="(555) 123-4567" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Website</label>
                <Input value={form.website} onChange={e => set("website", e.target.value)} placeholder="https://..." />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)} className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Notes</label>
              <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Internal notes about this provider..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {editingId ? "Save Changes" : "Create Provider"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
