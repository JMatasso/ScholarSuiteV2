"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import { toast } from "sonner"
import LoaderOne from "@/components/ui/loader-one"
import {
  Plus, GraduationCap, Send, CheckCircle2, Clock,
  XCircle, Star, Shield, ChevronDown, ChevronUp, Loader2,
} from "@/lib/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { StatCard } from "@/components/ui/stat-card"
import { EmptyState } from "@/components/ui/empty-state"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import {
  KanbanColumn, COLUMNS, FILTER_OPTIONS,
  APP_TYPE_LABELS, CLASSIFICATION_LABELS, PLATFORM_LABELS,
  type CollegeApp, type AppType, type AppStatus, type AppClassification, type AppPlatform,
} from "@/components/college-kanban"
import { CollegeAppDetail } from "@/components/college-app-detail"
import { CollegeAutocomplete, type CollegeResult } from "@/components/ui/college-autocomplete"
import { formatCurrency } from "@/lib/format"
import { Tabs as VercelTabs } from "@/components/ui/vercel-tabs"
import { cn } from "@/lib/utils"

type TabView = "applications" | "decisions"

const DECISION_STATUSES = ["ACCEPTED", "WAITLISTED", "DENIED", "DEFERRED"]

export default function CollegeApplicationsPage() {
  const [activeTab, setActiveTab] = useState<TabView>("applications")
  const [apps, setApps] = useState<CollegeApp[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("ALL")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedApp, setSelectedApp] = useState<CollegeApp | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [committingId, setCommittingId] = useState<string | null>(null)
  const [deniedExpanded, setDeniedExpanded] = useState(false)

  const [form, setForm] = useState({
    universityName: "",
    collegeId: null as string | null,
    applicationType: "REGULAR" as AppType,
    classification: "" as string,
    platform: "" as string,
    deadline: "",
    notes: "",
  })

  const fetchApps = useCallback(async () => {
    try {
      const res = await fetch("/api/college-applications")
      if (!res.ok) throw new Error()
      setApps(await res.json())
    } catch {
      toast.error("Failed to load college applications")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchApps() }, [fetchApps])

  // Keep selectedApp in sync with fetched data
  useEffect(() => {
    if (selectedApp) {
      const updated = apps.find((a) => a.id === selectedApp.id)
      if (updated) setSelectedApp(updated)
    }
  }, [apps, selectedApp])

  // --- Shared data ---
  const filtered = filter === "ALL" ? apps : apps.filter((a) => a.applicationType === filter)
  const decisionApps = apps.filter((a) => DECISION_STATUSES.includes(a.status))

  // --- Applications tab stats ---
  const total = apps.length
  const submitted = apps.filter((a) => a.status === "SUBMITTED").length
  const acceptedCount = apps.filter((a) => a.status === "ACCEPTED").length
  const waitlistedCount = apps.filter((a) => ["WAITLISTED", "DEFERRED"].includes(a.status)).length

  // --- Decisions tab data ---
  const accepted = decisionApps.filter((a) => a.status === "ACCEPTED")
  const waitlisted = decisionApps.filter((a) => a.status === "WAITLISTED")
  const deferred = decisionApps.filter((a) => a.status === "DEFERRED")
  const denied = decisionApps.filter((a) => a.status === "DENIED")
  const committedApp = decisionApps.find((a) => a.notes === "COMMITTED")

  // --- Handlers ---
  const handleCollegeSelect = (college: CollegeResult) => {
    if (!college.id) {
      setForm((f) => ({ ...f, universityName: "", collegeId: null }))
      return
    }
    setForm((f) => ({ ...f, universityName: college.name, collegeId: college.id }))
  }

  const handleCreate = async () => {
    if (!form.universityName.trim()) {
      toast.error("University name is required")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/college-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          universityName: form.universityName,
          collegeId: form.collegeId,
          applicationType: form.applicationType,
          classification: form.classification || null,
          platform: form.platform || null,
          deadline: form.deadline || null,
          notes: form.notes || null,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("College added!")
      setDialogOpen(false)
      setForm({ universityName: "", collegeId: null, applicationType: "REGULAR", classification: "", platform: "", deadline: "", notes: "" })
      fetchApps()
    } catch {
      toast.error("Failed to add college")
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (id: string, status: AppStatus) => {
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
    try {
      const res = await fetch(`/api/college-applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
    } catch {
      toast.error("Failed to update status")
      fetchApps()
    }
  }

  const handleUpdate = async (id: string, data: Partial<CollegeApp>) => {
    try {
      const res = await fetch(`/api/college-applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      await fetchApps()
    } catch {
      toast.error("Failed to update application")
      throw new Error()
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/college-applications/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Application deleted")
      fetchApps()
    } catch {
      toast.error("Failed to delete application")
    }
  }

  const handleCardClick = (app: CollegeApp) => {
    setSelectedApp(app)
    setDetailOpen(true)
  }

  const handleCommit = async (id: string) => {
    setCommittingId(id)
    try {
      if (committedApp && committedApp.id !== id) {
        const prevNotes = committedApp.notes === "COMMITTED" ? null : committedApp.notes
        await fetch(`/api/college-applications/${committedApp.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: prevNotes }),
        })
      }
      const res = await fetch(`/api/college-applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "COMMITTED" }),
      })
      if (!res.ok) throw new Error("Failed to commit")
      toast.success("School commitment updated!")
      await fetchApps()
    } catch {
      toast.error("Failed to update commitment")
    } finally {
      setCommittingId(null)
    }
  }

  const handleUncommit = async (id: string) => {
    setCommittingId(id)
    try {
      const res = await fetch(`/api/college-applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: null }),
      })
      if (!res.ok) throw new Error("Failed to update")
      toast.success("Commitment removed")
      await fetchApps()
    } catch {
      toast.error("Failed to remove commitment")
    } finally {
      setCommittingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-secondary-foreground">College Applications</h1>
          <p className="mt-1 text-muted-foreground">Track your applications from research to decision.</p>
        </div>
        {activeTab === "applications" && (
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={(v) => v && setFilter(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FILTER_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="gap-2" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" /> Add College
            </Button>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <VercelTabs
        tabs={[
          { id: "applications", label: "Applications" },
          { id: "decisions", label: "Decisions" },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabView)}
      />

      {/* Stat cards — context-dependent */}
      {activeTab === "applications" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total" value={total} icon={GraduationCap} index={0} />
          <StatCard title="Submitted" value={submitted} icon={Send} index={1} />
          <StatCard title="Accepted" value={acceptedCount} icon={CheckCircle2} index={2} />
          <StatCard title="Waitlisted" value={waitlistedCount} icon={Clock} index={3} />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Accepted"
            value={accepted.length}
            icon={CheckCircle2}
            index={0}
            description={committedApp ? `Committed to ${committedApp.universityName}` : undefined}
          />
          <StatCard title="Waitlisted" value={waitlisted.length} icon={Clock} index={1} />
          <StatCard title="Denied" value={denied.length} icon={XCircle} index={2} />
          <StatCard title="Deferred" value={deferred.length} icon={Clock} index={3} />
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <LoaderOne />
        </div>
      ) : activeTab === "applications" ? (
        /* ===== APPLICATIONS TAB ===== */
        <>
          {apps.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No colleges yet"
              description="Start adding colleges you're interested in to track your applications."
              action={
                <Button className="gap-2" onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4" /> Add College
                </Button>
              }
            />
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {COLUMNS.map((col) => {
                const colApps = filtered.filter((a) =>
                  col.key === "WAITLISTED"
                    ? a.status === "WAITLISTED" || a.status === "DEFERRED"
                    : a.status === col.key
                )
                return (
                  <KanbanColumn
                    key={col.key}
                    column={col}
                    apps={colApps}
                    onStatusChange={handleStatusChange}
                    onCardClick={handleCardClick}
                  />
                )
              })}
            </div>
          )}
        </>
      ) : (
        /* ===== DECISIONS TAB ===== */
        <>
          {decisionApps.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No decisions yet"
              description="Once your college applications receive decisions, they will appear here for you to compare and make your final choice."
            />
          ) : (
            <div className="space-y-6">
              {/* Committed School Banner */}
              <AnimatePresence>
                {committedApp && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Card variant="bento" className="ring-2 ring-emerald-400 bg-emerald-50 border-emerald-200">
                      <CardContent className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-emerald-800">Your Choice</p>
                            <p className="text-lg font-bold text-emerald-900">{committedApp.universityName}</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                          onClick={() => handleUncommit(committedApp.id)}
                          disabled={committingId !== null}
                        >
                          {committingId === committedApp.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Change Decision"
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Acceptances */}
              {accepted.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold text-secondary-foreground uppercase tracking-wide">
                    Acceptances
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {accepted.map((app, i) => {
                      const isCommitted = app.notes === "COMMITTED"
                      return (
                        <motion.div
                          key={app.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <Card
                            variant="bento"
                            className={
                              isCommitted
                                ? "ring-2 ring-emerald-400 bg-emerald-50 border-emerald-200"
                                : "border-emerald-200 bg-emerald-50/30 hover:shadow-sm transition-shadow"
                            }
                          >
                            <CardHeader className="pb-2">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  <CardTitle className="text-sm">{app.universityName}</CardTitle>
                                  {isCommitted && (
                                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[11px]">
                                      <CheckCircle2 className="mr-1 h-3 w-3" />
                                      Your Choice
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  {app.isDream && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                                  {app.isSafety && <Shield className="h-4 w-4 text-blue-500" />}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="flex flex-wrap gap-1.5">
                                <Badge variant="outline" className="text-[11px] font-medium">
                                  {APP_TYPE_LABELS[app.applicationType]}
                                </Badge>
                                {app.cost !== null && (
                                  <Badge variant="outline" className="text-[11px] font-medium">
                                    {formatCurrency(app.cost)}/yr
                                  </Badge>
                                )}
                              </div>
                              {app.notes && app.notes !== "COMMITTED" && (
                                <p className="text-xs text-muted-foreground line-clamp-2">{app.notes}</p>
                              )}
                              {!isCommitted && (
                                <Button
                                  size="sm"
                                  className="w-full gap-2"
                                  onClick={() => handleCommit(app.id)}
                                  disabled={committingId !== null}
                                >
                                  {committingId === app.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <CheckCircle2 className="h-4 w-4" />
                                      Commit to This School
                                    </>
                                  )}
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Waitlisted & Deferred */}
              {(waitlisted.length > 0 || deferred.length > 0) && (
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold text-secondary-foreground uppercase tracking-wide">
                    Waitlisted & Deferred
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[...waitlisted, ...deferred].map((app, i) => (
                      <motion.div
                        key={app.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Card variant="bento" className="border-amber-200 bg-amber-50/30">
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                              <CardTitle className="text-sm">{app.universityName}</CardTitle>
                              <div className="flex items-center gap-1">
                                {app.isDream && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                                {app.isSafety && <Shield className="h-4 w-4 text-blue-500" />}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex flex-wrap gap-1.5">
                              <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[11px]">
                                {app.status === "WAITLISTED" ? "Waitlisted" : "Deferred"}
                              </Badge>
                              <Badge variant="outline" className="text-[11px] font-medium">
                                {APP_TYPE_LABELS[app.applicationType]}
                              </Badge>
                              {app.cost !== null && (
                                <Badge variant="outline" className="text-[11px] font-medium">
                                  {formatCurrency(app.cost)}/yr
                                </Badge>
                              )}
                            </div>
                            {app.notes && (
                              <p className="text-xs text-muted-foreground line-clamp-2">{app.notes}</p>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Denied — collapsed by default */}
              {denied.length > 0 && (
                <div className="space-y-3">
                  <button
                    onClick={() => setDeniedExpanded((v) => !v)}
                    className="flex items-center gap-2 text-sm font-semibold text-secondary-foreground uppercase tracking-wide hover:text-[#2563EB] transition-colors"
                  >
                    Denied ({denied.length})
                    {deniedExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  <AnimatePresence>
                    {deniedExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {denied.map((app, i) => (
                            <motion.div
                              key={app.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05 }}
                            >
                              <Card variant="bento" className="border-rose-200 bg-rose-50/30">
                                <CardHeader className="pb-2">
                                  <div className="flex items-start justify-between">
                                    <CardTitle className="text-sm text-muted-foreground">
                                      {app.universityName}
                                    </CardTitle>
                                    <div className="flex items-center gap-1">
                                      {app.isDream && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                                      {app.isSafety && <Shield className="h-4 w-4 text-blue-500" />}
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                  <div className="flex flex-wrap gap-1.5">
                                    <Badge className="bg-rose-100 text-rose-700 border-rose-200 text-[11px]">
                                      Denied
                                    </Badge>
                                    <Badge variant="outline" className="text-[11px] font-medium">
                                      {APP_TYPE_LABELS[app.applicationType]}
                                    </Badge>
                                  </div>
                                  {app.notes && (
                                    <p className="text-xs text-muted-foreground line-clamp-2">{app.notes}</p>
                                  )}
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Detail panel (shared) */}
      {selectedApp && (
        <CollegeAppDetail
          app={selectedApp}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onRefresh={fetchApps}
        />
      )}

      {/* Add dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add College</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">College *</label>
              <CollegeAutocomplete
                value={form.universityName || undefined}
                onSelect={handleCollegeSelect}
                placeholder="Search for a college..."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Application Type</label>
                <Select value={form.applicationType} onValueChange={(v) => v && setForm((f) => ({ ...f, applicationType: v as AppType }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(APP_TYPE_LABELS) as AppType[]).map((t) => (
                      <SelectItem key={t} value={t}>{APP_TYPE_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Deadline</label>
                <Input type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Classification</label>
                <Select value={form.classification || "NONE"} onValueChange={(v) => setForm((f) => ({ ...f, classification: v === "NONE" ? "" : (v ?? "") }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Not set</SelectItem>
                    {(Object.keys(CLASSIFICATION_LABELS) as AppClassification[]).map((c) => (
                      <SelectItem key={c} value={c}>{CLASSIFICATION_LABELS[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Platform</label>
                <Select value={form.platform || "NONE"} onValueChange={(v) => setForm((f) => ({ ...f, platform: v === "NONE" ? "" : (v ?? "") }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Not set</SelectItem>
                    {(Object.keys(PLATFORM_LABELS) as AppPlatform[]).map((p) => (
                      <SelectItem key={p} value={p}>{PLATFORM_LABELS[p]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Notes</label>
              <Textarea placeholder="Any notes about this school..." value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? "Adding..." : "Add College"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
