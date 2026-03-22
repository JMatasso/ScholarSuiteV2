/**
 * Feature flag helpers.
 * Reads from the Setting key-value store (admin-controlled).
 * All flags default to OFF (false) unless explicitly enabled.
 */

import { db } from "@/lib/db"

const FLAG_PREFIX = "feature:"

export const FLAGS = {
  AI_MATCHING: `${FLAG_PREFIX}aiMatching`,
} as const

/**
 * Check if a feature flag is enabled.
 * Returns false if the flag doesn't exist or is set to anything other than "true".
 */
export async function isFeatureEnabled(key: string): Promise<boolean> {
  const setting = await db.setting.findUnique({ where: { key } })
  return setting?.value === "true"
}

/**
 * Check if AI matching is enabled (convenience wrapper).
 */
export async function isAIMatchingEnabled(): Promise<boolean> {
  return isFeatureEnabled(FLAGS.AI_MATCHING)
}
