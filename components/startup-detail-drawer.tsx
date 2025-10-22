"use client"

import type React from "react"

import { useState } from "react"
import type { Startup, PipelineStage } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { FeedbackForm } from "@/components/feedback-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface StartupDetailDrawerProps {
  startup: Startup | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddFeedback: (
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
  ) => void
  onSaveInitialAssessment?: (
    startupId: string,
    assessment: {
      marketOpportunity: number
      teamQuality: number
      productInnovation: number
      businessModel: number
      competitivePosition: number
      commentary: string
    },
  ) => void
  onUploadDocument?: (startupId: string, docType: "transcript" | "pitchDeck", content: string) => void
  onGenerateMemo?: (startupId: string) => void
  onUpdateStage?: (startupId: string, newStage: PipelineStage) => void
  onRegenerateScores?: (startupId: string) => void
  onGenerateReport?: (startupId: string) => void
  onAddThresholdMeeting?: (
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
  ) => void
  onAddThresholdIssue?: (
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
  ) => void
  onUpdateThresholdIssue?: (
    startupId: string,
    issueId: string,
    updates: {
      issue?: string
      riskRating?: "High" | "Medium" | "Low"
      mitigation?: string
      status?: "Open" | "In Progress" | "Resolved" | "Accepted Risk"
    },
  ) => void
}

