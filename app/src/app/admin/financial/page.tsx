"use client"

import * as React from "react"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { SearchInput } from "@/components/ui/search-input"
import { DataTable, SortableHeader } from "@/components/ui/data-table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DollarSign, TrendingUp, Users, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import LoaderOne from "@/components/ui/loader-one"
import type { ColumnDef } from "@tanstack/react-table"

interface StudentFinancial {
  id: string
  name: string
  image?: string | null
  initials: string
  school: string
  aidSecured: number
  gap: number
  gapPercentage: number
  scholarshipsApplied: number
  scholarshipsAwarded: number
}

interface Student {
  id: string
  name?: string | null
  email: string
  image?: string | null
  school?: { name: string } | null
  scholarshipApps?: Array<{
    status: string
    amountAwarded?: number | null
    scholarship: { amount?: number | null }
  }>
  studentProfile?: { gpa?: number | null } | null
}

const fmt = (n: number) => `$${n.toLocaleString()}`

export default function FinancialPage() {
  const [students, setStudents] = React.useState<StudentFinancial[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")

  React.useEffect(() => {
    fetch("/api/students")
      .then(res => res.json())
      .then((rawStudents: Student[]) => {
        if (!Array.isArray(rawStudents)) { setLoading(false); return }
        const mapped: StudentFinancial[] = rawStudents.map(s => {
          const apps = s.scholarshipApps || []
          const awarded = apps.filter(a => a.status === "AWARDED")
          const aidSecured = awarded.reduce((sum, a) => sum + (a.amountAwarded || a.scholarship.amount || 0), 0)
          const name = s.name || s.email
          return {
            id: s.id,
            name,
            image: s.image,
            initials: name.substring(0, 2).toUpperCase(),
            school: s.school?.name || "—",
            aidSecured,
            gap: 0, // Would need financialPlan to compute real gap
            gapPercentage: 0,
            scholarshipsApplied: apps.length,
            scholarshipsAwarded: awarded.length,
          }
        })
        setStudents(mapped)
        setLoading(false)
      })
      .catch(() => { toast.error("Failed to load financial data"); setLoading(false) })
  }, [])

  const totalAid = students.reduce((sum, s) => sum + s.aidSecured, 0)
  const avgGap = students.length > 0 ? Math.round(students.reduce((sum, s) => sum + s.gap, 0) / students.length) : 0
  const fullyFunded = students.filter(s => s.gap === 0 && s.aidSecured > 0).length

  const columns: ColumnDef<StudentFinancial, unknown>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader column={column}>Student</SortableHeader>,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar size="sm">{row.original.image && <AvatarImage src={row.original.image} alt={row.original.name} />}<AvatarFallback>{row.original.initials}</AvatarFallback></Avatar>
          <div>
            <p className="text-sm font-medium text-foreground">{row.original.name}</p>
            <p className="text-[11px] text-muted-foreground">{row.original.school}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "aidSecured",
      header: ({ column }) => <SortableHeader column={column}>Aid Secured</SortableHeader>,
      cell: ({ row }) => <span className="text-sm font-medium text-green-600">{fmt(row.original.aidSecured)}</span>,
    },
    {
      accessorKey: "gap",
      header: ({ column }) => <SortableHeader column={column}>Gap</SortableHeader>,
      cell: ({ row }) => (
        <span className={`text-sm font-medium ${row.original.gap === 0 ? "text-muted-foreground" : "text-red-600"}`}>
          {row.original.gap === 0 ? "—" : fmt(row.original.gap)}
        </span>
      ),
    },
    {
      id: "scholarships",
      header: "Scholarships",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.scholarshipsAwarded}/{row.original.scholarshipsApplied} awarded
        </span>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Financial Oversight"
        description="Track scholarship awards, financial aid, and funding gaps across your students."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Aid Secured" value={fmt(totalAid)} icon={DollarSign} trend={{ value: 18, label: "this cycle" }} index={0} />
        <StatCard title="Average Gap" value={fmt(avgGap)} icon={TrendingUp} trend={{ value: -12, label: "vs last month" }} index={1} />
        <StatCard title="Students w/ Aid" value={fullyFunded} icon={CheckCircle} description={`out of ${students.length} students`} index={2} />
        <StatCard title="Total Students" value={students.length} icon={Users} trend={{ value: 8, label: "vs last month" }} index={3} />
      </div>

      <div className="flex items-center gap-3">
        <SearchInput
          value={search}
          onValueChange={setSearch}
          placeholder="Search students..."
          className="w-72"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32"><LoaderOne /></div>
      ) : (
        <DataTable
          columns={columns}
          data={students}
          searchKey="name"
          searchValue={search}
        />
      )}
    </div>
  )
}
