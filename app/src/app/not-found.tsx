import Link from "next/link";
import { GraduationCap, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-8">
      <div className="text-center">
        <div className="w-16 h-16 bg-[#1E3A5F] rounded-2xl flex items-center justify-center mx-auto mb-6">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-6xl font-bold text-[#1A1A1A] mb-4">404</h1>
        <h2 className="text-xl font-semibold text-[#1A1A1A] mb-2">Page not found</h2>
        <p className="text-gray-500 mb-8 max-w-md">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back on track.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-[#1E3A5F] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#162d4a] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
