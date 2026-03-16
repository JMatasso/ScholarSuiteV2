"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Lock } from "lucide-react"

export default function ChangePasswordPage() {
  const router = useRouter()
  const { data: session, update } = useSession()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to change password")
        return
      }

      // Update session to clear mustChangePassword flag
      await update({ mustChangePassword: false })

      toast.success("Password changed successfully!")

      // Redirect to their dashboard
      const role = session?.user?.role?.toLowerCase()
      if (role === "admin") router.push("/admin")
      else if (role === "parent") router.push("/parent")
      else router.push("/student")
    } catch {
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAF8]">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
          <div className="mb-6 flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1E3A5F]/10 text-[#1E3A5F]">
              <Lock className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-semibold text-[#1E3A5F]">Change Your Password</h1>
            <p className="text-center text-sm text-muted-foreground">
              Your account was created with a temporary password. Please set a new password to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Current Password</label>
              <Input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your temporary password"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-shadow"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">New Password</label>
              <Input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-shadow"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Confirm New Password</label>
              <Input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-shadow"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2563EB] hover:bg-[#2563EB]/90 py-2.5"
            >
              {loading ? "Changing..." : "Set New Password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
