import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET — validate token and return request info (public, no auth)
export async function GET(request: NextRequest) {
  const token = request.nextUrl.pathname.split("/").pop()!

  const reviewRequest = await db.reviewRequest.findUnique({
    where: { token },
    include: { response: true, campaign: true },
  })

  if (!reviewRequest) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 })
  }

  if (reviewRequest.response) {
    return NextResponse.json({ error: "already_submitted", name: reviewRequest.recipientName }, { status: 400 })
  }

  // Mark as opened if first time
  if (reviewRequest.status === "SENT") {
    await db.reviewRequest.update({
      where: { id: reviewRequest.id },
      data: { status: "OPENED", openedAt: new Date() },
    })
  }

  return NextResponse.json({
    name: reviewRequest.recipientName,
    role: reviewRequest.recipientRole,
    campaignName: reviewRequest.campaign.name,
    campaignMessage: reviewRequest.campaign.message,
  })
}

// POST — submit the review (public, no auth)
export async function POST(request: NextRequest) {
  const token = request.nextUrl.pathname.split("/").pop()!

  const reviewRequest = await db.reviewRequest.findUnique({
    where: { token },
    include: { response: true },
  })

  if (!reviewRequest) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 })
  }

  if (reviewRequest.response) {
    return NextResponse.json({ error: "Already submitted" }, { status: 400 })
  }

  const body = await request.json()
  const {
    overallRating,
    npsScore,
    wouldRecommend,
    mostHelpful,
    improvements,
    testimonial,
    mentoring,
    scholarshipHelp,
    essaySupport,
    collegePrep,
    communication,
  } = body

  if (!overallRating || overallRating < 1 || overallRating > 5) {
    return NextResponse.json(
      { error: "Overall rating (1-5) is required" },
      { status: 400 }
    )
  }

  // Create response and update request status in a transaction
  const [response] = await db.$transaction([
    db.reviewResponse.create({
      data: {
        requestId: reviewRequest.id,
        overallRating,
        npsScore: npsScore ?? null,
        wouldRecommend: wouldRecommend ?? null,
        mostHelpful: mostHelpful || null,
        improvements: improvements || null,
        testimonial: testimonial || null,
        mentoring: mentoring ?? null,
        scholarshipHelp: scholarshipHelp ?? null,
        essaySupport: essaySupport ?? null,
        collegePrep: collegePrep ?? null,
        communication: communication ?? null,
      },
    }),
    db.reviewRequest.update({
      where: { id: reviewRequest.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    }),
    db.reviewCampaign.update({
      where: { id: reviewRequest.campaignId },
      data: { responseCount: { increment: 1 } },
    }),
  ])

  return NextResponse.json(response, { status: 201 })
}
