import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""
    const county = searchParams.get("county") || ""
    const state = searchParams.get("state") || ""
    const status = searchParams.get("status") || ""

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { contactName: { contains: search, mode: "insensitive" } },
        { contactEmail: { contains: search, mode: "insensitive" } },
      ]
    }
    if (county) where.county = { contains: county, mode: "insensitive" }
    if (state) where.state = { contains: state, mode: "insensitive" }
    if (status) where.status = status

    const providers = await db.provider.findMany({
      where,
      include: {
        _count: { select: { scholarships: true } },
      },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json(providers)
  } catch (error) {
    console.error("Error fetching providers:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    if (!data.name) {
      return NextResponse.json({ error: "Provider name is required" }, { status: 400 })
    }

    const provider = await db.provider.create({
      data: {
        name: data.name,
        type: data.type || "OTHER",
        county: data.county || null,
        state: data.state || null,
        contactName: data.contactName || null,
        contactEmail: data.contactEmail || null,
        contactPhone: data.contactPhone || null,
        website: data.website || null,
        notes: data.notes || null,
        status: data.status || "PROSPECT",
      },
    })

    return NextResponse.json(provider, { status: 201 })
  } catch (error) {
    console.error("Error creating provider:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
