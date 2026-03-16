"use client"

import * as React from "react"
import {
  add,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isEqual,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
  startOfToday,
  startOfWeek,
} from "date-fns"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useMediaQuery } from "@/hooks/use-media-query"

export type EventType = "scholarship" | "task" | "meeting" | "college" | "general"

export interface CalendarEvent {
  id: string | number
  name: string
  time: string
  datetime: string
  type?: EventType
}

export interface CalendarData {
  day: Date
  events: CalendarEvent[]
}

interface FullScreenCalendarProps {
  data: CalendarData[]
  onDateSelect?: (day: Date) => void
  onEventClick?: (event: CalendarEvent) => void
  compact?: boolean
}

const colStartClasses = [
  "",
  "col-start-2",
  "col-start-3",
  "col-start-4",
  "col-start-5",
  "col-start-6",
  "col-start-7",
]

const eventTypeColors: Record<EventType, { bg: string; text: string; dot: string }> = {
  scholarship: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  task: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  meeting: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  college: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  general: { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-400" },
}

export function FullScreenCalendar({ data, onDateSelect, onEventClick, compact = false }: FullScreenCalendarProps) {
  const today = startOfToday()
  const [selectedDay, setSelectedDay] = React.useState(today)
  const [currentMonth, setCurrentMonth] = React.useState(
    format(today, "MMM-yyyy"),
  )
  const firstDayCurrentMonth = parse(currentMonth, "MMM-yyyy", new Date())
  const isDesktop = useMediaQuery("(min-width: 768px)")

  const days = eachDayOfInterval({
    start: startOfWeek(firstDayCurrentMonth),
    end: endOfWeek(endOfMonth(firstDayCurrentMonth)),
  })

  function previousMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: -1 })
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"))
  }

  function nextMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 })
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"))
  }

  function goToToday() {
    setCurrentMonth(format(today, "MMM-yyyy"))
    setSelectedDay(today)
  }

  function handleDayClick(day: Date) {
    setSelectedDay(day)
    onDateSelect?.(day)
  }

  const selectedDayEvents = data
    .filter((d) => isSameDay(d.day, selectedDay))
    .flatMap((d) => d.events)

  return (
    <div className="flex flex-1 flex-col">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          {!compact && (
            <div className="hidden w-16 flex-col items-center justify-center rounded-lg border bg-muted p-0.5 md:flex">
              <h1 className="p-0.5 text-[10px] uppercase text-muted-foreground">
                {format(today, "MMM")}
              </h1>
              <div className="flex w-full items-center justify-center rounded-md border bg-background text-lg font-bold">
                <span>{format(today, "d")}</span>
              </div>
            </div>
          )}
          <div>
            <h2 className={cn("font-semibold text-foreground", compact ? "text-sm" : "text-lg")}>
              {format(firstDayCurrentMonth, "MMMM yyyy")}
            </h2>
            {!compact && (
              <p className="text-xs text-muted-foreground">
                {format(firstDayCurrentMonth, "MMM d")} – {format(endOfMonth(firstDayCurrentMonth), "MMM d, yyyy")}
              </p>
            )}
          </div>
        </div>

        <div className="inline-flex -space-x-px rounded-lg shadow-sm shadow-black/5">
          <Button
            onClick={previousMonth}
            className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10"
            variant="outline"
            size="icon"
          >
            <ChevronLeftIcon size={16} />
          </Button>
          <Button
            onClick={goToToday}
            className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10"
            variant="outline"
            size={compact ? "sm" : "default"}
          >
            Today
          </Button>
          <Button
            onClick={nextMonth}
            className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10"
            variant="outline"
            size="icon"
          >
            <ChevronRightIcon size={16} />
          </Button>
        </div>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 border-y text-center text-xs font-semibold leading-6 text-muted-foreground">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="border-r last:border-r-0 py-2">{d}</div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="flex flex-1 text-xs leading-6">
        {/* Desktop full grid */}
        <div className={cn("hidden w-full lg:grid lg:grid-cols-7", compact ? "lg:grid-rows-5" : "lg:grid-rows-5")}>
          {days.map((day, dayIdx) => (
            <div
              key={dayIdx}
              onClick={() => handleDayClick(day)}
              className={cn(
                dayIdx === 0 && colStartClasses[getDay(day)],
                !isEqual(day, selectedDay) &&
                  !isToday(day) &&
                  !isSameMonth(day, firstDayCurrentMonth) &&
                  "bg-muted/30 text-muted-foreground",
                isEqual(day, selectedDay) && "bg-blue-50/50",
                "relative flex cursor-pointer flex-col border-b border-r transition-colors hover:bg-muted/50",
              )}
            >
              <header className="flex items-center justify-between p-2">
                <button
                  type="button"
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs transition-colors",
                    isEqual(day, selectedDay) && isToday(day) && "bg-[#2563EB] text-white font-semibold",
                    isEqual(day, selectedDay) && !isToday(day) && "bg-[#1E3A5F] text-white font-semibold",
                    isToday(day) && !isEqual(day, selectedDay) && "bg-blue-100 text-[#2563EB] font-semibold",
                    !isEqual(day, selectedDay) && !isToday(day) && "hover:bg-muted",
                  )}
                >
                  <time dateTime={format(day, "yyyy-MM-dd")}>
                    {format(day, "d")}
                  </time>
                </button>
              </header>
              <div className={cn("flex-1 px-2 pb-1", compact ? "space-y-0.5" : "space-y-1")}>
                {data
                  .filter((event) => isSameDay(event.day, day))
                  .map((dayData) => (
                    <div key={dayData.day.toString()} className="space-y-1">
                      {dayData.events.slice(0, compact ? 1 : 2).map((event) => {
                        const colors = eventTypeColors[event.type || "general"]
                        return (
                          <div
                            key={event.id}
                            onClick={(e) => { e.stopPropagation(); onEventClick?.(event) }}
                            className={cn(
                              "flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] leading-tight transition-colors hover:opacity-80",
                              colors.bg, colors.text
                            )}
                          >
                            <span className={cn("size-1.5 shrink-0 rounded-full", colors.dot)} />
                            <span className="truncate font-medium">{event.name}</span>
                          </div>
                        )
                      })}
                      {dayData.events.length > (compact ? 1 : 2) && (
                        <p className="px-1.5 text-[10px] text-muted-foreground">
                          +{dayData.events.length - (compact ? 1 : 2)} more
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile grid */}
        <div className="isolate grid w-full grid-cols-7 grid-rows-5 lg:hidden">
          {days.map((day, dayIdx) => (
            <button
              onClick={() => handleDayClick(day)}
              key={dayIdx}
              type="button"
              className={cn(
                "flex h-14 flex-col border-b border-r px-2 py-1.5 hover:bg-muted focus:z-10",
                !isSameMonth(day, firstDayCurrentMonth) && "text-muted-foreground",
              )}
            >
              <time
                dateTime={format(day, "yyyy-MM-dd")}
                className={cn(
                  "ml-auto flex size-6 items-center justify-center rounded-full text-xs",
                  isEqual(day, selectedDay) && isToday(day) && "bg-[#2563EB] text-white font-semibold",
                  isEqual(day, selectedDay) && !isToday(day) && "bg-[#1E3A5F] text-white font-semibold",
                  isToday(day) && !isEqual(day, selectedDay) && "bg-blue-100 text-[#2563EB] font-semibold",
                )}
              >
                {format(day, "d")}
              </time>
              {data.filter((date) => isSameDay(date.day, day)).length > 0 && (
                <div className="-mx-0.5 mt-auto flex flex-wrap-reverse">
                  {data
                    .filter((date) => isSameDay(date.day, day))
                    .flatMap((d) => d.events)
                    .slice(0, 3)
                    .map((event) => (
                      <span
                        key={event.id}
                        className={cn("mx-0.5 mt-0.5 h-1.5 w-1.5 rounded-full", eventTypeColors[event.type || "general"].dot)}
                      />
                    ))}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Day Detail Panel (mobile + optional desktop) */}
      {selectedDayEvents.length > 0 && (
        <div className="border-t p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {format(selectedDay, "EEEE, MMMM d")}
          </h3>
          <div className="space-y-2">
            {selectedDayEvents.map((event) => {
              const colors = eventTypeColors[event.type || "general"]
              return (
                <div
                  key={event.id}
                  onClick={() => onEventClick?.(event)}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2.5 cursor-pointer transition-colors hover:opacity-80",
                    colors.bg
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={cn("size-2 shrink-0 rounded-full", colors.dot)} />
                    <div>
                      <p className={cn("text-sm font-medium", colors.text)}>{event.name}</p>
                      <p className="text-xs text-muted-foreground">{event.time}</p>
                    </div>
                  </div>
                  {event.type && (
                    <span className={cn("text-[10px] font-semibold uppercase tracking-wide", colors.text)}>
                      {event.type}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
