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

// =====================================
// PORTFOLIO MANAGEMENT TYPES
// =====================================

export type InvestmentStatus = "active" | "exited" | "written_off"

export type ExitType = "IPO" | "acquisition" | "secondary" | "buyback" | "write_off"

export type InvestmentType = "equity" | "safe" | "convertible" | "debt"

export type MilestoneCategory = "funding" | "product" | "revenue" | "team" | "partnership" | "customer" | "other"

export type MilestoneImpact = "positive" | "negative" | "neutral"

export type HealthStatus = "green" | "yellow" | "red"

export type CommunicationType = "call" | "email" | "meeting" | "text" | "other"

export type SupportType = "intro" | "advice" | "recruiting" | "fundraising" | "other"

export type BoardMeetingType = "regular" | "special" | "annual"

export type DocumentCategory = "term_sheet" | "spa" | "side_letter" | "board_consent" | "financials" | "cap_table" | "other"

export interface PortfolioInvestment {
  id: string
  startupId: string
  startup?: Startup

  // Investment Details
  investmentDate: Date
  investmentAmount: number
  investmentRound?: string
  investmentType: InvestmentType
  leadInvestor: boolean
  boardSeat: boolean
  boardObserver: boolean

  // Valuation at Entry
  preMoneyValuation?: number
  postMoneyValuation?: number
  equityPercentage?: number

  // Current Status
  currentValuation?: number
  currentEquityPct?: number
  lastValuationDate?: Date
  status: InvestmentStatus

  // Pro-rata Rights
  proRataRights: boolean
  proRataAmount?: number

  // Exit Information
  exitDate?: Date
  exitType?: ExitType
  exitAmount?: number
  exitMultiple?: number
  acquirer?: string

  // Notes
  investmentThesis?: string
  notes?: string

  // Related data (populated via includes)
  followOnInvestments?: FollowOnInvestment[]
  milestones?: PortfolioMilestone[]
  updates?: PortfolioUpdate[]
  boardMeetings?: BoardMeeting[]
  communications?: FounderCommunication[]
  kpiSnapshots?: KPISnapshot[]

  createdAt: Date
  updatedAt: Date
}

export interface FollowOnInvestment {
  id: string
  portfolioInvestmentId: string
  date: Date
  amount: number
  round?: string
  preMoneyValuation?: number
  postMoneyValuation?: number
  leadInvestor: boolean
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface PortfolioMilestone {
  id: string
  portfolioInvestmentId: string
  date: Date
  title: string
  category: MilestoneCategory
  description?: string
  impact?: MilestoneImpact
  createdAt: Date
  updatedAt: Date
}

export interface PortfolioUpdate {
  id: string
  portfolioInvestmentId: string
  date: Date
  period: string
  metrics?: Record<string, number | string>
  highlights?: string
  challenges?: string
  askFromInvestors?: string
  nextMilestones?: string
  overallHealth?: HealthStatus
  needsAttention: boolean
  attachments?: Array<{ name: string; url: string; type: string }>
  createdAt: Date
  updatedAt: Date
}

export interface BoardMeeting {
  id: string
  portfolioInvestmentId: string
  date: Date
  type: BoardMeetingType
  location?: string
  agenda?: string
  notes?: string
  keyDecisions?: string
  actionItems?: Array<{ item: string; owner: string; dueDate: string; status: string }>
  attendees?: Array<{ name: string; role: string; attended: boolean }>
  documents?: Array<{ name: string; url: string; type: string }>
  createdAt: Date
  updatedAt: Date
}

export interface FounderCommunication {
  id: string
  portfolioInvestmentId: string
  date: Date
  type: CommunicationType
  subject?: string
  summary?: string
  participants?: Array<{ name: string; role: string }>
  followUpRequired: boolean
  followUpDate?: Date
  supportType?: SupportType
  supportDetails?: string
  createdAt: Date
  updatedAt: Date
}

export interface KPISnapshot {
  id: string
  portfolioInvestmentId: string
  date: Date

  // Financial KPIs
  mrr?: number
  arr?: number
  revenue?: number
  grossMargin?: number
  netBurn?: number
  runway?: number
  cash?: number

