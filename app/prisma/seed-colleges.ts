/**
 * Seed colleges from the US Department of Education College Scorecard API.
 * API docs: https://collegescorecard.ed.gov/data/documentation/
 *
 * Usage:
 *   npx tsx prisma/seed-colleges.ts
 *   npx tsx prisma/seed-colleges.ts --state=CA
 *   npx tsx prisma/seed-colleges.ts --limit=100
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const API_KEY = process.env.SCORECARD_API_KEY || "YOUR_API_KEY";
const BASE_URL = "https://api.data.gov/ed/collegescorecard/v1/schools";

// Scorecard locale codes → our enum
const LOCALE_MAP: Record<number, string> = {
  11: "CITY_LARGE", 12: "CITY_MIDSIZE", 13: "CITY_SMALL",
  21: "SUBURB_LARGE", 22: "SUBURB_MIDSIZE", 23: "SUBURB_SMALL",
  31: "TOWN_FRINGE", 32: "TOWN_DISTANT", 33: "TOWN_REMOTE",
  41: "RURAL_FRINGE", 42: "RURAL_DISTANT", 43: "RURAL_REMOTE",
};

const TYPE_MAP: Record<number, string> = {
  1: "PUBLIC", 2: "PRIVATE_NONPROFIT", 3: "PRIVATE_FORPROFIT",
};

const FIELDS = [
  "id",
  "school.name",
  "school.alias",
  "school.city",
  "school.state",
  "school.zip",
  "school.school_url",
  "school.locale",
  "school.ownership",
  "school.religious_affiliation",
  "school.minority_serving.historically_black",
  "school.men_only",
  "school.women_only",
  "location.lat",
  "location.lon",
  "latest.admissions.admission_rate.overall",
  "latest.admissions.sat_scores.average.overall",
  "latest.admissions.sat_scores.25th_percentile.critical_reading",
  "latest.admissions.sat_scores.75th_percentile.critical_reading",
  "latest.admissions.sat_scores.25th_percentile.math",
  "latest.admissions.sat_scores.75th_percentile.math",
  "latest.admissions.act_scores.midpoint.cumulative",
  "latest.admissions.act_scores.25th_percentile.cumulative",
  "latest.admissions.act_scores.75th_percentile.cumulative",
  "latest.admissions.test_requirements",
  "latest.cost.tuition.in_state",
  "latest.cost.tuition.out_of_state",
  "latest.cost.tuition.program_year",
  "latest.cost.roomboard.oncampus",
  "latest.cost.booksupply",
  "latest.cost.avg_net_price.public",
  "latest.cost.avg_net_price.private",
  "school.degrees_awarded.highest",
  "latest.student.size",
  "latest.student.enrollment.undergrad_12_month",
  "latest.student.demographics.student_faculty_ratio",
  "latest.completion.rate_suppressed.overall",
  "latest.completion.rate_suppressed.four_year",
  "latest.student.retention_rate.overall.full_time",
  "latest.earnings.6_yrs_after_entry.median",
  "latest.earnings.10_yrs_after_entry.median",
  "latest.aid.median_debt.completers.overall",
  "latest.aid.pell_grant_rate",
  "latest.aid.federal_loan_rate",
].join(",");

interface ScorecardSchool {
  id: number;
  [key: string]: unknown;
}

function get(obj: unknown, path: string): unknown {
  if (obj == null || typeof obj !== "object") return null;
  const record = obj as Record<string, unknown>;
  // Scorecard API returns flat dot-notation keys like "school.name"
  if (path in record) return record[path] ?? null;
  // Fallback: try nested traversal
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return null;
    current = (current as Record<string, unknown>)[part];
  }
  return current ?? null;
}

function parseNetPrice(school: ScorecardSchool): object | null {
  const pubAvg = get(school, "latest.cost.avg_net_price.public") as number | null;
  const privAvg = get(school, "latest.cost.avg_net_price.private") as number | null;
  const avg = pubAvg || privAvg;
  if (!avg) return null;
  return { average: avg };
}

function mapSchool(s: ScorecardSchool) {
  const ownership = get(s, "school.ownership") as number | null;
  const locale = get(s, "school.locale") as number | null;
  const testReq = get(s, "latest.admissions.test_requirements") as number | null;

  // Compute composite SAT 25th/75th from reading + math
  const satRead25 = get(s, "latest.admissions.sat_scores.25th_percentile.critical_reading") as number | null;
  const satMath25 = get(s, "latest.admissions.sat_scores.25th_percentile.math") as number | null;
  const satRead75 = get(s, "latest.admissions.sat_scores.75th_percentile.critical_reading") as number | null;
  const satMath75 = get(s, "latest.admissions.sat_scores.75th_percentile.math") as number | null;

  const sat25 = satRead25 && satMath25 ? satRead25 + satMath25 : null;
  const sat75 = satRead75 && satMath75 ? satRead75 + satMath75 : null;

  let website = get(s, "school.school_url") as string | null;
  if (website && !website.startsWith("http")) {
    website = `https://${website}`;
  }

  return {
    scorecardId: s.id,
    name: get(s, "school.name") as string,
    alias: get(s, "school.alias") as string | null,
    city: get(s, "school.city") as string | null,
    state: get(s, "school.state") as string | null,
    zip: get(s, "school.zip") as string | null,
    website,
    type: ownership ? (TYPE_MAP[ownership] as "PUBLIC" | "PRIVATE_NONPROFIT" | "PRIVATE_FORPROFIT" | undefined) || null : null,
    locale: locale ? (LOCALE_MAP[locale] as string | undefined) || null : null,
    latitude: get(s, "location.lat") as number | null,
    longitude: get(s, "location.lon") as number | null,

    acceptanceRate: get(s, "latest.admissions.admission_rate.overall") as number | null,
    satAvg: get(s, "latest.admissions.sat_scores.average.overall") as number | null,
    sat25,
    sat75,
    actAvg: get(s, "latest.admissions.act_scores.midpoint.cumulative") as number | null,
    act25: get(s, "latest.admissions.act_scores.25th_percentile.cumulative") as number | null,
    act75: get(s, "latest.admissions.act_scores.75th_percentile.cumulative") as number | null,
    testOptional: testReq === 5 || testReq === 3, // 5=not considered, 3=recommended

    inStateTuition: get(s, "latest.cost.tuition.in_state") as number | null,
    outOfStateTuition: get(s, "latest.cost.tuition.out_of_state") as number | null,
    roomAndBoard: get(s, "latest.cost.roomboard.oncampus") as number | null,
    booksSupplies: get(s, "latest.cost.booksupply") as number | null,
    netPriceByIncome: parseNetPrice(s),
    gradInStateTuition: get(s, "latest.cost.tuition.program_year") as number | null,
    gradOutOfStateTuition: null as number | null, // Scorecard doesn't split grad by residency
    highestDegree: get(s, "school.degrees_awarded.highest") as number | null,

    enrollment: get(s, "latest.student.size") as number | null,
    undergradPop: get(s, "latest.student.enrollment.undergrad_12_month") as number | null,
    studentFacultyRatio: get(s, "latest.student.demographics.student_faculty_ratio") as number | null,

    gradRate4yr: get(s, "latest.completion.rate_suppressed.four_year") as number | null,
    gradRate6yr: get(s, "latest.completion.rate_suppressed.overall") as number | null,
    retentionRate: get(s, "latest.student.retention_rate.overall.full_time") as number | null,

    medianEarnings6yr: get(s, "latest.earnings.6_yrs_after_entry.median") as number | null,
    medianEarnings10yr: get(s, "latest.earnings.10_yrs_after_entry.median") as number | null,
    medianDebt: get(s, "latest.aid.median_debt.completers.overall") as number | null,

    pellPct: get(s, "latest.aid.pell_grant_rate") as number | null,
    fedLoanPct: get(s, "latest.aid.federal_loan_rate") as number | null,

    religiousAffiliation: (() => {
      const val = get(s, "school.religious_affiliation");
      if (val == null || val === -1 || val === -2) return null;
      return String(val);
    })(),
    hbcu: !!(get(s, "school.minority_serving.historically_black")),
    menOnly: !!(get(s, "school.men_only")),
    womenOnly: !!(get(s, "school.women_only")),

    lastSyncedAt: new Date(),
  };
}

async function fetchPage(page: number, perPage: number, stateFilter?: string): Promise<{ results: ScorecardSchool[]; total: number }> {
  const params = new URLSearchParams({
    api_key: API_KEY,
    fields: FIELDS,
    per_page: String(perPage),
    page: String(page),
    // Only degree-granting institutions (predominantly bachelor's or higher)
    "school.degrees_awarded.predominant": "3",
    // Operating
    "school.operating": "1",
  });

  if (stateFilter) {
    params.set("school.state", stateFilter);
  }

  const url = `${BASE_URL}?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Scorecard API error: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return {
    results: data.results || [],
    total: data.metadata?.total || 0,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const stateFlag = args.find(a => a.startsWith("--state="))?.split("=")[1];
  const limitFlag = args.find(a => a.startsWith("--limit="))?.split("=")[1];
  const maxRecords = limitFlag ? parseInt(limitFlag) : Infinity;

  console.log(`🎓 College Scorecard Seed Script`);
  console.log(`   State filter: ${stateFlag || "ALL"}`);
  console.log(`   Limit: ${maxRecords === Infinity ? "none" : maxRecords}`);

  if (API_KEY === "YOUR_API_KEY") {
    console.log("\n⚠️  No SCORECARD_API_KEY set. Get a free key at https://api.data.gov/signup/");
    console.log("   Set it: export SCORECARD_API_KEY=your_key_here");
    console.log("   Or add SCORECARD_API_KEY to your .env file\n");
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new PrismaPg(pool as any);
  const db = new PrismaClient({ adapter });

  const PER_PAGE = 100;
  let page = 0;
  let total = 0;
  let fetched = 0;
  let upserted = 0;

  // First page to get total
  const first = await fetchPage(page, PER_PAGE, stateFlag);
  total = first.total;
  console.log(`\n📊 Found ${total} degree-granting institutions`);

  const toProcess = Math.min(total, maxRecords);

  // Process first page
  for (const school of first.results) {
    if (fetched >= maxRecords) break;
    const mapped = mapSchool(school);
    try {
      await db.college.upsert({
        where: { scorecardId: mapped.scorecardId },
        create: mapped as Parameters<typeof db.college.create>[0]["data"],
        update: (() => { const { scorecardId: _id, ...rest } = mapped; return rest; })() as Parameters<typeof db.college.update>[0]["data"],
      });
      upserted++;
    } catch (e) {
      const msg = (e as Error).message;
      console.error(`  ⚠ Failed to upsert ${mapped.name}: ${msg.slice(0, 500)}`);
    }
    fetched++;
  }

  console.log(`  Page ${page + 1}: ${first.results.length} schools (${fetched}/${toProcess})`);

  // Remaining pages
  while (fetched < toProcess) {
    page++;
    const { results } = await fetchPage(page, PER_PAGE, stateFlag);
    if (results.length === 0) break;

    for (const school of results) {
      if (fetched >= maxRecords) break;
      const mapped = mapSchool(school);
      try {
        await db.college.upsert({
          where: { scorecardId: mapped.scorecardId },
          create: mapped as Parameters<typeof db.college.create>[0]["data"],
          update: (() => { const { scorecardId: _id, ...rest } = mapped; return rest; })() as Parameters<typeof db.college.update>[0]["data"],
        });
        upserted++;
      } catch (e) {
        const msg = (e as Error).message;
      console.error(`  ⚠ Failed to upsert ${mapped.name}: ${msg.slice(0, 500)}`);
      }
      fetched++;
    }

    console.log(`  Page ${page + 1}: ${results.length} schools (${fetched}/${toProcess})`);
  }

  console.log(`\n✅ Done! Upserted ${upserted} colleges.`);
  await db.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
