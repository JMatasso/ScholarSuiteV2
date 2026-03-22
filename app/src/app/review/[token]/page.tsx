"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { motion } from "motion/react"
import { Star, Send, CheckCircle2, AlertCircle } from "@/lib/icons"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface ReviewInfo {
  name: string
  role: string
  campaignName: string
  campaignMessage: string | null
}

const areaLabels = [
  { key: "mentoring", label: "Mentoring & Guidance" },
  { key: "scholarshipHelp", label: "Scholarship Assistance" },
  { key: "essaySupport", label: "Essay Support" },
  { key: "collegePrep", label: "College Preparation" },
  { key: "communication", label: "Communication" },
] as const

function StarRating({
  value,
  onChange,
  size = "lg",
}: {
  value: number
  onChange: (v: number) => void
  size?: "sm" | "lg"
}) {
  const [hover, setHover] = useState(0)
  const sz = size === "lg" ? "h-8 w-8" : "h-5 w-5"
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`${sz} transition-colors ${
              star <= (hover || value)
                ? "fill-amber-400 text-amber-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  )
}

function NpsSelector({
  value,
  onChange,
}: {
  value: number | null
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex gap-1.5 flex-wrap">
        {Array.from({ length: 11 }, (_, i) => i).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-all ${
              value === n
                ? "bg-[#2563EB] text-white shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Not at all likely</span>
        <span>Extremely likely</span>
      </div>
    </div>
  )
}

export default function ReviewPage() {
  const params = useParams()
  const token = params.token as string
  const [info, setInfo] = useState<ReviewInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [overallRating, setOverallRating] = useState(0)
  const [npsScore, setNpsScore] = useState<number | null>(null)
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null)
  const [mostHelpful, setMostHelpful] = useState("")
  const [improvements, setImprovements] = useState("")
  const [testimonial, setTestimonial] = useState("")
  const [areaRatings, setAreaRatings] = useState<Record<string, number>>({})

  useEffect(() => {
    fetch(`/api/reviews/${token}`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) {
          if (data.error === "already_submitted") {
            setAlreadySubmitted(true)
            setInfo({ name: data.name, role: "", campaignName: "", campaignMessage: null })
          } else {
            setError(data.error || "Invalid link")
          }
          return
        }
        setInfo(data)
      })
      .catch(() => setError("Unable to load survey"))
      .finally(() => setLoading(false))
  }, [token])

  const handleSubmit = async () => {
    if (overallRating === 0) {
      toast.error("Please provide an overall rating")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/reviews/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overallRating,
          npsScore,
          wouldRecommend,
          mostHelpful: mostHelpful || null,
          improvements: improvements || null,
          testimonial: testimonial || null,
          ...areaRatings,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to submit")
      }
      setSubmitted(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit review")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading survey...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex size-14 items-center justify-center rounded-xl bg-rose-100">
              <AlertCircle className="size-6 text-rose-600" />
            </div>
          </div>
          <h1 className="text-xl font-semibold text-secondary-foreground">Link Not Found</h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            This review link is invalid or has expired. Please check your email for the correct link.
          </p>
        </div>
      </div>
    )
  }

  if (alreadySubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex size-14 items-center justify-center rounded-xl bg-emerald-100">
              <CheckCircle2 className="size-6 text-emerald-600" />
            </div>
          </div>
          <h1 className="text-xl font-semibold text-secondary-foreground">Already Submitted</h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            Thank you, {info?.name}! You&apos;ve already submitted your feedback.
          </p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-4"
        >
          <div className="flex justify-center">
            <div className="flex size-14 items-center justify-center rounded-xl bg-emerald-100">
              <CheckCircle2 className="size-6 text-emerald-600" />
            </div>
          </div>
          <h1 className="text-xl font-semibold text-secondary-foreground">Thank You!</h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            Your feedback has been submitted. Thank you for helping us improve ScholarSuite!
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-2xl space-y-8"
      >
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-[#1E3A5F] text-white font-semibold text-lg">
              S
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-secondary-foreground">
            {info?.campaignName || "Graduation Review"}
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {info?.campaignMessage ||
              "We'd love to hear about your experience. Your feedback helps us improve for future students and families."}
          </p>
          <p className="text-xs text-muted-foreground">
            Responding as <span className="font-medium text-muted-foreground">{info?.name}</span>
          </p>
        </div>

        {/* Overall Rating */}
        <div className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-gray-200/60 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-secondary-foreground uppercase tracking-wide">
              Overall Experience
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              How would you rate your overall experience with ScholarSuite?
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StarRating value={overallRating} onChange={setOverallRating} />
            {overallRating > 0 && (
              <span className="text-sm font-medium text-muted-foreground">
                {overallRating}/5
              </span>
            )}
          </div>
        </div>

        {/* Area Ratings */}
        <div className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-gray-200/60 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-secondary-foreground uppercase tracking-wide">
              Rate Specific Areas
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Optional — rate the areas you experienced.</p>
          </div>
          <div className="space-y-4">
            {areaLabels.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{label}</span>
                <StarRating
                  size="sm"
                  value={areaRatings[key] || 0}
                  onChange={(v) =>
                    setAreaRatings((prev) => ({ ...prev, [key]: v }))
                  }
                />
              </div>
            ))}
          </div>
        </div>

        {/* NPS */}
        <div className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-gray-200/60 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-secondary-foreground uppercase tracking-wide">
              Net Promoter Score
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              How likely are you to recommend ScholarSuite to a friend or family member?
            </p>
          </div>
          <NpsSelector value={npsScore} onChange={setNpsScore} />
        </div>

        {/* Would Recommend */}
        <div className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-gray-200/60 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-secondary-foreground uppercase tracking-wide">
              Would You Recommend Us?
            </h2>
          </div>
          <div className="flex gap-3">
            {[true, false].map((val) => (
              <button
                key={String(val)}
                type="button"
                onClick={() => setWouldRecommend(val)}
                className={`flex-1 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                  wouldRecommend === val
                    ? val
                      ? "bg-emerald-50 text-emerald-700 ring-2 ring-emerald-200"
                      : "bg-rose-50 text-rose-700 ring-2 ring-rose-200"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                {val ? "Yes, absolutely!" : "Not really"}
              </button>
            ))}
          </div>
        </div>

        {/* Open-ended Questions */}
        <div className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-gray-200/60 space-y-5">
          <h2 className="text-sm font-semibold text-secondary-foreground uppercase tracking-wide">
            Tell Us More
          </h2>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              What was most helpful about your experience?
            </label>
            <Textarea
              placeholder="The scholarship matching was incredibly helpful..."
              value={mostHelpful}
              onChange={(e) => setMostHelpful(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              What could we improve?
            </label>
            <Textarea
              placeholder="I wish there was more..."
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Would you like to share a testimonial? (May be used with your permission)
            </label>
            <Textarea
              placeholder="ScholarSuite helped me..."
              value={testimonial}
              onChange={(e) => setTestimonial(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-center pb-8">
          <Button
            onClick={handleSubmit}
            disabled={submitting || overallRating === 0}
            className="gap-2 px-8 py-3 text-base"
          >
            {submitting ? (
              "Submitting..."
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Feedback
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
