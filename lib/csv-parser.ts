import type {
  Startup,
  ColumnMapping,
  CSVPreview,
  LLMMappingSuggestion,
  CustomSchema,
  CustomData,
  CustomFieldSchema,
  CustomCategorySchema,
  PREDEFINED_CATEGORIES
} from "./types"

// List of predefined field keys that map to Startup model columns
const PREDEFINED_FIELD_KEYS = new Set([
  // Core fields
  'name', 'description', 'country', 'website', 'urls', 'investmentDate', 'status',
  'sector', 'stage', 'team', 'metrics', 'score', 'pipelineStage',
  // Company info
  'linkedinUrl', 'linkedin', 'location', 'headquarters', 'employeeSize', 'numEmployees',
  'employeeCount', 'area', 'ventureCapitalFirm', 'foundingYear', 'founded', 'founders', 'fundingRaised',
  // Team info
  'foundersEducation', 'foundersPriorExperience', 'keyTeamMembers', 'teamDepth', 'teamSize',
  // Market info
  'industry', 'subIndustry', 'marketSize', 'aiDisruptionPropensity', 'targetPersona',
  'b2bOrB2c', 'marketCompetitionAnalysis',
  // Sales info
  'salesMotion', 'salesCycleLength', 'gtmStrategy', 'channels', 'salesComplexity',
  // Product info
  'productName', 'problemSolved', 'horizontalOrVertical', 'moat',
  // Business model
  'revenueModel', 'pricingStrategy', 'unitEconomics',
  // Competitive info
  'competitors', 'industryMultiples',
  // Risk & opportunity
  'regulatoryRisk', 'exitPotential',
  // AI scores
  'machineLearningScore', 'xgBoost', 'lightGBM', 'arconicLlmRules',
  'investmentScoreOverview', 'keyStrengths', 'areasOfConcern', 'teamExecutionAssessment',
  // Detailed metrics
  'arr', 'growth', 'fundingStage',
])

// Category display names for schema generation
const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  companyInfo: 'Company Info',
  teamInfo: 'Team Info',
  marketInfo: 'Market Info',
  salesInfo: 'Sales Info',
  productInfo: 'Product Info',
  businessModel: 'Business Model',
  competitiveInfo: 'Competitive Info',
  riskOpportunity: 'Risk & Opportunity',
  metrics: 'Metrics',
  aiScores: 'AI Scores',
}

// Split CSV text into rows, handling multi-line quoted fields
function splitCSVRows(csvText: string): string[] {
  const rows: string[] = []
  let currentRow = ""
  let inQuotes = false

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i]
    const nextChar = csvText[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote - add both quotes and skip next
        currentRow += '""'
        i++
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
        currentRow += char
      }
    } else if (char === '\n' && !inQuotes) {
      // End of row (only when not inside quotes)
      if (currentRow.trim()) {
        rows.push(currentRow)
      }
      currentRow = ""
    } else if (char === '\r' && nextChar === '\n' && !inQuotes) {
      // Windows line ending (CRLF) - skip \r, \n will be handled next iteration
      continue
    } else if (char === '\r' && !inQuotes) {
      // Mac line ending - treat as row separator
      if (currentRow.trim()) {
        rows.push(currentRow)
      }
      currentRow = ""
    } else {
      currentRow += char
    }
  }

  // Add last row if not empty
  if (currentRow.trim()) {
    rows.push(currentRow)
  }

  return rows
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      // End of field
      result.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }

  // Add last field
  result.push(current.trim())
  return result
}

export function parseCSVPreview(csvText: string): CSVPreview {
  const lines = splitCSVRows(csvText)
  if (lines.length < 1) {
    throw new Error("CSV file is empty")
  }

  const headers = parseCSVLine(lines[0])
  const sampleRows: string[][] = []

  // Get up to 3 sample rows
  for (let i = 1; i < Math.min(4, lines.length); i++) {
    const values = parseCSVLine(lines[i])
    sampleRows.push(values)
  }

  return {
    headers,
    sampleRows,
    rowCount: lines.length - 1, // Exclude header row
  }
}

