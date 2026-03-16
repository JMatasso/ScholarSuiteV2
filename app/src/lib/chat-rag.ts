import { db } from "@/lib/db"

export interface Source {
  type: string
  id: string
  label: string
}

export interface ContextResult {
  context: string
  sources: Source[]
  hasRelevantData: boolean
}

// Simple intent detection via keywords
function detectIntents(query: string): string[] {
  const q = query.toLowerCase()
  const intents: string[] = []

  if (/deadline|due|when|upcoming|soon/.test(q)) intents.push("deadlines")
  if (/scholarship|award|money|financial aid|grant|fund/.test(q)) intents.push("scholarships")
  if (/gpa|score|sat|act|profile|grade|academic/.test(q)) intents.push("profile")
  if (/essay|writing|draft|personal statement/.test(q)) intents.push("essays")
  if (/task|todo|checklist|assignment/.test(q)) intents.push("tasks")
  if (/meeting|appointment|schedule|advisor/.test(q)) intents.push("meetings")
  if (/activity|extracurricular|volunteer|club|sport/.test(q)) intents.push("activities")
  if (/financial|budget|tuition|cost|expense|income/.test(q)) intents.push("financial")
  if (/application|apply|applied|status|submit/.test(q)) intents.push("applications")
  if (/document|transcript|letter|upload/.test(q)) intents.push("documents")

  // Default: profile + scholarships + tasks if nothing matched
  if (intents.length === 0) intents.push("profile", "scholarships", "tasks")

  return intents
}

// Get student IDs for a parent user
async function getLinkedStudentIds(parentUserId: string): Promise<string[]> {
  const links = await db.parentStudent.findMany({
    where: { parentId: parentUserId },
    select: { studentId: true },
  })
  return links.map((l) => l.studentId)
}

