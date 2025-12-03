"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { KanbanBoard } from "@/components/kanban-board"
import { StageDetailView } from "@/components/stage-detail-view"
import { StartupTable } from "@/components/startup-table"
import { FoundersTable } from "@/components/founders-table"
import { FounderKanbanBoard } from "@/components/founder-kanban-board"
import { CsvUpload } from "@/components/csv-upload"
import { FilterPanel } from "@/components/filter-panel"
import type { Startup, PipelineStage, Founder } from "@/lib/types"
import type { FilterCondition, SavedFilter } from "@/lib/filter-store"
import { getSavedFilters, applyFilters } from "@/lib/filter-store"
import Image from "next/image"
import { getAllStartups, addUploadedStartups } from "@/lib/startup-storage"
import { exportAndDownload } from "@/lib/csv-export"
import { Download, PanelLeftClose, PanelLeft, Briefcase, Upload } from "lucide-react"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export default function Home() {
  const [startups, setStartups] = useState<Startup[]>([])
  const [showUpload, setShowUpload] = useState(false)
  const [viewingStage, setViewingStage] = useState<PipelineStage | null>(null)
  const [viewMode, setViewMode] = useState<"kanban" | "table" | "founders-kanban" | "founders-table">("kanban")
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; status?: string } | null>(null)
  const [limit, setLimit] = useState<number>(500)
  const [totalCount, setTotalCount] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [stageFilter, setStageFilter] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [showOnlyShortlisted, setShowOnlyShortlisted] = useState(false)
  const [shortlistLoading, setShortlistLoading] = useState<Set<string>>(new Set())

  // Filter panel state
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [activeFilterIds, setActiveFilterIds] = useState<string[]>([])
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])

  // Founders view state
  const [founders, setFounders] = useState<Founder[]>([])
  const [foundersLoading, setFoundersLoading] = useState(false)
  const [founderSearchQuery, setFounderSearchQuery] = useState("")

  // Portfolio investment dialog state
  const [showPortfolioDialog, setShowPortfolioDialog] = useState(false)
  const [portfolioStartup, setPortfolioStartup] = useState<Startup | null>(null)
  const [portfolioInvestmentIds, setPortfolioInvestmentIds] = useState<string[]>([])
  const [investmentForm, setInvestmentForm] = useState({
    investmentDate: new Date().toISOString().split('T')[0],
    investmentAmount: "",
    ownership: "",
    valuation: "",
    investmentType: "Seed" as string,
    leadInvestor: false,
    boardSeat: false,
  })
  const [isCreatingInvestment, setIsCreatingInvestment] = useState(false)

  const router = useRouter()

  // Load saved filters on mount
  useEffect(() => {
    setSavedFilters(getSavedFilters())
  }, [])

  // Load portfolio investment IDs on mount
  useEffect(() => {
    async function loadPortfolioIds() {
      try {
        const response = await fetch("/api/portfolio")
        if (response.ok) {
          const data = await response.json()
          const investments = data.investments || []
          const ids = investments.map((inv: { startupId: string }) => inv.startupId)
          setPortfolioInvestmentIds(ids)
        }
      } catch (error) {
        console.error("[Portfolio] Error loading portfolio IDs:", error)
      }
    }
    loadPortfolioIds()
  }, [])

  // Fetch founders when in founders view
  const fetchFounders = useCallback(async (search?: string) => {
    setFoundersLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      params.set("limit", "500")

      const response = await fetch(`/api/founders?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setFounders(data.founders || [])
      }
    } catch (error) {
      console.error("[Founders] Error loading founders:", error)
    } finally {
      setFoundersLoading(false)
    }
  }, [])

  // Load founders when switching to founders view
  useEffect(() => {
    if (viewMode === "founders-kanban" || viewMode === "founders-table") {
      fetchFounders(founderSearchQuery)
    }
  }, [viewMode, founderSearchQuery, fetchFounders])

  useEffect(() => {
    async function loadStartups() {
      setIsLoading(true)
      try {
        const { startups, pagination } = await getAllStartups({
          limit,
          search: searchQuery || undefined,
          pipelineStage: stageFilter || undefined,
        })
        setStartups(startups)
        setTotalCount(pagination?.total || 0)
      } finally {
        setIsLoading(false)
      }
    }
    loadStartups()
  }, [limit, searchQuery, stageFilter])

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

  // Handle moving a startup to the Closed/Portfolio stage
  const handleMoveToPortfolio = (startup: Startup) => {
    // Check if already has a portfolio investment
    if (portfolioInvestmentIds.includes(startup.id)) {
      // Already in portfolio, just navigate there
      router.push(`/portfolio/${startup.id}`)
      return
    }

    // Open the investment dialog
    setPortfolioStartup(startup)
    setInvestmentForm({
      investmentDate: new Date().toISOString().split('T')[0],
      investmentAmount: "",
      ownership: "",
      valuation: "",
      investmentType: "Seed",
      leadInvestor: false,
      boardSeat: false,
    })
    setShowPortfolioDialog(true)
  }

  // Create portfolio investment
  const handleCreatePortfolioInvestment = async () => {
    if (!portfolioStartup) return

    setIsCreatingInvestment(true)
    try {
      // Create the portfolio investment
      const response = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startupId: portfolioStartup.id,
          investmentDate: new Date(investmentForm.investmentDate),
          investmentAmount: investmentForm.investmentAmount ? parseFloat(investmentForm.investmentAmount) : null,
          ownership: investmentForm.ownership ? parseFloat(investmentForm.ownership) : null,
          valuation: investmentForm.valuation ? parseFloat(investmentForm.valuation) : null,
          investmentType: investmentForm.investmentType,
          leadInvestor: investmentForm.leadInvestor,
          boardSeat: investmentForm.boardSeat,
          status: "Active",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create portfolio investment")
      }

      // Update local state to move startup to Closed
      setStartups((prev) =>
        prev.map((s) => (s.id === portfolioStartup.id ? { ...s, pipelineStage: "Closed" as PipelineStage } : s))
      )

      // Add to portfolio IDs
      setPortfolioInvestmentIds((prev) => [...prev, portfolioStartup.id])

      // Close dialog and navigate to portfolio
      setShowPortfolioDialog(false)
      setPortfolioStartup(null)
      router.push(`/portfolio/${portfolioStartup.id}`)
    } catch (error) {
      console.error("[Portfolio] Error creating investment:", error)
      alert("Failed to create portfolio investment. Please try again.")
    } finally {
      setIsCreatingInvestment(false)
    }
  }

  // Cancel portfolio dialog (move to Closed without investment)
  const handleCancelPortfolioDialog = () => {
    setShowPortfolioDialog(false)
    setPortfolioStartup(null)
  }

  const handleSwitchToTableView = () => {
    setViewMode("table")
    setLimit(5000) // Load 5K companies initially (faster), user can increase if needed
    setStageFilter("") // Clear stage filter to show all companies
    setShowFilterPanel(true) // Show filter panel in table view
  }

  const handleSwitchToKanbanView = () => {
    setViewMode("kanban")
    setShowFilterPanel(false) // Hide filter panel in kanban view
  }

  const handleSwitchToFoundersView = () => {
    setViewMode("founders-kanban")
    setShowFilterPanel(false) // Hide filter panel in founders view
  }

  // Handle moving a founder to a new pipeline stage
  const handleMoveFounder = async (founderId: string, newStage: PipelineStage, isLegacy: boolean) => {
    // Optimistically update local state
    setFounders((prev) =>
      prev.map((founder) =>
        founder.id === founderId ? { ...founder, pipelineStage: newStage } : founder
      )
    )

    try {
      if (isLegacy) {
        // Legacy founder: create new database founder and migrate
        const founder = founders.find((f) => f.id === founderId)
        if (!founder) throw new Error("Founder not found")

        // Create new database founder
        const response = await fetch("/api/founders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: founder.name,
            education: founder.education,
            experience: founder.priorExperience,
            linkedIn: founder.linkedIn,
            companyName: founder.companyName,
            role: founder.role || "Founder",
            pipelineStage: newStage,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to migrate founder to database")
        }

        console.log(`[Founder Pipeline] Migrated legacy founder ${founder.name} to database at stage ${newStage}`)

        // Refresh founders to get the new database founder
        await fetchFounders(founderSearchQuery)
      } else {
        // Database founder: just update pipeline stage
        const response = await fetch(`/api/founders/${founderId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pipelineStage: newStage }),
        })

        if (!response.ok) {
          throw new Error("Failed to update founder pipeline stage")
        }

        console.log(`[Founder Pipeline] Moved founder ${founderId} to ${newStage}`)
      }
    } catch (error) {
      console.error("[Founder Pipeline] Error updating stage:", error)
      // Revert optimistic update on error
      await fetchFounders(founderSearchQuery)
      alert("Failed to move founder. Please try again.")
    }
  }

  // Handle clicking on a founder in the Kanban
  const handleSelectFounder = (founder: Founder & { _source?: string }) => {
    router.push(`/founder/${founder.id}`)
  }

  // Handle viewing a stage in founder Kanban (placeholder - could open modal or filter)
  const handleFounderViewStage = (stage: PipelineStage) => {
    // For now, just log - could implement a modal view later
    console.log(`[Founder Pipeline] View stage: ${stage}`)
  }

  // Handle founder outreach - navigate to company page with outreach tab
  const handleFounderOutreach = (founder: Founder) => {
    router.push(`/company/${founder.companyId}?tab=outreach&founder=${encodeURIComponent(founder.name)}`)
  }

  // Handle selecting company from founders view
  const handleSelectCompanyFromFounders = (companyId: string) => {
    router.push(`/company/${companyId}`)
  }

  const handleToggleShortlist = async (startupId: string, shortlisted: boolean) => {
    console.log("[handleToggleShortlist] Called with:", { startupId, shortlisted })

    // Prevent duplicate operations
    if (shortlistLoading.has(startupId)) {
      console.log("[handleToggleShortlist] Already loading, returning early")
      return
    }

    // Get the startup to determine its current stage
    const startup = startups.find((s) => s.id === startupId)
    if (!startup) {
      console.log("[handleToggleShortlist] Startup not found, returning early")
      return
    }

    console.log("[handleToggleShortlist] Found startup:", startup.name)

    // Add to loading state
    setShortlistLoading((prev) => new Set(prev).add(startupId))

    // Determine the new pipeline stage
    const newStage: PipelineStage = shortlisted
      ? "Shortlist" // Move to Shortlist when favorited
      : startup.pipelineStage === "Shortlist"
        ? "Deal Flow" // Move back to Deal Flow if currently in Shortlist
        : startup.pipelineStage // Keep current stage if it's been moved along the pipeline

    console.log("[handleToggleShortlist] New stage:", newStage)

    // Store original state for potential revert
    const originalShortlisted = startup.shortlisted
    const originalStage = startup.pipelineStage

    // Optimistically update local state (both shortlist and pipeline stage)
    setStartups((prev) =>
      prev.map((startup) =>
        startup.id === startupId ? { ...startup, shortlisted, pipelineStage: newStage } : startup,
      ),
    )

    // Save to database using user-specific shortlist API
    try {
      console.log("[handleToggleShortlist] Making fetch request to /api/shortlist")
      const response = await fetch("/api/shortlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startupId, shortlisted }),
      })
      console.log("[handleToggleShortlist] Response status:", response.status)

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
              ? { ...startup, shortlisted: originalShortlisted, pipelineStage: originalStage }
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
      setStartups((prev) =>
        prev.map((startup) =>
          startup.id === startupId
            ? { ...startup, shortlisted: originalShortlisted, pipelineStage: originalStage }
            : startup,
        ),
      )
      alert("Failed to update shortlist. Please try again.")
    } finally {
      // Remove from loading state
      setShortlistLoading((prev) => {
        const next = new Set(prev)
        next.delete(startupId)
        return next
      })
    }
  }

  // Handle Ask AI filter
  const handleAskAI = async (query: string): Promise<FilterCondition[]> => {
    const response = await fetch("/api/filter-ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    })

    if (!response.ok) {
      throw new Error("Failed to process AI query")
    }

    const data = await response.json()
    return data.conditions
  }

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
    setSearchQuery("")
    setStageFilter("")
    setShowOnlyShortlisted(false)
    setActiveFilterIds([])
    setFounderSearchQuery("")
  }

  const handleExportCSV = () => {
    const filename = showOnlyShortlisted
      ? `shortlisted-companies-${new Date().toISOString().split("T")[0]}.csv`
      : `all-companies-${new Date().toISOString().split("T")[0]}.csv`
    exportAndDownload(filteredStartups, filename)
  }

  // Filter startups by shortlist status, keyword, and custom filters (client-side)
  const filteredStartups = useMemo(() => {
    let filtered = startups

    // Filter by shortlist
    if (showOnlyShortlisted) {
      filtered = filtered.filter((s) => s.shortlisted)
    }

    // Apply custom filters from filter panel
    if (activeFilterIds.length > 0) {
      const currentFilters = getSavedFilters()
      filtered = applyFilters(filtered, activeFilterIds, currentFilters)
    }

    return filtered
  }, [startups, showOnlyShortlisted, activeFilterIds])

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
        onToggleShortlist={handleToggleShortlist}
        shortlistLoading={shortlistLoading}
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
                  className="rounded-none border-x border-border"
                >
                  Companies
                </Button>
                <Button
                  variant={viewMode === "founders-kanban" || viewMode === "founders-table" ? "default" : "ghost"}
                  size="sm"
                  onClick={handleSwitchToFoundersView}
                  className="rounded-l-none"
                >
                  Founders
                </Button>
              </div>
              {/* Secondary toggle for founders view */}
              {(viewMode === "founders-kanban" || viewMode === "founders-table") && (
                <div className="flex border border-border rounded-md">
                  <Button
                    variant={viewMode === "founders-kanban" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("founders-kanban")}
                    className="rounded-r-none"
                  >
                    Board
                  </Button>
                  <Button
                    variant={viewMode === "founders-table" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("founders-table")}
                    className="rounded-l-none"
                  >
                    Table
                  </Button>
                </div>
              )}
              <Link href="/portfolio">
                <Button variant="outline">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Portfolio
                </Button>
              </Link>
              {(viewMode === "founders-kanban" || viewMode === "founders-table") ? (
                <Link href="/founders/upload">
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Founders
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" onClick={() => setShowUpload(true)}>
                  Upload CSV
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="border-b border-border bg-card px-6 py-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Filter Panel Toggle - Show in table view */}
          {viewMode === "table" && (
            <Button
              variant={showFilterPanel ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className="h-9"
            >
              {showFilterPanel ? (
                <PanelLeftClose className="w-4 h-4 mr-2" />
              ) : (
                <PanelLeft className="w-4 h-4 mr-2" />
              )}
              Filters
              {activeFilterIds.length > 0 && (
                <span className="ml-1.5 bg-primary-foreground text-primary rounded-full px-1.5 py-0.5 text-xs">
                  {activeFilterIds.length}
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
                onChange={(e) => setFounderSearchQuery(e.target.value)}
                className="h-9 text-sm"
              />
            ) : (
              <Input
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 text-sm"
              />
            )}
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

          {/* My Shortlist Toggle - Show in kanban and table views */}
          {(viewMode === "kanban" || viewMode === "table") && (
            <Button
              variant={showOnlyShortlisted ? "default" : "outline"}
              size="sm"
              onClick={() => setShowOnlyShortlisted(!showOnlyShortlisted)}
              className="h-9"
            >
              ⭐ My Shortlist
            </Button>
          )}

          {/* Export CSV - Show in table view */}
          {viewMode === "table" && (
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="h-9">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          )}

          {/* Reset Button */}
          {(searchQuery ||
            stageFilter ||
            showOnlyShortlisted ||
            activeFilterIds.length > 0 ||
            founderSearchQuery) && (
            <Button variant="outline" size="sm" onClick={handleResetFilters} className="h-9">
              Reset Filters
            </Button>
          )}
        </div>
      </div>

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
            onActiveFiltersChange={setActiveFilterIds}
            onAskAI={handleAskAI}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {viewMode === "kanban" ? (
            <KanbanBoard
              startups={filteredStartups}
              onSelectStartup={handleSelectStartup}
              onMoveStartup={handleMoveStartup}
              onViewStage={handleViewStage}
              onMoveToPortfolio={handleMoveToPortfolio}
              portfolioInvestmentIds={portfolioInvestmentIds}
            />
          ) : viewMode === "table" ? (
            <div className="h-full p-6">
              <StartupTable
                startups={filteredStartups}
                onSelectStartup={handleSelectStartup}
                onToggleShortlist={handleToggleShortlist}
                shortlistLoading={shortlistLoading}
              />
            </div>
          ) : viewMode === "founders-kanban" ? (
            foundersLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  <p className="text-sm text-muted-foreground">Loading founders...</p>
                </div>
              </div>
            ) : (
              <FounderKanbanBoard
                founders={founders}
                onSelectFounder={handleSelectFounder}
                onMoveFounder={handleMoveFounder}
                onViewStage={handleFounderViewStage}
              />
            )
          ) : (
            <div className="h-full p-6">
              {foundersLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-sm text-muted-foreground">Loading founders...</p>
                  </div>
                </div>
              ) : (
                <FoundersTable
                  founders={founders}
                  onSelectCompany={handleSelectCompanyFromFounders}
                  onGenerateOutreach={handleFounderOutreach}
                />
              )}
            </div>
          )}
        </div>
      </main>

      {/* Portfolio Investment Dialog */}
      <Dialog open={showPortfolioDialog} onOpenChange={setShowPortfolioDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Portfolio</DialogTitle>
          </DialogHeader>
          {portfolioStartup && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-lg">
                <p className="font-medium">{portfolioStartup.name}</p>
                <p className="text-sm text-muted-foreground">{portfolioStartup.sector}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="investmentDate">Investment Date</Label>
                  <Input
                    id="investmentDate"
                    type="date"
                    value={investmentForm.investmentDate}
                    onChange={(e) => setInvestmentForm({ ...investmentForm, investmentDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="investmentType">Investment Type</Label>
                  <select
                    id="investmentType"
                    value={investmentForm.investmentType}
                    onChange={(e) => setInvestmentForm({ ...investmentForm, investmentType: e.target.value })}
                    className="w-full h-10 border border-border rounded px-3 bg-background text-sm"
                  >
                    <option value="Pre-Seed">Pre-Seed</option>
                    <option value="Seed">Seed</option>
                    <option value="Series A">Series A</option>
                    <option value="Series B">Series B</option>
                    <option value="Series C">Series C</option>
                    <option value="Bridge">Bridge</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="investmentAmount">Investment Amount ($)</Label>
                  <Input
                    id="investmentAmount"
                    type="number"
                    placeholder="e.g., 500000"
                    value={investmentForm.investmentAmount}
                    onChange={(e) => setInvestmentForm({ ...investmentForm, investmentAmount: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valuation">Valuation ($)</Label>
                  <Input
                    id="valuation"
                    type="number"
                    placeholder="e.g., 5000000"
                    value={investmentForm.valuation}
                    onChange={(e) => setInvestmentForm({ ...investmentForm, valuation: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownership">Ownership (%)</Label>
                  <Input
                    id="ownership"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 10"
                    value={investmentForm.ownership}
                    onChange={(e) => setInvestmentForm({ ...investmentForm, ownership: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={investmentForm.leadInvestor}
                    onChange={(e) => setInvestmentForm({ ...investmentForm, leadInvestor: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Lead Investor</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={investmentForm.boardSeat}
                    onChange={(e) => setInvestmentForm({ ...investmentForm, boardSeat: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Board Seat</span>
                </label>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCancelPortfolioDialog}>
              Cancel
            </Button>
            <Button onClick={handleCreatePortfolioInvestment} disabled={isCreatingInvestment}>
              {isCreatingInvestment ? "Creating..." : "Add to Portfolio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
