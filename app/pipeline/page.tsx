"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { KanbanBoard } from "@/components/kanban-board"
import { StartupDetailDrawer } from "@/components/startup-detail-drawer"
import type { Startup, StartupFeedback, PipelineStage } from "@/lib/types"
import { dummyStartups } from "@/lib/dummy-data"
import Link from "next/link"

export default function PipelinePage() {
  const [startups, setStartups] = useState<Startup[]>(dummyStartups)
  const [selectedStartup, setSelectedStartup] = useState<Startup | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleSelectStartup = (startup: Startup) => {
    setSelectedStartup(startup)
    setDrawerOpen(true)
  }

  const handleMoveStartup = (startupId: string, newStage: PipelineStage) => {
    setStartups((prev) =>
      prev.map((startup) => (startup.id === startupId ? { ...startup, pipelineStage: newStage } : startup)),
    )

    if (selectedStartup?.id === startupId) {
      setSelectedStartup((prev) => (prev ? { ...prev, pipelineStage: newStage } : null))
    }
  }

  const handleAddFeedback = (
    startupId: string,
    scores: {
      team: number
      market: number
      product: number
      businessModel: number
      traction: number
      investmentReadiness: number
    },
    notes: string,
  ) => {
    const newFeedback: StartupFeedback = {
      id: crypto.randomUUID(),
      startupId,
      scores,
      notes,
      createdAt: new Date(),
    }

    setStartups((prev) =>
      prev.map((startup) => {
        if (startup.id === startupId) {
          return {
            ...startup,
            feedback: [...(startup.feedback || []), newFeedback],
          }
        }
        return startup
      }),
    )

    if (selectedStartup?.id === startupId) {
      setSelectedStartup((prev) =>
        prev
          ? {
              ...prev,
              feedback: [...(prev.feedback || []), newFeedback],
            }
          : null,
      )
    }
  }

  const handleUploadDocument = (startupId: string, docType: "transcript" | "pitchDeck", content: string) => {
    setStartups((prev) =>
      prev.map((startup) => {
        if (startup.id === startupId) {
          return {
            ...startup,
            documents: {
              ...startup.documents,
              [docType]: content,
            },
          }
        }
        return startup
      }),
    )

    if (selectedStartup?.id === startupId) {
      setSelectedStartup((prev) =>
        prev
          ? {
              ...prev,
              documents: {
                ...prev.documents,
                [docType]: content,
              },
            }
          : null,
      )
    }
  }

  const handleGenerateMemo = (startupId: string) => {
    const startup = startups.find((s) => s.id === startupId)
    if (!startup) return

    // Generate investment memo based on all available data
    const memo = `
INVESTMENT MEMO: ${startup.name}

EXECUTIVE SUMMARY
${startup.description}

COMPANY OVERVIEW
Sector: ${startup.sector}
Stage: ${startup.stage}
Country: ${startup.country}
Team: ${startup.team}

KEY METRICS
${startup.metrics}
${startup.detailedMetrics ? `ARR: ${startup.detailedMetrics.arr}, Growth: ${startup.detailedMetrics.growth}, Team Size: ${startup.detailedMetrics.teamSize}` : ""}

AI ANALYSIS SCORES
Overall Score: ${startup.score}/100
LLM Score: ${startup.aiScores?.llm || "N/A"}
ML Score: ${startup.aiScores?.ml || "N/A"}
Sentiment Score: ${startup.aiScores?.sentiment || "N/A"}

INVESTMENT RATIONALE
Why Invest:
${startup.rationale?.whyInvest.map((reason, i) => `${i + 1}. ${reason}`).join("\n") || "N/A"}

Risks & Concerns:
${startup.rationale?.whyNot.map((reason, i) => `${i + 1}. ${reason}`).join("\n") || "N/A"}

DUE DILIGENCE SCORECARD
${
  startup.feedback && startup.feedback.length > 0
    ? `
Latest Evaluation:
- Team Quality: ${startup.feedback[startup.feedback.length - 1].scores.team}/10
- Market Opportunity: ${startup.feedback[startup.feedback.length - 1].scores.market}/10
- Product/Technology: ${startup.feedback[startup.feedback.length - 1].scores.product}/10
- Business Model: ${startup.feedback[startup.feedback.length - 1].scores.businessModel}/10
- Traction/Metrics: ${startup.feedback[startup.feedback.length - 1].scores.traction}/10
- Investment Readiness: ${startup.feedback[startup.feedback.length - 1].scores.investmentReadiness}/10

Notes: ${startup.feedback[startup.feedback.length - 1].notes}
`
    : "No scorecard evaluations yet."
}

DOCUMENTS REVIEWED
${startup.documents?.transcript ? "✓ Meeting Transcript" : "○ Meeting Transcript"}
${startup.documents?.pitchDeck ? "✓ Pitch Deck" : "○ Pitch Deck"}

RECOMMENDATION
Based on the comprehensive analysis above, this investment opportunity scores ${startup.score}/100 and is currently in the "${startup.pipelineStage}" stage of our pipeline.

Generated: ${new Date().toLocaleDateString()}
    `.trim()

    setStartups((prev) => prev.map((s) => (s.id === startupId ? { ...s, investmentMemo: memo } : s)))

    if (selectedStartup?.id === startupId) {
      setSelectedStartup((prev) => (prev ? { ...prev, investmentMemo: memo } : null))
    }
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="border-b border-border bg-card shrink-0">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Investment Pipeline</h1>
              <p className="text-sm text-muted-foreground mt-1">Track startups through due diligence stages</p>
            </div>
            <div className="flex gap-2">
              <Link href="/">
                <Button variant="outline">Dashboard View</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <KanbanBoard startups={startups} onSelectStartup={handleSelectStartup} onMoveStartup={handleMoveStartup} />
      </main>

      <StartupDetailDrawer
        startup={selectedStartup}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onAddFeedback={handleAddFeedback}
        onUploadDocument={handleUploadDocument}
        onGenerateMemo={handleGenerateMemo}
      />
    </div>
  )
}
