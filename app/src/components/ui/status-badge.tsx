import * as React from "react"
import { cn } from "@/lib/utils"

const statusConfig = {
  // Scholarship / Application statuses
  NOT_STARTED: { label: "Not Started", color: "bg-gray-100 text-gray-700 ring-gray-300" },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-50 text-blue-700 ring-blue-300" },
  SUBMITTED: { label: "Submitted", color: "bg-purple-50 text-purple-700 ring-purple-300" },
  AWARDED: { label: "Awarded", color: "bg-green-50 text-green-700 ring-green-300" },
  DENIED: { label: "Denied", color: "bg-red-50 text-red-700 ring-red-300" },

  // Student statuses
  NEW: { label: "New", color: "bg-blue-50 text-blue-700 ring-blue-300" },
  ACTIVE: { label: "Active", color: "bg-green-50 text-green-700 ring-green-300" },
  AT_RISK: { label: "At Risk", color: "bg-amber-50 text-amber-700 ring-amber-300" },
  INACTIVE: { label: "Inactive", color: "bg-gray-100 text-gray-700 ring-gray-300" },
  GRADUATED: { label: "Graduated", color: "bg-purple-50 text-purple-700 ring-purple-300" },

  // Document / workflow statuses
  DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-700 ring-gray-300" },
  UNDER_REVIEW: { label: "Under Review", color: "bg-blue-50 text-blue-700 ring-blue-300" },
  APPROVED: { label: "Approved", color: "bg-green-50 text-green-700 ring-green-300" },

  // Ticket / issue statuses
  OPEN: { label: "Open", color: "bg-blue-50 text-blue-700 ring-blue-300" },
  RESOLVED: { label: "Resolved", color: "bg-green-50 text-green-700 ring-green-300" },

  // Priority levels
  LOW: { label: "Low", color: "bg-gray-100 text-gray-700 ring-gray-300" },
  MEDIUM: { label: "Medium", color: "bg-yellow-50 text-yellow-700 ring-yellow-300" },
  HIGH: { label: "High", color: "bg-red-50 text-red-700 ring-red-300" },
  URGENT: { label: "Urgent", color: "bg-red-50 text-red-700 ring-red-300" },
} as const

type Status = keyof typeof statusConfig

interface StatusBadgeProps extends React.ComponentProps<"span"> {
  status: Status
  label?: string
}

function StatusBadge({ status, label, className, ...props }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      data-slot="status-badge"
      className={cn(
        "inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        config.color,
        className
      )}
      {...props}
    >
      {label ?? config.label}
    </span>
  )
}

export { StatusBadge, statusConfig }
export type { Status, StatusBadgeProps }
