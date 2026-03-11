"use client";

import React, { useState, useEffect } from "react";
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

interface Scholarship {
  name: string;
  amount?: number;
  deadline?: string;
}

interface ScholarshipApplication {
  id: string;
  status: string;
  scholarship?: Scholarship;
  amountAwarded?: number;
  updatedAt?: string;
  createdAt?: string;
}

type Tab = "scholarships" | "colleges" | "awards";

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ScholarshipApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("scholarships");

  useEffect(() => {
    fetch("/api/applications")
      .then((r) => r.json())
      .then((d) => {
        setApplications(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const scholarshipApplications = applications;
  const awards = applications.filter((a) => a.status === "AWARDED");
  const totalAwarded = awards.reduce(
    (sum, a) => sum + (a.amountAwarded ?? a.scholarship?.amount ?? 0),
    0
  );

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "scholarships", label: "Scholarships", icon: FileText },
    { key: "colleges", label: "Colleges", icon: GraduationCap },
    { key: "awards", label: "Awards", icon: Trophy },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-gray-400">Loading applications…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Application Tracking
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          View your child&apos;s scholarship and college application status
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
              {scholarshipApplications.length}
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {scholarshipApplications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-400 py-8">
                      No applications found.
                    </TableCell>
                  </TableRow>
                ) : (
                  scholarshipApplications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium text-gray-900">
                        {app.scholarship?.name ?? "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={app.status as "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "AWARDED" | "DENIED"} />
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {app.scholarship?.amount
                          ? `$${app.scholarship.amount.toLocaleString()}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {app.scholarship?.deadline
                          ? new Date(app.scholarship.deadline).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {/* Colleges tab */}
          {activeTab === "colleges" && (
            <div className="py-8 text-center text-sm text-gray-400">
              College application tracking coming soon.
            </div>
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
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {awards.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-400 py-8">
                        No awards yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    awards.map((award) => (
                      <TableRow key={award.id}>
                        <TableCell className="font-medium text-gray-900">
                          {award.scholarship?.name ?? "—"}
                        </TableCell>
                        <TableCell className="font-semibold text-green-600">
                          ${(award.amountAwarded ?? award.scholarship?.amount ?? 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {award.updatedAt
                            ? new Date(award.updatedAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
