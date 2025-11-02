// ... existing code ...

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
  | "Shortlist"
  | "Deal Flow"
  | "Intro Sent"
  | "First Meeting"
  | "Due Diligence"
  | "Partner Review"
  | "Term Sheet"
  | "Closed"
