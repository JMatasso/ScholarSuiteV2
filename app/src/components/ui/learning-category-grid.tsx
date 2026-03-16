"use client"

import { useMemo } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, CheckCircle2, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

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

interface LearningCategoryGridProps {
  modules: LearningModule[]
  basePath: string
  className?: string
}

const categoryColors: Record<string, { bg: string; text: string; ring: string }> = {
  default: { bg: "bg-[#1E3A5F]/5", text: "text-[#1E3A5F]", ring: "ring-[#1E3A5F]/10" },
}

export function LearningCategoryGrid({ modules, basePath, className }: LearningCategoryGridProps) {
  // Group modules by category
  const categories = useMemo(() => {
    const grouped: Record<string, LearningModule[]> = {}
    for (const mod of modules) {
      const cat = mod.category || "General"
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(mod)
    }
    return Object.entries(grouped).sort(([, a], [, b]) => {
      // Sort by the lowest order in each category
      const aMin = Math.min(...a.map((m) => m.order))
      const bMin = Math.min(...b.map((m) => m.order))
      return aMin - bMin
    })
  }, [modules])

  if (modules.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-16 text-muted-foreground", className)}>
        <BookOpen className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm">No modules available yet.</p>
        <p className="text-xs mt-1">Check back soon for new learning content.</p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-8", className)}>
      {categories.map(([categoryName, categoryModules]) => (
        <div key={categoryName}>
          <h2 className="mb-3 text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide">
            {categoryName}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categoryModules.map((mod, index) => {
              const totalLessons = mod.lessons.length
              const completedLessons = mod.lessons.filter((l) =>
                l.progress?.some((p) => p.isCompleted)
              ).length
              const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
              const isComplete = percentage === 100 && totalLessons > 0
              const colors = categoryColors.default

              return (
                <motion.div
                  key={mod.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <Link href={`${basePath}/${mod.id}`} className="block group">
                    <Card className="h-full transition-all hover:shadow-md group-hover:border-[#2563EB]/30 overflow-hidden">
                      {/* Image header */}
                      {mod.imageUrl && (
                        <div className="h-32 w-full overflow-hidden bg-muted">
                          <img
                            src={mod.imageUrl}
                            alt={mod.title}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        </div>
                      )}
                      <CardContent className={cn("space-y-3", !mod.imageUrl && "pt-0")}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-semibold text-foreground group-hover:text-[#2563EB] transition-colors">
                              {mod.title}
                            </h3>
                            {mod.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {mod.description}
                              </p>
                            )}
                          </div>
                          {isComplete && (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                          )}
                        </div>

                        {/* Progress */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <BookOpen className="h-3 w-3" />
                              {totalLessons} lessons
                            </span>
                            <span className={cn(
                              "font-medium",
                              isComplete ? "text-emerald-600" : "text-foreground"
                            )}>
                              {completedLessons}/{totalLessons}
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                            <motion.div
                              className={cn(
                                "h-full rounded-full",
                                isComplete ? "bg-emerald-500" : "bg-[#2563EB]"
                              )}
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.6, delay: 0.2 + index * 0.05 }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-xs font-medium text-[#2563EB] group-hover:gap-2 transition-all pt-1">
                          {completedLessons === 0 ? "Start" : isComplete ? "Review" : "Continue"}
                          <ArrowRight className="h-3 w-3" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
