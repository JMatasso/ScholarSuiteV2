import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getResend } from "@/lib/resend"

/**
 * POST /api/cron/daily-digest
 * Sends end-of-day message digest to admins with unread messages from assigned students.
 * Protected by CRON_SECRET bearer token.
 *
 * Call via Railway cron or external scheduler:
 *   curl -X POST https://yourapp.railway.app/api/cron/daily-digest \
 *     -H "Authorization: Bearer YOUR_CRON_SECRET"
 */
export async function POST(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Find all admins who have assigned students
    const admins = await db.user.findMany({
      where: {
        role: "ADMIN",
        isActive: true,
        assignedStudents: { some: {} },
      },
      select: {
        id: true,
        name: true,
        email: true,
        assignedStudents: {
          select: { userId: true },
        },
      },
    })

    let adminsNotified = 0
    const resend = getResend()

    for (const admin of admins) {
      const studentIds = admin.assignedStudents.map((s) => s.userId)

      // Find unread messages from assigned students to this admin
      const unreadMessages = await db.message.findMany({
        where: {
          senderId: { in: studentIds },
          receiverId: admin.id,
          isRead: false,
        },
        include: {
          sender: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      })

      if (unreadMessages.length === 0) continue

      // Group by sender
      const bySender: Record<string, { name: string; count: number; latest: string }> = {}
      for (const msg of unreadMessages) {
        const senderId = msg.senderId
        if (!bySender[senderId]) {
          bySender[senderId] = {
            name: msg.sender.name || msg.sender.email,
            count: 0,
            latest: msg.content.slice(0, 100),
          }
        }
        bySender[senderId].count++
      }

      // Build email
      const senderSummaries = Object.values(bySender)
        .map((s) => `<li><strong>${s.name}</strong>: ${s.count} unread message${s.count > 1 ? "s" : ""} — "${s.latest}${s.latest.length >= 100 ? "..." : ""}"</li>`)
        .join("")

      try {
        await resend.emails.send({
          from: process.env.EMAIL_FROM || "ScholarSuite <notifications@scholarsuite.app>",
          to: admin.email,
          subject: `${unreadMessages.length} unread student message${unreadMessages.length > 1 ? "s" : ""} today`,
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
              <h2 style="color: #1E3A5F;">Daily Message Digest</h2>
              <p>Hi ${admin.name || "there"}, you have <strong>${unreadMessages.length} unread message${unreadMessages.length > 1 ? "s" : ""}</strong> from your students:</p>
              <ul style="line-height: 1.8;">${senderSummaries}</ul>
              <a href="${process.env.NEXTAUTH_URL || process.env.AUTH_URL}/admin/messages" style="display: inline-block; background: #1E3A5F; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
                View Messages
              </a>
              <p style="color: #888; font-size: 13px;">This is an automated daily digest from ScholarSuite.</p>
            </div>
          `,
        })
        adminsNotified++
      } catch (emailError) {
        console.error(`Failed to send digest to ${admin.email}:`, emailError)
      }
    }

    return NextResponse.json({ adminsNotified, totalAdmins: admins.length })
  } catch (error) {
    console.error("Daily digest error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
