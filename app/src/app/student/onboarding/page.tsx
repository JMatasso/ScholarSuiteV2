"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  GraduationCap,
  User,
  BookOpen,
  Users,
  DollarSign,
  Activity,
  Target,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  School,
  Briefcase,
  Shield,
  Compass,
  Search,
  CheckSquare,
  PenTool,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { WelcomeTour } from "@/components/ui/welcome-tour";

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

const tourSlides = [
  { icon: <GraduationCap className="size-10" />, title: "Welcome to ScholarSuite", description: "Your personal scholarship and college prep assistant. Let's get you set up for success." },
  { icon: <Search className="size-10" />, title: "Discover Scholarships", description: "Find scholarships matched to your profile. Track applications and never miss a deadline." },
  { icon: <CheckSquare className="size-10" />, title: "Stay on Track", description: "Personalized tasks and milestones keep your college prep journey organized and on schedule." },
  { icon: <PenTool className="size-10" />, title: "Write Better Essays", description: "Draft, get feedback, and manage all your application essays in one place." },
  { icon: <MessageSquare className="size-10" />, title: "Stay Connected", description: "Message your counselors, join meetings, and keep your parents in the loop." },
  { icon: <Sparkles className="size-10" />, title: "Let's Set Up Your Profile", description: "We'll walk you through a few quick steps. You can always come back to finish later." },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

export default function OnboardingPage() {
  const [showTour, setShowTour] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
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
    tourComplete: false,
  });

  const update = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const goToStep = (step: number) => {
    if (step < currentStep) {
      setDirection(-1);
      setCurrentStep(step);
    }
  };

  const next = () => {
    setDirection(1);
    setCurrentStep((s) => Math.min(s + 1, 7));
  };

  const prev = () => {
    setDirection(-1);
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/students/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, tourComplete: true }),
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

  const handleSavePartial = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/students/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, tourComplete: true }),
      });
      if (res.ok) {
        toast.success("Progress saved! You can finish anytime.");
        window.location.href = "/student";
      } else {
        toast.error("Something went wrong.");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceedStep1 = formData.firstName.trim() !== "" && formData.lastName.trim() !== "";

  const stepInfo = STEPS[currentStep - 1];
  const progressPercent = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Welcome Tour Overlay */}
      <AnimatePresence>
        {showTour && (
          <WelcomeTour
            slides={tourSlides}
            onComplete={() => setShowTour(false)}
            onSkip={() => setShowTour(false)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">ScholarSuite</span>
          </Link>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="bg-card border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <div className="relative flex items-center justify-between">
            {/* Background track */}
            <div className="absolute left-0 right-0 top-[9px] h-[3px] bg-muted rounded-full" />
            {/* Filled progress bar */}
            <motion.div
              className="absolute left-0 top-[9px] h-[3px] bg-primary rounded-full"
              initial={false}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            />

            {STEPS.map((step) => {
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              const isFuture = currentStep < step.id;

              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center">
                  <button
                    onClick={() => goToStep(step.id)}
                    disabled={isFuture}
                    className={cn(
                      "w-[18px] h-[18px] rounded-full border-2 transition-all duration-300 flex items-center justify-center",
                      isCompleted && "bg-primary border-primary cursor-pointer",
                      isCurrent && "bg-primary border-primary scale-125 shadow-md shadow-primary/30",
                      isFuture && "bg-muted border-muted-foreground/20 cursor-not-allowed"
                    )}
                  >
                    {isCompleted && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Check className="w-2.5 h-2.5 text-primary-foreground" />
                      </motion.div>
                    )}
                    {isCurrent && (
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-primary-foreground"
                        layoutId="activeDot"
                        transition={{ duration: 0.3 }}
                      />
                    )}
                  </button>
                  <span
                    className={cn(
                      "text-[11px] mt-2 font-medium transition-colors duration-300 hidden sm:block",
                      isCompleted && "text-primary",
                      isCurrent && "text-primary",
                      isFuture && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-2xl mx-auto px-6 py-10">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: "easeInOut" }}
          >
            {currentStep === 1 && (
              <StepCard
                title="Personal Information"
                description="Tell us a bit about yourself"
                onPrev={null}
                onNext={canProceedStep1 ? next : undefined}
                nextDisabled={!canProceedStep1}
                step={currentStep}
              >
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
              </StepCard>
            )}

            {currentStep === 2 && (
              <StepCard
                title="Academic Information"
                description="Your school and academic details"
                onPrev={prev}
                onNext={next}
                onSkip={next}
                step={currentStep}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField label="High School" value={formData.highSchool} onChange={(v) => update("highSchool", v)} placeholder="Lincoln High School" className="col-span-full" />
                  <FormField label="Grade Level" value={formData.gradeLevel} onChange={(v) => update("gradeLevel", v)} placeholder="12" type="number" />
                  <FormField label="Graduation Year" value={formData.graduationYear} onChange={(v) => update("graduationYear", v)} placeholder="2026" type="number" />
                  <FormField label="GPA (Unweighted)" value={formData.gpa} onChange={(v) => update("gpa", v)} placeholder="3.70" />
                  <FormField label="SAT Score" value={formData.satScore} onChange={(v) => update("satScore", v)} placeholder="1380" />
                  <FormField label="ACT Score" value={formData.actScore} onChange={(v) => update("actScore", v)} placeholder="31" />
                  <FormField label="Intended Major" value={formData.intendedMajor} onChange={(v) => update("intendedMajor", v)} placeholder="Computer Science" className="col-span-full" />
                </div>
              </StepCard>
            )}

            {currentStep === 3 && (
              <StepCard
                title="Background & Demographics"
                description="This information helps match you with scholarships"
                onPrev={prev}
                onNext={next}
                onSkip={next}
                step={currentStep}
              >
                <div className="space-y-5">
                  <FormField label="Ethnicity" value={formData.ethnicity} onChange={(v) => update("ethnicity", v)} placeholder="e.g., Hispanic, African American, Asian" />
                  <FormField label="Citizenship Status" value={formData.citizenship} onChange={(v) => update("citizenship", v)} placeholder="US Citizen" />
                  <div className="space-y-3 pt-2">
                    <CheckboxField label="I am a first-generation college student" checked={formData.isFirstGen} onChange={(v) => update("isFirstGen", v)} />
                    <CheckboxField label="I am Pell Grant eligible" checked={formData.isPellEligible} onChange={(v) => update("isPellEligible", v)} />
                    <CheckboxField label="I demonstrate financial need" checked={formData.hasFinancialNeed} onChange={(v) => update("hasFinancialNeed", v)} />
                  </div>
                </div>
              </StepCard>
            )}

            {currentStep === 4 && (
              <StepCard
                title="Financial Situation"
                description="Help us understand your financial planning needs"
                onPrev={prev}
                onNext={next}
                onSkip={next}
                step={currentStep}
              >
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">Post-secondary pathway</label>
                    <div className="grid grid-cols-2 gap-3">
                      {PATH_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => update("postSecondaryPath", opt.value)}
                          className={cn(
                            "p-4 rounded-xl border-2 text-left transition-all duration-300 flex items-center gap-3",
                            formData.postSecondaryPath === opt.value
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-muted-foreground/30"
                          )}
                        >
                          <opt.icon className={cn("w-5 h-5", formData.postSecondaryPath === opt.value ? "text-primary" : "text-muted-foreground")} />
                          <span className={cn("font-medium", formData.postSecondaryPath === opt.value ? "text-primary" : "text-foreground")}>
                            {opt.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </StepCard>
            )}

            {currentStep === 5 && (
              <StepCard
                title="Activities & Interests"
                description="Tell us about your extracurricular involvement"
                onPrev={prev}
                onNext={next}
                onSkip={next}
                step={currentStep}
              >
                <div className="space-y-5">
                  <TextareaField label="Activities & Clubs" value={formData.activities} onChange={(v) => update("activities", v)} placeholder="e.g., Debate Team captain, Robotics Club member, Varsity Soccer..." />
                  <TextareaField label="Community Service" value={formData.communityService} onChange={(v) => update("communityService", v)} placeholder="e.g., Local food bank volunteer (120 hours), Hospital volunteer..." />
                  <TextareaField label="Leadership Roles" value={formData.leadershipRoles} onChange={(v) => update("leadershipRoles", v)} placeholder="e.g., Student Body Vice President, Debate Team Captain..." />
                  <TextareaField label="Awards & Achievements" value={formData.awards} onChange={(v) => update("awards", v)} placeholder="e.g., National Merit Semifinalist, AP Scholar with Distinction..." />
                </div>
              </StepCard>
            )}

            {currentStep === 6 && (
              <StepCard
                title="Goals & Preferences"
                description="What are you working toward?"
                onPrev={prev}
                onNext={next}
                onSkip={next}
                step={currentStep}
              >
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">Where are you in your journey?</label>
                    <div className="space-y-3">
                      {JOURNEY_STAGES.map((stage) => (
                        <button
                          key={stage.value}
                          onClick={() => update("journeyStage", stage.value)}
                          className={cn(
                            "w-full p-4 rounded-xl border-2 text-left transition-all duration-300 flex items-start gap-4",
                            formData.journeyStage === stage.value
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-muted-foreground/30"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-300",
                            formData.journeyStage === stage.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          )}>
                            <stage.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className={cn("font-medium", formData.journeyStage === stage.value ? "text-primary" : "text-foreground")}>
                              {stage.label}
                            </p>
                            <p className="text-sm text-muted-foreground mt-0.5">{stage.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <TextareaField label="Dream Schools" value={formData.dreamSchools} onChange={(v) => update("dreamSchools", v)} placeholder="e.g., Stanford University, UC Berkeley, MIT..." />
                  <TextareaField label="Personal Goals" value={formData.goals} onChange={(v) => update("goals", v)} placeholder="What do you hope to achieve through scholarships and your education?" />
                </div>
              </StepCard>
            )}

            {currentStep === 7 && (
              <StepCard
                title="Review Your Profile"
                description="Make sure everything looks good before submitting"
                onPrev={prev}
                onSubmit={handleSubmit}
                onSavePartial={handleSavePartial}
                isSubmitting={isSubmitting}
                step={currentStep}
              >
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
              </StepCard>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Step counter */}
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Step {currentStep} of 7: {stepInfo.label}
          </p>
        </div>
      </div>
    </div>
  );
}

/* --- Sub-components ------------------------------------------------- */

function StepCard({
  title,
  description,
  children,
  onPrev,
  onNext,
  onSkip,
  onSubmit,
  onSavePartial,
  isSubmitting,
  nextDisabled,
  step,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  onPrev: (() => void) | null;
  onNext?: () => void;
  onSkip?: () => void;
  onSubmit?: () => void;
  onSavePartial?: () => void;
  isSubmitting?: boolean;
  nextDisabled?: boolean;
  step: number;
}) {
  return (
    <Card className="rounded-3xl shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
      <CardFooter className="flex items-center justify-between gap-4">
        {onPrev ? (
          <Button
            variant="outline"
            onClick={onPrev}
            className="rounded-2xl gap-1.5"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2">
          {onSkip && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="text-muted-foreground"
            >
              Skip for now
            </Button>
          )}

          {onNext && (
            <Button
              onClick={onNext}
              disabled={nextDisabled}
              className="rounded-2xl gap-1.5 bg-[#2563EB] hover:bg-[#2563EB]/90"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}

          {onSubmit && (
            <div className="flex items-center gap-2">
              {onSavePartial && (
                <Button
                  variant="outline"
                  onClick={onSavePartial}
                  disabled={isSubmitting}
                  className="rounded-2xl gap-1.5"
                >
                  Save & Finish Later
                </Button>
              )}
              <Button
                onClick={onSubmit}
                disabled={isSubmitting}
                className="rounded-2xl gap-1.5 bg-[#2563EB] hover:bg-[#2563EB]/90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Complete Profile
                    <Check className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-foreground mb-1.5">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
      />
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
      />
    </div>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div
        className={cn(
          "w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-300",
          checked
            ? "bg-primary border-primary"
            : "border-muted-foreground/30 group-hover:border-muted-foreground/50"
        )}
      >
        {checked && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span className="text-sm text-foreground">{label}</span>
    </label>
  );
}

function ReviewSection({
  title,
  items,
}: {
  title: string;
  items: [string, string][];
}) {
  return (
    <div className="bg-muted/50 rounded-xl border border-border p-5">
      <h3 className="font-semibold text-foreground mb-3">{title}</h3>
      <div className="grid grid-cols-2 gap-3">
        {items
          .filter(([, v]) => v)
          .map(([label, value]) => (
            <div key={label}>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
              <p className="text-sm text-foreground font-medium">{value}</p>
            </div>
          ))}
      </div>
    </div>
  );
}
