"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DollarSign, FileText, GraduationCap, Trophy } from "lucide-react";

// Mock data
const scholarshipApplications = [
  {
    id: "1",
    name: "Gates Millennium Scholarship",
    status: "SUBMITTED" as const,
    amount: "$10,000",
    deadline: "Mar 15, 2026",
    submittedDate: "Feb 28, 2026",
  },
  {
    id: "2",
    name: "National Merit Scholarship",
    status: "IN_PROGRESS" as const,
    amount: "$2,500",
    deadline: "Apr 1, 2026",
    submittedDate: null,
  },
  {
    id: "3",
    name: "Local Community Foundation Grant",
    status: "AWARDED" as const,
    amount: "$1,500",
    deadline: "Jan 31, 2026",
    submittedDate: "Jan 15, 2026",
  },
  {
    id: "4",
    name: "STEM Leaders Scholarship",
    status: "SUBMITTED" as const,
    amount: "$5,000",
    deadline: "Mar 30, 2026",
    submittedDate: "Mar 1, 2026",
  },
  {
    id: "5",
    name: "First Generation College Fund",
    status: "AWARDED" as const,
    amount: "$1,000",
    deadline: "Feb 15, 2026",
    submittedDate: "Jan 20, 2026",
  },
  {
    id: "6",
    name: "Springfield Excellence Award",
    status: "DENIED" as const,
    amount: "$3,000",
    deadline: "Feb 1, 2026",
    submittedDate: "Jan 10, 2026",
  },
  {
    id: "7",
    name: "Future Engineers Scholarship",
    status: "NOT_STARTED" as const,
    amount: "$2,000",
    deadline: "May 1, 2026",
    submittedDate: null,
  },
  {
    id: "8",
    name: "Diversity in Tech Award",
    status: "IN_PROGRESS" as const,
    amount: "$4,000",
    deadline: "Apr 15, 2026",
    submittedDate: null,
  },
];

const collegeApplications = [
  {
    id: "1",
    school: "University of Illinois",
    type: "Public",
    status: "SUBMITTED" as const,
    deadline: "Jan 15, 2026",
  },
  {
    id: "2",
    school: "Purdue University",
    type: "Public",
    status: "IN_PROGRESS" as const,
    deadline: "Feb 1, 2026",
  },
  {
    id: "3",
    school: "Northwestern University",
    type: "Private",
    status: "NOT_STARTED" as const,
    deadline: "Jan 1, 2026",
  },
];

const awards = [
  { name: "Local Community Foundation Grant", amount: 1500, date: "Feb 10, 2026" },
  { name: "First Generation College Fund", amount: 1000, date: "Mar 1, 2026" },
];

const totalAwarded = awards.reduce((sum, a) => sum + a.amount, 0);

type Tab = "scholarships" | "colleges" | "awards";

export default function ApplicationsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("scholarships");

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "scholarships", label: "Scholarships", icon: FileText },
    { key: "colleges", label: "Colleges", icon: GraduationCap },
    { key: "awards", label: "Awards", icon: Trophy },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Application Tracking
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          View Alex&apos;s scholarship and college application status
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-4 ring-1 ring-gray-200/60 shadow-sm flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-purple-50">
            <FileText className="size-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Total Applications</p>
            <p className="text-xl font-bold text-gray-900">
              {scholarshipApplications.length + collegeApplications.length}
            </p>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 ring-1 ring-gray-200/60 shadow-sm flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-green-50">
            <DollarSign className="size-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Total Awarded</p>
            <p className="text-xl font-bold text-green-600">
              ${totalAwarded.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 ring-1 ring-gray-200/60 shadow-sm flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50">
            <Trophy className="size-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Awards Received</p>
            <p className="text-xl font-bold text-gray-900">{awards.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-xl bg-white ring-1 ring-gray-200/60 shadow-sm">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab.key
                  ? "border-[#1E3A5F] text-[#1E3A5F]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              <tab.icon className="size-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* Scholarships tab */}
          {activeTab === "scholarships" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scholarship Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scholarshipApplications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium text-gray-900">
                      {app.name}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={app.status} />
                    </TableCell>
                    <TableCell className="text-gray-700">{app.amount}</TableCell>
                    <TableCell className="text-gray-500">{app.deadline}</TableCell>
                    <TableCell className="text-gray-500">
                      {app.submittedDate || "--"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Colleges tab */}
          {activeTab === "colleges" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Deadline</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collegeApplications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium text-gray-900">
                      {app.school}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-200">
                        {app.type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={app.status} />
                    </TableCell>
                    <TableCell className="text-gray-500">{app.deadline}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Awards tab */}
          {activeTab === "awards" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 p-4 ring-1 ring-green-200/60">
                <p className="text-sm text-green-700">Total Scholarship Awards</p>
                <p className="text-3xl font-bold text-green-700 mt-1">
                  ${totalAwarded.toLocaleString()}
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Award Name</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date Awarded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {awards.map((award, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-gray-900">
                        {award.name}
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        ${award.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {award.date}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
