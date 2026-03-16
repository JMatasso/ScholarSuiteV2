"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GraduationCap, Eye, EyeOff, Loader2, User, Users, Shield } from "lucide-react";
import { toast } from "sonner";

type RoleOption = "STUDENT" | "PARENT";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<RoleOption>("STUDENT");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const roles: { value: RoleOption; label: string; description: string; icon: React.ReactNode }[] = [
    { value: "STUDENT", label: "Student", description: "Track scholarships and applications", icon: <User className="w-5 h-5" /> },
    { value: "PARENT", label: "Parent", description: "Monitor your child's progress", icon: <Users className="w-5 h-5" /> },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Registration failed");
      }

      toast.success("Account created! Signing you in...");
      router.push("/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex">
      {/* Left: Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1E3A5F] p-12 flex-col justify-between">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-semibold text-white">ScholarSuite</span>
          </Link>
        </div>

        <div>
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            Start your scholarship journey today.
          </h2>
          <p className="text-blue-100/70 text-lg leading-relaxed">
            Create your free account and get matched with scholarships you actually qualify for — in minutes, not hours.
          </p>
        </div>

        <div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { stat: "47K+", label: "Scholarships" },
              { stat: "$2.1M", label: "Awarded" },
              { stat: "2,000+", label: "Students" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-white">{s.stat}</p>
                <p className="text-blue-100/60 text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link href="/" className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 bg-[#1E3A5F] rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-[#1A1A1A]">ScholarSuite</span>
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Create your account</h1>
          <p className="text-gray-500 mb-8">
            {step === 1 ? "Choose your role to get started" : "Fill in your details to continue"}
          </p>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            <div className={`h-1 flex-1 rounded-full ${step >= 1 ? "bg-[#2563EB]" : "bg-gray-200"}`} />
            <div className={`h-1 flex-1 rounded-full ${step >= 2 ? "bg-[#2563EB]" : "bg-gray-200"}`} />
          </div>

          {step === 1 ? (
            <div className="space-y-3">
              {roles.map((r) => (
                <button
                  key={r.value}
                  onClick={() => { setRole(r.value); setStep(2); }}
                  className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left ${
                    role === r.value
                      ? "border-[#2563EB] bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    role === r.value ? "bg-[#2563EB] text-white" : "bg-gray-100 text-gray-600"
                  }`}>
                    {r.icon}
                  </div>
                  <div>
                    <p className="font-medium text-[#1A1A1A]">{r.label}</p>
                    <p className="text-sm text-gray-500">{r.description}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Smith"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-shadow pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-shadow"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-[#1E3A5F] text-white py-2.5 rounded-lg font-medium hover:bg-[#162d4a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create account"
                  )}
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-gray-500 mt-8">
            Already have an account?{" "}
            <Link href="/login" className="text-[#2563EB] font-medium hover:text-blue-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
