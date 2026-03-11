"use client"

import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Plus, MoreHorizontal, CheckSquare, Copy } from "lucide-react"

interface TaskTemplate {
  id: string
  name: string
  description: string
  taskCount: number
  isDefault: boolean
  lastUpdated: string
  tasks: string[]
}

const templates: TaskTemplate[] = [
  {
    id: "1",
    name: "Scholarship Application Checklist",
    description: "Standard tasks for completing a scholarship application from research to submission.",
    taskCount: 8,
    isDefault: true,
    lastUpdated: "Mar 5, 2026",
    tasks: ["Research scholarship requirements", "Gather financial documents", "Request recommendation letters", "Write personal statement", "Complete application form", "Review and proofread", "Submit application", "Follow up on status"],
  },
  {
    id: "2",
    name: "College Application Prep",
    description: "Comprehensive checklist for college application preparation and submission.",
    taskCount: 10,
    isDefault: false,
    lastUpdated: "Feb 28, 2026",
    tasks: ["Finalize college list", "Complete Common App profile", "Write main essay", "Write supplemental essays", "Request transcripts", "Request recommendation letters", "Complete activities section", "Review financial aid options", "Submit applications", "Send test scores"],
  },
  {
    id: "3",
    name: "Financial Aid Package",
    description: "Tasks related to applying for and managing financial aid.",
    taskCount: 6,
    isDefault: false,
    lastUpdated: "Mar 1, 2026",
    tasks: ["Complete FAFSA", "Complete CSS Profile", "Gather tax documents", "Submit verification documents", "Review award letters", "Appeal if necessary"],
  },
  {
    id: "4",
    name: "New Student Onboarding",
    description: "Initial setup tasks for new students joining the program.",
    taskCount: 5,
    isDefault: true,
    lastUpdated: "Mar 8, 2026",
    tasks: ["Complete intake form", "Upload transcript", "Schedule initial consultation", "Set academic goals", "Review program guide"],
  },
]

export default function TemplatesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Task Templates"
        description="Create reusable task templates to assign to students."
        actions={
          <Button size="sm">
            <Plus className="size-3.5" /> Create Template
          </Button>
        }
      />

      <div className="flex flex-col gap-4">
        {templates.map((template) => (
          <div key={template.id} className="rounded-xl bg-white p-5 ring-1 ring-foreground/10 transition-shadow hover:shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">{template.name}</h3>
                {template.isDefault && (
                  <span className="inline-flex h-5 items-center rounded-full bg-[#1E3A5F]/10 px-2 text-[11px] font-medium text-[#1E3A5F]">
                    Default
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon-xs"><Copy className="size-3.5" /></Button>
                <Button variant="ghost" size="icon-xs"><MoreHorizontal className="size-3.5" /></Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {template.tasks.map((task, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                  <CheckSquare className="size-3" /> {task}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{template.taskCount} tasks</span>
              <span>Updated {template.lastUpdated}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
