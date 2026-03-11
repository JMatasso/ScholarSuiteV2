"use client"

import * as React from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"
import { DataTable, SortableHeader } from "@/components/ui/data-table"
import { Plus, Upload, MoreHorizontal, ExternalLink } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"

interface Scholarship {
  id: string
  name: string
  provider: string
  amount: number
  deadline: string
  active: boolean
  tags: { label: string; color: string }[]
}

const scholarships: Scholarship[] = [
  { id: "1", name: "Gates Scholarship", provider: "Bill & Melinda Gates Foundation", amount: 20000, deadline: "Mar 31, 2026", active: true, tags: [{ label: "Merit", color: "bg-blue-100 text-blue-700" }, { label: "Full Ride", color: "bg-purple-100 text-purple-700" }] },
  { id: "2", name: "National Merit Scholarship", provider: "NMSC", amount: 10000, deadline: "Feb 15, 2026", active: true, tags: [{ label: "Merit", color: "bg-blue-100 text-blue-700" }, { label: "Test-Based", color: "bg-green-100 text-green-700" }] },
  { id: "3", name: "Coca-Cola Scholars", provider: "Coca-Cola Scholars Foundation", amount: 20000, deadline: "Apr 15, 2026", active: true, tags: [{ label: "Community", color: "bg-amber-100 text-amber-700" }] },
  { id: "4", name: "Dell Scholars Program", provider: "Michael & Susan Dell Foundation", amount: 20000, deadline: "Dec 1, 2025", active: false, tags: [{ label: "Need-Based", color: "bg-red-100 text-red-700" }, { label: "Tech", color: "bg-cyan-100 text-cyan-700" }] },
  { id: "5", name: "Ron Brown Scholar", provider: "CAP Charitable Foundation", amount: 40000, deadline: "Jan 9, 2026", active: false, tags: [{ label: "Leadership", color: "bg-amber-100 text-amber-700" }] },
  { id: "6", name: "Horatio Alger Scholarship", provider: "Horatio Alger Association", amount: 25000, deadline: "Mar 15, 2026", active: true, tags: [{ label: "Need-Based", color: "bg-red-100 text-red-700" }] },
  { id: "7", name: "Elks Most Valuable Student", provider: "Elks National Foundation", amount: 12500, deadline: "Nov 15, 2025", active: false, tags: [{ label: "Merit", color: "bg-blue-100 text-blue-700" }, { label: "Community", color: "bg-amber-100 text-amber-700" }] },
  { id: "8", name: "Jack Kent Cooke Foundation", provider: "Jack Kent Cooke Foundation", amount: 55000, deadline: "Apr 22, 2026", active: true, tags: [{ label: "Full Ride", color: "bg-purple-100 text-purple-700" }, { label: "Need-Based", color: "bg-red-100 text-red-700" }] },
  { id: "9", name: "QuestBridge National Match", provider: "QuestBridge", amount: 0, deadline: "Sep 26, 2026", active: true, tags: [{ label: "Full Ride", color: "bg-purple-100 text-purple-700" }, { label: "Need-Based", color: "bg-red-100 text-red-700" }] },
  { id: "10", name: "Regeneron Science Talent Search", provider: "Society for Science", amount: 250000, deadline: "Nov 10, 2025", active: false, tags: [{ label: "STEM", color: "bg-cyan-100 text-cyan-700" }, { label: "Merit", color: "bg-blue-100 text-blue-700" }] },
  { id: "11", name: "Cameron Impact Scholarship", provider: "Bryan Cameron Education Foundation", amount: 50000, deadline: "Sep 14, 2026", active: true, tags: [{ label: "Merit", color: "bg-blue-100 text-blue-700" }, { label: "Leadership", color: "bg-amber-100 text-amber-700" }] },
]

const columns: ColumnDef<Scholarship, unknown>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <SortableHeader column={column}>Scholarship</SortableHeader>,
    cell: ({ row }) => (
      <div>
        <p className="text-sm font-medium text-foreground">{row.original.name}</p>
        <p className="text-xs text-muted-foreground">{row.original.provider}</p>
      </div>
    ),
  },
  {
    accessorKey: "amount",
    header: ({ column }) => <SortableHeader column={column}>Amount</SortableHeader>,
    cell: ({ row }) => (
      <span className="text-sm font-medium text-foreground">
        {row.original.amount === 0 ? "Full Tuition" : `$${row.original.amount.toLocaleString()}`}
      </span>
    ),
  },
  {
    accessorKey: "deadline",
    header: ({ column }) => <SortableHeader column={column}>Deadline</SortableHeader>,
    cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.deadline}</span>,
  },
  {
    accessorKey: "active",
    header: "Status",
    cell: ({ row }) => (
      <span className={`inline-flex h-5 items-center rounded-full px-2 text-xs font-medium ${
        row.original.active
          ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-300"
          : "bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-300"
      }`}>
        {row.original.active ? "Active" : "Inactive"}
      </span>
    ),
  },
  {
    accessorKey: "tags",
    header: "Tags",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.tags.map((tag, i) => (
          <span key={i} className={`inline-flex h-5 items-center rounded-full px-2 text-[11px] font-medium ${tag.color}`}>
            {tag.label}
          </span>
        ))}
      </div>
    ),
  },
  {
    id: "actions",
    cell: () => (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-xs"><ExternalLink className="size-3.5" /></Button>
        <Button variant="ghost" size="icon-xs"><MoreHorizontal className="size-3.5" /></Button>
      </div>
    ),
  },
]

export default function ScholarshipsPage() {
  const [search, setSearch] = React.useState("")

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Scholarship Database"
        description="Manage and track scholarship opportunities for your students."
        actions={
          <>
            <Button variant="outline" size="sm">
              <Upload className="size-3.5" /> Import CSV
            </Button>
            <Button size="sm">
              <Plus className="size-3.5" /> Add Scholarship
            </Button>
          </>
        }
      />

      <div className="flex items-center gap-3">
        <SearchInput
          value={search}
          onValueChange={setSearch}
          placeholder="Search scholarships..."
          className="w-72"
        />
        <select className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
          <option value="">Any Amount</option>
          <option value="0-10000">Under $10,000</option>
          <option value="10000-25000">$10,000 - $25,000</option>
          <option value="25000+">$25,000+</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={scholarships}
        searchKey="name"
        searchValue={search}
      />
    </div>
  )
}
