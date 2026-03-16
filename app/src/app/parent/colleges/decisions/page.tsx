"use client"

import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatCard } from "@/components/ui/stat-card"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle2, Clock, XCircle, Star, Shield, GraduationCap } from "lucide-react"

interface CollegeApp {
  id: string
  universityName: string
  applicationType: string
  status: string
  deadline: string | null
  cost: number | null
  isDream: boolean
  isSafety: boolean
  notes: string | null
}

export default function ParentDecisionsPage() {
  const [apps, setApps] = useState<CollegeApp[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/college-applications")
      .then(r => r.json())
      .then(data => setApps(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const decided = apps.filter(a => ["ACCEPTED", "DENIED", "WAITLISTED", "DEFERRED"].includes(a.status))
  const accepted = decided.filter(a => a.status === "ACCEPTED")
  const waitlisted = decided.filter(a => a.status === "WAITLISTED" || a.status === "DEFERRED")
  const denied = decided.filter(a => a.status === "DENIED")
  const committed = accepted.find(a => a.notes?.includes("COMMITTED"))

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 skeleton-shimmer" />
        <div className="grid gap-4 sm:grid-cols-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-2xl skeleton-shimmer" />)}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1E3A5F]">College Decisions</h1>
        <p className="mt-1 text-muted-foreground">View your child&apos;s college admission results.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Accepted" value={accepted.length} icon={CheckCircle2} index={0} />
        <StatCard title="Waitlisted" value={waitlisted.length} icon={Clock} index={1} />
        <StatCard title="Denied" value={denied.length} icon={XCircle} index={2} />
      </div>

      {decided.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No decisions yet" description="College decisions will appear here as they come in." />
      ) : (
        <div className="space-y-6">
          {accepted.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide mb-3">Accepted</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {accepted.map((app, i) => (
                  <motion.div key={app.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card className={committed?.id === app.id ? "ring-2 ring-emerald-400 bg-emerald-50/50" : "border-emerald-200 bg-emerald-50/30"}>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {app.isDream && <Star className="h-4 w-4 text-amber-400 fill-amber-400" />}
                            <h3 className="text-sm font-semibold text-[#1E3A5F]">{app.universityName}</h3>
                          </div>
                          {committed?.id === app.id && (
                            <Badge className="bg-emerald-600 text-white text-[10px]">Committed</Badge>
                          )}
                        </div>
                        {app.cost && <p className="text-xs text-muted-foreground mt-1">${app.cost.toLocaleString()}/year</p>}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {waitlisted.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide mb-3">Waitlisted / Deferred</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {waitlisted.map(app => (
                  <Card key={app.id} className="border-amber-200 bg-amber-50/30">
                    <CardContent className="pt-0">
                      <h3 className="text-sm font-semibold text-[#1E3A5F]">{app.universityName}</h3>
                      <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700 mt-1">{app.status.charAt(0) + app.status.slice(1).toLowerCase()}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {denied.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide mb-3">Denied</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {denied.map(app => (
                  <Card key={app.id} className="border-rose-200 bg-rose-50/30 opacity-70">
                    <CardContent className="pt-0">
                      <h3 className="text-sm font-medium text-gray-600">{app.universityName}</h3>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
