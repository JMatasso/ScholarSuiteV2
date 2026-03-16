"use client"

import { FileText } from "lucide-react"

export default function ResumePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1E3A5F]">Resume Builder</h1>
        <p className="mt-1 text-muted-foreground">Build and manage your resume for scholarship and college applications.</p>
      </div>

      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1E3A5F]/5 mb-4">
          <FileText className="h-8 w-8 text-[#1E3A5F]" />
        </div>
        <h2 className="text-lg font-semibold text-[#1E3A5F]">Coming Soon</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          The resume builder is currently under development. In the meantime, you can upload your resume drafts in the Documents section under the &quot;Resumes&quot; folder.
        </p>
      </div>
    </div>
  )
}
