"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  File,
  Image,
  BookOpen,
  CheckCircle2,
  Clock,
  Lock,
} from "lucide-react";

// Mock documents
const documents = [
  {
    id: "1",
    name: "Official High School Transcript",
    type: "Transcript",
    date: "Jan 10, 2026",
    icon: FileText,
  },
  {
    id: "2",
    name: "SAT Score Report",
    type: "Test Scores",
    date: "Feb 5, 2026",
    icon: File,
  },
  {
    id: "3",
    name: "Letter of Recommendation - Ms. Carter",
    type: "Recommendation",
    date: "Feb 15, 2026",
    icon: FileText,
  },
  {
    id: "4",
    name: "Personal Statement Draft v2",
    type: "Essay",
    date: "Feb 28, 2026",
    icon: File,
  },
  {
    id: "5",
    name: "Gates Scholarship Essay Draft",
    type: "Essay",
    date: "Mar 5, 2026",
    icon: File,
  },
  {
    id: "6",
    name: "Financial Aid Verification",
    type: "Financial",
    date: "Mar 8, 2026",
    icon: FileText,
  },
  {
    id: "7",
    name: "Community Service Hours Log",
    type: "Activities",
    date: "Mar 1, 2026",
    icon: FileText,
  },
  {
    id: "8",
    name: "Student ID Photo",
    type: "Photo",
    date: "Jan 5, 2026",
    icon: Image,
  },
];

// Mock learning modules
const learningModules = [
  {
    id: "1",
    name: "College Application Basics",
    description: "Understanding the college application process",
    completion: 100,
    totalLessons: 8,
    completedLessons: 8,
  },
  {
    id: "2",
    name: "SAT Preparation Module 1",
    description: "Math fundamentals and practice tests",
    completion: 100,
    totalLessons: 12,
    completedLessons: 12,
  },
  {
    id: "3",
    name: "SAT Preparation Module 2",
    description: "Reading comprehension and writing strategies",
    completion: 100,
    totalLessons: 10,
    completedLessons: 10,
  },
  {
    id: "4",
    name: "Essay Writing Workshop",
    description: "Crafting compelling personal statements",
    completion: 65,
    totalLessons: 6,
    completedLessons: 4,
  },
  {
    id: "5",
    name: "Financial Aid & Scholarships",
    description: "Navigating financial aid applications and scholarships",
    completion: 40,
    totalLessons: 10,
    completedLessons: 4,
  },
  {
    id: "6",
    name: "Interview Preparation",
    description: "Preparing for college and scholarship interviews",
    completion: 0,
    totalLessons: 5,
    completedLessons: 0,
  },
];

const typeColors: Record<string, string> = {
  Transcript: "bg-purple-50 text-purple-700",
  "Test Scores": "bg-blue-50 text-blue-700",
  Recommendation: "bg-green-50 text-green-700",
  Essay: "bg-amber-50 text-amber-700",
  Financial: "bg-red-50 text-red-700",
  Activities: "bg-teal-50 text-teal-700",
  Photo: "bg-pink-50 text-pink-700",
};

export default function DocumentsPage() {
  const overallProgress = Math.round(
    (learningModules.reduce((sum, m) => sum + m.completedLessons, 0) /
      learningModules.reduce((sum, m) => sum + m.totalLessons, 0)) *
      100
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Documents & Resources
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          View Alex&apos;s documents and learning progress
        </p>
      </div>

      {/* Documents section */}
      <div className="rounded-xl bg-white p-5 ring-1 ring-gray-200/60 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#1E3A5F]/10">
            <FileText className="size-4 text-[#1E3A5F]" />
          </div>
          <h3 className="text-sm font-semibold text-gray-700">
            Student Documents
          </h3>
          <span className="ml-auto flex items-center gap-1 text-xs text-gray-400">
            <Lock className="size-3" />
            Read-only
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date Added</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => {
              const DocIcon = doc.icon;
              return (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <DocIcon className="size-4 text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {doc.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
                        typeColors[doc.type] || "bg-gray-50 text-gray-600"
                      )}
                    >
                      {doc.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-500">{doc.date}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Learning Progress section */}
      <div className="rounded-xl bg-white p-5 ring-1 ring-gray-200/60 shadow-sm" id="progress">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#2563EB]/10">
            <BookOpen className="size-4 text-[#2563EB]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700">
              Learning Progress
            </h3>
            <p className="text-xs text-gray-400">
              Overall: {overallProgress}% complete
            </p>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="mb-6">
          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#2563EB] transition-all"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        {/* Module list */}
        <div className="space-y-3">
          {learningModules.map((module) => (
            <div
              key={module.id}
              className="rounded-lg border border-gray-100 p-4 hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {module.completion === 100 ? (
                      <CheckCircle2 className="size-4 text-green-500 shrink-0" />
                    ) : module.completion > 0 ? (
                      <Clock className="size-4 text-blue-500 shrink-0" />
                    ) : (
                      <div className="size-4 rounded-full border-2 border-gray-300 shrink-0" />
                    )}
                    <p className="text-sm font-medium text-gray-900">
                      {module.name}
                    </p>
                  </div>
                  <p className="mt-0.5 ml-6 text-xs text-gray-500">
                    {module.description}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {module.completion}%
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {module.completedLessons}/{module.totalLessons} lessons
                  </p>
                </div>
              </div>
              <div className="mt-2 ml-6 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    module.completion === 100
                      ? "bg-green-500"
                      : module.completion > 0
                        ? "bg-[#2563EB]"
                        : "bg-gray-200"
                  )}
                  style={{ width: `${module.completion}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
