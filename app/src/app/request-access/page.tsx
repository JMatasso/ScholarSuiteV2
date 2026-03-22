"use client";

import { useState } from "react";
import Link from "next/link";
import { GraduationCap, Loader2, CheckCircle2, ArrowLeft } from "@/lib/icons";
import { toast } from "sonner";

export default function RequestAccessPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "",
    school: "",
    phone: "",
    message: "",
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.role) {
      toast.error("Please select your role.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setSubmitted(true);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to submit request"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Request Submitted!
          </h1>
          <p className="text-muted-foreground mb-8">
            Thank you, {form.name.split(" ")[0]}! Your request is being
            reviewed. You&apos;ll receive an email with instructions to set up
            your account once approved.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-secondary-foreground hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 bg-[#1E3A5F] rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-foreground">
            ScholarSuite
          </span>
        </Link>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          Request Access
        </h1>
        <p className="text-muted-foreground mb-8">
          Fill out the form below and an administrator will review your request.
          Once approved, you&apos;ll receive an email to set up your account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Role selector */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              I am a...
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "STUDENT", label: "Student", desc: "High school or college student" },
                { value: "PARENT", label: "Parent / Guardian", desc: "Supporting a student" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => update("role", option.value)}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    form.role === option.value
                      ? "border-[#1E3A5F] bg-accent"
                      : "border-border hover:border-border"
                  }`}
                >
                  <p className="text-sm font-semibold text-foreground">
                    {option.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{option.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Name + Email */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Jane Doe"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Email *
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="jane@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Phone (optional)
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary"
            />
          </div>

          {/* School (shown for students) */}
          {form.role === "STUDENT" && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                School Name
              </label>
              <input
                type="text"
                value={form.school}
                onChange={(e) => update("school", e.target.value)}
                placeholder="Lincoln High School"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary"
              />
            </div>
          )}

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              How did you hear about us? (optional)
            </label>
            <textarea
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
              rows={3}
              placeholder="My counselor referred me, I found you online, etc."
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#1E3A5F] text-white py-3 rounded-xl font-medium hover:bg-[#162d4a] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Request"
            )}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-secondary-foreground font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
