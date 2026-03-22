"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { FullScreenCalendar, type CalendarData, type CalendarEvent, type EventType } from "@/components/ui/fullscreen-calendar"
import { PageHeader } from "@/components/ui/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Download, ExternalLink } from "lucide-react"

const EVENT_TYPE_FILTERS: { type: EventType; label: string; dot: string }[] = [
  { type: "scholarship", label: "Scholarships", dot: "bg-accent0" },
  { type: "task", label: "Tasks", dot: "bg-amber-500" },
  { type: "meeting", label: "Meetings", dot: "bg-emerald-500" },
  { type: "college", label: "College Apps", dot: "bg-purple-500" },
]

function buildICSContent(events: CalendarEvent[]): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ScholarSuite//Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ]

  events.forEach((event) => {
    const dt = new Date(event.datetime)
    const dateStr = dt.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
    lines.push(
      "BEGIN:VEVENT",
      `DTSTART:${dateStr}`,
      `DTEND:${dateStr}`,
      `SUMMARY:${event.name.replace(/,/g, "\\,")}`,
      `DESCRIPTION:${(event.type || "event").charAt(0).toUpperCase() + (event.type || "event").slice(1)}`,
      `UID:${event.id}@scholarsuite`,
      "END:VEVENT"
    )
  })

  lines.push("END:VCALENDAR")
  return lines.join("\r\n")
}

function buildGoogleCalendarUrl(event: CalendarEvent): string {
  const dt = new Date(event.datetime)
  const dateStr = dt.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.name,
    dates: `${dateStr}/${dateStr}`,
    details: `${(event.type || "Event").charAt(0).toUpperCase() + (event.type || "Event").slice(1)} from ScholarSuite`,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export default function StudentCalendarPage() {
  const router = useRouter()
  const [data, setData] = React.useState<CalendarData[]>([])
  const [loading, setLoading] = React.useState(true)
  const [visibleTypes, setVisibleTypes] = React.useState<Set<EventType>>(
    new Set(EVENT_TYPE_FILTERS.map((f) => f.type))
  )

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

  const toggleType = (type: EventType) => {
    setVisibleTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  const allEvents = React.useMemo(
    () => data.flatMap((d) => d.events),
    [data]
  )

  const handleExportICS = () => {
    const filteredEvents = allEvents.filter(
      (e) => visibleTypes.has(e.type || "general")
    )
    if (filteredEvents.length === 0) {
      toast.error("No events to export")
      return
    }
    const ics = buildICSContent(filteredEvents)
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "scholarsuite-calendar.ics"
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Calendar exported — open the .ics file to add to your calendar app")
  }

  const handleAddToGoogle = () => {
    const filteredEvents = allEvents.filter(
      (e) => visibleTypes.has(e.type || "general")
    )
    if (filteredEvents.length === 0) {
      toast.error("No events to export")
      return
    }
    // Open Google Calendar with the first upcoming event
    const upcoming = filteredEvents
      .filter((e) => new Date(e.datetime) >= new Date())
      .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
    const target = upcoming[0] || filteredEvents[0]
    window.open(buildGoogleCalendarUrl(target), "_blank")
    if (filteredEvents.length > 1) {
      toast.info("Google Calendar only supports one event at a time. Use the .ics export for bulk import.")
    }
  }

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
        description="View your upcoming deadlines, tasks, and meetings."
      />

      {/* Filter toggles + Export */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {EVENT_TYPE_FILTERS.map((filter) => {
            const isActive = visibleTypes.has(filter.type)
            return (
              <button
                key={filter.type}
                onClick={() => toggleType(filter.type)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-card ring-1 ring-border shadow-sm text-foreground"
                    : "bg-muted/50 text-muted-foreground line-through"
                }`}
              >
                <span className={`size-2 rounded-full ${isActive ? filter.dot : "bg-muted-foreground/30"}`} />
                {filter.label}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleExportICS}>
            <Download className="h-3.5 w-3.5" />
            Export .ics
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleAddToGoogle}>
            <ExternalLink className="h-3.5 w-3.5" />
            Add to Google
          </Button>
        </div>
      </div>

      <div className="rounded-2xl bg-card ring-1 ring-gray-200/60 shadow-sm overflow-hidden">
        <FullScreenCalendar
          data={data}
          visibleTypes={visibleTypes}
          onEventClick={(event) => {
            if (event.link) router.push(event.link)
          }}
        />
      </div>
    </div>
  )
}
