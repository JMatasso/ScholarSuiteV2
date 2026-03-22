"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { GraduationCap, ArrowLeft } from "@/lib/icons"

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
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="text-center">
        <div className="w-16 h-16 bg-[#1E3A5F] rounded-2xl flex items-center justify-center mx-auto mb-6">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
        <h2 className="text-xl font-semibold text-foreground mb-2">Page not found</h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back on track.
        </p>
        <Link
          href={dashboardHref}
          className="inline-flex items-center gap-2 bg-[#1E3A5F] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#162d4a] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {dashboardLabel}
        </Link>
      </div>
    </div>
  )
}