  // Growth KPIs
  revenueGrowthMoM?: number
  revenueGrowthYoY?: number

  // Customer KPIs
  customers?: number
  newCustomers?: number
  churnRate?: number
  nrr?: number
  ltv?: number
  cac?: number
  ltvCacRatio?: number

  // Team KPIs
  employees?: number

  // Custom KPIs
  customKPIs?: Record<string, number | string>

  createdAt: Date
  updatedAt: Date
}

export interface PortfolioDocument {
  id: string
  startupId: string
  name: string
  category: DocumentCategory
  description?: string
  fileUrl?: string
  fileType?: string
  fileSize?: number
  version: number
  isLatest: boolean
  uploadedBy?: string
  createdAt: Date
  updatedAt: Date
}

// Portfolio Summary Metrics (computed)
export interface PortfolioSummary {
  totalInvested: number
  totalCurrentValue: number
  totalRealized: number
  unrealizedGain: number
  realizedGain: number
  totalMOIC: number
  irr?: number

  activeInvestments: number
  exitedInvestments: number
  writtenOff: number

  byStatus: {
    active: number
    exited: number
    written_off: number
  }

  bySector: Record<string, { count: number; invested: number; currentValue: number }>
  byYear: Record<string, { count: number; invested: number }>
}

// =====================================
// FOUNDER TYPES
// =====================================

// Legacy Founder type (parsed from JSON fields)
export interface Founder {
  id: string                    // `${startupId}-founder-${index}`
  name: string
  role: string                  // Default: "Founder"
  companyId: string
  companyName: string
  companySector: string
  companyRank: number | null
  education: string | null
  priorExperience: string | null
  linkedIn: string | null
  companyWebsite: string | null
  companyDescription: string | null
  companyCountry: string
  pipelineStage: PipelineStage
}

// =====================================
// NORMALIZED FOUNDER TYPES (Database)
// =====================================

// Education entry for structured storage
export interface FounderEducation {
  institution: string
  degree?: string
  field?: string
  yearStart?: number
  yearEnd?: number
}

// Experience entry for structured storage
export interface FounderExperience {
  company: string
  role: string
  description?: string
  yearStart?: number
  yearEnd?: number
  isCurrent?: boolean
}

// Database Founder model (normalized)
export interface FounderDB {
  id: string
  name: string
  normalizedName: string
  email: string | null
  linkedIn: string | null
  title: string | null
  bio: string | null
  location: string | null
  photoUrl: string | null
  education: FounderEducation[] | { raw: string } | null
  experience: FounderExperience[] | { raw: string } | null
  twitter: string | null
  github: string | null
  website: string | null
  skills: string[]
  tags: string[]
  notes: string | null
  source: string | null
  pipelineStage: string
  createdAt: Date
  updatedAt: Date
}

// Junction table for founder-company relationship
export interface FounderCompanyLink {
  id: string
  founderId: string
  startupId: string
  role: string
  title: string | null
  isPrimary: boolean
  isActive: boolean
  startDate: Date | null
  endDate: Date | null
  createdAt: Date
  updatedAt: Date
}

// Founder with company relations (for display)
export interface FounderWithCompanies extends FounderDB {
  companies: (FounderCompanyLink & {
    startup: {
      id: string
      name: string
      sector: string
      country: string
      rank: number | null
      pipelineStage: string
    }
  })[]
}

// CSV column mapping for founder upload
export interface FounderCSVMapping {
  name: string        // Required
  email?: string
  linkedIn?: string
  title?: string
  education?: string
  experience?: string
  bio?: string
  location?: string
  twitter?: string
  github?: string
  website?: string
  skills?: string     // Comma-separated
  companyName?: string  // For auto-linking to existing companies
  role?: string         // Role at the company
}

// Upload result summary
export interface FounderUploadResult {
  created: number
  duplicatesFound: number
  linked: number
  errors: string[]
}

// Potential duplicate match during upload
export interface FounderDuplicateMatch {
  uploadIndex: number
  uploadedName: string
  existingFounder: FounderDB
  matchType: 'exact_linkedin' | 'exact_email' | 'name_match'
  confidence: number // 0-100
}
