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
  | "Screening"
  | "First Meeting"
  | "IC1"
  | "DD"
  | "IC2"
  | "Closing"
  | "Portfolio"

// Stage metadata for display and progression
export const PIPELINE_STAGES: { id: PipelineStage; label: string; description: string }[] = [
  { id: "Screening", label: "Screening", description: "Initial review and outreach" },
  { id: "First Meeting", label: "First Meeting", description: "Initial pitch and assessment" },
  { id: "IC1", label: "IC1", description: "First Investment Committee review" },
  { id: "DD", label: "Due Diligence", description: "Deep dive analysis" },
  { id: "IC2", label: "IC2 / Decision", description: "Final Investment Committee decision" },
  { id: "Closing", label: "Closing", description: "Term sheet and legal" },
  { id: "Portfolio", label: "Portfolio", description: "Active portfolio company" },
]

// Tabs that are always visible regardless of stage
export const PERSISTENT_TABS = ["overview", "documents", "outreach"]

// Map stages to their available tabs (stage-specific + persistent)
export const STAGE_TABS: Record<PipelineStage, string[]> = {
  "Screening": ["overview", "documents", "outreach"],
  "First Meeting": ["overview", "assessment", "documents", "outreach"],
  "IC1": ["overview", "assessment", "scorecard", "rejection", "documents", "outreach"],
  "DD": ["overview", "assessment", "scorecard", "issues", "valuation", "legal", "documents", "outreach"],
  "IC2": ["overview", "assessment", "scorecard", "issues", "valuation", "legal", "decision", "rejection", "documents", "outreach"],
  "Closing": ["overview", "scorecard", "issues", "valuation", "legal", "decision", "rejection", "documents", "outreach"],
  "Portfolio": ["overview", "scorecard", "issues", "valuation", "legal", "decision", "rejection", "documents", "outreach"],
}

// Investment Decision Types
export type InvestmentVote = "invest" | "pass" | "abstain"
export type InvestmentDecisionStatus = "invest" | "pass" | "more_info" | "pending"

export interface DecisionCategory {
  score: number // 1-10
  rationale: string
}

export interface InvestmentVoteRecord {
  name: string
  vote: InvestmentVote
  rationale?: string
  timestamp?: string
}

export interface InvestmentDecision {
  decision: InvestmentDecisionStatus
  decisionDate?: string
  votes: InvestmentVoteRecord[]
  categories: {
    team: DecisionCategory
    market: DecisionCategory
    product: DecisionCategory
    traction: DecisionCategory
    competition: DecisionCategory
    dealTerms: DecisionCategory
  }
  reasonsToInvest: string[]
  reasonsNotToInvest: string[]
  additionalContext: string
  nextSteps?: string
}

export const DECISION_CATEGORIES = [
  { key: "team", label: "Team & Founders", description: "Quality, experience, and execution capability of the team" },
  { key: "market", label: "Market Opportunity", description: "Size, growth potential, and timing of the market" },
  { key: "product", label: "Product & Technology", description: "Innovation, differentiation, and technical moat" },
  { key: "traction", label: "Traction & Metrics", description: "Revenue, growth, unit economics, and customer validation" },
  { key: "competition", label: "Competitive Position", description: "Defensibility, barriers to entry, and market dynamics" },
  { key: "dealTerms", label: "Deal Terms & Valuation", description: "Valuation, terms, ownership, and investment fit" },
] as const

// =====================================
// VALUATION & TERMS TYPES
// =====================================

export interface ComparableCompany {
  name: string
  valuation: number | null
  multiple: string
  notes: string
}

export interface ValuationSection {
  proposedPreMoney: number | null
  proposedPostMoney: number | null
  askingValuation: number | null
  ourOffer: number | null
  comparableCompanies: ComparableCompany[]
  valuationNotes: string
}

export interface FinancialsSection {
  currentARR: number | null
  currentMRR: number | null
  runway: number | null           // months
  burnRate: number | null         // monthly
  grossMargin: number | null      // percentage
  lastRoundValuation: number | null
  lastRoundDate: string | null
  totalRaised: number | null
  revenueGrowthRate: number | null
  financialNotes: string
}

export type TermSheetStatus = "Not Started" | "Draft" | "Sent" | "Negotiating" | "Signed" | "Declined"

export interface TermSheetSection {
  roundSize: number | null
  ourAllocation: number | null
  ownershipTarget: number | null  // percentage
  proRataRights: boolean
  boardSeat: boolean
  boardObserver: boolean
  liquidationPreference: string   // "1x non-participating", "1x participating", "2x", etc.
  antiDilution: string            // "Broad-based weighted average", "Full ratchet", "None"
  dividends: string
  votingRights: string
  protectiveProvisions: string[]
  otherTerms: string
  termSheetStatus: TermSheetStatus
  termSheetNotes: string
}

export interface ValuationData {
  valuation: ValuationSection
  financials: FinancialsSection
  termSheet: TermSheetSection
  lastUpdated: string
}

// =====================================
// LEGAL DILIGENCE TYPES
// =====================================

export type ChecklistItemStatus = "Not Started" | "Pending" | "In Progress" | "Done" | "Issue" | "N/A"

export interface ChecklistItem {
  status: ChecklistItemStatus
  notes: string
  owner?: string
  documentUrl?: string
}

export interface LegalChecklistCorporate {
  certificateOfIncorporation: ChecklistItem
  bylaws: ChecklistItem
  boardMinutes: ChecklistItem
  shareholderAgreements: ChecklistItem
  capTable: ChecklistItem
  stockOptionPlan: ChecklistItem
}

export interface LegalChecklistIP {
  patents: ChecklistItem
  trademarks: ChecklistItem
  copyrights: ChecklistItem
  ipAssignments: ChecklistItem
  openSourceCompliance: ChecklistItem
}

