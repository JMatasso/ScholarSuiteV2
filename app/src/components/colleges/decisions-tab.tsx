"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  CheckCircle2, Clock, Star, Shield, ChevronDown, ChevronUp, Loader2, GraduationCap,
} from "@/lib/icons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { type CollegeApp, APP_TYPE_LABELS } from "@/components/college-kanban"
import { formatCurrency } from "@/lib/format"

const DECISION_STATUSES = ["ACCEPTED", "WAITLISTED", "DENIED", "DEFERRED"]

interface DecisionsTabProps {
  apps: CollegeApp[]
  onCommit: (id: string) => Promise<void>
  onUncommit: (id: string) => Promise<void>
}

export function DecisionsTab({ apps, onCommit, onUncommit }: DecisionsTabProps) {
  const [committingId, setCommittingId] = useState<string | null>(null)
  const [deniedExpanded, setDeniedExpanded] = useState(false)

  const decisionApps = apps.filter((a) => DECISION_STATUSES.includes(a.status))
  const accepted = decisionApps.filter((a) => a.status === "ACCEPTED")
  const waitlisted = decisionApps.filter((a) => a.status === "WAITLISTED")
  const deferred = decisionApps.filter((a) => a.status === "DEFERRED")
  const denied = decisionApps.filter((a) => a.status === "DENIED")
  const committedApp = apps.find((a) => a.committed)

  const handleCommit = async (id: string) => {
    setCommittingId(id)
    try {
      await onCommit(id)
    } finally {
      setCommittingId(null)
    }
  }

  const handleUncommit = async (id: string) => {
    setCommittingId(id)
    try {
      await onUncommit(id)
    } finally {
      setCommittingId(null)
    }
  }

  if (decisionApps.length === 0) {
    return (
      <EmptyState
        icon={GraduationCap}
        title="No decisions yet"
        description="Once your college applications receive decisions, they will appear here for you to compare and make your final choice."
      />
    )
  }

  return (
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
              const isCommitted = app.committed
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
  )
}
