import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import { PrismaClient } from "../src/generated/prisma/client.js"

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const total = await prisma.scholarship.count()
  const enriched = await prisma.scholarship.count({
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
  })
  const current = await prisma.scholarship.count({ where: { scrapeStatus: "CURRENT" } })
  const needsReview = await prisma.scholarship.count({ where: { scrapeStatus: "NEEDS_REVIEW" } })
  const expired = await prisma.scholarship.count({ where: { scrapeStatus: "EXPIRED" } })
  const error = await prisma.scholarship.count({ where: { scrapeStatus: "ERROR" } })
  const noDesc = await prisma.scholarship.count({ where: { OR: [{ description: null }, { description: "" }] } })
  const noDeadline = await prisma.scholarship.count({ where: { deadline: null } })
  const noAmount = await prisma.scholarship.count({ where: { amount: null } })

  console.log("\n Scholarship Enrichment Report")
  console.log("================================")
  console.log(`Total scholarships:   ${total}`)
  console.log(`Enriched:             ${enriched} (${total > 0 ? Math.round((enriched / total) * 100) : 0}%)`)
  console.log(`Unenriched:           ${total - enriched}`)
  console.log()
  console.log("Scrape Status:")
  console.log(`  Current:            ${current}`)
  console.log(`  Needs Review:       ${needsReview}`)
  console.log(`  Expired:            ${expired}`)
  console.log(`  Error:              ${error}`)
  console.log(`  Unscraped:          ${total - current - needsReview - expired - error}`)
  console.log()
  console.log("Missing Fields:")
  console.log(`  No description:     ${noDesc}`)
  console.log(`  No deadline:        ${noDeadline}`)
  console.log(`  No amount:          ${noAmount}`)
  console.log()

  await prisma.$disconnect()
  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
