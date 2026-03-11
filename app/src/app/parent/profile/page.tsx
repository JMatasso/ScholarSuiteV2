"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  User,
  GraduationCap,
  Globe,
  Target,
  TrendingUp,
  BookOpen,
  MapPin,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";

// Mock profile data
const studentProfile = {
  personal: {
    firstName: "Alex",
    lastName: "Johnson",
    email: "alex.johnson@email.com",
    phone: "(555) 234-5678",
    dateOfBirth: "August 15, 2009",
    address: "1234 Oak Street, Springfield, IL 62701",
    gender: "Male",
    ethnicity: "African American",
  },
  academic: {
    school: "Lincoln High School",
    grade: "11th Grade",
    gpa: 3.7,
    classRank: "42 / 320",
    satScore: "1280 (Target: 1350)",
    actScore: "Not yet taken",
    apCourses: ["AP English Language", "AP US History", "AP Biology"],
    honors: ["National Honor Society", "Principal's Honor Roll"],
  },
  background: {
    firstGeneration: true,
    householdIncome: "Under $60,000",
    familySize: 4,
    citizenship: "US Citizen",
    languages: ["English", "Spanish"],
  },
  goals: {
    careerInterests: ["Computer Science", "Engineering"],
    collegeType: "4-Year University",
    preferredRegion: "Midwest",
    targetSchools: [
      "University of Illinois",
      "Purdue University",
      "Northwestern University",
    ],
    financialAidNeeded: true,
  },
  journeyStage: "Active Prep",
  profileCompletion: 78,
};

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

function InfoRow({ label, value }: { label: string; value: string | React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2">
      <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>
      <span className="text-sm text-gray-700">{typeof value === "string" ? value : value}</span>
    </div>
  );
}

export default function StudentProfilePage() {
  const { profileCompletion } = studentProfile;
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (profileCompletion / 100) * circumference;

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
                AJ
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {studentProfile.personal.firstName}{" "}
                {studentProfile.personal.lastName}
              </h2>
              <p className="text-sm text-gray-500">
                {studentProfile.academic.school}
              </p>
              <p className="text-sm text-gray-400">
                {studentProfile.academic.grade} &middot; GPA{" "}
                {studentProfile.academic.gpa}
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
              <p className="text-lg font-semibold text-[#1E3A5F]">
                {studentProfile.journeyStage}
              </p>
            </div>
          </div>
          <div className="mt-3 flex gap-1">
            {["Onboarding", "Active Prep", "Application", "Decision"].map(
              (stage, i) => (
                <div
                  key={stage}
                  className={cn(
                    "h-1.5 flex-1 rounded-full",
                    i <= 1 ? "bg-[#2563EB]" : "bg-gray-200"
                  )}
                />
              )
            )}
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-gray-400">
            <span>Onboarding</span>
            <span>Decision</span>
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
            <InfoRow label="Full Name" value={`${studentProfile.personal.firstName} ${studentProfile.personal.lastName}`} />
            <InfoRow label="Date of Birth" value={studentProfile.personal.dateOfBirth} />
            <InfoRow
              label="Email"
              value={
                <span className="flex items-center gap-1.5">
                  <Mail className="size-3 text-gray-400" />
                  {studentProfile.personal.email}
                </span>
              }
            />
            <InfoRow
              label="Phone"
              value={
                <span className="flex items-center gap-1.5">
                  <Phone className="size-3 text-gray-400" />
                  {studentProfile.personal.phone}
                </span>
              }
            />
            <InfoRow label="Gender" value={studentProfile.personal.gender} />
            <InfoRow label="Ethnicity" value={studentProfile.personal.ethnicity} />
            <div className="col-span-2">
              <InfoRow
                label="Address"
                value={
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3 text-gray-400" />
                    {studentProfile.personal.address}
                  </span>
                }
              />
            </div>
          </div>
        </ProfileSection>

        {/* Academic Info */}
        <ProfileSection title="Academic Information" icon={GraduationCap}>
          <div className="grid grid-cols-2 gap-x-6">
            <InfoRow label="School" value={studentProfile.academic.school} />
            <InfoRow label="Grade" value={studentProfile.academic.grade} />
            <InfoRow label="GPA" value={String(studentProfile.academic.gpa)} />
            <InfoRow label="Class Rank" value={studentProfile.academic.classRank} />
            <InfoRow label="SAT Score" value={studentProfile.academic.satScore} />
            <InfoRow label="ACT Score" value={studentProfile.academic.actScore} />
            <div className="col-span-2">
              <InfoRow
                label="AP Courses"
                value={studentProfile.academic.apCourses.join(", ")}
              />
            </div>
            <div className="col-span-2">
              <InfoRow
                label="Honors & Awards"
                value={studentProfile.academic.honors.join(", ")}
              />
            </div>
          </div>
        </ProfileSection>

        {/* Background */}
        <ProfileSection title="Background" icon={Globe}>
          <div className="grid grid-cols-2 gap-x-6">
            <InfoRow
              label="First Generation"
              value={studentProfile.background.firstGeneration ? "Yes" : "No"}
            />
            <InfoRow label="Citizenship" value={studentProfile.background.citizenship} />
            <InfoRow
              label="Household Income"
              value={studentProfile.background.householdIncome}
            />
            <InfoRow
              label="Family Size"
              value={String(studentProfile.background.familySize)}
            />
            <div className="col-span-2">
              <InfoRow
                label="Languages"
                value={studentProfile.background.languages.join(", ")}
              />
            </div>
          </div>
        </ProfileSection>

        {/* Goals */}
        <ProfileSection title="Goals & Preferences" icon={Target}>
          <div className="grid grid-cols-2 gap-x-6">
            <InfoRow
              label="Career Interests"
              value={studentProfile.goals.careerInterests.join(", ")}
            />
            <InfoRow label="College Type" value={studentProfile.goals.collegeType} />
            <InfoRow
              label="Preferred Region"
              value={studentProfile.goals.preferredRegion}
            />
            <InfoRow
              label="Financial Aid Needed"
              value={studentProfile.goals.financialAidNeeded ? "Yes" : "No"}
            />
            <div className="col-span-2">
              <InfoRow
                label="Target Schools"
                value={
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {studentProfile.goals.targetSchools.map((school) => (
                      <span
                        key={school}
                        className="inline-flex items-center rounded-md bg-[#1E3A5F]/5 px-2 py-0.5 text-xs font-medium text-[#1E3A5F] ring-1 ring-inset ring-[#1E3A5F]/10"
                      >
                        {school}
                      </span>
                    ))}
                  </div>
                }
              />
            </div>
          </div>
        </ProfileSection>
      </div>
    </div>
  );
}
