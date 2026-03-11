"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  PenTool,
  Plus,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  Edit3,
} from "lucide-react"

interface Essay {
  id: number
  title: string
  prompt: string
  status: "draft" | "under_review" | "approved"
  wordCount: number
  targetWords: number
  lastEdited: string
  linkedScholarships: string[]
  content: string
}

const essays: Essay[] = [
  {
    id: 1,
    title: "Personal Statement - Draft 3",
    prompt: "Describe a challenge you have overcome and how it has shaped who you are today.",
    status: "under_review",
    wordCount: 647,
    targetWords: 650,
    lastEdited: "Mar 9, 2026",
    linkedScholarships: ["Gates Millennium Scholars", "Jack Kent Cooke Foundation"],
    content: `Growing up in a single-parent household in East Oakland, I learned early that resilience isn't a choice — it's a necessity. When my mother was diagnosed with lupus during my sophomore year, our already precarious financial situation became dire. I found myself balancing AP coursework with hospital visits, part-time work at the local library, and caring for my two younger siblings.

Rather than viewing these circumstances as obstacles, I chose to see them as catalysts for growth. I organized a neighborhood tutoring program, initially to help my siblings but eventually expanding to serve fifteen students from our apartment complex. Watching their grades improve and confidence grow reminded me that adversity, when channeled purposefully, becomes a powerful force for community transformation.

This experience crystallized my commitment to pursuing a degree in public health at Stanford University, where I hope to research health disparities affecting communities like mine. My mother's illness taught me that systemic change begins with individuals who refuse to accept the status quo — individuals who transform personal pain into public purpose.`,
  },
  {
    id: 2,
    title: "Leadership Essay",
    prompt: "Describe a time when you demonstrated leadership in your community.",
    status: "draft",
    wordCount: 412,
    targetWords: 500,
    lastEdited: "Mar 7, 2026",
    linkedScholarships: ["Ron Brown Scholar Program"],
    content: `As captain of the Lincoln High debate team, I inherited a program on the verge of dissolution. With only four members and zero tournament wins, most people expected me to simply maintain the status quo. Instead, I saw an opportunity to build something meaningful.

I launched a recruitment campaign targeting underrepresented students — particularly those from our school's ESL and special education programs — communities whose voices are often absent from competitive debate. Within two semesters, our team grew to twenty-two members.

More importantly, I restructured our practice format to emphasize collaborative learning. Senior members mentored newcomers in weekly paired sessions, creating a culture where vulnerability was valued over intimidation. The results spoke for themselves: we qualified three teams for state competition, and two of our ESL students won individual speaking awards.`,
  },
  {
    id: 3,
    title: "Community Impact Essay",
    prompt: "How have you made a positive impact in your community?",
    status: "approved",
    wordCount: 500,
    targetWords: 500,
    lastEdited: "Feb 25, 2026",
    linkedScholarships: ["Coca-Cola Scholars Foundation"],
    content: `The food desert in my neighborhood isn't just a statistic — it's the reality I navigate every day. When the last grocery store in our area closed two years ago, I watched my neighbors resort to convenience store meals and fast food, their health declining alongside their options.

Inspired by a biology lesson on urban agriculture, I partnered with our school's environmental club to establish three community garden plots on vacant lots owned by the city. After six months of navigating bureaucratic permits, fundraising through bake sales, and recruiting twenty volunteers, we harvested our first crop of tomatoes, peppers, and leafy greens.

Today, the East Oakland Community Garden provides fresh produce to over forty families weekly. We've also launched cooking workshops in partnership with the local community center, teaching nutrition and meal preparation skills. This initiative earned recognition from the Oakland City Council and inspired two neighboring communities to start their own gardens.`,
  },
  {
    id: 4,
    title: "Overcoming Adversity Essay",
    prompt: "Tell us about a significant challenge and how you overcame it.",
    status: "draft",
    wordCount: 280,
    targetWords: 600,
    lastEdited: "Mar 4, 2026",
    linkedScholarships: ["Jack Kent Cooke Foundation"],
    content: `When I opened my AP Chemistry exam results and saw a score of 2, I felt the weight of every statistic stacked against students like me. First-generation, low-income, minority — the labels that society uses to predict failure seemed to materialize in that single number.

But I refused to let one setback define my academic trajectory. I sought out Dr. Ramirez, a local community college professor who volunteered her Saturday mornings to tutor high school students. Under her mentorship, I didn't just retake the exam — I fundamentally changed my approach to learning.`,
  },
]

const statusConfig = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-700 border-gray-200", icon: Edit3 },
  under_review: { label: "Under Review", color: "bg-amber-100 text-amber-700 border-amber-200", icon: AlertCircle },
  approved: { label: "Approved", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
}

export default function EssaysPage() {
  const [selectedId, setSelectedId] = useState(essays[0].id)
  const selected = essays.find((e) => e.id === selectedId)!

  const StatusIcon = statusConfig[selected.status].icon

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1E3A5F]">Essays</h1>
          <p className="mt-1 text-muted-foreground">Write, review, and manage your scholarship essays.</p>
        </div>
        <Button className="gap-2 bg-[#2563EB] hover:bg-[#2563EB]/90">
          <Plus className="h-4 w-4" />
          New Essay
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Left panel - Essay list */}
        <div className="space-y-2">
          {essays.map((essay) => {
            const config = statusConfig[essay.status]
            const Icon = config.icon
            return (
              <button
                key={essay.id}
                onClick={() => setSelectedId(essay.id)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  selectedId === essay.id
                    ? "border-[#2563EB] bg-blue-50/50 ring-1 ring-[#2563EB]/20"
                    : "hover:bg-muted/50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-tight">{essay.title}</p>
                  <Icon className={`h-4 w-4 shrink-0 ${
                    essay.status === "approved" ? "text-emerald-600" :
                    essay.status === "under_review" ? "text-amber-600" : "text-gray-400"
                  }`} />
                </div>
                <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{essay.wordCount}/{essay.targetWords} words</span>
                  <span>Edited {essay.lastEdited}</span>
                </div>
                <span className={`mt-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${config.color}`}>
                  {config.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Right panel - Essay preview */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle>{selected.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{selected.prompt}</p>
              </div>
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${statusConfig[selected.status].color}`}>
                <StatusIcon className="h-3 w-3" />
                {statusConfig[selected.status].label}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                {selected.wordCount} / {selected.targetWords} words
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Last edited {selected.lastEdited}
              </span>
            </div>

            {/* Word count progress bar */}
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  selected.wordCount >= selected.targetWords ? "bg-emerald-500" : "bg-[#2563EB]"
                }`}
                style={{ width: `${Math.min((selected.wordCount / selected.targetWords) * 100, 100)}%` }}
              />
            </div>

            {/* Linked scholarships */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Linked Scholarships</p>
              <div className="flex flex-wrap gap-1.5">
                {selected.linkedScholarships.map((s) => (
                  <span key={s} className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Essay content */}
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="prose prose-sm max-w-none">
                {selected.content.split("\n\n").map((paragraph, i) => (
                  <p key={i} className="text-sm leading-relaxed text-foreground/80 mb-3 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button className="gap-2 bg-[#2563EB] hover:bg-[#2563EB]/90">
                <PenTool className="h-4 w-4" />
                Edit Essay
              </Button>
              <Button variant="outline">Submit for Review</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
