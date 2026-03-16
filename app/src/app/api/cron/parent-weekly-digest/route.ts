import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getResend } from "@/lib/resend"
import { sendSms } from "@/lib/sms"

/**
 * POST /api/cron/parent-weekly-digest
 * Sends weekly activity digest to parents who opted in.
 * Protected by CRON_SECRET bearer token.
 *
 * Call weekly via Railway cron or external scheduler (e.g., Monday 8 AM):
 *   curl -X POST https://yourapp.railway.app/api/cron/parent-weekly-digest \
 *     -H "Authorization: Bearer YOUR_CRON_SECRET"
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Find parents with weekly digest enabled
    const parents = await db.user.findMany({
      where: {
        role: "PARENT",
        isActive: true,
        parentProfile: {
          notifyWeeklyDigest: true,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        parentProfile: {
          select: {
            notifyChannel: true,
            smsConsent: true,
            smsPhone: true,
          },
        },
        linkedStudents: {
          select: {
            studentId: true,
            student: { select: { name: true } },
          },
        },
      },
    })

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    let parentsNotified = 0
    const resend = getResend()

    for (const parent of parents) {
      const studentIds = parent.linkedStudents.map((l) => l.studentId)
      if (studentIds.length === 0) continue

      // Get activity events for this parent's students
      const events = await db.activityEvent.findMany({
        where: {
          studentId: { in: studentIds },
          createdAt: { gte: weekAgo },
        },
        orderBy: { createdAt: "desc" },
      })

      if (events.length === 0) continue

      // Summarize
      const tasks = events.filter((e) => e.type === "TASK_COMPLETED").length
      const scholarships = events.filter((e) => e.type === "SCHOLARSHIP_APP_SUBMITTED").length
      const collegeApps = events.filter((e) => e.type === "COLLEGE_APP_SUBMITTED").length
      const essays = events.filter((e) => e.type === "ESSAY_STATUS_CHANGED").length

      const studentNames = parent.linkedStudents.map((l) => l.student.name || "Your student").join(", ")

      // Send email if opted in
      const profile = parent.parentProfile
      if (
        profile &&
        (profile.notifyChannel === "EMAIL" || profile.notifyChannel === "BOTH")
      ) {
        try {
          await resend.emails.send({
            from: process.env.EMAIL_FROM || "ScholarSuite <notifications@scholarsuite.app>",
            to: parent.email,
            subject: `Weekly Update: ${studentNames}`,
            html: `
              <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                <h2 style="color: #1E3A5F;">Weekly Progress Report</h2>
                <p>Hi ${parent.name || "there"}, here's what happened this week for ${studentNames}:</p>
                <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                  <tr><td style="padding: 8px; border-bottom: 1px solid #eee;">Tasks Completed</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; text-align: right;">${tasks}</td></tr>
                  <tr><td style="padding: 8px; border-bottom: 1px solid #eee;">Scholarship Applications</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; text-align: right;">${scholarships}</td></tr>
                  <tr><td style="padding: 8px; border-bottom: 1px solid #eee;">College Applications</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; text-align: right;">${collegeApps}</td></tr>
                  <tr><td style="padding: 8px;">Essay Updates</td><td style="padding: 8px; font-weight: bold; text-align: right;">${essays}</td></tr>
                </table>
                <a href="${process.env.NEXTAUTH_URL || process.env.AUTH_URL}/parent/updates" style="display: inline-block; background: #1E3A5F; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
                  View Full Activity
                </a>
                <p style="color: #888; font-size: 13px;">You're receiving this because you opted into weekly digests on ScholarSuite.</p>
              </div>
            `,
          })
        } catch (emailError) {
          console.error(`Failed to send weekly digest email to ${parent.email}:`, emailError)
        }
      }

      // Send SMS if opted in
      if (
        profile &&
        (profile.notifyChannel === "SMS" || profile.notifyChannel === "BOTH") &&
        profile.smsConsent &&
        profile.smsPhone
      ) {
        const smsBody = `ScholarSuite Weekly: ${studentNames} completed ${tasks} tasks, ${scholarships} scholarship apps, ${collegeApps} college apps this week. Check the app for details.`
        try {
          await sendSms(profile.smsPhone, smsBody)
        } catch (smsError) {
          console.error(`Failed to send weekly digest SMS to ${profile.smsPhone}:`, smsError)
        }
      }

      parentsNotified++
    }

    return NextResponse.json({ parentsNotified, totalParents: parents.length })
  } catch (error) {
    console.error("Parent weekly digest error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
