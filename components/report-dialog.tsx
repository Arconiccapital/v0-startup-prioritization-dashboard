"use client"

import { useState } from "react"
import type { Startup } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { exportToCSV, exportToJSON, downloadFile } from "@/lib/report-generator"

interface ReportDialogProps {
  startups: Startup[]
}

export function ReportDialog({ startups }: ReportDialogProps) {
  const [open, setOpen] = useState(false)
  const [format, setFormat] = useState<"csv" | "json" | "summary">("csv")
  const [includeTopOnly, setIncludeTopOnly] = useState(false)
  const [topCount] = useState(10)

  const handleExport = () => {
    const dataToExport = includeTopOnly
      ? [...startups].sort((a, b) => (a.rank || 0) - (b.rank || 0)).slice(0, topCount)
      : startups

    const timestamp = new Date().toISOString().split("T")[0]

    switch (format) {
      case "csv": {
        const csv = exportToCSV(dataToExport)
        downloadFile(csv, `startup-analysis-${timestamp}.csv`, "text/csv")
        break
      }
      case "json": {
        const json = exportToJSON(dataToExport)
        downloadFile(json, `startup-analysis-${timestamp}.json`, "application/json")
        break
      }
      case "summary": {
        const summary = generateSummaryReport(dataToExport)
        downloadFile(summary, `startup-summary-${timestamp}.txt`, "text/plain")
        break
      }
    }

    setOpen(false)
  }

  const generateSummaryReport = (data: Startup[]): string => {
    const formatScore = (score: number) => score.toFixed(1)

    // Calculate statistics
    const avgScore = data.reduce((sum, s) => sum + (s.score || 0), 0) / data.length

    const scoreDistribution = {
      excellent: data.filter((s) => (s.score || 0) >= 80).length,
      good: data.filter((s) => (s.score || 0) >= 60 && (s.score || 0) < 80).length,
      fair: data.filter((s) => (s.score || 0) >= 40 && (s.score || 0) < 60).length,
      poor: data.filter((s) => (s.score || 0) < 40).length,
    }

    const sectorBreakdown = data.reduce(
      (acc, startup) => {
        acc[startup.sector] = (acc[startup.sector] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const stageBreakdown = data.reduce(
      (acc, startup) => {
        acc[startup.stage] = (acc[startup.stage] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const topPerformers = [...data].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 10)

    return `STARTUP PRIORITIZATION REPORT
Generated: ${new Date().toLocaleString()}

═══════════════════════════════════════════════════════════

OVERVIEW
────────────────────────────────────────────────────────────
Total Startups Analyzed: ${data.length}
Average Score: ${formatScore(avgScore)}

SCORE DISTRIBUTION
────────────────────────────────────────────────────────────
Excellent (80-100): ${scoreDistribution.excellent} startups
Good (60-79): ${scoreDistribution.good} startups
Fair (40-59): ${scoreDistribution.fair} startups
Poor (0-39): ${scoreDistribution.poor} startups

SECTOR BREAKDOWN
────────────────────────────────────────────────────────────
${Object.entries(sectorBreakdown)
  .map(([sector, count]) => `${sector}: ${count} startups`)
  .join("\n")}

STAGE BREAKDOWN
────────────────────────────────────────────────────────────
${Object.entries(stageBreakdown)
  .map(([stage, count]) => `${stage}: ${count} startups`)
  .join("\n")}

TOP 10 PERFORMERS
────────────────────────────────────────────────────────────
${topPerformers
  .map(
    (startup, i) =>
      `${i + 1}. ${startup.name} (${startup.sector})
   Score: ${formatScore(startup.score || 0)} | Stage: ${startup.stage}
   Team: ${startup.teamSize || "N/A"} | Funding: ${startup.fundingRaised || "N/A"}
   ${startup.description.substring(0, 100)}...
`,
  )
  .join("\n")}

═══════════════════════════════════════════════════════════
End of Report
`
  }

  return (
    <Dialog open={open} onValueChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="shadow-lg">
          <span className="mr-2">📄</span>
          Generate Report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Prioritization Report</DialogTitle>
          <DialogDescription>Choose your export format and options</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <RadioGroup value={format} onValueChange={(value) => setFormat(value as typeof format)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center gap-2 font-normal cursor-pointer">
                  <span>📊</span>
                  CSV - Spreadsheet format with all data
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="json" />
                <Label htmlFor="json" className="flex items-center gap-2 font-normal cursor-pointer">
                  <span>📋</span>
                  JSON - Structured data format
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="summary" id="summary" />
                <Label htmlFor="summary" className="flex items-center gap-2 font-normal cursor-pointer">
                  <span>📄</span>
                  Summary - Executive report with key insights
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Options</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="top-only"
                checked={includeTopOnly}
                onCheckedChange={(checked) => setIncludeTopOnly(checked as boolean)}
              />
              <Label htmlFor="top-only" className="font-normal cursor-pointer">
                Export only top {topCount} startups
              </Label>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm text-muted-foreground">
              {includeTopOnly ? `Exporting top ${topCount} startups` : `Exporting all ${startups.length} startups`}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport}>
            <span className="mr-2">⬇️</span>
            Export
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
