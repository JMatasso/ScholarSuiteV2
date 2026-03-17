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
      .map((row) => {
        const url = row.url || row.URL || row.sourceUrl || row.source_url || null;
        const amount = row.amount || row.Amount;
        const amountMax = row.amountMax || row.amount_max || row.AmountMax;
        const deadline = row.deadline || row.Deadline;
        const minGpa = row.minGpa || row.min_gpa || row.MinGPA;

        return {
          name: row.name || row.Name,
          provider: row.provider || row.Provider || null,
          amount: amount ? parseFloat(amount) : null,
          amountMax: amountMax ? parseFloat(amountMax) : null,
          deadline: deadline ? new Date(deadline) : null,
          description: row.description || row.Description || null,
          url,
          sourceUrl: url,
          minGpa: minGpa ? parseFloat(minGpa) : null,
          states: row.states ? row.states.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
          citizenships: row.citizenships ? row.citizenships.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
          fieldsOfStudy: row.fieldsOfStudy || row.fields_of_study ? (row.fieldsOfStudy || row.fields_of_study).split(",").map((s: string) => s.trim()).filter(Boolean) : [],
          ethnicities: row.ethnicities ? row.ethnicities.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
          gradeLevels: row.gradeLevels || row.grade_levels ? (row.gradeLevels || row.grade_levels).split(",").map((s: string) => parseInt(s.trim())).filter((n: number) => !isNaN(n)) : [],
          requiresFirstGen: row.requiresFirstGen === "true" || row.requires_first_gen === "true",
          requiresPell: row.requiresPell === "true" || row.requires_pell === "true",
          requiresFinancialNeed: row.requiresFinancialNeed === "true" || row.requires_financial_need === "true",
          isActive: true,
        };
      });

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
