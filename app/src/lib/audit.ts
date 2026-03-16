import { db } from "@/lib/db"

/**
 * Log a security-relevant action to the audit trail.
 * Fire-and-forget — does not throw on failure.
 */
export async function logAudit(params: {
  userId?: string | null
  action: string
  resource: string
  resourceId?: string
  details?: string
}) {
  try {
    await db.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId ?? null,
        details: params.details ?? null,
      },
    })
  } catch (error) {
    // Audit logging should never break the request
    console.error("Audit log failed:", error)
  }
}
