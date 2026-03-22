"use client"

import { useRef, useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { X } from "@/lib/icons"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface IncompleteSection {
  label: string
  href: string
}

interface CompletionBannerProps {
  percentage: number
  incompleteSections: IncompleteSection[]
  onDismiss: () => void
}

const RADIUS = 34
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function CircularProgress({ percentage }: { percentage: number }) {
  const [offset, setOffset] = useState(CIRCUMFERENCE)
  const ref = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const target = CIRCUMFERENCE - (percentage / 100) * CIRCUMFERENCE
    // Small delay so the animation is visible on mount
    const timer = requestAnimationFrame(() => setOffset(target))
    return () => cancelAnimationFrame(timer)
  }, [percentage])

  return (
    <svg
      ref={ref}
      width={80}
      height={80}
      viewBox="0 0 80 80"
      className="shrink-0"
    >
      {/* Track */}
      <circle
        cx={40}
        cy={40}
        r={RADIUS}
        fill="none"
        stroke="#f0f0f0"
        strokeWidth={6}
      />
      {/* Progress */}
      <circle
        cx={40}
        cy={40}
        r={RADIUS}
        fill="none"
        stroke="#2563EB"
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        transform="rotate(-90 40 40)"
        className="transition-[stroke-dashoffset] duration-1000 ease-out"
      />
      {/* Center text */}
      <text
        x={40}
        y={40}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-secondary-foreground text-lg font-bold"
        fontSize={18}
        fontWeight={700}
      >
        {percentage}%
      </text>
    </svg>
  )
}

export function CompletionBanner({
  percentage,
  incompleteSections,
  onDismiss,
}: CompletionBannerProps) {
  if (percentage >= 100) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative rounded-xl bg-card p-5 ring-1 ring-foreground/10"
      >
        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          className="absolute right-3 top-3 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex gap-5">
          {/* Circular progress */}
          <CircularProgress percentage={percentage} />

          {/* Content */}
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-secondary-foreground">
              Complete Your Profile
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Finish setting up to get the most out of ScholarSuite
            </p>

            {incompleteSections.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {incompleteSections.map((section) => (
                  <Link
                    key={section.href}
                    href={section.href}
                    className="inline-flex cursor-pointer items-center rounded-full bg-[#2563EB]/10 px-3 py-1 text-xs font-medium text-[#2563EB] transition-colors hover:bg-[#2563EB]/20"
                  >
                    {section.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
