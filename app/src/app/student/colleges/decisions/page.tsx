"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  GraduationCap,
  CheckCircle2,
  Clock,
  XCircle,
  Star,
  Shield,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatCard } from "@/components/ui/stat-card"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCurrency } from "@/lib/format"
import { toast } from "sonner"

interface CollegeApp {
  id: string
  universityName: string
  applicationType: "REGULAR" | "EARLY_DECISION" | "EARLY_ACTION" | "ROLLING"
  status: string
  cost: number | null
  isDream: boolean
  isSafety: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

const DECISION_STATUSES = ["ACCEPTED", "WAITLISTED", "DENIED", "DEFERRED"]

const APP_TYPE_LABELS: Record<string, string> = {
  REGULAR: "Regular",
  EARLY_DECISION: "Early Decision",
  EARLY_ACTION: "Early Action",
  ROLLING: "Rolling",
}

export default function DecisionsPage() {
  const [apps, setApps] = useState<CollegeApp[]>([])
  const [loading, setLoading] = useState(true)
  const [committingId, setCommittingId] = useState<string | null>(null)
  const [deniedExpanded, setDeniedExpanded] = useState(false)

  const fetchApps = useCallback(async () => {
    try {
      const res = await fetch("/api/college-applications")
      if (!res.ok) throw new Error("Failed to fetch")
      const data: CollegeApp[] = await res.json()
      setApps(data.filter((a) => DECISION_STATUSES.includes(a.status)))
    } catch {
      toast.error("Failed to load college decisions")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchApps()
  }, [fetchApps])

  const committedApp = apps.find((a) => a.notes === "COMMITTED")

  const accepted = apps.filter((a) => a.status === "ACCEPTED")
  const waitlisted = apps.filter((a) => a.status === "WAITLISTED")
  const deferred = apps.filter((a) => a.status === "DEFERRED")
  const denied = apps.filter((a) => a.status === "DENIED")

  async function handleCommit(id: string) {
    setCommittingId(id)
    try {
      // If there's already a committed school, un-commit it first
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

  async function handleUncommit(id: string) {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        <p className="text-sm">Loading decisions...</p>
      </div>
    )
  }

  if (apps.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#1E3A5F]">
            College Decisions
          </h1>
          <p className="mt-1 text-muted-foreground">
            Track your acceptances, waitlists, and make your final choice.
          </p>
        </div>
        <EmptyState
          icon={GraduationCap}
          title="No decisions yet"
          description="Once your college applications receive decisions, they will appear here for you to compare and make your final choice."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#1E3A5F]">
          College Decisions
        </h1>
        <p className="mt-1 text-muted-foreground">
          Track your acceptances, waitlists, and make your final choice.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Accepted"
          value={accepted.length}
          icon={CheckCircle2}
          index={0}
          description={
            committedApp ? `Committed to ${committedApp.universityName}` : undefined
          }
        />
        <StatCard
          title="Waitlisted"
          value={waitlisted.length}
          icon={Clock}
          index={1}
        />
        <StatCard
          title="Denied"
          value={denied.length}
          icon={XCircle}
          index={2}
        />
        <StatCard
          title="Deferred"
          value={deferred.length}
          icon={Clock}
          index={3}
        />
      </div>

      {/* Committed School Banner */}
      <AnimatePresence>
        {committedApp && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="ring-2 ring-emerald-400 bg-emerald-50 border-emerald-200">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">
                      Your Choice
                    </p>
                    <p className="text-lg font-bold text-emerald-900">
                      {committedApp.universityName}
                    </p>
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
          <h2 className="text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide">
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
                    className={
                      isCommitted
                        ? "ring-2 ring-emerald-400 bg-emerald-50 border-emerald-200"
                        : "border-emerald-200 bg-emerald-50/30 hover:shadow-sm transition-shadow"
                    }
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-sm">
                            {app.universityName}
                          </CardTitle>
                          {isCommitted && (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[11px]">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Your Choice
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {app.isDream && (
                            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                          )}
                          {app.isSafety && (
                            <Shield className="h-4 w-4 text-blue-500" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge
                          variant="outline"
                          className="text-[11px] font-medium"
                        >
                          {APP_TYPE_LABELS[app.applicationType]}
                        </Badge>
                        {app.cost !== null && (
                          <Badge
                            variant="outline"
                            className="text-[11px] font-medium"
                          >
                            {formatCurrency(app.cost)}/yr
                          </Badge>
                        )}
                      </div>

                      {app.notes && app.notes !== "COMMITTED" && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {app.notes}
                        </p>
                      )}

                      {!isCommitted && (
                        <Button
                          size="sm"
                          className="w-full bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2"
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

      {/* Waitlisted / Deferred */}
      {(waitlisted.length > 0 || deferred.length > 0) && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide">
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
                <Card className="border-amber-200 bg-amber-50/30 hover:shadow-sm transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-sm">
                        {app.universityName}
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        {app.isDream && (
                          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        )}
                        {app.isSafety && (
                          <Shield className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[11px]">
                        {app.status === "WAITLISTED" ? "Waitlisted" : "Deferred"}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[11px] font-medium"
                      >
                        {APP_TYPE_LABELS[app.applicationType]}
                      </Badge>
                      {app.cost !== null && (
                        <Badge
                          variant="outline"
                          className="text-[11px] font-medium"
                        >
                          {formatCurrency(app.cost)}/yr
                        </Badge>
                      )}
                    </div>
                    {app.notes && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {app.notes}
                      </p>
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
            className="flex items-center gap-2 text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide hover:text-[#2563EB] transition-colors"
          >
            Denied ({denied.length})
            {deniedExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
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
                      <Card className="border-rose-200 bg-rose-50/30">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-sm text-muted-foreground">
                              {app.universityName}
                            </CardTitle>
                            <div className="flex items-center gap-1">
                              {app.isDream && (
                                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                              )}
                              {app.isSafety && (
                                <Shield className="h-4 w-4 text-blue-500" />
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex flex-wrap gap-1.5">
                            <Badge className="bg-rose-100 text-rose-700 border-rose-200 text-[11px]">
                              Denied
                            </Badge>
                            <Badge
                              variant="outline"
                              className="text-[11px] font-medium"
                            >
                              {APP_TYPE_LABELS[app.applicationType]}
                            </Badge>
                          </div>
                          {app.notes && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {app.notes}
                            </p>
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
  )
}
