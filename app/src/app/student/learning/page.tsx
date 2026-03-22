"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { JourneyTimeline } from "@/components/ui/journey-timeline"
import { JOURNEY_STAGE_LABELS } from "@/lib/constants"
import { GraduationCap, DollarSign, BookOpen, ArrowRight, CheckCircle2, Sparkles, Target } from "lucide-react"
import { LearningChatWidget } from "@/components/ui/learning-chat-widget"

interface LessonProgress {
  id: string
  isCompleted: boolean
}

interface Lesson {
  id: string
  progress: LessonProgress[]
}

interface LearningModule {
  id: string
  subject: string
  lessons: Lesson[]
}

interface SubjectStats {
  totalModules: number
  totalLessons: number
  completedLessons: number
  percentage: number
}

function computeStats(modules: LearningModule[], subject: string): SubjectStats {
  const filtered = modules.filter((m) => m.subject === subject)
  const totalModules = filtered.length
  let totalLessons = 0
  let completedLessons = 0
  for (const m of filtered) {
    for (const l of m.lessons) {
      totalLessons++
      if (l.progress?.some((p) => p.isCompleted)) completedLessons++
    }
  }
  return {
    totalModules,
    totalLessons,
    completedLessons,
    percentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
  }
}

function ProgressRing({ percentage, color }: { percentage: number; color: string }) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative flex items-center justify-center">
      <svg className="size-24 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-muted" />
        <motion.circle
          cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <span className="absolute text-lg font-bold text-foreground">{percentage}%</span>
    </div>
  )
}

export default function LearningDashboard() {
  const [modules, setModules] = useState<LearningModule[]>([])
  const [timelineData, setTimelineData] = useState<{ journeyStage: string; tasksByStage: Record<string, { total: number; completed: number }> } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/learning").then((r) => r.json()).catch(() => []),
      fetch("/api/timeline").then((r) => r.json()).catch(() => null),
    ]).then(([data, tl]) => {
      setModules(Array.isArray(data) ? data : [])
      setTimelineData(tl && tl.journeyStage ? tl : null)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 sm:grid-cols-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    )
  }

  const collegeStats = computeStats(modules, "COLLEGE_PREP")
  const scholarshipStats = computeStats(modules, "SCHOLARSHIP")

  return (
    <div className="space-y-6">
      <PageHeader
        title="Learning Hub"
        description="Master the college admissions and scholarship process."
        actions={
          <Link href="/student/learning/ask">
            <Button variant="outline" size="sm" className="gap-2">
              <Sparkles className="h-3.5 w-3.5 text-[#2563EB]" /> Ask Advisor
            </Button>
          </Link>
        }
      />

      {/* Journey Stage + Timeline */}
      {timelineData && (() => {
        const stageInfo = JOURNEY_STAGE_LABELS[timelineData.journeyStage]
        return (
          <>
            {stageInfo && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <Card variant="bento" className="border-[#2563EB]/20 bg-accent/30">
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2563EB]/10 ring-2 ring-[#2563EB]/20">
                        <Target className="h-5 w-5 text-[#2563EB]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-secondary-foreground">{stageInfo.label}</p>
                        <p className="text-xs text-muted-foreground">{stageInfo.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card variant="bento">
                <CardHeader>
                  <CardTitle className="text-sm">4-Year Journey</CardTitle>
                  <p className="text-xs text-muted-foreground">Click a year to see what to expect, your checklist, and the scholarship timeline.</p>
                </CardHeader>
                <CardContent>
                  <JourneyTimeline
                    currentStage={timelineData.journeyStage}
                    taskCounts={timelineData.tasksByStage}
                    role="STUDENT"
                    expandable
                  />
                </CardContent>
              </Card>
            </motion.div>
          </>
        )
      })()}

      {/* Overall progress */}
      <div className="flex items-center gap-3 rounded-lg bg-card p-4 ring-1 ring-foreground/5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
          <BookOpen className="h-5 w-5 text-secondary-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            {collegeStats.completedLessons + scholarshipStats.completedLessons} of{" "}
            {collegeStats.totalLessons + scholarshipStats.totalLessons} lessons completed
          </p>
          <p className="text-xs text-muted-foreground">
            {collegeStats.totalModules + scholarshipStats.totalModules} modules across both subjects
          </p>
        </div>
        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
      </div>

      {/* Two-pillar split */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* College Prep */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/student/learning/college" className="block group">
            <Card variant="bento" className="h-full">
              <CardContent className="flex flex-col items-center py-8 px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 mb-4">
                  <GraduationCap className="h-7 w-7 text-purple-700" />
                </div>
                <h2 className="text-lg font-semibold text-secondary-foreground mb-1">College Prep</h2>
                <p className="text-xs text-muted-foreground mb-6">
                  Everything about getting into the right school
                </p>
                <ProgressRing percentage={collegeStats.percentage} color="#7c3aed" />
                <div className="mt-4 space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {collegeStats.completedLessons}/{collegeStats.totalLessons} lessons
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {collegeStats.totalModules} modules
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-[#2563EB] group-hover:gap-2 transition-all">
                  Explore <ArrowRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        {/* Scholarship Mastery */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Link href="/student/learning/scholarships" className="block group">
            <Card variant="bento" className="h-full">
              <CardContent className="flex flex-col items-center py-8 px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 mb-4">
                  <DollarSign className="h-7 w-7 text-blue-700" />
                </div>
                <h2 className="text-lg font-semibold text-secondary-foreground mb-1">Scholarship Mastery</h2>
                <p className="text-xs text-muted-foreground mb-6">
                  Finding and winning scholarships
                </p>
                <ProgressRing percentage={scholarshipStats.percentage} color="#2563eb" />
                <div className="mt-4 space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {scholarshipStats.completedLessons}/{scholarshipStats.totalLessons} lessons
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {scholarshipStats.totalModules} modules
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-[#2563EB] group-hover:gap-2 transition-all">
                  Explore <ArrowRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      </div>

      <LearningChatWidget />
    </div>
  )
}
