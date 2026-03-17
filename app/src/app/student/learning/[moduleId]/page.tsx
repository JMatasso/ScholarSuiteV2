"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Circle,
  Play,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Lightbulb,
} from "lucide-react"

interface LessonProgress {
  id: string
  isCompleted: boolean
}

interface Lesson {
  id: string
  title: string
  content: string | null
  videoUrl: string | null
  externalUrl: string | null
  type: string
  order: number
  progress: LessonProgress[]
}

interface ModuleData {
  id: string
  title: string
  description: string | null
  subject: string
  category: string | null
  lessons: Lesson[]
}

function getEmbedUrl(videoUrl: string): string | null {
  // YouTube
  const ytMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  // Vimeo
  const vimeoMatch = videoUrl.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  // Loom
  const loomMatch = videoUrl.match(/loom\.com\/share\/([a-zA-Z0-9]+)/)
  if (loomMatch) return `https://www.loom.com/embed/${loomMatch[1]}`
  return null
}

export default function ModuleDetailPage({ params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = use(params)
  const [module, setModule] = useState<ModuleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null)
  const [completing, setCompleting] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/learning/${moduleId}`)
      .then((r) => r.json())
      .then((data) => {
        setModule(data)
        setLoading(false)
        // Auto-expand first incomplete lesson
        if (data?.lessons) {
          const firstIncomplete = data.lessons.find(
            (l: Lesson) => !l.progress?.some((p: LessonProgress) => p.isCompleted)
          )
          if (firstIncomplete) setExpandedLesson(firstIncomplete.id)
          else if (data.lessons.length > 0) setExpandedLesson(data.lessons[0].id)
        }
      })
      .catch(() => setLoading(false))
  }, [moduleId])

  const handleComplete = async (lessonId: string, currentlyCompleted: boolean) => {
    setCompleting(lessonId)
    try {
      const res = await fetch("/api/learning/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, isCompleted: !currentlyCompleted }),
      })
      if (!res.ok) throw new Error()

      // Update local state
      setModule((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          lessons: prev.lessons.map((l) =>
            l.id === lessonId
              ? {
                  ...l,
                  progress: [{ id: "local", isCompleted: !currentlyCompleted }],
                }
              : l
          ),
        }
      })

      toast.success(currentlyCompleted ? "Marked as incomplete" : "Lesson completed!")

      // Auto-advance to next lesson
      if (!currentlyCompleted && module) {
        const currentIndex = module.lessons.findIndex((l) => l.id === lessonId)
        const nextLesson = module.lessons[currentIndex + 1]
        if (nextLesson) {
          setTimeout(() => setExpandedLesson(nextLesson.id), 400)
        }
      }
    } catch {
      toast.error("Failed to update progress")
    }
    setCompleting(null)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 rounded-xl" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (!module) {
    return (
      <div className="space-y-6">
        <PageHeader title="Module Not Found" description="This module doesn't exist or has been removed." />
        <Link href="/student/learning">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Learning Hub
          </Button>
        </Link>
      </div>
    )
  }

  const totalLessons = module.lessons.length
  const completedLessons = module.lessons.filter((l) =>
    l.progress?.some((p) => p.isCompleted)
  ).length
  const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
  const backPath = module.subject === "SCHOLARSHIP" ? "/student/learning/scholarships" : "/student/learning/college"

  return (
    <div className="space-y-6">
      <PageHeader
        title={module.title}
        description={module.description || undefined}
        actions={
          <Link href={backPath}>
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Button>
          </Link>
        }
      />

      {/* Progress bar */}
      <Card>
        <CardContent className="pt-0">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1E3A5F]/10">
              <BookOpen className="h-5 w-5 text-[#1E3A5F]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm font-medium text-foreground">
                  {completedLessons} of {totalLessons} lessons completed
                </p>
                <span className={cn(
                  "text-sm font-semibold",
                  percentage === 100 ? "text-emerald-600" : "text-[#2563EB]"
                )}>
                  {percentage}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                <motion.div
                  className={cn(
                    "h-full rounded-full",
                    percentage === 100 ? "bg-emerald-500" : "bg-[#2563EB]"
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lesson list */}
      <div className="space-y-2">
        {module.lessons.map((lesson, index) => {
          const isCompleted = lesson.progress?.some((p) => p.isCompleted) ?? false
          const isExpanded = expandedLesson === lesson.id
          const embedUrl = lesson.videoUrl ? getEmbedUrl(lesson.videoUrl) : null

          return (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.04 }}
            >
              <Card className={cn(
                "transition-all overflow-hidden",
                isExpanded && "ring-1 ring-[#2563EB]/20",
                isCompleted && !isExpanded && "opacity-70"
              )}>
                {/* Lesson header — always visible */}
                <button
                  type="button"
                  onClick={() => setExpandedLesson(isExpanded ? null : lesson.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2",
                    isCompleted
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-gray-300 text-gray-400"
                  )}>
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <span className="text-xs font-semibold">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium",
                      isCompleted ? "text-muted-foreground line-through" : "text-foreground"
                    )}>
                      {lesson.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {lesson.type === "VIDEO" && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Play className="h-2.5 w-2.5" /> Video
                        </span>
                      )}
                      {lesson.type === "LINK" && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <ExternalLink className="h-2.5 w-2.5" /> External
                        </span>
                      )}
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    transition={{ duration: 0.25 }}
                    className="border-t border-border"
                  >
                    <div className="px-4 py-4 space-y-4">
                      {/* Video embed */}
                      {embedUrl && (
                        <div className="aspect-video rounded-lg overflow-hidden bg-black">
                          <iframe
                            src={embedUrl}
                            className="h-full w-full"
                            allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          />
                        </div>
                      )}

                      {/* Raw video URL (non-embeddable) */}
                      {lesson.videoUrl && !embedUrl && (
                        <a
                          href={lesson.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm text-[#2563EB] hover:underline"
                        >
                          <Play className="h-4 w-4" /> Watch Video
                        </a>
                      )}

                      {/* Video coming soon placeholder */}
                      {!lesson.videoUrl && lesson.type === "VIDEO" && (
                        <div className="aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-[#1E3A5F] to-[#2563EB] flex flex-col items-center justify-center gap-3">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                            <Play className="h-7 w-7 text-white/90" />
                          </div>
                          <p className="text-sm font-medium text-white/90">Video lesson coming soon</p>
                          <p className="text-xs text-white/60">Check back later for the video content</p>
                        </div>
                      )}

                      {/* External link */}
                      {lesson.externalUrl && (
                        <a
                          href={lesson.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm text-[#2563EB] hover:underline"
                        >
                          <ExternalLink className="h-4 w-4" /> Open Resource
                        </a>
                      )}

                      {/* Written content */}
                      {lesson.content && (() => {
                        const marker = "<!-- KEY_TAKEAWAYS -->"
                        const hasKeyTakeaways = lesson.content.includes(marker)
                        const mainContent = hasKeyTakeaways
                          ? lesson.content.split(marker)[0]
                          : lesson.content
                        const takeawaysContent = hasKeyTakeaways
                          ? lesson.content.split(marker)[1]
                          : null

                        return (
                          <>
                            <div
                              className="prose prose-sm max-w-none text-foreground"
                              dangerouslySetInnerHTML={{ __html: mainContent }}
                            />

                            {/* Key Takeaways */}
                            {takeawaysContent && (
                              <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.1 }}
                                className="rounded-lg bg-blue-50/80 border border-blue-200/60 p-4 space-y-3"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#2563EB]/10">
                                    <Lightbulb className="h-4 w-4 text-[#2563EB]" />
                                  </div>
                                  <h4 className="text-sm font-semibold text-[#1E3A5F]">Key Takeaways</h4>
                                </div>
                                <div
                                  className="prose prose-sm max-w-none text-[#1E3A5F]/80"
                                  dangerouslySetInnerHTML={{ __html: takeawaysContent }}
                                />
                              </motion.div>
                            )}
                          </>
                        )
                      })()}

                      {/* Complete button */}
                      <div className="flex items-center justify-between pt-2">
                        <Button
                          size="sm"
                          variant={isCompleted ? "outline" : "default"}
                          className={cn(
                            "gap-2",
                            !isCompleted && "bg-[#2563EB] hover:bg-[#2563EB]/90"
                          )}
                          onClick={() => handleComplete(lesson.id, isCompleted)}
                          disabled={completing === lesson.id}
                        >
                          {isCompleted ? (
                            <>
                              <Circle className="h-3.5 w-3.5" /> Mark Incomplete
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" /> Mark Complete
                            </>
                          )}
                        </Button>

                        {/* Next lesson button */}
                        {!isCompleted && index < module.lessons.length - 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground"
                            onClick={() => {
                              handleComplete(lesson.id, false)
                            }}
                          >
                            Complete & Next →
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