export function StartupDetailDrawer({
  startup,
  open,
  onOpenChange,
  onAddFeedback,
  onSaveInitialAssessment,
  onUploadDocument,
  onGenerateMemo,
  onUpdateStage,
  onRegenerateScores,
  onGenerateReport,
  onAddThresholdMeeting, // Added prop
  onAddThresholdIssue,
  onUpdateThresholdIssue,
}: StartupDetailDrawerProps) {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [pitchDeck, setPitchDeck] = useState("")
  const [showTranscriptInput, setShowTranscriptInput] = useState(false)
  const [showPitchDeckInput, setShowPitchDeckInput] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [pitchDeckFile, setPitchDeckFile] = useState<File | null>(null)

  const [showMeetingForm, setShowMeetingForm] = useState(false)
  const [meetingForm, setMeetingForm] = useState({
    date: new Date().toISOString().split("T")[0],
    meetingType: "First Meeting" as
      | "First Meeting"
      | "Follow-up"
      | "Partner Meeting"
      | "Due Diligence"
      | "Final Review"
      | "Other",
    attendees: "",
    keyPoints: "",
    decision: "More Info Needed" as "Proceed" | "Pass" | "More Info Needed",
    actionItems: "",
    nextSteps: "",
  })

  const [showIssueForm, setShowIssueForm] = useState(false)
  const [issueForm, setIssueForm] = useState({
    category: "Market Risk" as
      | "Market Risk"
      | "Team Risk"
      | "Technology Risk"
      | "Legal Risk"
      | "Financial Risk"
      | "Competitive Risk"
      | "Execution Risk"
      | "Other",
    issue: "",
    riskRating: "Medium" as "High" | "Medium" | "Low",
    mitigation: "",
    status: "Open" as "Open" | "In Progress" | "Resolved" | "Accepted Risk",
  })

  const [initialAssessment, setInitialAssessment] = useState({
    marketOpportunity: startup?.initialAssessment?.marketOpportunity || 5,
    teamQuality: startup?.initialAssessment?.teamQuality || 5,
    productInnovation: startup?.initialAssessment?.productInnovation || 5,
    businessModel: startup?.initialAssessment?.businessModel || 5,
    competitivePosition: startup?.initialAssessment?.competitivePosition || 5,
    commentary: startup?.initialAssessment?.commentary || "",
  })

  if (!startup || !open) return null

  const formatScore = (score?: number) => {
    if (score === undefined) return "N/A"
    return score.toFixed(1)
  }

  const getScoreLabel = (score?: number) => {
    if (!score) return "Not Scored"
    if (score >= 80) return "Excellent"
    if (score >= 60) return "Good"
    if (score >= 40) return "Fair"
    return "Needs Improvement"
  }

  const handleSubmitFeedback = (
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
    onAddFeedback(startup.id, scores, notes)
    setShowFeedbackForm(false)
  }

  const handleSaveInitialAssessment = () => {
    if (onSaveInitialAssessment) {
      onSaveInitialAssessment(startup.id, initialAssessment)
    }
  }

  const handleUploadTranscript = () => {
    if (transcript.trim() && onUploadDocument) {
      onUploadDocument(startup.id, "transcript", transcript)
      setTranscript("")
      setShowTranscriptInput(false)
    }
  }

  const handlePitchDeckFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === "application/pdf") {
      setPitchDeckFile(file)
    }
  }

  const handleUploadPitchDeck = () => {
    if (pitchDeck.trim() && onUploadDocument) {
      onUploadDocument(startup.id, "pitchDeck", pitchDeck)
      setPitchDeck("")
      setShowPitchDeckInput(false)
    }
  }

  const handleUploadPitchDeckFile = async () => {
    if (pitchDeckFile && onUploadDocument) {
      // Convert PDF to base64 or just store the file name
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result as string
        onUploadDocument(startup.id, "pitchDeck", base64)
        setPitchDeckFile(null)
        setShowPitchDeckInput(false)
      }
      reader.readAsDataURL(pitchDeckFile)
    }
  }

  const getNextStage = (currentStage: PipelineStage): PipelineStage | null => {
    const stages: PipelineStage[] = [
      "Deal Flow",
      "Intro Sent",
      "First Meeting",
      "Due Diligence",
      "Partner Review",
      "Term Sheet",
      "Closed",
    ]
    const currentIndex = stages.indexOf(currentStage)
    if (currentIndex === -1 || currentIndex === stages.length - 1) return null
    return stages[currentIndex + 1]
  }

  const getAdvanceButtonText = (nextStage: PipelineStage): string => {
    const buttonTexts: Record<PipelineStage, string> = {
      "Deal Flow": "Move to Deal Flow",
      "Intro Sent": "Send Introduction",
      "First Meeting": "Schedule First Meeting",
      "Due Diligence": "Begin Due Diligence",
      "Partner Review": "Submit for Partner Review",
      "Term Sheet": "Prepare Term Sheet",
      Closed: "Mark as Closed",
    }
    return buttonTexts[nextStage] || "Advance Stage"
  }

  const nextStage = startup?.pipelineStage ? getNextStage(startup.pipelineStage) : null

  const canAddTranscript = ["First Meeting", "Due Diligence", "Partner Review", "Term Sheet", "Closed"].includes(
    startup.pipelineStage || "",
  )
  const canAddPitchDeck = ["First Meeting", "Due Diligence", "Partner Review", "Term Sheet", "Closed"].includes(
    startup.pipelineStage || "",
  )
  const canAddScorecard = ["First Meeting", "Due Diligence", "Partner Review", "Term Sheet", "Closed"].includes(
    startup.pipelineStage || "",
  )
  const canGenerateMemo = ["First Meeting", "Due Diligence", "Partner Review", "Term Sheet", "Closed"].includes(
    startup.pipelineStage || "",
  )
  const canGenerateReport = startup.pipelineStage === "Intro Sent"
  const canAddMeetings = ["First Meeting", "Due Diligence", "Partner Review", "Term Sheet", "Closed"].includes(
    startup.pipelineStage || "",
  )

  const handleSaveMeeting = () => {
    if (onAddThresholdMeeting && meetingForm.attendees && meetingForm.keyPoints) {
      onAddThresholdMeeting(startup.id, {
        ...meetingForm,
        date: new Date(meetingForm.date),
      })
      // Reset form
      setMeetingForm({
        date: new Date().toISOString().split("T")[0],
        meetingType: "First Meeting",
        attendees: "",
        keyPoints: "",
        decision: "More Info Needed",
        actionItems: "",
        nextSteps: "",
      })
      setShowMeetingForm(false)
    }
  }

  const handleSaveIssue = () => {
    if (onAddThresholdIssue && issueForm.issue && issueForm.mitigation) {
      onAddThresholdIssue(startup.id, issueForm)
      // Reset form
      setIssueForm({
        category: "Market Risk",
        issue: "",
        riskRating: "Medium",
        mitigation: "",
        status: "Open",
      })
      setShowIssueForm(false)
    }
  }

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case "Proceed":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30"
      case "Pass":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30"
      case "More Info Needed":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getRiskColor = (rating: string) => {
    switch (rating) {
      case "High":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30"
      case "Medium":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30"
      case "Low":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Resolved":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30"
      case "In Progress":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30"
      case "Accepted Risk":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30"
      case "Open":
        return "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-pretty mb-3">{startup.name}</h1>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline">{startup.sector}</Badge>
                <Badge variant="secondary">{startup.stage}</Badge>
                <Badge variant="outline">{startup.country}</Badge>
                {startup.pipelineStage && <Badge variant="default">{startup.pipelineStage}</Badge>}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {startup.rank && (
                <div className="flex items-center gap-2 bg-primary/10 px-4 py-3 rounded-lg">
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Rank</div>
                    <div className="text-2xl font-bold text-primary">#{startup.rank}</div>
                  </div>
                </div>
              )}
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-10 w-10">
                <span className="text-2xl">×</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content with Tabs */}
      <div className="h-[calc(100vh-100px)] overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="initial-assessment">Initial Assessment</TabsTrigger>
              {canAddScorecard && <TabsTrigger value="scorecards">Investment Scorecard</TabsTrigger>}
              {canAddMeetings && <TabsTrigger value="issues">Threshold Issues</TabsTrigger>}
              {(canAddTranscript || canAddPitchDeck) && <TabsTrigger value="documents">Documents</TabsTrigger>}
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              {/* Current Stage Section */}
              <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-xl p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-blue-700 dark:text-blue-400 mb-2 text-xl">
                      Current Stage: {startup.pipelineStage || "Deal Flow"}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {!canAddTranscript && "Move to First Meeting to add transcripts"}
                      {canAddTranscript && !canAddPitchDeck && "You can now add meeting transcripts"}
                      {canAddPitchDeck && !canAddScorecard && "You can now add pitch decks and detailed scorecards"}
                      {canGenerateMemo && "You can now generate investment memos"}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {canGenerateReport && onGenerateReport && (
                      <Button onClick={() => onGenerateReport(startup.id)} variant="outline" size="lg">
                        Generate Deal Report (PDF)
                      </Button>
                    )}
                    {nextStage && onUpdateStage && (
                      <Button onClick={() => onUpdateStage(startup.id, nextStage)} size="lg">
                        {getAdvanceButtonText(nextStage)}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Scores Section */}
              {startup.aiScores && (
                <div className="bg-gradient-to-br from-background to-muted/30 border-2 border-border rounded-xl p-8 shadow-lg">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="font-bold text-foreground text-2xl">AI-Generated Scores</h3>
                    {onRegenerateScores && (
                      <Button size="default" variant="outline" onClick={() => onRegenerateScores(startup.id)}>
                        Regenerate Analysis
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                    AI scores are automatically updated when you add new data (transcripts, pitch decks, scorecards).
                    Click "Regenerate Analysis" to manually refresh the scores.
                  </p>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* LLM Score */}
                    <div className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                          LLM Score
                        </div>
                        <div className="text-4xl font-bold text-primary">{startup.aiScores.llm}</div>
                      </div>
                      <Progress value={startup.aiScores.llm} className="h-3 mb-4" />
                      {startup.aiScores.llmAnalysis && (
                        <p className="text-sm text-muted-foreground leading-relaxed">{startup.aiScores.llmAnalysis}</p>
                      )}
                    </div>

                    {/* ML Score */}
                    <div className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                          ML Score
                        </div>
                        <div className="text-4xl font-bold text-primary">{startup.aiScores.ml}</div>
                      </div>
                      <Progress value={startup.aiScores.ml} className="h-3 mb-4" />
                      {startup.aiScores.mlAnalysis && (
                        <p className="text-sm text-muted-foreground leading-relaxed">{startup.aiScores.mlAnalysis}</p>
                      )}
                    </div>

                    {/* Sentiment Score */}
                    <div className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                          Sentiment
                        </div>
                        <div className="text-4xl font-bold text-primary">{startup.aiScores.sentiment}</div>
                      </div>
                      <Progress value={startup.aiScores.sentiment} className="h-3 mb-4" />
                      {startup.aiScores.sentimentAnalysis && (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {startup.aiScores.sentimentAnalysis}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Composite Score */}
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/30 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-foreground">Composite Score</span>
                        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                          Combined LLM analysis, machine learning predictions, and market sentiment for comprehensive
                          investment rating
                        </p>
                      </div>
                      <span className="text-6xl font-bold text-primary">{startup.score}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Investment Scorecard Scores section to Overview */}
              {startup.feedback && startup.feedback.length > 0 && (
                <div className="bg-gradient-to-br from-background to-muted/30 border-2 border-border rounded-xl p-8 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-bold text-foreground text-2xl">Investment Scorecard</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Latest evaluation completed on{" "}
                        {new Date(startup.feedback[startup.feedback.length - 1].createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button size="default" variant="outline" onClick={() => setActiveTab("scorecards")}>
                      View All Scorecards
                    </Button>
                  </div>

                  {(() => {
                    const latestFeedback = startup.feedback[startup.feedback.length - 1]
                    const overallScore =
                      (latestFeedback.scores.team +
                        latestFeedback.scores.market +
                        latestFeedback.scores.product +
                        latestFeedback.scores.businessModel +
                        latestFeedback.scores.traction +
                        latestFeedback.scores.investmentReadiness) /
                      6

                    return (
                      <>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                          {/* Team Quality */}
                          <div className="bg-card border border-border rounded-lg p-4">
                            <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
                              Team Quality
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-3xl font-bold text-primary">{latestFeedback.scores.team}</div>
                              <div className="text-sm text-muted-foreground">/10</div>
                            </div>
                            <Progress value={latestFeedback.scores.team * 10} className="h-2 mt-2" />
                          </div>

                          {/* Market Opportunity */}
                          <div className="bg-card border border-border rounded-lg p-4">
                            <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
                              Market Opportunity
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-3xl font-bold text-primary">{latestFeedback.scores.market}</div>
                              <div className="text-sm text-muted-foreground">/10</div>
                            </div>
                            <Progress value={latestFeedback.scores.market * 10} className="h-2 mt-2" />
                          </div>

                          {/* Product/Technology */}
                          <div className="bg-card border border-border rounded-lg p-4">
                            <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
                              Product/Technology
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-3xl font-bold text-primary">{latestFeedback.scores.product}</div>
                              <div className="text-sm text-muted-foreground">/10</div>
                            </div>
                            <Progress value={latestFeedback.scores.product * 10} className="h-2 mt-2" />
                          </div>

                          {/* Business Model */}
                          <div className="bg-card border border-border rounded-lg p-4">
                            <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
                              Business Model
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-3xl font-bold text-primary">
                                {latestFeedback.scores.businessModel}
                              </div>
                              <div className="text-sm text-muted-foreground">/10</div>
                            </div>
                            <Progress value={latestFeedback.scores.businessModel * 10} className="h-2 mt-2" />
                          </div>

                          {/* Traction/Metrics */}
                          <div className="bg-card border border-border rounded-lg p-4">
                            <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
                              Traction/Metrics
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-3xl font-bold text-primary">{latestFeedback.scores.traction}</div>
                              <div className="text-sm text-muted-foreground">/10</div>
                            </div>
                            <Progress value={latestFeedback.scores.traction * 10} className="h-2 mt-2" />
                          </div>

                          {/* Investment Readiness */}
                          <div className="bg-card border border-border rounded-lg p-4">
                            <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
                              Investment Readiness
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-3xl font-bold text-primary">
                                {latestFeedback.scores.investmentReadiness}
                              </div>
                              <div className="text-sm text-muted-foreground">/10</div>
                            </div>
                            <Progress value={latestFeedback.scores.investmentReadiness * 10} className="h-2 mt-2" />
                          </div>
                        </div>

                        {/* Overall Score */}
                        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/30 rounded-xl p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-lg font-bold text-foreground">Overall Scorecard Rating</span>
                              <p className="text-sm text-muted-foreground mt-1">
                                Average across all six investment criteria
                              </p>
                            </div>
                            <span className="text-6xl font-bold text-primary">{overallScore.toFixed(1)}</span>
                          </div>
                        </div>

                        {/* Notes if available */}
                        {latestFeedback.notes && (
                          <div className="bg-muted/50 rounded-lg p-4 mt-4">
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                              Evaluation Notes
                            </div>
                            <p className="text-sm text-foreground leading-relaxed">{latestFeedback.notes}</p>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              )}

              {/* Investment Scorecard Prompt */}
              {canAddScorecard && (!startup.feedback || startup.feedback.length === 0) && (
                <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-500/30 rounded-xl p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-amber-700 dark:text-amber-400 mb-2 text-lg">
                        Investment Scorecard Available
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Complete a detailed investment scorecard to evaluate this startup across six key criteria.
                      </p>
                    </div>
                    <Button onClick={() => setActiveTab("scorecards")} variant="outline" className="shrink-0">
                      Fill Scorecard
                    </Button>
                  </div>
                </div>
              )}

              {/* Description Section */}
              <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
                <h3 className="font-bold text-foreground mb-4 text-xl">Description</h3>
                <p className="text-base text-muted-foreground leading-relaxed">{startup.description}</p>
              </div>

              {/* Company Information & Market Info Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Company Information Section */}
                {startup.companyInfo && (
                  <div className="bg-gradient-to-br from-card to-muted/20 border border-border rounded-xl p-6 shadow-sm">
                    <h3 className="font-bold text-foreground mb-6 text-lg flex items-center gap-2">
                      <span className="w-1 h-6 bg-primary rounded-full"></span>
                      Company Information
                    </h3>
                    <div className="space-y-4">
                      {startup.companyInfo.founded && (
                        <div className="flex justify-between items-start">
                          <div className="text-sm text-muted-foreground">Founded</div>
                          <div className="text-base font-semibold text-right">{startup.companyInfo.founded}</div>
                        </div>
                      )}
                      {startup.companyInfo.founders && (
                        <div className="flex justify-between items-start">
                          <div className="text-sm text-muted-foreground">Founders</div>
                          <div className="text-base font-semibold text-right">{startup.companyInfo.founders}</div>
                        </div>
                      )}
                      {startup.companyInfo.headquarters && (
                        <div className="flex justify-between items-start">
                          <div className="text-sm text-muted-foreground">Headquarters</div>
                          <div className="text-base font-semibold text-right">{startup.companyInfo.headquarters}</div>
                        </div>
                      )}
                      {startup.companyInfo.employeeCount && (
                        <div className="flex justify-between items-start">
                          <div className="text-sm text-muted-foreground">Employees</div>
                          <div className="text-base font-semibold text-right">
                            {startup.companyInfo.employeeCount} employees
                          </div>
                        </div>
                      )}
                      {startup.companyInfo.fundingRaised && (
                        <div className="flex justify-between items-start">
                          <div className="text-sm text-muted-foreground">Funding Raised</div>
                          <div className="text-base font-semibold text-right">{startup.companyInfo.fundingRaised}</div>
                        </div>
                      )}
                      {startup.companyInfo.contactInfo && (
                        <div className="flex justify-between items-start">
                          <div className="text-sm text-muted-foreground">Contact</div>
                          <div className="text-base font-semibold text-right">{startup.companyInfo.contactInfo}</div>
                        </div>
                      )}
                      {startup.companyInfo.website && (
                        <div className="flex justify-between items-start">
                          <div className="text-sm text-muted-foreground">Website</div>
                          <a
                            href={startup.companyInfo.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-base font-semibold text-primary hover:underline text-right"
                          >
                            {startup.companyInfo.website.replace("https://", "")}
                          </a>
                        </div>
                      )}
                      {startup.companyInfo.linkedin && (
                        <div className="flex justify-between items-start">
                          <div className="text-sm text-muted-foreground">LinkedIn</div>
                          <a
                            href={startup.companyInfo.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-base font-semibold text-primary hover:underline text-right"
                          >
                            View Profile
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Market & Industry Information Section */}
                {startup.marketInfo && (
                  <div className="bg-gradient-to-br from-card to-muted/20 border border-border rounded-xl p-6 shadow-sm">
                    <h3 className="font-bold text-foreground mb-6 text-lg flex items-center gap-2">
                      <span className="w-1 h-6 bg-primary rounded-full"></span>
                      Market & Industry
                    </h3>
                    <div className="space-y-4">
                      {startup.marketInfo.industry && (
                        <div className="flex justify-between items-start">
                          <div className="text-sm text-muted-foreground">Industry</div>
                          <div className="text-base font-semibold text-right">{startup.marketInfo.industry}</div>
                        </div>
                      )}
                      {startup.marketInfo.subIndustry && (
                        <div className="flex justify-between items-start">
                          <div className="text-sm text-muted-foreground">Sub-Industry</div>
                          <div className="text-base font-semibold text-right">{startup.marketInfo.subIndustry}</div>
                        </div>
                      )}
                      {startup.marketInfo.marketSize && (
                        <div className="flex justify-between items-start">
                          <div className="text-sm text-muted-foreground">Market Size</div>
                          <div className="text-base font-semibold text-right">{startup.marketInfo.marketSize}</div>
                        </div>
                      )}
                      {startup.marketInfo.segment && (
                        <div className="flex justify-between items-start">
                          <div className="text-sm text-muted-foreground">Segment</div>
                          <div className="text-base font-semibold text-right">{startup.marketInfo.segment}</div>
                        </div>
                      )}
                      {startup.marketInfo.targetPersona && (
                        <div className="flex justify-between items-start">
                          <div className="text-sm text-muted-foreground">Target Persona</div>
                          <div className="text-base font-semibold text-right">{startup.marketInfo.targetPersona}</div>
                        </div>
                      )}
                      {startup.marketInfo.customerProfile && (
                        <div className="flex justify-between items-start">
                          <div className="text-sm text-muted-foreground">Customer Profile</div>
                          <div className="text-base font-semibold text-right">{startup.marketInfo.customerProfile}</div>
                        </div>
                      )}
                      {startup.marketInfo.aiDisruptionPropensity && (
                        <div className="flex justify-between items-start">
                          <div className="text-sm text-muted-foreground">AI Disruption</div>
                          <div className="text-base font-semibold text-right">
                            {startup.marketInfo.aiDisruptionPropensity}
                          </div>
                        </div>
                      )}
                      {startup.marketInfo.marketFragmentation && (
                        <div className="flex justify-between items-start">
                          <div className="text-sm text-muted-foreground">Market Fragmentation</div>
                          <div className="text-base font-semibold text-right">
                            {startup.marketInfo.marketFragmentation}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Product & Business Model Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Product Information Section */}
                {startup.productInfo && (
                  <div className="bg-gradient-to-br from-card to-muted/20 border border-border rounded-xl p-6 shadow-sm">
                    <h3 className="font-bold text-foreground mb-6 text-lg flex items-center gap-2">
                      <span className="w-1 h-6 bg-primary rounded-full"></span>
                      Product
                    </h3>
                    <div className="space-y-4">
                      {startup.productInfo.productName && (
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Product Name</div>
                          <div className="text-base font-semibold">{startup.productInfo.productName}</div>
                        </div>
                      )}
                      {startup.productInfo.problemSolved && (
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Problem Solved</div>
                          <div className="text-base font-medium leading-relaxed">
                            {startup.productInfo.problemSolved}
                          </div>
                        </div>
                      )}
                      {startup.productInfo.valueProp && (
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Value Proposition</div>
                          <div className="text-base font-medium leading-relaxed">{startup.productInfo.valueProp}</div>
                        </div>
                      )}
                      {startup.productInfo.moat && (
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Moat</div>
                          <div className="text-base font-medium leading-relaxed">{startup.productInfo.moat}</div>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        {startup.productInfo.painIntensity && (
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Pain Intensity</div>
                            <div className="text-sm font-semibold">{startup.productInfo.painIntensity}</div>
                          </div>
                        )}
                        {startup.productInfo.productStatus && (
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Status</div>
                            <div className="text-sm font-semibold">{startup.productInfo.productStatus}</div>
                          </div>
                        )}
                        {startup.productInfo.horizontalOrVertical && (
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Type</div>
                            <div className="text-sm font-semibold">{startup.productInfo.horizontalOrVertical}</div>
                          </div>
                        )}
                        {startup.productInfo.adoption && (
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Adoption</div>
                            <div className="text-sm font-semibold">{startup.productInfo.adoption}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Business Model Section */}
                {startup.businessModelInfo && (
                  <div className="bg-gradient-to-br from-card to-muted/20 border border-border rounded-xl p-6 shadow-sm">
                    <h3 className="font-bold text-foreground mb-6 text-lg flex items-center gap-2">
                      <span className="w-1 h-6 bg-primary rounded-full"></span>
                      Business Model
                    </h3>
                    <div className="space-y-4">
                      {startup.businessModelInfo.modelType && (
                        <div className="flex justify-between items-start">
                          <div className="text-sm text-muted-foreground">Model Type</div>
                          <div className="text-base font-semibold text-right">
                            {startup.businessModelInfo.modelType}
                          </div>
                        </div>
                      )}
                      {startup.businessModelInfo.revenueModel && (
                        <div className="flex justify-between items-start">
                          <div className="text-sm text-muted-foreground">Revenue Model</div>
                          <div className="text-base font-semibold text-right">
                            {startup.businessModelInfo.revenueModel}
                          </div>
                        </div>
                      )}
                      {startup.businessModelInfo.pricingStrategy && (
                        <div className="flex justify-between items-start">
                          <div className="text-sm text-muted-foreground">Pricing Strategy</div>
                          <div className="text-base font-semibold text-right">
                            {startup.businessModelInfo.pricingStrategy}
                          </div>
                        </div>
                      )}
                      {startup.businessModelInfo.unitEconomics && (
                        <div className="flex justify-between items-start">
                          <div className="text-sm text-muted-foreground">Unit Economics</div>
                          <div className="text-base font-semibold text-right">
                            {startup.businessModelInfo.unitEconomics}
                          </div>
                        </div>
                      )}
                      {startup.businessModelInfo.capitalIntensity && (
                        <div className="flex justify-between items-start">
                          <div className="text-sm text-muted-foreground">Capital Intensity</div>
                          <div className="text-base font-semibold text-right">
                            {startup.businessModelInfo.capitalIntensity}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Sales & Team Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales & Go-to-Market Section */}
                {startup.salesInfo && (
                  <div className="bg-gradient-to-br from-card to-muted/20 border border-border rounded-xl p-6 shadow-sm">
                    <h3 className="font-bold text-foreground mb-6 text-lg flex items-center gap-2">
                      <span className="w-1 h-6 bg-primary rounded-full"></span>
                      Sales & Go-to-Market
                    </h3>
                    <div className="space-y-4">
                      {startup.salesInfo.salesMotion && (
                        <div className="flex justify-between items-start">
                          <div className="text-sm text-muted-foreground">Sales Motion</div>
                          <div className="text-base font-semibold text-right">{startup.salesInfo.salesMotion}</div>
                        </div>
                      )}
                      {startup.salesInfo.salesCycleLength && (
                        <div className="flex justify-between items-start">
                          <div className="text-sm text-muted-foreground">Sales Cycle</div>
                          <div className="text-base font-semibold text-right">{startup.salesInfo.salesCycleLength}</div>
                        </div>
                      )}
                      {startup.salesInfo.numberOfCustomers && (
                        <div className="flex justify-between items-start">
                          <div className="text-sm text-muted-foreground">Customers</div>
                          <div className="text-base font-semibold text-right">
                            {startup.salesInfo.numberOfCustomers}
                          </div>
                        </div>
                      )}
                      {startup.salesInfo.gtmStrategy && (
                        <div className="flex justify-between items-start">
                          <div className="text-sm text-muted-foreground">GTM Strategy</div>
                          <div className="text-base font-semibold text-right">{startup.salesInfo.gtmStrategy}</div>
                        </div>
                      )}
                      {startup.salesInfo.channels && (
                        <div className="flex justify-between items-start">
                          <div className="text-sm text-muted-foreground">Channels</div>
                          <div className="text-base font-semibold text-right">{startup.salesInfo.channels}</div>
                        </div>
                      )}
                      {startup.salesInfo.adoptionRate && (
                        <div className="flex justify-between items-start">
                          <div className="text-sm text-muted-foreground">Adoption Rate</div>
                          <div className="text-base font-semibold text-right">{startup.salesInfo.adoptionRate}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Team Details Section */}
                {startup.teamInfo && (
                  <div className="bg-gradient-to-br from-card to-muted/20 border border-border rounded-xl p-6 shadow-sm">
                    <h3 className="font-bold text-foreground mb-6 text-lg flex items-center gap-2">
                      <span className="w-1 h-6 bg-primary rounded-full"></span>
                      Team Details
                    </h3>
                    <div className="space-y-4">
                      {startup.teamInfo.teamDepth && (
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Team Depth</div>
                          <div className="text-base font-medium leading-relaxed">{startup.teamInfo.teamDepth}</div>
                        </div>
                      )}
                      {startup.teamInfo.keyTeamMembers && (
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Key Team Members</div>
                          <div className="text-base font-medium leading-relaxed">{startup.teamInfo.keyTeamMembers}</div>
                        </div>
                      )}
                      {startup.teamInfo.boardMembers && (
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Board Members</div>
                          <div className="text-base font-medium leading-relaxed">{startup.teamInfo.boardMembers}</div>
                        </div>
                      )}
                      {startup.teamInfo.advisors && (
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Advisors</div>
                          <div className="text-base font-medium leading-relaxed">{startup.teamInfo.advisors}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Financial & Competitive Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Financial Details Section */}
                {startup.financialInfo && (
                  <div className="bg-gradient-to-br from-card to-muted/20 border border-border rounded-xl p-6 shadow-sm">
                    <h3 className="font-bold text-foreground mb-6 text-lg flex items-center gap-2">
                      <span className="w-1 h-6 bg-primary rounded-full"></span>
                      Financial Details
                    </h3>
                    <div className="space-y-4">
                      {startup.financialInfo.capitalRaised && (
                        <div className="flex justify-between items-start">
                          <div className="text-sm text-muted-foreground">Capital Raised</div>
                          <div className="text-base font-semibold text-right">
                            {startup.financialInfo.capitalRaised}
                          </div>
                        </div>
                      )}
                      {startup.financialInfo.leadInvestors && (
                        <div className="flex justify-between items-start">
                          <div className="text-sm text-muted-foreground">Lead Investors</div>
                          <div className="text-base font-semibold text-right">
                            {startup.financialInfo.leadInvestors}
                          </div>
                        </div>
                      )}
                      {startup.financialInfo.estimatedRevenue && (
                        <div className="flex justify-between items-start">
                          <div className="text-sm text-muted-foreground">Est. Revenue</div>
                          <div className="text-base font-semibold text-right">
                            {startup.financialInfo.estimatedRevenue}
                          </div>
                        </div>
                      )}
                      {startup.financialInfo.burnRate && (
                        <div className="flex justify-between items-start">
                          <div className="text-sm text-muted-foreground">Burn Rate</div>
                          <div className="text-base font-semibold text-right">{startup.financialInfo.burnRate}</div>
                        </div>
                      )}
                      {startup.financialInfo.runway && (
                        <div className="flex justify-between items-start">
                          <div className="text-sm text-muted-foreground">Runway</div>
                          <div className="text-base font-semibold text-right">{startup.financialInfo.runway}</div>
                        </div>
                      )}
                      {startup.financialInfo.capTableSummary && (
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Cap Table</div>
                          <div className="text-sm font-medium leading-relaxed">
                            {startup.financialInfo.capTableSummary}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Competitive Landscape Section */}
                {startup.competitiveInfo && (
                  <div className="bg-gradient-to-br from-card to-muted/20 border border-border rounded-xl p-6 shadow-sm">
                    <h3 className="font-bold text-foreground mb-6 text-lg flex items-center gap-2">
                      <span className="w-1 h-6 bg-primary rounded-full"></span>
                      Competitive Landscape
                    </h3>
                    <div className="space-y-4">
                      {startup.competitiveInfo.competitors && (
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Competitors</div>
                          <div className="text-base font-medium leading-relaxed">
                            {startup.competitiveInfo.competitors}
                          </div>
                        </div>
                      )}
                      {startup.competitiveInfo.comparableCompanies && (
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Comparable Companies</div>
                          <div className="text-base font-medium leading-relaxed">
                            {startup.competitiveInfo.comparableCompanies}
                          </div>
                        </div>
                      )}
                      {startup.competitiveInfo.industryMultiples && (
                        <div className="flex justify-between items-start">
                          <div className="text-sm text-muted-foreground">Industry Multiples</div>
                          <div className="text-base font-semibold text-right">
                            {startup.competitiveInfo.industryMultiples}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Customer Metrics, Risk & Valuation Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Customer Metrics Section */}
                {startup.customerMetrics && (
                  <div className="bg-gradient-to-br from-card to-muted/20 border border-border rounded-xl p-6 shadow-sm">
                    <h3 className="font-bold text-foreground mb-6 text-base flex items-center gap-2">
                      <span className="w-1 h-5 bg-primary rounded-full"></span>
                      Customer Metrics
                    </h3>
                    <div className="space-y-3">
                      {startup.customerMetrics.customerRatings && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Ratings</div>
                          <div className="text-base font-semibold">{startup.customerMetrics.customerRatings}</div>
                        </div>
                      )}
                      {startup.customerMetrics.engagement && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Engagement</div>
                          <div className="text-base font-semibold">{startup.customerMetrics.engagement}</div>
                        </div>
                      )}
                      {startup.customerMetrics.feedback && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Feedback</div>
                          <div className="text-base font-semibold">{startup.customerMetrics.feedback}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Risk & Opportunity Section */}
                {(startup.riskInfo || startup.opportunityInfo) && (
                  <div className="bg-gradient-to-br from-card to-muted/20 border border-border rounded-xl p-6 shadow-sm">
                    <h3 className="font-bold text-foreground mb-6 text-base flex items-center gap-2">
                      <span className="w-1 h-5 bg-primary rounded-full"></span>
                      Risk & Opportunity
                    </h3>
                    <div className="space-y-3">
                      {startup.riskInfo?.regulatoryRisk && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Regulatory Risk</div>
                          <div className="text-sm font-medium leading-relaxed">{startup.riskInfo.regulatoryRisk}</div>
                        </div>
                      )}
                      {startup.opportunityInfo?.exitPotential && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Exit Potential</div>
                          <div className="text-sm font-medium leading-relaxed">
                            {startup.opportunityInfo.exitPotential}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Valuation Section */}
                {startup.valuationInfo && (
                  <div className="bg-gradient-to-br from-card to-muted/20 border border-border rounded-xl p-6 shadow-sm">
                    <h3 className="font-bold text-foreground mb-6 text-base flex items-center gap-2">
                      <span className="w-1 h-5 bg-primary rounded-full"></span>
                      Valuation
                    </h3>
                    <div className="space-y-3">
                      {startup.valuationInfo.impliedValuationMultiples && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Implied Multiple</div>
                          <div className="text-base font-semibold">
                            {startup.valuationInfo.impliedValuationMultiples}
                          </div>
                        </div>
                      )}
                      {startup.valuationInfo.comparableMultiple && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Comparable</div>
                          <div className="text-base font-semibold">{startup.valuationInfo.comparableMultiple}</div>
                        </div>
                      )}
                      {startup.valuationInfo.revenueEstimate && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Revenue Est.</div>
                          <div className="text-base font-semibold">{startup.valuationInfo.revenueEstimate}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Why Invest / Why Not Grid */}
              {startup.rationale && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Why Invest Section */}
                  <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-2 border-green-500/30 rounded-xl p-6 shadow-sm">
                    <h3 className="font-bold text-green-700 dark:text-green-400 mb-4 text-lg">Why Invest</h3>
                    <ul className="space-y-3">
                      {startup.rationale.whyInvest.map((reason, idx) => (
                        <li key={idx} className="text-sm text-foreground flex items-start gap-3">
                          <span className="text-green-600 dark:text-green-400 mt-0.5 text-lg">•</span>
                          <span className="leading-relaxed">{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Why Not Section */}
                  <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-2 border-red-500/30 rounded-xl p-6 shadow-sm">
                    <h3 className="font-bold text-red-700 dark:text-red-400 mb-4 text-lg">Why Not</h3>
                    <ul className="space-y-3">
                      {startup.rationale.whyNot.map((reason, idx) => (
                        <li key={idx} className="text-sm text-foreground flex items-start gap-3">
                          <span className="text-red-600 dark:text-red-400 mt-0.5 text-lg">•</span>
                          <span className="leading-relaxed">{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Key Metrics Section */}
              {startup.detailedMetrics && (
                <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6 shadow-sm">
                  <h3 className="font-bold text-foreground mb-6 text-lg">Key Metrics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {startup.detailedMetrics.arr && (
                      <div className="bg-card rounded-lg p-5 border border-border hover:shadow-md transition-shadow">
                        <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">ARR</div>
                        <div className="text-2xl font-bold text-primary">{startup.detailedMetrics.arr}</div>
                      </div>
                    )}
                    {startup.detailedMetrics.growth && (
                      <div className="bg-card rounded-lg p-5 border border-border hover:shadow-md transition-shadow">
                        <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Growth Rate</div>
                        <div className="text-2xl font-bold text-primary">{startup.detailedMetrics.growth} YoY</div>
                      </div>
                    )}
                    {startup.detailedMetrics.teamSize && (
                      <div className="bg-card rounded-lg p-5 border border-border hover:shadow-md transition-shadow">
                        <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Team Size</div>
                        <div className="text-2xl font-bold text-primary">{startup.detailedMetrics.teamSize} people</div>
                      </div>
                    )}
                    {startup.detailedMetrics.fundingStage && (
                      <div className="bg-card rounded-lg p-5 border border-border hover:shadow-md transition-shadow">
                        <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Funding Stage</div>
                        <div className="text-2xl font-bold text-primary">{startup.detailedMetrics.fundingStage}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Team Section */}
              <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
                <h3 className="font-bold text-foreground mb-4 text-xl">Team</h3>
                <p className="text-base text-muted-foreground leading-relaxed">{startup.team}</p>
              </div>

              {/* Investment Memo Section */}
              {canGenerateMemo && (
                <div className="bg-gradient-to-br from-card to-muted/20 border-2 border-border rounded-xl p-8 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-bold text-foreground text-2xl">Investment Memo</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        Comprehensive investment analysis based on all available data
                      </p>
                    </div>
                    {onGenerateMemo && (
                      <Button size="lg" onClick={() => onGenerateMemo(startup.id)}>
                        {startup.investmentMemo ? "Regenerate" : "Generate"} Memo
                      </Button>
                    )}
                  </div>
                  {startup.investmentMemo ? (
                    <div className="bg-muted/50 rounded-lg p-6 max-h-96 overflow-y-auto border border-border">
                      <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed text-foreground">
                        {startup.investmentMemo}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-muted/30 rounded-lg border border-dashed border-border">
                      <p className="text-sm text-muted-foreground mb-2">No investment memo generated yet.</p>
                      <p className="text-sm text-muted-foreground">
                        The memo will include AI scores, scorecards, documents, and all assessment data.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Initial Assessment Tab */}
            <TabsContent value="initial-assessment" className="space-y-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-semibold text-foreground mb-2 text-lg">Initial Assessment</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Record your first impressions before meeting the startup. Use the sliders to rate key criteria and add
                  your commentary.
                </p>

                <div className="space-y-6">
                  {/* Market Opportunity */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Market Opportunity</label>
                      <span className="text-sm font-bold text-primary">{initialAssessment.marketOpportunity}/10</span>
                    </div>
                    <Slider
                      value={[initialAssessment.marketOpportunity]}
                      onValueChange={(value) =>
                        setInitialAssessment({ ...initialAssessment, marketOpportunity: value[0] })
                      }
                      min={1}
                      max={10}
                      step={1}
                      className="mb-1"
                    />
                    <p className="text-xs text-muted-foreground">How large and attractive is the market opportunity?</p>
                  </div>

                  {/* Team Quality */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Team Quality</label>
                      <span className="text-sm font-bold text-primary">{initialAssessment.teamQuality}/10</span>
                    </div>
                    <Slider
                      value={[initialAssessment.teamQuality]}
                      onValueChange={(value) => setInitialAssessment({ ...initialAssessment, teamQuality: value[0] })}
                      min={1}
                      max={10}
                      step={1}
                      className="mb-1"
                    />
                    <p className="text-xs text-muted-foreground">How strong and experienced is the founding team?</p>
                  </div>

                  {/* Product Innovation */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Product Innovation</label>
                      <span className="text-sm font-bold text-primary">{initialAssessment.productInnovation}/10</span>
                    </div>
                    <Slider
                      value={[initialAssessment.productInnovation]}
                      onValueChange={(value) =>
                        setInitialAssessment({ ...initialAssessment, productInnovation: value[0] })
                      }
                      min={1}
                      max={10}
                      step={1}
                      className="mb-1"
                    />
                    <p className="text-xs text-muted-foreground">How innovative and differentiated is the product?</p>
                  </div>

                  {/* Business Model */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Business Model</label>
                      <span className="text-sm font-bold text-primary">{initialAssessment.businessModel}/10</span>
                    </div>
                    <Slider
                      value={[initialAssessment.businessModel]}
                      onValueChange={(value) => setInitialAssessment({ ...initialAssessment, businessModel: value[0] })}
                      min={1}
                      max={10}
                      step={1}
                      className="mb-1"
                    />
                    <p className="text-xs text-muted-foreground">How viable and scalable is the business model?</p>
                  </div>

                  {/* Competitive Position */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Competitive Position</label>
                      <span className="text-sm font-bold text-primary">{initialAssessment.competitivePosition}/10</span>
                    </div>
                    <Slider
                      value={[initialAssessment.competitivePosition]}
                      onValueChange={(value) =>
                        setInitialAssessment({ ...initialAssessment, competitivePosition: value[0] })
                      }
                      min={1}
                      max={10}
                      step={1}
                      className="mb-1"
                    />
                    <p className="text-xs text-muted-foreground">How strong is their competitive position and moat?</p>
                  </div>

                  <Separator />

                  {/* Commentary */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Initial Commentary</label>
                    <Textarea
                      placeholder="Add your initial thoughts, concerns, and questions about this startup..."
                      value={initialAssessment.commentary}
                      onChange={(e) => setInitialAssessment({ ...initialAssessment, commentary: e.target.value })}
                      rows={8}
                      className="mb-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      Record your first impressions, key questions, and areas to explore in the first meeting.
                    </p>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <Button onClick={handleSaveInitialAssessment}>Save Assessment</Button>
                  </div>

                  {/* Show saved assessment if exists */}
                  {startup.initialAssessment && (
                    <div className="bg-muted/50 rounded-lg p-4 mt-4">
                      <div className="text-xs text-muted-foreground mb-2">
                        Last saved: {new Date(startup.initialAssessment.createdAt).toLocaleString()}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Market:</span>
                          <span className="ml-1 font-medium">{startup.initialAssessment.marketOpportunity}/10</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Team:</span>
                          <span className="ml-1 font-medium">{startup.initialAssessment.teamQuality}/10</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Product:</span>
                          <span className="ml-1 font-medium">{startup.initialAssessment.productInnovation}/10</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Business:</span>
                          <span className="ml-1 font-medium">{startup.initialAssessment.businessModel}/10</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Competitive:</span>
                          <span className="ml-1 font-medium">{startup.initialAssessment.competitivePosition}/10</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Documents Tab */}
            {(canAddTranscript || canAddPitchDeck) && (
              <TabsContent value="documents" className="space-y-6">
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="font-semibold text-foreground mb-4 text-lg">Documents</h3>

                  <div className="space-y-8">
                    {/* Meeting Transcript Section */}
                    {canAddTranscript && (
                      <div className="border-b border-border pb-6">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="text-base font-semibold">Meeting Transcript</span>
                            <p className="text-xs text-muted-foreground mt-1">
                              Upload meeting notes or call transcripts
                            </p>
                          </div>
                          {startup.documents?.transcript ? (
                            <Badge variant="secondary">Uploaded</Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowTranscriptInput(!showTranscriptInput)}
                            >
                              {showTranscriptInput ? "Cancel" : "Add Transcript"}
                            </Button>
                          )}
                        </div>
                        {showTranscriptInput && (
                          <div className="space-y-2">
                            <Textarea
                              placeholder="Paste meeting transcript here..."
                              value={transcript}
                              onChange={(e) => setTranscript(e.target.value)}
                              rows={6}
                            />
                            <Button size="sm" onClick={handleUploadTranscript}>
                              Upload Transcript
                            </Button>
                          </div>
                        )}
                        {startup.documents?.transcript && !showTranscriptInput && (
                          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded max-h-32 overflow-y-auto">
                            {startup.documents.transcript.substring(0, 300)}...
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pitch Deck Section */}
                    {canAddPitchDeck && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="text-base font-semibold">Pitch Deck</span>
                            <p className="text-xs text-muted-foreground mt-1">Upload PDF pitch deck or paste content</p>
                          </div>
                          {startup.documents?.pitchDeck ? (
                            <Badge variant="secondary">Uploaded</Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowPitchDeckInput(!showPitchDeckInput)}
                            >
                              {showPitchDeckInput ? "Cancel" : "Upload Pitch Deck"}
                            </Button>
                          )}
                        </div>
                        {showPitchDeckInput && (
                          <div className="space-y-3">
                            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                              <input
                                type="file"
                                accept=".pdf,application/pdf"
                                onChange={handlePitchDeckFileChange}
                                className="hidden"
                                id="pitch-deck-upload"
                              />
                              <label
                                htmlFor="pitch-deck-upload"
                                className="cursor-pointer flex flex-col items-center gap-2"
                              >
                                <div className="text-4xl">📄</div>
                                <div className="text-sm font-medium">
                                  {pitchDeckFile ? pitchDeckFile.name : "Click to upload PDF"}
                                </div>
                                <div className="text-xs text-muted-foreground">PDF files only, max 10MB</div>
                              </label>
                            </div>
                            {pitchDeckFile && (
                              <div className="flex items-center justify-between bg-muted/50 p-3 rounded">
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl">📄</span>
                                  <div>
                                    <div className="text-sm font-medium">{pitchDeckFile.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {(pitchDeckFile.size / 1024 / 1024).toFixed(2)} MB
                                    </div>
                                  </div>
                                </div>
                                <Button size="sm" onClick={handleUploadPitchDeckFile}>
                                  Upload PDF
                                </Button>
                              </div>
                            )}
                            <Separator className="my-3" />
                            <div className="text-xs text-muted-foreground mb-2">
                              Or paste pitch deck content as text:
                            </div>
                            <Textarea
                              placeholder="Paste pitch deck content or notes here..."
                              value={pitchDeck}
                              onChange={(e) => setPitchDeck(e.target.value)}
                              rows={4}
                            />
                            {pitchDeck.trim() && (
                              <Button size="sm" onClick={handleUploadPitchDeck}>
                                Upload Text Content
                              </Button>
                            )}
                          </div>
                        )}
                        {startup.documents?.pitchDeck && !showPitchDeckInput && (
                          <div className="bg-muted/50 p-4 rounded">
                            {startup.documents.pitchDeck.startsWith("data:application/pdf") ? (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl">📄</span>
                                  <div>
                                    <div className="text-sm font-medium">Pitch Deck PDF</div>
                                    <div className="text-xs text-muted-foreground">PDF document uploaded</div>
                                  </div>
                                </div>
                                <a
                                  href={startup.documents.pitchDeck}
                                  download="pitch-deck.pdf"
                                  className="text-sm text-primary hover:underline"
                                >
                                  Download PDF
                                </a>
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground max-h-32 overflow-y-auto">
                                {startup.documents.pitchDeck.substring(0, 300)}...
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            )}

            {/* Scorecards Tab */}
            {canAddScorecard && (
              <TabsContent value="scorecards" className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">Investment Scorecard</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Evaluate the startup across six key investment criteria
                      </p>
                    </div>
                    {!showFeedbackForm && (
                      <Button size="sm" variant="outline" onClick={() => setShowFeedbackForm(true)}>
                        New Scorecard
                      </Button>
                    )}
                  </div>

                  {showFeedbackForm && (
                    <div className="bg-muted/50 rounded-lg p-6 mb-6">
                      <FeedbackForm onSubmit={handleSubmitFeedback} onCancel={() => setShowFeedbackForm(false)} />
                    </div>
                  )}

                  {startup.feedback && startup.feedback.length > 0 ? (
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-muted-foreground">Previous Scorecards</h4>
                      {startup.feedback.map((fb) => (
                        <div key={fb.id} className="bg-muted/50 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-base font-semibold">
                              Overall: {(Object.values(fb.scores).reduce((a, b) => a + b, 0) / 6).toFixed(1)}/10
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {new Date(fb.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                            <div className="text-sm">
                              <span className="text-muted-foreground">Team:</span>
                              <span className="ml-2 font-medium">{fb.scores.team}/10</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-muted-foreground">Market:</span>
                              <span className="ml-2 font-medium">{fb.scores.market}/10</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-muted-foreground">Product:</span>
                              <span className="ml-2 font-medium">{fb.scores.product}/10</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-muted-foreground">Business Model:</span>
                              <span className="ml-2 font-medium">{fb.scores.businessModel}/10</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-muted-foreground">Traction:</span>
                              <span className="ml-2 font-medium">{fb.scores.traction}/10</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-muted-foreground">Investment Ready:</span>
                              <span className="ml-2 font-medium">{fb.scores.investmentReadiness}/10</span>
                            </div>
                          </div>
                          {fb.notes && <p className="text-sm text-muted-foreground leading-relaxed">{fb.notes}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-4">
                        No scorecards yet. Click the button above to add your first evaluation.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            )}

            {canAddMeetings && (
              <TabsContent value="issues" className="space-y-6">
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">Threshold Issues</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Track critical issues and risks that need resolution before proceeding with investment
                      </p>
                    </div>
                    {!showIssueForm && (
                      <Button size="sm" variant="outline" onClick={() => setShowIssueForm(true)}>
                        Add Issue
                      </Button>
                    )}
                  </div>

                  {/* Issue Form */}
                  {showIssueForm && (
                    <div className="bg-muted/50 rounded-lg p-6 mb-6 space-y-4">
                      <h4 className="font-medium text-base mb-4">Record New Threshold Issue</h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Category */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">Category</label>
                          <select
                            value={issueForm.category}
                            onChange={(e) =>
                              setIssueForm({
                                ...issueForm,
                                category: e.target.value as typeof issueForm.category,
                              })
                            }
                            className="w-full px-3 py-2 border border-border rounded-md bg-background"
                          >
                            <option value="Market Risk">Market Risk</option>
                            <option value="Team Risk">Team Risk</option>
                            <option value="Technology Risk">Technology Risk</option>
                            <option value="Legal Risk">Legal Risk</option>
                            <option value="Financial Risk">Financial Risk</option>
                            <option value="Competitive Risk">Competitive Risk</option>
                            <option value="Execution Risk">Execution Risk</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        {/* Risk Rating */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">Risk Rating</label>
                          <select
                            value={issueForm.riskRating}
                            onChange={(e) =>
                              setIssueForm({
                                ...issueForm,
                                riskRating: e.target.value as typeof issueForm.riskRating,
                              })
                            }
                            className="w-full px-3 py-2 border border-border rounded-md bg-background"
                          >
                            <option value="High">High Risk</option>
                            <option value="Medium">Medium Risk</option>
                            <option value="Low">Low Risk</option>
                          </select>
                        </div>
                      </div>

                      {/* Issue Description */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">Issue Description</label>
                        <Textarea
                          placeholder="Describe the threshold issue or concern that needs to be addressed..."
                          value={issueForm.issue}
                          onChange={(e) => setIssueForm({ ...issueForm, issue: e.target.value })}
                          rows={4}
                        />
                      </div>

                      {/* Mitigation / Further Research */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">Mitigation Plan / Further Research</label>
                        <Textarea
                          placeholder="Describe how this issue can be mitigated or what further research is needed..."
                          value={issueForm.mitigation}
                          onChange={(e) => setIssueForm({ ...issueForm, mitigation: e.target.value })}
                          rows={4}
                        />
                      </div>

                      {/* Status */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">Status</label>
                        <select
                          value={issueForm.status}
                          onChange={(e) =>
                            setIssueForm({
                              ...issueForm,
                              status: e.target.value as typeof issueForm.status,
                            })
                          }
                          className="w-full px-3 py-2 border border-border rounded-md bg-background"
                        >
                          <option value="Open">Open</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Accepted Risk">Accepted Risk</option>
                        </select>
                      </div>

                      {/* Form Actions */}
                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setShowIssueForm(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveIssue}>Save Issue</Button>
                      </div>
                    </div>
                  )}

                  {/* Issues List */}
                  {startup.thresholdIssues && startup.thresholdIssues.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-muted-foreground">Tracked Issues</h4>
                        <div className="flex gap-2 text-xs">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            High: {startup.thresholdIssues.filter((i) => i.riskRating === "High").length}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                            Medium: {startup.thresholdIssues.filter((i) => i.riskRating === "Medium").length}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Low: {startup.thresholdIssues.filter((i) => i.riskRating === "Low").length}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {startup.thresholdIssues
                          .sort((a, b) => {
                            // Sort by risk rating (High > Medium > Low) then by date
                            const riskOrder = { High: 0, Medium: 1, Low: 2 }
                            if (riskOrder[a.riskRating] !== riskOrder[b.riskRating]) {
                              return riskOrder[a.riskRating] - riskOrder[b.riskRating]
                            }
                            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                          })
                          .map((issue) => (
                            <div key={issue.id} className="bg-muted/30 border border-border rounded-lg p-5">
                              {/* Issue Header */}
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline" className="text-xs">
                                      {issue.category}
                                    </Badge>
                                    <Badge variant="outline" className={getRiskColor(issue.riskRating)}>
                                      {issue.riskRating} Risk
                                    </Badge>
                                    <Badge variant="outline" className={getStatusColor(issue.status)}>
                                      {issue.status}
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              {/* Issue Content */}
                              <div className="space-y-3">
                                <div>
                                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                                    Issue
                                  </div>
                                  <p className="text-sm leading-relaxed">{issue.issue}</p>
                                </div>

                                <div>
                                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                                    Mitigation / Further Research
                                  </div>
                                  <p className="text-sm leading-relaxed">{issue.mitigation}</p>
                                </div>
                              </div>

                              {/* Timestamp */}
                              <div className="text-xs text-muted-foreground mt-4 pt-3 border-t border-border flex justify-between">
                                <span>Created {new Date(issue.createdAt).toLocaleDateString()}</span>
                                {issue.updatedAt && issue.updatedAt !== issue.createdAt && (
                                  <span>Updated {new Date(issue.updatedAt).toLocaleDateString()}</span>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-4">
                        No threshold issues tracked yet. Click "Add Issue" to record critical concerns that need
                        resolution.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  )
}
