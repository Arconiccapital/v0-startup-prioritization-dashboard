export interface Startup {
  id: string
  name: string
  sector: string
  stage: string
  country: string // Added country field
  description: string
  team: string
  metrics: string
  score: number
  rank?: number
  feedback?: StartupFeedback[]
  initialAssessment?: InitialAssessment // Added initialAssessment field for pre-meeting impressions
  aiScores?: {
    llm: number
    ml: number
    sentiment: number
    llmAnalysis?: string
    mlAnalysis?: string
    sentimentAnalysis?: string
  }
  rationale?: {
    whyInvest: string[]
    whyNot: string[]
  }
  detailedMetrics?: {
    arr?: string
    growth?: string
    teamSize?: number
    fundingStage?: string
  }
  companyInfo?: {
    founded?: string
    headquarters?: string
    website?: string
    linkedin?: string
    employeeCount?: number
    fundingRaised?: string
    founders?: string
    contactInfo?: string
  }
  marketInfo?: {
    industry?: string
    subIndustry?: string
    aiDisruptionPropensity?: string
    marketSize?: string
    segment?: string
    targetPersona?: string
    customerProfile?: string
    marketFragmentation?: string
  }
  productInfo?: {
    productName?: string
    problemSolved?: string
    painIntensity?: string
    productStatus?: string
    horizontalOrVertical?: string
    stackPosition?: string
    uniqueFeatures?: string
    adoption?: string
    valueProp?: string
    moat?: string
  }
  businessModelInfo?: {
    modelType?: string
    revenueModel?: string
    pricingStrategy?: string
    unitEconomics?: string
    capitalIntensity?: string
  }
  salesInfo?: {
    salesMotion?: string
    salesCycleLength?: string
    customerValidation?: string
    numberOfCustomers?: string
    gtmStrategy?: string
    channels?: string
    salesComplexity?: string
    adoptionRate?: string
  }
  teamInfo?: {
    teamDepth?: string
    keyTeamMembers?: string
    boardMembers?: string
    advisors?: string
  }
  financialInfo?: {
    capitalRaised?: string
    leadInvestors?: string
    capTableSummary?: string
    estimatedRevenue?: string
    burnRate?: string
    runway?: string
  }
  competitiveInfo?: {
    competitors?: string
    comparableCompanies?: string
    industryMultiples?: string
  }
  customerMetrics?: {
    customerRatings?: string
    engagement?: string
    feedback?: string
  }
  riskInfo?: {
    regulatoryRisk?: string
    ipPatents?: string
  }
  opportunityInfo?: {
    exitPotential?: string
    milestones?: string
    notablePartners?: string
  }
  valuationInfo?: {
    impliedValuationMultiples?: string
    comparableMultiple?: string
    revenueEstimate?: string
  }
  pipelineStage?: PipelineStage
  documents?: {
    transcript?: string
    pitchDeck?: string
  }
  investmentMemo?: string
  thresholdMeetings?: ThresholdMeeting[] // Added thresholdMeetings field for tracking key meetings and decisions
  thresholdIssues?: ThresholdIssue[] // Added thresholdIssues field for tracking critical deal-breaker issues
}

export interface StartupFeedback {
  id: string
  startupId: string
  scores: {
    team: number // 1-10
    market: number // 1-10
    product: number // 1-10
    businessModel: number // 1-10
    traction: number // 1-10
    investmentReadiness: number // 1-10
  }
  notes: string
  createdAt: Date
}

export interface ScoreBreakdown {
  ml: number
  llm: number
  composite: number
  rationale?: string
}

export interface ColumnMapping {
  name?: string
  sector?: string
  stage?: string
  description?: string
  team?: string
  metrics?: string
  score?: string
  country?: string
  founded?: string
  headquarters?: string
  website?: string
  linkedin?: string
  employeeCount?: string
  fundingRaised?: string
  arr?: string
  growth?: string
  teamSize?: string
  fundingStage?: string
}

export interface CSVPreview {
  headers: string[]
  sampleRows: string[][]
  rowCount: number
}

export interface InitialAssessment {
  marketOpportunity: number // 1-10
  teamQuality: number // 1-10
  productInnovation: number // 1-10
  businessModel: number // 1-10
  competitivePosition: number // 1-10
  commentary: string
  createdAt: Date
}

export interface ThresholdMeeting {
  id: string
  startupId: string
  date: Date
  meetingType: "First Meeting" | "Follow-up" | "Partner Meeting" | "Due Diligence" | "Final Review" | "Other"
  attendees: string
  keyPoints: string
  decision: "Proceed" | "Pass" | "More Info Needed"
  actionItems: string
  nextSteps: string
  createdAt: Date
}

export interface ThresholdIssue {
  id: string
  startupId: string
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
  createdAt: Date
  updatedAt: Date
}

export type PipelineStage =
  | "Deal Flow"
  | "Intro Sent"
  | "First Meeting"
  | "Due Diligence"
  | "Partner Review"
  | "Term Sheet"
  | "Closed"
