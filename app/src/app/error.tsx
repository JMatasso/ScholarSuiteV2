"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Something went wrong</h1>
        <p className="text-gray-500 mb-2">
          An unexpected error occurred. Our team has been notified.
        </p>
        {error.message && (
          <p className="text-sm text-gray-400 mb-6 font-mono bg-gray-50 p-3 rounded-lg">
            {error.message}
          </p>
        )}
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 bg-[#1E3A5F] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#162d4a] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}
