import { db } from "@/lib/db"

/**
 * Utility to auto-generate tasks when college-related events happen.
 * All functions check for duplicates before creating (same userId + title, not DONE).
 */

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

interface TaskDef {
  title: string
  description?: string
  track: "COLLEGE_APP" | "COLLEGE_PREP" | "FINANCIAL"
  priority: "LOW" | "MEDIUM" | "HIGH"
  dueDate?: Date | null
}

async function createTasksIfNotExists(userId: string, tasks: TaskDef[]) {
  const results = []

  for (const task of tasks) {
    // Check for duplicate: same user + title that isn't DONE
    const existing = await db.task.findFirst({
      where: {
        userId,
        title: task.title,
        status: { not: "DONE" },
      },
    })

    if (existing) continue

    const created = await db.task.create({
      data: {
        userId,
        title: task.title,
        description: task.description || null,
        phase: "ONGOING",
        track: task.track,
        status: "NOT_STARTED",
        priority: task.priority,
        dueDate: task.dueDate ?? null,
        notifyParent: true,
      },
    })

    results.push(created)
  }

  return results
}

/**
 * Called when a student adds a college to their list.
 */
export async function generateCollegeAddedTasks(
  userId: string,
  collegeName: string,
  _collegeAppId: string
) {
  return createTasksIfNotExists(userId, [
    {
      title: `Research ${collegeName}`,
      description:
        "Review programs, campus culture, and admission requirements.",
      track: "COLLEGE_PREP",
      priority: "MEDIUM",
    },
  ])
}

/**
 * Called when a student starts an application.
 */
export async function generateApplicationStartedTasks(
  userId: string,
  collegeName: string,
  _appType: string,
  deadline: Date | null
) {
  const due30 = deadline ? addDays(deadline, -30) : null
  const due14 = deadline ? addDays(deadline, -14) : null

  return createTasksIfNotExists(userId, [
    {
      title: `Request official transcript for ${collegeName}`,
      description:
        "Contact your school counselor to send your official transcript.",
      track: "COLLEGE_APP",
      priority: "HIGH",
      dueDate: due30,
    },
    {
      title: `Send test scores to ${collegeName}`,
      description:
        "Request official SAT/ACT score reports be sent to this school.",
      track: "COLLEGE_APP",
      priority: "MEDIUM",
      dueDate: due30,
    },
    {
      title: `Complete ${collegeName} supplemental essays`,
      description:
        "Draft and finalize all required supplemental essays for this application.",
      track: "COLLEGE_APP",
      priority: "HIGH",
      dueDate: due14,
    },
    {
      title: `Request letters of recommendation for ${collegeName}`,
      description:
        "Ask teachers and counselors for recommendation letters well in advance.",
      track: "COLLEGE_APP",
      priority: "HIGH",
      dueDate: due30,
    },
    {
      title: `Submit ${collegeName} application`,
      description:
        "Review all sections and submit the completed application.",
      track: "COLLEGE_APP",
      priority: "HIGH",
      dueDate: deadline,
    },
    {
      title: `Pay application fee or submit fee waiver for ${collegeName}`,
      description:
        "Ensure the application fee is paid or a fee waiver is submitted.",
      track: "COLLEGE_APP",
      priority: "MEDIUM",
      dueDate: deadline,
    },
  ])
}

/**
 * Called when application status changes to ACCEPTED.
 */
export async function generateAcceptedTasks(
  userId: string,
  collegeName: string,
  depositDeadline: Date | null
) {
  const now = new Date()

  return createTasksIfNotExists(userId, [
    {
      title: `Review ${collegeName} financial aid package`,
      description:
        "Carefully review the financial aid offer including grants, loans, and work-study.",
      track: "FINANCIAL",
      priority: "HIGH",
      dueDate: addDays(now, 7),
    },
    {
      title: `Compare ${collegeName} offer with other acceptances`,
      description:
        "Create a side-by-side comparison of costs, aid, and fit across all acceptances.",
      track: "FINANCIAL",
      priority: "MEDIUM",
      dueDate: addDays(now, 14),
    },
    {
      title: `Submit enrollment deposit for ${collegeName}`,
      description:
        "Pay the enrollment deposit to secure your spot.",
      track: "FINANCIAL",
      priority: "HIGH",
      dueDate: depositDeadline ?? addDays(now, 30),
    },
  ])
}

/**
 * Called when a student commits to a school.
 */
export async function generateCommittedTasks(
  userId: string,
  collegeName: string
) {
  const now = new Date()

  return createTasksIfNotExists(userId, [
    {
      title: `Complete ${collegeName} housing application`,
      description:
        "Submit your housing application and any roommate preferences.",
      track: "COLLEGE_PREP",
      priority: "HIGH",
      dueDate: addDays(now, 30),
    },
    {
      title: `Register for ${collegeName} orientation`,
      description:
        "Sign up for new student orientation sessions.",
      track: "COLLEGE_PREP",
      priority: "MEDIUM",
      dueDate: addDays(now, 60),
    },
    {
      title: `Submit final transcript to ${collegeName}`,
      description:
        "Ensure your school sends your final transcript after graduation.",
      track: "COLLEGE_APP",
      priority: "HIGH",
      dueDate: addDays(now, 90),
    },
    {
      title: `Set up ${collegeName} student email and portal accounts`,
      description:
        "Activate your student email and access the university portal.",
      track: "COLLEGE_PREP",
      priority: "LOW",
      dueDate: addDays(now, 30),
    },
    {
      title: `Research ${collegeName} meal plan options`,
      description:
        "Review available meal plans and select one before the deadline.",
      track: "COLLEGE_PREP",
      priority: "LOW",
      dueDate: addDays(now, 60),
    },
  ])
}

/**
 * Called when a campus visit is scheduled.
 */
export async function generateVisitTasks(
  userId: string,
  collegeName: string,
  visitDate: Date
) {
  return createTasksIfNotExists(userId, [
    {
      title: `Prepare questions for ${collegeName} visit`,
      description:
        "Write down questions about academics, campus life, financial aid, and housing.",
      track: "COLLEGE_PREP",
      priority: "MEDIUM",
      dueDate: addDays(visitDate, -1),
    },
  ])
}