export async function searchUserContext(
  userId: string,
  query: string,
  role: string
): Promise<ContextResult> {
  const intents = detectIntents(query)
  const sources: Source[] = []
  const contextParts: string[] = []

  // Determine which user IDs to search — for parents, use linked students
  let studentUserIds: string[] = [userId]
  if (role === "PARENT") {
    studentUserIds = await getLinkedStudentIds(userId)
    if (studentUserIds.length === 0) {
      return {
        context: "This parent has no linked students yet.",
        sources: [],
        hasRelevantData: false,
      }
    }
  }

  // Run searches based on detected intents
  const searches = intents.map(async (intent) => {
    switch (intent) {
      case "profile": {
        const profiles = await db.studentProfile.findMany({
          where: { userId: { in: studentUserIds } },
          include: { user: { select: { name: true, email: true } } },
        })
        for (const p of profiles) {
          const parts = [
            `Student: ${p.user.name || "Unknown"}`,
            p.gpa ? `GPA: ${p.gpa}` : null,
            p.gradeLevel ? `Grade: ${p.gradeLevel}` : null,
            p.satScore ? `SAT: ${p.satScore}` : null,
            p.actScore ? `ACT: ${p.actScore}` : null,
            p.intendedMajor ? `Major: ${p.intendedMajor}` : null,
            p.graduationYear ? `Graduation: ${p.graduationYear}` : null,
            `Journey: ${p.journeyStage}`,
            `Status: ${p.status}`,
            p.isFirstGen ? "First-generation student" : null,
            p.isPellEligible ? "Pell-eligible" : null,
          ].filter(Boolean)
          contextParts.push(`[Student Profile]\n${parts.join("\n")}`)
          sources.push({ type: "profile", id: p.id, label: p.user.name || "Student Profile" })
        }
        break
      }

      case "scholarships": {
        const scholarships = await db.scholarship.findMany({
          where: { isActive: true },
          orderBy: { deadline: "asc" },
          take: 10,
          select: { id: true, name: true, provider: true, amount: true, amountMax: true, deadline: true, description: true },
        })
        if (scholarships.length > 0) {
          const list = scholarships.map((s) => {
            const amt = s.amount ? `$${s.amount}${s.amountMax ? `-$${s.amountMax}` : ""}` : "Varies"
            const dl = s.deadline ? s.deadline.toLocaleDateString() : "No deadline"
            return `- ${s.name} (${s.provider || "Unknown"}) | ${amt} | Deadline: ${dl}`
          })
          contextParts.push(`[Available Scholarships]\n${list.join("\n")}`)
          scholarships.forEach((s) => sources.push({ type: "scholarship", id: s.id, label: s.name }))
        }
        break
      }

      case "applications": {
        const apps = await db.scholarshipApplication.findMany({
          where: { userId: { in: studentUserIds } },
          include: { scholarship: { select: { name: true, deadline: true, amount: true } } },
          take: 10,
        })
        if (apps.length > 0) {
          const list = apps.map((a) => {
            const amt = a.amountAwarded ? `Awarded: $${a.amountAwarded}` : `Amount: $${a.scholarship.amount || "N/A"}`
            return `- ${a.scholarship.name} | Status: ${a.status} | ${amt}`
          })
          contextParts.push(`[Scholarship Applications]\n${list.join("\n")}`)
          apps.forEach((a) => sources.push({ type: "application", id: a.id, label: a.scholarship.name }))
        }
        break
      }

      case "tasks": {
        const tasks = await db.task.findMany({
          where: { userId: { in: studentUserIds }, status: { not: "DONE" } },
          orderBy: { dueDate: "asc" },
          take: 10,
        })
        if (tasks.length > 0) {
          const list = tasks.map((t) => {
            const due = t.dueDate ? t.dueDate.toLocaleDateString() : "No due date"
            return `- ${t.title} | Status: ${t.status} | Priority: ${t.priority} | Due: ${due}`
          })
          contextParts.push(`[Open Tasks]\n${list.join("\n")}`)
          tasks.forEach((t) => sources.push({ type: "task", id: t.id, label: t.title }))
        }
        break
      }

      case "deadlines": {
        const [tasks, scholarships] = await Promise.all([
          db.task.findMany({
            where: { userId: { in: studentUserIds }, status: { not: "DONE" }, dueDate: { not: null } },
            orderBy: { dueDate: "asc" },
            take: 5,
          }),
          db.scholarship.findMany({
            where: { isActive: true, deadline: { not: null, gte: new Date() } },
            orderBy: { deadline: "asc" },
            take: 5,
          }),
        ])
        const items: string[] = []
        tasks.forEach((t) => {
          items.push(`- [Task] ${t.title} — Due: ${t.dueDate!.toLocaleDateString()}`)
          sources.push({ type: "task", id: t.id, label: t.title })
        })
        scholarships.forEach((s) => {
          items.push(`- [Scholarship] ${s.name} — Deadline: ${s.deadline!.toLocaleDateString()}`)
          sources.push({ type: "scholarship", id: s.id, label: s.name })
        })
        if (items.length > 0) {
          contextParts.push(`[Upcoming Deadlines]\n${items.join("\n")}`)
        }
        break
      }

      case "essays": {
        const essays = await db.essay.findMany({
          where: { userId: { in: studentUserIds } },
          take: 10,
          select: { id: true, title: true, status: true, updatedAt: true },
        })
        if (essays.length > 0) {
          const list = essays.map((e) => `- ${e.title} | Status: ${e.status} | Updated: ${e.updatedAt.toLocaleDateString()}`)
          contextParts.push(`[Essays]\n${list.join("\n")}`)
          essays.forEach((e) => sources.push({ type: "essay", id: e.id, label: e.title }))
        }
        break
      }

      case "meetings": {
        const meetings = await db.meeting.findMany({
          where: {
            participants: { some: { userId: { in: studentUserIds } } },
            startTime: { gte: new Date() },
          },
          orderBy: { startTime: "asc" },
          take: 5,
          select: { id: true, title: true, startTime: true, endTime: true, status: true },
        })
        if (meetings.length > 0) {
          const list = meetings.map((m) => `- ${m.title} | ${m.startTime.toLocaleString()} | Status: ${m.status}`)
          contextParts.push(`[Upcoming Meetings]\n${list.join("\n")}`)
          meetings.forEach((m) => sources.push({ type: "meeting", id: m.id, label: m.title }))
        }
        break
      }

      case "activities": {
        const activities = await db.activity.findMany({
          where: { userId: { in: studentUserIds } },
          take: 10,
        })
        if (activities.length > 0) {
          const list = activities.map((a) => {
            const hours = a.totalHours ? `${a.totalHours}h total` : a.hoursPerWeek ? `${a.hoursPerWeek}h/week` : ""
            return `- ${a.title} (${a.category}) ${a.role ? `— ${a.role}` : ""} ${hours}`
          })
          contextParts.push(`[Activities]\n${list.join("\n")}`)
          activities.forEach((a) => sources.push({ type: "activity", id: a.id, label: a.title }))
        }
        break
      }

      case "financial": {
        const plans = await db.financialPlan.findMany({
          where: { userId: { in: studentUserIds } },
          include: {
            semesters: { include: { incomeSources: true } },
          },
          take: 1,
        })
        if (plans.length > 0) {
          const plan = plans[0]
          const semList = plan.semesters.map((s) => {
            const expenses = s.tuition + s.housing + s.food + s.transportation + s.books + s.personal + s.other
            const income = s.incomeSources.reduce((sum, i) => sum + i.amount, 0)
            return `- ${s.name}: Expenses $${expenses.toFixed(0)}, Income/Aid $${income.toFixed(0)}, Gap $${(expenses - income).toFixed(0)}`
          })
          contextParts.push(`[Financial Plan]\n${semList.join("\n")}`)
          sources.push({ type: "financial", id: plan.id, label: "Financial Plan" })
        }
        break
      }

      case "documents": {
        const docs = await db.document.findMany({
          where: { userId: { in: studentUserIds } },
          take: 10,
          select: { id: true, name: true, type: true, createdAt: true },
        })
        if (docs.length > 0) {
          const list = docs.map((d) => `- ${d.name} (${d.type}) — Uploaded: ${d.createdAt.toLocaleDateString()}`)
          contextParts.push(`[Documents]\n${list.join("\n")}`)
          docs.forEach((d) => sources.push({ type: "document", id: d.id, label: d.name }))
        }
        break
      }
    }
  })

  await Promise.all(searches)

  // Deduplicate sources
  const uniqueSources = sources.filter(
    (s, i, arr) => arr.findIndex((x) => x.type === s.type && x.id === s.id) === i
  )

  return {
    context: contextParts.join("\n\n"),
    sources: uniqueSources,
    hasRelevantData: contextParts.length > 0,
  }
}
