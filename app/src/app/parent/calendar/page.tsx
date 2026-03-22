"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { FullScreenCalendar, type CalendarData, type CalendarEvent, type EventType } from "@/components/ui/fullscreen-calendar"
import { PageHeader } from "@/components/ui/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Download, CalendarPlus, Copy, Check, RefreshCw } from "@/lib/icons"

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
      `UID:${event.id}@scholarsuite`,
      "END:VEVENT"
    )
  })
  lines.push("END:VCALENDAR")
  return lines.join("\r\n")
}

export default function ParentCalendarPage() {
  const router = useRouter()
  const [data, setData] = React.useState<CalendarData[]>([])
  const [loading, setLoading] = React.useState(true)
  const [visibleTypes, setVisibleTypes] = React.useState<Set<EventType>>(
    new Set(EVENT_TYPE_FILTERS.map((f) => f.type))
  )

  // Subscribe dialog
  const [subscribeOpen, setSubscribeOpen] = React.useState(false)
  const [feedUrl, setFeedUrl] = React.useState("")
  const [feedLoading, setFeedLoading] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

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
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  const allEvents = React.useMemo(() => data.flatMap((d) => d.events), [data])

  const handleExportICS = () => {
    const filtered = allEvents.filter((e) => visibleTypes.has(e.type || "general"))
    if (filtered.length === 0) { toast.error("No events to export"); return }
    const ics = buildICSContent(filtered)
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "scholarsuite-calendar.ics"
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Calendar exported")
  }

  const handleSubscribe = async () => {
    setFeedLoading(true)
    try {
      const res = await fetch("/api/calendar/subscribe", { method: "POST" })
      if (!res.ok) throw new Error()
      const { token } = await res.json()
      setFeedUrl(`${window.location.origin}/api/calendar/feed/${token}`)
      setSubscribeOpen(true)
    } catch {
      toast.error("Failed to generate calendar feed URL")
    } finally {
      setFeedLoading(false)
    }
  }

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(feedUrl)
    setCopied(true)
    toast.success("Feed URL copied")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleResetToken = async () => {
    setFeedLoading(true)
    try {
      const res = await fetch("/api/calendar/subscribe", { method: "DELETE" })
      if (!res.ok) throw new Error()
      const { token } = await res.json()
      setFeedUrl(`${window.location.origin}/api/calendar/feed/${token}`)
      toast.success("Feed URL regenerated")
    } catch {
      toast.error("Failed to reset calendar feed")
    } finally {
      setFeedLoading(false)
    }
  }

  const webcalUrl = feedUrl.replace(/^https?:\/\//, "webcal://")
  const googleSubscribeUrl = feedUrl
    ? `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(feedUrl)}`
    : ""

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
        description="View your student's upcoming deadlines, tasks, and meetings."
      />

      {/* Filter toggles + Export/Subscribe */}
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
          <Button
            size="sm"
            className="gap-1.5 text-xs bg-[#2563EB] hover:bg-[#2563EB]/90"
            onClick={handleSubscribe}
            disabled={feedLoading}
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            Subscribe
          </Button>
        </div>
      </div>

      <div className="rounded-2xl bg-card ring-1 ring-foreground/5 shadow-sm overflow-hidden">
        <FullScreenCalendar
          data={data}
          visibleTypes={visibleTypes}
          onEventClick={(event) => {
            if (event.link) router.push(event.link)
          }}
        />
      </div>

      {/* Subscribe Dialog */}
      <Dialog open={subscribeOpen} onOpenChange={setSubscribeOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Subscribe to Calendar</DialogTitle>
            <DialogDescription>
              Add this feed to your calendar app. It will automatically update whenever your student&apos;s deadlines or meetings change.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <a
                href={googleSubscribeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google Calendar
              </a>
              <a
                href={webcalUrl}
                className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
              >
                <svg className="h-5 w-5 text-foreground" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
                </svg>
                Apple / Outlook
              </a>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Calendar Feed URL</label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={feedUrl}
                  className="text-xs font-mono bg-muted/30"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={handleCopyUrl}>
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Paste this URL into any calendar app that supports ICS subscriptions. Refreshes automatically every 6 hours.
              </p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <p className="text-[11px] text-muted-foreground">
                Regenerate to revoke access.
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs gap-1.5 text-muted-foreground hover:text-rose-600"
                onClick={handleResetToken}
                disabled={feedLoading}
              >
                <RefreshCw className="h-3 w-3" />
                Regenerate
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
