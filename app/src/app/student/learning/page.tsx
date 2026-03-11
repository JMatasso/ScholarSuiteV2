"use client"

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

interface LearningModule {
  id: number
  title: string
  description: string
  lessonCount: number
  completedLessons: number
  category: "scholarship_prep" | "college_prep"
  duration: string
  icon: typeof BookOpen
}

const modules: LearningModule[] = [
  {
    id: 1,
    title: "Writing Winning Scholarship Essays",
    description: "Master the art of crafting compelling personal statements and scholarship essays that stand out from thousands of applicants.",
    lessonCount: 8,
    completedLessons: 6,
    category: "scholarship_prep",
    duration: "2.5 hours",
    icon: PenTool,
  },
  {
    id: 2,
    title: "Scholarship Search Strategies",
    description: "Learn how to find scholarships that match your unique profile, including niche awards and local opportunities.",
    lessonCount: 6,
    completedLessons: 6,
    category: "scholarship_prep",
    duration: "1.5 hours",
    icon: Target,
  },
  {
    id: 3,
    title: "Financial Aid 101",
    description: "Understand FAFSA, CSS Profile, grants, loans, and work-study. Build a complete financial strategy for college.",
    lessonCount: 10,
    completedLessons: 4,
    category: "college_prep",
    duration: "3 hours",
    icon: DollarSign,
  },
  {
    id: 4,
    title: "Building a Strong Application",
    description: "From extracurriculars to recommendation letters, learn how to present yourself as a well-rounded candidate.",
    lessonCount: 7,
    completedLessons: 2,
    category: "college_prep",
    duration: "2 hours",
    icon: FileText,
  },
  {
    id: 5,
    title: "Interview Preparation",
    description: "Practice common scholarship interview questions, body language tips, and strategies for virtual and in-person interviews.",
    lessonCount: 5,
    completedLessons: 0,
    category: "scholarship_prep",
    duration: "1.5 hours",
    icon: Lightbulb,
  },
  {
    id: 6,
    title: "College Selection & Fit",
    description: "Research techniques for finding the right college, campus visits, and evaluating academic programs and campus culture.",
    lessonCount: 8,
    completedLessons: 0,
    category: "college_prep",
    duration: "2.5 hours",
    icon: GraduationCap,
  },
]

const categoryColors = {
  scholarship_prep: "bg-blue-50 text-blue-700 border-blue-200",
  college_prep: "bg-purple-50 text-purple-700 border-purple-200",
}

const categoryLabels = {
  scholarship_prep: "Scholarship Prep",
  college_prep: "College Prep",
}

export default function LearningPage() {
  const totalLessons = modules.reduce((a, m) => a + m.lessonCount, 0)
  const completedLessons = modules.reduce((a, m) => a + m.completedLessons, 0)
  const overallProgress = Math.round((completedLessons / totalLessons) * 100)

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

      {/* Category filter note */}
      <div className="flex items-center gap-3">
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${categoryColors.scholarship_prep}`}>
          Scholarship Prep
        </span>
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${categoryColors.college_prep}`}>
          College Prep
        </span>
      </div>

      {/* Module grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((mod) => {
          const Icon = mod.icon
          const progress = Math.round((mod.completedLessons / mod.lessonCount) * 100)
          const isComplete = mod.completedLessons === mod.lessonCount
          const isStarted = mod.completedLessons > 0

          return (
            <Card key={mod.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1E3A5F]/10">
                    <Icon className="h-5 w-5 text-[#1E3A5F]" />
                  </div>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${categoryColors[mod.category]}`}>
                    {categoryLabels[mod.category]}
                  </span>
                </div>
                <CardTitle className="text-sm mt-2">{mod.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground line-clamp-2">{mod.description}</p>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {mod.lessonCount} lessons
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {mod.duration}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {mod.completedLessons}/{mod.lessonCount} completed
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
    </div>
  )
}
