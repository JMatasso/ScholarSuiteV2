"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
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
import { DollarSign, FileText, GraduationCap, Trophy } from "@/lib/icons";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs as VercelTabs } from "@/components/ui/vercel-tabs";

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

  const tabItems = [
    { id: "scholarships", label: "Scholarships" },
    { id: "colleges", label: "Colleges" },
    { id: "awards", label: "Awards" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-muted-foreground">Loading applications…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Application Tracking
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View your child&apos;s scholarship and college application status
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { icon: FileText, label: "Total Applications", value: scholarshipApplications.length, valueColor: "text-foreground", bg: "bg-purple-50", iconColor: "text-purple-600" },
          { icon: DollarSign, label: "Total Awarded", value: `$${totalAwarded.toLocaleString()}`, valueColor: "text-green-600", bg: "bg-green-50", iconColor: "text-green-600" },
          { icon: Trophy, label: "Awards Received", value: awards.length, valueColor: "text-foreground", bg: "bg-accent", iconColor: "text-blue-600" },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-xl bg-card p-4 [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] flex items-center gap-3"
            >
              <div className={`flex size-10 items-center justify-center rounded-lg ${card.bg}`}>
                <Icon className={`size-5 ${card.iconColor}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className={`text-xl font-bold ${card.valueColor}`}>
                  {card.value}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="rounded-xl bg-card [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]">
        <VercelTabs
          tabs={tabItems}
          onTabChange={(tabId) => setActiveTab(tabId as Tab)}
          className="border-b border-border px-5 pt-3 pb-[6px]"
        />

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
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No applications found.
                    </TableCell>
                  </TableRow>
                ) : (
                  scholarshipApplications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium text-foreground">
                        {app.scholarship?.name ?? "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={app.status as "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "AWARDED" | "DENIED"} />
                      </TableCell>
                      <TableCell className="text-foreground">
                        {app.scholarship?.amount
                          ? `$${app.scholarship.amount.toLocaleString()}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
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
            <EmptyState
              icon={GraduationCap}
              title="College Applications"
              description="College application tracking is coming soon. Check back later for updates on your child's college applications."
            />
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
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                        No awards yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    awards.map((award) => (
                      <TableRow key={award.id}>
                        <TableCell className="font-medium text-foreground">
                          {award.scholarship?.name ?? "—"}
                        </TableCell>
                        <TableCell className="font-semibold text-green-600">
                          ${(award.amountAwarded ?? award.scholarship?.amount ?? 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
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
