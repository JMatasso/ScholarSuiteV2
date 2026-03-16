import { z } from "zod"

/**
 * Password policy:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character"
  )

/**
 * Validate a password and return all errors (not just the first).
 */
export function validatePassword(password: string): {
  valid: boolean
  errors: string[]
} {
  const result = passwordSchema.safeParse(password)
  if (result.success) {
    return { valid: true, errors: [] }
  }
  return {
    valid: false,
    errors: result.error.issues.map((i) => i.message),
  }
}

/**
 * Password requirements as a displayable list (for UI).
 */
export const PASSWORD_REQUIREMENTS = [
  "At least 8 characters",
  "At least one uppercase letter (A-Z)",
  "At least one lowercase letter (a-z)",
  "At least one number (0-9)",
  "At least one special character (!@#$%...)",
]
