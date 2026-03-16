import { NextRequest, NextResponse } from "next/server"
import { withRole } from "@/lib/api-middleware"
import { db } from "@/lib/db"
import { getResend } from "@/lib/resend"
import crypto from "crypto"

// GET all campaigns
export const GET = withRole("ADMIN", async () => {
  const campaigns = await db.reviewCampaign.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { requests: true } },
      requests: {
        include: { response: true },
      },
    },
  })

  const formatted = campaigns.map((c) => {
    const completed = c.requests.filter((r) => r.status === "COMPLETED").length
    return {
      id: c.id,
      name: c.name,
      message: c.message,
      sentBy: c.sentBy,
      recipientCount: c._count.requests,
      responseCount: completed,
      responseRate: c._count.requests > 0
        ? Math.round((completed / c._count.requests) * 100)
        : 0,
      createdAt: c.createdAt,
    }
  })

  return NextResponse.json(formatted)
})

// POST create campaign and send emails
export const POST = withRole("ADMIN", async (session, request: NextRequest) => {
  const body = await request.json()
  const { name, message, recipientIds } = body as {
    name: string
    message?: string
    recipientIds: string[]
  }

  if (!name || !recipientIds?.length) {
    return NextResponse.json(
      { error: "Name and at least one recipient required" },
      { status: 400 }
    )
  }

  // Fetch recipients (students and their linked parents)
  const users = await db.user.findMany({
    where: { id: { in: recipientIds }, isActive: true },
    select: { id: true, name: true, email: true, role: true },
  })

  // Also fetch parents linked to selected students
  const studentIds = users.filter((u) => u.role === "STUDENT").map((u) => u.id)
  const parentLinks = await db.parentStudent.findMany({
    where: { studentId: { in: studentIds } },
    include: {
      parent: { select: { id: true, name: true, email: true, role: true } },
    },
  })

  const allRecipients = [
    ...users,
    ...parentLinks.map((pl) => pl.parent),
  ]

  // Deduplicate by id
  const uniqueRecipients = Array.from(
    new Map(allRecipients.map((r) => [r.id, r])).values()
  )

  // Create campaign
  const campaign = await db.reviewCampaign.create({
    data: {
      name,
      message,
      sentBy: session.user.id,
      recipientCount: uniqueRecipients.length,
    },
  })

  // Create review requests with tokens
  const requests = await Promise.all(
    uniqueRecipients.map((recipient) =>
      db.reviewRequest.create({
        data: {
          campaignId: campaign.id,
          recipientId: recipient.id,
          recipientEmail: recipient.email,
          recipientName: recipient.name || "User",
          recipientRole: recipient.role,
          token: crypto.randomBytes(32).toString("hex"),
          status: "SENT",
          sentAt: new Date(),
        },
      })
    )
  )

  // Send emails via Resend
  const resend = getResend()
  const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || "http://localhost:3000"

  const emailResults = await Promise.allSettled(
    requests.map((req) =>
      resend.emails.send({
        from: "ScholarSuite <noreply@scholarsuite.org>",
        to: req.recipientEmail,
        subject: `${name} — We'd love your feedback!`,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="display: inline-block; width: 48px; height: 48px; background: #1E3A5F; border-radius: 12px; line-height: 48px; color: white; font-weight: 600; font-size: 20px;">S</div>
              <h1 style="color: #1E3A5F; font-size: 24px; margin: 16px 0 8px;">ScholarSuite</h1>
            </div>
            <p style="color: #1A1A1A; font-size: 16px; line-height: 1.6;">Hi ${req.recipientName},</p>
            <p style="color: #1A1A1A; font-size: 16px; line-height: 1.6;">
              ${message || "Congratulations on your journey! We'd love to hear about your experience with ScholarSuite. Your feedback helps us improve for future students and families."}
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${baseUrl}/review/${req.token}" style="display: inline-block; padding: 14px 32px; background: #2563EB; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Share Your Feedback
              </a>
            </div>
            <p style="color: #666; font-size: 14px; line-height: 1.5;">
              This survey takes about 3 minutes. Your responses are confidential and help us serve future families better.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;" />
            <p style="color: #999; font-size: 12px; text-align: center;">ScholarSuite — Scholarship & College Preparation Platform</p>
          </div>
        `,
      })
    )
  )

  const sentCount = emailResults.filter((r) => r.status === "fulfilled").length

  return NextResponse.json(
    { campaign, sentCount, totalRecipients: uniqueRecipients.length },
    { status: 201 }
  )
})
