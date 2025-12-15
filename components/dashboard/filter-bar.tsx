"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Download, PanelLeftClose, PanelLeft } from "lucide-react"
import type { PipelineStage } from "@/lib/types"

type ViewMode = "kanban" | "table" | "founders-kanban" | "founders-table"

import { PIPELINE_STAGES } from "@/lib/types"

interface FilterBarProps {
  viewMode: ViewMode
  searchQuery: string
  onSearchChange: (query: string) => void
  founderSearchQuery: string
  onFounderSearchChange: (query: string) => void
  stageFilter: string
  onStageFilterChange: (stage: string) => void
  showOnlyShortlisted: boolean
  onToggleShortlist: () => void
  showFilterPanel: boolean
  onToggleFilterPanel: () => void
  activeFilterCount: number
  onExportCSV: () => void
  onResetFilters: () => void
  hasActiveFilters: boolean
}

export function FilterBar({
  viewMode,
  searchQuery,
  onSearchChange,
  founderSearchQuery,
  onFounderSearchChange,
  stageFilter,
  onStageFilterChange,
  showOnlyShortlisted,
  onToggleShortlist,
  showFilterPanel,
  onToggleFilterPanel,
  activeFilterCount,
  onExportCSV,
  onResetFilters,
  hasActiveFilters,
}: FilterBarProps) {
  return (
    <div className="border-b border-border bg-card px-6 py-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Filter Panel Toggle - Show in table view */}
        {viewMode === "table" && (
          <Button
            variant={showFilterPanel ? "default" : "outline"}
            size="sm"
            onClick={onToggleFilterPanel}
            className="h-9"
          >
            {showFilterPanel ? (
              <PanelLeftClose className="w-4 h-4 mr-2" />
            ) : (
              <PanelLeft className="w-4 h-4 mr-2" />
            )}
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1.5 bg-primary-foreground text-primary rounded-full px-1.5 py-0.5 text-xs">
                {activeFilterCount}
              </span>
            )}
          </Button>
        )}

        {/* Search */}
        <div className="flex-1 min-w-[200px] max-w-md">
          {(viewMode === "founders-kanban" || viewMode === "founders-table") ? (
            <Input
              placeholder="Search founders by name, company, education..."
              value={founderSearchQuery}
              onChange={(e) => onFounderSearchChange(e.target.value)}
              className="h-9 text-sm"
            />
          ) : (
            <Input
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-9 text-sm"
            />
          )}
        </div>

        {/* Pipeline Stage Filter - Only show in Kanban view */}
        {viewMode === "kanban" && (
          <div className="w-[180px]">
            <select
              value={stageFilter}
              onChange={(e) => onStageFilterChange(e.target.value)}
              className="w-full h-9 text-sm border border-border rounded px-3 bg-background"
            >
              <option value="">All Stages</option>
              {PIPELINE_STAGES.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* My Shortlist Toggle - Show in kanban and table views */}
        {(viewMode === "kanban" || viewMode === "table") && (
          <Button
            variant={showOnlyShortlisted ? "default" : "outline"}
            size="sm"
            onClick={onToggleShortlist}
            className="h-9"
          >
            ⭐ My Shortlist
          </Button>
        )}

        {/* Export CSV - Show in table view */}
        {viewMode === "table" && (
          <Button variant="outline" size="sm" onClick={onExportCSV} className="h-9">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        )}

        {/* Reset Button */}
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={onResetFilters} className="h-9">
            Reset Filters
          </Button>
        )}
      </div>
    </div>
  )
}
