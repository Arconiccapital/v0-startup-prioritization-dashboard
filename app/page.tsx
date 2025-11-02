"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { KanbanBoard } from "@/components/kanban-board"
import { StageDetailView } from "@/components/stage-detail-view"
import { StartupTable } from "@/components/startup-table"
import { CsvUpload } from "@/components/csv-upload"
import type { Startup, PipelineStage } from "@/lib/types"
import Image from "next/image"
import { getAllStartups, addUploadedStartups } from "@/lib/startup-storage"

export default function Home() {
  const [startups, setStartups] = useState<Startup[]>([])
  const [showUpload, setShowUpload] = useState(false)
  const [viewingStage, setViewingStage] = useState<PipelineStage | null>(null)
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban")
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; status?: string } | null>(null)
  const [limit, setLimit] = useState<number>(500)
  const [totalCount, setTotalCount] = useState<number>(0)
  const [sectorFilter, setSectorFilter] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [stageFilter, setStageFilter] = useState<string>("")
  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 100])
  const [isLoading, setIsLoading] = useState(false)
  const [showOnlyShortlisted, setShowOnlyShortlisted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function loadStartups() {
      setIsLoading(true)
      try {
        const { startups, pagination } = await getAllStartups({
          limit,
          sector: sectorFilter || undefined,
          search: searchQuery || undefined,
          pipelineStage: stageFilter || undefined,
          minScore: scoreRange[0] > 0 ? scoreRange[0] : undefined,
          maxScore: scoreRange[1] < 100 ? scoreRange[1] : undefined,
        })
        setStartups(startups)
        setTotalCount(pagination?.total || 0)
      } finally {
        setIsLoading(false)
      }
    }
    loadStartups()
  }, [limit, sectorFilter, searchQuery, stageFilter, scoreRange])

  const handleUploadComplete = async (uploadedStartups: Startup[]) => {
    try {
      console.log("[Upload] Starting chunked upload of", uploadedStartups.length, "startups")

      const startupsWithStage = uploadedStartups.map((s) => ({
        ...s,
        pipelineStage: "Deal Flow" as PipelineStage,
      }))

      const BATCH_SIZE = 100
      const totalBatches = Math.ceil(startupsWithStage.length / BATCH_SIZE)
      let totalUploaded = 0

      console.log(`[Upload] Uploading in ${totalBatches} batches of ${BATCH_SIZE}`)

      // Upload in batches
      for (let i = 0; i < startupsWithStage.length; i += BATCH_SIZE) {
        const batch = startupsWithStage.slice(i, i + BATCH_SIZE)
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1

        // Update progress
        setUploadProgress({ current: totalUploaded, total: startupsWithStage.length })

        console.log(`[Upload] Uploading batch ${batchNumber}/${totalBatches} (${batch.length} companies)`)

        // Upload batch
        const response = await fetch("/api/startups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(batch),
        })

        if (!response.ok) {
          throw new Error(`Batch ${batchNumber} failed: ${response.statusText}`)
        }

        const result = await response.json()
        totalUploaded += result.count || batch.length
        console.log(`[Upload] Batch ${batchNumber} complete: ${result.count} companies uploaded`)
      }

      // Final progress update
      setUploadProgress({ current: totalUploaded, total: startupsWithStage.length })

      console.log("[Upload] All batches uploaded successfully, recalculating ranks...")

      // Recalculate ranks once after all batches are complete
      setUploadProgress({ current: totalUploaded, total: totalUploaded, status: "Recalculating ranks..." })
      const rankResponse = await fetch("/api/startups/recalculate-ranks", {
        method: "POST",
      })

      if (rankResponse.ok) {
        const rankResult = await rankResponse.json()
        console.log(`[Upload] Ranks recalculated: ${rankResult.message}`)
      } else {
        console.warn("[Upload] Failed to recalculate ranks, but upload succeeded")
      }

      console.log("[Upload] Reloading startups from database...")

      // Reload startups from database with current limit to avoid loading all 15K+ records
      const { startups: refreshedStartups } = await getAllStartups({ limit })
      console.log("[Upload] Loaded", refreshedStartups.length, "startups from database")

      setStartups(refreshedStartups)
      setUploadProgress(null)
      setShowUpload(false)

      alert(`Successfully uploaded ${totalUploaded} companies in ${totalBatches} batches!`)
    } catch (error) {
      console.error("[Upload] Error uploading startups:", error)
      setUploadProgress(null)
      alert(`Failed to upload companies: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const handleSelectStartup = (startup: Startup) => {
    router.push(`/company/${startup.id}`)
  }

  const handleMoveStartup = async (startupId: string, newStage: PipelineStage) => {
    // Optimistically update local state
    setStartups((prev) =>
      prev.map((startup) => (startup.id === startupId ? { ...startup, pipelineStage: newStage } : startup)),
    )

    // Save to database
    try {
      const response = await fetch(`/api/startups/${startupId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pipelineStage: newStage }),
      })

      if (!response.ok) {
        throw new Error("Failed to update pipeline stage")
      }

      console.log(`[Pipeline] Successfully moved startup ${startupId} to ${newStage}`)
    } catch (error) {
      console.error("[Pipeline] Error updating stage:", error)
      // Revert optimistic update on error
      const { startups: refreshedStartups } = await getAllStartups({ limit })
      setStartups(refreshedStartups)
      alert("Failed to move company. Please try again.")
    }
  }

  const handleViewStage = (stage: PipelineStage) => {
    setViewingStage(stage)
  }

  const handleBackToPipeline = () => {
    setViewingStage(null)
  }

  const handleSwitchToTableView = () => {
    setViewMode("table")
    setLimit(5000) // Load 5K companies initially (faster), user can increase if needed
    setStageFilter("") // Clear stage filter to show all companies
  }

  const handleSwitchToKanbanView = () => {
    setViewMode("kanban")
  }

  const handleToggleShortlist = async (startupId: string, shortlisted: boolean) => {
    // Get the startup to determine its current stage
    const startup = startups.find((s) => s.id === startupId)
    if (!startup) return

    // Determine the new pipeline stage
    const newStage: PipelineStage = shortlisted
      ? "Shortlist" // Move to Shortlist when favorited
      : startup.pipelineStage === "Shortlist"
        ? "Deal Flow" // Move back to Deal Flow if currently in Shortlist
        : startup.pipelineStage // Keep current stage if it's been moved along the pipeline

    // Optimistically update local state (both shortlist and pipeline stage)
    setStartups((prev) =>
      prev.map((startup) =>
        startup.id === startupId ? { ...startup, shortlisted, pipelineStage: newStage } : startup,
      ),
    )

    // Save to database using user-specific shortlist API
    try {
      const response = await fetch("/api/shortlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startupId, shortlisted }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          alert("Please log in to shortlist companies.")
        } else {
          throw new Error("Failed to update shortlist status")
        }
        // Revert optimistic update
        setStartups((prev) =>
          prev.map((startup) =>
            startup.id === startupId
              ? { ...startup, shortlisted: !shortlisted, pipelineStage: startup.pipelineStage }
              : startup,
          ),
        )
        return
      }

      // Update the pipeline stage in the database
      const stageResponse = await fetch(`/api/startups/${startupId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pipelineStage: newStage }),
      })

      if (!stageResponse.ok) {
        throw new Error("Failed to update pipeline stage")
      }

      console.log(
        `[Shortlist] Successfully ${shortlisted ? "added" : "removed"} startup ${startupId} and moved to ${newStage}`,
      )
    } catch (error) {
      console.error("[Shortlist] Error updating shortlist:", error)
      // Revert optimistic update on error
      const { startups: refreshedStartups } = await getAllStartups({ limit })
      setStartups(refreshedStartups)
      alert("Failed to update shortlist. Please try again.")
    }
  }

  // Get unique sectors and pipeline stages for filters
  const uniqueSectors = useMemo(() => {
    const sectors = new Set(startups.map((s) => s.sector).filter(Boolean))
    return Array.from(sectors).sort()
  }, [startups])

  const PIPELINE_STAGES: PipelineStage[] = [
    "Deal Flow",
    "Shortlist",
    "Intro Sent",
    "First Meeting",
    "Due Diligence",
    "Partner Review",
    "Term Sheet",
    "Closed",
  ]

  const handleResetFilters = () => {
    setSectorFilter("")
    setSearchQuery("")
    setStageFilter("")
    setScoreRange([0, 100])
    setShowOnlyShortlisted(false)
  }

  // Filter startups by shortlist status (client-side)
  const filteredStartups = useMemo(() => {
    if (showOnlyShortlisted) {
      return startups.filter((s) => s.shortlisted)
    }
    return startups
  }, [startups, showOnlyShortlisted])

  if (showUpload) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-2xl space-y-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Image src="/arconic-logo.png" alt="Arconic" width={120} height={30} className="h-7 w-auto" />
              </div>
              <h2 className="text-2xl font-semibold">Upload Your Data</h2>
              <p className="text-sm text-muted-foreground mt-1">Import a CSV file with your startup data</p>
            </div>
            <Button variant="ghost" onClick={() => setShowUpload(false)} disabled={!!uploadProgress}>
              Back to Pipeline
            </Button>
          </div>

          {uploadProgress && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {uploadProgress.status || "Uploading Companies..."}
                  </span>
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {uploadProgress.current} / {uploadProgress.total}
                  </span>
                </div>
                <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  {uploadProgress.status === "Recalculating ranks..." ? (
                    "Finalizing... Please don't close this page"
                  ) : (
                    <>
                      Batch {Math.floor(uploadProgress.current / 100) + 1} of {Math.ceil(uploadProgress.total / 100)} •
                      Please don't close this page
                    </>
                  )}
                </p>
              </div>
            </div>
          )}

          <CsvUpload onUploadComplete={handleUploadComplete} />
        </div>
      </div>
    )
  }

  if (viewingStage) {
    return (
      <StageDetailView
        stage={viewingStage}
        startups={startups}
        onBack={handleBackToPipeline}
        onSelectStartup={handleSelectStartup}
        onMoveStartup={handleMoveStartup}
      />
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="border-b border-border bg-card shrink-0">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-end gap-4 mb-2">
                <Image src="/arconic-logo.png" alt="Arconic" width={140} height={35} className="h-9 w-auto" />
                <h1 className="text-3xl font-semibold text-foreground">Lighthouse AI</h1>
              </div>
              <p className="text-sm text-muted-foreground mt-1">AI led workflow to prioritise startup research</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="text-sm">
                  <span className="text-muted-foreground">Showing </span>
                  <span className="font-medium text-foreground">
                    {filteredStartups.length}
                    {showOnlyShortlisted && ` shortlisted`} of {totalCount.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground"> companies</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Display:</span>
                  <select
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="text-sm border border-border rounded px-2 py-1 bg-background"
                  >
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                    <option value={500}>500</option>
                    <option value={1000}>1,000</option>
                    <option value={5000}>5,000</option>
                    <option value={999999}>All</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex border border-border rounded-md">
                <Button
                  variant={viewMode === "kanban" ? "default" : "ghost"}
                  size="sm"
                  onClick={handleSwitchToKanbanView}
                  className="rounded-r-none"
                >
                  Pipeline
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  onClick={handleSwitchToTableView}
                  className="rounded-l-none"
                >
                  All Companies
                </Button>
              </div>
              <Button variant="outline" onClick={() => setShowUpload(true)}>
                Upload CSV
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="border-b border-border bg-card px-6 py-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          {/* Sector Filter */}
          <div className="w-[180px]">
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="w-full h-9 text-sm border border-border rounded px-3 bg-background"
            >
              <option value="">All Sectors</option>
              {uniqueSectors.map((sector) => (
                <option key={sector} value={sector}>
                  {sector}
                </option>
              ))}
            </select>
          </div>

          {/* Pipeline Stage Filter - Only show in Kanban view */}
          {viewMode === "kanban" && (
            <div className="w-[180px]">
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="w-full h-9 text-sm border border-border rounded px-3 bg-background"
              >
                <option value="">All Stages</option>
                {PIPELINE_STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Score Range Slider - Show in table view */}
          {viewMode === "table" && (
            <div className="w-[240px] space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Score: {scoreRange[0]} - {scoreRange[1]}
              </label>
              <Slider
                min={0}
                max={100}
                step={1}
                value={scoreRange}
                onValueChange={(value) => setScoreRange(value as [number, number])}
                className="w-full"
              />
            </div>
          )}

          {/* My Shortlist Toggle - Show in table view */}
          {viewMode === "table" && (
            <Button
              variant={showOnlyShortlisted ? "default" : "outline"}
              size="sm"
              onClick={() => setShowOnlyShortlisted(!showOnlyShortlisted)}
              className="h-9"
            >
              ⭐ My Shortlist
            </Button>
          )}

          {/* Reset Button */}
          {(sectorFilter ||
            searchQuery ||
            stageFilter ||
            scoreRange[0] > 0 ||
            scoreRange[1] < 100 ||
            showOnlyShortlisted) && (
            <Button variant="outline" size="sm" onClick={handleResetFilters} className="h-9">
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      <main className="flex-1 overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Loading {limit.toLocaleString()} companies...</p>
            </div>
          </div>
        )}
        {viewMode === "kanban" ? (
          <KanbanBoard
            startups={filteredStartups}
            onSelectStartup={handleSelectStartup}
            onMoveStartup={handleMoveStartup}
            onViewStage={handleViewStage}
          />
        ) : (
          <div className="h-full p-6">
            <StartupTable
              startups={filteredStartups}
              onSelectStartup={handleSelectStartup}
              onToggleShortlist={handleToggleShortlist}
            />
          </div>
        )}
      </main>
    </div>
  )
}
