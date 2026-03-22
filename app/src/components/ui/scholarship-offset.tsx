"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatTuition } from "@/lib/college-utils"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  Award,
  RefreshCw,
  DollarSign,
  Settings,
  Check,
  Loader2,
} from "@/lib/icons"

interface AwardedScholarship {
  id: string
  scholarshipName: string
  amountAwarded: number | null
  scholarshipAmount: number | null
  isRecurring: boolean
}

interface Semester {
  id: string
  name: string
}

interface ScholarshipOffsetProps {
  awards: AwardedScholarship[]
  semesters?: Semester[]
  planId?: string
  onBudgetSynced?: () => void
}

export function ScholarshipOffset({ awards, semesters = [], planId, onBudgetSynced }: ScholarshipOffsetProps) {
  const [allocDialogOpen, setAllocDialogOpen] = useState(false)
  const [selectedAward, setSelectedAward] = useState<AwardedScholarship | null>(null)
  const [allocations, setAllocations] = useState<Record<string, number>>({})
  const [syncing, setSyncing] = useState(false)

  if (awards.length === 0) {
    return null
  }

  const totalAwarded = awards.reduce((sum, a) => {
    return sum + (a.amountAwarded ?? a.scholarshipAmount ?? 0)
  }, 0)

  const recurringAwards = awards.filter((a) => a.isRecurring)
  const oneTimeAwards = awards.filter((a) => !a.isRecurring)
  const recurringTotal = recurringAwards.reduce((sum, a) => sum + (a.amountAwarded ?? a.scholarshipAmount ?? 0), 0)
  const oneTimeTotal = oneTimeAwards.reduce((sum, a) => sum + (a.amountAwarded ?? a.scholarshipAmount ?? 0), 0)
  const fourYearProjected = recurringTotal * 4 + oneTimeTotal

  const openAllocDialog = (award: AwardedScholarship) => {
    setSelectedAward(award)
    const amount = award.amountAwarded ?? award.scholarshipAmount ?? 0
    // Pre-fill: if recurring, split evenly across all semesters; otherwise put full amount in first semester
    const initial: Record<string, number> = {}
    if (semesters.length > 0) {
      if (award.isRecurring) {
        const perSem = Math.round(amount / semesters.length)
        semesters.forEach((sem) => { initial[sem.id] = perSem })
      } else {
        semesters.forEach((sem, i) => { initial[sem.id] = i === 0 ? amount : 0 })
      }
    }
    setAllocations(initial)
    setAllocDialogOpen(true)
  }

  const handleSyncAllocation = async () => {
    if (!selectedAward || !planId) return
    setSyncing(true)
    try {
      const semesterAllocations = Object.entries(allocations)
        .filter(([, amount]) => amount > 0)
        .map(([semesterId, amount]) => ({ semesterId, amount }))

      const res = await fetch("/api/financial/sync-scholarships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allocations: [{
            scholarshipAppId: selectedAward.id,
            scholarshipName: selectedAward.scholarshipName,
            semesterAllocations,
          }],
        }),
      })

      if (!res.ok) throw new Error()
      toast.success(`${selectedAward.scholarshipName} synced to budget`)
      setAllocDialogOpen(false)
      setSelectedAward(null)
      onBudgetSynced?.()
    } catch {
      toast.error("Failed to sync scholarship to budget")
    } finally {
      setSyncing(false)
    }
  }

  const handleSyncAll = async () => {
    if (!planId || semesters.length === 0) {
      toast.error("Create a semester budget first to sync scholarships")
      return
    }
    setSyncing(true)
    try {
      const allAllocations = awards.map((award) => {
        const amount = award.amountAwarded ?? award.scholarshipAmount ?? 0
        const semesterAllocations = award.isRecurring
          ? semesters.map((sem) => ({ semesterId: sem.id, amount: Math.round(amount / semesters.length) }))
          : [{ semesterId: semesters[0].id, amount }]
        return {
          scholarshipAppId: award.id,
          scholarshipName: award.scholarshipName,
          semesterAllocations,
        }
      })

      const res = await fetch("/api/financial/sync-scholarships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allocations: allAllocations }),
      })

      if (!res.ok) throw new Error()
      toast.success(`${awards.length} scholarship(s) synced to budget`)
      onBudgetSynced?.()
    } catch {
      toast.error("Failed to sync scholarships")
    } finally {
      setSyncing(false)
    }
  }

  const allocTotal = Object.values(allocations).reduce((s, a) => s + (a || 0), 0)
  const selectedAmount = selectedAward
    ? (selectedAward.amountAwarded ?? selectedAward.scholarshipAmount ?? 0)
    : 0

  return (
    <>
      <Card variant="bento">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-4 w-4 text-emerald-600" />
              Scholarship Awards
            </CardTitle>
            {planId && semesters.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5"
                onClick={handleSyncAll}
                disabled={syncing}
              >
                {syncing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                Sync All to Budget
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary row */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-emerald-50 p-3 text-center">
              <p className="text-xs text-emerald-600 font-medium">Total Won</p>
              <p className="text-xl font-bold text-emerald-700">{formatTuition(totalAwarded)}</p>
              <p className="text-[10px] text-emerald-600/70">{awards.length} scholarship{awards.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="rounded-lg bg-accent p-3 text-center">
              <p className="text-xs text-blue-600 font-medium">Recurring / Year</p>
              <p className="text-xl font-bold text-blue-700">{formatTuition(recurringTotal)}</p>
              <p className="text-[10px] text-blue-600/70">{recurringAwards.length} recurring</p>
            </div>
            <div className="rounded-lg bg-accent p-3 text-center">
              <p className="text-xs text-secondary-foreground font-medium">4-Year Projected</p>
              <p className="text-xl font-bold text-secondary-foreground">{formatTuition(fourYearProjected)}</p>
              <p className="text-[10px] text-muted-foreground">recurring x4 + one-time</p>
            </div>
          </div>

          {/* Individual awards */}
          <div className="space-y-2">
            {awards.map((award, i) => {
              const amount = award.amountAwarded ?? award.scholarshipAmount ?? 0
              return (
                <motion.div
                  key={award.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className="flex items-center justify-between rounded-lg border p-3 group hover:border-[#2563EB]/20 transition-colors cursor-pointer"
                  onClick={() => {
                    if (planId && semesters.length > 0) openAllocDialog(award)
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 shrink-0">
                      <DollarSign className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{award.scholarshipName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {award.isRecurring ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600">
                            <RefreshCw className="h-2.5 w-2.5" />
                            Recurring
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">One-time</span>
                        )}
                        {planId && semesters.length > 0 && (
                          <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                            Click to allocate to semesters
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-sm font-semibold text-emerald-600">
                      {formatTuition(amount)}
                    </span>
                    {planId && semesters.length > 0 && (
                      <Settings className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Allocation Dialog */}
      <Dialog open={allocDialogOpen} onOpenChange={(open) => { if (!open) { setAllocDialogOpen(false); setSelectedAward(null) } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-4 w-4 text-emerald-600" />
              Allocate: {selectedAward?.scholarshipName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total award amount</span>
              <span className="font-semibold text-emerald-600">{formatCurrency(selectedAmount)}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Allocated so far</span>
              <span className={cn(
                "font-semibold",
                allocTotal > selectedAmount ? "text-rose-600" : allocTotal === selectedAmount ? "text-emerald-600" : "text-foreground"
              )}>
                {formatCurrency(allocTotal)}
                {allocTotal !== selectedAmount && (
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    ({allocTotal > selectedAmount ? "+" : ""}{formatCurrency(allocTotal - selectedAmount)})
                  </span>
                )}
              </span>
            </div>

            {/* Quick actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  const perSem = Math.round(selectedAmount / semesters.length)
                  const newAlloc: Record<string, number> = {}
                  semesters.forEach((sem) => { newAlloc[sem.id] = perSem })
                  setAllocations(newAlloc)
                }}
              >
                Split Evenly
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  const newAlloc: Record<string, number> = {}
                  semesters.forEach((sem) => { newAlloc[sem.id] = 0 })
                  setAllocations(newAlloc)
                }}
              >
                Clear All
              </Button>
            </div>

            {/* Per-semester allocation */}
            <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-3 bg-gray-50/50">
              {semesters.map((sem) => (
                <div key={sem.id} className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium flex-1 truncate">{sem.name}</span>
                  <div className="relative w-28">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                    <Input
                      type="number"
                      min={0}
                      step={100}
                      value={allocations[sem.id] || ""}
                      onChange={(e) => {
                        setAllocations((prev) => ({
                          ...prev,
                          [sem.id]: parseFloat(e.target.value) || 0,
                        }))
                      }}
                      className="h-8 text-xs text-right pl-5 pr-2"
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}
            </div>

            <Button
              className="w-full bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2"
              onClick={handleSyncAllocation}
              disabled={syncing || allocTotal === 0}
            >
              {syncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {syncing ? "Syncing..." : "Save to Budget"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
