"use client"

import Link from "next/link"
import { Lightbulb, ArrowRight } from "@/lib/icons"

interface LearnMoreBannerProps {
  title: string
  description: string
  href: string
  className?: string
}

export function LearnMoreBanner({ title, description, href, className }: LearnMoreBannerProps) {
  return (
    <Link href={href} className={`group block ${className || ""}`}>
      <div className="flex items-center gap-3 rounded-lg border border-blue-200/60 bg-accent/50 px-4 py-3 transition-all hover:bg-accent hover:border-blue-300/60">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#2563EB]/10">
          <Lightbulb className="h-4 w-4 text-[#2563EB]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-secondary-foreground group-hover:text-[#2563EB] transition-colors">
            {title}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-1">{description}</p>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-[#2563EB] opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
      </div>
    </Link>
  )
}
