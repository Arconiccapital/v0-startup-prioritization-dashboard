"use client"

import { KanbanBoard } from "@/components/kanban-board"
import { StartupTable } from "@/components/startup-table"
import { FoundersTable } from "@/components/founders-table"
import { FounderKanbanBoard } from "@/components/founder-kanban-board"
import { FilterPanel } from "@/components/filter-panel"
import type { Startup, PipelineStage, Founder } from "@/lib/types"
import type { FilterCondition } from "@/lib/filter-store"

type ViewMode = "kanban" | "table" | "founders-kanban" | "founders-table"

interface MainContentProps {
  viewMode: ViewMode
  isLoading: boolean
  limit: number
  // Startups props
  filteredStartups: Startup[]
  onSelectStartup: (startup: Startup) => void
  onMoveStartup: (startupId: string, newStage: PipelineStage) => void
  onViewStage: (stage: PipelineStage) => void
  onMoveToPortfolio: (startup: Startup) => void
  portfolioInvestmentIds: string[]
  onToggleShortlist: (startupId: string, shortlisted: boolean) => void
  shortlistLoading: Set<string>
  // Founders props
  founders: Founder[]
  foundersLoading: boolean
  onSelectFounder: (founder: Founder) => void
  onMoveFounder: (founderId: string, newStage: PipelineStage, isLegacy: boolean) => void
  onFounderViewStage: (stage: PipelineStage) => void
  onSelectCompanyFromFounders: (companyId: string) => void
  onFounderOutreach: (founder: Founder) => void
  // Filter panel props
  showFilterPanel: boolean
  activeFilterIds: string[]
  onActiveFiltersChange: (ids: string[]) => void
  onAskAI: (query: string) => Promise<FilterCondition[]>
}

export function MainContent({
  viewMode,
  isLoading,
  limit,
  filteredStartups,
  onSelectStartup,
  onMoveStartup,
  onViewStage,
  onMoveToPortfolio,
  portfolioInvestmentIds,
  onToggleShortlist,
  shortlistLoading,
  founders,
  foundersLoading,
  onSelectFounder,
  onMoveFounder,
  onFounderViewStage,
  onSelectCompanyFromFounders,
  onFounderOutreach,
  showFilterPanel,
  activeFilterIds,
  onActiveFiltersChange,
  onAskAI,
}: MainContentProps) {
  return (
    <main className="flex-1 overflow-hidden flex">
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Loading {limit.toLocaleString()} companies...</p>
          </div>
        </div>
      )}

      {/* Filter Panel - Show in table view when toggled */}
      {viewMode === "table" && showFilterPanel && (
        <FilterPanel
          activeFilterIds={activeFilterIds}
          onActiveFiltersChange={onActiveFiltersChange}
          onAskAI={onAskAI}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === "kanban" ? (
          <KanbanBoard
            startups={filteredStartups}
            onSelectStartup={onSelectStartup}
            onMoveStartup={onMoveStartup}
            onViewStage={onViewStage}
            onMoveToPortfolio={onMoveToPortfolio}
            portfolioInvestmentIds={portfolioInvestmentIds}
          />
        ) : viewMode === "table" ? (
          <div className="h-full p-6">
            <StartupTable
              startups={filteredStartups}
              onSelectStartup={onSelectStartup}
              onToggleShortlist={onToggleShortlist}
              shortlistLoading={shortlistLoading}
            />
          </div>
        ) : viewMode === "founders-kanban" ? (
          foundersLoading ? (
            <LoadingSpinner message="Loading founders..." />
          ) : (
            <FounderKanbanBoard
              founders={founders}
              onSelectFounder={onSelectFounder}
              onMoveFounder={onMoveFounder}
              onViewStage={onFounderViewStage}
            />
          )
        ) : (
          <div className="h-full p-6">
            {foundersLoading ? (
              <LoadingSpinner message="Loading founders..." />
            ) : (
              <FoundersTable
                founders={founders}
                onSelectCompany={onSelectCompanyFromFounders}
                onGenerateOutreach={onFounderOutreach}
              />
            )}
          </div>
        )}
      </div>
    </main>
  )
}

function LoadingSpinner({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}
