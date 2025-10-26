"use client"

import { useState, useMemo } from "react"
import type { Startup, PipelineStage } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { StartupTable } from "@/components/startup-table"

interface StageDetailViewProps {
  stage: PipelineStage
  startups: Startup[]
  onBack: () => void
  onSelectStartup: (startup: Startup) => void
  onMoveStartup: (startupId: string, newStage: PipelineStage) => void
}

export function StageDetailView({ stage, startups, onBack, onSelectStartup }: StageDetailViewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sectorFilter, setSectorFilter] = useState<string>("all")
  const [stageFilter, setStageFilter] = useState<string>("all")
  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 100])

  const stageStartups = startups.filter((s) => s.pipelineStage === stage)

  const sectors = useMemo(() => {
    const uniqueSectors = new Set(stageStartups.map((s) => s.sector))
    return Array.from(uniqueSectors).sort()
  }, [stageStartups])

  const stages = useMemo(() => {
    const uniqueStages = new Set(stageStartups.map((s) => s.stage))
    return Array.from(uniqueStages).sort()
  }, [stageStartups])

  const filteredStartups = useMemo(() => {
    let filtered = stageStartups

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.sector.toLowerCase().includes(query) ||
          s.country.toLowerCase().includes(query),
      )
    }

    if (sectorFilter !== "all") {
      filtered = filtered.filter((s) => s.sector === sectorFilter)
    }

    if (stageFilter !== "all") {
      filtered = filtered.filter((s) => s.stage === stageFilter)
    }

    filtered = filtered.filter((s) => s.score >= scoreRange[0] && s.score <= scoreRange[1])

    return filtered
  }, [stageStartups, searchQuery, sectorFilter, stageFilter, scoreRange])

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header with Back Button */}
      <div className="p-3 border-b border-border bg-card">
        <Button variant="ghost" onClick={onBack} className="text-sm font-medium">
          ← Back to Pipeline
        </Button>
      </div>

      {/* Title Section */}
      <div className="p-4 border-b border-border bg-card">
        <h1 className="text-xl font-semibold">{stage}</h1>
        <p className="text-xs text-muted-foreground mt-1">
          {filteredStartups.length} of {stageStartups.length} startups
        </p>
      </div>

      <div className="p-4 border-b border-border bg-card">
        <div className="flex flex-wrap items-end gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px] space-y-1.5">
            <label className="text-xs font-medium">Search</label>
            <Input
              placeholder="Search startups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          {/* Sector Filter */}
          <div className="w-[180px] space-y-1.5">
            <label className="text-xs font-medium">Sector</label>
            <Select value={sectorFilter} onValueChange={setSectorFilter}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="All Sectors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sectors</SelectItem>
                {sectors.map((sector) => (
                  <SelectItem key={sector} value={sector}>
                    {sector}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stage Filter */}
          <div className="w-[180px] space-y-1.5">
            <label className="text-xs font-medium">Company Stage</label>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {stages.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Score Range */}
          <div className="w-[200px] space-y-1.5">
            <label className="text-xs font-medium">
              Score Range: {scoreRange[0]} - {scoreRange[1]}
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

          {/* Reset Filters */}
          <Button
            variant="outline"
            size="sm"
            className="h-9 bg-transparent text-xs"
            onClick={() => {
              setSearchQuery("")
              setSectorFilter("all")
              setStageFilter("all")
              setScoreRange([0, 100])
            }}
          >
            Reset Filters
          </Button>
        </div>
      </div>

      {/* Main Content - Table */}
      <div className="flex-1 overflow-auto p-4">
        <StartupTable startups={filteredStartups} onSelectStartup={onSelectStartup} />
      </div>
    </div>
  )
}
