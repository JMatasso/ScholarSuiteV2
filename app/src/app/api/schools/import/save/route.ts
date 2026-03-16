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

async function uniqueJoinCode(): Promise<string> {
  let code = generateJoinCode()
  let exists = await db.school.findUnique({ where: { joinCode: code } })
  while (exists) {
    code = generateJoinCode()
    exists = await db.school.findUnique({ where: { joinCode: code } })
  }
  return code
}

export const POST = withRole("ADMIN", async (_session, request: NextRequest) => {
  const body = await request.json()
  const { schools } = body

  if (!Array.isArray(schools) || schools.length === 0) {
    return NextResponse.json({ error: "Schools array is required" }, { status: 400 })
  }

  let imported = 0
  let skipped = 0

  for (const school of schools) {
    const { ncesId, name, address, city, state, zipCode } = school

    if (!ncesId || !name) {
      skipped++
      continue
    }

    // Check if school with this ncesId already exists
    const existing = await db.school.findUnique({ where: { ncesId } })
    if (existing) {
      skipped++
      continue
    }

    const joinCode = await uniqueJoinCode()

    await db.school.create({
      data: {
        ncesId,
        name,
        address: address || null,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        joinCode,
      },
    })

    imported++
  }

  return NextResponse.json({ imported, skipped })
})
