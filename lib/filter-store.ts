// Filter types and storage utilities

export type FilterOperator =
  | "contains"
  | "not_contains"
  | "equals"
  | "not_equals"
  | "greater_than"
  | "less_than"
  | "between"
  | "is_empty"
  | "is_not_empty"

export type FilterField =
  | "name"
  | "description"
  | "sector"
  | "country"
  | "score"
  | "rank"
  | "industry"
  | "subIndustry"
  | "b2bOrB2c"
  | "employeeCount"
  | "foundedYear"
  | "fundingRaised"
  | "problemSolved"
  | "moat"
  | "revenueModel"
  | "salesMotion"
  | "pipelineStage"

export interface FilterCondition {
  id: string
  field: FilterField
  operator: FilterOperator
  value: string
  value2?: string // For "between" operator
}

export interface SavedFilter {
  id: string
  name: string
  conditions: FilterCondition[]
  matchMode: "AND" | "OR"
  createdAt: string
  updatedAt: string
}

// Field metadata for UI
export const FILTER_FIELDS: { value: FilterField; label: string; type: "text" | "number" }[] = [
  { value: "name", label: "Name", type: "text" },
  { value: "description", label: "Description", type: "text" },
  { value: "sector", label: "Sector", type: "text" },
  { value: "country", label: "Country", type: "text" },
  { value: "score", label: "Score", type: "number" },
  { value: "rank", label: "Rank", type: "number" },
  { value: "industry", label: "Industry", type: "text" },
  { value: "subIndustry", label: "Sub-Industry", type: "text" },
  { value: "b2bOrB2c", label: "B2B/B2C", type: "text" },
  { value: "employeeCount", label: "Employee Count", type: "number" },
  { value: "foundedYear", label: "Founded Year", type: "number" },
  { value: "fundingRaised", label: "Funding Raised", type: "text" },
  { value: "problemSolved", label: "Problem Solved", type: "text" },
  { value: "moat", label: "Moat", type: "text" },
  { value: "revenueModel", label: "Revenue Model", type: "text" },
  { value: "salesMotion", label: "Sales Motion", type: "text" },
  { value: "pipelineStage", label: "Pipeline Stage", type: "text" },
]

// Operators available per field type
export const TEXT_OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: "contains", label: "contains" },
  { value: "not_contains", label: "does not contain" },
  { value: "equals", label: "equals" },
  { value: "not_equals", label: "does not equal" },
  { value: "is_empty", label: "is empty" },
  { value: "is_not_empty", label: "is not empty" },
]

export const NUMBER_OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: "equals", label: "equals" },
  { value: "not_equals", label: "does not equal" },
  { value: "greater_than", label: "greater than" },
  { value: "less_than", label: "less than" },
  { value: "between", label: "between" },
  { value: "is_empty", label: "is empty" },
  { value: "is_not_empty", label: "is not empty" },
]

// Storage key
const STORAGE_KEY = "startup-filters"

// Get all saved filters from localStorage
export function getSavedFilters(): SavedFilter[] {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return getDefaultFilters()
  try {
    return JSON.parse(stored)
  } catch {
    return getDefaultFilters()
  }
}

