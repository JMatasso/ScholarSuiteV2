import { db } from "@/lib/db"

/**
 * Utility to auto-generate tasks when college-related events happen.
 * All functions check for duplicates before creating (same userId + title, not DONE).
 * Respects `doneApplying` flag — no new college tasks if student is done applying.
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

async function isDoneApplying(userId: string): Promise<boolean> {
  const profile = await db.studentProfile.findUnique({
    where: { userId },
    select: { doneApplying: true },
  })
  return profile?.doneApplying ?? false
}

async function createTasksIfNotExists(userId: string, tasks: TaskDef[]) {
  const results = []

  for (const task of tasks) {
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
 * Skipped if student is done applying.
 */
export async function generateCollegeAddedTasks(
  userId: string,
  collegeName: string,
  _collegeAppId: string
) {
  if (await isDoneApplying(userId)) return []

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
 * Skipped if student is done applying.
 */
export async function generateApplicationStartedTasks(
  userId: string,
  collegeName: string,
  _appType: string,
  deadline: Date | null
) {
  if (await isDoneApplying(userId)) return []

  const due14 = deadline ? addDays(deadline, -14) : null

  return createTasksIfNotExists(userId, [
    {
      title: `Complete ${collegeName} supplemental essays`,
      description:
        "Draft and finalize all required supplemental essays for this application.",
      track: "COLLEGE_APP",
      priority: "HIGH",
      dueDate: due14,
    },
    {
      title: `Submit ${collegeName} application`,
      description:
        "Review all sections and submit the completed application.",
      track: "COLLEGE_APP",
      priority: "HIGH",
      dueDate: deadline,
    },
  ])
}

/**
 * Called when application status changes to ACCEPTED.
 * Always runs (post-acceptance tasks are still needed even if done applying).
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
 * Always runs.
 */
export async function generateCommittedTasks(
  userId: string,
  collegeName: string
) {
  const now = new Date()

  return createTasksIfNotExists(userId, [
    {
      title: `Submit final transcript to ${collegeName}`,
      description:
        "Ensure your school sends your final transcript after graduation.",
      track: "COLLEGE_APP",
      priority: "HIGH",
      dueDate: addDays(now, 90),
    },
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
