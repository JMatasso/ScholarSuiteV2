"use client"

import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Award, DollarSign, Calendar, Trophy } from "lucide-react"

interface AwardedApp {
  id: string
  status: string
  amountAwarded: number | null
  scholarship: {
    name: string
    provider: string | null
    amount: number | null
    deadline: string | null
  }
  updatedAt: string
}

export default function AwardsPage() {
  const [awards, setAwards] = useState<AwardedApp[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/applications")
      .then((r) => r.json())
      .then((data) => {
        const awarded = (Array.isArray(data) ? data : []).filter(
          (a: AwardedApp) => a.status === "AWARDED"
        )
        setAwards(awarded)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const totalAwarded = awards.reduce(
    (sum, a) => sum + (a.amountAwarded || a.scholarship.amount || 0),
    0
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Won Awards"
        description="Scholarships you've been awarded. This is your ROI."
      />

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card variant="bento" className="border-emerald-200 bg-emerald-50/30">
          <CardContent className="pt-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                <DollarSign className="h-5 w-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700">
                  ${totalAwarded.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Total Awarded</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="bento">
          <CardContent className="pt-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1E3A5F]/10">
                <Trophy className="h-5 w-5 text-[#1E3A5F]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1E3A5F]">{awards.length}</p>
                <p className="text-xs text-muted-foreground">Scholarships Won</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Awards list */}
      {awards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Award className="h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm font-medium">No awards yet</p>
          <p className="text-xs mt-1">
            Keep applying — awarded scholarships will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {awards.map((award, index) => (
            <motion.div
              key={award.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
            >
              <Card variant="bento" className="border-emerald-200/50">
                <CardContent className="pt-0">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                      <Award className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {award.scholarship.name}
                      </p>
                      {award.scholarship.provider && (
                        <p className="text-xs text-muted-foreground">
                          {award.scholarship.provider}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-emerald-700">
                        ${(award.amountAwarded || award.scholarship.amount || 0).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                        <Calendar className="h-3 w-3" />
                        {new Date(award.updatedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
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
