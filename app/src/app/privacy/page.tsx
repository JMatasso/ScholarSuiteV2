"use client"

import Link from "next/link"
import { GraduationCap, ArrowLeft } from "lucide-react"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-[#1E3A5F] rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-[#1A1A1A]">ScholarSuite</span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-[#2563EB] hover:underline mb-4">
            <ArrowLeft className="w-3 h-3" />
            Back
          </Link>
          <h1 className="text-2xl font-semibold text-[#1E3A5F]">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mt-1">Last updated: March 16, 2026</p>
        </div>

        {/* Content */}
        <div className="prose prose-sm max-w-none text-[#1A1A1A] space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-[#1E3A5F]">1. Information We Collect</h2>
            <p>When you create an account or use ScholarSuite, we collect:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Account information:</strong> Your name, email address, and role (student or parent).</li>
              <li><strong>Profile information:</strong> GPA, grade level, school, extracurricular activities, and other details you choose to provide.</li>
              <li><strong>Content you create:</strong> Tasks, essays, scholarship applications, documents, financial plans, and messages.</li>
              <li><strong>Usage data:</strong> Log-in times, pages visited, and actions taken within the platform for security and improvement purposes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1E3A5F]">2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide and improve the ScholarSuite platform.</li>
              <li>Match you with relevant scholarship opportunities.</li>
              <li>Facilitate communication between students, parents, and counselors.</li>
              <li>Send account-related notifications (password resets, security alerts).</li>
              <li>Maintain security and prevent fraud through audit logging.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1E3A5F]">3. Information Sharing</h2>
            <p>We do <strong>not</strong> sell, rent, or share your personal information with third parties for marketing purposes. We may share data only:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>With service providers who help us operate the platform (hosting, email delivery), under strict data processing agreements.</li>
              <li>If required by law or to protect the rights, safety, or property of our users.</li>
              <li>With your explicit consent.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1E3A5F]">4. Data Security</h2>
            <p>We protect your data with:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Encryption in transit (HTTPS/TLS) for all connections.</li>
              <li>Passwords hashed with bcrypt (never stored in plain text).</li>
              <li>Rate limiting on authentication endpoints to prevent brute-force attacks.</li>
              <li>Session timeouts that automatically log you out after inactivity.</li>
              <li>Audit logging of security-sensitive actions.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1E3A5F]">5. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Access:</strong> Download a copy of all your data at any time from Settings.</li>
              <li><strong>Correct:</strong> Update your profile information at any time.</li>
              <li><strong>Delete:</strong> Request deletion of your account and all associated data by contacting us.</li>
              <li><strong>Portability:</strong> Export your data in a standard JSON format.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1E3A5F]">6. Data Retention</h2>
            <p>We retain your data for as long as your account is active. If you delete your account, we will remove your personal data within 30 days, except where retention is required by law.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1E3A5F]">7. Children&apos;s Privacy</h2>
            <p>ScholarSuite is designed for high school students (typically ages 14+) and their parents. We do not knowingly collect information from children under 13. If you believe a child under 13 has created an account, please contact us immediately.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1E3A5F]">8. Changes to This Policy</h2>
            <p>We may update this policy from time to time. We will notify you of significant changes via email or an in-app notification. Continued use of ScholarSuite after changes constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1E3A5F]">9. Contact Us</h2>
            <p>If you have questions about this privacy policy or your data, contact us at <a href="mailto:privacy@scholarsuite.app" className="text-[#2563EB] hover:underline">privacy@scholarsuite.app</a>.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
