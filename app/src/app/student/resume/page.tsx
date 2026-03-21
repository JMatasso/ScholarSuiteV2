"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { EmptyState } from "@/components/ui/empty-state"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Sparkles, Download, Loader2, GraduationCap, MapPin, Calendar, Dumbbell, Palette, BookOpen, Heart, Briefcase, Users, Rocket, FlaskConical, Globe, BadgeCheck, HandHeart, Medal, FolderKanban, Activity, Check, ArrowRight, Clock, Trophy, Award } from "lucide-react"
import { toast } from "sonner"
import LoaderOne from "@/components/ui/loader-one"
import { jsPDF } from "jspdf"

// ─── Types & Config ──────────────────────────────────────────
interface Act { id: string; title: string; category: string; organization: string | null; role: string | null; description: string | null; impactStatement: string | null; startDate: string | null; endDate: string | null; isOngoing: boolean; hoursPerWeek: number | null; totalHours: number | null; skillsGained: string[]; isLeadership: boolean; isAward: boolean; isVerified: boolean; createdAt: string }
interface Prof { firstName: string | null; lastName: string | null; highSchool: string | null; gradeLevel: number | null; gpa: number | null; intendedMajor: string | null; city: string | null; state: string | null }
interface Enh { activityId: string; impactStatement: string; actionVerbs: string[] }

const CC: Record<string, { label: string; icon: typeof Activity; color: string }> = {
  ATHLETICS: { label: "Athletics", icon: Dumbbell, color: "text-orange-600" }, ARTS: { label: "Arts", icon: Palette, color: "text-purple-600" }, ACADEMIC: { label: "Academic", icon: BookOpen, color: "text-blue-600" }, VOLUNTEER: { label: "Volunteer", icon: Heart, color: "text-rose-600" }, WORK: { label: "Work", icon: Briefcase, color: "text-emerald-600" }, LEADERSHIP: { label: "Leadership", icon: Users, color: "text-amber-600" }, ENTREPRENEURSHIP: { label: "Entrepreneurship", icon: Rocket, color: "text-cyan-600" }, RESEARCH: { label: "Research", icon: FlaskConical, color: "text-indigo-600" }, STUDY_ABROAD: { label: "Study Abroad", icon: Globe, color: "text-sky-600" }, CERTIFICATION: { label: "Certifications", icon: BadgeCheck, color: "text-violet-600" }, MENTORING: { label: "Mentoring", icon: HandHeart, color: "text-pink-600" }, AWARD: { label: "Awards", icon: Medal, color: "text-yellow-600" }, PROJECT: { label: "Projects", icon: FolderKanban, color: "text-green-600" }, PROFESSIONAL_DEV: { label: "Professional Dev", icon: GraduationCap, color: "text-slate-600" }, OTHER: { label: "Other", icon: Activity, color: "text-gray-600" },
}
const ORDER = ["ACADEMIC","LEADERSHIP","VOLUNTEER","ATHLETICS","ARTS","WORK","ENTREPRENEURSHIP","RESEARCH","STUDY_ABROAD","CERTIFICATION","MENTORING","AWARD","PROJECT","PROFESSIONAL_DEV","OTHER"]

function fmtR(s: string|null, e: string|null, o: boolean) {
  const f = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" })
  return !s ? "" : `${f(s)} – ${o ? "Present" : e ? f(e) : "Present"}`
}

