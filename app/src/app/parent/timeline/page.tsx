"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { JourneyTimeline } from "@/components/ui/journey-timeline"
import { ScholarshipPipeline } from "@/components/ui/scholarship-pipeline"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { JOURNEY_STAGE_LABELS } from "@/lib/constants"
import { Skeleton } from "@/components/ui/skeleton"
import { Target } from "lucide-react"

interface LinkedStudent {
  id: string
  name: string | null
  email: string
}

interface TimelineData {
  journeyStage: string
  serviceTier: string | null
  gradeLevel: number | null
  tasksByStage: Record<string, { total: number; completed: number }>
  applications: Array<{
    id: string
    status: string
    amountAwarded?: number | null
    scholarship: { name: string; amount?: number | null; deadline?: string | null }
    createdAt: string
    updatedAt: string
  }>
}

export default function ParentTimelinePage() {
  const [students, setStudents] = useState<LinkedStudent[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string>("")
  const [data, setData] = useState<TimelineData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timelineLoading, setTimelineLoading] = useState(false)

  // Load linked students
  useEffect(() => {
    fetch("/api/students")
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d) ? d : []
        setStudents(list)
        if (list.length > 0) {
          setSelectedStudentId(list[0].id)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Load timeline for selected student
  useEffect(() => {
    if (!selectedStudentId) return
    setTimelineLoading(true)
    fetch(`/api/timeline?studentId=${selectedStudentId}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setTimelineLoading(false)
      })
      .catch(() => setTimelineLoading(false))
  }, [selectedStudentId])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    )
  }

  if (students.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Timeline" description="Track your student's college journey." />
        <p className="text-sm text-muted-foreground">No linked students found.</p>
      </div>
    )
  }

  const selectedStudent = students.find((s) => s.id === selectedStudentId)
  const stageInfo = data ? JOURNEY_STAGE_LABELS[data.journeyStage] : null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Timeline"
        description="Track your student's progress through the college and scholarship process."
        actions={
          students.length > 1 ? (
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name || s.email}
                </option>
              ))}
            </select>
          ) : undefined
        }
      />

      {timelineLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : (
        <>
          {/* Current stage banner */}
          {stageInfo && (
            <Card className="border-[#2563EB]/20 bg-blue-50/30">
              <CardContent className="pt-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2563EB]/10 ring-2 ring-[#2563EB]/20">
                    <Target className="h-5 w-5 text-[#2563EB]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1E3A5F]">
                      {selectedStudent?.name || "Student"} — {stageInfo.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{stageInfo.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Journey stepper */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">4-Year Journey</CardTitle>
            </CardHeader>
            <CardContent>
              <JourneyTimeline
                currentStage={data?.journeyStage || "EARLY_EXPLORATION"}
                taskCounts={data?.tasksByStage}
              />
            </CardContent>
          </Card>

          {/* Scholarship pipeline */}
          <div>
            <h2 className="mb-3 text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide">
              Scholarship Pipeline
            </h2>
            <ScholarshipPipeline applications={data?.applications || []} />
          </div>
        </>
      )}
    </div>
  )
}
