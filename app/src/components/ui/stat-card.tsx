"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react"
import { motion, useSpring, useTransform, useInView } from "motion/react"

interface StatCardProps extends React.ComponentProps<"div"> {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  trend?: {
    value: number
    label?: string
  }
  /** Index for stagger delay (0-based) */
  index?: number
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  index = 0,
  ...props
}: StatCardProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  // Animate numeric values
  const numericValue = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.]/g, ""))
  const isNumeric = !isNaN(numericValue) && typeof value === "number"
  const spring = useSpring(0, { bounce: 0, duration: 1500 })
  const displayValue = useTransform(spring, (v) => Math.round(v).toLocaleString())

  React.useEffect(() => {
    if (isInView && isNumeric) {
      spring.set(numericValue)
    }
  }, [isInView, isNumeric, numericValue, spring])

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
    <motion.div
      ref={ref}
      data-slot="stat-card"
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn(
        "flex flex-col gap-3 rounded-2xl bg-card p-6 shadow-lg shadow-black/[0.04] ring-1 ring-white/60 transition-shadow duration-300 hover:shadow-xl hover:shadow-black/[0.06]",
        className
      )}
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
          {isNumeric ? <motion.span>{displayValue}</motion.span> : value}
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
    </motion.div>
  )
}

export { StatCard }
export type { StatCardProps }
