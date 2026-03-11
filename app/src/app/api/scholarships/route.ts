import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const state = searchParams.get("state") || "";
    const minAmount = searchParams.get("minAmount");
    const maxAmount = searchParams.get("maxAmount");

    const where: Record<string, unknown> = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { provider: { contains: search, mode: "insensitive" } },
      ];
    }

    if (state) {
      where.states = { has: state };
    }

    if (minAmount) {
      where.amount = { ...((where.amount as object) || {}), gte: parseFloat(minAmount) };
    }

    if (maxAmount) {
      where.amount = { ...((where.amount as object) || {}), lte: parseFloat(maxAmount) };
    }

    const scholarships = await db.scholarship.findMany({
      where,
      include: {
        tags: true,
      },
      orderBy: { deadline: "asc" },
    });

    return NextResponse.json(scholarships);
  } catch (error) {
    console.error("Error fetching scholarships:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    const scholarship = await db.scholarship.create({
      data: {
        name: data.name,
        provider: data.provider,
        amount: data.amount,
        amountMax: data.amountMax,
        deadline: data.deadline ? new Date(data.deadline) : null,
        description: data.description,
        url: data.url,
        minGpa: data.minGpa,
        states: data.states || [],
        citizenships: data.citizenships || [],
        gradeLevels: data.gradeLevels || [],
        fieldsOfStudy: data.fieldsOfStudy || [],
        ethnicities: data.ethnicities || [],
        requiresFirstGen: data.requiresFirstGen || false,
        requiresPell: data.requiresPell || false,
        requiresFinancialNeed: data.requiresFinancialNeed || false,
      },
    });

    return NextResponse.json(scholarship, { status: 201 });
  } catch (error) {
    console.error("Error creating scholarship:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
