"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "motion/react"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DataTable, SortableHeader } from "@/components/ui/data-table"
import { StatCard } from "@/components/ui/stat-card"
import { Loader2, FileBarChart, CheckCircle2, PenTool, FileText, MessageSquare } from "lucide-react"
import LoaderOne from "@/components/ui/loader-one"
import type { ColumnDef } from "@tanstack/react-table"

interface ReportData {
  summary: {
    tasksCompleted: number
    essaysUpdated: number
    applicationsSubmitted: number
    messagesExchanged: number
  }
  students: Array<{
    id: string
    name: string
    image: string | null
    tasksCompleted: number
    essaysUpdated: number
    applicationsSubmitted: number
    messagesExchanged: number
  }>
}

export default function AdminReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  const today = new Date()
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const [startDate, setStartDate] = useState(weekAgo.toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(today.toISOString().slice(0, 10))

  const loadReport = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reports?startDate=${startDate}&endDate=${endDate}`)
      if (res.ok) {
        const d = await res.json()
        setData(d)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => {
    loadReport()
  }, [loadReport])

  const columns: ColumnDef<NonNullable<ReportData>["students"][0], unknown>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader column={column}>Student</SortableHeader>,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Avatar className="size-6">
            {row.original.image && <AvatarImage src={row.original.image} alt={row.original.name} />}
            <AvatarFallback className="text-[10px]">
              {row.original.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-sm">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "tasksCompleted",
      header: ({ column }) => <SortableHeader column={column}>Tasks</SortableHeader>,
      cell: ({ row }) => (
        <span className={`text-sm ${row.original.tasksCompleted > 0 ? "text-emerald-600 font-medium" : "text-muted-foreground"}`}>
          {row.original.tasksCompleted}
        </span>
      ),
    },
    {
      accessorKey: "essaysUpdated",
      header: ({ column }) => <SortableHeader column={column}>Essays</SortableHeader>,
      cell: ({ row }) => (
        <span className={`text-sm ${row.original.essaysUpdated > 0 ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>
          {row.original.essaysUpdated}
        </span>
      ),
    },
    {
      accessorKey: "applicationsSubmitted",
      header: ({ column }) => <SortableHeader column={column}>Applications</SortableHeader>,
      cell: ({ row }) => (
        <span className={`text-sm ${row.original.applicationsSubmitted > 0 ? "text-blue-600 font-medium" : "text-muted-foreground"}`}>
          {row.original.applicationsSubmitted}
        </span>
      ),
    },
    {
      accessorKey: "messagesExchanged",
      header: ({ column }) => <SortableHeader column={column}>Messages</SortableHeader>,
      cell: ({ row }) => (
        <span className={`text-sm ${row.original.messagesExchanged > 0 ? "text-violet-600 font-medium" : "text-muted-foreground"}`}>
          {row.original.messagesExchanged}
        </span>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Weekly Report"
        description="Activity summary for your assigned students."
        actions={
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 w-36"
            />
            <span className="text-sm text-muted-foreground">to</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 w-36"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={loadReport}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileBarChart className="h-3.5 w-3.5" />}
              Refresh
            </Button>
          </div>
        }
      />

      {loading && !data ? (
        <div className="flex justify-center py-16">
          <LoaderOne />
        </div>
      ) : data ? (
        <>
          {/* Summary Stats */}
          <motion.div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <StatCard
              title="Tasks Completed"
              value={data.summary.tasksCompleted}
              icon={CheckCircle2}
              index={0}
            />
            <StatCard
              title="Essays Updated"
              value={data.summary.essaysUpdated}
              icon={PenTool}
              index={1}
            />
            <StatCard
              title="Applications"
              value={data.summary.applicationsSubmitted}
              icon={FileText}
              index={2}
            />
            <StatCard
              title="Messages"
              value={data.summary.messagesExchanged}
              icon={MessageSquare}
              index={3}
            />
          </motion.div>

          {/* Per-Student Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card variant="bento">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-secondary-foreground">
                  Per-Student Breakdown ({data.students.length} students)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable columns={columns} data={data.students} />
              </CardContent>
            </Card>
          </motion.div>
        </>
      ) : null}
    </div>
  )
}
