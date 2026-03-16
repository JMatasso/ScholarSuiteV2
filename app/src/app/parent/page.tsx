"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/format";
import {
  CheckSquare,
  FileText,
  DollarSign,
  Clock,
  AlertTriangle,
  ChevronDown,
  GraduationCap,
  TrendingUp,
} from "lucide-react";
import { CompletionBanner } from "@/components/ui/completion-banner";

interface StudentProfile {
  gpa?: number;
  gradeLevel?: number;
  highSchool?: string;
  journeyStage?: string;
  status?: string;
}

interface Student {
  id: string;
  name?: string;
  email: string;
  image?: string | null;
  studentProfile?: StudentProfile;
  school?: { name: string };
}

interface Application {
  id: string;
  status: string;
  scholarship?: { amount?: number };
}

interface Task {
  id: string;
  status: string;
  dueDate?: string;
  title: string;
}

function getJourneyStageName(stage?: string) {
  const map: Record<string, string> = {
    EARLY_EXPLORATION: "Early Exploration",
    ACTIVE_PREP: "Active Prep",
    APPLICATION_PHASE: "Application Phase",
    POST_ACCEPTANCE: "Post Acceptance",
  };
  return stage ? (map[stage] ?? stage) : "Unknown";
}

function getGradeLabel(level?: number) {
  if (!level) return "Unknown Grade";
  const suffix = ["th", "st", "nd", "rd"];
  const v = level % 100;
  return `${level}${suffix[(v - 20) % 10] ?? suffix[v] ?? suffix[0]} Grade`;
}

function getIncompleteSections(flags: Record<string, boolean> | null): Array<{ label: string; href: string }> {
  if (!flags) return []
  const sections: Array<{ label: string; href: string }> = []
  if (!flags.contact) sections.push({ label: "Contact Info", href: "/parent/onboarding" })
  if (!flags.tour) sections.push({ label: "Welcome Tour", href: "/parent/onboarding" })
  return sections
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-10 w-64 skeleton-shimmer" />
        <Skeleton className="h-4 w-48 skeleton-shimmer" />
      </div>
      <Skeleton className="h-24 w-full rounded-2xl skeleton-shimmer" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl skeleton-shimmer" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-2xl skeleton-shimmer" />
        ))}
      </div>
    </div>
  );
}

