"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { KanbanBoard } from "@/components/kanban-board"
import { StageDetailView } from "@/components/stage-detail-view"
import { StartupDetailDrawer } from "@/components/startup-detail-drawer"
import { CsvUpload } from "@/components/csv-upload"
import type { Startup, StartupFeedback, PipelineStage } from "@/lib/types"
import { dummyStartups } from "@/lib/dummy-data"

export default function Home() {
  const [startups, setStartups] = useState<Startup[]>(dummyStartups)
  const [selectedStartup, setSelectedStartup] = useState<Startup | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [viewingStage, setViewingStage] = useState<PipelineStage | null>(null)

  const handleUploadComplete = (uploadedStartups: Startup[]) => {
    const startupsWithStage = uploadedStartups.map((s) => ({
      ...s,
      pipelineStage: "Deal Flow" as PipelineStage,
    }))
    setStartups((prev) => [...prev, ...startupsWithStage])
    setShowUpload(false)
  }

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

  const handleSaveInitialAssessment = (
    startupId: string,
    assessment: {
      marketOpportunity: number
      teamQuality: number
      productInnovation: number
      businessModel: number
      competitivePosition: number
      commentary: string
    },
  ) => {
    const newAssessment = {
      ...assessment,
      createdAt: new Date(),
    }

    setStartups((prev) =>
      prev.map((startup) => {
        if (startup.id === startupId) {
          return {
            ...startup,
            initialAssessment: newAssessment,
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
              initialAssessment: newAssessment,
            }
          : null,
      )
    }
  }

  const handleGenerateMemo = (startupId: string) => {
    const startup = startups.find((s) => s.id === startupId)
    if (!startup) return

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

INITIAL ASSESSMENT
${
  startup.initialAssessment
    ? `
- Market Opportunity: ${startup.initialAssessment.marketOpportunity}/10
- Team Quality: ${startup.initialAssessment.teamQuality}/10
- Product Innovation: ${startup.initialAssessment.productInnovation}/10
- Business Model: ${startup.initialAssessment.businessModel}/10
- Competitive Position: ${startup.initialAssessment.competitivePosition}/10

Commentary: ${startup.initialAssessment.commentary}
`
    : "No initial assessment recorded."
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

  const handleRegenerateScores = (startupId: string) => {
    console.log("[v0] Regenerating AI scores for startup:", startupId)
    // Placeholder: In production, this would call an API to regenerate scores
    // based on all available data (transcripts, pitch decks, scorecards, etc.)
    alert(
      "AI Score Regeneration\n\nThis feature will analyze all available data (transcripts, pitch decks, scorecards, and assessments) to update the AI-generated scores.\n\nIn production, this would trigger an LLM analysis pipeline.",
    )
  }

  const handleGenerateReport = (startupId: string) => {
    const startup = startups.find((s) => s.id === startupId)
    if (!startup) return

    console.log("[v0] Generating deal report PDF for startup:", startupId)

    const report = `
DEAL FLOW REPORT: ${startup.name}

COMPANY SNAPSHOT
Name: ${startup.name}
Sector: ${startup.sector}
Stage: ${startup.stage}
Location: ${startup.country}
Score: ${startup.score}/100

DESCRIPTION
${startup.description}

COMPANY INFORMATION
${
  startup.companyInfo
    ? `Founded: ${startup.companyInfo.founded}
Headquarters: ${startup.companyInfo.headquarters}
Employees: ${startup.companyInfo.employeeCount}
Funding Raised: ${startup.companyInfo.fundingRaised}
Website: ${startup.companyInfo.website}
LinkedIn: ${startup.companyInfo.linkedin}`
    : "No company information available"
}

AI ANALYSIS
LLM Score: ${startup.aiScores?.llm || "N/A"}/100
ML Score: ${startup.aiScores?.ml || "N/A"}/100
Sentiment: ${startup.aiScores?.sentiment || "N/A"}/100
Composite: ${startup.score}/100

INITIAL ASSESSMENT
${
  startup.initialAssessment
    ? `Market Opportunity: ${startup.initialAssessment.marketOpportunity}/10
Team Quality: ${startup.initialAssessment.teamQuality}/10
Product Innovation: ${startup.initialAssessment.productInnovation}/10
Business Model: ${startup.initialAssessment.businessModel}/10
Competitive Position: ${startup.initialAssessment.competitivePosition}/10

Commentary: ${startup.initialAssessment.commentary}`
    : "No initial assessment recorded"
}

INVESTMENT THESIS
${
  startup.rationale
    ? `Strengths:
${startup.rationale.whyInvest.map((r, i) => `${i + 1}. ${r}`).join("\n")}

Concerns:
${startup.rationale.whyNot.map((r, i) => `${i + 1}. ${r}`).join("\n")}`
    : "No investment thesis available"
}

NEXT STEPS
- Schedule introductory call
- Request pitch deck
- Conduct preliminary market research
- Prepare for first meeting

Report Generated: ${new Date().toLocaleString()}
    `.trim()

    // Placeholder: In production, this would generate an actual PDF
    alert(
      `Deal Report Generated\n\nA comprehensive PDF report has been prepared for ${startup.name}.\n\nIn production, this would download as a PDF file.\n\nPreview:\n${report.substring(0, 300)}...`,
    )
  }

  const handleViewStage = (stage: PipelineStage) => {
    setViewingStage(stage)
  }

  const handleBackToPipeline = () => {
    setViewingStage(null)
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

  const handleAddThresholdMeeting = (
    startupId: string,
    meeting: {
      date: Date
      meetingType: "First Meeting" | "Follow-up" | "Partner Meeting" | "Due Diligence" | "Final Review" | "Other"
      attendees: string
      keyPoints: string
      decision: "Proceed" | "Pass" | "More Info Needed"
      actionItems: string
      nextSteps: string
    },
  ) => {
    const newMeeting = {
      id: crypto.randomUUID(),
      startupId,
      ...meeting,
      createdAt: new Date(),
    }

    setStartups((prev) =>
      prev.map((startup) => {
        if (startup.id === startupId) {
          return {
            ...startup,
            thresholdMeetings: [...(startup.thresholdMeetings || []), newMeeting],
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
              thresholdMeetings: [...(prev.thresholdMeetings || []), newMeeting],
            }
          : null,
      )
    }
  }

  const handleAddThresholdIssue = (
    startupId: string,
    issue: {
      category:
        | "Market Risk"
        | "Team Risk"
        | "Technology Risk"
        | "Legal Risk"
        | "Financial Risk"
        | "Competitive Risk"
        | "Execution Risk"
        | "Other"
      issue: string
      riskRating: "High" | "Medium" | "Low"
      mitigation: string
      status: "Open" | "In Progress" | "Resolved" | "Accepted Risk"
    },
  ) => {
    const newIssue = {
      id: crypto.randomUUID(),
      startupId,
      ...issue,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setStartups((prev) =>
      prev.map((startup) => {
        if (startup.id === startupId) {
          return {
            ...startup,
            thresholdIssues: [...(startup.thresholdIssues || []), newIssue],
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
              thresholdIssues: [...(prev.thresholdIssues || []), newIssue],
            }
          : null,
      )
    }
  }

  if (showUpload) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-2xl space-y-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-semibold">Upload Your Data</h2>
              <p className="text-sm text-muted-foreground mt-1">Import a CSV file with your startup data</p>
            </div>
            <Button variant="ghost" onClick={() => setShowUpload(false)}>
              Back to Pipeline
            </Button>
          </div>
          <CsvUpload onUploadComplete={handleUploadComplete} />
        </div>
      </div>
    )
  }

  if (viewingStage) {
    return (
      <>
        <StageDetailView
          stage={viewingStage}
          startups={startups}
          onBack={handleBackToPipeline}
          onSelectStartup={handleSelectStartup}
          onMoveStartup={handleMoveStartup}
        />
        <StartupDetailDrawer
          startup={selectedStartup}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          onAddFeedback={handleAddFeedback}
          onSaveInitialAssessment={handleSaveInitialAssessment}
          onUploadDocument={handleUploadDocument}
          onGenerateMemo={handleGenerateMemo}
          onUpdateStage={handleMoveStartup}
          onRegenerateScores={handleRegenerateScores}
          onGenerateReport={handleGenerateReport}
          onAddThresholdMeeting={handleAddThresholdMeeting}
          onAddThresholdIssue={handleAddThresholdIssue}
        />
      </>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="border-b border-border bg-card shrink-0">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Investment Pipeline</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Track {startups.length} startups through due diligence stages
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowUpload(true)}>
                Upload CSV
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <KanbanBoard
          startups={startups}
          onSelectStartup={handleSelectStartup}
          onMoveStartup={handleMoveStartup}
          onViewStage={handleViewStage}
        />
      </main>

      <StartupDetailDrawer
        startup={selectedStartup}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onAddFeedback={handleAddFeedback}
        onSaveInitialAssessment={handleSaveInitialAssessment}
        onUploadDocument={handleUploadDocument}
        onGenerateMemo={handleGenerateMemo}
        onUpdateStage={handleMoveStartup}
        onRegenerateScores={handleRegenerateScores}
        onGenerateReport={handleGenerateReport}
        onAddThresholdMeeting={handleAddThresholdMeeting}
        onAddThresholdIssue={handleAddThresholdIssue}
      />
    </div>
  )
}