function buildPdf(name: string, profile: Prof|null, grouped: {cat:string;items:Act[]}[]) {
  const doc = new jsPDF(); const w = doc.internal.pageSize.getWidth(); let y = 20
  const next = () => { doc.addPage(); y = 20 }
  const chk = (n: number) => { if (y + n > 275) next() }
  doc.setFontSize(20); doc.setTextColor(30, 58, 95)
  doc.text(name || "My Brag Sheet", w / 2, y, { align: "center" }); y += 8
  if (profile) {
    doc.setFontSize(10); doc.setTextColor(100, 100, 100)
    const info = [profile.highSchool, profile.gradeLevel ? `Grade ${profile.gradeLevel}` : null, profile.gpa ? `GPA: ${profile.gpa}` : null, profile.intendedMajor ? `Major: ${profile.intendedMajor}` : null].filter(Boolean).join("  |  ")
    doc.text(info, w / 2, y, { align: "center" }); y += 5
    const loc = [profile.city, profile.state].filter(Boolean).join(", ")
    if (loc) { doc.text(loc, w / 2, y, { align: "center" }); y += 5 }
  }
  doc.setDrawColor(30, 58, 95); doc.setLineWidth(0.5); doc.line(15, y, w - 15, y); y += 8
  for (const g of grouped) {
    const cfg = CC[g.cat] || CC.OTHER; chk(20)
    doc.setFontSize(13); doc.setTextColor(30, 58, 95); doc.text(cfg.label.toUpperCase(), 15, y); y += 2
    doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.2); doc.line(15, y, w - 15, y); y += 5
    for (const a of g.items) {
      chk(30); doc.setFontSize(11); doc.setTextColor(30, 30, 30); doc.text(a.title, 18, y)
      const ds = fmtR(a.startDate, a.endDate, a.isOngoing)
      if (ds) { doc.setFontSize(9); doc.setTextColor(120, 120, 120); doc.text(ds, w - 15, y, { align: "right" }) }
      y += 5
      if (a.organization || a.role) { doc.setFontSize(9); doc.setTextColor(80, 80, 80); doc.text([a.role, a.organization].filter(Boolean).join(" at "), 18, y); y += 4 }
      if (a.description) { doc.setFontSize(9); doc.setTextColor(60, 60, 60); const l = doc.splitTextToSize(a.description, w - 36); chk(l.length * 4 + 2); doc.text(l, 18, y); y += l.length * 4 }
      if (a.impactStatement) { doc.setFontSize(9); doc.setTextColor(37, 99, 235); const l = doc.splitTextToSize(a.impactStatement, w - 36); chk(l.length * 4 + 2); doc.text(l, 18, y); y += l.length * 4 }
      y += 4
    }
    y += 3
  }
  doc.save(`${(name || "brag-sheet").replace(/\s+/g, "-").toLowerCase()}-resume.pdf`)
  toast.success("PDF exported!")
}

