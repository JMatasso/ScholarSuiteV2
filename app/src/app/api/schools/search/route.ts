import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const q = request.nextUrl.searchParams.get("q")?.trim();
    if (!q || q.length < 2) {
      return NextResponse.json([]);
    }

    const state = request.nextUrl.searchParams.get("state")?.trim();
    const limit = Math.min(
      Number(request.nextUrl.searchParams.get("limit")) || 15,
      50
    );

    const schools = await db.school.findMany({
      where: {
        name: { contains: q, mode: "insensitive" },
        ...(state ? { state: { equals: state, mode: "insensitive" } } : {}),
      },
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        ncesId: true,
      },
      orderBy: { name: "asc" },
      take: limit,
    });

    return NextResponse.json(schools);
  } catch (error) {
    console.error("School search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
