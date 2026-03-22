import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
}

function escapeICS(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n")
}

interface ICSEvent {
  uid: string
  summary: string
  dtstart: Date
  dtend?: Date
  description?: string
  categories?: string
}

function buildICSFeed(events: ICSEvent[], calName: string): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ScholarSuite//Calendar Feed//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeICS(calName)}`,
    "X-WR-TIMEZONE:America/New_York",
    // Refresh every 6 hours
    "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
    "X-PUBLISHED-TTL:PT6H",
  ]

  for (const event of events) {
    const dtstart = formatICSDate(event.dtstart)
    const dtend = event.dtend ? formatICSDate(event.dtend) : dtstart

    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.uid}@scholarsuite.app`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:${escapeICS(event.summary)}`,
    )

    if (event.description) {
      lines.push(`DESCRIPTION:${escapeICS(event.description)}`)
    }
    if (event.categories) {
      lines.push(`CATEGORIES:${escapeICS(event.categories)}`)
    }

    lines.push("END:VEVENT")
  }

  lines.push("END:VCALENDAR")
  return lines.join("\r\n")
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // Find user by calendar token
    const user = await db.user.findUnique({
      where: { calendarToken: token },
      select: { id: true, name: true, role: true },
    })

    if (!user) {
      return new NextResponse("Invalid calendar feed token", { status: 404 })
    }

    const events: ICSEvent[] = []

    if (user.role === "STUDENT") {
      // Tasks
      const tasks = await db.task.findMany({
        where: { userId: user.id, dueDate: { not: null } },
      })
      for (const task of tasks) {
        if (!task.dueDate) continue
        events.push({
          uid: `task-${task.id}`,
          summary: `[Task] ${task.title}`,
          dtstart: task.dueDate,
          description: `Status: ${task.status}${task.priority ? ` | Priority: ${task.priority}` : ""}`,
          categories: "Task",
        })
      }

      // Scholarship deadlines
      const applications = await db.scholarshipApplication.findMany({
        where: { userId: user.id },
        include: { scholarship: true },
      })
      for (const app of applications) {
        if (!app.scholarship.deadline) continue
        events.push({
          uid: `scholarship-${app.id}`,
          summary: `[Scholarship] ${app.scholarship.name}`,
          dtstart: app.scholarship.deadline,
          description: `Amount: ${app.scholarship.amount ? `$${app.scholarship.amount}` : "Varies"} | Status: ${app.status}`,
          categories: "Scholarship",
        })
      }

      // College application deadlines
      const collegeApps = await db.collegeApplication.findMany({
        where: { userId: user.id },
      })
      for (const app of collegeApps) {
        if (app.deadline) {
          events.push({
            uid: `college-${app.id}`,
            summary: `[College] ${app.universityName} Application`,
            dtstart: app.deadline,
            description: `Type: ${app.applicationType || "Regular"} | Status: ${app.status}`,
            categories: "College Application",
          })
        }
        if (app.financialAidDeadline) {
          events.push({
            uid: `college-finaid-${app.id}`,
            summary: `[Financial Aid] ${app.universityName}`,
            dtstart: app.financialAidDeadline,
            description: `Financial aid deadline for ${app.universityName}`,
            categories: "College Application",
          })
        }
        if (app.depositDeadline) {
          events.push({
            uid: `college-deposit-${app.id}`,
            summary: `[Deposit] ${app.universityName}`,
            dtstart: app.depositDeadline,
            description: `Enrollment deposit deadline for ${app.universityName}`,
            categories: "College Application",
          })
        }
      }

      // Meetings
      const meetings = await db.meeting.findMany({
        where: {
          participants: { some: { userId: user.id } },
          status: { not: "CANCELLED" },
        },
      })
      for (const meeting of meetings) {
        events.push({
          uid: `meeting-${meeting.id}`,
          summary: `[Meeting] ${meeting.title}`,
          dtstart: meeting.startTime,
          dtend: meeting.endTime,
          description: meeting.description || undefined,
          categories: "Meeting",
        })
      }
    } else if (user.role === "PARENT") {
      // Linked students' events
      const links = await db.parentStudent.findMany({
        where: { parentId: user.id },
      })
      const studentIds = links.map((l) => l.studentId)

      if (studentIds.length > 0) {
        const tasks = await db.task.findMany({
          where: { userId: { in: studentIds }, dueDate: { not: null } },
          include: { user: { select: { name: true } } },
        })
        for (const task of tasks) {
          if (!task.dueDate) continue
          events.push({
            uid: `task-${task.id}`,
            summary: `[Task] ${task.title}${task.user?.name ? ` (${task.user.name})` : ""}`,
            dtstart: task.dueDate,
            categories: "Task",
          })
        }

        const applications = await db.scholarshipApplication.findMany({
          where: { userId: { in: studentIds } },
          include: { scholarship: true, user: { select: { name: true } } },
        })
        for (const app of applications) {
          if (!app.scholarship.deadline) continue
          events.push({
            uid: `scholarship-${app.id}`,
            summary: `[Scholarship] ${app.scholarship.name}${app.user?.name ? ` (${app.user.name})` : ""}`,
            dtstart: app.scholarship.deadline,
            categories: "Scholarship",
          })
        }

        const collegeApps = await db.collegeApplication.findMany({
          where: { userId: { in: studentIds }, deadline: { not: null } },
          include: { user: { select: { name: true } } },
        })
        for (const app of collegeApps) {
          if (!app.deadline) continue
          events.push({
            uid: `college-${app.id}`,
            summary: `[College] ${app.universityName}${app.user?.name ? ` (${app.user.name})` : ""}`,
            dtstart: app.deadline,
            categories: "College Application",
          })
        }
      }

      // Parent's meetings
      const meetings = await db.meeting.findMany({
        where: {
          participants: { some: { userId: user.id } },
          status: { not: "CANCELLED" },
        },
      })
      for (const meeting of meetings) {
        events.push({
          uid: `meeting-${meeting.id}`,
          summary: `[Meeting] ${meeting.title}`,
          dtstart: meeting.startTime,
          dtend: meeting.endTime,
          categories: "Meeting",
        })
      }
    } else if (user.role === "ADMIN") {
      const meetings = await db.meeting.findMany({
        where: { status: { not: "CANCELLED" } },
      })
      for (const meeting of meetings) {
        events.push({
          uid: `meeting-${meeting.id}`,
          summary: `[Meeting] ${meeting.title}`,
          dtstart: meeting.startTime,
          dtend: meeting.endTime,
          categories: "Meeting",
        })
      }

      const scholarships = await db.scholarship.findMany({
        where: { isActive: true, deadline: { not: null } },
      })
      for (const s of scholarships) {
        if (!s.deadline) continue
        events.push({
          uid: `scholarship-${s.id}`,
          summary: `[Scholarship] ${s.name}`,
          dtstart: s.deadline,
          categories: "Scholarship",
        })
      }
    }

    // General calendar events
    const calendarEvents = await db.calendarEvent.findMany()
    for (const ce of calendarEvents) {
      events.push({
        uid: `general-${ce.id}`,
        summary: ce.title,
        dtstart: ce.date,
        categories: "General",
      })
    }

    const calName = `ScholarSuite - ${user.name || "My Calendar"}`
    const ics = buildICSFeed(events, calName)

    return new NextResponse(ics, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": "inline; filename=scholarsuite.ics",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    })
  } catch (error) {
    console.error("Calendar feed error:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}
