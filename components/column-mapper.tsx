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

  const isValid = mapping.name && mapping.sector && mapping.stage && mapping.description

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

        {/* Mapping Controls */}
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name-mapping" className="flex items-center gap-2">
              Startup Name <span className="text-destructive">*</span>
              {mapping.name && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            </Label>
            <Select value={mapping.name || "none"} onValueChange={(v) => updateMapping("name", v)}>
              <SelectTrigger id="name-mapping">
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

          <div className="grid gap-2">
            <Label htmlFor="sector-mapping" className="flex items-center gap-2">
              Sector <span className="text-destructive">*</span>
              {mapping.sector && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            </Label>
            <Select value={mapping.sector || "none"} onValueChange={(v) => updateMapping("sector", v)}>
              <SelectTrigger id="sector-mapping">
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

          <div className="grid gap-2">
            <Label htmlFor="stage-mapping" className="flex items-center gap-2">
              Stage <span className="text-destructive">*</span>
              {mapping.stage && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            </Label>
            <Select value={mapping.stage || "none"} onValueChange={(v) => updateMapping("stage", v)}>
              <SelectTrigger id="stage-mapping">
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

          <div className="grid gap-2">
            <Label htmlFor="description-mapping" className="flex items-center gap-2">
              Description <span className="text-destructive">*</span>
              {mapping.description && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            </Label>
            <Select value={mapping.description || "none"} onValueChange={(v) => updateMapping("description", v)}>
              <SelectTrigger id="description-mapping">
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

          <div className="grid gap-2">
            <Label htmlFor="score-mapping" className="flex items-center gap-2">
              Score (optional)
              {mapping.score && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            </Label>
            <Select value={mapping.score || "none"} onValueChange={(v) => updateMapping("score", v)}>
              <SelectTrigger id="score-mapping">
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
            <p className="text-xs text-muted-foreground">
              The score column should contain numeric values. If not mapped or empty, startups will be assigned a
              default score of 0.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="team-mapping">Team (optional)</Label>
            <Select value={mapping.team || "none"} onValueChange={(v) => updateMapping("team", v)}>
              <SelectTrigger id="team-mapping">
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

          <div className="grid gap-2">
            <Label htmlFor="metrics-mapping">Metrics (optional)</Label>
            <Select value={mapping.metrics || "none"} onValueChange={(v) => updateMapping("metrics", v)}>
              <SelectTrigger id="metrics-mapping">
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

          <div className="grid gap-2">
            <Label htmlFor="country-mapping">Country (optional)</Label>
            <Select value={mapping.country || "none"} onValueChange={(v) => updateMapping("country", v)}>
              <SelectTrigger id="country-mapping">
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

          <Separator className="my-4" />
          <div className="mb-2">
            <h4 className="text-sm font-semibold">Company Information (Optional)</h4>
            <p className="text-xs text-muted-foreground">Map additional company details if available in your CSV</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="founded-mapping">Founded Year</Label>
            <Select value={mapping.founded || "none"} onValueChange={(v) => updateMapping("founded", v)}>
              <SelectTrigger id="founded-mapping">
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

          <div className="grid gap-2">
            <Label htmlFor="headquarters-mapping">Headquarters</Label>
            <Select value={mapping.headquarters || "none"} onValueChange={(v) => updateMapping("headquarters", v)}>
              <SelectTrigger id="headquarters-mapping">
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

          <div className="grid gap-2">
            <Label htmlFor="website-mapping">Website</Label>
            <Select value={mapping.website || "none"} onValueChange={(v) => updateMapping("website", v)}>
              <SelectTrigger id="website-mapping">
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

          <div className="grid gap-2">
            <Label htmlFor="linkedin-mapping">LinkedIn URL</Label>
            <Select value={mapping.linkedin || "none"} onValueChange={(v) => updateMapping("linkedin", v)}>
              <SelectTrigger id="linkedin-mapping">
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

          <div className="grid gap-2">
            <Label htmlFor="employeeCount-mapping">Employee Count</Label>
            <Select value={mapping.employeeCount || "none"} onValueChange={(v) => updateMapping("employeeCount", v)}>
              <SelectTrigger id="employeeCount-mapping">
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

          <div className="grid gap-2">
            <Label htmlFor="fundingRaised-mapping">Total Funding Raised</Label>
            <Select value={mapping.fundingRaised || "none"} onValueChange={(v) => updateMapping("fundingRaised", v)}>
              <SelectTrigger id="fundingRaised-mapping">
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

          <Separator className="my-4" />
          <div className="mb-2">
            <h4 className="text-sm font-semibold">Detailed Metrics (Optional)</h4>
            <p className="text-xs text-muted-foreground">Map specific financial and operational metrics</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="arr-mapping">ARR (Annual Recurring Revenue)</Label>
            <Select value={mapping.arr || "none"} onValueChange={(v) => updateMapping("arr", v)}>
              <SelectTrigger id="arr-mapping">
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

          <div className="grid gap-2">
            <Label htmlFor="growth-mapping">Growth Rate</Label>
            <Select value={mapping.growth || "none"} onValueChange={(v) => updateMapping("growth", v)}>
              <SelectTrigger id="growth-mapping">
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

          <div className="grid gap-2">
            <Label htmlFor="teamSize-mapping">Team Size</Label>
            <Select value={mapping.teamSize || "none"} onValueChange={(v) => updateMapping("teamSize", v)}>
              <SelectTrigger id="teamSize-mapping">
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

          <div className="grid gap-2">
            <Label htmlFor="fundingStage-mapping">Funding Stage</Label>
            <Select value={mapping.fundingStage || "none"} onValueChange={(v) => updateMapping("fundingStage", v)}>
              <SelectTrigger id="fundingStage-mapping">
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
        </div>

        {!isValid && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please map all required fields (Name, Sector, Stage, Description) to continue
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
