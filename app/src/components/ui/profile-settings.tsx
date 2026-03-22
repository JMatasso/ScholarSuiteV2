"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Eye, EyeOff, Loader2, Save, Download, Check, X } from "@/lib/icons"
import { Button } from "@/components/ui/button"
import { ImageUpload } from "@/components/ui/image-upload"
import { PhotoCropDialog } from "@/components/photo-crop-dialog"
import { useUploadThing } from "@/lib/uploadthing"

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
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [cropOpen, setCropOpen] = useState(false)

  const { startUpload } = useUploadThing("profileImage", {
    onClientUploadComplete: async (res) => {
      const url = res?.[0]?.ufsUrl || res?.[0]?.url
      if (url) {
        setImage(url)
        await updateSession({ image: url })
        toast.success("Photo uploaded")
      }
      setUploadingPhoto(false)
      setCropOpen(false)
      setCropSrc(null)
    },
    onUploadError: (error) => {
      console.error("Profile photo upload error:", error)
      toast.error(`Failed to upload photo: ${error.message}`)
      setUploadingPhoto(false)
    },
  })

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "")
      setEmail(session.user.email || "")
      setImage(session.user.image || null)
    }
  }, [session])

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    try {
      const body: Record<string, string | null> = { name }
      if (image !== session?.user?.image) {
        body.image = image
      }
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
      await updateSession({ name, email, image })
      setCurrentPassword("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile")
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePhotoSelect = (file: File) => {
    // Open crop dialog with the selected image
    const reader = new FileReader()
    reader.onload = () => {
      setCropSrc(reader.result as string)
      setCropOpen(true)
    }
    reader.readAsDataURL(file)
  }

  const handleCropComplete = useCallback(async (blob: Blob) => {
    setUploadingPhoto(true)
    try {
      const file = new File([blob], "profile-photo.jpg", { type: "image/jpeg" })
      await startUpload([file])
    } catch (err) {
      console.error("Profile photo upload failed:", err)
      toast.error("Failed to upload photo")
      setUploadingPhoto(false)
    }
  }, [startUpload])

  // Password requirement checks
  const passwordChecks = [
    { label: "At least 8 characters", met: newPassword.length >= 8 },
    { label: "Uppercase letter (A-Z)", met: /[A-Z]/.test(newPassword) },
    { label: "Lowercase letter (a-z)", met: /[a-z]/.test(newPassword) },
    { label: "Number (0-9)", met: /[0-9]/.test(newPassword) },
    { label: "Special character (!@#$%...)", met: /[^A-Za-z0-9]/.test(newPassword) },
  ]
  const allPasswordChecksMet = passwordChecks.every((c) => c.met)

  const handleExportData = async () => {
    setExporting(true)
    try {
      const res = await fetch("/api/auth/export")
      if (!res.ok) throw new Error("Export failed")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `scholarsuite-data-export-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success("Data exported successfully")
    } catch {
      toast.error("Failed to export data")
    } finally {
      setExporting(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    if (!allPasswordChecksMet) {
      toast.error("Password does not meet all requirements")
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
        <ImageUpload
          currentImage={image}
          onFileSelect={handlePhotoSelect}
          onRemove={async () => {
            setImage(null)
            await fetch("/api/auth/account", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ image: null }),
            })
            await updateSession({ image: null })
            toast.success("Photo removed")
          }}
          uploading={uploadingPhoto}
          label="Profile Photo"
          subtitle="JPG, PNG up to 4MB. Click or drag and drop."
          accept="image/*"
          heightClass="h-48"
        />
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
            {newPassword.length > 0 && (
              <div className="mt-2 space-y-1">
                {passwordChecks.map((check) => (
                  <div key={check.label} className="flex items-center gap-1.5 text-xs">
                    {check.met ? (
                      <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                    ) : (
                      <X className="w-3 h-3 text-muted-foreground shrink-0" />
                    )}
                    <span className={check.met ? "text-emerald-600" : "text-muted-foreground"}>
                      {check.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
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

      {/* Data & Privacy */}
      <section className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
        <h3 className="text-base font-semibold text-foreground mb-4">Data & Privacy</h3>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Download a copy of all your personal data stored in ScholarSuite, including your profile, tasks, essays, documents, and messages.
          </p>
          <Button onClick={handleExportData} disabled={exporting} variant="outline" className="rounded-lg gap-2">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download My Data
          </Button>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <a href="/privacy" className="hover:text-[#2563EB] underline underline-offset-2">Privacy Policy</a>
            <a href="/terms" className="hover:text-[#2563EB] underline underline-offset-2">Terms of Service</a>
          </div>
        </div>
      </section>

      {/* Photo Crop Dialog */}
      {cropSrc && (
        <PhotoCropDialog
          open={cropOpen}
          onClose={() => { setCropOpen(false); setCropSrc(null) }}
          imageSrc={cropSrc}
          onCropComplete={handleCropComplete}
          uploading={uploadingPhoto}
        />
      )}
    </div>
  )
}
