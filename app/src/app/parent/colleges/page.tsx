"use client"

import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatCard } from "@/components/ui/stat-card"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { GraduationCap, Star, Shield, Clock, CheckCircle2, XCircle } from "lucide-react"
import { formatDate } from "@/lib/format"

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
  createdAt: string
}

const statusColor: Record<string, string> = {
  RESEARCHING: "bg-gray-100 text-gray-600",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  SUBMITTED: "bg-purple-100 text-purple-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  DENIED: "bg-rose-100 text-rose-700",
  WAITLISTED: "bg-amber-100 text-amber-700",
  DEFERRED: "bg-gray-100 text-gray-600",
}

const typeLabel: Record<string, string> = {
  REGULAR: "Regular",
  EARLY_DECISION: "Early Decision",
  EARLY_ACTION: "Early Action",
  ROLLING: "Rolling",
}

export default function ParentCollegesPage() {
  const [apps, setApps] = useState<CollegeApp[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/college-applications")
      .then(r => r.json())
      .then(data => setApps(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const submitted = apps.filter(a => ["SUBMITTED", "ACCEPTED", "DENIED", "WAITLISTED", "DEFERRED"].includes(a.status)).length
  const accepted = apps.filter(a => a.status === "ACCEPTED").length
  const waitlisted = apps.filter(a => a.status === "WAITLISTED").length

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 skeleton-shimmer" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-2xl skeleton-shimmer" />)}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1E3A5F]">College Applications</h1>
        <p className="mt-1 text-muted-foreground">Track your child&apos;s college application progress.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Tracked" value={apps.length} icon={GraduationCap} index={0} />
        <StatCard title="Submitted" value={submitted} icon={Clock} index={1} />
        <StatCard title="Accepted" value={accepted} icon={CheckCircle2} index={2} />
        <StatCard title="Waitlisted" value={waitlisted} icon={Clock} index={3} />
      </div>

      {apps.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No college applications yet" description="Your child hasn't started tracking college applications yet." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {apps.map((app, i) => (
            <motion.div key={app.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="hover:shadow-sm transition-shadow">
                <CardContent className="pt-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        {app.isDream && <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 shrink-0" />}
                        {app.isSafety && <Shield className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                        <h3 className="text-sm font-semibold text-[#1E3A5F] truncate">{app.universityName}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{typeLabel[app.applicationType] || app.applicationType}</p>
                    </div>
                    <Badge variant="secondary" className={`text-[10px] shrink-0 ${statusColor[app.status] || "bg-gray-100 text-gray-600"}`}>
                      {app.status.charAt(0) + app.status.slice(1).toLowerCase().replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    {app.deadline && <span>Deadline: {formatDate(app.deadline)}</span>}
                    {app.cost && <span>${app.cost.toLocaleString()}/yr</span>}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
