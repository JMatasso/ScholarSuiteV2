"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "motion/react"
import { GraduationCap, ArrowLeft, Search } from "@/lib/icons"

const containerVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.43, 0.13, 0.23, 0.96] as [number, number, number, number],
      delayChildren: 0.1,
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] as [number, number, number, number] },
  },
}

const numberVariants = {
  hidden: (direction: number) => ({
    opacity: 0,
    x: direction * 40,
    y: 15,
    rotate: direction * 5,
  }),
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    rotate: 0,
    transition: { duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] as [number, number, number, number] },
  },
}

const iconVariants = {
  hidden: { scale: 0.8, opacity: 0, y: 15, rotate: -5 },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    rotate: 0,
    transition: { duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] as [number, number, number, number] },
  },
}

export default function NotFoundPage() {
  const { data: session } = useSession()
  const role = (session?.user as { role?: string })?.role

  const dashboardHref =
    role === "ADMIN" ? "/admin" :
    role === "PARENT" ? "/parent" :
    role === "STUDENT" ? "/student" :
    "/"

  const dashboardLabel =
    role === "ADMIN" ? "Back to Admin Dashboard" :
    role === "PARENT" ? "Back to Parent Dashboard" :
    role === "STUDENT" ? "Back to Student Dashboard" :
    "Back to Home"

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <AnimatePresence mode="wait">
        <motion.div
          className="text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* 4 [icon] 4 */}
          <div className="flex items-center justify-center gap-3 md:gap-5 mb-8 md:mb-10">
            <motion.span
              className="text-[80px] md:text-[120px] font-bold text-[#1E3A5F] select-none leading-none"
              variants={numberVariants}
              custom={-1}
            >
              4
            </motion.span>

            <motion.div
              variants={iconVariants}
              animate={{
                y: [-4, 4],
                transition: {
                  y: { duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" as const },
                },
              }}
              whileHover={{
                scale: 1.1,
                rotate: [0, -5, 5, -3, 0],
                transition: { duration: 0.6 },
              }}
            >
              <div className="w-[72px] h-[72px] md:w-[100px] md:h-[100px] bg-[#1E3A5F] rounded-2xl md:rounded-3xl flex items-center justify-center shadow-lg cursor-default">
                <GraduationCap className="w-9 h-9 md:w-12 md:h-12 text-white" />
              </div>
            </motion.div>

            <motion.span
              className="text-[80px] md:text-[120px] font-bold text-[#1E3A5F] select-none leading-none"
              variants={numberVariants}
              custom={1}
            >
              4
            </motion.span>
          </div>

          {/* Heading */}
          <motion.h1
            className="text-2xl md:text-4xl font-bold text-[#1E3A5F] mb-3 md:mb-4"
            variants={itemVariants}
          >
            Page not found
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-base md:text-lg text-muted-foreground mb-8 md:mb-10 max-w-md mx-auto"
            variants={itemVariants}
          >
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
            Let&apos;s get you back on track.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            variants={itemVariants}
            whileHover={{
              scale: 1.05,
              transition: { duration: 0.3, ease: [0.43, 0.13, 0.23, 0.96] as [number, number, number, number] },
            }}
          >
            <Link
              href={dashboardHref}
              className="inline-flex items-center gap-2 bg-[#2563EB] text-white px-8 py-3 rounded-full text-base font-medium hover:bg-[#2563EB]/90 transition-colors shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
              {dashboardLabel}
            </Link>
          </motion.div>

          {/* Secondary link */}
          <motion.div className="mt-8" variants={itemVariants}>
            <Link
              href={role === "STUDENT" ? "/student/scholarships" : dashboardHref}
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <Search className="w-3.5 h-3.5" />
              {role === "STUDENT" ? "Browse scholarships instead" : "Search for something else"}
            </Link>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
