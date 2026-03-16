"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { LearningCategoryGrid } from "@/components/ui/learning-category-grid"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function CollegePrepPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [modules, setModules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/learning?subject=COLLEGE_PREP")
      .then((r) => r.json())
      .then((data) => {
        setModules(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="College Prep"
        description="Everything you need to know about getting into the right school."
        actions={
          <Link href="/student/learning">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Hub
            </Button>
          </Link>
        }
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : (
        <LearningCategoryGrid modules={modules} basePath="/student/learning" />
      )}
    </div>
  )
}
