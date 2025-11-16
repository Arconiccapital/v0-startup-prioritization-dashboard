import type { Startup } from "./types"

/**
 * Escapes a CSV field value by wrapping in quotes if needed
 */
function escapeCSVField(value: any): string {
  if (value === null || value === undefined) return ""

  const stringValue = String(value)

  // If field contains comma, quotes, or newline, wrap in quotes and escape internal quotes
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

/**
 * Converts an array of Startup objects to CSV format
 */
export function exportStartupsToCSV(startups: Startup[]): string {
  if (startups.length === 0) {
    return "No data to export"
  }

  // Define CSV headers
  const headers = [
    "Name",
    "Description",
    "Sector",
    "Stage",
    "Country",
    "Pipeline Stage",
    "Rank",
    "Score",
    "LLM Score",
    "ML Score",
    "XGBoost Score",
    "LightGBM Score",
    "Website",
    "LinkedIn",
    "Founded",
    "Headquarters",
    "Employee Count",
    "Funding Raised",
    "Industry",
    "Sub-Industry",
    "Market Size",
    "B2B/B2C",
    "Target Persona",
    "Problem Solved",
    "Moat",
    "Revenue Model",
    "Pricing Strategy",
    "Unit Economics",
    "Sales Motion",
    "GTM Strategy",
    "Key Team Members",
    "Founders Education",
    "Founders Prior Experience",
    "Competitors",
    "Regulatory Risk",
    "Exit Potential",
  ]

  // Build CSV rows
  const rows: string[] = []
  rows.push(headers.map(escapeCSVField).join(","))

  for (const startup of startups) {
    const companyInfo = startup.companyInfo as any
    const marketInfo = startup.marketInfo as any
    const productInfo = startup.productInfo as any
    const businessModelInfo = startup.businessModelInfo as any
    const salesInfo = startup.salesInfo as any
    const teamInfo = startup.teamInfo as any
    const competitiveInfo = startup.competitiveInfo as any
    const riskInfo = startup.riskInfo as any
    const opportunityInfo = startup.opportunityInfo as any
    const aiScores = startup.aiScores as any

    const row = [
      startup.name,
      startup.description,
      startup.sector,
      startup.stage,
      startup.country,
      startup.pipelineStage,
      startup.rank,
      startup.score,
      aiScores?.llm || "",
      aiScores?.ml || "",
      aiScores?.xgBoost || "",
      aiScores?.lightGBM || "",
      companyInfo?.website || "",
      companyInfo?.linkedin || "",
      companyInfo?.founded || "",
      companyInfo?.headquarters || "",
      companyInfo?.employeeCount || "",
      companyInfo?.fundingRaised || "",
      marketInfo?.industry || "",
      marketInfo?.subIndustry || "",
      marketInfo?.marketSize || "",
      marketInfo?.b2bOrB2c || "",
      marketInfo?.targetPersona || "",
      productInfo?.problemSolved || "",
      productInfo?.moat || "",
      businessModelInfo?.revenueModel || "",
      businessModelInfo?.pricingStrategy || "",
      businessModelInfo?.unitEconomics || "",
      salesInfo?.salesMotion || "",
      salesInfo?.gtmStrategy || "",
      teamInfo?.keyTeamMembers || "",
      teamInfo?.foundersEducation || "",
      teamInfo?.foundersPriorExperience || "",
      competitiveInfo?.competitors || "",
      riskInfo?.regulatoryRisk || "",
      opportunityInfo?.exitPotential || "",
    ]

    rows.push(row.map(escapeCSVField).join(","))
  }

  return rows.join("\n")
}

/**
 * Triggers a browser download of the CSV content
 */
export function downloadCSV(csvContent: string, filename: string = "startups-export.csv"): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")

  if (link.download !== undefined) {
    // Create a link to the file
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

/**
 * Export startups to CSV and trigger download
 */
export function exportAndDownload(startups: Startup[], filename?: string): void {
  const csvContent = exportStartupsToCSV(startups)
  const defaultFilename = `startups-export-${new Date().toISOString().split("T")[0]}.csv`
  downloadCSV(csvContent, filename || defaultFilename)
}
