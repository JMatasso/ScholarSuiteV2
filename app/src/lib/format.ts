/**
 * Shared formatting utilities.
 * Import from "@/lib/format" instead of defining inline in pages.
 */

/** Extract up to 2 initials from a name string. */
export function getInitials(name?: string | null): string {
  if (!name) return "??"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

/** Format an ISO date string as "Mar 15, 2026". Returns fallback if null. */
export function formatDate(dateStr: string | null, fallback = "—"): string {
  if (!dateStr) return fallback
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

/**
 * Smart time formatting for messaging:
 * - Today → "2:30 PM"
 * - Yesterday → "Yesterday"
 * - Within a week → "Wed"
 * - Older → "Mar 15"
 */
export function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  )
  if (diffDays === 0) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })
  }
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7)
    return date.toLocaleDateString("en-US", { weekday: "short" })
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

/** Simple time-only format: "2:30 PM" */
export function formatTimeOnly(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
}

/** Format a number as currency: "$1,234" */
export function formatCurrency(val: number): string {
  return "$" + val.toLocaleString()
}
