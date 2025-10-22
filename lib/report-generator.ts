import type { Startup } from "./types"

export interface ReportData {
  generatedAt: Date
  totalStartups: number
  avgCompositeScore: number
  avgMlScore: number
  avgLlmScore: number
  topPerformers: Startup[]
  scoreDistribution: {
    excellent: number
    good: number
    fair: number
    poor: number
  }
  sectorBreakdown: Record<string, number>
  stageBreakdown: Record<string, number>
}

export function generateReportData(startups: Startup[]): ReportData {
  const avgCompositeScore = startups.reduce((sum, s) => sum + (s.compositeScore || 0), 0) / startups.length
  const avgMlScore = startups.reduce((sum, s) => sum + (s.mlScore || 0), 0) / startups.length
  const avgLlmScore = startups.reduce((sum, s) => sum + (s.llmScore || 0), 0) / startups.length

  const scoreDistribution = {
    excellent: startups.filter((s) => (s.compositeScore || 0) >= 0.8).length,
    good: startups.filter((s) => (s.compositeScore || 0) >= 0.6 && (s.compositeScore || 0) < 0.8).length,
    fair: startups.filter((s) => (s.compositeScore || 0) >= 0.4 && (s.compositeScore || 0) < 0.6).length,
    poor: startups.filter((s) => (s.compositeScore || 0) < 0.4).length,
  }

  const sectorBreakdown = startups.reduce(
    (acc, startup) => {
      acc[startup.sector] = (acc[startup.sector] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const stageBreakdown = startups.reduce(
    (acc, startup) => {
      acc[startup.stage] = (acc[startup.stage] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const topPerformers = [...startups].sort((a, b) => (b.compositeScore || 0) - (a.compositeScore || 0)).slice(0, 10)

  return {
    generatedAt: new Date(),
    totalStartups: startups.length,
    avgCompositeScore,
    avgMlScore,
    avgLlmScore,
    topPerformers,
    scoreDistribution,
    sectorBreakdown,
    stageBreakdown,
  }
}

export function exportToCSV(startups: Startup[]): string {
  const headers = [
    "Rank",
    "Name",
    "Sector",
    "Stage",
    "Composite Score",
    "ML Score",
    "LLM Score",
    "Description",
    "Team",
    "Metrics",
  ]

  const rows = startups.map((startup) => [
    startup.rank || "",
    startup.name,
    startup.sector,
    startup.stage,
    ((startup.compositeScore || 0) * 100).toFixed(1),
    ((startup.mlScore || 0) * 100).toFixed(1),
    ((startup.llmScore || 0) * 100).toFixed(1),
    `"${startup.description.replace(/"/g, '""')}"`,
    `"${startup.team.replace(/"/g, '""')}"`,
    `"${startup.metrics.replace(/"/g, '""')}"`,
  ])

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
}

export function exportToJSON(startups: Startup[]): string {
  return JSON.stringify(startups, null, 2)
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