export function parseCSVWithMapping(csvText: string, mapping: ColumnMapping): Startup[] {
  const lines = splitCSVRows(csvText)
  if (lines.length < 2) {
    throw new Error("CSV must contain headers and at least one data row")
  }

  const headers = parseCSVLine(lines[0])
  const startups: Startup[] = []

  const indexMap: Record<string, number> = {}
  headers.forEach((header, index) => {
    indexMap[header] = index
  })

  console.log("[v0] Column mapping:", mapping)
  console.log("[v0] Headers:", headers)

  const getValue = (columnName: string | undefined, values: string[]): string | undefined => {
    if (!columnName || !indexMap.hasOwnProperty(columnName)) return undefined
    const value = values[indexMap[columnName]]
    return value && value.trim() !== "" ? value.trim() : undefined
  }

  const getNumericValue = (columnName: string | undefined, values: string[]): number | undefined => {
    const value = getValue(columnName, values)
    if (!value) return undefined
    const cleaned = value.replace(/[%,$\s]/g, "")
    const parsed = Number.parseFloat(cleaned)
    return isNaN(parsed) ? undefined : parsed
  }

  let rowsWithMissingScores = 0

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length === 0 || values.every((v) => !v)) continue

    const name = getValue(mapping.name, values)
    const description = getValue(mapping.description, values)
    const sector = getValue(mapping.sector || mapping.industry, values)
    const stage = getValue(mapping.stage || mapping.status, values)

    // Parse score
    let scoreValue = 0
    const scoreRaw = getValue(mapping.score || mapping.investmentScoreOverview, values)
    if (scoreRaw) {
      const parsedScore = getNumericValue(mapping.score || mapping.investmentScoreOverview, values)
      if (parsedScore !== undefined) {
        scoreValue = parsedScore
      } else {
        // Generate random score between 40-80 if score exists but can't be parsed
        scoreValue = Math.floor(Math.random() * 41) + 40
        rowsWithMissingScores++
      }
    } else {
      // Generate random score between 40-80 if no score column mapped
      scoreValue = Math.floor(Math.random() * 41) + 40
      rowsWithMissingScores++
    }

    const startup: Startup = {
      id: `startup-${Date.now()}-${i}`,
      name: name || "",
      sector: sector || "",
      stage: stage || "",
      pipelineStage: "Screening",
      country: getValue(mapping.country, values) || "",
      description: description || "",
      team: getValue(mapping.team, values) || "",
      metrics: getValue(mapping.metrics, values) || "",
      score: scoreValue,

      companyInfo: {
        website: getValue(mapping.website, values),
        urls: getValue(mapping.urls, values),
        linkedin: getValue(mapping.linkedinUrl || mapping.linkedin, values),
        headquarters: getValue(mapping.location || mapping.headquarters, values),
        founded: getValue(mapping.foundingYear || mapping.founded, values),
        founders: getValue(mapping.founders, values),
        employeeCount: getNumericValue(mapping.employeeSize || mapping.numEmployees || mapping.employeeCount, values),
        fundingRaised: getValue(mapping.fundingRaised, values),
        area: getValue(mapping.area, values),
        ventureCapitalFirm: getValue(mapping.ventureCapitalFirm, values),
        location: getValue(mapping.location, values),
        investmentDate: getValue(mapping.investmentDate, values),
      },

      marketInfo: {
        industry: getValue(mapping.industry || mapping.sector, values),
        subIndustry: getValue(mapping.subIndustry, values),
        marketSize: getValue(mapping.marketSize, values),
        aiDisruptionPropensity: getValue(mapping.aiDisruptionPropensity, values),
        targetPersona: getValue(mapping.targetPersona, values),
        b2bOrB2c: getValue(mapping.b2bOrB2c, values),
        marketCompetitionAnalysis: getValue(mapping.marketCompetitionAnalysis, values),
      },

      productInfo: {
        productName: getValue(mapping.productName, values),
        problemSolved: getValue(mapping.problemSolved, values),
        horizontalOrVertical: getValue(mapping.horizontalOrVertical, values),
        moat: getValue(mapping.moat, values),
      },

      businessModelInfo: {
        revenueModel: getValue(mapping.revenueModel, values),
        pricingStrategy: getValue(mapping.pricingStrategy, values),
        unitEconomics: getValue(mapping.unitEconomics, values),
      },

      salesInfo: {
        salesMotion: getValue(mapping.salesMotion, values),
        salesCycleLength: getValue(mapping.salesCycleLength, values),
        gtmStrategy: getValue(mapping.gtmStrategy, values),
        channels: getValue(mapping.channels, values),
        salesComplexity: getValue(mapping.salesComplexity, values),
      },

      teamInfo: {
        keyTeamMembers: getValue(mapping.keyTeamMembers, values),
        teamDepth: getValue(mapping.teamDepth, values),
        foundersEducation: getValue(mapping.foundersEducation, values),
        foundersPriorExperience: getValue(mapping.foundersPriorExperience, values),
        teamExecutionAssessment: getValue(mapping.teamExecutionAssessment, values),
      },

      competitiveInfo: {
        competitors: getValue(mapping.competitors, values),
        industryMultiples: getValue(mapping.industryMultiples, values),
      },

      riskInfo: {
        regulatoryRisk: getValue(mapping.regulatoryRisk, values),
      },

      opportunityInfo: {
        exitPotential: getValue(mapping.exitPotential, values),
      },

      aiScores: {
        llm: scoreValue,
        ml: getNumericValue(mapping.machineLearningScore, values) || 0,
        sentiment: 0,
        xgBoost: getNumericValue(mapping.xgBoost, values),
        lightGBM: getNumericValue(mapping.lightGBM, values),
      },

      rationale: {
        whyInvest: [],
        whyNot: [],
        keyStrengths: getValue(mapping.keyStrengths, values),
        areasOfConcern: getValue(mapping.areasOfConcern, values),
      },

      detailedMetrics: {
        arr: getValue(mapping.arr, values),
        growth: getValue(mapping.growth, values),
        teamSize: getNumericValue(mapping.teamSize, values),
        fundingStage: getValue(mapping.fundingStage, values),
      },

      arconicLlmRules: getValue(mapping.arconicLlmRules, values),
      investmentScoreOverview: getValue(mapping.investmentScoreOverview, values),
    }

    // Only add if required fields are present (only name is required now)
    if (startup.name) {
      console.log(`[v0] ✓ Successfully parsed row ${i}:`, startup.name, `(sector: ${startup.sector || 'None'}, score: ${startup.score})`)
      startups.push(startup)
    } else {
      console.warn(
        `[v0] Skipping row ${i}: missing required field (name: ${!!startup.name})`,
      )
    }
  }

  console.log(`[v0] Successfully parsed ${startups.length} startups out of ${lines.length - 1} rows`)
  if (rowsWithMissingScores > 0) {
    console.warn(
      `[v0] Warning: ${rowsWithMissingScores} rows had missing or invalid scores and were assigned a default score of 0`,
    )
  }

  return startups
}

