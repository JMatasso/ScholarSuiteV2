"use client";

import { useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  User,
  BookOpen,
  Users,
  DollarSign,
  Activity,
  Target,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  School,
  Briefcase,
  Shield,
  Compass,
} from "lucide-react";
import { toast } from "sonner";

const STEPS = [
  { id: 1, label: "Personal", icon: User },
  { id: 2, label: "Academic", icon: BookOpen },
  { id: 3, label: "Background", icon: Users },
  { id: 4, label: "Financial", icon: DollarSign },
  { id: 5, label: "Activities", icon: Activity },
  { id: 6, label: "Goals", icon: Target },
  { id: 7, label: "Review", icon: CheckCircle2 },
];

const JOURNEY_STAGES = [
  { value: "EARLY_EXPLORATION", label: "Early Exploration", description: "Just starting to think about college and scholarships", icon: Compass },
  { value: "ACTIVE_PREP", label: "Active Prep", description: "Actively researching and preparing applications", icon: BookOpen },
  { value: "APPLICATION_PHASE", label: "Application Phase", description: "Currently submitting scholarship applications", icon: Target },
  { value: "POST_ACCEPTANCE", label: "Post-Acceptance", description: "Accepted and finalizing financial plans", icon: CheckCircle2 },
];

const PATH_OPTIONS = [
  { value: "COLLEGE", label: "4-Year College", icon: GraduationCap },
  { value: "TRADE_SCHOOL", label: "Trade School", icon: Briefcase },
  { value: "MILITARY", label: "Military", icon: Shield },
  { value: "WORKFORCE", label: "Workforce", icon: Users },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    gpa: "",
    gradeLevel: "",
    highSchool: "",
    graduationYear: "",
    satScore: "",
    actScore: "",
    intendedMajor: "",
    ethnicity: "",
    citizenship: "",
    isFirstGen: false,
    isPellEligible: false,
    hasFinancialNeed: false,
    journeyStage: "EARLY_EXPLORATION",
    postSecondaryPath: "COLLEGE",
    activities: "",
    communityService: "",
    leadershipRoles: "",
    awards: "",
    goals: "",
    dreamSchools: "",
  });

  const update = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const next = () => setCurrentStep((s) => Math.min(s + 1, 7));
  const prev = () => setCurrentStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/students/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast.success("Profile completed! Welcome to ScholarSuite.");
        window.location.href = "/student";
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Something went wrong. Please try again.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1E3A5F] rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-[#1A1A1A]">ScholarSuite</span>
          </Link>
          <span className="text-sm text-gray-400">Step {currentStep} of 7</span>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex items-center gap-2 ${
                    currentStep === step.id
                      ? "text-[#2563EB]"
                      : currentStep > step.id
                      ? "text-emerald-500"
                      : "text-gray-300"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                      currentStep === step.id
                        ? "bg-[#2563EB] text-white"
                        : currentStep > step.id
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <span className="hidden md:inline text-sm font-medium">
                    {step.label}
                  </span>
                </button>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`w-8 lg:w-16 h-0.5 mx-2 ${
                      currentStep > step.id ? "bg-emerald-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        {currentStep === 1 && (
          <StepSection title="Personal Information" description="Tell us a bit about yourself">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label="First Name" value={formData.firstName} onChange={(v) => update("firstName", v)} placeholder="Alex" required />
              <FormField label="Last Name" value={formData.lastName} onChange={(v) => update("lastName", v)} placeholder="Johnson" required />
              <FormField label="Date of Birth" value={formData.dateOfBirth} onChange={(v) => update("dateOfBirth", v)} type="date" />
              <FormField label="Phone Number" value={formData.phone} onChange={(v) => update("phone", v)} placeholder="(555) 123-4567" />
              <FormField label="Address" value={formData.address} onChange={(v) => update("address", v)} placeholder="123 Main St" className="col-span-full" />
              <FormField label="City" value={formData.city} onChange={(v) => update("city", v)} placeholder="Los Angeles" />
              <FormField label="State" value={formData.state} onChange={(v) => update("state", v)} placeholder="California" />
              <FormField label="ZIP Code" value={formData.zipCode} onChange={(v) => update("zipCode", v)} placeholder="90001" />
            </div>
          </StepSection>
        )}

        {currentStep === 2 && (
          <StepSection title="Academic Information" description="Your school and academic details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label="High School" value={formData.highSchool} onChange={(v) => update("highSchool", v)} placeholder="Lincoln High School" className="col-span-full" />
              <FormField label="Grade Level" value={formData.gradeLevel} onChange={(v) => update("gradeLevel", v)} placeholder="12" type="number" />
              <FormField label="Graduation Year" value={formData.graduationYear} onChange={(v) => update("graduationYear", v)} placeholder="2026" type="number" />
              <FormField label="GPA (Unweighted)" value={formData.gpa} onChange={(v) => update("gpa", v)} placeholder="3.70" />
              <FormField label="SAT Score" value={formData.satScore} onChange={(v) => update("satScore", v)} placeholder="1380" />
              <FormField label="ACT Score" value={formData.actScore} onChange={(v) => update("actScore", v)} placeholder="31" />
              <FormField label="Intended Major" value={formData.intendedMajor} onChange={(v) => update("intendedMajor", v)} placeholder="Computer Science" className="col-span-full" />
            </div>
          </StepSection>
        )}

        {currentStep === 3 && (
          <StepSection title="Background & Demographics" description="This information helps match you with scholarships">
            <div className="space-y-5">
              <FormField label="Ethnicity" value={formData.ethnicity} onChange={(v) => update("ethnicity", v)} placeholder="e.g., Hispanic, African American, Asian" />
              <FormField label="Citizenship Status" value={formData.citizenship} onChange={(v) => update("citizenship", v)} placeholder="US Citizen" />
              <div className="space-y-3 pt-2">
                <CheckboxField label="I am a first-generation college student" checked={formData.isFirstGen} onChange={(v) => update("isFirstGen", v)} />
                <CheckboxField label="I am Pell Grant eligible" checked={formData.isPellEligible} onChange={(v) => update("isPellEligible", v)} />
                <CheckboxField label="I demonstrate financial need" checked={formData.hasFinancialNeed} onChange={(v) => update("hasFinancialNeed", v)} />
              </div>
            </div>
          </StepSection>
        )}

        {currentStep === 4 && (
          <StepSection title="Financial Situation" description="Help us understand your financial planning needs">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Post-secondary pathway</label>
                <div className="grid grid-cols-2 gap-3">
                  {PATH_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => update("postSecondaryPath", opt.value)}
                      className={`p-4 rounded-lg border-2 text-left transition-all flex items-center gap-3 ${
                        formData.postSecondaryPath === opt.value
                          ? "border-[#2563EB] bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <opt.icon className={`w-5 h-5 ${formData.postSecondaryPath === opt.value ? "text-[#2563EB]" : "text-gray-400"}`} />
                      <span className={`font-medium ${formData.postSecondaryPath === opt.value ? "text-[#2563EB]" : "text-gray-700"}`}>
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </StepSection>
        )}

        {currentStep === 5 && (
          <StepSection title="Activities & Interests" description="Tell us about your extracurricular involvement">
            <div className="space-y-5">
              <TextareaField label="Activities & Clubs" value={formData.activities} onChange={(v) => update("activities", v)} placeholder="e.g., Debate Team captain, Robotics Club member, Varsity Soccer..." />
              <TextareaField label="Community Service" value={formData.communityService} onChange={(v) => update("communityService", v)} placeholder="e.g., Local food bank volunteer (120 hours), Hospital volunteer..." />
              <TextareaField label="Leadership Roles" value={formData.leadershipRoles} onChange={(v) => update("leadershipRoles", v)} placeholder="e.g., Student Body Vice President, Debate Team Captain..." />
              <TextareaField label="Awards & Achievements" value={formData.awards} onChange={(v) => update("awards", v)} placeholder="e.g., National Merit Semifinalist, AP Scholar with Distinction..." />
            </div>
          </StepSection>
        )}

        {currentStep === 6 && (
          <StepSection title="Goals & Preferences" description="What are you working toward?">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Where are you in your journey?</label>
                <div className="space-y-3">
                  {JOURNEY_STAGES.map((stage) => (
                    <button
                      key={stage.value}
                      onClick={() => update("journeyStage", stage.value)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all flex items-start gap-4 ${
                        formData.journeyStage === stage.value
                          ? "border-[#2563EB] bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        formData.journeyStage === stage.value ? "bg-[#2563EB] text-white" : "bg-gray-100 text-gray-400"
                      }`}>
                        <stage.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className={`font-medium ${formData.journeyStage === stage.value ? "text-[#2563EB]" : "text-gray-700"}`}>
                          {stage.label}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">{stage.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <TextareaField label="Dream Schools" value={formData.dreamSchools} onChange={(v) => update("dreamSchools", v)} placeholder="e.g., Stanford University, UC Berkeley, MIT..." />
              <TextareaField label="Personal Goals" value={formData.goals} onChange={(v) => update("goals", v)} placeholder="What do you hope to achieve through scholarships and your education?" />
            </div>
          </StepSection>
        )}

        {currentStep === 7 && (
          <StepSection title="Review Your Profile" description="Make sure everything looks good before submitting">
            <div className="space-y-6">
              <ReviewSection title="Personal" items={[
                ["Name", `${formData.firstName} ${formData.lastName}`],
                ["Location", `${formData.city}, ${formData.state}`],
                ["Phone", formData.phone],
              ]} />
              <ReviewSection title="Academic" items={[
                ["School", formData.highSchool],
                ["GPA", formData.gpa],
                ["Grade", formData.gradeLevel],
                ["SAT", formData.satScore],
                ["Major", formData.intendedMajor],
              ]} />
              <ReviewSection title="Background" items={[
                ["Citizenship", formData.citizenship],
                ["First-Gen", formData.isFirstGen ? "Yes" : "No"],
                ["Pell Eligible", formData.isPellEligible ? "Yes" : "No"],
              ]} />
              <ReviewSection title="Goals" items={[
                ["Journey Stage", formData.journeyStage.replace(/_/g, " ")],
                ["Pathway", formData.postSecondaryPath.replace(/_/g, " ")],
              ]} />
            </div>
          </StepSection>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-100">
          {currentStep > 1 ? (
            <button
              onClick={prev}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>
          ) : (
            <div />
          )}

          {currentStep < 7 ? (
            <button
              onClick={next}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#1E3A5F] text-white font-medium hover:bg-[#162d4a] transition-colors"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-8 py-2.5 rounded-lg bg-[#2563EB] text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Complete Profile
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1A1A1A] mb-1">{title}</h2>
      <p className="text-gray-500 mb-8">{description}</p>
      {children}
    </div>
  );
}

function FormField({ label, value, onChange, placeholder, type = "text", required, className }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean; className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-shadow"
      />
    </div>
  );
}

function TextareaField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-shadow resize-none"
      />
    </div>
  );
}

function CheckboxField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
        checked ? "bg-[#2563EB] border-[#2563EB]" : "border-gray-300 group-hover:border-gray-400"
      }`}>
        {checked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
      </div>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

function ReviewSection({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h3 className="font-semibold text-[#1A1A1A] mb-3">{title}</h3>
      <div className="grid grid-cols-2 gap-3">
        {items.filter(([, v]) => v).map(([label, value]) => (
          <div key={label}>
            <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
            <p className="text-sm text-[#1A1A1A] font-medium">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
