"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  CheckCircle2,
  Circle,
  Clock,
  GraduationCap,
  FileText,
  Search,
  PenTool,
  DollarSign,
  Award,
  BookOpen,
  Star,
  Target,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Milestone {
  id: number
  title: string
  description: string
  grade: "9th" | "10th" | "11th" | "12th"
  status: "completed" | "current" | "upcoming"
  icon: typeof CheckCircle2
  date: string
}

const milestones: Milestone[] = [
  // 9th Grade
  {
    id: 1,
    title: "Started High School at Lincoln High",
    description: "Enrolled in honors track with focus on STEM and humanities.",
    grade: "9th",
    status: "completed",
    icon: GraduationCap,
    date: "Sep 2022",
  },
  {
    id: 2,
    title: "Joined Youth Orchestra",
    description: "Selected as second violin for the Oakland Youth Symphony.",
    grade: "9th",
    status: "completed",
    icon: Star,
    date: "Oct 2022",
  },
  {
    id: 3,
    title: "First Semester GPA: 3.85",
    description: "Strong academic foundation across all core subjects.",
    grade: "9th",
    status: "completed",
    icon: BookOpen,
    date: "Jan 2023",
  },
  // 10th Grade
  {
    id: 4,
    title: "Joined Varsity Debate Team",
    description: "Recruited to the debate team; began competing in regional tournaments.",
    grade: "10th",
    status: "completed",
    icon: Users,
    date: "Sep 2023",
  },
  {
    id: 5,
    title: "Cross Country Varsity Season",
    description: "Competed in varsity cross country; built discipline and teamwork.",
    grade: "10th",
    status: "completed",
    icon: Target,
    date: "Nov 2023",
  },
  {
    id: 6,
    title: "Started Tutoring Program",
    description: "Founded neighborhood tutoring initiative serving 15 students.",
    grade: "10th",
    status: "completed",
    icon: BookOpen,
    date: "Jan 2024",
  },
  // 11th Grade
  {
    id: 7,
    title: "Elected Debate Team Captain",
    description: "Led team expansion from 4 to 22 members; qualified 3 teams for state.",
    grade: "11th",
    status: "completed",
    icon: Award,
    date: "Sep 2024",
  },
  {
    id: 8,
    title: "Founded Community Garden",
    description: "Established East Oakland Community Garden serving 40+ families.",
    grade: "11th",
    status: "completed",
    icon: Star,
    date: "Mar 2024",
  },
  {
    id: 9,
    title: "SAT Score: 1480",
    description: "Achieved 1480 on SAT (740 Math, 740 EBRW).",
    grade: "11th",
    status: "completed",
    icon: FileText,
    date: "Jun 2025",
  },
  {
    id: 10,
    title: "PSAT National Merit Semifinalist",
    description: "Qualified as National Merit Semifinalist based on PSAT score.",
    grade: "11th",
    status: "completed",
    icon: Award,
    date: "Sep 2025",
  },
  // 12th Grade
  {
    id: 11,
    title: "National Merit Scholarship Awarded",
    description: "Received $2,500 National Merit Scholarship.",
    grade: "12th",
    status: "completed",
    icon: DollarSign,
    date: "Feb 2026",
  },
  {
    id: 12,
    title: "Submitted Coca-Cola Scholars Application",
    description: "Completed and submitted application for $20,000 scholarship.",
    grade: "12th",
    status: "completed",
    icon: FileText,
    date: "Feb 2026",
  },
  {
    id: 13,
    title: "Scholarship Applications In Progress",
    description: "Actively working on Gates Millennium, Ron Brown, and QuestBridge applications.",
    grade: "12th",
    status: "current",
    icon: PenTool,
    date: "Mar 2026",
  },
  {
    id: 14,
    title: "Final College Decision",
    description: "Evaluate financial aid packages and commit to a university.",
    grade: "12th",
    status: "upcoming",
    icon: GraduationCap,
    date: "May 2026",
  },
  {
    id: 15,
    title: "Graduation",
    description: "Graduate from Lincoln High School.",
    grade: "12th",
    status: "upcoming",
    icon: GraduationCap,
    date: "Jun 2026",
  },
]

