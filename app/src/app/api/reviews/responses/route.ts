import { NextResponse } from "next/server"
import { withRole } from "@/lib/api-middleware"
import { db } from "@/lib/db"

// GET all responses across all campaigns (admin)
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

  return NextResponse.json(responses)
})
