/**
 * Simple in-memory rate limiter for API routes.
 * Uses a sliding window approach with automatic cleanup.
 *
 * For production at scale, swap this for a Redis-backed limiter.
 * For individual users / small user base, this is sufficient.
 */

interface RateLimitEntry {
  timestamps: number[]
}

const store = new Map<string, RateLimitEntry>()

// Clean up stale entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanup(windowMs: number) {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now

  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs)
    if (entry.timestamps.length === 0) store.delete(key)
  }
}

interface RateLimitConfig {
  /** Time window in milliseconds */
  windowMs: number
  /** Max requests per window */
  max: number
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetMs: number
}

export function rateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  cleanup(config.windowMs)

  let entry = store.get(key)
  if (!entry) {
    entry = { timestamps: [] }
    store.set(key, entry)
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < config.windowMs)

  if (entry.timestamps.length >= config.max) {
    const oldest = entry.timestamps[0]
    return {
      success: false,
      remaining: 0,
      resetMs: oldest + config.windowMs - now,
    }
  }

  entry.timestamps.push(now)
  return {
    success: true,
    remaining: config.max - entry.timestamps.length,
    resetMs: config.windowMs,
  }
}

/**
 * Preset rate limit configs for different route types.
 */
export const RATE_LIMITS = {
  /** Login: 5 attempts per 15 minutes per IP */
  login: { windowMs: 15 * 60 * 1000, max: 5 },
  /** Registration: 3 attempts per hour per IP */
  register: { windowMs: 60 * 60 * 1000, max: 3 },
  /** Password reset: 3 attempts per 15 minutes per IP */
  passwordReset: { windowMs: 15 * 60 * 1000, max: 3 },
  /** General API: 100 requests per minute per user */
  api: { windowMs: 60 * 1000, max: 100 },
} as const
