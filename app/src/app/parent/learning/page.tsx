"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { LearningCategoryGrid } from "@/components/ui/learning-category-grid"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { GraduationCap, DollarSign, BookOpen, ChevronDown } from "lucide-react"
import { motion } from "motion/react"
import { getInitials } from "@/lib/format"

interface Student {
  id: string
  name?: string
  email: string
  image?: string | null
  school?: { name: string }
}

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
  title: string
  description: string | null
  icon: string | null
  imageUrl: string | null
  category: string | null
  subject: string
  order: number
  lessons: Lesson[]
}

function ProgressRing({ percentage, color }: { percentage: number; color: string }) {
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference
  return (
    <div className="relative flex items-center justify-center">
      <svg className="size-20 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-gray-200" />
        <motion.circle cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <span className="absolute text-base font-bold text-foreground">{percentage}%</span>
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 skeleton-shimmer" />
        <Skeleton className="h-4 w-72 skeleton-shimmer" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-36 rounded-xl skeleton-shimmer" />
        <Skeleton className="h-36 rounded-xl skeleton-shimmer" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl skeleton-shimmer" />
        ))}
      </div>
    </div>
  )
}

export default function ParentLearningPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [modules, setModules] = useState<LearningModule[]>([])
  const [loading, setLoading] = useState(true)
  const [modulesLoading, setModulesLoading] = useState(false)
  const [activeSubject, setActiveSubject] = useState<"COLLEGE_PREP" | "SCHOLARSHIP">("COLLEGE_PREP")

  // Fetch linked students
  useEffect(() => {
    fetch("/api/students")
      .then(r => r.json())
      .then(data => {
        const list: Student[] = Array.isArray(data) ? data : []
        setStudents(list)
        if (list.length > 0) {
          setSelectedStudent(list[0])
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Fetch learning modules when student changes
  useEffect(() => {
    if (!selectedStudent) return
    setModulesLoading(true)
    fetch(`/api/learning?studentId=${selectedStudent.id}`)
      .then(r => r.json())
      .then(data => {
        setModules(Array.isArray(data) ? data : [])
        setModulesLoading(false)
      })
      .catch(() => {
        setModules([])
        setModulesLoading(false)
      })
  }, [selectedStudent])

  if (loading) return <PageSkeleton />

  if (!selectedStudent) {
    return (
      <div className="space-y-6">
        <PageHeader title="Learning Library" description="Browse learning content and track your student's progress." />
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <BookOpen className="h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm">No linked student found.</p>
        </div>
      </div>
    )
  }

  // Split modules by subject
  const collegePrepModules = modules.filter(m => m.subject === "COLLEGE_PREP")
  const scholarshipModules = modules.filter(m => m.subject === "SCHOLARSHIP")

  // Calculate progress
  function getProgress(subjectModules: LearningModule[]) {
    let total = 0
    let completed = 0
    for (const mod of subjectModules) {
      for (const lesson of mod.lessons) {
        total++
        if (lesson.progress?.some(p => p.isCompleted)) completed++
      }
    }
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
    return { total, completed, percentage }
  }

  const collegePrepProgress = getProgress(collegePrepModules)
  const scholarshipProgress = getProgress(scholarshipModules)

  const activeModules = activeSubject === "COLLEGE_PREP" ? collegePrepModules : scholarshipModules
  const avatar = getInitials(selectedStudent.name)

  return (
    <div className="space-y-6">
      {/* Header with student selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1E3A5F]">Learning Library</h1>
          <p className="mt-1 text-muted-foreground">Browse learning content and track your student&apos;s progress.</p>
        </div>
        {students.length > 1 && (
          <div className="relative">
            <button
              onClick={() => setSelectorOpen(!selectorOpen)}
              className="flex items-center gap-3 rounded-2xl bg-card px-4 py-2.5 shadow-lg shadow-black/[0.04] ring-1 ring-white/60 hover:shadow-xl transition-all duration-200"
            >
              <Avatar size="sm">
                {selectedStudent.image && <AvatarImage src={selectedStudent.image} alt={selectedStudent.name ?? selectedStudent.email} />}
                <AvatarFallback className="bg-[#2563EB]/10 text-[#2563EB] text-xs font-semibold">{avatar}</AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">{selectedStudent.name ?? selectedStudent.email}</p>
                <p className="text-[11px] text-muted-foreground">{selectedStudent.school?.name ?? "Student"}</p>
              </div>
              <ChevronDown className="size-4 text-muted-foreground" />
            </button>
            {selectorOpen && (
              <div className="absolute right-0 top-full mt-2 w-full rounded-2xl bg-card py-1 shadow-xl ring-1 ring-white/60 z-50">
                {students.map(student => (
                  <button
                    key={student.id}
                    onClick={() => { setSelectedStudent(student); setSelectorOpen(false) }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors rounded-xl mx-1"
                  >
                    <Avatar size="sm">
                      <AvatarFallback className="bg-[#2563EB]/10 text-[#2563EB] text-xs font-semibold">
                        {getInitials(student.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground">{student.name ?? student.email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Progress Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card variant="bento">
            <CardContent className="flex items-center gap-5 py-5">
              <ProgressRing percentage={collegePrepProgress.percentage} color="#1E3A5F" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E3A5F]/10 text-[#1E3A5F]">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#1E3A5F]">College Prep</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  {collegePrepProgress.completed} of {collegePrepProgress.total} lessons completed
                </p>
                {collegePrepProgress.total === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">No lessons available yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08 }}>
          <Card variant="bento">
            <CardContent className="flex items-center gap-5 py-5">
              <ProgressRing percentage={scholarshipProgress.percentage} color="#2563EB" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563EB]/10 text-[#2563EB]">
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#2563EB]">Scholarship</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  {scholarshipProgress.completed} of {scholarshipProgress.total} lessons completed
                </p>
                {scholarshipProgress.total === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">No lessons available yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Subject Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveSubject("COLLEGE_PREP")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            activeSubject === "COLLEGE_PREP"
              ? "bg-[#1E3A5F] text-white shadow-sm"
              : "bg-white text-muted-foreground ring-1 ring-gray-200/60 hover:bg-muted/50"
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          College Prep
        </button>
        <button
          onClick={() => setActiveSubject("SCHOLARSHIP")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            activeSubject === "SCHOLARSHIP"
              ? "bg-[#1E3A5F] text-white shadow-sm"
              : "bg-white text-muted-foreground ring-1 ring-gray-200/60 hover:bg-muted/50"
          }`}
        >
          <DollarSign className="h-4 w-4" />
          Scholarship
        </button>
      </div>

      {/* Module Grid */}
      {modulesLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl skeleton-shimmer" />
          ))}
        </div>
      ) : (
        <LearningCategoryGrid
          modules={activeModules}
          basePath="/parent/learning"
        />
      )}
    </div>
  )
}
