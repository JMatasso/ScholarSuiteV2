"use client"

import { GraduationCap, MapPin, Users, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  formatTuition,
  formatAcceptanceRate,
  getCollegeTypeLabel,
} from "@/lib/college-utils"
import type { College } from "./types"

interface CollegeCardProps {
  college: College
  isComparing: boolean
  compareCount: number
  onToggleCompare: (id: string) => void
  onViewDetail: (college: College) => void
  onAddToList: (college: College) => void
}

export function CollegeCard({
  college,
  isComparing,
  compareCount,
  onToggleCompare,
  onViewDetail,
  onAddToList,
}: CollegeCardProps) {
  return (
    <Card
      className="hover:shadow-sm transition-shadow cursor-pointer group"
      onClick={() => onViewDetail(college)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-secondary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm truncate">{college.name}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {college.city}, {college.state}
              </p>
            </div>
          </div>
          <label
            className="flex items-center gap-1.5 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={isComparing}
              onCheckedChange={() => onToggleCompare(college.id)}
              disabled={!isComparing && compareCount >= 4}
            />
            <span className="text-[10px] text-muted-foreground">Compare</span>
          </label>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {college.type && (
            <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-accent text-blue-700">
              {getCollegeTypeLabel(college.type)}
            </span>
          )}
          {college.hbcu && (
            <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-purple-50 text-purple-700">
              HBCU
            </span>
          )}
          {college.testOptional && (
            <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-emerald-50 text-emerald-700">
              Test Optional
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Acceptance</span>
            <p className="font-medium">{formatAcceptanceRate(college.acceptanceRate ?? null)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">In-State</span>
            <p className="font-medium">{formatTuition(college.inStateTuition ?? null)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Out-of-State</span>
            <p className="font-medium">{formatTuition(college.outOfStateTuition ?? null)}</p>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Enrollment</span>
            <p className="font-medium ml-auto">
              {college.enrollment?.toLocaleString() ?? "N/A"}
            </p>
          </div>
        </div>

        {college.studentFacultyRatio != null && (
          <p className="text-xs text-muted-foreground">
            Student-Faculty Ratio: <span className="font-medium text-foreground">{college.studentFacultyRatio}:1</span>
          </p>
        )}

        <div className="pt-1 border-t border-border">
          <Button
            size="sm"
            className="w-full gap-1 text-xs h-7"
            onClick={(e) => {
              e.stopPropagation()
              onAddToList(college)
            }}
          >
            <Plus className="h-3 w-3" />
            Add to My List
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
