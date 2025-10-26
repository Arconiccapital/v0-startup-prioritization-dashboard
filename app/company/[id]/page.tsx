"use client"

import type React from "react"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, FileText, ExternalLink } from "lucide-react"
import { getStartupById } from "@/lib/startup-storage"
import { InvestmentMemoDialog } from "@/components/investment-memo-dialog"
import type { PipelineStage, ThresholdIssue } from "@/lib/types"
import { SCORECARD_TEMPLATE } from "@/lib/scorecard-template"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"

export default function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [memoDialogOpen, setMemoDialogOpen] = useState(false)
  const [currentMemo, setCurrentMemo] = useState<string>("")
  const [memoCompanyName, setMemoCompanyName] = useState<string>("")

  const [scorecardScores, setScorecardScores] = useState<Record<string, number>>({})

  const [startup, setStartup] = useState<ReturnType<typeof getStartupById>>(undefined)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load startup data on client side to avoid hydration mismatch
    async function loadStartup() {
      const data = await getStartupById(id)
      setStartup(data)
      setIsLoading(false)
    }
    loadStartup()
  }, [id])

  const [currentStage, setCurrentStage] = useState<PipelineStage>(startup?.pipelineStage || "Deal Flow")

  // State for initial assessment
  const [assessment, setAssessment] = useState({
    marketOpportunity: startup?.initialAssessment?.marketOpportunity || 0,
    teamQuality: startup?.initialAssessment?.teamQuality || 0,
    productInnovation: startup?.initialAssessment?.productInnovation || 0,
    businessModel: startup?.initialAssessment?.businessModel || 0,
    competitivePosition: startup?.initialAssessment?.competitivePosition || 0,
    commentary: startup?.initialAssessment?.commentary || "",
  })

  // State for threshold issues
  const [thresholdIssues, setThresholdIssues] = useState<ThresholdIssue[]>(startup?.thresholdIssues || [])
  const [showIssueForm, setShowIssueForm] = useState(false)
  const [newIssue, setNewIssue] = useState({
    category: "" as ThresholdIssue["category"],
    issue: "",
    riskRating: "" as ThresholdIssue["riskRating"],
    mitigation: "",
  })

  const [showTranscriptInput, setShowTranscriptInput] = useState(false)
  const [transcriptText, setTranscriptText] = useState("")
  const [showPitchDeckInput, setShowPitchDeckInput] = useState(false)
  const [pitchDeckFile, setPitchDeckFile] = useState<File | null>(null)

  const [assessmentScores, setAssessmentScores] = useState({
    marketOpportunity: 0,
    teamQuality: 0,
    productInnovation: 0,
    businessModel: 0,
    competitivePosition: 0,
  })
  const [assessmentCommentary, setAssessmentCommentary] = useState("")

  useEffect(() => {
    if (startup?.thresholdIssues) {
      setThresholdIssues(startup.thresholdIssues)
    }
  }, [startup]) // Re-run effect if startup changes

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  if (!startup) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Company not found</h1>
          <Button onClick={() => router.push("/")}>Back to Pipeline</Button>
        </div>
      </div>
    )
  }

  const handleGenerateMemo = () => {
    router.push(`/company/${id}/memo`)
  }

  const handleRegenerateScores = () => {
    console.log("[v0] Regenerating AI scores for startup:", startup.id)
    alert(
      "AI Score Regeneration\n\nThis feature will analyze all available data (transcripts, pitch decks, scorecards, etc.) to update the AI-generated scores.\n\nIn production, this would trigger an LLM analysis pipeline.",
    )
  }

  const handleScoreChange = (section: string, criterion: string, score: number) => {
    const key = `${section}-${criterion}`
    setScorecardScores((prev) => ({ ...prev, [key]: Math.max(0, Math.min(10, score)) }))
  }

  const calculateTotalScore = () => {
    let total = 0
    SCORECARD_TEMPLATE.forEach((criterion) => {
      const key = `${criterion.section}-${criterion.criterion}`
      const score = scorecardScores[key] || 0
      total += (score / 10) * criterion.weight
    })
    return total.toFixed(1)
  }

  const getScoreDescription = (score: number, criterion: (typeof SCORECARD_TEMPLATE)[number]) => {
    if (score >= 1 && score <= 3) return criterion.low
    if (score >= 4 && score <= 6) return criterion.medium
    if (score >= 7 && score <= 10) return criterion.high
    return ""
  }

  const handleSaveIssue = () => {
    if (!newIssue.issue.trim() || !newIssue.mitigation.trim()) {
      alert("Please fill in all fields")
      return
    }

    const newThresholdIssue: ThresholdIssue = {
      category: newIssue.category || "Other", // Default category if none selected
      issue: newIssue.issue,
      riskRating: newIssue.riskRating || "Medium", // Default risk rating
      mitigation: newIssue.mitigation,
      status: "Open",
      identifiedDate: new Date().toISOString().split("T")[0],
    }

    console.log("[v0] Saving threshold issue:", newThresholdIssue)

    // Add to local state
    setThresholdIssues((prev) => [...prev, newThresholdIssue])

    alert("Threshold issue saved successfully!")

    setNewIssue({
      category: "Other",
      issue: "",
      riskRating: "Medium",
      mitigation: "",
    })
    setShowIssueForm(false)
  }

  const getRiskColor = (rating: string) => {
    switch (rating) {
      case "High":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "Medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "Low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      default:
        return ""
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "In Progress":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "Resolved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "Accepted Risk":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      default:
        return ""
    }
  }

  const getScoreColor = (score: number) => {
    if (score === 0) return "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600"
    if (score <= 3) return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
    if (score <= 6) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
    return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
  }

  const getScoreLabel = (score: number) => {
    if (score === 0) return "Not Rated"
    if (score <= 3) return "Weak"
    if (score <= 6) return "Moderate"
    return "Strong"
  }

  const getAssessmentCompletion = () => {
    const scores = Object.values(assessmentScores)
    const completed = scores.filter((s) => s > 0).length
    return Math.round((completed / scores.length) * 100)
  }

  const handleSaveAssessment = () => {
    console.log("[v0] Saving initial assessment:", assessmentScores, assessmentCommentary)
    alert("Initial assessment saved successfully!")
  }

  const handleUploadTranscript = () => {
    if (!transcriptText.trim()) {
      alert("Please enter transcript text")
      return
    }

    console.log("[v0] Uploading transcript:", transcriptText.substring(0, 100))
    alert("Transcript uploaded successfully!")

    setTranscriptText("")
    setShowTranscriptInput(false)
  }

  const handlePitchDeckFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPitchDeckFile(e.target.files[0])
    }
  }

  const handleUploadPitchDeckFile = () => {
    if (!pitchDeckFile) {
      alert("Please select a file")
      return
    }

    console.log("[v0] Uploading pitch deck:", pitchDeckFile.name)
    alert("Pitch deck uploaded successfully!")

    setPitchDeckFile(null)
    setShowPitchDeckInput(false)
  }

  // Determine which tabs are available based on pipeline stage
  const showAdvancedTabs = true // Always show all tabs

  // Get stage-specific messaging
  const getStageMessage = (stage: PipelineStage) => {
    switch (stage) {
      case "Deal Flow":
        return "" // Removed "Initial screening in progress" message
      case "Intro Sent":
        return "" // Removed "Awaiting response from founder" message
      case "First Meeting":
        return "You can now generate investment memos"
      case "Due Diligence":
        return "Conducting detailed due diligence"
      case "Partner Review":
        return "Under partner committee review"
      case "Term Sheet":
        return "Negotiating investment terms"
      case "Closed":
        return "Investment completed"
      default:
        return ""
    }
  }

  const getStageAction = (stage: PipelineStage) => {
    switch (stage) {
      case "Deal Flow":
        return { label: "Send Introduction", action: moveToNextStage }
      case "Intro Sent":
        return { label: "Schedule First Meeting", action: moveToNextStage }
      case "First Meeting":
        return { label: "Begin Due Diligence", action: moveToNextStage }
      case "Due Diligence":
        return { label: "Submit to Partners", action: moveToNextStage }
      case "Partner Review":
        return { label: "Prepare Term Sheet", action: moveToNextStage }
      case "Term Sheet":
        return { label: "Finalize Investment", action: moveToNextStage }
      default:
        return null
    }
  }

  const moveToNextStage = () => {
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
    if (currentIndex < stages.length - 1) {
      const nextStage = stages[currentIndex + 1]
      setCurrentStage(nextStage)
    }
  }

  const stageAction = getStageAction(currentStage)

  // Helper component for displaying field data
  const DataField = ({ label, value, link }: { label: string; value?: string | number; link?: boolean }) => {
    return (
      <div className="space-y-1">
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
        {value ? (
          link && typeof value === "string" ? (
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              {value}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <div className="text-sm font-medium">{value}</div>
          )
        ) : (
          <div className="text-sm text-muted-foreground italic">Not provided</div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Pipeline
            </Button>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-lg px-4 py-1">
                #{startup.rank}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Company Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-3">{startup.name}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">{startup.sector}</Badge>
                <Badge variant="secondary">{startup.country}</Badge>
                <Badge className="bg-blue-600 hover:bg-blue-700">{startup.pipelineStage}</Badge>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="text-right">
                <div className="text-sm text-muted-foreground mb-1">LLM Score</div>
                <div className="text-5xl font-bold text-blue-600">{startup.aiScores?.llm || startup.score}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground mb-1">ML Score</div>
                <div className="text-5xl font-bold text-green-600">{startup.aiScores?.ml || startup.score}</div>
              </div>
            </div>
          </div>
          <p className="text-lg text-muted-foreground">{startup.description}</p>
        </div>

        {/* Current Stage Card */}
        <Card className="p-6 mb-8 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Current Stage: {currentStage}
              </h2>
              <p className="text-blue-700 dark:text-blue-300">{getStageMessage(currentStage)}</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleGenerateMemo}
                size="lg"
                variant="outline"
                className="gap-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white bg-transparent"
              >
                <FileText className="h-5 w-5" />
                Generate Investment Memo
              </Button>
              {stageAction && (
                <Button onClick={stageAction.action} size="lg" className="bg-blue-600 hover:bg-blue-700">
                  {stageAction.label}
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="assessment">Initial Assessment</TabsTrigger>
            <TabsTrigger value="scorecard">Investment Scorecard</TabsTrigger>
            <TabsTrigger value="issues">Threshold Issues</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* AI-Generated Scores */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-6">AI-Generated Scores</h3>
              <div className="grid grid-cols-2 gap-6">
                <Card className="p-6 border-2">
                  <div className="text-sm font-medium text-muted-foreground mb-2">LLM SCORE</div>
                  <div className="text-5xl font-bold text-blue-600 mb-4">{startup.aiScores?.llm || 0}</div>
                  <Progress value={startup.aiScores?.llm || 0} className="h-2" />
                </Card>
                <Card className="p-6 border-2">
                  <div className="text-sm font-medium text-muted-foreground mb-2">ML SCORE</div>
                  <div className="text-5xl font-bold text-green-600">{startup.aiScores?.ml || 0}</div>
                  <Progress value={startup.aiScores?.ml || 0} className="h-2" />
                </Card>
              </div>
            </Card>

            {/* Investment Analysis */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Investment Analysis</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-2 text-blue-600">Key Strengths</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {startup.rationale?.keyStrengths || "Not provided"}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-blue-600">Areas of Concern</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {startup.rationale?.areasOfConcern || "Not provided"}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-blue-600">Market & Competition Analysis</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {startup.marketInfo?.marketCompetitionAnalysis || "Not provided"}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-blue-600">Team & Execution Assessment</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {startup.teamInfo?.teamExecutionAssessment || "Not provided"}
                  </p>
                </div>
              </div>
            </Card>

            {/* Company Overview - CSV Fields 1-11 */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Company Overview</h3>
              <div className="grid grid-cols-3 gap-6">
                <DataField label="Company" value={startup.name} />
                <DataField label="Description" value={startup.description} />
                <DataField label="Country" value={startup.country} />
                <DataField label="Website" value={startup.companyInfo?.website} link />
                <DataField label="LinkedIn URL" value={startup.companyInfo?.linkedin} link />
                <DataField label="Location" value={startup.companyInfo?.location} />
                <DataField label="Employee Size" value={startup.companyInfo?.employeeCount} />
                <DataField label="Area" value={startup.companyInfo?.area} />
                <DataField label="Venture Capital Firm" value={startup.companyInfo?.ventureCapitalFirm} />
                <DataField label="Founding Year" value={startup.companyInfo?.founded} />
                <DataField label="Founders" value={startup.companyInfo?.founders} />
              </div>
            </Card>

            {/* Team & Founders */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Team & Founders</h3>
              <div className="space-y-4">
                <DataField label="Founders' Education" value={startup.teamInfo?.foundersEducation} />
                <DataField label="Founders' Prior Experience" value={startup.teamInfo?.foundersPriorExperience} />
                <DataField label="Key Team Members" value={startup.teamInfo?.keyTeamMembers} />
                <DataField label="Team Depth" value={startup.teamInfo?.teamDepth} />
                <DataField label="# Employees" value={startup.companyInfo?.employeeCount} />
              </div>
            </Card>

            {/* Market & Industry */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Market & Industry</h3>
              <div className="grid grid-cols-2 gap-6">
                <DataField label="B2B or B2C" value={startup.marketInfo?.b2bOrB2c} />
                <DataField label="Sub-Industry" value={startup.marketInfo?.subIndustry} />
                <DataField label="Market Size" value={startup.marketInfo?.marketSize} />
                <DataField label="AI Disruption Propensity" value={startup.marketInfo?.aiDisruptionPropensity} />
                <DataField label="Industry" value={startup.marketInfo?.industry} />
                <DataField label="Target Persona" value={startup.marketInfo?.targetPersona} />
              </div>
            </Card>

            {/* Sales & Go-to-Market */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Sales & Go-to-Market</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <DataField label="Sales Motion" value={startup.salesInfo?.salesMotion} />
                  <DataField label="Sales Cycle Length" value={startup.salesInfo?.salesCycleLength} />
                  <DataField label="Sales Complexity" value={startup.salesInfo?.salesComplexity} />
                </div>
                <DataField label="Go-to-Market Strategy" value={startup.salesInfo?.gtmStrategy} />
                <DataField label="Channels" value={startup.salesInfo?.channels} />
              </div>
            </Card>

            {/* Product */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <DataField label="Product Name" value={startup.productInfo?.productName} />
                  <DataField label="Horizontal or Vertical" value={startup.productInfo?.horizontalOrVertical} />
                </div>
                <DataField label="Problem Solved" value={startup.productInfo?.problemSolved} />
                <DataField label="Moat" value={startup.productInfo?.moat} />
              </div>
            </Card>

            {/* Business Model */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Business Model</h3>
              <div className="grid grid-cols-2 gap-6">
                <DataField label="Revenue Model" value={startup.businessModelInfo?.revenueModel} />
                <DataField label="Pricing Strategy" value={startup.businessModelInfo?.pricingStrategy} />
                <DataField label="Unit Economics" value={startup.businessModelInfo?.unitEconomics} />
              </div>
            </Card>

            {/* Competitive Landscape */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Competitive Landscape</h3>
              <div className="grid grid-cols-2 gap-6">
                <DataField label="Competitors" value={startup.competitiveInfo?.competitors} />
                <DataField label="Industry Multiples" value={startup.competitiveInfo?.industryMultiples} />
              </div>
            </Card>

            {/* Risk & Opportunity */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Risk & Opportunity</h3>
              <div className="grid grid-cols-2 gap-6">
                <DataField label="Regulatory Risk" value={startup.riskInfo?.regulatoryRisk} />
                <DataField label="Exit Potential" value={startup.opportunityInfo?.exitPotential} />
              </div>
            </Card>
          </TabsContent>

          {/* Initial Assessment Tab */}
          <TabsContent value="assessment">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-semibold mb-2">Initial Assessment</h3>
                  <p className="text-sm text-muted-foreground">
                    Rate your first impressions across key investment criteria
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground mb-1">Completion</div>
                  <div className="text-3xl font-bold text-primary">{getAssessmentCompletion()}%</div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Market Opportunity */}
                <Card className="p-6 border-2">
                  <div className="mb-4">
                    <h4 className="text-lg font-semibold mb-1">Market Opportunity</h4>
                    <p className="text-sm text-muted-foreground">
                      How large and attractive is the target market? Consider market size, growth rate, and timing.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                      <button
                        key={score}
                        onClick={() => setAssessmentScores({ ...assessmentScores, marketOpportunity: score })}
                        className={`flex-1 h-12 rounded-lg font-semibold transition-all ${
                          assessmentScores.marketOpportunity === score
                            ? "ring-2 ring-primary ring-offset-2 scale-105 " + getScoreColor(score)
                            : assessmentScores.marketOpportunity > 0
                              ? "bg-muted text-muted-foreground hover:bg-muted/80"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Weak</span>
                    <Badge className={getScoreColor(assessmentScores.marketOpportunity)}>
                      {getScoreLabel(assessmentScores.marketOpportunity)}
                    </Badge>
                    <span className="text-muted-foreground">Strong</span>
                  </div>
                </Card>

                {/* Team Quality */}
                <Card className="p-6 border-2">
                  <div className="mb-4">
                    <h4 className="text-lg font-semibold mb-1">Team Quality</h4>
                    <p className="text-sm text-muted-foreground">
                      How strong is the founding team? Consider experience, domain expertise, and execution ability.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                      <button
                        key={score}
                        onClick={() => setAssessmentScores({ ...assessmentScores, teamQuality: score })}
                        className={`flex-1 h-12 rounded-lg font-semibold transition-all ${
                          assessmentScores.teamQuality === score
                            ? "ring-2 ring-primary ring-offset-2 scale-105 " + getScoreColor(score)
                            : assessmentScores.teamQuality > 0
                              ? "bg-muted text-muted-foreground hover:bg-muted/80"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Weak</span>
                    <Badge className={getScoreColor(assessmentScores.teamQuality)}>
                      {getScoreLabel(assessmentScores.teamQuality)}
                    </Badge>
                    <span className="text-muted-foreground">Strong</span>
                  </div>
                </Card>

                {/* Product Innovation */}
                <Card className="p-6 border-2">
                  <div className="mb-4">
                    <h4 className="text-lg font-semibold mb-1">Product Innovation</h4>
                    <p className="text-sm text-muted-foreground">
                      How innovative and differentiated is the product? Consider uniqueness, technology, and IP.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                      <button
                        key={score}
                        onClick={() => setAssessmentScores({ ...assessmentScores, productInnovation: score })}
                        className={`flex-1 h-12 rounded-lg font-semibold transition-all ${
                          assessmentScores.productInnovation === score
                            ? "ring-2 ring-primary ring-offset-2 scale-105 " + getScoreColor(score)
                            : assessmentScores.productInnovation > 0
                              ? "bg-muted text-muted-foreground hover:bg-muted/80"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Weak</span>
                    <Badge className={getScoreColor(assessmentScores.productInnovation)}>
                      {getScoreLabel(assessmentScores.productInnovation)}
                    </Badge>
                    <span className="text-muted-foreground">Strong</span>
                  </div>
                </Card>

                {/* Business Model */}
                <Card className="p-6 border-2">
                  <div className="mb-4">
                    <h4 className="text-lg font-semibold mb-1">Business Model</h4>
                    <p className="text-sm text-muted-foreground">
                      How viable is the business model? Consider revenue potential, unit economics, and scalability.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                      <button
                        key={score}
                        onClick={() => setAssessmentScores({ ...assessmentScores, businessModel: score })}
                        className={`flex-1 h-12 rounded-lg font-semibold transition-all ${
                          assessmentScores.businessModel === score
                            ? "ring-2 ring-primary ring-offset-2 scale-105 " + getScoreColor(score)
                            : assessmentScores.businessModel > 0
                              ? "bg-muted text-muted-foreground hover:bg-muted/80"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Weak</span>
                    <Badge className={getScoreColor(assessmentScores.businessModel)}>
                      {getScoreLabel(assessmentScores.businessModel)}
                    </Badge>
                    <span className="text-muted-foreground">Strong</span>
                  </div>
                </Card>

                {/* Competitive Position */}
                <Card className="p-6 border-2">
                  <div className="mb-4">
                    <h4 className="text-lg font-semibold mb-1">Competitive Position</h4>
                    <p className="text-sm text-muted-foreground">
                      How defensible is the competitive position? Consider moat, barriers to entry, and market dynamics.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                      <button
                        key={score}
                        onClick={() => setAssessmentScores({ ...assessmentScores, competitivePosition: score })}
                        className={`flex-1 h-12 rounded-lg font-semibold transition-all ${
                          assessmentScores.competitivePosition === score
                            ? "ring-2 ring-primary ring-offset-2 scale-105 " + getScoreColor(score)
                            : assessmentScores.competitivePosition > 0
                              ? "bg-muted text-muted-foreground hover:bg-muted/80"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Weak</span>
                    <Badge className={getScoreColor(assessmentScores.competitivePosition)}>
                      {getScoreLabel(assessmentScores.competitivePosition)}
                    </Badge>
                    <span className="text-muted-foreground">Strong</span>
                  </div>
                </Card>

                {/* Commentary */}
                <Card className="p-6 border-2">
                  <div className="mb-4">
                    <h4 className="text-lg font-semibold mb-1">Overall Commentary</h4>
                    <p className="text-sm text-muted-foreground">
                      Share your initial thoughts, key observations, and any concerns or excitement about this
                      opportunity.
                    </p>
                  </div>
                  <textarea
                    value={assessmentCommentary}
                    onChange={(e) => setAssessmentCommentary(e.target.value)}
                    className="w-full p-4 border border-border rounded-lg bg-background min-h-[150px] focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Your initial impressions and key takeaways..."
                  />
                </Card>

                {/* Save Button */}
                <div className="flex justify-end gap-3">
                  <Button variant="outline" size="lg">
                    Save as Draft
                  </Button>
                  <Button onClick={handleSaveAssessment} size="lg" className="bg-blue-600 hover:bg-blue-700">
                    Save Assessment
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Investment Scorecard Tab */}
          <TabsContent value="scorecard">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Investment Scorecard</h3>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Total Score</div>
                  <div className="text-3xl font-bold text-primary">{calculateTotalScore()}</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Score each criterion from 1-10 based on the guiding questions and descriptions below.
              </p>
              <div className="space-y-8">
                {Object.entries(
                  SCORECARD_TEMPLATE.reduce(
                    (acc, criterion) => {
                      if (!acc[criterion.section]) {
                        acc[criterion.section] = []
                      }
                      acc[criterion.section].push(criterion)
                      return acc
                    },
                    {} as Record<string, (typeof SCORECARD_TEMPLATE)[number][]>,
                  ),
                ).map(([sectionName, criteria]) => (
                  <div key={sectionName}>
                    <h4 className="text-lg font-semibold mb-4 text-blue-600">{sectionName}</h4>
                    <div className="space-y-6">
                      {criteria.map((criterion, idx) => {
                        const key = `${criterion.section}-${criterion.criterion}`
                        const score = scorecardScores[key] || 0
                        return (
                          <Card key={idx} className="p-4 border-2">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h5 className="font-semibold mb-1">{criterion.criterion}</h5>
                                <p className="text-sm text-muted-foreground italic">{criterion.guidingQuestions}</p>
                              </div>
                              <div className="ml-4 flex items-center gap-3">
                                <div className="flex items-center gap-3 flex-1 max-w-md">
                                  <Slider
                                    value={[score]}
                                    onValueChange={(values) =>
                                      handleScoreChange(criterion.section, criterion.criterion, values[0])
                                    }
                                    min={0}
                                    max={10}
                                    step={1}
                                    className="flex-1"
                                  />
                                  <div className="flex items-center gap-2 min-w-[100px]">
                                    <div className="text-lg font-semibold w-8 text-center">{score}</div>
                                    <div className="text-sm text-muted-foreground">/ 10</div>
                                  </div>
                                </div>
                                <Badge variant="outline" className="ml-2">
                                  {criterion.weight}%
                                </Badge>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3 text-sm">
                              <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded border border-red-200 dark:border-red-900">
                                <div className="font-medium text-red-700 dark:text-red-300 mb-1">Low (1-3)</div>
                                <p className="text-muted-foreground">{criterion.low}</p>
                              </div>
                              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded border border-yellow-200 dark:border-yellow-900">
                                <div className="font-medium text-yellow-700 dark:text-yellow-300 mb-1">
                                  Medium (4-6)
                                </div>
                                <p className="text-muted-foreground">{criterion.medium}</p>
                              </div>
                              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-900">
                                <div className="font-medium text-green-700 dark:text-green-300 mb-1">High (7-10)</div>
                                <p className="text-muted-foreground">{criterion.high}</p>
                              </div>
                            </div>
                            {score > 0 && (
                              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded">
                                <div className="text-sm">
                                  <span className="font-semibold text-blue-700 dark:text-blue-400">
                                    Current Assessment:
                                  </span>{" "}
                                  <span className="text-muted-foreground">{getScoreDescription(score, criterion)}</span>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Weighted contribution: {((score / 10) * criterion.weight).toFixed(1)} points
                                </div>
                              </div>
                            )}
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 bg-primary/10 border border-primary/30 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Total Weighted Score</div>
                    <div className="text-4xl font-bold text-primary">{calculateTotalScore()} / 100</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground mb-2">Score Breakdown</div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      {Object.entries(
                        SCORECARD_TEMPLATE.reduce(
                          (acc, criterion) => {
                            if (!acc[criterion.section]) {
                              acc[criterion.section] = { total: 0, weight: 0 }
                            }
                            const key = `${criterion.section}-${criterion.criterion}`
                            const score = scorecardScores[key] || 0
                            acc[criterion.section].total += (score / 10) * criterion.weight
                            acc[criterion.section].weight += criterion.weight
                            return acc
                          },
                          {} as Record<string, { total: number; weight: number }>,
                        ),
                      ).map(([section, data]) => (
                        <div key={section} className="flex justify-between gap-4">
                          <span>{section}:</span>
                          <span className="font-semibold">
                            {data.total.toFixed(1)} / {data.weight}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Threshold Issues Tab */}
          <TabsContent value="issues">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Threshold Issues</h3>
                <Button onClick={() => setShowIssueForm(true)} size="sm">
                  Add Issue
                </Button>
              </div>

              {showIssueForm && (
                <div className="bg-muted border border-border rounded-lg p-4 mb-6">
                  <h4 className="font-semibold mb-4">Add New Issue</h4>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-1 block" htmlFor="issue-category">
                        Category
                      </Label>
                      <Select
                        value={newIssue.category}
                        onValueChange={(value) =>
                          setNewIssue({ ...newIssue, category: value as ThresholdIssue["category"] })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Market Risk">Market Risk</SelectItem>
                          <SelectItem value="Team Risk">Team Risk</SelectItem>
                          <SelectItem value="Technology Risk">Technology Risk</SelectItem>
                          <SelectItem value="Legal Risk">Legal Risk</SelectItem>
                          <SelectItem value="Financial Risk">Financial Risk</SelectItem>
                          <SelectItem value="Competitive Risk">Competitive Risk</SelectItem>
                          <SelectItem value="Execution Risk">Execution Risk</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-1 block" htmlFor="issue-description">
                        Issue Description
                      </Label>
                      <Textarea
                        value={newIssue.issue}
                        onChange={(e) => setNewIssue({ ...newIssue, issue: e.target.value })}
                        id="issue-description"
                        className="w-full"
                        placeholder="Describe the issue..."
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-1 block" htmlFor="issue-risk-rating">
                        Risk Rating
                      </Label>
                      <Select
                        value={newIssue.riskRating}
                        onValueChange={(value) =>
                          setNewIssue({ ...newIssue, riskRating: value as ThresholdIssue["riskRating"] })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select risk rating" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-1 block" htmlFor="issue-mitigation">
                        Mitigation Strategy
                      </Label>
                      <Textarea
                        value={newIssue.mitigation}
                        onChange={(e) => setNewIssue({ ...newIssue, mitigation: e.target.value })}
                        id="issue-mitigation"
                        className="w-full"
                        placeholder="How can this risk be mitigated?"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveIssue} size="sm">
                        Save Issue
                      </Button>
                      <Button onClick={() => setShowIssueForm(false)} variant="outline" size="sm">
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {thresholdIssues && thresholdIssues.length > 0 ? (
                  thresholdIssues.map((issue, index) => (
                    <div key={index} className="bg-muted border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex gap-2">
                          <Badge variant="outline">{issue.category}</Badge>
                          <Badge className={getRiskColor(issue.riskRating)}>{issue.riskRating} Risk</Badge>
                          <Badge className={getStatusColor(issue.status)}>{issue.status}</Badge>
                        </div>
                        {issue.identifiedDate && (
                          <div className="text-xs text-muted-foreground">Identified: {issue.identifiedDate}</div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div>
                          <div className="text-sm font-semibold text-foreground">Issue</div>
                          <div className="text-sm text-muted-foreground">{issue.issue}</div>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-foreground">Mitigation</div>
                          <div className="text-sm text-muted-foreground">{issue.mitigation}</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">No threshold issues recorded yet</p>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-6">Documents</h3>
              <div className="space-y-8">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">Meeting Transcript</h4>
                    <Button onClick={() => setShowTranscriptInput(!showTranscriptInput)} size="sm">
                      {showTranscriptInput ? "Cancel" : "Add Transcript"}
                    </Button>
                  </div>

                  {showTranscriptInput && (
                    <div className="bg-muted border border-border rounded-lg p-4 mb-4">
                      <Textarea
                        value={transcriptText}
                        onChange={(e) => setTranscriptText(e.target.value)}
                        className="w-full min-h-[200px] mb-2"
                        placeholder="Paste meeting transcript here..."
                      />
                      <Button onClick={handleUploadTranscript} size="sm">
                        Upload Transcript
                      </Button>
                    </div>
                  )}

                  {startup.documents?.transcript ? (
                    <div className="bg-muted border border-border rounded-lg p-3">
                      <div className="text-sm font-medium">Transcript Available</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {startup.documents.transcript.substring(0, 150)}...
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No transcript uploaded yet</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">Pitch Deck</h4>
                    <Button onClick={() => setShowPitchDeckInput(!showPitchDeckInput)} size="sm">
                      {showPitchDeckInput ? "Cancel" : "Add Pitch Deck"}
                    </Button>
                  </div>

                  {showPitchDeckInput && (
                    <div className="bg-muted border border-border rounded-lg p-4 mb-4">
                      <Input type="file" accept=".pdf" onChange={handlePitchDeckFileChange} className="w-full mb-2" />
                      <Button onClick={handleUploadPitchDeckFile} size="sm" disabled={!pitchDeckFile}>
                        Upload Pitch Deck
                      </Button>
                    </div>
                  )}

                  {startup.documents?.pitchDeck ? (
                    <div className="bg-muted border border-border rounded-lg p-3">
                      <div className="text-sm font-medium">Pitch Deck Available</div>
                      <div className="text-xs text-muted-foreground mt-1">PDF document uploaded</div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No pitch deck uploaded yet</p>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <InvestmentMemoDialog
        open={memoDialogOpen}
        onOpenChange={setMemoDialogOpen}
        companyName={memoCompanyName}
        memoContent={currentMemo}
      />
    </div>
  )
}