// ─── Page ────────────────────────────────────────────────────
export default function ResumePage() {
  const [activities, setActivities] = useState<Act[]>([])
  const [profile, setProfile] = useState<Prof | null>(null)
  const [loading, setLoading] = useState(true)
  const [enhanceOpen, setEnhanceOpen] = useState(false)
  const [enhanceMode, setEnhanceMode] = useState<"enhance"|"impact">("impact")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [enhancing, setEnhancing] = useState(false)
  const [enhancements, setEnhancements] = useState<Enh[]>([])
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    Promise.all([
      fetch("/api/activities").then(r => r.json()),
      fetch("/api/students/onboarding").then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([acts, prof]) => {
      setActivities(Array.isArray(acts) ? acts : [])
      if (prof && !prof.error) setProfile(prof)
    }).finally(() => setLoading(false))
  }, [])

  const grouped = useMemo(() => ORDER.map(c => ({ cat: c, items: activities.filter(a => a.category === c) })).filter(g => g.items.length > 0), [activities])
  const fullName = profile ? [profile.firstName, profile.lastName].filter(Boolean).join(" ") : null

  const toggleSelect = useCallback((id: string) => setSelectedIds(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n }), [])
  const selectAll = useCallback(() => { setSelectedIds(p => p.size === activities.length ? new Set() : new Set(activities.map(a => a.id))) }, [activities])

  const handleEnhance = async () => {
    if (selectedIds.size === 0) { toast.error("Select at least one activity"); return }
    setEnhancing(true)
    try {
      const res = await fetch("/api/resume/enhance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ activityIds: [...selectedIds], mode: enhanceMode }) })
      if (!res.ok) throw new Error()
      const data = await res.json(); setEnhancements(data.enhancements || []); setAppliedIds(new Set())
    } catch { toast.error("Enhancement failed") } finally { setEnhancing(false) }
  }

  const applyUpdates = async (updates: { activityId: string; impactStatement: string }[]) => {
    const res = await fetch("/api/resume/enhance", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ updates }) })
    if (!res.ok) throw new Error()
    setActivities(prev => prev.map(a => { const u = updates.find(x => x.activityId === a.id); return u ? { ...a, impactStatement: u.impactStatement } : a }))
    setAppliedIds(prev => { const n = new Set(prev); updates.forEach(u => n.add(u.activityId)); return n })
  }

  const applyOne = async (e: Enh) => { try { await applyUpdates([{ activityId: e.activityId, impactStatement: e.impactStatement }]); toast.success("Applied!") } catch { toast.error("Failed") } }
  const applyAll = async () => { const p = enhancements.filter(e => !appliedIds.has(e.activityId)); if (!p.length) return; try { await applyUpdates(p.map(e => ({ activityId: e.activityId, impactStatement: e.impactStatement }))); toast.success(`Applied ${p.length} enhancements`) } catch { toast.error("Failed") } }

  if (loading) return <div className="flex items-center justify-center py-16"><LoaderOne /></div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1E3A5F]">My Brag Sheet</h1>
          <p className="mt-1 text-muted-foreground">Your activities, achievements, and experiences — ready for applications.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2" onClick={() => { setEnhanceOpen(true); setEnhancements([]); setAppliedIds(new Set()) }} disabled={!activities.length}>
            <Sparkles className="h-4 w-4" /> AI Enhance
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => buildPdf(fullName || "", profile, grouped)} disabled={!activities.length}>
            <Download className="h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Profile Summary */}
      {profile && (
        <Card><CardContent className="pt-0">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {fullName && <h2 className="text-lg font-semibold text-[#1E3A5F]">{fullName}</h2>}
            {profile.highSchool && <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><GraduationCap className="h-4 w-4" /> {profile.highSchool}</span>}
            {profile.gradeLevel && <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><Calendar className="h-4 w-4" /> Grade {profile.gradeLevel}</span>}
            {profile.gpa && <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><Trophy className="h-4 w-4" /> {profile.gpa} GPA</span>}
            {profile.intendedMajor && <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><BookOpen className="h-4 w-4" /> {profile.intendedMajor}</span>}
            {(profile.city || profile.state) && <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-4 w-4" /> {[profile.city, profile.state].filter(Boolean).join(", ")}</span>}
          </div>
        </CardContent></Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Activity, v: activities.length, l: "Activities", bg: "bg-[#1E3A5F]/10", c: "text-[#1E3A5F]" },
          { icon: Clock, v: activities.reduce((a, b) => a + (b.totalHours ?? 0), 0).toLocaleString(), l: "Total Hours", bg: "bg-blue-50", c: "text-[#2563EB]" },
          { icon: Users, v: activities.filter(a => a.isLeadership).length, l: "Leadership Roles", bg: "bg-amber-50", c: "text-amber-600" },
          { icon: Award, v: activities.filter(a => a.isAward).length, l: "Awards", bg: "bg-emerald-50", c: "text-emerald-600" },
        ].map(s => { const I = s.icon; return (
          <Card key={s.l}><CardContent className="pt-0"><div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.bg}`}><I className={`h-5 w-5 ${s.c}`} /></div>
            <div><p className="text-2xl font-bold text-[#1E3A5F]">{s.v}</p><p className="text-xs text-muted-foreground">{s.l}</p></div>
          </div></CardContent></Card>
        )})}
      </div>

      {/* Activities by category */}
      {!activities.length ? (
        <EmptyState icon={Activity} title="No activities yet" description="Add activities on the Brag Sheet page to see them here." />
      ) : (
        <div className="space-y-6">{grouped.map(g => { const cfg = CC[g.cat] || CC.OTHER; const I = cfg.icon; return (
          <div key={g.cat}>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[#1E3A5F]">
              <I className={`h-4 w-4 ${cfg.color}`} /> {cfg.label} ({g.items.length})
            </h2>
            <div className="space-y-2.5">{g.items.map(a => (
              <Card key={a.id} className="hover:shadow-sm transition-shadow"><CardContent className="pt-0 space-y-1.5">
                <div className="flex items-start justify-between gap-4"><div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[#1E3A5F]">{a.title}</p>
                    {a.isLeadership && <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700"><Users className="h-3 w-3" /> Leadership</span>}
                    {a.isAward && <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"><Award className="h-3 w-3" /> Award</span>}
                  </div>
                  {(a.organization || a.role) && <p className="text-xs text-muted-foreground">{a.role}{a.role && a.organization ? " at " : ""}{a.organization}</p>}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {a.startDate && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {fmtR(a.startDate, a.endDate, a.isOngoing)}</span>}
                    {a.hoursPerWeek !== null && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {a.hoursPerWeek} hrs/week</span>}
                    {a.totalHours !== null && a.totalHours > 0 && <span className="font-medium">{a.totalHours} total hrs</span>}
                  </div>
                </div></div>
                {a.description && <p className="text-xs text-muted-foreground">{a.description}</p>}
                {a.impactStatement && <div className="flex items-start gap-1.5 rounded-md bg-blue-50/60 px-2.5 py-1.5"><Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-[#2563EB]" /><p className="text-xs text-[#1E3A5F]">{a.impactStatement}</p></div>}
                {a.skillsGained?.length > 0 && <div className="flex flex-wrap gap-1">{a.skillsGained.map(s => <span key={s} className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-blue-50 text-blue-700">{s}</span>)}</div>}
              </CardContent></Card>
            ))}</div>
          </div>
        )})}</div>
      )}

      {/* AI Enhance Dialog */}
      <Dialog open={enhanceOpen} onOpenChange={setEnhanceOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-[#2563EB]" /> AI Enhance</DialogTitle>
            <DialogDescription>Select activities and choose an enhancement mode.</DialogDescription>
          </DialogHeader>
          {enhancements.length === 0 ? (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                {([{ key: "enhance" as const, title: "Polish Descriptions", desc: "Rewrite descriptions with strong action verbs" }, { key: "impact" as const, title: "Generate Impact Statements", desc: "Create quantified impact statements" }]).map(m => (
                  <button key={m.key} onClick={() => setEnhanceMode(m.key)} className={`rounded-lg border-2 p-3 text-left transition-colors ${enhanceMode === m.key ? "border-[#2563EB] bg-blue-50/50" : "border-gray-200 hover:border-gray-300"}`}>
                    <p className="text-sm font-medium text-[#1E3A5F]">{m.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
                  </button>
                ))}
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground">Select activities ({selectedIds.size} of {activities.length})</p>
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={selectAll}>{selectedIds.size === activities.length ? "Deselect All" : "Select All"}</Button>
                </div>
                <div className="max-h-56 overflow-y-auto space-y-1 rounded-md border p-2">
                  {activities.map(a => (
                    <label key={a.id} className="flex items-center gap-2.5 rounded px-2 py-1.5 hover:bg-gray-50 cursor-pointer">
                      <Checkbox checked={selectedIds.has(a.id)} onCheckedChange={() => toggleSelect(a.id)} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[#1E3A5F] truncate">{a.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{(CC[a.category] || CC.OTHER).label}{a.organization ? ` — ${a.organization}` : ""}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[#1E3A5F]">{enhancements.length} enhancement{enhancements.length !== 1 ? "s" : ""} generated</p>
                <Button size="sm" className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-1.5 text-xs" onClick={applyAll} disabled={appliedIds.size === enhancements.length}><Check className="h-3.5 w-3.5" /> Apply All</Button>
              </div>
              <div className="space-y-3">{enhancements.map(enh => { const act = activities.find(a => a.id === enh.activityId); const done = appliedIds.has(enh.activityId); return (
                <Card key={enh.activityId} className={done ? "border-emerald-200 bg-emerald-50/30" : ""}>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">{act?.title || "Activity"}</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {act?.impactStatement && <div><p className="text-[11px] font-medium text-muted-foreground mb-0.5">Before</p><p className="text-xs text-muted-foreground bg-gray-50 rounded px-2 py-1.5">{act.impactStatement}</p></div>}
                    <div><p className="text-[11px] font-medium text-[#2563EB] mb-0.5 flex items-center gap-1"><ArrowRight className="h-3 w-3" /> After</p><p className="text-xs text-[#1E3A5F] bg-blue-50 rounded px-2 py-1.5">{enh.impactStatement}</p></div>
                    {enh.actionVerbs.length > 0 && <div className="flex flex-wrap gap-1">{enh.actionVerbs.map(v => <span key={v} className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-blue-50 text-blue-700">{v}</span>)}</div>}
                    <div className="flex justify-end">
                      <Button size="sm" variant={done ? "outline" : "default"} className={done ? "gap-1.5 text-xs" : "bg-[#2563EB] hover:bg-[#2563EB]/90 gap-1.5 text-xs"} disabled={done} onClick={() => applyOne(enh)}>
                        {done ? <><Check className="h-3.5 w-3.5" /> Applied</> : "Apply"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )})}</div>
            </div>
          )}
          <DialogFooter>
            {enhancements.length === 0 ? (<>
              <Button variant="outline" onClick={() => setEnhanceOpen(false)}>Cancel</Button>
              <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2" onClick={handleEnhance} disabled={enhancing || !selectedIds.size}>
                {enhancing && <Loader2 className="h-4 w-4 animate-spin" />} Enhance Selected
              </Button>
            </>) : (
              <Button variant="outline" onClick={() => { setEnhancements([]); setEnhanceOpen(false) }}>Done</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
