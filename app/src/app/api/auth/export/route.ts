import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { logAudit } from "@/lib/audit"

/**
 * GET /api/auth/export
 * Download all personal data associated with the current user.
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Fetch all user data in parallel
    const [
      user,
      studentProfile,
      parentProfile,
      tasks,
      essays,
      documents,
      activities,
      applications,
      financialPlans,
      sentMessages,
      receivedMessages,
    ] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          // Exclude password hash
        },
      }),
      db.studentProfile.findUnique({
        where: { userId },
      }),
      db.parentProfile.findUnique({
        where: { userId },
      }),
      db.task.findMany({ where: { userId } }),
      db.essay.findMany({
        where: { userId },
        include: { versions: true },
      }),
      db.document.findMany({ where: { userId } }),
      db.activity.findMany({ where: { userId } }),
      db.scholarshipApplication.findMany({
        where: { userId },
        include: {
          scholarship: {
            select: { name: true, provider: true, amount: true },
          },
        },
      }),
      db.financialPlan.findMany({ where: { userId } }),
      db.message.findMany({
        where: { senderId: userId },
        select: {
          id: true,
          content: true,
          createdAt: true,
          receiverId: true,
        },
      }),
      db.message.findMany({
        where: { receiverId: userId },
        select: {
          id: true,
          content: true,
          createdAt: true,
          senderId: true,
        },
      }),
    ])

    const exportData = {
      exportedAt: new Date().toISOString(),
      account: user,
      studentProfile: studentProfile || undefined,
      parentProfile: parentProfile || undefined,
      tasks,
      essays,
      documents: documents.map((d) => ({
        ...d,
        // Include metadata but not internal URL
        url: "[file stored securely]",
      })),
      activities,
      scholarshipApplications: applications,
      financialPlans,
      messagesSent: sentMessages,
      messagesReceived: receivedMessages,
    }

    logAudit({
      userId,
      action: "DATA_EXPORTED",
      resource: "user",
      resourceId: userId,
    })

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="scholarsuite-data-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    })
  } catch (error) {
    console.error("Data export error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
