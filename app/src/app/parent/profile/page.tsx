"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  User,
  GraduationCap,
  Globe,
  Target,
  TrendingUp,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

interface StudentProfile {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  dateOfBirth?: string;
  gpa?: number;
  gradeLevel?: number;
  highSchool?: string;
  graduationYear?: number;
  satScore?: number;
  actScore?: number;
  intendedMajor?: string;
  ethnicity?: string;
  citizenship?: string;
  isFirstGen?: boolean;
  isPellEligible?: boolean;
  hasFinancialNeed?: boolean;
  journeyStage?: string;
  postSecondaryPath?: string;
  personalComplete?: boolean;
  academicComplete?: boolean;
  backgroundComplete?: boolean;
  financialComplete?: boolean;
  activitiesComplete?: boolean;
  goalsComplete?: boolean;
}

interface Student {
  id: string;
  name?: string;
  email: string;
  studentProfile?: StudentProfile;
  school?: { name: string };
}

function getInitials(name?: string) {
  if (!name) return "??";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getJourneyStageIndex(stage?: string) {
  const stages = [
    "EARLY_EXPLORATION",
    "ACTIVE_PREP",
    "APPLICATION_PHASE",
    "POST_ACCEPTANCE",
  ];
  return stages.indexOf(stage ?? "") ?? 0;
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

function computeProfileCompletion(profile?: StudentProfile): number {
  if (!profile) return 0;
  const flags = [
    profile.personalComplete,
    profile.academicComplete,
    profile.backgroundComplete,
    profile.financialComplete,
    profile.activitiesComplete,
    profile.goalsComplete,
  ];
  const done = flags.filter(Boolean).length;
  return Math.round((done / flags.length) * 100);
}

function ProfileSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white p-5 ring-1 ring-gray-200/60 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-[#1E3A5F]/10">
          <Icon className="size-4 text-[#1E3A5F]" />
        </div>
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 py-2">
      <span className="text-xs text-gray-400 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-sm text-gray-700">
        {typeof value === "string" ? value : value}
      </span>
    </div>
  );
}

export default function StudentProfilePage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/students")
      .then((r) => r.json())
      .then((d: Student[]) => {
        const list = Array.isArray(d) ? d : [];
        setStudent(list[0] ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-gray-400">Loading profile…</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-gray-400">No linked student found.</p>
      </div>
    );
  }

  const profile = student.studentProfile;
  const profileCompletion = computeProfileCompletion(profile);
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (profileCompletion / 100) * circumference;

  const fullName =
    profile?.firstName && profile?.lastName
      ? `${profile.firstName} ${profile.lastName}`
      : student.name ?? student.email;

  const schoolName =
    student.school?.name ?? profile?.highSchool ?? "Unknown School";
  const gradeLabel = getGradeLabel(profile?.gradeLevel);
  const stage = getJourneyStageName(profile?.journeyStage);
  const stageIndex = getJourneyStageIndex(profile?.journeyStage);
  const stageLabels = [
    "Early Exploration",
    "Active Prep",
    "Application Phase",
    "Post Acceptance",
  ];

  const addressParts = [
    profile?.address,
    profile?.city,
    profile?.state,
    profile?.zipCode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Student Profile
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Read-only view of your child&apos;s profile information
        </p>
      </div>

      {/* Top row: avatar card + journey + completion */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Student card */}
        <div className="rounded-xl bg-white p-5 ring-1 ring-gray-200/60 shadow-sm">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarFallback className="bg-[#1E3A5F] text-white text-xl font-semibold">
                {getInitials(student.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{fullName}</h2>
              <p className="text-sm text-gray-500">{schoolName}</p>
              <p className="text-sm text-gray-400">
                {gradeLabel}
                {profile?.gpa ? ` · GPA ${profile.gpa}` : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Journey stage */}
        <div className="rounded-xl bg-white p-5 ring-1 ring-gray-200/60 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-[#2563EB]/10">
              <TrendingUp className="size-5 text-[#2563EB]" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Journey Stage</p>
              <p className="text-lg font-semibold text-[#1E3A5F]">{stage}</p>
            </div>
          </div>
          <div className="mt-3 flex gap-1">
            {stageLabels.map((s, i) => (
              <div
                key={s}
                className={cn(
                  "h-1.5 flex-1 rounded-full",
                  i <= stageIndex ? "bg-[#2563EB]" : "bg-gray-200"
                )}
              />
            ))}
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-gray-400">
            <span>Early Exploration</span>
            <span>Post Acceptance</span>
          </div>
        </div>

        {/* Profile completion ring */}
        <div className="rounded-xl bg-white p-5 ring-1 ring-gray-200/60 shadow-sm flex flex-col items-center justify-center">
          <div className="relative size-24">
            <svg className="size-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#f0f0f0"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#2563EB"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-gray-900">
                {profileCompletion}%
              </span>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">Profile Completion</p>
        </div>
      </div>

      {/* Profile sections */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Personal Info */}
        <ProfileSection title="Personal Information" icon={User}>
          <div className="grid grid-cols-2 gap-x-6">
            <InfoRow label="Full Name" value={fullName} />
            <InfoRow
              label="Date of Birth"
              value={
                profile?.dateOfBirth
                  ? new Date(profile.dateOfBirth).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "—"
              }
            />
            <InfoRow
              label="Email"
              value={
                <span className="flex items-center gap-1.5">
                  <Mail className="size-3 text-gray-400" />
                  {student.email}
                </span>
              }
            />
            <InfoRow
              label="Phone"
              value={
                profile?.phone ? (
                  <span className="flex items-center gap-1.5">
                    <Phone className="size-3 text-gray-400" />
                    {profile.phone}
                  </span>
                ) : (
                  "—"
                )
              }
            />
            <div className="col-span-2">
              <InfoRow
                label="Address"
                value={
                  addressParts ? (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="size-3 text-gray-400" />
                      {addressParts}
                    </span>
                  ) : (
                    "—"
                  )
                }
              />
            </div>
            {profile?.ethnicity && (
              <InfoRow label="Ethnicity" value={profile.ethnicity} />
            )}
          </div>
        </ProfileSection>

        {/* Academic Info */}
        <ProfileSection title="Academic Information" icon={GraduationCap}>
          <div className="grid grid-cols-2 gap-x-6">
            <InfoRow label="School" value={schoolName} />
            <InfoRow label="Grade" value={gradeLabel} />
            <InfoRow
              label="GPA"
              value={profile?.gpa ? String(profile.gpa) : "—"}
            />
            <InfoRow
              label="Graduation Year"
              value={
                profile?.graduationYear ? String(profile.graduationYear) : "—"
              }
            />
            <InfoRow
              label="SAT Score"
              value={profile?.satScore ? String(profile.satScore) : "Not taken"}
            />
            <InfoRow
              label="ACT Score"
              value={profile?.actScore ? String(profile.actScore) : "Not taken"}
            />
            {profile?.intendedMajor && (
              <div className="col-span-2">
                <InfoRow label="Intended Major" value={profile.intendedMajor} />
              </div>
            )}
          </div>
        </ProfileSection>

        {/* Background */}
        <ProfileSection title="Background" icon={Globe}>
          <div className="grid grid-cols-2 gap-x-6">
            <InfoRow
              label="First Generation"
              value={profile?.isFirstGen ? "Yes" : "No"}
            />
            <InfoRow
              label="Citizenship"
              value={profile?.citizenship ?? "—"}
            />
            <InfoRow
              label="Financial Need"
              value={profile?.hasFinancialNeed ? "Yes" : "No"}
            />
            <InfoRow
              label="Pell Eligible"
              value={profile?.isPellEligible ? "Yes" : "No"}
            />
          </div>
        </ProfileSection>

        {/* Goals */}
        <ProfileSection title="Goals &amp; Preferences" icon={Target}>
          <div className="grid grid-cols-2 gap-x-6">
            <InfoRow
              label="Path"
              value={profile?.postSecondaryPath ?? "—"}
            />
            <InfoRow
              label="Intended Major"
              value={profile?.intendedMajor ?? "—"}
            />
          </div>
        </ProfileSection>
      </div>
    </div>
  );
}