export default function ParentDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [completionData, setCompletionData] = useState<{ percentage: number; flags: Record<string, boolean> | null } | null>(null);

  useEffect(() => {
    // Check if banner was dismissed this session
    if (sessionStorage.getItem("parent-banner-dismissed")) {
      setBannerDismissed(true);
    } else {
      fetch("/api/auth/onboarding-status")
        .then(r => r.json())
        .then(d => {
          if (d.completionPercentage < 100) {
            setCompletionData({ percentage: d.completionPercentage, flags: d.completionFlags });
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleDismissBanner = () => {
    setBannerDismissed(true);
    sessionStorage.setItem("parent-banner-dismissed", "true");
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/students").then((r) => r.json()),
      fetch("/api/applications").then((r) => r.json()),
      fetch("/api/tasks").then((r) => r.json()),
    ])
      .then(([s, a, t]) => {
        const studentList: Student[] = Array.isArray(s) ? s : [];
        setStudents(studentList);
        setSelectedStudent(studentList[0] ?? null);
        setApplications(Array.isArray(a) ? a : []);
        setTasks(Array.isArray(t) ? t : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!selectedStudent) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-muted-foreground">No linked student found.</p>
      </div>
    );
  }

  // Compute stats from real data
  const studentTasks = tasks.filter((t) => t.status !== undefined);
  const completedTasks = studentTasks.filter((t) => t.status === "DONE").length;
  const totalTasks = studentTasks.length;
  const completionPercent =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const submittedApps = applications.filter(
    (a) => a.status === "SUBMITTED"
  ).length;
  const awardedApps = applications.filter((a) => a.status === "AWARDED");
  const totalAwarded = awardedApps.reduce(
    (sum, a) => sum + (a.scholarship?.amount ?? 0),
    0
  );

  const now = new Date();
  const upcomingDeadlines = tasks.filter((t) => {
    if (!t.dueDate) return false;
    const due = new Date(t.dueDate);
    const diff = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 14 && t.status !== "DONE";
  });

  const overdueTasks = tasks.filter((t) => {
    if (!t.dueDate) return false;
    const due = new Date(t.dueDate);
    return due < now && t.status !== "DONE";
  });

  // Applications by status for chart
  const statusGroups = [
    {
      status: "Submitted",
      count: applications.filter((a) => a.status === "SUBMITTED").length,
      color: "bg-purple-500",
    },
    {
      status: "In Progress",
      count: applications.filter((a) => a.status === "IN_PROGRESS").length,
      color: "bg-blue-500",
    },
    {
      status: "Awarded",
      count: applications.filter((a) => a.status === "AWARDED").length,
      color: "bg-green-500",
    },
    {
      status: "Not Started",
      count: applications.filter((a) => a.status === "NOT_STARTED").length,
      color: "bg-gray-300",
    },
  ];
  const totalAppCount = statusGroups.reduce((s, i) => s + i.count, 0);

  const totalApplied = applications.reduce(
    (sum, a) => sum + (a.scholarship?.amount ?? 0),
    0
  );
  const potentialRemaining = totalApplied - totalAwarded;

  const profile = selectedStudent.studentProfile;
  const schoolName =
    selectedStudent.school?.name ?? profile?.highSchool ?? "Unknown School";
  const avatar = getInitials(selectedStudent.name);
  const stage = getJourneyStageName(profile?.journeyStage);
  const gradeLabel = getGradeLabel(profile?.gradeLevel);
  const status = (profile?.status ?? "ACTIVE") as
    | "ACTIVE"
    | "NEW"
    | "AT_RISK"
    | "INACTIVE"
    | "GRADUATED";

  // Alerts: overdue + upcoming
  const alerts = [
    ...overdueTasks.slice(0, 3).map((t, i) => ({
      id: `o-${i}`,
      type: "overdue" as const,
      title: t.title,
      description: t.dueDate
        ? `Was due ${new Date(t.dueDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
        : "Past due",
      daysOverdue: t.dueDate
        ? Math.round((now.getTime() - new Date(t.dueDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0,
      daysUntil: 0,
    })),
    ...upcomingDeadlines.slice(0, 3).map((t, i) => ({
      id: `u-${i}`,
      type: "upcoming" as const,
      title: t.title,
      description: t.dueDate
        ? `Due ${new Date(t.dueDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
        : "Upcoming",
      daysOverdue: 0,
      daysUntil: t.dueDate
        ? Math.round((new Date(t.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0,
    })),
  ];

  return (
    <div className="space-y-10 pb-8">
      {!bannerDismissed && completionData && completionData.percentage < 100 && (
        <CompletionBanner
          percentage={completionData.percentage}
          incompleteSections={getIncompleteSections(completionData.flags)}
          onDismiss={handleDismissBanner}
        />
      )}

      {/* Page header + student selector */}
      <motion.div
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground font-display">
            Parent Dashboard
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Monitor your child&apos;s college preparation progress
          </p>
        </div>

        {/* Student selector */}
        <div className="relative">
          <button
            onClick={() => setSelectorOpen(!selectorOpen)}
            className="flex items-center gap-3 rounded-2xl bg-card px-4 py-2.5 shadow-lg shadow-black/[0.04] ring-1 ring-white/60 hover:shadow-xl transition-all duration-200"
          >
            <Avatar size="sm">
              {selectedStudent.image && <AvatarImage src={selectedStudent.image} alt={selectedStudent.name ?? selectedStudent.email} />}
              <AvatarFallback className="bg-[#2563EB]/10 text-[#2563EB] text-xs font-semibold">
                {avatar}
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">
                {selectedStudent.name ?? selectedStudent.email}
              </p>
              <p className="text-[11px] text-muted-foreground">{schoolName}</p>
            </div>
            <ChevronDown className="size-4 text-muted-foreground" />
          </button>
          {selectorOpen && students.length > 1 && (
            <div className="absolute right-0 top-full mt-2 w-full rounded-2xl bg-card py-1 shadow-xl shadow-black/[0.08] ring-1 ring-white/60 z-50">
              {students.map((student) => (
                <button
                  key={student.id}
                  onClick={() => {
                    setSelectedStudent(student);
                    setSelectorOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors rounded-xl mx-1"
                >
                  <Avatar size="sm">
                    {student.image && <AvatarImage src={student.image} alt={student.name ?? student.email} />}
                    <AvatarFallback className="bg-[#2563EB]/10 text-[#2563EB] text-xs font-semibold">
                      {getInitials(student.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-foreground">
                    {student.name ?? student.email}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Student profile card */}
      <motion.div
        className="rounded-2xl bg-card p-6 shadow-lg shadow-black/[0.04] ring-1 ring-white/60"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
          <Avatar size="lg" className="size-14">
            {selectedStudent.image && <AvatarImage src={selectedStudent.image} alt={selectedStudent.name ?? selectedStudent.email} />}
            <AvatarFallback className="bg-[#1E3A5F] text-white text-lg font-semibold">
              {avatar}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold text-foreground font-display">
                {selectedStudent.name ?? selectedStudent.email}
              </h2>
              <StatusBadge status={status} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <GraduationCap className="size-3.5" />
                {schoolName}
              </span>
              <span>{gradeLabel}</span>
              {profile?.gpa && <span>GPA: {profile.gpa}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-[#2563EB]/5 px-4 py-2.5">
            <TrendingUp className="size-4 text-[#2563EB]" />
            <div>
              <p className="text-xs text-muted-foreground">Journey Stage</p>
              <p className="text-sm font-bold text-[#1E3A5F]">{stage}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Tasks Completed", value: `${completedTasks}/${totalTasks}`, description: `${completionPercent}% complete`, icon: CheckSquare },
          { title: "Applications Submitted", value: submittedApps, description: `${applications.length} total applications`, icon: FileText },
          { title: "Scholarships Won", value: `$${totalAwarded.toLocaleString()}`, description: `${awardedApps.length} awards received`, icon: DollarSign },
          { title: "Upcoming Deadlines", value: upcomingDeadlines.length, description: "Within the next 14 days", icon: Clock },
        ].map((stat, i) => (
          <StatCard key={stat.title} {...stat} index={i} />
        ))}
      </div>

      {/* Progress overview row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Task completion */}
        <motion.div
          className="rounded-2xl bg-card p-6 shadow-lg shadow-black/[0.04] ring-1 ring-white/60"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Overall Task Completion
          </h3>
          <div className="mt-5 flex items-center justify-center">
            <div className="relative size-36">
              <svg className="size-full -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#f0f0f0"
                  strokeWidth="10"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${completionPercent * 3.14} ${314 - completionPercent * 3.14}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-foreground font-display">
                  {completionPercent}%
                </span>
                <span className="text-[11px] text-muted-foreground">Complete</span>
              </div>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {totalTasks - completedTasks} tasks remaining
          </p>
        </motion.div>

        {/* Applications by status */}
        <motion.div
          className="rounded-2xl bg-card p-6 shadow-lg shadow-black/[0.04] ring-1 ring-white/60"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.48, ease: [0.16, 1, 0.3, 1] }}
        >
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Applications by Status
          </h3>
          <div className="mt-5 space-y-3">
            {statusGroups.map((item) => (
              <div key={item.status} className="flex items-center gap-3">
                <div className={cn("size-2.5 rounded-full", item.color)} />
                <span className="flex-1 text-sm text-muted-foreground">
                  {item.status}
                </span>
                <span className="text-sm font-bold text-foreground">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
          {totalAppCount > 0 && (
            <div className="mt-5 h-3 flex rounded-full overflow-hidden bg-muted">
              {statusGroups.map((item) => (
                <div
                  key={item.status}
                  className={cn("h-full transition-all duration-500", item.color)}
                  style={{
                    width: `${(item.count / totalAppCount) * 100}%`,
                  }}
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* Financial summary */}
        <motion.div
          className="rounded-2xl bg-card p-6 shadow-lg shadow-black/[0.04] ring-1 ring-white/60"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.56, ease: [0.16, 1, 0.3, 1] }}
        >
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Financial Summary
          </h3>
          <div className="mt-5 space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">Total Awarded</p>
              <p className="text-3xl font-bold text-green-600 font-display">
                ${totalAwarded.toLocaleString()}
              </p>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Applied For</p>
                <p className="text-sm font-bold text-foreground">
                  ${totalApplied.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-sm font-bold text-foreground">
                  ${potentialRemaining.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Alerts section */}
      {alerts.length > 0 && (
        <motion.div
          className="rounded-2xl bg-card p-6 shadow-lg shadow-black/[0.04] ring-1 ring-white/60"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
        >
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">
            Alerts &amp; Deadlines
          </h3>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "flex items-start gap-3 rounded-xl px-4 py-3 transition-colors",
                  alert.type === "overdue"
                    ? "bg-red-50 ring-1 ring-red-200/60"
                    : "bg-amber-50 ring-1 ring-amber-200/60"
                )}
              >
                <AlertTriangle
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    alert.type === "overdue"
                      ? "text-red-500"
                      : "text-amber-500"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      alert.type === "overdue"
                        ? "text-red-800"
                        : "text-amber-800"
                    )}
                  >
                    {alert.title}
                  </p>
                  <p
                    className={cn(
                      "text-xs mt-0.5",
                      alert.type === "overdue"
                        ? "text-red-600"
                        : "text-amber-600"
                    )}
                  >
                    {alert.description}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                    alert.type === "overdue"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                  )}
                >
                  {alert.type === "overdue"
                    ? `${alert.daysOverdue}d overdue`
                    : `${alert.daysUntil}d left`}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
