import Link from "next/link"
import { CheckCircle2 } from "lucide-react"

export default function SubmitSuccessPage() {
  return (
    <div className="flex flex-col items-center text-center py-16">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-6">
        <CheckCircle2 className="h-8 w-8 text-emerald-600" />
      </div>
      <h1 className="text-2xl font-semibold text-[#1E3A5F]">Submission Received!</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Thank you for listing your scholarship. Our team will review it and notify you once
        it&apos;s published.
      </p>
      <Link
        href="/scholarships/submit"
        className="mt-8 inline-flex items-center rounded-lg bg-[#2563EB] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2563EB]/90 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
      >
        Submit Another
      </Link>
    </div>
  )
}
