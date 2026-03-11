"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Activity,
  Plus,
  Clock,
  Award,
  Users,
  Trophy,
  Palette,
  BookOpen,
  Heart,
  Dumbbell,
  Calendar,
} from "lucide-react"

interface ActivityEntry {
  id: number
  title: string
  organization: string
  role: string
  category: "athletics" | "arts" | "academic" | "volunteer" | "leadership" | "work"
  startDate: string
  endDate: string | null
  hoursPerWeek: number
  totalHours: number
  isLeadership: boolean
  awards: string[]
}

const activities: ActivityEntry[] = [
  {
    id: 1,
    title: "Varsity Debate Team",
    organization: "Lincoln High School",
    role: "Team Captain",
    category: "academic",
    startDate: "Sep 2023",
    endDate: null,
    hoursPerWeek: 10,
    totalHours: 520,
    isLeadership: true,
    awards: ["State Semifinalist 2025", "Best Speaker - Bay Area Invitational"],
  },
  {
    id: 2,
    title: "East Oakland Community Garden",
    organization: "Self-founded Initiative",
    role: "Founder & Director",
    category: "volunteer",
    startDate: "Mar 2024",
    endDate: null,
    hoursPerWeek: 8,
    totalHours: 384,
    isLeadership: true,
    awards: ["Oakland City Council Community Impact Award"],
  },
  {
    id: 3,
    title: "Neighborhood Tutoring Program",
    organization: "Community Partnership",
    role: "Lead Tutor & Coordinator",
    category: "volunteer",
    startDate: "Jan 2024",
    endDate: null,
    hoursPerWeek: 6,
    totalHours: 288,
    isLeadership: true,
    awards: [],
  },
  {
    id: 4,
    title: "Library Student Assistant",
    organization: "Oakland Public Library - Elmhurst Branch",
    role: "Student Assistant",
    category: "work",
    startDate: "Jun 2024",
    endDate: null,
    hoursPerWeek: 12,
    totalHours: 480,
    isLeadership: false,
    awards: [],
  },
  {
    id: 5,
    title: "AP Scholars Club",
    organization: "Lincoln High School",
    role: "Vice President",
    category: "academic",
    startDate: "Sep 2024",
    endDate: null,
    hoursPerWeek: 3,
    totalHours: 90,
    isLeadership: true,
    awards: [],
  },
  {
    id: 6,
    title: "Youth Orchestra",
    organization: "Oakland Youth Symphony",
    role: "Second Violin",
    category: "arts",
    startDate: "Sep 2022",
    endDate: "Jun 2025",
    hoursPerWeek: 5,
    totalHours: 360,
    isLeadership: false,
    awards: ["Regional Ensemble Selection 2024"],
  },
  {
    id: 7,
    title: "Habitat for Humanity",
    organization: "East Bay Chapter",
    role: "Student Volunteer",
    category: "volunteer",
    startDate: "Jun 2024",
    endDate: "Aug 2025",
    hoursPerWeek: 8,
    totalHours: 192,
    isLeadership: false,
    awards: [],
  },
  {
    id: 8,
    title: "Cross Country",
    organization: "Lincoln High School",
    role: "Varsity Runner",
    category: "athletics",
    startDate: "Sep 2023",
    endDate: "Nov 2025",
    hoursPerWeek: 12,
    totalHours: 360,
    isLeadership: false,
    awards: ["All-League Second Team 2025"],
  },
]

const categoryConfig: Record<string, { label: string; icon: typeof Activity; color: string; bg: string }> = {
  athletics: { label: "Athletics", icon: Dumbbell, color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
  arts: { label: "Arts", icon: Palette, color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
  academic: { label: "Academic", icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  volunteer: { label: "Volunteer", icon: Heart, color: "text-rose-600", bg: "bg-rose-50 border-rose-200" },
  leadership: { label: "Leadership", icon: Users, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
  work: { label: "Work Experience", icon: Clock, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
}

const categoryOrder = ["academic", "volunteer", "athletics", "arts", "work", "leadership"]

export default function ActivitiesPage() {
  const totalHours = activities.reduce((a, b) => a + b.totalHours, 0)
  const leadershipRoles = activities.filter((a) => a.isLeadership).length
  const totalAwards = activities.reduce((a, b) => a + b.awards.length, 0)

  const groupedActivities = categoryOrder
    .map((cat) => ({
      category: cat,
      items: activities.filter((a) => a.category === cat),
    }))
    .filter((g) => g.items.length > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1E3A5F]">Activities</h1>
          <p className="mt-1 text-muted-foreground">Track your extracurricular activities and achievements.</p>
        </div>
        <Button className="gap-2 bg-[#2563EB] hover:bg-[#2563EB]/90">
          <Plus className="h-4 w-4" />
          Add Activity
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Clock className="h-5 w-5 text-[#2563EB]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1E3A5F]">{totalHours.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Hours</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                <Users className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1E3A5F]">{leadershipRoles}</p>
                <p className="text-xs text-muted-foreground">Leadership Roles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                <Trophy className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1E3A5F]">{totalAwards}</p>
                <p className="text-xs text-muted-foreground">Awards & Honors</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activities grouped by category */}
      <div className="space-y-6">
        {groupedActivities.map((group) => {
          const config = categoryConfig[group.category]
          const Icon = config.icon
          return (
            <div key={group.category}>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[#1E3A5F]">
                <Icon className={`h-4 w-4 ${config.color}`} />
                {config.label} ({group.items.length})
              </h2>
              <div className="space-y-2.5">
                {group.items.map((activity) => (
                  <Card key={activity.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="pt-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{activity.title}</p>
                            {activity.isLeadership && (
                              <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                                Leadership
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{activity.organization}</p>
                          <p className="text-xs font-medium text-foreground/70">{activity.role}</p>
                        </div>
                        <div className="text-right shrink-0 space-y-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                            <Calendar className="h-3 w-3" />
                            {activity.startDate} - {activity.endDate || "Present"}
                          </p>
                          <p className="text-xs font-medium">
                            {activity.hoursPerWeek} hrs/week &middot; {activity.totalHours} total
                          </p>
                        </div>
                      </div>
                      {activity.awards.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {activity.awards.map((award, i) => (
                            <span key={i} className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                              <Trophy className="h-3 w-3" />
                              {award}
                            </span>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
