import type { Startup, ColumnMapping, CSVPreview } from "./types"

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
  const lines = csvText.trim().split("\n")
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
  const lines = csvText.trim().split("\n")
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
    const stage = getValue(mapping.stage, values)

    // Parse score
    let scoreValue = 0
    const scoreRaw = getValue(mapping.score || mapping.investmentScoreOverview, values)
    if (scoreRaw) {
      const parsedScore = getNumericValue(mapping.score || mapping.investmentScoreOverview, values)
      if (parsedScore !== undefined) {
        scoreValue = parsedScore
      } else {
        rowsWithMissingScores++
      }
    } else {
      rowsWithMissingScores++
    }

    const startup: Startup = {
      id: `startup-${Date.now()}-${i}`,
      name: name || "",
      sector: sector || "",
      stage: stage || "",
      pipelineStage: "Deal Flow",
      country: getValue(mapping.country, values) || "",
      description: description || "",
      team: getValue(mapping.team, values) || "",
      metrics: getValue(mapping.metrics, values) || "",
      score: scoreValue,

      companyInfo: {
        website: getValue(mapping.website, values),
        linkedin: getValue(mapping.linkedinUrl || mapping.linkedin, values),
        headquarters: getValue(mapping.location || mapping.headquarters, values),
        founded: getValue(mapping.foundingYear || mapping.founded, values),
        founders: getValue(mapping.founders, values),
        employeeCount: getNumericValue(mapping.employeeSize || mapping.numEmployees || mapping.employeeCount, values),
        fundingRaised: getValue(mapping.fundingRaised, values),
        area: getValue(mapping.area, values),
        ventureCapitalFirm: getValue(mapping.ventureCapitalFirm, values),
        location: getValue(mapping.location, values),
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
        llm: 0,
        ml: getNumericValue(mapping.machineLearningScore, values) || 0,
        sentiment: 0,
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

    // Only add if required fields are present
    if (startup.name && startup.sector) {
      console.log(`[v0] ✓ Successfully parsed row ${i}:`, startup.name, `(score: ${startup.score})`)
      startups.push(startup)
    } else {
      console.warn(
        `[v0] Skipping row ${i}: missing required fields (name: ${!!startup.name}, sector: ${!!startup.sector})`,
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
    } else if (header === "website" || header.includes("website")) {
      mapping.website = originalHeader
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
    else if (header === "machine learning score" || header === "ml score" || header.includes("ml score")) {
      mapping.machineLearningScore = originalHeader
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
    } else if (header.includes("score") || header.includes("rating")) {
      mapping.score = originalHeader
    }
  })

  return mapping
}
