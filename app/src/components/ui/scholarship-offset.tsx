"use client"

import { motion } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatTuition } from "@/lib/college-utils"
import {
  Award,
  RefreshCw,
  DollarSign,
} from "lucide-react"

interface AwardedScholarship {
  id: string
  scholarshipName: string
  amountAwarded: number | null
  scholarshipAmount: number | null
  isRecurring: boolean
}

interface ScholarshipOffsetProps {
  awards: AwardedScholarship[]
}

export function ScholarshipOffset({ awards }: ScholarshipOffsetProps) {
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

  return (
    <Card variant="bento">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Award className="h-4 w-4 text-emerald-600" />
          Scholarship Awards
        </CardTitle>
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
                className="flex items-center justify-between rounded-lg border p-3"
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
                    </div>
                  </div>
                </div>
                <span className="text-sm font-semibold text-emerald-600 shrink-0 ml-2">
                  {formatTuition(amount)}
                </span>
              </motion.div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
