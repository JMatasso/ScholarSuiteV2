"use client"

import * as React from "react"
import { motion } from "motion/react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SearchInput } from "@/components/ui/search-input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Plus, Shield, Eye, EyeOff } from "lucide-react"
import { useSession } from "next-auth/react"

interface AdminUser {
  id: string
  name?: string | null
  email: string
  image?: string | null
  isActive: boolean
  isMasterAdmin?: boolean
  createdAt: string
}

export default function TeamManagementPage() {
  const { data: session } = useSession()
  const [admins, setAdmins] = React.useState<AdminUser[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [showForm, setShowForm] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const [form, setForm] = React.useState({ name: "", email: "", password: "" })

  const isMasterAdmin = (session?.user as { isMasterAdmin?: boolean } | undefined)?.isMasterAdmin === true

  const loadAdmins = React.useCallback(() => {
    fetch("/api/admin/users")
      .then((res) => res.json())
      .then((data) => {
        setAdmins(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => {
        toast.error("Failed to load team members")
        setLoading(false)
      })
  }, [])

  React.useEffect(() => {
    loadAdmins()
  }, [loadAdmins])

  const filtered = React.useMemo(() => {
    if (!search.trim()) return admins
    const q = search.toLowerCase()
    return admins.filter(
      (a) =>
        (a.name || "").toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q)
    )
  }, [admins, search])

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to create admin")
      }
      toast.success("Admin account created")
      setForm({ name: "", email: "", password: "" })
      setShowForm(false)
      loadAdmins()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create admin")
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (admin: AdminUser) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: admin.id,
          isActive: !admin.isActive,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to update admin")
      }
      toast.success(`${admin.name || admin.email} ${admin.isActive ? "deactivated" : "activated"}`)
      loadAdmins()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update admin")
    }
  }

  const getInitials = (name?: string | null, email?: string) => {
    if (name) return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    return (email || "?").substring(0, 2).toUpperCase()
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Team Management"
        description="Manage administrator accounts."
        actions={
          isMasterAdmin ? (
            <Button size="sm" onClick={() => setShowForm(!showForm)}>
              <Plus className="size-3.5" /> Add Admin
            </Button>
          ) : undefined
        }
      />

      {!isMasterAdmin && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Shield className="size-4 shrink-0" />
          Only master admins can add or remove team members.
        </div>
      )}

      {/* Add Admin Form */}
      {showForm && isMasterAdmin && (
        <form
          onSubmit={handleAddAdmin}
          className="rounded-xl bg-card p-5 ring-1 ring-foreground/10"
        >
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            New Administrator
          </h3>
          <div className="flex flex-col gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Name *
              </label>
              <Input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Full name"
                className="h-9"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Email *
              </label>
              <Input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="admin@example.com"
                className="h-9"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Password *
              </label>
              <div className="relative">
                <Input
                  required
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Minimum 8 characters"
                  minLength={8}
                  className="h-9 pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Creating..." : "Create Admin"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowForm(false)
                setForm({ name: "", email: "", password: "" })
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Search */}
      <SearchInput
        value={search}
        onValueChange={setSearch}
        placeholder="Search by name or email..."
        className="w-full sm:w-64"
      />

      {/* Admin List */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
            Loading team members...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <Shield className="size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No team members found</p>
          </div>
        ) : (
          filtered.map((admin, index) => (
            <motion.div
              key={admin.id}
              className="flex items-center justify-between rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-shadow hover:shadow-sm"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  {admin.image && <AvatarImage src={admin.image} alt={admin.name || admin.email} />}
                  <AvatarFallback>{getInitials(admin.name, admin.email)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {admin.name || admin.email}
                    </p>
                    {admin.isMasterAdmin && (
                      <Badge variant="secondary" className="text-[10px]">
                        Master Admin
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{admin.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  Joined {new Date(admin.createdAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "inline-block size-2 rounded-full",
                      admin.isActive ? "bg-green-500" : "bg-red-400"
                    )}
                  />
                  <span
                    className={cn(
                      "text-xs font-medium",
                      admin.isActive ? "text-green-700" : "text-red-600"
                    )}
                  >
                    {admin.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                {isMasterAdmin && !admin.isMasterAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(admin)}
                  >
                    {admin.isActive ? "Deactivate" : "Activate"}
                  </Button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
