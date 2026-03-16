import { NextResponse } from "next/server"
import { withRole } from "@/lib/api-middleware"
import { db } from "@/lib/db"

// GET — export all responses as CSV
export const GET = withRole("ADMIN", async () => {
  const responses = await db.reviewResponse.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      request: {
        select: {
          recipientName: true,
          recipientEmail: true,
          recipientRole: true,
          campaign: { select: { name: true } },
        },
      },
    },
  })

  const headers = [
    "Campaign",
    "Name",
    "Email",
    "Role",
    "Overall Rating",
    "NPS Score",
    "Would Recommend",
    "Most Helpful",
    "Improvements",
    "Testimonial",
    "Mentoring",
    "Scholarship Help",
    "Essay Support",
    "College Prep",
    "Communication",
    "Flagged",
    "Submitted At",
  ]

  const escape = (val: string | null | undefined) => {
    if (!val) return ""
    const s = String(val)
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }

  const rows = responses.map((r) =>
    [
      escape(r.request.campaign.name),
      escape(r.request.recipientName),
      escape(r.request.recipientEmail),
      escape(r.request.recipientRole),
      r.overallRating,
      r.npsScore ?? "",
      r.wouldRecommend != null ? (r.wouldRecommend ? "Yes" : "No") : "",
      escape(r.mostHelpful),
      escape(r.improvements),
      escape(r.testimonial),
      r.mentoring ?? "",
      r.scholarshipHelp ?? "",
      r.essaySupport ?? "",
      r.collegePrep ?? "",
      r.communication ?? "",
      r.isFlagged ? "Yes" : "No",
      new Date(r.createdAt).toISOString(),
    ].join(",")
  )

  const csv = [headers.join(","), ...rows].join("\n")

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="review-responses-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
})
