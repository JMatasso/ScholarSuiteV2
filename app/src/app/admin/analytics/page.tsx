"use client"

import * as React from "react"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { Users, Award, TrendingUp, BookOpen } from "lucide-react"
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
  Legend,
} from "recharts"

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

const awardsByCategory = [
  { category: "Merit", amount: 450000 },
  { category: "Need-Based", amount: 380000 },
  { category: "STEM", amount: 220000 },
  { category: "Community", amount: 150000 },
  { category: "Leadership", amount: 120000 },
  { category: "Athletic", amount: 80000 },
]

const funnelData = [
  { stage: "Identified", count: 280 },
  { stage: "Matched", count: 195 },
  { stage: "Drafting", count: 140 },
  { stage: "Submitted", count: 95 },
  { stage: "Finalist", count: 42 },
  { stage: "Awarded", count: 28 },
]

const moduleData = [
  { name: "SAT Prep", value: 85 },
  { name: "Essay Writing", value: 72 },
  { name: "Financial Literacy", value: 58 },
  { name: "College Research", value: 90 },
  { name: "Interview Prep", value: 45 },
]
const PIE_COLORS = ["#1E3A5F", "#2563EB", "#7c3aed", "#059669", "#d97706"]

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Analytics"
        description="Track performance metrics across your practice."
        actions={
          <select className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
            <option>Last 30 Days</option>
            <option>Last 90 Days</option>
            <option>This Year</option>
            <option>All Time</option>
          </select>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Students" value={127} icon={Users} trend={{ value: 8, label: "vs last month" }} />
        <StatCard title="Awards Secured" value="$1.4M" icon={Award} trend={{ value: 23, label: "this cycle" }} />
        <StatCard title="Avg. Engagement" value="78%" icon={TrendingUp} trend={{ value: 5, label: "vs last month" }} />
        <StatCard title="Modules Completed" value={342} icon={BookOpen} trend={{ value: 12, label: "this month" }} />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Engagement Over Time */}
        <div className="rounded-xl bg-white p-5 ring-1 ring-foreground/10">
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
        </div>

        {/* Awards by Category */}
        <div className="rounded-xl bg-white p-5 ring-1 ring-foreground/10">
          <h3 className="mb-4 text-sm font-medium text-foreground">Awards by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={awardsByCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }} formatter={(value) => [`$${Number(value).toLocaleString()}`, "Amount"]} />
                <Bar dataKey="amount" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Application Funnel */}
        <div className="rounded-xl bg-white p-5 ring-1 ring-foreground/10">
          <h3 className="mb-4 text-sm font-medium text-foreground">Application Funnel</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis type="category" dataKey="stage" tick={{ fontSize: 11 }} stroke="#94a3b8" width={80} />
                <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }} />
                <Bar dataKey="count" fill="#1E3A5F" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Module Completion */}
        <div className="rounded-xl bg-white p-5 ring-1 ring-foreground/10">
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
        </div>
      </div>
    </div>
  )
}