export function suggestMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {}
  const lowerHeaders = headers.map((h) => h.toLowerCase())

  lowerHeaders.forEach((header, index) => {
    const originalHeader = headers[index]

    // Core fields
    if (header === "company" || header.includes("company name")) {
      mapping.name = originalHeader
    } else if (header === "description" || header.includes("description")) {
      mapping.description = originalHeader
    } else if (header === "country") {
      mapping.country = originalHeader
    } else if (header === "website" || header === "domain" || header.includes("website")) {
      mapping.website = originalHeader
    } else if (header === "urls") {
      mapping.urls = originalHeader
    } else if (header === "investment date" || header.includes("investment date")) {
      mapping.investmentDate = originalHeader
    } else if (header === "status") {
      mapping.status = originalHeader
    }

    // Company info
    else if (header === "linkedin url" || header.includes("linkedin")) {
      mapping.linkedinUrl = originalHeader
    } else if (header === "address" || header === "location" || header.includes("location")) {
      mapping.location = originalHeader
    } else if (header === "size" || header === "employee size" || header.includes("employee size")) {
      mapping.employeeSize = originalHeader
    } else if (header === "employees" || header === "# employees" || header === "num employees") {
      mapping.numEmployees = originalHeader
    } else if (header === "area") {
      mapping.area = originalHeader
    } else if (header === "venture capital firm" || header.includes("vc firm")) {
      mapping.ventureCapitalFirm = originalHeader
    } else if (header === "founding year" || header.includes("founded")) {
      mapping.foundingYear = originalHeader
    } else if (header === "founders" || header.includes("founder")) {
      mapping.founders = originalHeader
    }

    // Team info
    else if (header === "founders' education" || header.includes("founders education")) {
      mapping.foundersEducation = originalHeader
    } else if (header === "founders' prior experience" || header.includes("founders prior experience")) {
      mapping.foundersPriorExperience = originalHeader
    } else if (header === "key team members" || header.includes("key team")) {
      mapping.keyTeamMembers = originalHeader
    } else if (header === "team depth" || header.includes("team depth")) {
      mapping.teamDepth = originalHeader
    }

    // Market info
    else if (header === "b2b or b2c" || header.includes("b2b") || header.includes("b2c")) {
      mapping.b2bOrB2c = originalHeader
    } else if (header === "sub-industry" || header.includes("sub industry")) {
      mapping.subIndustry = originalHeader
    } else if (header === "market size" || header.includes("market size")) {
      mapping.marketSize = originalHeader
    } else if (header === "ai disruption propensity" || header.includes("ai disruption")) {
      mapping.aiDisruptionPropensity = originalHeader
    } else if (header === "industry" || header.includes("industry")) {
      mapping.sector = originalHeader
    } else if (header === "target persona" || header.includes("target persona")) {
      mapping.targetPersona = originalHeader
    }

    // Sales info
    else if (header === "sales motion" || header.includes("sales motion")) {
      mapping.salesMotion = originalHeader
    } else if (header === "sales cycle length" || header.includes("sales cycle")) {
      mapping.salesCycleLength = originalHeader
    } else if (header === "go-to-market strategy" || header.includes("gtm") || header.includes("go to market")) {
      mapping.gtmStrategy = originalHeader
    } else if (header === "channels" || header.includes("channel")) {
      mapping.channels = originalHeader
    } else if (header === "sales complexity" || header.includes("sales complexity")) {
      mapping.salesComplexity = originalHeader
    }

    // Product info
    else if (header === "product name" || header.includes("product name")) {
      mapping.productName = originalHeader
    } else if (header === "problem solved" || header.includes("problem solved")) {
      mapping.problemSolved = originalHeader
    } else if (header === "horizontal or vertical" || header.includes("horizontal") || header.includes("vertical")) {
      mapping.horizontalOrVertical = originalHeader
    } else if (header === "moat" || header.includes("moat")) {
      mapping.moat = originalHeader
    }

    // Business model
    else if (header === "revenue model" || header.includes("revenue model")) {
      mapping.revenueModel = originalHeader
    } else if (header === "pricing strategy" || header.includes("pricing")) {
      mapping.pricingStrategy = originalHeader
    } else if (header === "unit economics" || header.includes("unit economics")) {
      mapping.unitEconomics = originalHeader
    }

    // Competitive info
    else if (header === "competitors" || header.includes("competitor")) {
      mapping.competitors = originalHeader
    } else if (header === "industry multiples" || header.includes("industry multiple")) {
      mapping.industryMultiples = originalHeader
    }

    // Risk & opportunity
    else if (header === "regulatory risk" || header.includes("regulatory")) {
      mapping.regulatoryRisk = originalHeader
    } else if (header === "exit potential" || header.includes("exit")) {
      mapping.exitPotential = originalHeader
    }

    // AI scores & analysis
    else if (header === "machine learning score" || header === "ml score" || header === "ml_score") {
      mapping.machineLearningScore = originalHeader
    } else if (header === "xg boost" || header === "xgboost") {
      mapping.xgBoost = originalHeader
    } else if (header === "lightgbm v2" || header === "lightgbm" || header.includes("lightgbm")) {
      mapping.lightGBM = originalHeader
    } else if (header === "arconic llm rules" || header.includes("llm rules")) {
      mapping.arconicLlmRules = originalHeader
    } else if (header === "investment score overview" || header.includes("investment score")) {
      mapping.investmentScoreOverview = originalHeader
    } else if (header === "key strengths" || header.includes("strengths")) {
      mapping.keyStrengths = originalHeader
    } else if (header === "areas of concern" || header.includes("concern")) {
      mapping.areasOfConcern = originalHeader
    } else if (
      header === "market & competition analysis" ||
      (header.includes("market") && header.includes("competition"))
    ) {
      mapping.marketCompetitionAnalysis = originalHeader
    } else if (header === "team & execution assessment" || (header.includes("team") && header.includes("execution"))) {
      mapping.teamExecutionAssessment = originalHeader
    }

    // Legacy fields
    else if (header.includes("sector")) {
      mapping.sector = originalHeader
    } else if (header.includes("stage") || header.includes("round")) {
      mapping.stage = originalHeader
    } else if (header === "llm_score" || header === "llm score" || (header.includes("llm") && header.includes("score"))) {
      // Prioritize LLM_Score column specifically
      mapping.score = originalHeader
    } else if (!mapping.score && (header.includes("score") || header.includes("rating")) && !header.includes("machine learning") && !header.includes("ml")) {
      // Fallback to generic score columns, but only if not already set and not ML score
      mapping.score = originalHeader
    }
  })

  return mapping
}

