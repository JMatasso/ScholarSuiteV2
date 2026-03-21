"use client"

import { ReactNode } from "react"
import { ArrowRight, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface BentoCardLinkProps {
  href: string
  title: string
  description?: string
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  badge?: ReactNode
  children?: ReactNode
  cta?: string
  className?: string
}

function BentoCardLink({
  href,
  title,
  description,
  icon: Icon,
  iconColor = "text-[#2563EB]",
  iconBg = "bg-blue-50",
  badge,
  children,
  cta = "View All",
  className,
}: BentoCardLinkProps) {
  return (
    <Link href={href} className="block">
      <div
        className={cn(
          "group relative flex flex-col overflow-hidden rounded-xl bg-white transform-gpu",
          "[box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]",
          "transition-all duration-300",
          "hover:[box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_4px_8px_rgba(0,0,0,.07),0_16px_32px_rgba(0,0,0,.07)]",
          className
        )}
      >
        {/* Card content — slides up on hover */}
        <div className="z-10 flex transform-gpu flex-col gap-1 p-5 transition-all duration-300 group-hover:-translate-y-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", iconBg)}>
                <Icon className={cn("h-4 w-4", iconColor)} />
              </div>
              <h3 className="text-sm font-semibold text-[#1A1A1A]">{title}</h3>
            </div>
            {badge}
          </div>
          {description && (
            <p className="text-xs text-gray-500 mb-1">{description}</p>
          )}
          {children}
        </div>

        {/* CTA — fades in from below on hover */}
        <div className="pointer-events-none absolute bottom-0 flex w-full translate-y-8 transform-gpu flex-row items-center px-5 pb-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="pointer-events-auto inline-flex items-center text-xs font-medium text-[#2563EB] hover:text-[#2563EB]/80 transition-colors">
            {cta}
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </span>
        </div>

        {/* Hover overlay */}
        <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-black/[.03]" />
      </div>
    </Link>
  )
}

export { BentoCardLink }
export type { BentoCardLinkProps }
