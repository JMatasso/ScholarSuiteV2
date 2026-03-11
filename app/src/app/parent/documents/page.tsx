"use client";

import React, { useEffect, useState } from "react";
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
  BookOpen,
  Lock,
} from "lucide-react";

interface Document {
  id: string;
  name: string;
  type: string;
  createdAt: string;
}

const typeColors: Record<string, string> = {
  TRANSCRIPT: "bg-purple-50 text-purple-700",
  LETTER: "bg-green-50 text-green-700",
  FINANCIAL: "bg-red-50 text-red-700",
  IDENTIFICATION: "bg-blue-50 text-blue-700",
  OTHER: "bg-gray-50 text-gray-600",
};

function typeLabel(type: string) {
  const map: Record<string, string> = {
    TRANSCRIPT: "Transcript",
    LETTER: "Letter",
    FINANCIAL: "Financial",
    IDENTIFICATION: "ID",
    OTHER: "Other",
  };
  return map[type] ?? type;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/documents")
      .then((r) => r.json())
      .then((d) => {
        setDocuments(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-gray-400">Loading documents…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Documents &amp; Resources
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          View your child&apos;s documents
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
            {documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-gray-400 py-8">
                  No documents found.
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <File className="size-4 text-gray-400" />
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
                      {typeLabel(doc.type)}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {new Date(doc.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Learning Progress placeholder */}
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
              Your child&apos;s module completion
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-400 text-center py-6">
          Learning progress data will appear here once modules are completed.
        </p>
      </div>
    </div>
  );
}