// Save filters to localStorage
export function saveFilters(filters: SavedFilter[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
}

// Create a new filter
export function createFilter(name: string, conditions: FilterCondition[], matchMode: "AND" | "OR"): SavedFilter {
  return {
    id: crypto.randomUUID(),
    name,
    conditions,
    matchMode,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

// Update an existing filter
export function updateFilter(filters: SavedFilter[], filterId: string, updates: Partial<SavedFilter>): SavedFilter[] {
  return filters.map((f) =>
    f.id === filterId ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f
  )
}

// Delete a filter
export function deleteFilter(filters: SavedFilter[], filterId: string): SavedFilter[] {
  return filters.filter((f) => f.id !== filterId)
}

// Create a new empty condition
export function createCondition(): FilterCondition {
  return {
    id: crypto.randomUUID(),
    field: "description",
    operator: "contains",
    value: "",
  }
}

// Default filters to start with
export function getDefaultFilters(): SavedFilter[] {
  return [
    {
      id: "default-ai-native",
      name: "AI-Native",
      conditions: [
        { id: "1", field: "description", operator: "contains", value: "AI" },
      ],
      matchMode: "OR",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "default-b2b",
      name: "B2B Enterprise",
      conditions: [
        { id: "1", field: "description", operator: "contains", value: "B2B" },
        { id: "2", field: "description", operator: "contains", value: "enterprise" },
      ],
      matchMode: "OR",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "default-top-100",
      name: "Top 100",
      conditions: [
        { id: "1", field: "rank", operator: "less_than", value: "101" },
      ],
      matchMode: "AND",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]
}

// Get field value from startup object (handles nested JSON fields)
export function getFieldValue(startup: any, field: FilterField): string | number | null {
  switch (field) {
    case "name":
      return startup.name || null
    case "description":
      return startup.description || null
    case "sector":
      return startup.sector || null
    case "country":
      return startup.country || null
    case "score":
      return startup.score ?? null
    case "rank":
      return startup.rank ?? null
    case "pipelineStage":
      return startup.pipelineStage || null
    case "industry":
      return startup.marketInfo?.industry || null
    case "subIndustry":
      return startup.marketInfo?.subIndustry || null
    case "b2bOrB2c":
      return startup.marketInfo?.b2bOrB2c || null
    case "employeeCount":
      const empCount = startup.companyInfo?.employeeCount
      if (typeof empCount === "number") return empCount
      if (typeof empCount === "string") {
        const parsed = parseInt(empCount.replace(/[^0-9]/g, ""))
        return isNaN(parsed) ? null : parsed
      }
      return null
    case "foundedYear":
      const founded = startup.companyInfo?.founded
      if (typeof founded === "number") return founded
      if (typeof founded === "string") {
        const parsed = parseInt(founded)
        return isNaN(parsed) ? null : parsed
      }
      return null
    case "fundingRaised":
      return startup.companyInfo?.fundingRaised || null
    case "problemSolved":
      return startup.productInfo?.problemSolved || null
    case "moat":
      return startup.productInfo?.moat || null
    case "revenueModel":
      return startup.businessModelInfo?.revenueModel || null
    case "salesMotion":
      return startup.salesInfo?.salesMotion || null
    default:
      return null
  }
}

// Check if a single condition matches
export function matchesCondition(startup: any, condition: FilterCondition): boolean {
  const value = getFieldValue(startup, condition.field)
  const conditionValue = condition.value.toLowerCase()
  const conditionValue2 = condition.value2?.toLowerCase()

  switch (condition.operator) {
    case "contains":
      if (value === null) return false
      return String(value).toLowerCase().includes(conditionValue)

    case "not_contains":
      if (value === null) return true
      return !String(value).toLowerCase().includes(conditionValue)

    case "equals":
      if (value === null) return false
      return String(value).toLowerCase() === conditionValue

    case "not_equals":
      if (value === null) return true
      return String(value).toLowerCase() !== conditionValue

    case "greater_than":
      if (value === null) return false
      const numVal = typeof value === "number" ? value : parseFloat(String(value))
      const threshold = parseFloat(conditionValue)
      return !isNaN(numVal) && !isNaN(threshold) && numVal > threshold

    case "less_than":
      if (value === null) return false
      const numVal2 = typeof value === "number" ? value : parseFloat(String(value))
      const threshold2 = parseFloat(conditionValue)
      return !isNaN(numVal2) && !isNaN(threshold2) && numVal2 < threshold2

    case "between":
      if (value === null || !conditionValue2) return false
      const numVal3 = typeof value === "number" ? value : parseFloat(String(value))
      const min = parseFloat(conditionValue)
      const max = parseFloat(conditionValue2)
      return !isNaN(numVal3) && !isNaN(min) && !isNaN(max) && numVal3 >= min && numVal3 <= max

    case "is_empty":
      return value === null || value === "" || value === undefined

    case "is_not_empty":
      return value !== null && value !== "" && value !== undefined

    default:
      return false
  }
}

// Check if a startup matches a filter
export function matchesFilter(startup: any, filter: SavedFilter): boolean {
  if (filter.conditions.length === 0) return true

  if (filter.matchMode === "AND") {
    return filter.conditions.every((condition) => matchesCondition(startup, condition))
  } else {
    return filter.conditions.some((condition) => matchesCondition(startup, condition))
  }
}

// Apply multiple active filters to a list of startups
export function applyFilters(startups: any[], activeFilterIds: string[], allFilters: SavedFilter[]): any[] {
  if (activeFilterIds.length === 0) return startups

  const activeFilters = allFilters.filter((f) => activeFilterIds.includes(f.id))

  return startups.filter((startup) =>
    activeFilters.every((filter) => matchesFilter(startup, filter))
  )
}
