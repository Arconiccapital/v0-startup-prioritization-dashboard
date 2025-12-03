"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import type { Founder, PipelineStage } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Briefcase, Database, FileText } from "lucide-react"

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

// Extended Founder type with source marker
interface FounderWithSource extends Founder {
  _source?: 'database' | 'legacy'
  _isNormalized?: boolean
}

interface FounderKanbanBoardProps {
  founders: FounderWithSource[]
  onSelectFounder: (founder: FounderWithSource) => void
  onMoveFounder: (founderId: string, newStage: PipelineStage, isLegacy: boolean) => void
  onViewStage: (stage: PipelineStage) => void
}

export function FounderKanbanBoard({
  founders,
  onSelectFounder,
  onMoveFounder,
  onViewStage,
}: FounderKanbanBoardProps) {
  const router = useRouter()
  const [draggedFounder, setDraggedFounder] = useState<string | null>(null)

  // Memoize founders by stage to avoid filtering 8 times on every render
  const foundersByStage = useMemo(() => {
    const result: Record<PipelineStage, FounderWithSource[]> = {
      "Deal Flow": [],
      "Shortlist": [],
      "Intro Sent": [],
      "First Meeting": [],
      "Due Diligence": [],
      "Partner Review": [],
      "Term Sheet": [],
      "Closed": [],
    }

    // Single pass through founders instead of 8 separate filter operations
    founders.forEach((founder) => {
      const stage = (founder.pipelineStage || "Deal Flow") as PipelineStage
      if (result[stage]) {
        result[stage].push(founder)
      }
    })

    return result
  }, [founders])

  const getFoundersByStage = (stage: PipelineStage) => {
    return foundersByStage[stage] || []
  }

  const handleDragStart = (founderId: string) => {
    setDraggedFounder(founderId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (stage: PipelineStage) => {
    if (draggedFounder) {
      const founder = founders.find(f => f.id === draggedFounder)
      if (founder) {
        const isLegacy = founder._source === 'legacy' || !founder._source
        onMoveFounder(draggedFounder, stage, isLegacy)
      }
      setDraggedFounder(null)
    }
  }

  // Extract experience summary from founder data
  const getExperienceSummary = (founder: FounderWithSource): string => {
    // Try priorExperience (legacy format)
    if (founder.priorExperience) {
      return founder.priorExperience
    }
    // Try education as fallback
    if (founder.education) {
      return founder.education
    }
    return ""
  }

  return (
    <div className="h-full overflow-x-auto p-6">
      <div className="flex gap-4 h-full min-w-max">
        {PIPELINE_STAGES.map((stage) => {
          const stageFounders = getFoundersByStage(stage)
          return (
            <div
              key={stage}
              className="flex-shrink-0 w-80 flex flex-col"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage)}
            >
              <div
                className="bg-muted p-3 mb-3 cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => onViewStage(stage)}
              >
                <h3 className="font-semibold text-sm">
                  {stage}
                  <span className="ml-2 text-muted-foreground">({stageFounders.length})</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Click to view all</p>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto">
                {stageFounders.map((founder) => {
                  const isLegacy = founder._source === 'legacy' || !founder._source
                  const experienceSummary = getExperienceSummary(founder)

                  return (
                    <Card
                      key={founder.id}
                      draggable
                      onDragStart={() => handleDragStart(founder.id)}
                      onClick={() => onSelectFounder(founder)}
                      className={`p-4 cursor-pointer hover:shadow-md transition-shadow bg-card ${
                        isLegacy ? "border-l-4 border-l-amber-400" : "border-l-4 border-l-blue-500"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-sm line-clamp-1">{founder.name}</h4>
                          {isLegacy ? (
                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              Legacy
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs flex items-center gap-1">
                              <Database className="h-3 w-3" />
                              DB
                            </Badge>
                          )}
                        </div>

                        {/* Company */}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          <span className="line-clamp-1">{founder.companyName || "No company"}</span>
                        </div>

                        {/* Experience */}
                        {experienceSummary && (
                          <div className="flex items-start gap-1 text-xs text-muted-foreground">
                            <Briefcase className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{experienceSummary}</span>
                          </div>
                        )}

                        {/* Role badge */}
                        {founder.role && founder.role !== "Founder" && (
                          <div className="pt-1">
                            <Badge variant="outline" className="text-xs">
                              {founder.role}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </Card>
                  )
                })}

                {stageFounders.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-8">No founders in this stage</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
