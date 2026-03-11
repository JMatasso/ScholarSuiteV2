"use client"

import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Plus, GripVertical, MoreHorizontal, BookOpen } from "lucide-react"

interface Module {
  id: string
  title: string
  category: string
  lessonCount: number
  published: boolean
  order: number
  description: string
}

const modules: Module[] = [
  { id: "1", title: "SAT/ACT Preparation", category: "Test Prep", lessonCount: 12, published: true, order: 1, description: "Comprehensive test preparation strategies and practice materials for standardized tests." },
  { id: "2", title: "Essay Writing Fundamentals", category: "Writing", lessonCount: 8, published: true, order: 2, description: "Learn the art of persuasive personal essay writing for scholarships and college applications." },
  { id: "3", title: "Financial Literacy & Aid", category: "Financial", lessonCount: 6, published: true, order: 3, description: "Understanding FAFSA, CSS Profile, and navigating financial aid packages effectively." },
  { id: "4", title: "College Research & Selection", category: "Planning", lessonCount: 10, published: true, order: 4, description: "How to research colleges, compare programs, and build a balanced application list." },
  { id: "5", title: "Interview Preparation", category: "Skills", lessonCount: 5, published: false, order: 5, description: "Mock interview practice and strategies for scholarship and admissions interviews." },
  { id: "6", title: "Leadership & Extracurriculars", category: "Development", lessonCount: 4, published: false, order: 6, description: "Building a compelling extracurricular profile and demonstrating leadership impact." },
  { id: "7", title: "Time Management for Seniors", category: "Skills", lessonCount: 3, published: true, order: 7, description: "Balancing academics, applications, and personal life during the critical senior year." },
]

const categoryColors: Record<string, string> = {
  "Test Prep": "bg-blue-100 text-blue-700",
  Writing: "bg-purple-100 text-purple-700",
  Financial: "bg-green-100 text-green-700",
  Planning: "bg-amber-100 text-amber-700",
  Skills: "bg-cyan-100 text-cyan-700",
  Development: "bg-pink-100 text-pink-700",
}

export default function LearningPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Learning Content"
        description="Manage educational modules and lesson content for students."
        actions={
          <Button size="sm">
            <Plus className="size-3.5" /> Create Module
          </Button>
        }
      />

      <div className="flex flex-col gap-2">
        {modules.map((mod) => (
          <div key={mod.id} className="flex items-center gap-4 rounded-xl bg-white p-4 ring-1 ring-foreground/10 transition-shadow hover:shadow-sm">
            <button className="cursor-grab text-muted-foreground hover:text-foreground">
              <GripVertical className="size-4" />
            </button>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#1E3A5F]/10 text-xs font-semibold text-[#1E3A5F]">
              {mod.order}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-sm font-medium text-foreground">{mod.title}</h3>
                <span className={`inline-flex h-4 items-center rounded-full px-1.5 text-[10px] font-medium ${categoryColors[mod.category] || "bg-gray-100 text-gray-600"}`}>
                  {mod.category}
                </span>
                {mod.published ? (
                  <span className="inline-flex h-4 items-center rounded-full bg-green-50 px-1.5 text-[10px] font-medium text-green-700 ring-1 ring-inset ring-green-300">
                    Published
                  </span>
                ) : (
                  <span className="inline-flex h-4 items-center rounded-full bg-gray-100 px-1.5 text-[10px] font-medium text-gray-600 ring-1 ring-inset ring-gray-300">
                    Draft
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{mod.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <BookOpen className="size-3" /> {mod.lessonCount} lessons
              </span>
              <Button variant="ghost" size="icon-xs"><MoreHorizontal className="size-3.5" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
