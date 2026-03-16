"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"
import { motion } from "motion/react"
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Globe,
  Copy,
  Users,
  GraduationCap,
  Pencil,
  School,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { StatCard } from "@/components/ui/stat-card"
import { getInitials } from "@/lib/format"

interface StudentProfile {
  gpa: number | null
  gradeLevel: string | null
  graduationYear: number | null
  status: string | null
}

interface Student {
  id: string
  name: string
  email: string
  image: string | null
  studentProfile: StudentProfile | null
}

interface SchoolData {
  id: string
  name: string
  address: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  phone: string | null
  email: string | null
  website: string | null
  logoUrl: string | null
  joinCode: string | null
  ncesId: string | null
  createdAt: string
  _count: { students: number }
  students: Student[]
}

interface EditForm {
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  phone: string
  email: string
  website: string
  ncesId: string
}

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700 border-blue-200",
  ACTIVE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  AT_RISK: "bg-rose-100 text-rose-700 border-rose-200",
  INACTIVE: "bg-gray-100 text-gray-600 border-gray-200",
  GRADUATED: "bg-purple-100 text-purple-700 border-purple-200",
}

function StatusBadge({ status }: { status: string | null }) {
  const s = status ?? "UNKNOWN"
  const color = STATUS_COLORS[s] ?? "bg-gray-100 text-gray-600 border-gray-200"
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${color}`}
    >
      {s.replace("_", " ")}
    </span>
  )
}

export default function SchoolDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [school, setSchool] = useState<SchoolData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [collapsedYears, setCollapsedYears] = useState<Set<string>>(new Set())
  const [editForm, setEditForm] = useState<EditForm>({
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    email: "",
    website: "",
    ncesId: "",
  })

  useEffect(() => {
    fetch(`/api/schools/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load school")
        return res.json()
      })
      .then((data) => {
        setSchool(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [id])

  const groupedStudents = useMemo(() => {
    if (!school) return []
    const groups: Record<string, Student[]> = {}
    for (const s of school.students) {
      const year = s.studentProfile?.graduationYear
      const key = year ? String(year) : "Unassigned"
      if (!groups[key]) groups[key] = []
      groups[key].push(s)
    }
    const sorted = Object.entries(groups)
      .filter(([k]) => k !== "Unassigned")
      .sort(([a], [b]) => Number(b) - Number(a))
    const unassigned = groups["Unassigned"]
    if (unassigned) sorted.push(["Unassigned", unassigned])
    return sorted
  }, [school])

  const averageGpa = useMemo(() => {
    if (!school) return 0
    const gpas = school.students
      .map((s) => s.studentProfile?.gpa)
      .filter((g): g is number => g != null)
    if (gpas.length === 0) return 0
    return gpas.reduce((sum, g) => sum + g, 0) / gpas.length
  }, [school])

  const gradYearCount = useMemo(() => {
    return groupedStudents.filter(([k]) => k !== "Unassigned").length
  }, [groupedStudents])

  function openEdit() {
    if (!school) return
    setEditForm({
      name: school.name || "",
      address: school.address || "",
      city: school.city || "",
      state: school.state || "",
      zipCode: school.zipCode || "",
      phone: school.phone || "",
      email: school.email || "",
      website: school.website || "",
      ncesId: school.ncesId || "",
    })
    setEditOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/schools/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })
      if (!res.ok) throw new Error("Failed to update school")
      const updated = await res.json()
      setSchool((prev) => (prev ? { ...prev, ...updated } : prev))
      setEditOpen(false)
      toast.success("School updated successfully")
    } catch {
      toast.error("Failed to update school")
    } finally {
      setSaving(false)
    }
  }

  function copyJoinCode() {
    if (!school?.joinCode) return
    navigator.clipboard.writeText(school.joinCode)
    toast.success("Join code copied to clipboard")
  }

  function toggleYear(key: string) {
    setCollapsedYears((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <p className="text-sm">Loading...</p>
      </div>
    )
  }

  if (error || !school) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          className="gap-2 text-muted-foreground"
          onClick={() => router.push("/admin/schools")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Schools
        </Button>
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <p className="text-sm">{error ?? "School not found"}</p>
        </div>
      </div>
    )
  }

  const addressParts = [school.city, school.state].filter(Boolean).join(", ")
  const fullAddress = [school.address, addressParts, school.zipCode]
    .filter(Boolean)
    .join(", ")

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        className="gap-2 text-muted-foreground"
        onClick={() => router.push("/admin/schools")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Schools
      </Button>

      {/* School header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#1E3A5F]/10 text-[#1E3A5F]">
                    <School className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold text-[#1E3A5F]">
                      {school.name}
                    </h1>
                    {fullAddress && (
                      <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {fullAddress}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {school.phone && (
                    <a
                      href={`tel:${school.phone}`}
                      className="flex items-center gap-1.5 hover:text-[#2563EB] transition-colors"
                    >
                      <Phone className="h-4 w-4" />
                      {school.phone}
                    </a>
                  )}
                  {school.email && (
                    <a
                      href={`mailto:${school.email}`}
                      className="flex items-center gap-1.5 hover:text-[#2563EB] transition-colors"
                    >
                      <Mail className="h-4 w-4" />
                      {school.email}
                    </a>
                  )}
                  {school.website && (
                    <a
                      href={
                        school.website.startsWith("http")
                          ? school.website
                          : `https://${school.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 hover:text-[#2563EB] transition-colors"
                    >
                      <Globe className="h-4 w-4" />
                      {school.website}
                    </a>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  {school.joinCode && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        Join Code:
                      </span>
                      <code className="rounded bg-gray-100 px-2 py-0.5 text-sm font-mono font-medium text-[#1E3A5F]">
                        {school.joinCode}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={copyJoinCode}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                  {school.ncesId && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        NCES ID:
                      </span>
                      <span className="text-sm font-mono text-[#1E3A5F]">
                        {school.ncesId}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <Button
                className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2 shrink-0"
                onClick={openEdit}
              >
                <Pencil className="h-4 w-4" />
                Edit School
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Students"
          value={school._count.students}
          icon={Users}
          index={0}
        />
        <StatCard
          title="Average GPA"
          value={averageGpa > 0 ? averageGpa.toFixed(2) : "N/A"}
          icon={GraduationCap}
          index={1}
        />
        <StatCard
          title="Graduation Years"
          value={gradYearCount}
          icon={School}
          index={2}
        />
      </div>

      {/* Students grouped by graduation year */}
      <div className="space-y-4">
        <PageHeader
          title="Students"
          description={`${school._count.students} students enrolled`}
        />

        {groupedStudents.length === 0 && (
          <Card>
            <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
              <p className="text-sm">No students enrolled at this school yet.</p>
            </CardContent>
          </Card>
        )}

        {groupedStudents.map(([yearKey, students]) => {
          const isCollapsed = collapsedYears.has(yearKey)
          const label =
            yearKey === "Unassigned"
              ? `Unassigned (${students.length} student${students.length !== 1 ? "s" : ""})`
              : `Class of ${yearKey} (${students.length} student${students.length !== 1 ? "s" : ""})`

          return (
            <motion.div
              key={yearKey}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader
                  className="cursor-pointer select-none"
                  onClick={() => toggleYear(yearKey)}
                >
                  <div className="flex items-center gap-2">
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                    <CardTitle className="text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide">
                      {label}
                    </CardTitle>
                  </div>
                </CardHeader>
                {!isCollapsed && (
                  <CardContent className="pt-0">
                    <div className="divide-y divide-gray-100">
                      {students.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center gap-4 py-3 px-1 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() =>
                            router.push(`/admin/students/${student.id}`)
                          }
                        >
                          <Avatar>
                            {student.image && <AvatarImage src={student.image} alt={student.name} />}
                            <AvatarFallback>
                              {getInitials(student.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#1A1A1A] truncate">
                              {student.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {student.email}
                            </p>
                          </div>
                          <div className="hidden sm:flex items-center gap-3">
                            {student.studentProfile?.gpa != null && (
                              <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                                GPA: {student.studentProfile.gpa.toFixed(2)}
                              </span>
                            )}
                            {student.studentProfile?.gradeLevel && (
                              <span className="text-xs text-muted-foreground">
                                Grade {student.studentProfile.gradeLevel}
                              </span>
                            )}
                            <StatusBadge
                              status={student.studentProfile?.status ?? null}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Edit School Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit School</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                School Name
              </label>
              <Input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="School name"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Address
              </label>
              <Input
                value={editForm.address}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, address: e.target.value }))
                }
                placeholder="Street address"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  City
                </label>
                <Input
                  value={editForm.city}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, city: e.target.value }))
                  }
                  placeholder="City"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  State
                </label>
                <Input
                  value={editForm.state}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, state: e.target.value }))
                  }
                  placeholder="State"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  ZIP Code
                </label>
                <Input
                  value={editForm.zipCode}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, zipCode: e.target.value }))
                  }
                  placeholder="ZIP"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Phone
                </label>
                <Input
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  placeholder="Phone number"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Email
                </label>
                <Input
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="School email"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Website
              </label>
              <Input
                value={editForm.website}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, website: e.target.value }))
                }
                placeholder="https://example.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                NCES ID
              </label>
              <Input
                value={editForm.ncesId}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, ncesId: e.target.value }))
                }
                placeholder="NCES ID (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#2563EB] hover:bg-[#2563EB]/90"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