export interface LegalChecklistContracts {
  customerContracts: ChecklistItem
  vendorContracts: ChecklistItem
  partnershipAgreements: ChecklistItem
  leases: ChecklistItem
}

export interface LegalChecklistEmployment {
  employmentAgreements: ChecklistItem
  contractorAgreements: ChecklistItem
  ndas: ChecklistItem
  nonCompetes: ChecklistItem
  benefitsPlans: ChecklistItem
}

export interface LegalChecklistCompliance {
  regulatoryFilings: ChecklistItem
  dataPrivacy: ChecklistItem
  litigation: ChecklistItem
  insurancePolicies: ChecklistItem
}

export interface LegalChecklist {
  corporateDocs: LegalChecklistCorporate
  ip: LegalChecklistIP
  contracts: LegalChecklistContracts
  employment: LegalChecklistEmployment
  compliance: LegalChecklistCompliance
}

export type LegalIssueSeverity = "Critical" | "High" | "Medium" | "Low"
export type LegalIssueStatus = "Open" | "Resolved" | "Accepted"
export type LegalOverallStatus = "Not Started" | "In Progress" | "Issues Found" | "Clear" | "Waived"

export interface LegalIssue {
  id: string
  category: string
  issue: string
  severity: LegalIssueSeverity
  status: LegalIssueStatus
  notes: string
  identifiedDate: string
}

export interface LegalDiligenceData {
  checklist: LegalChecklist
  issues: LegalIssue[]
  overallStatus: LegalOverallStatus
  counselName: string
  counselNotes: string
  lastUpdated: string
}

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

// =====================================
// LLM-POWERED CSV COLUMN MAPPING TYPES
// =====================================

// Field schema for custom/dynamic data (stored per-startup)
export interface CustomFieldSchema {
  displayName: string
  dataType: 'text' | 'number' | 'date' | 'url' | 'boolean'
  description?: string
  originalCsvHeader?: string // Track which CSV column this came from
}

// Category schema containing multiple fields
export interface CustomCategorySchema {
  displayName: string
  sortOrder: number
  icon?: string // Lucide icon name (optional)
  fields: Record<string, CustomFieldSchema>
}

// Full custom schema structure (maps category keys to their schemas)
export type CustomSchema = Record<string, CustomCategorySchema>

// Custom data structure (maps category keys to field key-value pairs)
export type CustomData = Record<string, Record<string, unknown>>

// Individual field mapping suggestion from LLM
export interface LLMMappingSuggestion {
  csvHeader: string           // Original CSV column header
  suggestedCategory: string   // Category key (e.g., "companyInfo", "customFinancials")
  suggestedField: string      // Field key within the category
  categoryType: 'existing' | 'new'  // Whether this maps to predefined or new category
  confidence: number          // 0-100 confidence score
  reasoning: string           // Short explanation of why this mapping was chosen
  alternativeCategories?: string[]  // Other possible category matches
  sampleValue?: string        // Sample value from CSV for context
}

// New category suggestion from LLM (when data doesn't fit existing categories)
export interface NewCategorySuggestion {
  name: string                // Key name (e.g., "financialMetrics")
  displayName: string         // Display name (e.g., "Financial Metrics")
  fieldType: CustomFieldSchema['dataType']
  parentSection?: string      // Optional grouping hint
  description?: string        // What this category captures
}

// Request payload for /api/csv-analyze
export interface LLMAnalyzeRequest {
  headers: string[]           // All CSV column headers
  sampleRows: string[][]      // 3-5 sample rows of data
  existingCategories: string[] // Current predefined category names
  userContext?: string        // Optional user feedback for re-analysis
  preserveMappings?: Record<string, { category: string; field: string }> // User-edited mappings to preserve
}

// Response from /api/csv-analyze
export interface LLMAnalyzeResponse {
  mappings: LLMMappingSuggestion[]
  newCategorySuggestions?: NewCategorySuggestion[]
  analysisNotes?: string      // Overall notes/observations about the CSV
  confidence: number          // Overall confidence in the analysis (0-100)
}

// User-editable mapping state (used in UI)
export interface EditableMappingState {
  csvHeader: string
  category: string            // Selected category (may differ from LLM suggestion)
  field: string               // Selected field name
  isNewCategory: boolean      // Whether user is creating a new category
  isNewField: boolean         // Whether user is creating a new field
  dataType: CustomFieldSchema['dataType']
  skip: boolean               // Whether to skip this column entirely
  llmSuggestion?: LLMMappingSuggestion  // Original LLM suggestion for reference
}

// Predefined categories that exist in the Startup model
export const PREDEFINED_CATEGORIES = [
  { key: 'companyInfo', displayName: 'Company Info', icon: 'Building2' },
  { key: 'teamInfo', displayName: 'Team Info', icon: 'Users' },
  { key: 'marketInfo', displayName: 'Market Info', icon: 'TrendingUp' },
  { key: 'salesInfo', displayName: 'Sales Info', icon: 'DollarSign' },
  { key: 'productInfo', displayName: 'Product Info', icon: 'Package' },
  { key: 'businessModel', displayName: 'Business Model', icon: 'PieChart' },
  { key: 'competitiveInfo', displayName: 'Competitive Info', icon: 'Target' },
  { key: 'riskOpportunity', displayName: 'Risk & Opportunity', icon: 'AlertTriangle' },
  { key: 'metrics', displayName: 'Metrics', icon: 'BarChart2' },
  { key: 'aiScores', displayName: 'AI Scores', icon: 'Brain' },
] as const

export type PredefinedCategoryKey = typeof PREDEFINED_CATEGORIES[number]['key']
