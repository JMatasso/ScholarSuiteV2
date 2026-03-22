"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const ORG_TYPES = [
  "Foundation",
  "Community Org",
  "Business",
  "Government",
  "School District",
  "Faith-Based",
  "Civic Group",
  "Memorial",
  "Other",
]

const inputClass =
  "w-full px-4 py-2.5 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"

const labelClass = "text-sm font-medium text-foreground"

export default function SubmitScholarshipPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const form = e.currentTarget
    const data = new FormData(form)

    // Honeypot check
    if (data.get("_hp")) return

    setSubmitting(true)

    try {
      const body = {
        orgName: data.get("orgName"),
        orgType: data.get("orgType"),
        county: data.get("county"),
        state: data.get("state"),
        contactName: data.get("contactName"),
        contactEmail: data.get("contactEmail"),
        contactPhone: data.get("contactPhone"),
        website: data.get("website"),
        scholarshipName: data.get("scholarshipName"),
        amount: data.get("amount"),
        maxAmount: data.get("maxAmount"),
        deadline: data.get("deadline"),
        description: data.get("description"),
        applicationUrl: data.get("applicationUrl"),
        isRecurring: data.get("isRecurring") === "on",
      }

      const res = await fetch("/api/scholarships/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.error || "Something went wrong. Please try again.")
      }

      router.push("/scholarships/submit/success")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-secondary-foreground">
          List Your Scholarship on ScholarSuite
        </h1>
        <p className="mt-1 text-muted-foreground">
          Help local students discover your scholarship opportunity.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Honeypot */}
        <input type="text" name="_hp" className="hidden" tabIndex={-1} autoComplete="off" />

        {/* Organization Info */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-secondary-foreground">
            Organization Info
          </h2>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="orgName" className={labelClass}>
                  Organization Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="orgName"
                  name="orgName"
                  type="text"
                  required
                  placeholder="e.g. Smith Family Foundation"
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="orgType" className={labelClass}>
                  Organization Type
                </label>
                <select id="orgType" name="orgType" className={inputClass} defaultValue="">
                  <option value="" disabled>
                    Select type...
                  </option>
                  {ORG_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="county" className={labelClass}>
                  County
                </label>
                <input
                  id="county"
                  name="county"
                  type="text"
                  placeholder="e.g. Los Angeles"
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="state" className={labelClass}>
                  State
                </label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  placeholder="e.g. California"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="contactName" className={labelClass}>
                  Contact Name
                </label>
                <input
                  id="contactName"
                  name="contactName"
                  type="text"
                  placeholder="Jane Doe"
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="contactEmail" className={labelClass}>
                  Contact Email <span className="text-rose-500">*</span>
                </label>
                <input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  required
                  placeholder="jane@example.org"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="contactPhone" className={labelClass}>
                  Phone
                </label>
                <input
                  id="contactPhone"
                  name="contactPhone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="website" className={labelClass}>
                  Website
                </label>
                <input
                  id="website"
                  name="website"
                  type="url"
                  placeholder="https://example.org"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Scholarship Details */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-secondary-foreground">
            Scholarship Details
          </h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="scholarshipName" className={labelClass}>
                Scholarship Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="scholarshipName"
                name="scholarshipName"
                type="text"
                required
                placeholder="e.g. Smith Family STEM Scholarship"
                className={inputClass}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label htmlFor="amount" className={labelClass}>
                  Amount ($)
                </label>
                <input
                  id="amount"
                  name="amount"
                  type="text"
                  placeholder="1000"
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="maxAmount" className={labelClass}>
                  Max Amount ($)
                </label>
                <input
                  id="maxAmount"
                  name="maxAmount"
                  type="text"
                  placeholder="5000"
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="deadline" className={labelClass}>
                  Deadline
                </label>
                <input id="deadline" name="deadline" type="date" className={inputClass} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="description" className={labelClass}>
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                placeholder="Describe the scholarship, eligibility requirements, and any other details..."
                className={`${inputClass} min-h-[100px] resize-y`}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="applicationUrl" className={labelClass}>
                Application URL
              </label>
              <input
                id="applicationUrl"
                name="applicationUrl"
                type="url"
                placeholder="https://example.org/apply"
                className={inputClass}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="isRecurring"
                name="isRecurring"
                type="checkbox"
                className="h-4 w-4 rounded border-border text-[#2563EB] focus:ring-ring"
              />
              <label htmlFor="isRecurring" className="text-sm text-foreground">
                This scholarship is offered every year
              </label>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-[#2563EB] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#2563EB]/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Submit for Review"}
        </button>
      </form>
    </div>
  )
}
