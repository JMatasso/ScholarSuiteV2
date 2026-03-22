"use client"

import { useState } from "react"
import { Plus, GraduationCap } from "@/lib/icons"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import {
  KanbanColumn, COLUMNS, FILTER_OPTIONS,
  type CollegeApp, type AppStatus,
} from "@/components/college-kanban"
import { CollegeAppDetail } from "@/components/college-app-detail"

interface ApplicationsTabProps {
  apps: CollegeApp[]
  onStatusChange: (id: string, status: AppStatus) => void
  onUpdate: (id: string, data: Partial<CollegeApp>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onRefresh: () => void
  onAddOpen: () => void
}

export function ApplicationsTab({
  apps,
  onStatusChange,
  onUpdate,
  onDelete,
  onRefresh,
  onAddOpen,
}: ApplicationsTabProps) {
  const [filter, setFilter] = useState("ALL")
  const [selectedApp, setSelectedApp] = useState<CollegeApp | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const filtered = filter === "ALL" ? apps : apps.filter((a) => a.applicationType === filter)

  const handleCardClick = (app: CollegeApp) => {
    setSelectedApp(app)
    setDetailOpen(true)
  }

  // Keep selectedApp in sync
  const syncedApp = selectedApp ? apps.find((a) => a.id === selectedApp.id) ?? selectedApp : null

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-2">
        <Select value={filter} onValueChange={(v) => v && setFilter(v)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILTER_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Kanban or empty */}
      {apps.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No colleges yet"
          description="Start adding colleges you're interested in to track your applications."
          action={
            <Button className="gap-2" onClick={onAddOpen}>
              <Plus className="h-4 w-4" /> Add College
            </Button>
          }
        />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const colApps = filtered.filter((a) =>
              col.key === "WAITLISTED"
                ? a.status === "WAITLISTED" || a.status === "DEFERRED"
                : a.status === col.key
            )
            return (
              <KanbanColumn
                key={col.key}
                column={col}
                apps={colApps}
                onStatusChange={onStatusChange}
                onCardClick={handleCardClick}
              />
            )
          })}
        </div>
      )}

      {/* Detail panel */}
      {syncedApp && (
        <CollegeAppDetail
          app={syncedApp}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onRefresh={onRefresh}
        />
      )}
    </div>
  )
}
