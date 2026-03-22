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

    let created = 0;
    const errors: string[] = [];

    for (const row of rows) {
      const email = row.email || row.Email;
      if (!email) continue;

      try {
        const existing = await db.user.findUnique({ where: { email } });
        if (existing) {
          errors.push(`Skipped ${email}: already exists`);
          continue;
        }

        const user = await db.user.create({
          data: {
            email,
            name: row.name || row.Name || email,
            role: "STUDENT",
          },
        });

        await db.studentProfile.create({
          data: {
            userId: user.id,
            firstName: row.firstName || row.first_name || null,
            lastName: row.lastName || row.last_name || null,
            phone: row.phone || null,
            gpa: row.gpa ? parseFloat(row.gpa) : null,
            highSchool: row.school || row.highSchool || row.high_school || null,
          },
        });

        // Tasks are pushed on demand from /admin/templates

        created++;
      } catch (err) {
        errors.push(`Failed to import ${email}: ${err}`);
      }
    }

    return NextResponse.json({ created, errors }, { status: 201 });
  } catch (error) {
    console.error("Error importing students:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
