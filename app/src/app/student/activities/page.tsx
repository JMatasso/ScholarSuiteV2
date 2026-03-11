"use client"

import { useState, useEffect } from "react"
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
import { toast } from "sonner"

interface ActivityEntry {
  id: string
  title: string
  organization: string | null
  role: string | null
  category: "ATHLETICS" | "ARTS" | "ACADEMIC" | "VOLUNTEER" | "LEADERSHIP" | "WORK" | "OTHER"
  startDate: string | null
  endDate: string | null
  hoursPerWeek: number | null
  totalHours: number | null
  isLeadership: boolean
  isAward: boolean
  description: string | null
}

const categoryConfig: Record<string, { label: string; icon: typeof Activity; color: string; bg: string }> = {
  ATHLETICS: { label: "Athletics", icon: Dumbbell, color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
  ARTS: { label: "Arts", icon: Palette, color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
  ACADEMIC: { label: "Academic", icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  VOLUNTEER: { label: "Volunteer", icon: Heart, color: "text-rose-600", bg: "bg-rose-50 border-rose-200" },
  LEADERSHIP: { label: "Leadership", icon: Users, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
  WORK: { label: "Work Experience", icon: Clock, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
  OTHER: { label: "Other", icon: Activity, color: "text-gray-600", bg: "bg-gray-50 border-gray-200" },
}

const categoryOrder = ["ACADEMIC", "VOLUNTEER", "ATHLETICS", "ARTS", "WORK", "LEADERSHIP", "OTHER"]

function formatDateRange(start: string | null, end: string | null): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" })
  if (!start) return "Unknown"
  return `${fmt(start)} - ${end ? fmt(end) : "Present"}`
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/activities")
      .then((res) => res.json())
      .then((data) => {
        setActivities(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const totalHours = activities.reduce((a, b) => a + (b.totalHours ?? 0), 0)
  const leadershipRoles = activities.filter((a) => a.isLeadership).length
  const totalAwards = activities.filter((a) => a.isAward).length

  const groupedActivities = categoryOrder
    .map((cat) => ({
      category: cat,
      items: activities.filter((a) => a.category === cat),
    }))
    .filter((g) => g.items.length > 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <p className="text-sm">Loading activities...</p>
      </div>
    )
  }

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
      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Activity className="h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm">No activities yet. Add your first activity to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedActivities.map((group) => {
            const config = categoryConfig[group.category] ?? categoryConfig.OTHER
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
                              {activity.isAward && (
                                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                                  Award
                                </span>
                              )}
                            </div>
                            {activity.organization && (
                              <p className="text-xs text-muted-foreground">{activity.organization}</p>
                            )}
                            {activity.role && (
                              <p className="text-xs font-medium text-foreground/70">{activity.role}</p>
                            )}
                            {activity.description && (
                              <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
                            )}
                          </div>
                          <div className="text-right shrink-0 space-y-1">
                            <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                              <Calendar className="h-3 w-3" />
                              {formatDateRange(activity.startDate, activity.endDate)}
                            </p>
                            {(activity.hoursPerWeek !== null || activity.totalHours !== null) && (
                              <p className="text-xs font-medium">
                                {activity.hoursPerWeek !== null && `${activity.hoursPerWeek} hrs/week`}
                                {activity.hoursPerWeek !== null && activity.totalHours !== null && " · "}
                                {activity.totalHours !== null && `${activity.totalHours} total`}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
