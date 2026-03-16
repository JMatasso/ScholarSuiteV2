"use client"

import * as React from "react"
import { FullScreenCalendar, type CalendarData, type CalendarEvent } from "@/components/ui/fullscreen-calendar"
import { PageHeader } from "@/components/ui/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

export default function ParentCalendarPage() {
  const [data, setData] = React.useState<CalendarData[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch("/api/calendar")
      .then((r) => r.json())
      .then((res) => {
        if (Array.isArray(res)) {
          setData(
            res.map((d: { day: string; events: CalendarEvent[] }) => ({
              day: new Date(d.day),
              events: d.events,
            }))
          )
        }
        setLoading(false)
      })
      .catch(() => {
        toast.error("Failed to load calendar")
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[600px] rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        description="View your student's upcoming deadlines and meetings."
      />
      <div className="rounded-2xl bg-white ring-1 ring-gray-200/60 shadow-sm overflow-hidden">
        <FullScreenCalendar data={data} />
      </div>
      <div className="flex flex-wrap items-center gap-4 px-1">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-2.5 rounded-full bg-blue-500" /> Scholarship Deadline
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-2.5 rounded-full bg-amber-500" /> Task Due
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-2.5 rounded-full bg-emerald-500" /> Meeting
        </span>
      </div>
    </div>
  )
}
