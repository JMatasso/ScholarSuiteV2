import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows: Record<string, string>[] = await req.json();

    const data = rows
      .filter((row) => row.name || row.Name)
      .map((row) => ({
        name: row.name || row.Name,
        provider: row.provider || row.Provider || null,
        amount: row.amount ? parseFloat(row.amount) : null,
        deadline: row.deadline ? new Date(row.deadline) : null,
        description: row.description || null,
        url: row.url || null,
        isActive: true,
      }));

    const result = await db.scholarship.createMany({
      data,
      skipDuplicates: true,
    });

    return NextResponse.json({ created: result.count }, { status: 201 });
  } catch (error) {
    console.error("Error importing scholarships:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
