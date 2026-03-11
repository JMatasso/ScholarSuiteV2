"use client"
import { useSearchParams, useRouter } from "next/navigation"
import { useState, Suspense } from "react"
import Link from "next/link"
import { GraduationCap, Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token") || ""
  const email = searchParams.get("email") || ""
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) { toast.error("Passwords do not match"); return }
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return }
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Reset failed")
      toast.success("Password reset! Please sign in.")
      router.push("/login")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  if (!token || !email) {
    return (
      <div className="text-center">
        <p className="text-gray-500 mb-4">Invalid reset link.</p>
        <Link href="/forgot-password" className="text-[#2563EB] font-medium">Request a new one</Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
        <div className="relative">
          <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required minLength={8} placeholder="At least 8 characters" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent pr-10" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="Repeat your password" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent" />
      </div>
      <button type="submit" disabled={isLoading} className="w-full bg-[#1E3A5F] text-white py-2.5 rounded-lg font-medium hover:bg-[#162d4a] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
        {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Resetting...</> : "Reset password"}
      </button>
      <div className="text-center">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#1A1A1A]">
          <ArrowLeft className="w-4 h-4" />Back to sign in
        </Link>
      </div>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center gap-2 mb-12">
          <div className="w-8 h-8 bg-[#1E3A5F] rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-[#1A1A1A]">ScholarSuite</span>
        </Link>
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Set new password</h1>
        <p className="text-gray-500 mb-8">Choose a strong password for your account.</p>
        <Suspense fallback={<div>Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
