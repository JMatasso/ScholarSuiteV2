"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Play,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

interface Lesson {
  id: string
  title: string
  content: string | null
  videoUrl: string | null
  externalUrl: string | null
  type: string
  order: number
  progress: Array<{ isCompleted: boolean }>
}

interface ModuleData {
  id: string
  title: string
  description: string | null
  subject: string
  lessons: Lesson[]
}

function getEmbedUrl(videoUrl: string): string | null {
  const ytMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  const vimeoMatch = videoUrl.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  const loomMatch = videoUrl.match(/loom\.com\/share\/([a-zA-Z0-9]+)/)
  if (loomMatch) return `https://www.loom.com/embed/${loomMatch[1]}`
  return null
}

export default function ParentModuleViewerPage({ params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = use(params)
  const [module, setModule] = useState<ModuleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/learning/${moduleId}`)
      .then((r) => r.json())
      .then((data) => {
        setModule(data)
        setLoading(false)
        if (data?.lessons?.length > 0) setExpandedLesson(data.lessons[0].id)
      })
      .catch(() => setLoading(false))
  }, [moduleId])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (!module) {
    return (
      <div className="space-y-6">
        <PageHeader title="Module Not Found" />
        <Link href="/parent/learning">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Library
          </Button>
        </Link>
      </div>
    )
  }

  const totalLessons = module.lessons.length
  const completedLessons = module.lessons.filter((l) =>
    l.progress?.some((p) => p.isCompleted)
  ).length

  return (
    <div className="space-y-6">
      <PageHeader
        title={module.title}
        description={module.description || undefined}
        actions={
          <Link href="/parent/learning">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Button>
          </Link>
        }
      />

      {/* Student progress indicator */}
      <div className="flex items-center gap-3 rounded-lg bg-white p-3 ring-1 ring-foreground/5">
        <BookOpen className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Your student has completed <span className="font-medium text-foreground">{completedLessons} of {totalLessons}</span> lessons
        </p>
      </div>

      {/* Lesson list (read-only viewer) */}
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
              <Card variant="bento" className={cn(
                "overflow-hidden",
                isExpanded && "ring-1 ring-[#2563EB]/20",
              )}>
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
                    {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-xs font-semibold">{index + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{lesson.title}</p>
                    {isCompleted && <span className="text-[10px] text-emerald-600">Completed by student</span>}
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-border px-4 py-4 space-y-4">
                    {embedUrl && (
                      <div className="aspect-video rounded-lg overflow-hidden bg-black">
                        <iframe src={embedUrl} className="h-full w-full" allowFullScreen />
                      </div>
                    )}
                    {lesson.videoUrl && !embedUrl && (
                      <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm text-[#2563EB] hover:underline">
                        <Play className="h-4 w-4" /> Watch Video
                      </a>
                    )}
                    {lesson.externalUrl && (
                      <a href={lesson.externalUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm text-[#2563EB] hover:underline">
                        <ExternalLink className="h-4 w-4" /> Open Resource
                      </a>
                    )}
                    {lesson.content && (
                      <div className="prose prose-sm max-w-none text-foreground"
                        dangerouslySetInnerHTML={{ __html: lesson.content }} />
                    )}
                  </div>
                )}
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
