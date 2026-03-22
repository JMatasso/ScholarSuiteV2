"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, GraduationCap, Loader2 } from "@/lib/icons";
import { AnimatedLogo } from "@/components/ui/animated-logo";

// --- TYPE DEFINITIONS ---

export interface SignInPageProps {
  onSignIn?: (email: string, password: string) => void | Promise<void>;
  isLoading?: boolean;
  heroImageSrc?: string;
  heroTagline?: string;
  heroDescription?: string;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-primary/70 focus-within:bg-primary/10">
    {children}
  </div>
);

// --- MAIN COMPONENT ---

export const SignInPage: React.FC<SignInPageProps> = ({
  onSignIn,
  isLoading = false,
  heroImageSrc = "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1920&q=80",
  heroTagline = "Your scholarship journey starts here.",
  heroDescription = "Discover scholarships, track applications, and plan your financial future with expert guidance every step of the way.",
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSignIn?.(email, password);
  };

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row w-[100dvw]">
      {/* Left column: sign-in form */}
      <section className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            {/* Logo */}
            <div className="animate-element animate-delay-100">
              <Link href="/" className="mb-2 inline-block">
                <AnimatedLogo size="md" />
              </Link>
            </div>

            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">
              <span className="font-light text-foreground tracking-tighter">Welcome back</span>
            </h1>
            <p className="animate-element animate-delay-200 text-muted-foreground">
              Sign in to your account to continue
            </p>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="animate-element animate-delay-300">
                <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                <GlassInputWrapper>
                  <input
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none"
                  />
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-400">
                <div className="flex items-center justify-between mb-0.5">
                  <label className="text-sm font-medium text-muted-foreground">Password</label>
                  <Link
                    href="/forgot-password"
                    className="text-sm hover:underline text-primary transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <GlassInputWrapper>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                      ) : (
                        <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                      )}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-500 flex items-center justify-between text-sm">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="rememberMe" className="custom-checkbox" />
                  <span className="text-foreground/90">Keep me signed in</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="animate-element animate-delay-600 w-full rounded-2xl bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <p className="animate-element animate-delay-700 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/request-access"
                className="text-primary font-medium hover:underline transition-colors"
              >
                Request access
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Right column: hero image + tagline overlay */}
      <section className="hidden md:block flex-1 relative p-4">
        <div
          className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl overflow-hidden"
        >
          {/* Background image */}
          <img
            src={heroImageSrc}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1E3A5F]/90 via-[#1E3A5F]/40 to-[#1E3A5F]/20" />

          {/* Bottom content */}
          <div className="absolute bottom-0 left-0 right-0 p-10">
            <div className="animate-element animate-delay-800">
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight">
                {heroTagline}
              </h2>
              <p className="text-blue-100/80 text-base lg:text-lg leading-relaxed max-w-lg">
                {heroDescription}
              </p>
            </div>

            {/* Stats bar */}
            <div className="animate-element animate-delay-1000 mt-8 flex items-center gap-8">
              {[
                { value: "2,000+", label: "Students" },
                { value: "500+", label: "Scholarships" },
                { value: "$2M+", label: "Awards Tracked" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-blue-200/70">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
