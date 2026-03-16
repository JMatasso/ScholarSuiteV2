import "dotenv/config";
if (process.env.DATABASE_URL?.includes("railway")) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const API_BASE =
  "https://educationdata.urban.org/api/v1/schools/ccd/directory/2022/";

// US state FIPS codes (1–56, skipping gaps)
const FIPS_CODES = [
  1, 2, 4, 5, 6, 8, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19, 20, 21, 22, 23,
  24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42,
  44, 45, 46, 47, 48, 49, 50, 51, 53, 54, 55, 56,
];

interface NCESSchool {
  ncessch: string;
  school_name: string;
  street_location: string;
  city_location: string;
  state_location: string;
  zip_location: string;
  phone: string;
  school_status: number;
}

async function fetchState(fips: number): Promise<NCESSchool[]> {
  const schools: NCESSchool[] = [];
  let url: string | null =
    `${API_BASE}?school_level=3&school_status=1&fips=${fips}&limit=1000`;

  while (url) {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`Failed to fetch FIPS ${fips}: ${res.status}`);
      break;
    }
    const data = await res.json();
    schools.push(...data.results);
    url = data.next;
  }

  return schools;
}

async function main() {
  console.log("Seeding high schools from NCES data...");
  console.log("This will take a few minutes.\n");

  let totalInserted = 0;
  let totalSkipped = 0;

  // Process states in batches of 5 to avoid rate limiting
  for (let i = 0; i < FIPS_CODES.length; i += 5) {
    const batch = FIPS_CODES.slice(i, i + 5);
    const results = await Promise.all(batch.map(fetchState));

    for (const schools of results) {
      if (schools.length === 0) continue;

      const state = schools[0].state_location;

      // Bulk upsert using createMany with skipDuplicates
      const data = schools.map((s) => ({
        ncesId: s.ncessch,
        name: s.school_name,
        address: s.street_location || null,
        city: s.city_location || null,
        state: s.state_location || null,
        zipCode: s.zip_location || null,
        phone: s.phone || null,
      }));

      const result = await prisma.school.createMany({
        data,
        skipDuplicates: true,
      });

      totalInserted += result.count;
      totalSkipped += schools.length - result.count;
      console.log(
        `  ${state}: ${result.count} inserted, ${schools.length - result.count} skipped (already exist)`
      );
    }
  }

  console.log(
    `\nDone! ${totalInserted} schools inserted, ${totalSkipped} skipped.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
