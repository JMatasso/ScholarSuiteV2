import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const q = searchParams.get("q") || ""
    const state = searchParams.get("state") || ""
    const type = searchParams.get("type") || ""
    const minAcceptance = searchParams.get("minAcceptance")
    const maxAcceptance = searchParams.get("maxAcceptance")
    const maxTuition = searchParams.get("maxTuition")
    const major = searchParams.get("major") || ""
    const hbcu = searchParams.get("hbcu")
    const testOptional = searchParams.get("testOptional")
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "20", 10) || 20, 1),
      100
    )
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10) || 0, 0)

    // Build where clause
    const where: Record<string, unknown> = {}
    const andConditions: Record<string, unknown>[] = []

    if (q) {
      andConditions.push({
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { alias: { contains: q, mode: "insensitive" } },
        ],
      })
    }

    if (state) {
      where.state = state
    }

    if (type) {
      where.type = type
    }

    if (minAcceptance) {
      where.acceptanceRate = {
        ...((where.acceptanceRate as object) || {}),
        gte: parseFloat(minAcceptance),
      }
    }

    if (maxAcceptance) {
      where.acceptanceRate = {
        ...((where.acceptanceRate as object) || {}),
        lte: parseFloat(maxAcceptance),
      }
    }

    if (maxTuition) {
      where.outOfStateTuition = { lte: parseFloat(maxTuition) }
    }

    if (major) {
      // topPrograms is a Json field — use string_contains for searching within it
      where.topPrograms = { string_contains: major }
    }

    if (hbcu === "true") {
      where.hbcu = true
    }

    if (testOptional === "true") {
      where.testOptional = true
    }

    if (andConditions.length > 0) {
      where.AND = andConditions
    }

    const [colleges, total] = await Promise.all([
      db.college.findMany({
        where,
        orderBy: { name: "asc" },
        skip: offset,
        take: limit,
        include: {
          _count: { select: { applications: true } },
        },
      }),
      db.college.count({ where }),
    ])

    return NextResponse.json({
      colleges,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Error fetching colleges:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
