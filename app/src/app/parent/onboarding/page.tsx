"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  GraduationCap,
  User,
  Users,
  Bell,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Phone,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Contact" },
  { id: 2, label: "Students" },
  { id: 3, label: "Notifications" },
  { id: 4, label: "Review" },
];

const RELATIONSHIP_OPTIONS = ["Mother", "Father", "Guardian", "Other"];

interface LinkedStudent {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
}

export default function ParentOnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkedStudents, setLinkedStudents] = useState<LinkedStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    relationship: "",
    notifyTasks: true,
    notifyDeadlines: true,
    notifyAwards: true,
    notifyMessages: true,
  });

  useEffect(() => {
    fetch("/api/parents/students")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setLinkedStudents(data);
      })
      .catch(() => {})
      .finally(() => setStudentsLoading(false));
  }, []);

  const update = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const next = () => setCurrentStep((s) => Math.min(s + 1, 4));
  const prev = () => setCurrentStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/parents/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast.success("Profile completed! Welcome to ScholarSuite.");
        window.location.href = "/parent";
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-[#1E3A5F] rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-foreground">ScholarSuite</span>
          </Link>
        </div>

        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((step) => (
            <button
              key={step.id}
              onClick={() => {
                if (step.id < currentStep) setCurrentStep(step.id);
              }}
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-all duration-300",
                currentStep === step.id
                  ? "bg-[#2563EB] w-8"
                  : currentStep > step.id
                  ? "bg-emerald-500"
                  : "bg-muted-foreground/25"
              )}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="rounded-3xl border-0 shadow-lg">
              {/* Step 1: Contact Info */}
              {currentStep === 1 && (
                <>
                  <CardHeader className="text-center pb-2">
                    <div className="w-12 h-12 bg-[#2563EB]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <User className="w-6 h-6 text-[#2563EB]" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">Welcome to ScholarSuite</h2>
                    <p className="text-sm text-muted-foreground">Let&apos;s set up your parent account</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          First Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => update("firstName", e.target.value)}
                          placeholder="Jane"
                          className="w-full px-3 py-2.5 rounded-lg border border-foreground/10 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-shadow"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          Last Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => update("lastName", e.target.value)}
                          placeholder="Johnson"
                          className="w-full px-3 py-2.5 rounded-lg border border-foreground/10 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-shadow"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Phone</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => update("phone", e.target.value)}
                        placeholder="(555) 123-4567"
                        className="w-full px-3 py-2.5 rounded-lg border border-foreground/10 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-shadow"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Relationship <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={formData.relationship}
                        onChange={(e) => update("relationship", e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg border border-foreground/10 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-shadow"
                      >
                        <option value="">Select relationship</option>
                        {RELATIONSHIP_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </CardContent>
                </>
              )}

              {/* Step 2: Linked Students */}
              {currentStep === 2 && (
                <>
                  <CardHeader className="text-center pb-2">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">Your Linked Students</h2>
                    <p className="text-sm text-muted-foreground">
                      These students have been linked to your account
                    </p>
                  </CardHeader>
                  <CardContent>
                    {studentsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : linkedStudents.length > 0 ? (
                      <div className="space-y-3">
                        {linkedStudents.map((student) => (
                          <div
                            key={student.id}
                            className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-foreground/5"
                          >
                            <div className="w-10 h-10 rounded-full bg-[#2563EB]/10 flex items-center justify-center shrink-0">
                              <User className="w-5 h-5 text-[#2563EB]" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {student.name || "Unnamed Student"}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {student.email}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                          <Users className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                          No students have been linked to your account yet. Your administrator will
                          link student accounts to your profile.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </>
              )}

              {/* Step 3: Notification Preferences */}
              {currentStep === 3 && (
                <>
                  <CardHeader className="text-center pb-2">
                    <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Bell className="w-6 h-6 text-amber-600" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">Notification Preferences</h2>
                    <p className="text-sm text-muted-foreground">
                      Choose what updates you&apos;d like to receive
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      {
                        field: "notifyTasks",
                        label: "Task Updates",
                        description: "When your student's tasks are created or completed",
                      },
                      {
                        field: "notifyDeadlines",
                        label: "Deadline Reminders",
                        description: "Upcoming scholarship and application deadlines",
                      },
                      {
                        field: "notifyAwards",
                        label: "Award Notifications",
                        description: "When scholarships are awarded or status changes",
                      },
                      {
                        field: "notifyMessages",
                        label: "New Messages",
                        description: "When you receive messages from counselors or students",
                      },
                    ].map((item) => (
                      <label
                        key={item.field}
                        className="flex items-start gap-3 p-3 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <div className="pt-0.5">
                          <div
                            className={cn(
                              "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                              formData[item.field as keyof typeof formData]
                                ? "bg-[#2563EB] border-[#2563EB]"
                                : "border-foreground/20"
                            )}
                          >
                            {formData[item.field as keyof typeof formData] && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            )}
                          </div>
                          <input
                            type="checkbox"
                            checked={formData[item.field as keyof typeof formData] as boolean}
                            onChange={(e) => update(item.field, e.target.checked)}
                            className="sr-only"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      </label>
                    ))}
                  </CardContent>
                </>
              )}

              {/* Step 4: Review */}
              {currentStep === 4 && (
                <>
                  <CardHeader className="text-center pb-2">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">Review & Complete</h2>
                    <p className="text-sm text-muted-foreground">
                      Make sure everything looks good
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Contact Info */}
                    <div className="rounded-xl bg-muted/50 border border-foreground/5 p-4">
                      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Contact Information
                      </h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Name</p>
                          <p className="text-foreground font-medium">
                            {formData.firstName} {formData.lastName}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Relationship</p>
                          <p className="text-foreground font-medium">
                            {formData.relationship || "Not specified"}
                          </p>
                        </div>
                        {formData.phone && (
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Phone</p>
                            <p className="text-foreground font-medium flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {formData.phone}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Notification Preferences */}
                    <div className="rounded-xl bg-muted/50 border border-foreground/5 p-4">
                      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Bell className="w-4 h-4" />
                        Notifications
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { field: "notifyTasks", label: "Tasks" },
                          { field: "notifyDeadlines", label: "Deadlines" },
                          { field: "notifyAwards", label: "Awards" },
                          { field: "notifyMessages", label: "Messages" },
                        ].map((item) => (
                          <span
                            key={item.field}
                            className={cn(
                              "px-3 py-1 rounded-full text-xs font-medium",
                              formData[item.field as keyof typeof formData]
                                ? "bg-emerald-500/10 text-emerald-600"
                                : "bg-muted text-muted-foreground line-through"
                            )}
                          >
                            {item.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Linked Students Summary */}
                    {linkedStudents.length > 0 && (
                      <div className="rounded-xl bg-muted/50 border border-foreground/5 p-4">
                        <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Linked Students
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {linkedStudents.map((s) => s.name || s.email).join(", ")}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </>
              )}

              {/* Footer Navigation */}
              <CardFooter className="flex items-center justify-between gap-3 rounded-b-3xl">
                {currentStep > 1 ? (
                  <Button variant="ghost" onClick={prev} className="gap-1.5">
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                ) : (
                  <div />
                )}

                {currentStep < 4 ? (
                  <Button
                    onClick={next}
                    className="gap-1.5 bg-[#1E3A5F] hover:bg-[#162d4a]"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="gap-1.5 bg-[#2563EB] hover:bg-blue-700"
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
                  </Button>
                )}
              </CardFooter>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Step label */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          Step {currentStep} of 4 &mdash; {STEPS[currentStep - 1].label}
        </p>
      </div>
    </div>
  );
}
