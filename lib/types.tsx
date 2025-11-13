// ... existing code ...

import type { Startup as PrismaStartup } from "@prisma/client"

// Extend Prisma Startup type with computed properties
export type Startup = PrismaStartup & {
  shortlisted?: boolean // Computed property added by API based on UserShortlist
  thresholdIssues?: ThresholdIssue[] // Relation included in some queries
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
  source: "AI" | "Manual" // Tracks how the issue was created
  identifiedDate?: string
  createdAt: Date
  updatedAt: Date
}

// <CHANGE> Added investment scorecard interfaces
export interface ScorecardCriterion {
  section: string
  criterion: string
  guidingQuestions: string
  low: string // 1-3 description
  medium: string // 4-6 description
  high: string // 7-10 description
  weight: number // percentage
  score?: number // 1-10, user input
}

export interface InvestmentScorecard {
  criteria: ScorecardCriterion[]
  totalScore?: number // calculated weighted score
  lastUpdated?: Date
}
// </CHANGE>

export type PipelineStage =
  | "Deal Flow"
  | "Shortlist"
  | "Intro Sent"
  | "First Meeting"
  | "Due Diligence"
  | "Partner Review"
  | "Term Sheet"
  | "Closed"

// CSV Upload Types
export interface CSVPreview {
  headers: string[]
  sampleRows: string[][]
  rowCount: number
}

export interface ColumnMapping {
  // Core fields
  name?: string
  description?: string
  country?: string
  website?: string
  urls?: string
  investmentDate?: string
  status?: string

  // Company info
  linkedinUrl?: string
  linkedin?: string
  location?: string
  headquarters?: string
  employeeSize?: string
  numEmployees?: string
  employeeCount?: string
  area?: string
  ventureCapitalFirm?: string
  foundingYear?: string
  founded?: string
  founders?: string
  fundingRaised?: string

  // Team info
  foundersEducation?: string
  foundersPriorExperience?: string
  keyTeamMembers?: string
  teamDepth?: string
  teamSize?: string
  team?: string

  // Market info
  sector?: string
  industry?: string
  subIndustry?: string
  marketSize?: string
  aiDisruptionPropensity?: string
  targetPersona?: string
  b2bOrB2c?: string
  marketCompetitionAnalysis?: string

  // Sales info
  salesMotion?: string
  salesCycleLength?: string
  gtmStrategy?: string
  channels?: string
  salesComplexity?: string

  // Product info
  productName?: string
  problemSolved?: string
  horizontalOrVertical?: string
  moat?: string

  // Business model
  revenueModel?: string
  pricingStrategy?: string
  unitEconomics?: string

  // Competitive info
  competitors?: string
  industryMultiples?: string

  // Risk & opportunity
  regulatoryRisk?: string
  exitPotential?: string

  // AI scores & analysis
  score?: string
  machineLearningScore?: string
  xgBoost?: string
  lightGBM?: string
  arconicLlmRules?: string
  investmentScoreOverview?: string
  keyStrengths?: string
  areasOfConcern?: string
  teamExecutionAssessment?: string

  // Legacy fields
  stage?: string
  metrics?: string
  arr?: string
  growth?: string
  fundingStage?: string
}
