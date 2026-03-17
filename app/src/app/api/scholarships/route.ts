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

    // Enrichment stats endpoint
    if (searchParams.get("stats") === "enrichment") {
      const total = await db.scholarship.count();
      const enriched = await db.scholarship.count({
        where: {
          OR: [
            { description: { not: null } },
            { minGpa: { not: null } },
            { NOT: { states: { isEmpty: true } } },
            { NOT: { fieldsOfStudy: { isEmpty: true } } },
            { NOT: { ethnicities: { isEmpty: true } } },
            { NOT: { citizenships: { isEmpty: true } } },
          ],
        },
      });
      const scraped = await db.scholarship.count({
        where: { scrapeStatus: "CURRENT" },
      });
      const needsReview = await db.scholarship.count({
        where: { scrapeStatus: "NEEDS_REVIEW" },
      });
      const expired = await db.scholarship.count({
        where: { scrapeStatus: "EXPIRED" },
      });
      const error = await db.scholarship.count({
        where: { scrapeStatus: "ERROR" },
      });
      const noDescription = await db.scholarship.count({
        where: { OR: [{ description: null }, { description: "" }] },
      });
      const noDeadline = await db.scholarship.count({
        where: { deadline: null },
      });
      const noAmount = await db.scholarship.count({
        where: { amount: null },
      });

      return NextResponse.json({
        total,
        enriched,
        unenriched: total - enriched,
        enrichmentRate: total > 0 ? Math.round((enriched / total) * 100) : 0,
        scrapeStatus: { current: scraped, needsReview, expired, error, unscraped: total - scraped - needsReview - expired - error },
        missingFields: { noDescription, noDeadline, noAmount },
      });
    }

    const search = searchParams.get("search") || "";
    const state = searchParams.get("state") || "";
    const minAmount = searchParams.get("minAmount");
    const maxAmount = searchParams.get("maxAmount");

    const role = (session.user as { role: string }).role
    const where: Record<string, unknown> = {
      isActive: true,
    };

    // Students only see scholarships with future deadlines (or rolling/no deadline if enriched)
    if (role !== "ADMIN") {
      const now = new Date()
      where.AND = [
        {
          OR: [
            { deadline: { gte: now } },
            { deadline: null, scrapeStatus: "CURRENT" },
          ],
        },
      ]
    }

    if (search) {
      const searchFilter = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { provider: { contains: search, mode: "insensitive" } },
        ],
      }
      if (where.AND) {
        ;(where.AND as unknown[]).push(searchFilter)
      } else {
        where.AND = [searchFilter]
      }
    }

    if (state) {
      where.states = { has: state };
    }

    // Source filter (SCRAPED, LOCAL, MANUAL)
    const source = searchParams.get("source")
    if (source) {
      where.source = source
    }

    // County filter
    const county = searchParams.get("county")
    if (county) {
      where.county = { contains: county, mode: "insensitive" }
    }

    if (minAmount) {
      where.amount = { ...((where.amount as object) || {}), gte: parseFloat(minAmount) };
    }

    if (maxAmount) {
      where.amount = { ...((where.amount as object) || {}), lte: parseFloat(maxAmount) };
    }

    // Pagination (admins can fetch larger batches)
    const maxLimit = role === "ADMIN" ? 10000 : 100
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), maxLimit)
    const skip = (page - 1) * limit

    const [scholarships, total] = await Promise.all([
      db.scholarship.findMany({
        where,
        include: { tags: true },
        orderBy: { deadline: "asc" },
        skip,
        take: limit,
      }),
      db.scholarship.count({ where }),
    ])

    return NextResponse.json({
      scholarships,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
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
        // Local scholarship fields
        source: data.source || "SCRAPED",
        county: data.county || null,
        providerId: data.providerId || null,
        cycleStatus: data.cycleStatus || null,
        cycleYear: data.cycleYear || null,
        autoMatch: data.autoMatch ?? false,
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
