import { db } from "@/lib/db"
import { getResend } from "@/lib/resend"

/**
 * Create an activity event for a student.
 * Fire-and-forget — does not throw on failure.
 */
export async function createActivityEvent(params: {
  studentId: string
  type: string
  title: string
  description?: string
  metadata?: Record<string, unknown>
}) {
  try {
    await db.activityEvent.create({
      data: {
        studentId: params.studentId,
        type: params.type,
        title: params.title,
        description: params.description ?? null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    })
  } catch (error) {
    console.error("Failed to create activity event:", error)
  }
}

/**
 * Notify all linked parents of a student event.
 * Creates in-app notifications + sends email/SMS based on parent preferences.
 * Fire-and-forget — does not throw on failure.
 */
export async function notifyLinkedParents(params: {
  studentId: string
  title: string
  message: string
  link?: string
  type: string
}) {
  try {
    const links = await db.parentStudent.findMany({
      where: { studentId: params.studentId },
      include: {
        parent: {
          select: {
            id: true,
            email: true,
            name: true,
            parentProfile: true,
          },
        },
      },
    })

    for (const link of links) {
      const profile = link.parent.parentProfile
      if (!profile) continue

      // Check if parent wants this type of notification
      if (!shouldNotifyParent(profile, params.type)) continue

      // Create in-app notification
      await db.notification.create({
        data: {
          userId: link.parent.id,
          title: params.title,
          message: params.message,
          type: params.type,
          link: params.link ?? null,
        },
      })

      // Send email if channel is EMAIL or BOTH
      if (
        profile.notifyChannel === "EMAIL" ||
        profile.notifyChannel === "BOTH"
      ) {
        try {
          const resend = getResend()
          await resend.emails.send({
            from:
              process.env.EMAIL_FROM ||
              "ScholarSuite <notifications@scholarsuite.app>",
            to: link.parent.email,
            subject: params.title,
            html: `
              <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                <h2 style="color: #1E3A5F;">${params.title}</h2>
                <p>${params.message}</p>
                ${params.link ? `<a href="${process.env.NEXTAUTH_URL || process.env.AUTH_URL}${params.link}" style="display: inline-block; background: #1E3A5F; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">View Details</a>` : ""}
                <p style="color: #888; font-size: 13px;">You're receiving this because you opted into notifications on ScholarSuite.</p>
              </div>
            `,
          })
        } catch (emailError) {
          console.error("Email notification failed:", emailError)
        }
      }

      // Send SMS if channel is SMS or BOTH and consent given
      if (
        (profile.notifyChannel === "SMS" ||
          profile.notifyChannel === "BOTH") &&
        profile.smsConsent &&
        profile.smsPhone
      ) {
        try {
          const { sendSms } = await import("@/lib/sms")
          await sendSms(profile.smsPhone, `ScholarSuite: ${params.message}`)
        } catch (smsError) {
          console.error("SMS notification failed:", smsError)
        }
      }
    }
  } catch (error) {
    console.error("Failed to notify parents:", error)
  }
}

function shouldNotifyParent(
  profile: {
    notifyScholarshipSubmissions: boolean
    notifyCollegeAppSubmissions: boolean
    notifyTasks: boolean
    notifyMessages: boolean
  },
  type: string
): boolean {
  if (type.startsWith("SCHOLARSHIP_APP")) return profile.notifyScholarshipSubmissions
  if (type.startsWith("COLLEGE_APP")) return profile.notifyCollegeAppSubmissions
  if (type === "TASK_COMPLETED") return profile.notifyTasks
  if (type === "ESSAY_STATUS_CHANGED") return profile.notifyTasks
  if (type === "MESSAGE") return profile.notifyMessages
  return true
}
