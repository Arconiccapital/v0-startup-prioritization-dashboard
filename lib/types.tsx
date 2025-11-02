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
