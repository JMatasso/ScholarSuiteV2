"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { toast } from "sonner"
import { School, Plus, Search, MapPin, Users, Download, Trash2, GraduationCap, Pencil, Loader2, Check } from "lucide-react"
import LoaderOne from "@/components/ui/loader-one"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { ActionMenu } from "@/components/ui/action-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
]

interface SchoolRecord {
  id: string; name: string; address: string; city: string; state: string; zipCode: string
  phone: string; email: string; website: string; logoUrl: string | null; joinCode: string
  ncesId: string | null; createdAt: string; _count: { students: number }
}

interface NcesResult {
  ncesId: string; name: string; address: string; city: string; state: string; zipCode: string
}

export default function AdminSchoolsPage() {
  const router = useRouter()
  const [mySchools, setMySchools] = useState<SchoolRecord[]>([])
  const [searchResults, setSearchResults] = useState<SchoolRecord[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [searching, setSearching] = useState(false)

  // Add School dialog
  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState({ name: "", address: "", city: "", state: "", zipCode: "", phone: "", email: "", website: "" })
  const [addLoading, setAddLoading] = useState(false)

  // NCES Import dialog
  const [ncesOpen, setNcesOpen] = useState(false)
  const [ncesState, setNcesState] = useState("")
  const [ncesSearch, setNcesSearch] = useState("")
  const [ncesResults, setNcesResults] = useState<NcesResult[]>([])
  const [ncesSelected, setNcesSelected] = useState<Set<string>>(new Set())
  const [ncesLoading, setNcesLoading] = useState(false)
  const [ncesImporting, setNcesImporting] = useState(false)
  const [ncesSearched, setNcesSearched] = useState(false)

  // Load schools with students (default view)
  const fetchMySchools = useCallback(() => {
    fetch("/api/schools").then(r => r.json()).then(data => {
      setMySchools(Array.isArray(data) ? data : [])
      setLoading(false)
    }).catch(() => { setLoading(false) })
  }, [])

  useEffect(() => { fetchMySchools() }, [fetchMySchools])

  // Debounced search across all schools in the database
  useEffect(() => {
    if (!search.trim()) {
      setSearchResults(null)
      return
    }
    const timeout = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/schools?search=${encodeURIComponent(search.trim())}`)
        const data = await res.json()
        setSearchResults(Array.isArray(data) ? data : [])
      } catch {
        setSearchResults([])
      }
      setSearching(false)
    }, 400)
    return () => clearTimeout(timeout)
  }, [search])

  const displayedSchools = searchResults !== null ? searchResults : mySchools
  const totalStudents = useMemo(() => mySchools.reduce((sum, s) => sum + (s._count?.students ?? 0), 0), [mySchools])
  const uniqueStates = useMemo(() => new Set(mySchools.map(s => s.state).filter(Boolean)).size, [mySchools])

  const handleAddSchool = async () => {
    if (!addForm.name.trim()) { toast.error("School name is required"); return }
    setAddLoading(true)
    try {
      const res = await fetch("/api/schools", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(addForm) })
      if (!res.ok) throw new Error()
      toast.success("School created")
      setAddOpen(false)
      setAddForm({ name: "", address: "", city: "", state: "", zipCode: "", phone: "", email: "", website: "" })
      fetchMySchools()
    } catch { toast.error("Failed to create school") }
    setAddLoading(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/schools/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("School deleted")
      fetchMySchools()
    } catch { toast.error("Failed to delete school") }
  }

  const handleNcesSearch = async () => {
    if (!ncesState) { toast.error("Select a state first"); return }
    setNcesLoading(true)
    setNcesResults([])
    setNcesSelected(new Set())
    setNcesSearched(true)
    try {
      const res = await fetch("/api/schools/import", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: ncesState, search: ncesSearch || undefined })
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setNcesResults(data.results ?? [])
    } catch { toast.error("NCES search failed") }
    setNcesLoading(false)
  }

  const handleNcesImport = async () => {
    const selected = ncesResults.filter(r => ncesSelected.has(r.ncesId))
    if (!selected.length) { toast.error("Select at least one school"); return }
    setNcesImporting(true)
    try {
      const res = await fetch("/api/schools/import/save", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schools: selected })
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      toast.success(`Imported ${data.imported} school${data.imported !== 1 ? "s" : ""}${data.skipped ? `, ${data.skipped} skipped (already exist)` : ""}`)
      setNcesOpen(false)
      setNcesResults([])
      setNcesSelected(new Set())
      setNcesSearched(false)
      fetchMySchools()
    } catch { toast.error("Import failed") }
    setNcesImporting(false)
  }

  const toggleNcesSelect = (ncesId: string) => {
    setNcesSelected(prev => {
      const next = new Set(prev)
      next.has(ncesId) ? next.delete(ncesId) : next.add(ncesId)
      return next
    })
  }

  if (loading) return <div className="flex items-center justify-center py-16"><LoaderOne /></div>

  return (
    <div className="space-y-6">
      <PageHeader title="Schools" description="Manage schools and import from the NCES database." />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="My Schools" value={mySchools.length} icon={School} index={0} />
        <StatCard title="Total Students" value={totalStudents} icon={Users} index={1} />
        <StatCard title="States Represented" value={uniqueStates} icon={MapPin} index={2} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search all schools in database..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {searching && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
        </div>
        <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Add School
        </Button>
        <Button variant="outline" className="gap-2" onClick={() => setNcesOpen(true)}>
          <Download className="h-4 w-4" /> Import from NCES
        </Button>
      </div>

      {/* Context label */}
      {searchResults !== null ? (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for &quot;{search}&quot;
          </p>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setSearch(""); setSearchResults(null) }}>
            Clear search
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Showing schools with enrolled students. Use the search bar to find any school in the database.
        </p>
      )}

      {/* School Cards */}
      {displayedSchools.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <School className="h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm">{searchResults !== null ? "No schools found" : "No schools with students yet"}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayedSchools.map((school, index) => (
            <motion.div key={school.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.05 }}>
              <Card
                variant="bento"
                className="cursor-pointer"
                onClick={() => router.push(`/admin/schools/${school.id}`)}
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1E3A5F]/10 text-[#1E3A5F]">
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-[#1E3A5F] truncate">{school.name}</p>
                        {(school.city || school.state) && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {[school.city, school.state].filter(Boolean).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                    <div onClick={e => e.stopPropagation()}>
                      <ActionMenu items={[
                        { label: "Edit", icon: <Pencil className="h-3.5 w-3.5" />, onClick: () => toast.info("Edit coming soon") },
                        { label: "Delete", icon: <Trash2 className="h-3.5 w-3.5" />, onClick: () => handleDelete(school.id, school.name), destructive: true },
                      ]} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 font-medium text-blue-700">
                      <Users className="h-3 w-3" /> {school._count?.students ?? 0} students
                    </span>
                    {school.joinCode && (
                      <span className="font-mono text-muted-foreground">Code: {school.joinCode}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add School Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add School</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Name *</label>
              <Input value={addForm.name} onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))} placeholder="School name" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Address</label>
                <Input value={addForm.address} onChange={e => setAddForm(p => ({ ...p, address: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">City</label>
                <Input value={addForm.city} onChange={e => setAddForm(p => ({ ...p, city: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">State</label>
                <Select value={addForm.state} onValueChange={v => setAddForm(p => ({ ...p, state: v || "" }))}>
                  <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
                  <SelectContent>{US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Zip Code</label>
                <Input value={addForm.zipCode} onChange={e => setAddForm(p => ({ ...p, zipCode: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Phone</label>
                <Input value={addForm.phone} onChange={e => setAddForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <Input type="email" value={addForm.email} onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Website</label>
                <Input value={addForm.website} onChange={e => setAddForm(p => ({ ...p, website: e.target.value }))} placeholder="https://..." />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90" onClick={handleAddSchool} disabled={addLoading}>
              {addLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create School"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NCES Import Dialog */}
      <Dialog open={ncesOpen} onOpenChange={v => { setNcesOpen(v); if (!v) { setNcesResults([]); setNcesSelected(new Set()); setNcesSearched(false) } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Import from NCES Database</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Select value={ncesState} onValueChange={(v) => setNcesState(v || "")}>
                <SelectTrigger className="w-[100px]"><SelectValue placeholder="State" /></SelectTrigger>
                <SelectContent>{US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="School name (optional)" className="flex-1" value={ncesSearch} onChange={e => setNcesSearch(e.target.value)} />
              <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90" onClick={handleNcesSearch} disabled={ncesLoading}>
                {ncesLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4 mr-1" /> Search</>}
              </Button>
            </div>
            {ncesLoading && <p className="text-sm text-muted-foreground text-center py-4">Searching NCES database...</p>}
            {!ncesLoading && ncesSearched && ncesResults.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No results found. Try a different search.</p>
            )}
            {ncesResults.length > 0 && (
              <>
                <p className="text-xs text-muted-foreground">{ncesResults.length} result{ncesResults.length !== 1 ? "s" : ""} found. Select schools to import.</p>
                <div className="max-h-64 overflow-y-auto space-y-1 rounded-lg border p-2">
                  {ncesResults.map(r => (
                    <label key={r.ncesId} className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50 cursor-pointer">
                      <Checkbox checked={ncesSelected.has(r.ncesId)} onCheckedChange={() => toggleNcesSelect(r.ncesId)} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.city}, {r.state}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
          {ncesResults.length > 0 && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setNcesOpen(false)}>Cancel</Button>
              <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2" onClick={handleNcesImport} disabled={ncesImporting || ncesSelected.size === 0}>
                {ncesImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> Import {ncesSelected.size} Selected</>}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
