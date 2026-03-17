import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const role = (session.user as { role: string }).role

    let where: Record<string, unknown> = { userId: session.user.id }
    if (role === "ADMIN") {
      where = {}
    }

    const recommenders = await db.recommender.findMany({
      where,
      include: {
        collegeApps: {
          include: { collegeApp: { select: { id: true, universityName: true } } },
        },
        scholarshipApps: {
          include: { scholarshipApp: { include: { scholarship: { select: { id: true, name: true } } } } },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(recommenders)
  } catch (error) {
    console.error("Error fetching recommenders:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    if (!data.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const recommender = await db.recommender.create({
      data: {
        userId: session.user.id,
        name: data.name,
        title: data.title || null,
        email: data.email || null,
        phone: data.phone || null,
        relationship: data.relationship || null,
        category: data.category || "TEACHER",
        status: data.status || "NOT_ASKED",
        requestedAt: data.requestedAt ? new Date(data.requestedAt) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        notes: data.notes || null,
      },
    })

    // Link to college apps if provided
    if (data.collegeAppIds?.length > 0) {
      await db.recommenderCollegeApp.createMany({
        data: data.collegeAppIds.map((id: string) => ({
          recommenderId: recommender.id,
          collegeAppId: id,
        })),
        skipDuplicates: true,
      })
    }

    // Link to scholarship apps if provided
    if (data.scholarshipAppIds?.length > 0) {
      await db.recommenderScholarshipApp.createMany({
        data: data.scholarshipAppIds.map((id: string) => ({
          recommenderId: recommender.id,
          scholarshipAppId: id,
        })),
        skipDuplicates: true,
      })
    }

    return NextResponse.json(recommender, { status: 201 })
  } catch (error) {
    console.error("Error creating recommender:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
