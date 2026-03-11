import * as React from "react"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react"

interface StatCardProps extends React.ComponentProps<"div"> {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  trend?: {
    value: number
    label?: string
  }
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  ...props
}: StatCardProps) {
  const TrendIcon =
    trend && trend.value > 0
      ? TrendingUp
      : trend && trend.value < 0
        ? TrendingDown
        : Minus

  const trendColor =
    trend && trend.value > 0
      ? "text-green-600"
      : trend && trend.value < 0
        ? "text-red-600"
        : "text-muted-foreground"

  return (
    <div
      data-slot="stat-card"
      className={cn(
        "flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {title}
        </span>
        {Icon && (
          <div className="flex size-9 items-center justify-center rounded-lg bg-[#1E3A5F]/10">
            <Icon className="size-4 text-[#1E3A5F]" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-2xl font-semibold tracking-tight text-foreground">
          {value}
        </span>
        <div className="flex items-center gap-2">
          {trend && (
            <span className={cn("flex items-center gap-0.5 text-xs font-medium", trendColor)}>
              <TrendIcon className="size-3" />
              {trend.value > 0 ? "+" : ""}
              {trend.value}%
              {trend.label && (
                <span className="text-muted-foreground"> {trend.label}</span>
              )}
            </span>
          )}
          {description && !trend && (
            <span className="text-xs text-muted-foreground">{description}</span>
          )}
        </div>
      </div>
    </div>
  )
}

export { StatCard }
export type { StatCardProps }
