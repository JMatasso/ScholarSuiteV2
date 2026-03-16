import { db } from "@/lib/db"

const RATE_LIMIT_PER_HOUR = parseInt(process.env.CHAT_RATE_LIMIT_PER_HOUR || "50", 10)
const WINDOW_MS = 60 * 60 * 1000 // 1 hour

export async function checkRateLimit(userId: string): Promise<{
  allowed: boolean
  remaining: number
  resetAt: Date
}> {
  const now = new Date()
  const windowStart = new Date(now.getTime() - WINDOW_MS)

  let record = await db.chatRateLimit.findUnique({ where: { userId } })

  if (!record || record.windowStart < windowStart) {
    // Reset window
    record = await db.chatRateLimit.upsert({
      where: { userId },
      create: { userId, count: 1, windowStart: now },
      update: { count: 1, windowStart: now },
    })
    return {
      allowed: true,
      remaining: RATE_LIMIT_PER_HOUR - 1,
      resetAt: new Date(now.getTime() + WINDOW_MS),
    }
  }

  if (record.count >= RATE_LIMIT_PER_HOUR) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(record.windowStart.getTime() + WINDOW_MS),
    }
  }

  await db.chatRateLimit.update({
    where: { userId },
    data: { count: { increment: 1 } },
  })

  return {
    allowed: true,
    remaining: RATE_LIMIT_PER_HOUR - record.count - 1,
    resetAt: new Date(record.windowStart.getTime() + WINDOW_MS),
  }
}
