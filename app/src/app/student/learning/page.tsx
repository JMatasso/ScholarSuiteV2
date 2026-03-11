"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  BookOpen,
  Play,
  CheckCircle2,
  Clock,
  GraduationCap,
  FileText,
  Target,
  Lightbulb,
  PenTool,
  DollarSign,
} from "lucide-react"

interface LearningProgress {
  id: string
  isCompleted: boolean
}

interface Lesson {
  id: string
  title: string
  order: number
  progress: LearningProgress[]
}

interface LearningModule {
  id: string
  title: string
  description: string | null
  icon: string | null
  category: string | null
  order: number
  lessons: Lesson[]
}

const categoryColors: Record<string, string> = {
  scholarship_prep: "bg-blue-50 text-blue-700 border-blue-200",
  college_prep: "bg-purple-50 text-purple-700 border-purple-200",
}

const categoryLabels: Record<string, string> = {
  scholarship_prep: "Scholarship Prep",
  college_prep: "College Prep",
}

// Map icon string to Lucide component
function getModuleIcon(iconName: string | null) {
  const iconMap: Record<string, typeof BookOpen> = {
    PenTool,
    Target,
    DollarSign,
    FileText,
    Lightbulb,
    GraduationCap,
    BookOpen,
  }
  return iconName && iconMap[iconName] ? iconMap[iconName] : BookOpen
}

function getCompletedCount(module: LearningModule): number {
  return module.lessons.filter((l) => l.progress.length > 0 && l.progress[0].isCompleted).length
}

export default function LearningPage() {
  const [modules, setModules] = useState<LearningModule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/learning")
      .then((res) => res.json())
      .then((data) => {
        setModules(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const totalLessons = modules.reduce((a, m) => a + m.lessons.length, 0)
  const completedLessons = modules.reduce((a, m) => a + getCompletedCount(m), 0)
  const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <p className="text-sm">Loading learning modules...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1E3A5F]">Learning</h1>
        <p className="mt-1 text-muted-foreground">
          Build your scholarship and college preparation knowledge.
        </p>
      </div>

      {/* Overall progress */}
      <Card>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <BookOpen className="h-5 w-5 text-[#2563EB]" />
              </div>
              <div>
                <p className="text-sm font-medium">Overall Progress</p>
                <p className="text-xs text-muted-foreground">
                  {completedLessons} of {totalLessons} lessons completed
                </p>
              </div>
            </div>
            <span className="text-2xl font-bold text-[#1E3A5F]">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} />
        </CardContent>
      </Card>

      {/* Category legend */}
      <div className="flex items-center gap-3">
        {Object.entries(categoryColors).map(([key, color]) => (
          <span key={key} className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${color}`}>
            {categoryLabels[key] ?? key}
          </span>
        ))}
      </div>

      {/* Module grid */}
      {modules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <BookOpen className="h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm">No learning modules available yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod) => {
            const Icon = getModuleIcon(mod.icon)
            const completedCount = getCompletedCount(mod)
            const lessonCount = mod.lessons.length
            const progress = lessonCount > 0 ? Math.round((completedCount / lessonCount) * 100) : 0
            const isComplete = completedCount === lessonCount && lessonCount > 0
            const isStarted = completedCount > 0
            const category = mod.category ?? "scholarship_prep"
            const catColor = categoryColors[category] ?? categoryColors.scholarship_prep
            const catLabel = categoryLabels[category] ?? category

            return (
              <Card key={mod.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1E3A5F]/10">
                      <Icon className="h-5 w-5 text-[#1E3A5F]" />
                    </div>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${catColor}`}>
                      {catLabel}
                    </span>
                  </div>
                  <CardTitle className="text-sm mt-2">{mod.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground line-clamp-2">{mod.description ?? ""}</p>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {lessonCount} lessons
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {completedCount}/{lessonCount} completed
                      </span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isComplete ? "bg-emerald-500" : "bg-[#2563EB]"}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <Button
                    variant={isComplete ? "outline" : "default"}
                    size="sm"
                    className={`w-full gap-2 ${!isComplete ? "bg-[#2563EB] hover:bg-[#2563EB]/90" : ""}`}
                  >
                    {isComplete ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Review Module
                      </>
                    ) : isStarted ? (
                      <>
                        <Play className="h-3.5 w-3.5" />
                        Continue
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5" />
                        Start Module
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
