"use client"

import * as React from "react"
import { motion } from "motion/react"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { Users, Award, TrendingUp, BookOpen } from "lucide-react"
import { toast } from "sonner"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface Student {
  id: string
  role: string
  studentProfile?: { status?: string | null } | null
  createdAt: string
}

interface Scholarship {
  id: string
  amount?: number | null
  tags?: Array<{ name: string }>
}

const PIE_COLORS = ["#1E3A5F", "#2563EB", "#7c3aed", "#059669", "#d97706"]

// Static engagement data (not available from current APIs)
const engagementData = [
  { week: "W1", active: 95, engaged: 72, dormant: 15 },
  { week: "W2", active: 102, engaged: 78, dormant: 12 },
  { week: "W3", active: 98, engaged: 82, dormant: 14 },
  { week: "W4", active: 110, engaged: 90, dormant: 10 },
  { week: "W5", active: 115, engaged: 88, dormant: 11 },
  { week: "W6", active: 120, engaged: 95, dormant: 9 },
  { week: "W7", active: 118, engaged: 92, dormant: 8 },
  { week: "W8", active: 125, engaged: 100, dormant: 7 },
]

export default function AnalyticsPage() {
  const [students, setStudents] = React.useState<Student[]>([])
  const [scholarships, setScholarships] = React.useState<Scholarship[]>([])
  const [loading, setLoading] = React.useState(true)
  const [dateRange, setDateRange] = React.useState("30")

  React.useEffect(() => {
    Promise.all([
      fetch("/api/students").then(r => r.json()),
      fetch("/api/scholarships").then(r => r.json()),
    ])
      .then(([studentsData, scholarshipsData]) => {
        setStudents(Array.isArray(studentsData) ? studentsData : [])
        setScholarships(Array.isArray(scholarshipsData) ? scholarshipsData : [])
        setLoading(false)
      })
      .catch(() => { toast.error("Failed to load analytics data"); setLoading(false) })
  }, [])

  // Filter data based on date range
  const filterByDateRange = React.useCallback((items: { createdAt: string }[]) => {
    if (dateRange === "all") return items
    const now = new Date()
    const daysAgo = dateRange === "365" ? 365 : dateRange === "90" ? 90 : 30
    const cutoff = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    return items.filter(item => new Date(item.createdAt) >= cutoff)
  }, [dateRange])

  const filteredStudents = filterByDateRange(students as unknown as { createdAt: string }[]) as unknown as Student[]
  const filteredScholarships = filterByDateRange(scholarships as unknown as { createdAt: string }[]) as unknown as Scholarship[]

  const activeStudents = filteredStudents.filter(s => s.studentProfile?.status === "ACTIVE").length
  const totalScholarshipValue = filteredScholarships.reduce((sum, s) => sum + (s.amount || 0), 0)

  // Awards by category from scholarship tags
  const tagCounts: Record<string, number> = {}
  filteredScholarships.forEach(s => {
    s.tags?.forEach(tag => {
      tagCounts[tag.name] = (tagCounts[tag.name] || 0) + (s.amount || 0)
    })
  })
  const awardsByCategory = Object.entries(tagCounts)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6)

  // Module completion data (static - would need LearningProgress aggregation)
  const moduleData = [
    { name: "SAT Prep", value: 85 },
    { name: "Essay Writing", value: 72 },
    { name: "Financial Literacy", value: 58 },
    { name: "College Research", value: 90 },
    { name: "Interview Prep", value: 45 },
  ]

  // Student enrollment by month
  const monthCounts: Record<string, number> = {}
  filteredStudents.forEach(s => {
    const month = new Date(s.createdAt).toLocaleDateString([], { month: "short" })
    monthCounts[month] = (monthCounts[month] || 0) + 1
  })
  const enrollmentData = Object.entries(monthCounts).map(([month, count]) => ({ month, count }))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Analytics"
        description="Track performance metrics across your practice."
        actions={
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">This Year</option>
            <option value="all">All Time</option>
          </select>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Students" value={loading ? "—" : filteredStudents.length} icon={Users} trend={{ value: 8, label: "vs last month" }} index={0} />
        <StatCard title="Active Students" value={loading ? "—" : activeStudents} icon={Award} trend={{ value: 23, label: "this cycle" }} index={1} />
        <StatCard title="Scholarships Available" value={loading ? "—" : filteredScholarships.length} icon={TrendingUp} trend={{ value: 5, label: "vs last month" }} index={2} />
        <StatCard title="Total Scholarship Value" value={loading ? "—" : `$${(totalScholarshipValue / 1000).toFixed(0)}k`} icon={BookOpen} trend={{ value: 12, label: "this month" }} index={3} />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Engagement Over Time */}
        <motion.div
          className="rounded-xl bg-white p-5 ring-1 ring-foreground/10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
        >
          <h3 className="mb-4 text-sm font-medium text-foreground">Engagement Over Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }} />
                <Line type="monotone" dataKey="active" stroke="#1E3A5F" strokeWidth={2} dot={false} name="Active" />
                <Line type="monotone" dataKey="engaged" stroke="#2563EB" strokeWidth={2} dot={false} name="Engaged" />
                <Line type="monotone" dataKey="dormant" stroke="#94a3b8" strokeWidth={2} dot={false} name="Dormant" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="size-2 rounded-full bg-[#1E3A5F]" /> Active</span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="size-2 rounded-full bg-[#2563EB]" /> Engaged</span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="size-2 rounded-full bg-[#94a3b8]" /> Dormant</span>
          </div>
        </motion.div>

        {/* Awards by Category */}
        <motion.div
          className="rounded-xl bg-white p-5 ring-1 ring-foreground/10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
        >
          <h3 className="mb-4 text-sm font-medium text-foreground">Scholarships by Tag Value</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={awardsByCategory.length > 0 ? awardsByCategory : [{ category: "No data", amount: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }} formatter={(value) => [`$${Number(value).toLocaleString()}`, "Amount"]} />
                <Bar dataKey="amount" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Student Enrollment */}
        <motion.div
          className="rounded-xl bg-white p-5 ring-1 ring-foreground/10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
        >
          <h3 className="mb-4 text-sm font-medium text-foreground">Student Enrollment by Month</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={enrollmentData.length > 0 ? enrollmentData : [{ month: "No data", count: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }} />
                <Bar dataKey="count" fill="#1E3A5F" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Module Completion */}
        <motion.div
          className="rounded-xl bg-white p-5 ring-1 ring-foreground/10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
        >
          <h3 className="mb-4 text-sm font-medium text-foreground">Module Completion Rate</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={moduleData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}%`}>
                  {moduleData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
