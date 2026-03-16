"use client"

import { motion } from "motion/react"
import { cn } from "@/lib/utils"

interface AnimatedLogoProps {
  size?: "sm" | "md" | "lg"
  showText?: boolean
  className?: string
}

const sizes = {
  sm: { box: "h-8 w-8", icon: "w-[18px] h-[18px]", text: "text-base" },
  md: { box: "h-10 w-10", icon: "w-[22px] h-[22px]", text: "text-xl" },
  lg: { box: "h-12 w-12", icon: "w-[26px] h-[26px]", text: "text-2xl" },
}

function GradCapSVG({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Cap base / mortarboard */}
      <motion.polygon
        points="50,18 95,40 50,62 5,40"
        fill="white"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", bounce: 0.5, duration: 1 }}
      />
      {/* Cap bottom / band */}
      <motion.path
        d="M25 48 L25 68 Q50 82 75 68 L75 48 L50 62 L25 48Z"
        fill="rgba(255,255,255,0.85)"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, type: "spring", bounce: 0.4 }}
      />
      {/* Tassel string */}
      <motion.line
        x1="75" y1="40" x2="75" y2="62"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      />
      {/* Tassel ball */}
      <motion.circle
        cx="85"
        cy="68"
        r="5"
        fill="#FBBF24"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring", bounce: 0.6 }}
      />
      {/* Tassel hang */}
      <motion.path
        d="M75 62 Q80 65 85 63"
        stroke="white"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
      />
    </svg>
  )
}

export function AnimatedLogo({
  size = "sm",
  showText = true,
  className,
}: AnimatedLogoProps) {
  const s = sizes[size]

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <motion.div
        className={cn(
          "flex items-center justify-center rounded-xl bg-[#1E3A5F] overflow-hidden",
          s.box
        )}
        whileHover={{
          scale: 1.1,
          rotate: [0, -3, 3, -2, 0],
          transition: { rotate: { duration: 0.5 }, scale: { duration: 0.2 } },
        }}
        whileTap={{ scale: 0.92 }}
      >
        <GradCapSVG className={s.icon} />
      </motion.div>
      {showText && (
        <motion.span
          className={cn("font-semibold text-[#1E3A5F] tracking-tight", s.text)}
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          ScholarSuite
        </motion.span>
      )}
    </div>
  )
}

export { GradCapSVG }
