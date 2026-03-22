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

  // College application deadlines (including financial aid + deposit)
  const collegeApps = await db.collegeApplication.findMany({
    where: { userId: { in: studentIds } },
  })
  for (const app of collegeApps) {
    if (app.deadline) {
      events.push({
        id: `college-${app.id}`,
        name: `${app.universityName} Application`,
        time: formatTime(app.deadline),
        datetime: formatDatetime(app.deadline),
        type: "college",
        day: formatDay(app.deadline),
      })
    }
    if (app.financialAidDeadline) {
      events.push({
        id: `college-finaid-${app.id}`,
        name: `${app.universityName} Financial Aid`,
        time: formatTime(app.financialAidDeadline),
        datetime: formatDatetime(app.financialAidDeadline),
        type: "college",
        day: formatDay(app.financialAidDeadline),
      })
    }
    if (app.depositDeadline) {
      events.push({
        id: `college-deposit-${app.id}`,
        name: `${app.universityName} Deposit`,
        time: formatTime(app.depositDeadline),
        datetime: formatDatetime(app.depositDeadline),
        type: "college",
        day: formatDay(app.depositDeadline),
      })
    }
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

    // Admin can request a specific student's calendar
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")
    if (role === "ADMIN" && studentId) {
      const studentEvents = await getStudentEvents([studentId])
      events.push(...studentEvents)
      const meetingEvents = await getMeetingEvents(studentId)
      events.push(...meetingEvents)
      const grouped = groupByDay(events)
      return NextResponse.json(grouped)
    }

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

      // Admin tasks with due dates
      const adminTasks = await db.task.findMany({
        where: { dueDate: { not: null } },
        include: { user: { select: { name: true } } },
      })
      for (const task of adminTasks) {
        if (!task.dueDate) continue
        events.push({
          id: `task-${task.id}`,
          name: `${task.title}${task.user?.name ? ` (${task.user.name})` : ""}`,
          time: formatTime(task.dueDate),
          datetime: formatDatetime(task.dueDate),
          type: "task",
          day: formatDay(task.dueDate),
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

// POST — create a new calendar event (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if ((session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, date, endDate, type } = body

    if (!title || !date) {
      return NextResponse.json({ error: "Title and date are required" }, { status: 400 })
    }

    const event = await db.calendarEvent.create({
      data: {
        title,
        description: description || null,
        date: new Date(date),
        endDate: endDate ? new Date(endDate) : null,
        type: type || "general",
        createdById: session.user.id,
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error("Calendar POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE — remove a calendar event (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if ((session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Missing event id" }, { status: 400 })
    }

    await db.calendarEvent.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Calendar DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
