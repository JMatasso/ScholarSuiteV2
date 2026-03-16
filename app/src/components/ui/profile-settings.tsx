"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Eye, EyeOff, Camera, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { UploadButton } from "@/lib/uploadthing"

export function ProfileSettings() {
  const { data: session, update: updateSession } = useSession()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [image, setImage] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "")
      setEmail(session.user.email || "")
      setImage(session.user.image || null)
    }
  }, [session])

  const userInitials = (name || "U")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    try {
      const body: Record<string, string> = { name }
      if (email !== session?.user?.email) {
        if (!currentPassword) {
          toast.error("Current password required to change email")
          setSavingProfile(false)
          return
        }
        body.email = email
        body.currentPassword = currentPassword
      }

      const res = await fetch("/api/auth/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update profile")
      }

      toast.success("Profile updated")
      updateSession()
      setCurrentPassword("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile")
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }
    if (!currentPassword) {
      toast.error("Current password is required")
      return
    }

    setSavingPassword(true)
    try {
      const res = await fetch("/api/auth/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          password: newPassword,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to change password")
      }

      toast.success("Password changed successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change password")
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Profile Photo */}
      <section className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
        <h3 className="text-base font-semibold text-foreground mb-4">Profile Photo</h3>
        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="h-20 w-20 text-lg">
              {image ? (
                <img src={image} alt="Profile" className="h-full w-full object-cover rounded-full" />
              ) : (
                <AvatarFallback className="text-lg">{userInitials}</AvatarFallback>
              )}
            </Avatar>
            <div className="absolute -bottom-1 -right-1 rounded-full bg-primary p-1.5 text-primary-foreground">
              <Camera className="h-3 w-3" />
            </div>
          </div>
          <div>
            <UploadButton
              endpoint="profileImage"
              onClientUploadComplete={(res) => {
                if (res?.[0]) {
                  setImage(res[0].ufsUrl)
                  toast.success("Photo uploaded")
                  updateSession()
                }
              }}
              onUploadError={(error) => {
                toast.error(`Upload failed: ${error.message}`)
              }}
              appearance={{
                button: "bg-primary text-primary-foreground text-sm px-4 py-2 rounded-lg hover:bg-primary/90",
                allowedContent: "text-muted-foreground text-xs",
              }}
            />
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG up to 4MB</p>
          </div>
        </div>
      </section>

      {/* Name & Email */}
      <section className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
        <h3 className="text-base font-semibold text-foreground mb-4">Account Details</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            {email !== session?.user?.email && (
              <p className="text-xs text-amber-600 mt-1">Changing email requires your current password</p>
            )}
          </div>
          {email !== session?.user?.email && (
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Required to change email"
                className="w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
          )}
          <Button onClick={handleSaveProfile} disabled={savingProfile} className="rounded-lg">
            {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </section>

      {/* Change Password */}
      <section className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
        <h3 className="text-base font-semibold text-foreground mb-4">Change Password</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full h-10 rounded-lg border border-input bg-transparent px-3 pr-10 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full h-10 rounded-lg border border-input bg-transparent px-3 pr-10 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          <Button onClick={handleChangePassword} disabled={savingPassword} variant="outline" className="rounded-lg">
            {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Change Password
          </Button>
        </div>
      </section>
    </div>
  )
}
