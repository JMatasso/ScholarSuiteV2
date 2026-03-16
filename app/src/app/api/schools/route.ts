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

export const GET = withRole("ADMIN", async () => {
  const schools = await db.school.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { students: true } },
    },
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
