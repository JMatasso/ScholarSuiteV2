import * as React from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface TableSkeletonProps extends React.ComponentProps<"div"> {
  rows?: number
  columns?: number
}

function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
  ...props
}: TableSkeletonProps) {
  return (
    <div
      data-slot="table-skeleton"
      className={cn("rounded-xl ring-1 ring-foreground/10 overflow-hidden", className)}
      {...props}
    >
      {/* Header */}
      <div className="flex gap-4 border-b bg-muted/40 px-4 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex gap-4 border-b last:border-0 px-4 py-3"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              className={cn("h-4 flex-1", colIndex === 0 && "max-w-[200px]")}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

interface CardSkeletonProps extends React.ComponentProps<"div"> {
  lines?: number
}

function CardSkeleton({ lines = 3, className, ...props }: CardSkeletonProps) {
  return (
    <div
      data-slot="card-skeleton"
      className={cn(
        "flex flex-col gap-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="size-9 rounded-lg" />
      </div>
      <Skeleton className="h-7 w-20" />
      {Array.from({ length: lines - 2 }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-32" />
      ))}
    </div>
  )
}

interface PageSkeletonProps extends React.ComponentProps<"div"> {
  variant?: "table" | "cards" | "mixed"
}

function PageSkeleton({
  variant = "mixed",
  className,
  ...props
}: PageSkeletonProps) {
  return (
    <div
      data-slot="page-skeleton"
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      {/* Page header skeleton */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-8 w-32" />
      </div>

      {(variant === "cards" || variant === "mixed") && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {(variant === "table" || variant === "mixed") && (
        <>
          {/* Search bar skeleton */}
          <Skeleton className="h-8 w-64" />
          <TableSkeleton />
        </>
      )}
    </div>
  )
}

export { TableSkeleton, CardSkeleton, PageSkeleton }
export type { TableSkeletonProps, CardSkeletonProps, PageSkeletonProps }
