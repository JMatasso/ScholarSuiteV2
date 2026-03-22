import { GraduationCap } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 bg-[#1E3A5F] rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <div className="flex gap-1 justify-center">
          <div className="w-2 h-2 bg-[#2563EB] rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-[#2563EB] rounded-full animate-bounce [animation-delay:0.2s]" />
          <div className="w-2 h-2 bg-[#2563EB] rounded-full animate-bounce [animation-delay:0.4s]" />
        </div>
      </div>
    </div>
  );
}
