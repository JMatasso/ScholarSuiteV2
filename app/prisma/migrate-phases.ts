import "dotenv/config"
if (process.env.DATABASE_URL?.includes("railway")) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
}

import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const db = new PrismaClient({ adapter })

async function main() {
  console.log("Migrating all task phases to FINAL (Senior Spring)...")

  const templateResult = await db.taskTemplateItem.updateMany({
    where: { phase: { in: ["INTRODUCTION", "PHASE_1", "PHASE_2", "ONGOING"] } },
    data: { phase: "FINAL" },
  })
  console.log(`Template items updated: ${templateResult.count}`)

  const taskResult = await db.task.updateMany({
    where: { phase: { in: ["INTRODUCTION", "PHASE_1", "PHASE_2", "ONGOING"] } },
    data: { phase: "FINAL" },
  })
  console.log(`Student tasks updated: ${taskResult.count}`)

  await db.$disconnect()
  console.log("Done!")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
