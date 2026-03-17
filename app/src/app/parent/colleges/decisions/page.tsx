"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatCard } from "@/components/ui/stat-card"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  CheckCircle2,
  Clock,
  XCircle,
  Star,
  GraduationCap,
  DollarSign,
  TrendingDown,
} from "lucide-react"
import { formatTuition } from "@/lib/college-utils"

interface AidPackage {
  grants?: number
  scholarships?: number
  loans?: number
  workStudy?: number
  totalAid?: number
  [key: string]: unknown
}

interface College {
  name?: string
  inStateTuition?: number | null
  outStateTuition?: number | null
}

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
  committed: boolean
  netCostEstimate: number | null
  aidPackage: AidPackage | null
  college: College | null
  depositDeadline: string | null
  depositPaid: boolean
}

const decisionBadge: Record<string, { label: string; className: string }> = {
  ACCEPTED: { label: "Accepted", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  DENIED: { label: "Denied", className: "bg-rose-100 text-rose-700 border-rose-200" },
  WAITLISTED: { label: "Waitlisted", className: "bg-amber-100 text-amber-700 border-amber-200" },
  DEFERRED: { label: "Deferred", className: "bg-gray-100 text-gray-600 border-gray-200" },
}

function getTotalAid(pkg: AidPackage | null): number {
  if (!pkg) return 0
  if (pkg.totalAid) return pkg.totalAid
  return (pkg.grants || 0) + (pkg.scholarships || 0) + (pkg.loans || 0) + (pkg.workStudy || 0)
}

function getGrants(pkg: AidPackage | null): number {
  if (!pkg) return 0
  return (pkg.grants || 0) + (pkg.scholarships || 0)
}

function getLoans(pkg: AidPackage | null): number {
  if (!pkg) return 0
  return pkg.loans || 0
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

  const decided = useMemo(
    () => apps.filter(a => ["ACCEPTED", "DENIED", "WAITLISTED", "DEFERRED"].includes(a.status)),
    [apps]
  )
  const accepted = useMemo(() => decided.filter(a => a.status === "ACCEPTED"), [decided])
  const waitlisted = useMemo(
    () => decided.filter(a => a.status === "WAITLISTED" || a.status === "DEFERRED"),
    [decided]
  )
  const denied = useMemo(() => decided.filter(a => a.status === "DENIED"), [decided])
  const committedApp = useMemo(() => accepted.find(a => a.committed), [accepted])

  // For cost comparison: only accepted schools with some financial info
  const costCompareSchools = useMemo(
    () =>
      accepted.filter(
        a => a.cost != null || a.netCostEstimate != null || a.aidPackage != null || a.college?.inStateTuition != null
      ),
    [accepted]
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 skeleton-shimmer" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-28 rounded-2xl skeleton-shimmer" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1E3A5F]">College Decisions</h1>
        <p className="mt-1 text-muted-foreground">
          View your child&apos;s college admission results and compare financial aid offers.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Accepted" value={accepted.length} icon={CheckCircle2} index={0} />
        <StatCard title="Waitlisted / Deferred" value={waitlisted.length} icon={Clock} index={1} />
        <StatCard title="Denied" value={denied.length} icon={XCircle} index={2} />
        <StatCard
          title="Total Decisions"
          value={decided.length}
          icon={GraduationCap}
          index={3}
        />
      </div>

      {decided.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No decisions yet"
          description="College decisions will appear here as they come in. Your child's accepted, waitlisted, and denied schools will be displayed."
        />
      ) : (
        <div className="space-y-8">
          {/* Accepted Section */}
          {accepted.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide mb-3">
                Accepted
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {accepted.map((app, i) => {
                  const totalAid = getTotalAid(app.aidPackage)
                  const tuition = app.cost || app.college?.inStateTuition || null
                  const netCost = app.netCostEstimate || (tuition && totalAid ? tuition - totalAid : null)

                  return (
                    <motion.div
                      key={app.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card
                        className={
                          committedApp?.id === app.id
                            ? "ring-2 ring-emerald-400 bg-emerald-50/50"
                            : "border-emerald-200 bg-emerald-50/30"
                        }
                      >
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {app.isDream && (
                                <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                              )}
                              <h3 className="text-sm font-semibold text-[#1E3A5F]">
                                {app.universityName}
                              </h3>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {committedApp?.id === app.id && (
                                <Badge className="bg-emerald-600 text-white text-[10px]">
                                  Committed
                                </Badge>
                              )}
                              {app.depositPaid && (
                                <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-700">
                                  Deposit Paid
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Financial Details */}
                          {(totalAid > 0 || netCost != null) && (
                            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                              {totalAid > 0 && (
                                <div className="rounded-lg bg-white/80 p-2 text-center">
                                  <p className="text-muted-foreground">Total Aid</p>
                                  <p className="font-semibold text-emerald-700">
                                    {formatTuition(totalAid)}
                                  </p>
                                </div>
                              )}
                              {getGrants(app.aidPackage) > 0 && (
                                <div className="rounded-lg bg-white/80 p-2 text-center">
                                  <p className="text-muted-foreground">Grants</p>
                                  <p className="font-semibold text-emerald-600">
                                    {formatTuition(getGrants(app.aidPackage))}
                                  </p>
                                </div>
                              )}
                              {getLoans(app.aidPackage) > 0 && (
                                <div className="rounded-lg bg-white/80 p-2 text-center">
                                  <p className="text-muted-foreground">Loans</p>
                                  <p className="font-semibold text-amber-600">
                                    {formatTuition(getLoans(app.aidPackage))}
                                  </p>
                                </div>
                              )}
                              {netCost != null && (
                                <div className="rounded-lg bg-white/80 p-2 text-center">
                                  <p className="text-muted-foreground">Net Cost</p>
                                  <p className="font-semibold text-[#1E3A5F]">
                                    {formatTuition(netCost)}/yr
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {tuition != null && !app.aidPackage && (
                            <p className="text-xs text-muted-foreground mt-2">
                              <DollarSign className="inline h-3 w-3 mr-0.5" />
                              {formatTuition(tuition)}/year tuition
                            </p>
                          )}

                          {app.depositDeadline && !app.depositPaid && (
                            <p className="text-xs text-amber-600 mt-2 font-medium">
                              Deposit deadline: {new Date(app.depositDeadline).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Cost Comparison Table */}
          {costCompareSchools.length >= 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-[#1E3A5F]" />
                  Cost Comparison (Accepted Schools)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">School</TableHead>
                        <TableHead className="text-xs text-right">Tuition/yr</TableHead>
                        <TableHead className="text-xs text-right">Total Aid</TableHead>
                        <TableHead className="text-xs text-right">Net Cost/yr</TableHead>
                        <TableHead className="text-xs text-right">4-Year Projection</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {costCompareSchools.map(app => {
                        const tuition = app.cost || app.college?.inStateTuition || 0
                        const totalAid = getTotalAid(app.aidPackage)
                        const netCost = app.netCostEstimate || (tuition - totalAid)
                        const fourYear = netCost * 4

                        return (
                          <TableRow
                            key={app.id}
                            className={committedApp?.id === app.id ? "bg-emerald-50/50" : ""}
                          >
                            <TableCell className="text-xs font-medium">
                              <div className="flex items-center gap-1.5">
                                {committedApp?.id === app.id && (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                )}
                                {app.universityName}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-right">
                              {tuition ? formatTuition(tuition) : "N/A"}
                            </TableCell>
                            <TableCell className="text-xs text-right text-emerald-600">
                              {totalAid > 0 ? formatTuition(totalAid) : "N/A"}
                            </TableCell>
                            <TableCell className="text-xs text-right font-medium">
                              {formatTuition(netCost)}
                            </TableCell>
                            <TableCell className="text-xs text-right font-medium text-[#1E3A5F]">
                              {formatTuition(fourYear)}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Waitlisted / Deferred */}
          {waitlisted.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide mb-3">
                Waitlisted / Deferred
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {waitlisted.map((app, i) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="border-amber-200 bg-amber-50/30">
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-[#1E3A5F]">
                            {app.universityName}
                          </h3>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] ${decisionBadge[app.status]?.className || ""}`}
                          >
                            {decisionBadge[app.status]?.label || app.status}
                          </Badge>
                        </div>
                        {app.cost && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTuition(app.cost)}/year
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Denied */}
          {denied.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide mb-3">
                Denied
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
