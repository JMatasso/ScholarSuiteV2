"use client"

import * as React from "react"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { SearchInput } from "@/components/ui/search-input"
import { DataTable, SortableHeader } from "@/components/ui/data-table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DollarSign, TrendingUp, Users, CheckCircle } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"

interface StudentFinancial {
  id: string
  name: string
  initials: string
  school: string
  costOfAttendance: number
  aidSecured: number
  gap: number
  gapPercentage: number
  scholarshipsApplied: number
  scholarshipsAwarded: number
}

const students: StudentFinancial[] = [
  { id: "1", name: "Maya Chen", initials: "MC", school: "Lincoln High", costOfAttendance: 48000, aidSecured: 25000, gap: 23000, gapPercentage: 48, scholarshipsApplied: 6, scholarshipsAwarded: 2 },
  { id: "2", name: "Jordan Williams", initials: "JW", school: "Roosevelt Academy", costOfAttendance: 55000, aidSecured: 35000, gap: 20000, gapPercentage: 36, scholarshipsApplied: 8, scholarshipsAwarded: 3 },
  { id: "3", name: "Carlos Rivera", initials: "CR", school: "Eastside High", costOfAttendance: 42000, aidSecured: 12000, gap: 30000, gapPercentage: 71, scholarshipsApplied: 4, scholarshipsAwarded: 1 },
  { id: "4", name: "Priya Sharma", initials: "PS", school: "Oak Park High", costOfAttendance: 52000, aidSecured: 52000, gap: 0, gapPercentage: 0, scholarshipsApplied: 10, scholarshipsAwarded: 5 },
  { id: "5", name: "Lisa Park", initials: "LP", school: "Riverside High", costOfAttendance: 46000, aidSecured: 28000, gap: 18000, gapPercentage: 39, scholarshipsApplied: 7, scholarshipsAwarded: 2 },
  { id: "6", name: "Marcus Johnson", initials: "MJ", school: "Central High", costOfAttendance: 38000, aidSecured: 15000, gap: 23000, gapPercentage: 61, scholarshipsApplied: 3, scholarshipsAwarded: 1 },
  { id: "7", name: "Ethan Kim", initials: "EK", school: "Summit Academy", costOfAttendance: 60000, aidSecured: 60000, gap: 0, gapPercentage: 0, scholarshipsApplied: 12, scholarshipsAwarded: 6 },
  { id: "8", name: "Aisha Patel", initials: "AP", school: "Westfield Prep", costOfAttendance: 50000, aidSecured: 8000, gap: 42000, gapPercentage: 84, scholarshipsApplied: 2, scholarshipsAwarded: 0 },
]

const fmt = (n: number) => `$${n.toLocaleString()}`

const columns: ColumnDef<StudentFinancial, unknown>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <SortableHeader column={column}>Student</SortableHeader>,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Avatar size="sm"><AvatarFallback>{row.original.initials}</AvatarFallback></Avatar>
        <div>
          <p className="text-sm font-medium text-foreground">{row.original.name}</p>
          <p className="text-[11px] text-muted-foreground">{row.original.school}</p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "costOfAttendance",
    header: ({ column }) => <SortableHeader column={column}>Cost of Attendance</SortableHeader>,
    cell: ({ row }) => <span className="text-sm text-foreground">{fmt(row.original.costOfAttendance)}</span>,
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
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium ${row.original.gap === 0 ? "text-green-600" : "text-red-600"}`}>
          {row.original.gap === 0 ? "Fully Funded" : fmt(row.original.gap)}
        </span>
        {row.original.gap > 0 && (
          <div className="w-16 h-1.5 rounded-full bg-gray-200 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                row.original.gapPercentage > 60 ? "bg-red-500" : row.original.gapPercentage > 30 ? "bg-amber-500" : "bg-green-500"
              }`}
              style={{ width: `${100 - row.original.gapPercentage}%` }}
            />
          </div>
        )}
      </div>
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

export default function FinancialPage() {
  const [search, setSearch] = React.useState("")

  const totalAid = students.reduce((sum, s) => sum + s.aidSecured, 0)
  const avgGap = Math.round(students.reduce((sum, s) => sum + s.gap, 0) / students.length)
  const fullyFunded = students.filter((s) => s.gap === 0).length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Financial Oversight"
        description="Track scholarship awards, financial aid, and funding gaps across your students."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Aid Secured" value={fmt(totalAid)} icon={DollarSign} trend={{ value: 18, label: "this cycle" }} />
        <StatCard title="Average Gap" value={fmt(avgGap)} icon={TrendingUp} trend={{ value: -12, label: "vs last month" }} />
        <StatCard title="Students at Full Fund" value={fullyFunded} icon={CheckCircle} description={`out of ${students.length} students`} />
        <StatCard title="Total Students" value={students.length} icon={Users} trend={{ value: 8, label: "vs last month" }} />
      </div>

      <div className="flex items-center gap-3">
        <SearchInput
          value={search}
          onValueChange={setSearch}
          placeholder="Search students..."
          className="w-72"
        />
      </div>

      <DataTable
        columns={columns}
        data={students}
        searchKey="name"
        searchValue={search}
      />
    </div>
  )
}
