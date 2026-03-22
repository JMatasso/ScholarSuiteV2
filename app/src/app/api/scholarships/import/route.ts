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

    if (!Array.isArray(rows)) {
      return NextResponse.json({ error: "Expected array of rows" }, { status: 400 });
    }

    // Limit batch size to prevent DoS
    if (rows.length > 5000) {
      return NextResponse.json(
        { error: "Too many rows. Maximum 5,000 per import." },
        { status: 400 }
      );
    }

    const data = rows
      .filter((row) => row.name || row.Name)
      .map((row) => {
        const url = row.url || row.URL || row.sourceUrl || row.source_url || null;
        const amount = row.amount || row.Amount;
        const amountMax = row.amountMax || row.amount_max || row.AmountMax;
        const deadline = row.deadline || row.Deadline;
        const minGpa = row.minGpa || row.min_gpa || row.MinGPA;

        const parsedAmount = amount ? parseFloat(amount) : null;
        const parsedAmountMax = amountMax ? parseFloat(amountMax) : null;
        const parsedMinGpa = minGpa ? parseFloat(minGpa) : null;
        const parsedDeadline = deadline ? new Date(deadline) : null;
        const scholarshipName = (row.name || row.Name || "").trim().slice(0, 500);

        return {
          name: scholarshipName,
          provider: (row.provider || row.Provider || "").trim().slice(0, 500) || null,
          amount: parsedAmount && parsedAmount > 0 && isFinite(parsedAmount) ? parsedAmount : null,
          amountMax: parsedAmountMax && parsedAmountMax > 0 && isFinite(parsedAmountMax) ? parsedAmountMax : null,
          deadline: parsedDeadline && !isNaN(parsedDeadline.getTime()) ? parsedDeadline : null,
          description: row.description || row.Description || null,
          url,
          sourceUrl: url,
          minGpa: parsedMinGpa && parsedMinGpa > 0 && parsedMinGpa <= 5.0 && isFinite(parsedMinGpa) ? parsedMinGpa : null,
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
