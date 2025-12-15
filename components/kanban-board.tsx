"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import type { Startup, PipelineStage } from "@/lib/types"
import { PIPELINE_STAGES } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Briefcase } from "lucide-react"

interface KanbanBoardProps {
  startups: Startup[]
  onSelectStartup: (startup: Startup) => void
  onMoveStartup: (startupId: string, newStage: PipelineStage) => void
  onViewStage: (stage: PipelineStage) => void
  onMoveToPortfolio?: (startup: Startup) => void // New: called when moving to Closed
  portfolioInvestmentIds?: string[] // New: startupIds that have portfolio investments
}

export function KanbanBoard({
  startups,
  onSelectStartup,
  onMoveStartup,
  onViewStage,
  onMoveToPortfolio,
  portfolioInvestmentIds = []
}: KanbanBoardProps) {
  const router = useRouter()
  const [draggedStartup, setDraggedStartup] = useState<string | null>(null)

  // Memoize startups by stage to avoid filtering on every render
  const startupsByStage = useMemo(() => {
    const result: Record<PipelineStage, Startup[]> = {
      "Screening": [],
      "First Meeting": [],
      "IC1": [],
      "DD": [],
      "IC2": [],
      "Closing": [],
      "Portfolio": [],
    }

    // Single pass through startups instead of separate filter operations
    startups.forEach((startup) => {
      if (result[startup.pipelineStage]) {
        result[startup.pipelineStage].push(startup)
      }
    })

    return result
  }, [startups])

  const getStartupsByStage = (stage: PipelineStage) => {
    return startupsByStage[stage] || []
  }

  const handleDragStart = (startupId: string) => {
    setDraggedStartup(startupId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (stage: PipelineStage) => {
    if (draggedStartup) {
      // If dropping on "Portfolio" stage and we have the portfolio callback, trigger it
      if (stage === "Portfolio" && onMoveToPortfolio) {
        const startup = startups.find(s => s.id === draggedStartup)
        if (startup) {
          onMoveToPortfolio(startup)
        }
      } else {
        onMoveStartup(draggedStartup, stage)
      }
      setDraggedStartup(null)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-blue-600"
    if (score >= 40) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="h-full overflow-x-auto p-6">
      <div className="flex gap-4 h-full min-w-max">
        {PIPELINE_STAGES.map((stageInfo) => {
          const stageStartups = getStartupsByStage(stageInfo.id)
          return (
            <div
              key={stageInfo.id}
              className="flex-shrink-0 w-80 flex flex-col"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stageInfo.id)}
            >
              <div
                className="bg-muted p-3 mb-3 cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => onViewStage(stageInfo.id)}
              >
                <h3 className="font-semibold text-sm">
                  {stageInfo.label}
                  <span className="ml-2 text-muted-foreground">({stageStartups.length})</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1">{stageInfo.description}</p>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto">
                {stageStartups.map((startup) => {
                  // Check if this startup has a portfolio investment
                  const hasPortfolioInvestment = portfolioInvestmentIds.includes(startup.id)
                  const isPortfolioStage = stageInfo.id === "Portfolio"

                  const handleCardClick = () => {
                    // If in Portfolio stage and has portfolio investment, navigate to portfolio
                    if (isPortfolioStage && hasPortfolioInvestment) {
                      router.push(`/portfolio/${startup.id}`)
                    } else {
                      onSelectStartup(startup)
                    }
                  }

                  return (
                  <Card
                    key={startup.id}
                    draggable
                    onDragStart={() => handleDragStart(startup.id)}
                    onClick={handleCardClick}
                    className={`p-4 cursor-pointer hover:shadow-md transition-shadow bg-card ${
                      isPortfolioStage && hasPortfolioInvestment ? "border-l-4 border-l-green-500" : ""
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm line-clamp-1">{startup.name}</h4>
                        <div className="flex flex-col items-end gap-0.5">
                          <span
                            className={`text-sm font-semibold ${getScoreColor(startup.aiScores?.llm || startup.score)}`}
                          >
                            LLM: {startup.aiScores?.llm || startup.score}
                          </span>
                          <span
                            className={`text-sm font-semibold ${getScoreColor(startup.aiScores?.ml || startup.score)}`}
                          >
                            ML: {startup.aiScores?.ml || startup.score}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Sector:</span>
                          <span className="line-clamp-1">{startup.sector}</span>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2">{startup.description}</p>

                      <div className="flex gap-2 pt-2">
                        {startup.documents?.transcript && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1">📄 Transcript</span>
                        )}
                        {startup.documents?.pitchDeck && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1">📊 Deck</span>
                        )}
                        {startup.investmentMemo && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1">📝 Memo</span>
                        )}
                      </div>
                    </div>
                  </Card>
                  )
                })}

                {stageStartups.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-8">No startups in this stage</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