const gradeConfig: Record<string, { label: string; years: string }> = {
  "9th": { label: "9th Grade", years: "2022-2023" },
  "10th": { label: "10th Grade", years: "2023-2024" },
  "11th": { label: "11th Grade", years: "2024-2025" },
  "12th": { label: "12th Grade", years: "2025-2026" },
}

const statusStyles = {
  completed: {
    dot: "bg-emerald-500",
    line: "bg-emerald-500",
    iconColor: "text-emerald-600",
    ring: "ring-emerald-100",
  },
  current: {
    dot: "bg-[#2563EB]",
    line: "bg-[#2563EB]",
    iconColor: "text-[#2563EB]",
    ring: "ring-blue-100",
  },
  upcoming: {
    dot: "bg-gray-300",
    line: "bg-gray-200",
    iconColor: "text-gray-400",
    ring: "ring-gray-100",
  },
}

export default function TimelinePage() {
  const grades = ["9th", "10th", "11th", "12th"] as const

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1E3A5F]">Timeline</h1>
        <p className="mt-1 text-muted-foreground">
          Your academic journey from freshman year through graduation.
        </p>
      </div>

      {/* Current position indicator */}
      <Card className="border-[#2563EB]/30 bg-blue-50/30">
        <CardContent className="pt-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2563EB]/10 ring-2 ring-[#2563EB]/20">
              <Clock className="h-5 w-5 text-[#2563EB]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#1E3A5F]">You are here: 12th Grade - Spring Semester</p>
              <p className="text-xs text-muted-foreground">March 2026 - Scholarship application season</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vertical timeline */}
      <div className="space-y-8">
        {grades.map((grade) => {
          const gradeMilestones = milestones.filter((m) => m.grade === grade)
          const config = gradeConfig[grade]

          return (
            <div key={grade}>
              {/* Grade header */}
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 items-center rounded-lg bg-[#1E3A5F] px-3">
                  <span className="text-xs font-semibold text-white">{config.label}</span>
                </div>
                <span className="text-xs text-muted-foreground">{config.years}</span>
              </div>

              {/* Milestones */}
              <div className="relative ml-4 pl-8">
                {/* Vertical line */}
                <div className="absolute left-[7px] top-0 bottom-0 w-0.5 bg-gray-200" />

                <div className="space-y-4">
                  {gradeMilestones.map((milestone, i) => {
                    const Icon = milestone.icon
                    const styles = statusStyles[milestone.status]

                    return (
                      <div key={milestone.id} className="relative">
                        {/* Dot on the line */}
                        <div
                          className={cn(
                            "absolute -left-8 top-3 h-3.5 w-3.5 rounded-full ring-4",
                            styles.dot,
                            styles.ring
                          )}
                        />
                        {milestone.status === "current" && (
                          <div className="absolute -left-8 top-3 h-3.5 w-3.5 animate-ping rounded-full bg-[#2563EB]/40" />
                        )}

                        <Card className={cn(
                          "transition-shadow hover:shadow-sm",
                          milestone.status === "current" && "border-[#2563EB]/30 bg-blue-50/20",
                          milestone.status === "upcoming" && "opacity-60"
                        )}>
                          <CardContent className="pt-0">
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                                milestone.status === "completed" ? "bg-emerald-50" :
                                milestone.status === "current" ? "bg-blue-50" : "bg-gray-50"
                              )}>
                                <Icon className={cn("h-4 w-4", styles.iconColor)} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-sm font-medium">{milestone.title}</p>
                                  <span className="text-xs text-muted-foreground shrink-0">{milestone.date}</span>
                                </div>
                                <p className="mt-0.5 text-xs text-muted-foreground">{milestone.description}</p>
                              </div>
                              {milestone.status === "completed" && (
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
