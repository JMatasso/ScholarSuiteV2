import { NextRequest, NextResponse } from "next/server"
import { withRole } from "@/lib/api-middleware"
import { db } from "@/lib/db"

function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export const GET = withRole("ADMIN", async (_session, request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search")?.trim()
  const all = searchParams.get("all") === "true"

  // If searching, search the full DB (limited to 50 results)
  if (search) {
    const schools = await db.school.findMany({
      where: {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { city: { contains: search, mode: "insensitive" } },
          { state: { contains: search, mode: "insensitive" } },
        ],
      },
      orderBy: { name: "asc" },
      take: 50,
      include: { _count: { select: { students: true } } },
    })
    return NextResponse.json(schools)
  }

  // If ?all=true, return everything (paginated) — not recommended for large datasets
  if (all) {
    const schools = await db.school.findMany({
      orderBy: { name: "asc" },
      take: 200,
      include: { _count: { select: { students: true } } },
    })
    return NextResponse.json(schools)
  }

  // Default: only schools that have at least one student enrolled
  const schools = await db.school.findMany({
    where: {
      students: { some: {} },
    },
    orderBy: { name: "asc" },
    include: { _count: { select: { students: true } } },
  })

  return NextResponse.json(schools)
})

export const POST = withRole("ADMIN", async (_session, request: NextRequest) => {
  const body = await request.json()
  const { name, address, city, state, zipCode, phone, email, website } = body

  if (!name) {
    return NextResponse.json({ error: "School name is required" }, { status: 400 })
  }

  // Generate a unique join code
  let joinCode = generateJoinCode()
  let exists = await db.school.findUnique({ where: { joinCode } })
  while (exists) {
    joinCode = generateJoinCode()
    exists = await db.school.findUnique({ where: { joinCode } })
  }

  const school = await db.school.create({
    data: {
      name,
      address: address || null,
      city: city || null,
      state: state || null,
      zipCode: zipCode || null,
      phone: phone || null,
      email: email || null,
      website: website || null,
      joinCode,
    },
  })

  return NextResponse.json(school, { status: 201 })
})
