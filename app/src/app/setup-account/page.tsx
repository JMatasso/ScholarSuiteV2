"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { GraduationCap, Loader2, Eye, EyeOff, CheckCircle2, XCircle } from "@/lib/icons";
import { toast } from "sonner";

function SetupAccountForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Validate the token on mount
  useEffect(() => {
    if (!token || !email) {
      setError("Invalid invite link.");
      setValidating(false);
      return;
    }

    fetch(`/api/auth/setup-account?token=${token}&email=${encodeURIComponent(email)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setName(data.name || "");
        }
        setValidating(false);
      })
      .catch(() => {
        setError("Failed to validate invite link.");
        setValidating(false);
      });
  }, [token, email]);

  const passwordChecks = [
    { label: "At least 8 characters", valid: password.length >= 8 },
    { label: "Contains a number", valid: /\d/.test(password) },
    { label: "Passwords match", valid: password.length > 0 && password === confirmPassword },
  ];

  const allValid = passwordChecks.every((c) => c.valid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allValid) {
      toast.error("Please fix the password requirements above.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/setup-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Setup failed");
      toast.success("Account created! Please sign in.");
      router.push("/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-[#2563EB]" />
        <span className="ml-2 text-sm text-muted-foreground">Validating invite...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <XCircle className="size-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-2">Invalid Invite</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#2563EB] hover:underline"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-xl bg-accent/60 px-4 py-3">
        <p className="text-sm text-secondary-foreground">
          Welcome, <span className="font-semibold">{name}</span>! Set a password to get started.
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{email}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="Create a password"
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Confirm password
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          placeholder="Repeat your password"
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        />
      </div>

      {/* Password strength checklist */}
      <div className="space-y-1.5">
        {passwordChecks.map((check) => (
          <div key={check.label} className="flex items-center gap-2">
            <CheckCircle2
              className={`size-3.5 ${check.valid ? "text-green-500" : "text-gray-300"}`}
            />
            <span
              className={`text-xs ${check.valid ? "text-green-700" : "text-muted-foreground"}`}
            >
              {check.label}
            </span>
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={isLoading || !allValid}
        className="w-full bg-[#1E3A5F] text-white py-2.5 rounded-xl font-medium hover:bg-[#162d4a] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Setting up...
          </>
        ) : (
          "Create My Account"
        )}
      </button>
    </form>
  );
}

export default function SetupAccountPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center gap-2 mb-12">
          <div className="w-8 h-8 bg-[#1E3A5F] rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-foreground">ScholarSuite</span>
        </Link>
        <h1 className="text-2xl font-bold text-foreground mb-2">Set up your account</h1>
        <p className="text-muted-foreground mb-8">
          Create a password to access your ScholarSuite account.
        </p>
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-[#2563EB]" />
            </div>
          }
        >
          <SetupAccountForm />
        </Suspense>
      </div>
    </div>
  );
}
