"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  Briefcase,
  Shield,
  Compass,
  Search,
  CheckSquare,
  PenTool,
  MessageSquare,
  Sparkles,
  Clock,
  MapPin,
  Bell,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getCountyFromZip } from "@/lib/county-lookup";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { WelcomeTour } from "@/components/ui/welcome-tour";
import { CollegeAutocomplete } from "@/components/ui/college-autocomplete";
import { MultiSelect } from "@/components/ui/multi-select";
import type { CollegeResult } from "@/components/ui/college-autocomplete";

const STEPS = [
  { id: 1, label: "Personal", icon: User },
  { id: 2, label: "Academic", icon: BookOpen },
  { id: 3, label: "Background", icon: Users },
  { id: 4, label: "Financial", icon: DollarSign },
  { id: 5, label: "College Journey", icon: MapPin },
  { id: 6, label: "Activities", icon: Activity },
  { id: 7, label: "Goals", icon: Target },
  { id: 8, label: "Notifications", icon: Bell },
  { id: 9, label: "Review", icon: CheckCircle2 },
];

const COLLEGE_JOURNEY_STAGES = [
  { value: "EXPLORING", label: "Exploring", description: "Just starting to explore college options", icon: Compass },
  { value: "BUILDING_LIST", label: "Building List", description: "Building my college list and researching schools", icon: Search },
  { value: "APPLYING", label: "Applying", description: "Actively applying to colleges", icon: Target },
  { value: "WAITING", label: "Waiting", description: "Applications submitted, waiting for decisions", icon: Clock },
  { value: "DECIDED", label: "Decided", description: "I've committed to a college", icon: CheckCircle2 },
];