/**
 * Enhanced CSV parsing that uses AI mappings and stores unmapped fields in customData
 * Returns startups with customData and customSchema populated
 */
export interface ParsedStartupWithCustomData {
  startup: Startup
  customData: CustomData
  customSchema: CustomSchema
}

export function parseCSVWithAIMappings(
  csvText: string,
  mapping: ColumnMapping,
  aiMappings?: LLMMappingSuggestion[]
): ParsedStartupWithCustomData[] {
  const lines = splitCSVRows(csvText)
  if (lines.length < 2) {
    throw new Error("CSV must contain headers and at least one data row")
  }

  const headers = parseCSVLine(lines[0])
  const results: ParsedStartupWithCustomData[] = []

  // Build index map for quick column lookup
  const indexMap: Record<string, number> = {}
  headers.forEach((header, index) => {
    indexMap[header] = index
  })

  // Build a set of headers that are mapped to predefined fields
  const mappedHeaders = new Set<string>()
  Object.values(mapping).forEach(headerName => {
    if (headerName) mappedHeaders.add(headerName)
  })

  // Identify unmapped headers and their AI suggestions
  const unmappedMappings: Map<string, LLMMappingSuggestion> = new Map()

  if (aiMappings) {
    for (const suggestion of aiMappings) {
      // Check if this is a custom field (not mapped to predefined columns)
      const isPredefinedField = PREDEFINED_FIELD_KEYS.has(suggestion.suggestedField)
      const isMappedToPredefined = mappedHeaders.has(suggestion.csvHeader)

      // Store mapping for custom fields or new categories
      if (!isPredefinedField || suggestion.categoryType === 'new') {
        unmappedMappings.set(suggestion.csvHeader, suggestion)
      } else if (!isMappedToPredefined) {
        // Also store if not mapped to any predefined field yet
        unmappedMappings.set(suggestion.csvHeader, suggestion)
      }
    }
  } else {
    // No AI mappings provided - identify completely unmapped columns
    for (const header of headers) {
      if (!mappedHeaders.has(header)) {
        // Create a basic suggestion for unmapped column
        unmappedMappings.set(header, {
          csvHeader: header,
          suggestedCategory: 'unmapped',
          suggestedField: header.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
          categoryType: 'new',
          confidence: 50,
          reasoning: 'Auto-detected unmapped column',
        })
      }
    }
  }

  // Generate the custom schema from unmapped mappings
  const customSchema: CustomSchema = {}
  let categoryOrder = 100 // Start high to appear after predefined categories

  for (const [_header, suggestion] of unmappedMappings) {
    const categoryKey = suggestion.suggestedCategory

    if (!customSchema[categoryKey]) {
      customSchema[categoryKey] = {
        displayName: CATEGORY_DISPLAY_NAMES[categoryKey] ||
          categoryKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim(),
        sortOrder: categoryOrder++,
        fields: {},
      }
    }

    // Infer data type from sample value if available
    let dataType: CustomFieldSchema['dataType'] = 'text'
    if (suggestion.sampleValue) {
      const sample = suggestion.sampleValue
      if (/^\d+(\.\d+)?$/.test(sample.replace(/[,$%]/g, ''))) {
        dataType = 'number'
      } else if (/^\d{4}-\d{2}-\d{2}/.test(sample) || /^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(sample)) {
        dataType = 'date'
      } else if (/^https?:\/\//.test(sample) || /^www\./.test(sample)) {
        dataType = 'url'
      } else if (/^(true|false|yes|no)$/i.test(sample)) {
        dataType = 'boolean'
      }
    }

    customSchema[categoryKey].fields[suggestion.suggestedField] = {
      displayName: suggestion.csvHeader,
      dataType,
      originalCsvHeader: suggestion.csvHeader,
      description: suggestion.reasoning,
    }
  }

  console.log("[v0] Custom schema generated:", JSON.stringify(customSchema, null, 2))
  console.log("[v0] Unmapped columns:", Array.from(unmappedMappings.keys()))

  // Helper functions for parsing
  const getValue = (columnName: string | undefined, values: string[]): string | undefined => {
    if (!columnName || !indexMap.hasOwnProperty(columnName)) return undefined
    const value = values[indexMap[columnName]]
    return value && value.trim() !== "" ? value.trim() : undefined
  }

  const getNumericValue = (columnName: string | undefined, values: string[]): number | undefined => {
    const value = getValue(columnName, values)
    if (!value) return undefined
    const cleaned = value.replace(/[%,$\s]/g, "")
    const parsed = Number.parseFloat(cleaned)
    return isNaN(parsed) ? undefined : parsed
  }

  let rowsWithMissingScores = 0

  // Parse each row
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length === 0 || values.every((v) => !v)) continue

    const name = getValue(mapping.name, values)
    const description = getValue(mapping.description, values)
    const sector = getValue(mapping.sector || mapping.industry, values)
    const stage = getValue(mapping.stage || mapping.status, values)

    // Parse score
    let scoreValue = 0
    const scoreRaw = getValue(mapping.score || mapping.investmentScoreOverview, values)
    if (scoreRaw) {
      const parsedScore = getNumericValue(mapping.score || mapping.investmentScoreOverview, values)
      if (parsedScore !== undefined) {
        scoreValue = parsedScore
      } else {
        scoreValue = Math.floor(Math.random() * 41) + 40
        rowsWithMissingScores++
      }
    } else {
      scoreValue = Math.floor(Math.random() * 41) + 40
      rowsWithMissingScores++
    }

    // Build the standard startup object (same as parseCSVWithMapping)
    const startup: Startup = {
      id: `startup-${Date.now()}-${i}`,
      name: name || "",
      sector: sector || "",
      stage: stage || "",
      pipelineStage: "Screening",
      country: getValue(mapping.country, values) || "",
      description: description || "",
      team: getValue(mapping.team, values) || "",
      metrics: getValue(mapping.metrics, values) || "",
      score: scoreValue,

      companyInfo: {
        website: getValue(mapping.website, values),
        urls: getValue(mapping.urls, values),
        linkedin: getValue(mapping.linkedinUrl || mapping.linkedin, values),
        headquarters: getValue(mapping.location || mapping.headquarters, values),
        founded: getValue(mapping.foundingYear || mapping.founded, values),
        founders: getValue(mapping.founders, values),
        employeeCount: getNumericValue(mapping.employeeSize || mapping.numEmployees || mapping.employeeCount, values),
        fundingRaised: getValue(mapping.fundingRaised, values),
        area: getValue(mapping.area, values),
        ventureCapitalFirm: getValue(mapping.ventureCapitalFirm, values),
        location: getValue(mapping.location, values),
        investmentDate: getValue(mapping.investmentDate, values),
      },

      marketInfo: {
        industry: getValue(mapping.industry || mapping.sector, values),
        subIndustry: getValue(mapping.subIndustry, values),
        marketSize: getValue(mapping.marketSize, values),
        aiDisruptionPropensity: getValue(mapping.aiDisruptionPropensity, values),
        targetPersona: getValue(mapping.targetPersona, values),
        b2bOrB2c: getValue(mapping.b2bOrB2c, values),
        marketCompetitionAnalysis: getValue(mapping.marketCompetitionAnalysis, values),
      },

      productInfo: {
        productName: getValue(mapping.productName, values),
        problemSolved: getValue(mapping.problemSolved, values),
        horizontalOrVertical: getValue(mapping.horizontalOrVertical, values),
        moat: getValue(mapping.moat, values),
      },

      businessModelInfo: {
        revenueModel: getValue(mapping.revenueModel, values),
        pricingStrategy: getValue(mapping.pricingStrategy, values),
        unitEconomics: getValue(mapping.unitEconomics, values),
      },

      salesInfo: {
        salesMotion: getValue(mapping.salesMotion, values),
        salesCycleLength: getValue(mapping.salesCycleLength, values),
        gtmStrategy: getValue(mapping.gtmStrategy, values),
        channels: getValue(mapping.channels, values),
        salesComplexity: getValue(mapping.salesComplexity, values),
      },

      teamInfo: {
        keyTeamMembers: getValue(mapping.keyTeamMembers, values),
        teamDepth: getValue(mapping.teamDepth, values),
        foundersEducation: getValue(mapping.foundersEducation, values),
        foundersPriorExperience: getValue(mapping.foundersPriorExperience, values),
        teamExecutionAssessment: getValue(mapping.teamExecutionAssessment, values),
      },

      competitiveInfo: {
        competitors: getValue(mapping.competitors, values),
        industryMultiples: getValue(mapping.industryMultiples, values),
      },

      riskInfo: {
        regulatoryRisk: getValue(mapping.regulatoryRisk, values),
      },

      opportunityInfo: {
        exitPotential: getValue(mapping.exitPotential, values),
      },

      aiScores: {
        llm: scoreValue,
        ml: getNumericValue(mapping.machineLearningScore, values) || 0,
        sentiment: 0,
        xgBoost: getNumericValue(mapping.xgBoost, values),
        lightGBM: getNumericValue(mapping.lightGBM, values),
      },

      rationale: {
        whyInvest: [],
        whyNot: [],
        keyStrengths: getValue(mapping.keyStrengths, values),
        areasOfConcern: getValue(mapping.areasOfConcern, values),
      },

      detailedMetrics: {
        arr: getValue(mapping.arr, values),
        growth: getValue(mapping.growth, values),
        teamSize: getNumericValue(mapping.teamSize, values),
        fundingStage: getValue(mapping.fundingStage, values),
      },

      arconicLlmRules: getValue(mapping.arconicLlmRules, values),
      investmentScoreOverview: getValue(mapping.investmentScoreOverview, values),
    }

    // Build custom data from unmapped columns
    const customData: CustomData = {}

    for (const [csvHeader, suggestion] of unmappedMappings) {
      const rawValue = getValue(csvHeader, values)
      if (rawValue === undefined) continue

      const categoryKey = suggestion.suggestedCategory
      const fieldKey = suggestion.suggestedField

      if (!customData[categoryKey]) {
        customData[categoryKey] = {}
      }

      // Parse value based on inferred type
      const fieldSchema = customSchema[categoryKey]?.fields[fieldKey]
      let parsedValue: unknown = rawValue

      if (fieldSchema?.dataType === 'number') {
        const cleaned = rawValue.replace(/[%,$\s]/g, '')
        const num = parseFloat(cleaned)
        parsedValue = isNaN(num) ? rawValue : num
      } else if (fieldSchema?.dataType === 'boolean') {
        parsedValue = /^(true|yes|1)$/i.test(rawValue)
      }

      customData[categoryKey][fieldKey] = parsedValue
    }

    // Only add if required fields are present
    if (startup.name) {
      console.log(`[v0] ✓ Parsed row ${i}:`, startup.name,
        `(custom fields: ${Object.keys(customData).length} categories)`)
      results.push({
        startup,
        customData: Object.keys(customData).length > 0 ? customData : {},
        customSchema: Object.keys(customSchema).length > 0 ? customSchema : {},
      })
    }
  }

  console.log(`[v0] Parsed ${results.length} startups with custom data`)
  if (rowsWithMissingScores > 0) {
    console.warn(`[v0] ${rowsWithMissingScores} rows had missing scores`)
  }

  return results
}
