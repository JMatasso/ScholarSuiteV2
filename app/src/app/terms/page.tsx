"use client"

import Link from "next/link"
import { GraduationCap, ArrowLeft } from "@/lib/icons"

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-[#1E3A5F] rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-foreground">ScholarSuite</span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-[#2563EB] hover:underline mb-4">
            <ArrowLeft className="w-3 h-3" />
            Back
          </Link>
          <h1 className="text-2xl font-semibold text-secondary-foreground">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mt-1">Last updated: March 16, 2026</p>
        </div>

        {/* Content */}
        <div className="prose prose-sm max-w-none text-foreground space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-secondary-foreground">1. Acceptance of Terms</h2>
            <p>By creating an account or using ScholarSuite, you agree to these Terms of Service. If you do not agree, do not use the platform. If you are under 18, you must have a parent or guardian&apos;s consent to use ScholarSuite.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-secondary-foreground">2. Description of Service</h2>
            <p>ScholarSuite is a scholarship and college preparation platform that helps students discover scholarships, manage applications, draft essays, track tasks, and communicate with counselors and parents. The platform is provided &quot;as is&quot; and we continually improve it.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-secondary-foreground">3. Account Responsibilities</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You must provide accurate information when creating your account.</li>
              <li>You must not share your account with others or create multiple accounts.</li>
              <li>You must notify us immediately if you suspect unauthorized access to your account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-secondary-foreground">4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use ScholarSuite for any unlawful purpose.</li>
              <li>Submit false or misleading information in scholarship applications.</li>
              <li>Harass, abuse, or threaten other users through the messaging system.</li>
              <li>Attempt to access other users&apos; accounts or data.</li>
              <li>Interfere with the platform&apos;s operation or security.</li>
              <li>Scrape, crawl, or use automated tools to extract data from the platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-secondary-foreground">5. Content Ownership</h2>
            <p>You retain ownership of all content you create on ScholarSuite (essays, documents, messages, etc.). By using the platform, you grant us a limited license to store, process, and display your content solely to provide the service to you.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-secondary-foreground">6. Scholarship Information</h2>
            <p>ScholarSuite provides scholarship information for informational purposes. We do not guarantee the accuracy, availability, or outcome of any scholarship listed on the platform. Always verify scholarship details directly with the providing organization.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-secondary-foreground">7. Service Availability</h2>
            <p>We strive to maintain high availability but do not guarantee uninterrupted service. We may temporarily suspend the service for maintenance, updates, or security reasons. We will attempt to provide advance notice when possible.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-secondary-foreground">8. Termination</h2>
            <p>You may delete your account at any time. We may suspend or terminate your account if you violate these terms. Upon termination, your data will be handled according to our <Link href="/privacy" className="text-[#2563EB] hover:underline">Privacy Policy</Link>.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-secondary-foreground">9. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, ScholarSuite and its operators shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform, including but not limited to lost scholarship opportunities or data loss.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-secondary-foreground">10. Changes to Terms</h2>
            <p>We may update these terms from time to time. We will notify you of material changes via email or an in-app notification. Continued use after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-secondary-foreground">11. Contact Us</h2>
            <p>If you have questions about these terms, contact us at <a href="mailto:support@scholarsuite.app" className="text-[#2563EB] hover:underline">support@scholarsuite.app</a>.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
