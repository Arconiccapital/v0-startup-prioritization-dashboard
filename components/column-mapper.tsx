"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import type { ColumnMapping, CSVPreview } from "@/lib/types"

interface ColumnMapperProps {
  preview: CSVPreview
  suggestedMapping: ColumnMapping
  onConfirm: (mapping: ColumnMapping) => void
  onCancel: () => void
}

export function ColumnMapper({ preview, suggestedMapping, onConfirm, onCancel }: ColumnMapperProps) {
  const [mapping, setMapping] = useState<ColumnMapping>(suggestedMapping)

  const updateMapping = (field: keyof ColumnMapping, value: string) => {
    setMapping((prev) => ({ ...prev, [field]: value === "none" ? undefined : value }))
  }

  const handleConfirm = () => {
    console.log("[v0] Confirming mapping:", mapping)
    console.log("[v0] Preview has", preview.rowCount, "rows")
    console.log("[v0] Sample data:", preview.sampleRows)
    onConfirm(mapping)
  }

  const isValid = mapping.name && mapping.sector && mapping.description

  const MappingField = ({
    id,
    label,
    required = false,
    value,
    onChange,
  }: {
    id: string
    label: string
    required?: boolean
    value?: string
    onChange: (value: string) => void
  }) => (
    <div className="grid gap-2">
      <Label htmlFor={id} className="flex items-center gap-2">
        {label} {required && <span className="text-destructive">*</span>}
        {value && <CheckCircle2 className="h-4 w-4 text-green-500" />}
      </Label>
      <Select value={value || "none"} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue placeholder="Select column..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">-- Not mapped --</SelectItem>
          {preview.headers.map((header) => (
            <SelectItem key={header} value={header}>
              {header}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Map CSV Columns</CardTitle>
        <CardDescription>Match your CSV columns to the required fields. Found {preview.rowCount} rows.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preview Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  {preview.headers.map((header, i) => (
                    <th key={i} className="px-4 py-2 text-left font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.sampleRows.map((row, i) => (
                  <tr key={i} className="border-t">
                    {row.map((cell, j) => (
                      <td key={j} className="px-4 py-2 text-muted-foreground">
                        {cell.length > 50 ? `${cell.substring(0, 50)}...` : cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="max-h-[600px] overflow-y-auto space-y-4 pr-2">
          {/* Required Fields */}
          <div className="space-y-4">
            <div className="mb-2">
              <h4 className="text-sm font-semibold text-foreground">Required Fields</h4>
              <p className="text-xs text-muted-foreground">These fields must be mapped to import your data</p>
            </div>

            <MappingField
              id="name-mapping"
              label="Company Name"
              required
              value={mapping.name}
              onChange={(v) => updateMapping("name", v)}
            />

            <MappingField
              id="sector-mapping"
              label="Sector"
              required
              value={mapping.sector}
              onChange={(v) => updateMapping("sector", v)}
            />

            <MappingField
              id="description-mapping"
              label="Description"
              required
              value={mapping.description}
              onChange={(v) => updateMapping("description", v)}
            />
          </div>

          <Separator />

          {/* Basic Company Information */}
          <div className="space-y-4">
            <div className="mb-2">
              <h4 className="text-sm font-semibold text-foreground">Basic Company Information</h4>
              <p className="text-xs text-muted-foreground">Core company details and contact information</p>
            </div>

            <MappingField
              id="country-mapping"
              label="Country"
              value={mapping.country}
              onChange={(v) => updateMapping("country", v)}
            />
            <MappingField
              id="location-mapping"
              label="Location"
              value={mapping.location}
              onChange={(v) => updateMapping("location", v)}
            />
            <MappingField
              id="website-mapping"
              label="Website"
              value={mapping.website}
              onChange={(v) => updateMapping("website", v)}
            />
            <MappingField
              id="linkedin-mapping"
              label="LinkedIn URL"
              value={mapping.linkedinUrl}
              onChange={(v) => updateMapping("linkedinUrl", v)}
            />
            <MappingField
              id="founded-mapping"
              label="Founding Year"
              value={mapping.foundingYear}
              onChange={(v) => updateMapping("foundingYear", v)}
            />
            <MappingField
              id="headquarters-mapping"
              label="Headquarters"
              value={mapping.headquarters}
              onChange={(v) => updateMapping("headquarters", v)}
            />
            <MappingField
              id="employeeCount-mapping"
              label="Employee Count"
              value={mapping.employeeCount}
              onChange={(v) => updateMapping("employeeCount", v)}
            />
            <MappingField
              id="employeeSize-mapping"
              label="Employee Size"
              value={mapping.employeeSize}
              onChange={(v) => updateMapping("employeeSize", v)}
            />
            <MappingField
              id="numEmployees-mapping"
              label="# Employees"
              value={mapping.numEmployees}
              onChange={(v) => updateMapping("numEmployees", v)}
            />
            <MappingField
              id="area-mapping"
              label="Area"
              value={mapping.area}
              onChange={(v) => updateMapping("area", v)}
            />
            <MappingField
              id="vcFirm-mapping"
              label="Venture Capital Firm"
              value={mapping.ventureCapitalFirm}
              onChange={(v) => updateMapping("ventureCapitalFirm", v)}
            />
            <MappingField
              id="fundingRaised-mapping"
              label="Total Funding Raised"
              value={mapping.fundingRaised}
              onChange={(v) => updateMapping("fundingRaised", v)}
            />
          </div>

          <Separator />

          {/* Founders & Team */}
          <div className="space-y-4">
            <div className="mb-2">
              <h4 className="text-sm font-semibold text-foreground">Founders & Team</h4>
              <p className="text-xs text-muted-foreground">Information about the founding team and key personnel</p>
            </div>

            <MappingField
              id="founders-mapping"
              label="Founders"
              value={mapping.founders}
              onChange={(v) => updateMapping("founders", v)}
            />
            <MappingField
              id="foundersEducation-mapping"
              label="Founders' Education"
              value={mapping.foundersEducation}
              onChange={(v) => updateMapping("foundersEducation", v)}
            />
            <MappingField
              id="foundersPriorExperience-mapping"
              label="Founders' Prior Experience"
              value={mapping.foundersPriorExperience}
              onChange={(v) => updateMapping("foundersPriorExperience", v)}
            />
            <MappingField
              id="keyTeamMembers-mapping"
              label="Key Team Members"
              value={mapping.keyTeamMembers}
              onChange={(v) => updateMapping("keyTeamMembers", v)}
            />
            <MappingField
              id="teamDepth-mapping"
              label="Team Depth"
              value={mapping.teamDepth}
              onChange={(v) => updateMapping("teamDepth", v)}
            />
            <MappingField
              id="teamSize-mapping"
              label="Team Size"
              value={mapping.teamSize}
              onChange={(v) => updateMapping("teamSize", v)}
            />
            <MappingField
              id="teamExecutionAssessment-mapping"
              label="Team & Execution Assessment"
              value={mapping.teamExecutionAssessment}
              onChange={(v) => updateMapping("teamExecutionAssessment", v)}
            />
          </div>

          <Separator />

          {/* Market Information */}
          <div className="space-y-4">
            <div className="mb-2">
              <h4 className="text-sm font-semibold text-foreground">Market Information</h4>
              <p className="text-xs text-muted-foreground">Market size, industry, and target customer details</p>
            </div>

            <MappingField
              id="industry-mapping"
              label="Industry"
              value={mapping.industry}
              onChange={(v) => updateMapping("industry", v)}
            />
            <MappingField
              id="subIndustry-mapping"
              label="Sub-Industry"
              value={mapping.subIndustry}
              onChange={(v) => updateMapping("subIndustry", v)}
            />
            <MappingField
              id="marketSize-mapping"
              label="Market Size"
              value={mapping.marketSize}
              onChange={(v) => updateMapping("marketSize", v)}
            />
            <MappingField
              id="aiDisruption-mapping"
              label="AI Disruption Propensity"
              value={mapping.aiDisruptionPropensity}
              onChange={(v) => updateMapping("aiDisruptionPropensity", v)}
            />
            <MappingField
              id="targetPersona-mapping"
              label="Target Persona"
              value={mapping.targetPersona}
              onChange={(v) => updateMapping("targetPersona", v)}
            />
            <MappingField
              id="b2bOrB2c-mapping"
              label="B2B or B2C"
              value={mapping.b2bOrB2c}
              onChange={(v) => updateMapping("b2bOrB2c", v)}
            />
            <MappingField
              id="marketCompetition-mapping"
              label="Market & Competition Analysis"
              value={mapping.marketCompetitionAnalysis}
              onChange={(v) => updateMapping("marketCompetitionAnalysis", v)}
            />
          </div>

          <Separator />

          {/* Product Information */}
          <div className="space-y-4">
            <div className="mb-2">
              <h4 className="text-sm font-semibold text-foreground">Product Information</h4>
              <p className="text-xs text-muted-foreground">Product details, problem solved, and differentiation</p>
            </div>

            <MappingField
              id="productName-mapping"
              label="Product Name"
              value={mapping.productName}
              onChange={(v) => updateMapping("productName", v)}
            />
            <MappingField
              id="problemSolved-mapping"
              label="Problem Solved"
              value={mapping.problemSolved}
              onChange={(v) => updateMapping("problemSolved", v)}
            />
            <MappingField
              id="horizontalVertical-mapping"
              label="Horizontal or Vertical"
              value={mapping.horizontalOrVertical}
              onChange={(v) => updateMapping("horizontalOrVertical", v)}
            />
            <MappingField
              id="moat-mapping"
              label="Moat / Competitive Advantage"
              value={mapping.moat}
              onChange={(v) => updateMapping("moat", v)}
            />
          </div>

          <Separator />

          {/* Business Model */}
          <div className="space-y-4">
            <div className="mb-2">
              <h4 className="text-sm font-semibold text-foreground">Business Model</h4>
              <p className="text-xs text-muted-foreground">Revenue model, pricing, and unit economics</p>
            </div>

            <MappingField
              id="revenueModel-mapping"
              label="Revenue Model"
              value={mapping.revenueModel}
              onChange={(v) => updateMapping("revenueModel", v)}
            />
            <MappingField
              id="pricingStrategy-mapping"
              label="Pricing Strategy"
              value={mapping.pricingStrategy}
              onChange={(v) => updateMapping("pricingStrategy", v)}
            />
            <MappingField
              id="unitEconomics-mapping"
              label="Unit Economics"
              value={mapping.unitEconomics}
              onChange={(v) => updateMapping("unitEconomics", v)}
            />
          </div>

          <Separator />

          {/* Sales & GTM */}
          <div className="space-y-4">
            <div className="mb-2">
              <h4 className="text-sm font-semibold text-foreground">Sales & Go-to-Market</h4>
              <p className="text-xs text-muted-foreground">Sales strategy, channels, and customer acquisition</p>
            </div>

            <MappingField
              id="salesMotion-mapping"
              label="Sales Motion"
              value={mapping.salesMotion}
              onChange={(v) => updateMapping("salesMotion", v)}
            />
            <MappingField
              id="salesCycle-mapping"
              label="Sales Cycle Length"
              value={mapping.salesCycleLength}
              onChange={(v) => updateMapping("salesCycleLength", v)}
            />
            <MappingField
              id="gtmStrategy-mapping"
              label="Go-to-Market Strategy"
              value={mapping.gtmStrategy}
              onChange={(v) => updateMapping("gtmStrategy", v)}
            />
            <MappingField
              id="channels-mapping"
              label="Channels"
              value={mapping.channels}
              onChange={(v) => updateMapping("channels", v)}
            />
            <MappingField
              id="salesComplexity-mapping"
              label="Sales Complexity"
              value={mapping.salesComplexity}
              onChange={(v) => updateMapping("salesComplexity", v)}
            />
          </div>

          <Separator />

          {/* Competitive Landscape */}
          <div className="space-y-4">
            <div className="mb-2">
              <h4 className="text-sm font-semibold text-foreground">Competitive Landscape</h4>
              <p className="text-xs text-muted-foreground">Competitors and market positioning</p>
            </div>

            <MappingField
              id="competitors-mapping"
              label="Competitors"
              value={mapping.competitors}
              onChange={(v) => updateMapping("competitors", v)}
            />
            <MappingField
              id="industryMultiples-mapping"
              label="Industry Multiples"
              value={mapping.industryMultiples}
              onChange={(v) => updateMapping("industryMultiples", v)}
            />
          </div>

          <Separator />

          {/* Financial Metrics */}
          <div className="space-y-4">
            <div className="mb-2">
              <h4 className="text-sm font-semibold text-foreground">Financial Metrics</h4>
              <p className="text-xs text-muted-foreground">Revenue, growth, and financial performance</p>
            </div>

            <MappingField
              id="arr-mapping"
              label="ARR (Annual Recurring Revenue)"
              value={mapping.arr}
              onChange={(v) => updateMapping("arr", v)}
            />
            <MappingField
              id="growth-mapping"
              label="Growth Rate"
              value={mapping.growth}
              onChange={(v) => updateMapping("growth", v)}
            />
            <MappingField
              id="fundingStage-mapping"
              label="Funding Stage"
              value={mapping.stage}
              onChange={(v) => updateMapping("stage", v)}
            />
          </div>

          <Separator />

          {/* Risk & Opportunity */}
          <div className="space-y-4">
            <div className="mb-2">
              <h4 className="text-sm font-semibold text-foreground">Risk & Opportunity</h4>
              <p className="text-xs text-muted-foreground">Risk factors and exit potential</p>
            </div>

            <MappingField
              id="regulatoryRisk-mapping"
              label="Regulatory Risk"
              value={mapping.regulatoryRisk}
              onChange={(v) => updateMapping("regulatoryRisk", v)}
            />
            <MappingField
              id="exitPotential-mapping"
              label="Exit Potential"
              value={mapping.exitPotential}
              onChange={(v) => updateMapping("exitPotential", v)}
            />
          </div>

          <Separator />

          {/* AI Scores & Analysis */}
          <div className="space-y-4">
            <div className="mb-2">
              <h4 className="text-sm font-semibold text-foreground">AI Scores & Analysis</h4>
              <p className="text-xs text-muted-foreground">Machine learning scores and investment analysis</p>
            </div>

            <MappingField
              id="llmScore-mapping"
              label="LLM Score"
              value={mapping.score}
              onChange={(v) => updateMapping("score", v)}
            />
            <MappingField
              id="mlScore-mapping"
              label="Machine Learning Score"
              value={mapping.machineLearningScore}
              onChange={(v) => updateMapping("machineLearningScore", v)}
            />
            <MappingField
              id="llmRules-mapping"
              label="LLM Rules / Analysis"
              value={mapping.arconicLlmRules}
              onChange={(v) => updateMapping("arconicLlmRules", v)}
            />
            <MappingField
              id="investmentScore-mapping"
              label="Investment Score Overview"
              value={mapping.investmentScoreOverview}
              onChange={(v) => updateMapping("investmentScoreOverview", v)}
            />
            <MappingField
              id="keyStrengths-mapping"
              label="Key Strengths"
              value={mapping.keyStrengths}
              onChange={(v) => updateMapping("keyStrengths", v)}
            />
            <MappingField
              id="areasOfConcern-mapping"
              label="Areas of Concern"
              value={mapping.areasOfConcern}
              onChange={(v) => updateMapping("areasOfConcern", v)}
            />
          </div>

          <Separator />

          {/* Legacy Fields */}
          <div className="space-y-4">
            <div className="mb-2">
              <h4 className="text-sm font-semibold text-foreground">Additional Fields</h4>
              <p className="text-xs text-muted-foreground">Other optional fields</p>
            </div>

            <MappingField
              id="team-mapping"
              label="Team (legacy)"
              value={mapping.team}
              onChange={(v) => updateMapping("team", v)}
            />
            <MappingField
              id="metrics-mapping"
              label="Metrics (legacy)"
              value={mapping.metrics}
              onChange={(v) => updateMapping("metrics", v)}
            />
          </div>
        </div>

        {!isValid && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please map all required fields (Company Name, Sector, Description) to continue
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3">
          <Button onClick={handleConfirm} disabled={!isValid} className="flex-1">
            Confirm Mapping & Import
          </Button>
          <Button onClick={onCancel} variant="outline">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
