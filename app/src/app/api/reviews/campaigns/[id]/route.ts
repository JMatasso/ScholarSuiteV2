import { NextRequest, NextResponse } from "next/server"
import { withRole } from "@/lib/api-middleware"
import { db } from "@/lib/db"

// GET single campaign with all requests/responses
export const GET = withRole("ADMIN", async (_session, request: NextRequest) => {
  const id = request.nextUrl.pathname.split("/").pop()!

  const campaign = await db.reviewCampaign.findUnique({
    where: { id },
    include: {
      requests: {
        include: { response: true },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
  }

  // Compute aggregate stats
  const responses = campaign.requests
    .map((r) => r.response)
    .filter(Boolean)

  const avgRating = responses.length
    ? responses.reduce((sum, r) => sum + r!.overallRating, 0) / responses.length
    : 0

  const npsScores = responses.filter((r) => r!.npsScore != null)
  const promoters = npsScores.filter((r) => r!.npsScore! >= 9).length
  const detractors = npsScores.filter((r) => r!.npsScore! <= 6).length
  const nps = npsScores.length
    ? Math.round(((promoters - detractors) / npsScores.length) * 100)
    : null

  const wouldRecommend = responses.filter((r) => r!.wouldRecommend === true).length

  return NextResponse.json({
    ...campaign,
    stats: {
      avgRating: Math.round(avgRating * 10) / 10,
      nps,
      responseCount: responses.length,
      responseRate: campaign.requests.length
        ? Math.round((responses.length / campaign.requests.length) * 100)
        : 0,
      wouldRecommend,
      wouldRecommendRate: responses.length
        ? Math.round((wouldRecommend / responses.length) * 100)
        : 0,
    },
  })
})

// DELETE campaign
export const DELETE = withRole("ADMIN", async (_session, request: NextRequest) => {
  const id = request.nextUrl.pathname.split("/").pop()!

  await db.reviewCampaign.delete({ where: { id } })

  return NextResponse.json({ success: true })
})
