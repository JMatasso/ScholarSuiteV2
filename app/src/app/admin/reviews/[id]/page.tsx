"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "motion/react"
import {
  ArrowLeft,
  Star,
  BarChart3,
  ThumbsUp,
  Users,
  Mail,
  Clock,
  CheckCircle2,
  Flag,
  Download,
} from "@/lib/icons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatCard } from "@/components/ui/stat-card"
import { EmptyState } from "@/components/ui/empty-state"
import { toast } from "sonner"
import { formatDate } from "@/lib/format"

interface CampaignDetail {
  id: string
  name: string
  message: string | null
  createdAt: string
  stats: {
    avgRating: number
    nps: number | null
    responseCount: number
    responseRate: number
    wouldRecommend: number
    wouldRecommendRate: number
  }
  requests: {
    id: string
    recipientName: string
    recipientEmail: string
    recipientRole: string
    status: string
    sentAt: string | null
    completedAt: string | null
    response: {
      id: string
      overallRating: number
      npsScore: number | null
      wouldRecommend: boolean | null
      mostHelpful: string | null
      improvements: string | null
      testimonial: string | null
      mentoring: number | null
      scholarshipHelp: number | null
      essaySupport: number | null
      collegePrep: number | null
      communication: number | null
      isFlagged: boolean
      createdAt: string
    } | null
  }[]
}

