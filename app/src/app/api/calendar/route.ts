import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

interface CalendarEvent {
  id: string
  name: string
  time: string
  datetime: string
  type: "scholarship" | "task" | "meeting" | "college" | "general"
  day: string
  link?: string
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

function formatDay(date: Date): string {
  return date.toISOString().split("T")[0]
}

function formatDatetime(date: Date): string {
  return date.toISOString().slice(0, 19)
}

function groupByDay(events: CalendarEvent[]) {
  const grouped: Record<string, CalendarEvent[]> = {}
  for (const event of events) {
    if (!grouped[event.day]) grouped[event.day] = []
    grouped[event.day].push(event)
  }
  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, dayEvents]) => ({
      day,
      events: dayEvents.sort((a, b) => a.datetime.localeCompare(b.datetime)),
    }))
}

async function getStudentEvents(studentIds: string[]): Promise<CalendarEvent[]> {
  const events: CalendarEvent[] = []

  // Tasks with due dates
  const tasks = await db.task.findMany({
    where: {
      userId: { in: studentIds },
      dueDate: { not: null },
    },
  })
  for (const task of tasks) {
    if (!task.dueDate) continue
    events.push({
      id: `task-${task.id}`,
      name: task.title,
      time: formatTime(task.dueDate),
      datetime: formatDatetime(task.dueDate),
      type: "task",
      day: formatDay(task.dueDate),
    })
  }

  // Scholarship deadlines from applications
  const applications = await db.scholarshipApplication.findMany({
    where: { userId: { in: studentIds } },
    include: { scholarship: true },
  })
  for (const app of applications) {
    if (!app.scholarship.deadline) continue
    events.push({
      id: `scholarship-${app.id}`,
      name: app.scholarship.name,
      time: formatTime(app.scholarship.deadline),
      datetime: formatDatetime(app.scholarship.deadline),
      type: "scholarship",
      day: formatDay(app.scholarship.deadline),
      link: `/student/applications/${app.id}`,
    })
  }

  // College application deadlines
  const collegeApps = await db.collegeApplication.findMany({
    where: {
      userId: { in: studentIds },
      deadline: { not: null },
    },
  })
  for (const app of collegeApps) {
    if (!app.deadline) continue
    events.push({
      id: `college-${app.id}`,
      name: `${app.universityName} Application`,
      time: formatTime(app.deadline),
      datetime: formatDatetime(app.deadline),
      type: "college",
      day: formatDay(app.deadline),
    })
  }

  return events
}

async function getMeetingEvents(userId: string): Promise<CalendarEvent[]> {
  const meetings = await db.meeting.findMany({
    where: {
      participants: { some: { userId } },
      status: { not: "CANCELLED" },
    },
  })
  return meetings.map((meeting) => ({
    id: `meeting-${meeting.id}`,
    name: meeting.title,
    time: formatTime(meeting.startTime),
    datetime: formatDatetime(meeting.startTime),
    type: "meeting" as const,
    day: formatDay(meeting.startTime),
  }))
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const role = session.user.role
    const events: CalendarEvent[] = []

    if (role === "STUDENT") {
      // Student's own tasks, scholarship deadlines, college apps
      const studentEvents = await getStudentEvents([userId])
      events.push(...studentEvents)

      // Student's meetings
      const meetingEvents = await getMeetingEvents(userId)
      events.push(...meetingEvents)
    } else if (role === "PARENT") {
      // Find linked students
      const links = await db.parentStudent.findMany({
        where: { parentId: userId },
      })
      const studentIds = links.map((l) => l.studentId)

      if (studentIds.length > 0) {
        const studentEvents = await getStudentEvents(studentIds)
        events.push(...studentEvents)
      }

      // Parent's own meetings
      const meetingEvents = await getMeetingEvents(userId)
      events.push(...meetingEvents)
    } else if (role === "ADMIN") {
      // All upcoming meetings (not cancelled)
      const meetings = await db.meeting.findMany({
        where: { status: { not: "CANCELLED" } },
      })
      for (const meeting of meetings) {
        events.push({
          id: `meeting-${meeting.id}`,
          name: meeting.title,
          time: formatTime(meeting.startTime),
          datetime: formatDatetime(meeting.startTime),
          type: "meeting",
          day: formatDay(meeting.startTime),
        })
      }

      // All active scholarship deadlines
      const scholarships = await db.scholarship.findMany({
        where: {
          isActive: true,
          deadline: { not: null },
        },
      })
      for (const s of scholarships) {
        if (!s.deadline) continue
        events.push({
          id: `scholarship-${s.id}`,
          name: s.name,
          time: formatTime(s.deadline),
          datetime: formatDatetime(s.deadline),
          type: "scholarship",
          day: formatDay(s.deadline),
        })
      }
    }

    // Also include CalendarEvent records from the database (general events)
    const calendarEvents = await db.calendarEvent.findMany()
    for (const ce of calendarEvents) {
      events.push({
        id: `general-${ce.id}`,
        name: ce.title,
        time: formatTime(ce.date),
        datetime: formatDatetime(ce.date),
        type: (ce.type as CalendarEvent["type"]) || "general",
        day: formatDay(ce.date),
      })
    }

    const grouped = groupByDay(events)
    return NextResponse.json(grouped)
  } catch (error) {
    console.error("Calendar API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
