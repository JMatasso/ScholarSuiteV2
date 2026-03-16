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
        "flex flex-col gap-3 rounded-2xl bg-card p-6 shadow-lg shadow-black/[0.04] ring-1 ring-white/60 transition-all duration-300 hover:shadow-xl hover:shadow-black/[0.06] hover:scale-[1.02]",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        {Icon && (
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#1E3A5F]/8">
            <Icon className="size-5 text-[#1E3A5F]" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-3xl font-bold tracking-tight text-foreground font-display">
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
