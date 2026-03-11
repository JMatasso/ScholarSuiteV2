import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prospects = await db.prospect.findMany({
      include: { invoices: true, user: { select: { name: true, email: true } } },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(prospects);
  } catch (error) {
    console.error("Error fetching prospects:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    const prospect = await db.prospect.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        parentName: data.parentName,
        parentEmail: data.parentEmail,
        source: data.source,
        serviceTier: data.serviceTier,
        notes: data.notes,
      },
    });

    return NextResponse.json(prospect, { status: 201 });
  } catch (error) {
    console.error("Error creating prospect:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
