import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// Public endpoint — no auth required
export async function POST(req: NextRequest) {
  try {
    const data = await req.json()

    // Honeypot check
    if (data._hp) {
      return NextResponse.json({ success: true }, { status: 201 })
    }

    // Validate required fields
    if (!data.orgName || !data.scholarshipName || !data.contactEmail) {
      return NextResponse.json(
        { error: "Organization name, scholarship name, and contact email are required" },
        { status: 400 }
      )
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
    }

    // Check for existing provider by name + county
    let provider = await db.provider.findFirst({
      where: {
        name: { equals: data.orgName, mode: "insensitive" },
        county: data.county || null,
      },
    })

    if (!provider) {
      provider = await db.provider.create({
        data: {
          name: data.orgName,
          type: data.orgType || "OTHER",
          county: data.county || null,
          state: data.state || null,
          contactName: data.contactName || null,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone || null,
          website: data.website || null,
          status: "PROSPECT",
        },
      })
    }

    // Create scholarship (inactive until admin reviews)
    const scholarship = await db.scholarship.create({
      data: {
        name: data.scholarshipName,
        provider: data.orgName,
        amount: data.amount ? parseFloat(data.amount) : null,
        amountMax: data.amountMax ? parseFloat(data.amountMax) : null,
        deadline: data.deadline ? new Date(data.deadline) : null,
        description: data.description || null,
        url: data.applicationUrl || null,
        isActive: false,
        isRecurring: data.isRecurring || false,
        source: "LOCAL",
        county: data.county || null,
        states: data.state ? [data.state] : [],
        providerId: provider.id,
        cycleStatus: "UNKNOWN",
        autoMatch: true,
      },
    })

    // Notify admins
    const admins = await db.user.findMany({
      where: { role: "ADMIN", isActive: true },
      select: { id: true },
    })

    if (admins.length > 0) {
      await db.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          title: "New Provider Submission",
          message: `${data.orgName} submitted "${data.scholarshipName}" for review.`,
          type: "PROVIDER_SUBMISSION",
          link: "/admin/scholarships/local",
        })),
      })
    }

    return NextResponse.json(
      { success: true, scholarshipId: scholarship.id, providerId: provider.id },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error processing submission:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