const APPLICATION_ROUNDS = [
  { value: "EARLY_DECISION", label: "Early Decision" },
  { value: "EARLY_ACTION", label: "Early Action" },
  { value: "REGULAR_DECISION", label: "Regular Decision" },
  { value: "ROLLING", label: "Rolling Admission" },
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

interface SchoolResult {
  id: string;
  name: string;
  city: string;
  state: string;
  ncesId?: string;
}

export default function OnboardingPage() {
  const [showTour, setShowTour] = useState(false);
  const [tourChecked, setTourChecked] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Only show tour on first visit (tourComplete === false)
  useEffect(() => {
    fetch("/api/auth/onboarding-status")
      .then((r) => r.json())
      .then((data) => {
        if (!data.profile?.tourComplete) {
          setShowTour(true)
        }
        setTourChecked(true)
      })
      .catch(() => setTourChecked(true))
  }, [])

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    county: "",
    gpa: "",
    gpaType: "",
    gradeLevel: "",
    highSchool: "",
    schoolId: "",
    classRank: "",
    classSize: "",
    graduationYear: "",
    satScore: "",
    actScore: "",
    intendedMajor: "",
    major2: "",
    major3: "",
    gender: "",
    ethnicity: "",
    citizenship: "",
    militaryAffiliation: "",
    disabilityStatus: "",
    medicalConditions: "",
    parentsDivorced: false,
    isDependentStudent: true,
    householdIncome: "",
    financialSituation: "",
    parent1Education: "",
    parent1Profession: "",
    parent2Education: "",
    parent2Profession: "",
    isFirstGen: false,
    isPellEligible: false,
    hasFinancialNeed: false,
    notifyTaskReminders: true,
    notifyScholarshipDeadlines: true,
    notifyNewMessages: true,
    notifyMeetingReminders: true,
    notifyEssayFeedback: true,
    notifyLocalScholarships: true,
    journeyStage: "EARLY_EXPLORATION",
    postSecondaryPath: "COLLEGE",
    collegeJourneyStage: "",
    committedCollegeName: "",
    activities: "",
    communityService: "",
    leadershipRoles: "",
    awards: "",
    goals: "",
    dreamSchools: "",
    applicationRounds: [] as string[],
    tourComplete: false,
  });

  const isCollegePath = formData.postSecondaryPath === "COLLEGE";
  const totalSteps = 8;

  // Get visible steps (skip College Journey step for non-college paths)
  const visibleSteps = isCollegePath ? STEPS : STEPS.filter((s) => s.id !== 5);

  const update = (field: string, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Auto-detect county from ZIP code
  useEffect(() => {
    if (formData.zipCode?.length >= 5) {
      const county = getCountyFromZip(formData.zipCode);
      if (county) update("county", county);
    }
  }, [formData.zipCode]);

  // Map between display step index and actual step id
  const getActualStep = (displayIndex: number): number => {
    if (isCollegePath) return displayIndex;
    // For non-college paths, skip step 5
    if (displayIndex < 5) return displayIndex;
    return displayIndex + 1; // shift up by 1 to skip step 5
  };

  const getDisplayIndex = (actualStep: number): number => {
    if (isCollegePath) return actualStep;
    if (actualStep < 5) return actualStep;
    if (actualStep === 5) return 4; // shouldn't happen, but safety
    return actualStep - 1;
  };

  const goToStep = (stepId: number) => {
    // Only allow going to completed steps
    if (stepId < currentStep) {
      // For non-college paths, don't allow navigating to step 5
      if (!isCollegePath && stepId === 5) return;
      setDirection(-1);
      setCurrentStep(stepId);
    }
  };

  const next = () => {
    setDirection(1);
    if (!isCollegePath && currentStep === 4) {
      // Skip step 5 (College Journey) for non-college paths
      setCurrentStep(6);
    } else {
      setCurrentStep((s) => Math.min(s + 1, totalSteps));
    }
  };

  const prev = () => {
    setDirection(-1);
    if (!isCollegePath && currentStep === 6) {
      // Skip back over step 5 for non-college paths
      setCurrentStep(4);
    } else {
      setCurrentStep((s) => Math.max(s - 1, 1));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const submitData = {
        ...formData,
        tourComplete: true,
        collegeJourneyStage: isCollegePath ? formData.collegeJourneyStage : "NOT_COLLEGE",
      };
      const res = await fetch("/api/students/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });
      if (res.ok) {
        // Save notification preferences
        await fetch("/api/preferences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notifyTaskReminders: formData.notifyTaskReminders,
            notifyScholarshipDeadlines: formData.notifyScholarshipDeadlines,
            notifyNewMessages: formData.notifyNewMessages,
            notifyMeetingReminders: formData.notifyMeetingReminders,
            notifyEssayFeedback: formData.notifyEssayFeedback,
            notifyLocalScholarships: formData.notifyLocalScholarships,
          }),
        }).catch(() => {})
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
      const submitData = {
        ...formData,
        tourComplete: true,
        collegeJourneyStage: isCollegePath ? formData.collegeJourneyStage : "NOT_COLLEGE",
      };
      const res = await fetch("/api/students/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
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

  // Find the current step info based on actual step number
  const stepInfo = STEPS.find((s) => s.id === currentStep) || STEPS[0];
  const progressPercent = ((getDisplayIndex(currentStep) - 1) / (visibleSteps.length - 1)) * 100;

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

            {visibleSteps.map((step) => {
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
                  <CountyAutocomplete
                    value={formData.county}
                    state={formData.state}
                    onChange={(v) => update("county", v)}
                  />
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
                  <div className="col-span-full">
                    <SchoolAutocomplete
                      value={formData.highSchool}
                      state={formData.state}
                      onSelect={(school) => {
                        update("highSchool", school.name);
                        update("schoolId", school.id);
                      }}
                      onManualChange={(v) => {
                        update("highSchool", v);
                        update("schoolId", "");
                      }}
                    />
                  </div>
                  <FormField label="Grade Level" value={formData.gradeLevel} onChange={(v) => update("gradeLevel", v)} placeholder="12" type="number" />
                  <FormField label="Graduation Year" value={formData.graduationYear} onChange={(v) => update("graduationYear", v)} placeholder="2026" type="number" />
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">GPA</label>
                    <input
                      type="text"
                      value={formData.gpa}
                      onChange={(e) => update("gpa", e.target.value)}
                      placeholder="3.70"
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">GPA Type</label>
                    <Select value={formData.gpaType} onValueChange={(v) => v && update("gpaType", v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select GPA scale" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UNWEIGHTED_4">Unweighted (4.0 scale)</SelectItem>
                        <SelectItem value="WEIGHTED_5">Weighted (5.0 scale)</SelectItem>
                        <SelectItem value="WEIGHTED_4">Weighted (4.0 scale)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <FormField label="Class Rank" value={formData.classRank} onChange={(v) => update("classRank", v)} placeholder="15" type="number" />
                  <FormField label="Class Size" value={formData.classSize} onChange={(v) => update("classSize", v)} placeholder="350" type="number" />
                  {formData.classRank && formData.classSize && Number(formData.classSize) > 0 && (
                    <div className="col-span-full -mt-2">
                      <p className="text-xs text-muted-foreground">
                        Percentile: <span className="font-semibold text-[#1E3A5F]">Top {Math.round((Number(formData.classRank) / Number(formData.classSize)) * 100)}%</span>
                      </p>
                    </div>
                  )}
                  <FormField label="SAT Score" value={formData.satScore} onChange={(v) => update("satScore", v)} placeholder="1380" />
                  <FormField label="ACT Score" value={formData.actScore} onChange={(v) => update("actScore", v)} placeholder="31" />
                  <FormField label="1st Choice Major" value={formData.intendedMajor} onChange={(v) => update("intendedMajor", v)} placeholder="Computer Science" />
                  <FormField label="2nd Choice Major" value={formData.major2} onChange={(v) => update("major2", v)} placeholder="Data Science (optional)" />
                  <FormField label="3rd Choice Major" value={formData.major3} onChange={(v) => update("major3", v)} placeholder="Mathematics (optional)" />
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
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Gender</label>
                    <Select value={formData.gender} onValueChange={(v) => v && update("gender", v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Non-binary">Non-binary</SelectItem>
                        <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Ethnicity / Race (select all that apply)</label>
                    <MultiSelect
                      options={[
                        { id: "White", label: "White" },
                        { id: "Black / African American", label: "Black / African American" },
                        { id: "Hispanic / Latino", label: "Hispanic / Latino" },
                        { id: "Asian", label: "Asian" },
                        { id: "Native American / Alaska Native", label: "Native American / Alaska Native" },
                        { id: "Native Hawaiian / Pacific Islander", label: "Native Hawaiian / Pacific Islander" },
                        { id: "Middle Eastern / North African", label: "Middle Eastern / North African" },
                        { id: "Two or More Races", label: "Two or More Races" },
                        { id: "Other", label: "Other" },
                        { id: "Prefer not to say", label: "Prefer not to say" },
                      ]}
                      selectedIds={(formData.ethnicity || "").split(", ").filter(Boolean)}
                      onChange={(ids) => update("ethnicity", ids.join(", "))}
                      placeholder="Select ethnicity..."
                      searchPlaceholder="Search ethnicities..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Citizenship (select all that apply for dual citizens)</label>
                    <MultiSelect
                      options={[
                        { id: "US Citizen", label: "US Citizen" },
                        { id: "Permanent Resident", label: "Permanent Resident (Green Card)" },
                        { id: "DACA/Dreamer", label: "DACA / Dreamer" },
                        { id: "International Student", label: "International Student (Visa)" },
                        { id: "Refugee/Asylee", label: "Refugee / Asylee" },
                        { id: "Undocumented", label: "Undocumented" },
                        { id: "Dual Citizen", label: "Dual Citizen" },
                        { id: "Other", label: "Other" },
                      ]}
                      selectedIds={(formData.citizenship || "").split(", ").filter(Boolean)}
                      onChange={(ids) => update("citizenship", ids.join(", "))}
                      placeholder="Select citizenship status..."
                      searchPlaceholder="Search..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Military Affiliation</label>
                    <Select value={formData.militaryAffiliation} onValueChange={(v) => v && update("militaryAffiliation", v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select military affiliation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="None">None</SelectItem>
                        <SelectItem value="Active Duty">Active Duty</SelectItem>
                        <SelectItem value="Veteran">Veteran</SelectItem>
                        <SelectItem value="Military Dependent">Military Dependent</SelectItem>
                        <SelectItem value="National Guard/Reserve">National Guard/Reserve</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Disability Status</label>
                    <Select value={formData.disabilityStatus} onValueChange={(v) => v && update("disabilityStatus", v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select disability status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="No">No</SelectItem>
                        <SelectItem value="Yes — physical">Yes -- physical</SelectItem>
                        <SelectItem value="Yes — learning">Yes -- learning</SelectItem>
                        <SelectItem value="Yes — other">Yes -- other</SelectItem>
                        <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Medical Conditions (select all that apply, optional)</label>
                    <MultiSelect
                      options={[
                        { id: "Asthma", label: "Asthma" },
                        { id: "Diabetes", label: "Diabetes" },
                        { id: "Cancer (self or family)", label: "Cancer (self or family)" },
                        { id: "Heart Disease", label: "Heart Disease" },
                        { id: "Sickle Cell Disease", label: "Sickle Cell Disease" },
                        { id: "Epilepsy/Seizure Disorder", label: "Epilepsy / Seizure Disorder" },
                        { id: "Mental Health (anxiety, depression, etc.)", label: "Mental Health (anxiety, depression, etc.)" },
                        { id: "Autoimmune Disorder", label: "Autoimmune Disorder" },
                        { id: "Chronic Pain", label: "Chronic Pain" },
                        { id: "Visual Impairment", label: "Visual Impairment" },
                        { id: "Hearing Impairment", label: "Hearing Impairment" },
                        { id: "Autism Spectrum", label: "Autism Spectrum" },
                        { id: "ADHD/ADD", label: "ADHD / ADD" },
                        { id: "Dyslexia/Learning Disability", label: "Dyslexia / Learning Disability" },
                        { id: "Kidney Disease", label: "Kidney Disease" },
                        { id: "Other", label: "Other" },
                      ]}
                      selectedIds={(formData.medicalConditions || "").split(", ").filter(Boolean)}
                      onChange={(ids) => update("medicalConditions", ids.join(", "))}
                      placeholder="Select conditions..."
                      searchPlaceholder="Search conditions..."
                    />
                  </div>
                  <div className="border-t border-border pt-4 mt-2">
                    <h4 className="text-sm font-semibold text-[#1E3A5F] mb-3">Financial & Family Situation</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Household Income Range</label>
                        <Select value={formData.householdIncome} onValueChange={(v) => v && update("householdIncome", v)}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select income range" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Under $30,000">Under $30,000</SelectItem>
                            <SelectItem value="$30,000 - $48,000">$30,000 - $48,000</SelectItem>
                            <SelectItem value="$48,000 - $75,000">$48,000 - $75,000</SelectItem>
                            <SelectItem value="$75,000 - $110,000">$75,000 - $110,000</SelectItem>
                            <SelectItem value="$110,000 - $150,000">$110,000 - $150,000</SelectItem>
                            <SelectItem value="Over $150,000">Over $150,000</SelectItem>
                            <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-3">
                        <CheckboxField label="I am a first-generation college student (neither parent has a bachelor's degree)" checked={formData.isFirstGen} onChange={(v) => update("isFirstGen", v)} />
                        <CheckboxField label="I demonstrate financial need" checked={formData.hasFinancialNeed} onChange={(v) => update("hasFinancialNeed", v)} />
                        <CheckboxField label="I am a dependent student (claimed on parent's/guardian's taxes)" checked={formData.isDependentStudent} onChange={(v) => update("isDependentStudent", v)} />
                        <CheckboxField label="My parents are divorced or separated" checked={formData.parentsDivorced} onChange={(v) => update("parentsDivorced", v)} />
                      </div>

                      {/* Auto-Pell notice */}
                      {formData.householdIncome && ["Under $30,000", "$30,000 - $48,000", "$48,000 - $75,000"].includes(formData.householdIncome) && (
                        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-700">
                          Based on your household income, you likely qualify for the <span className="font-semibold">Pell Grant</span>. We&apos;ll flag this on your profile automatically.
                        </div>
                      )}

                      {/* Parent education (shows if NOT first-gen) */}
                      {!formData.isFirstGen && (
                        <div className="space-y-4 pt-2">
                          <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Parent / Guardian Education & Profession</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1.5">Parent 1 Education</label>
                              <Select value={formData.parent1Education} onValueChange={(v) => v && update("parent1Education", v)}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Select education level" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Some High School">Some High School</SelectItem>
                                  <SelectItem value="High School Diploma/GED">High School Diploma / GED</SelectItem>
                                  <SelectItem value="Some College">Some College</SelectItem>
                                  <SelectItem value="Associate's Degree">Associate&apos;s Degree</SelectItem>
                                  <SelectItem value="Bachelor's Degree">Bachelor&apos;s Degree</SelectItem>
                                  <SelectItem value="Master's Degree">Master&apos;s Degree</SelectItem>
                                  <SelectItem value="Doctorate/Professional">Doctorate / Professional Degree</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <FormField label="Parent 1 Profession" value={formData.parent1Profession} onChange={(v) => update("parent1Profession", v)} placeholder="e.g., Teacher, Nurse, Engineer" />
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1.5">Parent 2 Education</label>
                              <Select value={formData.parent2Education} onValueChange={(v) => v && update("parent2Education", v)}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Select education level" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="N/A">N/A</SelectItem>
                                  <SelectItem value="Some High School">Some High School</SelectItem>
                                  <SelectItem value="High School Diploma/GED">High School Diploma / GED</SelectItem>
                                  <SelectItem value="Some College">Some College</SelectItem>
                                  <SelectItem value="Associate's Degree">Associate&apos;s Degree</SelectItem>
                                  <SelectItem value="Bachelor's Degree">Bachelor&apos;s Degree</SelectItem>
                                  <SelectItem value="Master's Degree">Master&apos;s Degree</SelectItem>
                                  <SelectItem value="Doctorate/Professional">Doctorate / Professional Degree</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <FormField label="Parent 2 Profession" value={formData.parent2Profession} onChange={(v) => update("parent2Profession", v)} placeholder="e.g., Electrician, Accountant" />
                          </div>
                        </div>
                      )}
                      <TextareaField
                        label="Financial Situation (optional)"
                        value={formData.financialSituation}
                        onChange={(v) => update("financialSituation", v)}
                        placeholder="Describe any relevant financial circumstances (e.g., single-income household, supporting siblings, medical expenses, job loss, etc.)"
                      />
                    </div>
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

            {currentStep === 5 && isCollegePath && (
              <StepCard
                title="College Journey"
                description="Where are you in your college journey?"
                onPrev={prev}
                onNext={next}
                onSkip={next}
                step={currentStep}
              >
                <div className="space-y-6">
                  <div className="space-y-3">
                    {COLLEGE_JOURNEY_STAGES.map((stage) => (
                      <button
                        key={stage.value}
                        onClick={() => update("collegeJourneyStage", stage.value)}
                        className={cn(
                          "w-full p-4 rounded-xl border-2 text-left transition-all duration-300 flex items-start gap-4",
                          formData.collegeJourneyStage === stage.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-muted-foreground/30"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-300",
                          formData.collegeJourneyStage === stage.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}>
                          <stage.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className={cn("font-medium", formData.collegeJourneyStage === stage.value ? "text-primary" : "text-foreground")}>
                            {stage.label}
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5">{stage.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Conditional fields based on college journey stage */}
                  {formData.collegeJourneyStage === "EXPLORING" && (
                    <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4">
                      <p className="text-sm text-emerald-700">
                        Great! We will help you explore your options. You can update this as your journey progresses.
                      </p>
                    </div>
                  )}

                  {formData.collegeJourneyStage === "BUILDING_LIST" && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Schools you&apos;re interested in</label>
                      <CollegeAutocomplete
                        onSelect={(college) => {
                          if (college.name) {
                            const current = formData.dreamSchools ? formData.dreamSchools.split(", ").filter(Boolean) : [];
                            if (!current.includes(college.name)) {
                              update("dreamSchools", [...current, college.name].join(", "));
                            }
                          }
                        }}
                        placeholder="Search and add colleges..."
                      />
                      {formData.dreamSchools && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.dreamSchools.split(", ").filter(Boolean).map((school) => (
                            <span key={school} className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 px-2.5 py-1 text-xs font-medium">
                              {school}
                              <button type="button" onClick={() => {
                                const updated = formData.dreamSchools.split(", ").filter((s) => s !== school).join(", ");
                                update("dreamSchools", updated);
                              }} className="hover:text-blue-900">×</button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {formData.collegeJourneyStage === "APPLYING" && (
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Schools you&apos;re applying to</label>
                        <CollegeAutocomplete
                          onSelect={(college) => {
                            if (college.name) {
                              const current = formData.dreamSchools ? formData.dreamSchools.split(", ").filter(Boolean) : [];
                              if (!current.includes(college.name)) {
                                update("dreamSchools", [...current, college.name].join(", "));
                              }
                            }
                          }}
                          placeholder="Search and add colleges..."
                        />
                        {formData.dreamSchools && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {formData.dreamSchools.split(", ").filter(Boolean).map((school) => (
                              <span key={school} className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 px-2.5 py-1 text-xs font-medium">
                                {school}
                                <button type="button" onClick={() => {
                                  const updated = formData.dreamSchools.split(", ").filter((s) => s !== school).join(", ");
                                  update("dreamSchools", updated);
                                }} className="hover:text-blue-900">×</button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-3">Which application rounds?</label>
                        <div className="grid grid-cols-2 gap-3">
                          {APPLICATION_ROUNDS.map((round) => {
                            const isSelected = formData.applicationRounds.includes(round.value);
                            return (
                              <button
                                key={round.value}
                                onClick={() => {
                                  const newRounds = isSelected
                                    ? formData.applicationRounds.filter((r) => r !== round.value)
                                    : [...formData.applicationRounds, round.value];
                                  update("applicationRounds", newRounds);
                                }}
                                className={cn(
                                  "p-3 rounded-xl border-2 text-left transition-all duration-300 flex items-center gap-3",
                                  isSelected
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-muted-foreground/30"
                                )}
                              >
                                <div className={cn(
                                  "w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-300",
                                  isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
                                )}>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                                </div>
                                <span className={cn("text-sm font-medium", isSelected ? "text-primary" : "text-foreground")}>
                                  {round.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.collegeJourneyStage === "WAITING" && (
                    <TextareaField
                      label="Schools you've applied to"
                      value={formData.dreamSchools}
                      onChange={(v) => update("dreamSchools", v)}
                      placeholder="e.g., Stanford University, UC Berkeley, MIT..."
                    />
                  )}

                  {formData.collegeJourneyStage === "DECIDED" && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-foreground">Which college are you attending?</label>
                      <CollegeAutocomplete
                        value={formData.committedCollegeName || undefined}
                        onSelect={(college: CollegeResult) => {
                          update("committedCollegeName", college.name);
                        }}
                        placeholder="Search for your college..."
                      />
                    </div>
                  )}
                </div>
              </StepCard>
            )}

            {currentStep === 6 && (
              <StepCard
                title="Activities & Interests"
                description="Tell us about your extracurricular involvement"
                onPrev={prev}
                onNext={next}
                onSkip={next}
                step={currentStep}
              >
                <div className="space-y-5">
                  <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-700">
                    <span className="font-semibold">Tip:</span> You can add detailed information for each activity later in your <span className="font-semibold">Activity Brag Sheet</span>. Just give us a quick overview here.
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Activities & Clubs</label>
                    <MultiSelect
                      options={[
                        { id: "Debate/Speech", label: "Debate / Speech" },
                        { id: "Robotics Club", label: "Robotics Club" },
                        { id: "Student Government", label: "Student Government" },
                        { id: "National Honor Society", label: "National Honor Society" },
                        { id: "Key Club", label: "Key Club" },
                        { id: "DECA", label: "DECA" },
                        { id: "FBLA", label: "FBLA" },
                        { id: "Model UN", label: "Model UN" },
                        { id: "Math Team", label: "Math Team" },
                        { id: "Science Olympiad", label: "Science Olympiad" },
                        { id: "Band/Orchestra", label: "Band / Orchestra" },
                        { id: "Choir", label: "Choir" },
                        { id: "Drama/Theater", label: "Drama / Theater" },
                        { id: "Art Club", label: "Art Club" },
                        { id: "Yearbook", label: "Yearbook" },
                        { id: "School Newspaper", label: "School Newspaper" },
                        { id: "Varsity Sports", label: "Varsity Sports" },
                        { id: "JV Sports", label: "JV Sports" },
                        { id: "Church/Religious Group", label: "Church / Religious Group" },
                        { id: "Volunteer/Community Service", label: "Volunteer / Community Service" },
                        { id: "Part-Time Job", label: "Part-Time Job" },
                        { id: "Internship", label: "Internship" },
                        { id: "Tutoring", label: "Tutoring" },
                        { id: "BSU/Cultural Club", label: "BSU / Cultural Club" },
                        { id: "Environmental Club", label: "Environmental Club" },
                        { id: "Coding/CS Club", label: "Coding / CS Club" },
                      ]}
                      selectedIds={(formData.activities || "").split(", ").filter(Boolean)}
                      onChange={(ids) => update("activities", ids.join(", "))}
                      placeholder="Select or search activities..."
                      searchPlaceholder="Search activities or type your own..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Leadership Roles</label>
                    <MultiSelect
                      options={[
                        { id: "President", label: "President" },
                        { id: "Vice President", label: "Vice President" },
                        { id: "Secretary", label: "Secretary" },
                        { id: "Treasurer", label: "Treasurer" },
                        { id: "Team Captain", label: "Team Captain" },
                        { id: "Club Founder", label: "Club Founder" },
                        { id: "Editor-in-Chief", label: "Editor-in-Chief" },
                        { id: "Section Leader", label: "Section Leader" },
                        { id: "Peer Mentor", label: "Peer Mentor" },
                        { id: "Student Ambassador", label: "Student Ambassador" },
                        { id: "Class Representative", label: "Class Representative" },
                        { id: "Eagle Scout / Gold Award", label: "Eagle Scout / Gold Award" },
                      ]}
                      selectedIds={(formData.leadershipRoles || "").split(", ").filter(Boolean)}
                      onChange={(ids) => update("leadershipRoles", ids.join(", "))}
                      placeholder="Select leadership roles..."
                      searchPlaceholder="Search roles or type your own..."
                    />
                  </div>
                  <TextareaField label="Community Service" value={formData.communityService} onChange={(v) => update("communityService", v)} placeholder="e.g., Local food bank volunteer (120 hours), Hospital volunteer..." />
                  <TextareaField label="Awards & Achievements" value={formData.awards} onChange={(v) => update("awards", v)} placeholder="e.g., National Merit Semifinalist, AP Scholar with Distinction..." />
                </div>
              </StepCard>
            )}

            {currentStep === 7 && (
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
                    <label className="block text-sm font-medium text-foreground mb-3">Where are you in your scholarship journey?</label>
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

                  <TextareaField label="Personal Goals" value={formData.goals} onChange={(v) => update("goals", v)} placeholder="What do you hope to achieve through scholarships and your education?" />
                </div>
              </StepCard>
            )}

            {currentStep === 8 && (
              <StepCard
                title="Notification Preferences"
                description="Choose what you'd like to be notified about"
                onPrev={prev}
                onNext={next}
                onSkip={next}
                step={currentStep}
              >
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">You can change these anytime in Settings.</p>
                  <div className="space-y-3">
                    <CheckboxField label="Task reminders (upcoming deadlines)" checked={formData.notifyTaskReminders} onChange={(v) => update("notifyTaskReminders", v)} />
                    <CheckboxField label="Scholarship deadline alerts" checked={formData.notifyScholarshipDeadlines} onChange={(v) => update("notifyScholarshipDeadlines", v)} />
                    <CheckboxField label="New local scholarship matches in your county" checked={formData.notifyLocalScholarships} onChange={(v) => update("notifyLocalScholarships", v)} />
                    <CheckboxField label="New messages from your advisor" checked={formData.notifyNewMessages} onChange={(v) => update("notifyNewMessages", v)} />
                    <CheckboxField label="Meeting reminders" checked={formData.notifyMeetingReminders} onChange={(v) => update("notifyMeetingReminders", v)} />
                    <CheckboxField label="Essay feedback notifications" checked={formData.notifyEssayFeedback} onChange={(v) => update("notifyEssayFeedback", v)} />
                  </div>
                </div>
              </StepCard>
            )}

            {currentStep === 9 && (
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
                    ["Location", [formData.city, formData.state].filter(Boolean).join(", ")],
                    ["County", formData.county],
                    ["Phone", formData.phone],
                  ]} />
                  <ReviewSection title="Academic" items={[
                    ["School", formData.highSchool],
                    ["GPA", formData.gpa ? `${formData.gpa}${formData.gpaType ? ` (${formData.gpaType === "UNWEIGHTED_4" ? "Unweighted 4.0" : formData.gpaType === "WEIGHTED_5" ? "Weighted 5.0" : "Weighted 4.0"})` : ""}` : ""],
                    ["Class Rank", formData.classRank && formData.classSize ? `${formData.classRank} / ${formData.classSize} (Top ${Math.round((Number(formData.classRank) / Number(formData.classSize)) * 100)}%)` : formData.classRank],
                    ["Grade", formData.gradeLevel],
                    ["Graduation Year", formData.graduationYear],
                    ["SAT", formData.satScore],
                    ["ACT", formData.actScore],
                    ["1st Major", formData.intendedMajor],
                    ["2nd Major", formData.major2],
                    ["3rd Major", formData.major3],
                  ]} />
                  <ReviewSection title="Background" items={[
                    ["Gender", formData.gender],
                    ["Ethnicity", formData.ethnicity],
                    ["Citizenship", formData.citizenship],
                    ["Military Affiliation", formData.militaryAffiliation],
                    ["Disability Status", formData.disabilityStatus],
                    ["Medical Conditions", formData.medicalConditions],
                    ["First-Gen", formData.isFirstGen ? "Yes" : "No"],
                    ["Pell Eligible", formData.isPellEligible ? "Yes" : "No"],
                    ["Financial Need", formData.hasFinancialNeed ? "Yes" : "No"],
                  ]} />
                  {isCollegePath && formData.collegeJourneyStage && (
                    <ReviewSection title="College Journey" items={[
                      ["Stage", COLLEGE_JOURNEY_STAGES.find((s) => s.value === formData.collegeJourneyStage)?.label || formData.collegeJourneyStage.replace(/_/g, " ")],
                      ...(formData.committedCollegeName ? [["Committed College", formData.committedCollegeName] as [string, string]] : []),
                      ...(formData.dreamSchools ? [["Schools", formData.dreamSchools] as [string, string]] : []),
                    ]} />
                  )}
                  <ReviewSection title="Goals" items={[
                    ["Journey Stage", formData.journeyStage.replace(/_/g, " ")],
                    ["Pathway", formData.postSecondaryPath.replace(/_/g, " ")],
                    ["Goals", formData.goals],
                  ]} />
                </div>
              </StepCard>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Step counter */}
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Step {getDisplayIndex(currentStep)} of {visibleSteps.length}: {stepInfo.label}
          </p>
        </div>
      </div>
    </div>
  );
}

/* --- Sub-components ------------------------------------------------- */

function SchoolAutocomplete({
  value,
  state,
  onSelect,
  onManualChange,
}: {
  value: string;
  state: string;
  onSelect: (school: SchoolResult) => void;
  onManualChange: (v: string) => void;
}) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<SchoolResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchSchools = useCallback(
    (q: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (q.length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }
      debounceRef.current = setTimeout(async () => {
        setIsLoading(true);
        try {
          const params = new URLSearchParams({ q });
          if (state) params.set("state", state);
          const res = await fetch(`/api/schools/search?${params}`);
          if (res.ok) {
            const data = await res.json();
            setResults(data);
            setIsOpen(data.length > 0);
          }
        } catch {
          // silently fail — user can still type manually
        } finally {
          setIsLoading(false);
        }
      }, 300);
    },
    [state]
  );

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-foreground mb-1.5">High School</label>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            const v = e.target.value;
            setQuery(v);
            onManualChange(v);
            searchSchools(v);
          }}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder="Start typing your school name..."
          className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-lg max-h-60 overflow-y-auto">
          {results.map((school) => (
            <button
              key={school.id}
              type="button"
              onClick={() => {
                setQuery(school.name);
                onSelect(school);
                setIsOpen(false);
              }}
              className="w-full px-4 py-2.5 text-left hover:bg-muted/50 transition-colors flex flex-col"
            >
              <span className="text-sm font-medium text-foreground">{school.name}</span>
              <span className="text-xs text-muted-foreground">{school.city}, {school.state}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CountyAutocomplete({
  value,
  state,
  onChange,
}: {
  value: string;
  state: string;
  onChange: (v: string) => void;
}) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<{ county: string; state: string }[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setResults([]); setIsOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q });
        if (state) params.set("state", state);
        const res = await fetch(`/api/counties?${params}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setIsOpen(data.length > 0);
        }
      } catch {}
    }, 200);
  }, [state]);

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-foreground mb-1.5">County</label>
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); search(e.target.value); }}
        onFocus={() => { if (results.length > 0) setIsOpen(true); }}
        placeholder="Start typing your county..."
        className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
      />
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-lg max-h-48 overflow-y-auto">
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { setQuery(r.county); onChange(r.county); setIsOpen(false); }}
              className="w-full px-4 py-2.5 text-left hover:bg-muted/50 transition-colors"
            >
              <span className="text-sm font-medium text-foreground">{r.county}</span>
              <span className="text-xs text-muted-foreground ml-2">{r.state}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
  readOnly,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  className?: string;
  readOnly?: boolean;
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
        readOnly={readOnly}
        className={cn(
          "w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary",
          readOnly && "bg-muted/50 cursor-not-allowed"
        )}
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