const statusColors: Record<string, string> = {
  PENDING: "bg-muted text-muted-foreground",
  SENT: "bg-blue-100 text-blue-700",
  OPENED: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  EXPIRED: "bg-rose-100 text-rose-700",
}

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3.5 w-3.5 ${
            s <= count ? "fill-amber-400 text-amber-400" : "text-gray-200"
          }`}
        />
      ))}
    </div>
  )
}

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchCampaign = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews/campaigns/${id}`)
      if (!res.ok) throw new Error("Not found")
      setCampaign(await res.json())
    } catch {
      toast.error("Failed to load campaign")
      router.push("/admin/reviews")
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => {
    fetchCampaign()
  }, [fetchCampaign])

  const handleFlag = async (responseId: string, currentFlag: boolean) => {
    // Optimistic update
    setCampaign((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        requests: prev.requests.map((r) =>
          r.response?.id === responseId
            ? { ...r, response: { ...r.response!, isFlagged: !currentFlag } }
            : r
        ),
      }
    })
    toast.success(currentFlag ? "Unflagged response" : "Flagged as notable")
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  if (!campaign) return null

  const completedRequests = campaign.requests.filter(
    (r) => r.status === "COMPLETED"
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.push("/admin/reviews")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-secondary-foreground">
              {campaign.name}
            </h1>
            <p className="mt-1 text-muted-foreground">
              Sent {formatDate(campaign.createdAt)} &middot;{" "}
              {campaign.requests.length} recipients
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => window.open("/api/reviews/export", "_blank")}
        >
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Avg Rating"
          value={`${campaign.stats.avgRating} / 5`}
          icon={Star}
          index={0}
        />
        <StatCard
          title="NPS Score"
          value={campaign.stats.nps != null ? campaign.stats.nps : "—"}
          description={campaign.stats.nps != null ? (campaign.stats.nps >= 50 ? "Excellent" : campaign.stats.nps >= 0 ? "Good" : "Needs improvement") : "No data yet"}
          icon={BarChart3}
          index={1}
        />
        <StatCard
          title="Response Rate"
          value={`${campaign.stats.responseRate}%`}
          description={`${campaign.stats.responseCount} of ${campaign.requests.length}`}
          icon={Users}
          index={2}
        />
        <StatCard
          title="Would Recommend"
          value={`${campaign.stats.wouldRecommendRate}%`}
          description={`${campaign.stats.wouldRecommend} respondents`}
          icon={ThumbsUp}
          index={3}
        />
      </div>

      {/* Recipients & Responses */}
      <div>
        <h2 className="text-sm font-semibold text-secondary-foreground uppercase tracking-wide mb-3">
          Responses ({completedRequests.length})
        </h2>
        {completedRequests.length === 0 ? (
          <EmptyState
            icon={Mail}
            title="No responses yet"
            description="Recipients haven't submitted their feedback yet. Responses will appear here as they come in."
          />
        ) : (
          <div className="space-y-3">
            {completedRequests.map((req, idx) => {
              const r = req.response!
              const isExpanded = expandedId === req.id
              return (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="rounded-xl bg-card overflow-hidden transform-gpu [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] transition-all duration-300 hover:[box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_4px_8px_rgba(0,0,0,.07),0_16px_32px_rgba(0,0,0,.07)]"
                >
                  <button
                    onClick={() =>
                      setExpandedId(isExpanded ? null : req.id)
                    }
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/50/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex size-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-secondary-foreground">
                        {req.recipientName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-secondary-foreground">
                            {req.recipientName}
                          </span>
                          <Badge
                            variant="secondary"
                            className="text-[10px] bg-muted text-muted-foreground"
                          >
                            {req.recipientRole}
                          </Badge>
                          {r.isFlagged && (
                            <Flag className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {req.recipientEmail} &middot; Submitted{" "}
                          {formatDate(r.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Stars count={r.overallRating} />
                      {r.npsScore != null && (
                        <Badge
                          variant="secondary"
                          className={
                            r.npsScore >= 9
                              ? "bg-emerald-100 text-emerald-700"
                              : r.npsScore >= 7
                              ? "bg-amber-100 text-amber-700"
                              : "bg-rose-100 text-rose-700"
                          }
                        >
                          NPS: {r.npsScore}
                        </Badge>
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border px-5 pb-5"
                    >
                      <div className="pt-4 space-y-4">
                        {/* Area Ratings */}
                        {(r.mentoring || r.scholarshipHelp || r.essaySupport || r.collegePrep || r.communication) && (
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {[
                              { label: "Mentoring", val: r.mentoring },
                              { label: "Scholarship Help", val: r.scholarshipHelp },
                              { label: "Essay Support", val: r.essaySupport },
                              { label: "College Prep", val: r.collegePrep },
                              { label: "Communication", val: r.communication },
                            ]
                              .filter((a) => a.val != null)
                              .map((a) => (
                                <div
                                  key={a.label}
                                  className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                                >
                                  <span className="text-xs text-muted-foreground">
                                    {a.label}
                                  </span>
                                  <Stars count={a.val!} />
                                </div>
                              ))}
                          </div>
                        )}

                        {/* Would Recommend */}
                        {r.wouldRecommend != null && (
                          <div className="flex items-center gap-2 text-sm">
                            <ThumbsUp
                              className={`h-4 w-4 ${
                                r.wouldRecommend
                                  ? "text-emerald-600"
                                  : "text-rose-600"
                              }`}
                            />
                            <span className="text-foreground">
                              {r.wouldRecommend
                                ? "Would recommend"
                                : "Would not recommend"}
                            </span>
                          </div>
                        )}

                        {/* Text Responses */}
                        {r.mostHelpful && (
                          <div className="space-y-1">
                            <h4 className="text-xs font-medium text-muted-foreground">
                              Most Helpful
                            </h4>
                            <p className="text-sm text-foreground bg-muted/50 rounded-lg p-3">
                              {r.mostHelpful}
                            </p>
                          </div>
                        )}
                        {r.improvements && (
                          <div className="space-y-1">
                            <h4 className="text-xs font-medium text-muted-foreground">
                              Suggestions for Improvement
                            </h4>
                            <p className="text-sm text-foreground bg-muted/50 rounded-lg p-3">
                              {r.improvements}
                            </p>
                          </div>
                        )}
                        {r.testimonial && (
                          <div className="space-y-1">
                            <h4 className="text-xs font-medium text-muted-foreground">
                              Testimonial
                            </h4>
                            <p className="text-sm text-foreground bg-emerald-50 rounded-lg p-3 italic border border-emerald-100">
                              &ldquo;{r.testimonial}&rdquo;
                            </p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`gap-1.5 ${
                              r.isFlagged
                                ? "text-amber-600"
                                : "text-muted-foreground"
                            }`}
                            onClick={() => handleFlag(r.id, r.isFlagged)}
                          >
                            <Flag
                              className={`h-3.5 w-3.5 ${
                                r.isFlagged ? "fill-amber-400" : ""
                              }`}
                            />
                            {r.isFlagged ? "Flagged" : "Flag as Notable"}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pending Recipients */}
      {campaign.requests.filter((r) => r.status !== "COMPLETED").length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-secondary-foreground uppercase tracking-wide mb-3">
            Pending ({campaign.requests.filter((r) => r.status !== "COMPLETED").length})
          </h2>
          <div className="rounded-xl bg-card divide-y divide-gray-100 transform-gpu [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] transition-all duration-300 hover:[box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_4px_8px_rgba(0,0,0,.07),0_16px_32px_rgba(0,0,0,.07)]">
            {campaign.requests
              .filter((r) => r.status !== "COMPLETED")
              .map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                      {req.recipientName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {req.recipientName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {req.recipientEmail}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={statusColors[req.status] || "bg-muted text-muted-foreground"}
                    >
                      {req.status === "SENT" && (
                        <Clock className="h-3 w-3 mr-1" />
                      )}
                      {req.status === "OPENED" && (
                        <Mail className="h-3 w-3 mr-1" />
                      )}
                      {req.status === "COMPLETED" && (
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                      )}
                      {req.status.charAt(0) + req.status.slice(1).toLowerCase()}
                    </Badge>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
