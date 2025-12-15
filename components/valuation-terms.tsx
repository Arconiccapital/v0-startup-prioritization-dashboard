"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, Plus, Trash2, DollarSign, TrendingUp, FileText, Loader2 } from "lucide-react"
import type { ValuationData, ComparableCompany, TermSheetStatus } from "@/lib/types"

interface ValuationTermsProps {
  data?: ValuationData | null
  onSave: (data: ValuationData) => Promise<void>
}

const TERM_SHEET_STATUSES: TermSheetStatus[] = [
  "Not Started", "Draft", "Sent", "Negotiating", "Signed", "Declined"
]

const LIQUIDATION_PREFERENCES = [
  "1x non-participating",
  "1x participating",
  "1.5x non-participating",
  "1.5x participating",
  "2x non-participating",
  "2x participating",
]

const ANTI_DILUTION_OPTIONS = [
  "Broad-based weighted average",
  "Narrow-based weighted average",
  "Full ratchet",
  "None",
]

function getDefaultData(): ValuationData {
  return {
    valuation: {
      proposedPreMoney: null,
      proposedPostMoney: null,
      askingValuation: null,
      ourOffer: null,
      comparableCompanies: [],
      valuationNotes: "",
    },
    financials: {
      currentARR: null,
      currentMRR: null,
      runway: null,
      burnRate: null,
      grossMargin: null,
      lastRoundValuation: null,
      lastRoundDate: null,
      totalRaised: null,
      revenueGrowthRate: null,
      financialNotes: "",
    },
    termSheet: {
      roundSize: null,
      ourAllocation: null,
      ownershipTarget: null,
      proRataRights: false,
      boardSeat: false,
      boardObserver: false,
      liquidationPreference: "1x non-participating",
      antiDilution: "Broad-based weighted average",
      dividends: "",
      votingRights: "",
      protectiveProvisions: [],
      otherTerms: "",
      termSheetStatus: "Not Started",
      termSheetNotes: "",
    },
    lastUpdated: new Date().toISOString(),
  }
}

function formatCurrency(value: number | null): string {
  if (value === null) return ""
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function parseCurrency(value: string): number | null {
  const cleaned = value.replace(/[^0-9.-]/g, "")
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

function getStatusColor(status: TermSheetStatus): string {
  switch (status) {
    case "Signed": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    case "Negotiating": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    case "Sent": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    case "Draft": return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    case "Declined": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    default: return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
  }
}

export function ValuationTermsComponent({ data, onSave }: ValuationTermsProps) {
  const [formData, setFormData] = useState<ValuationData>(data || getDefaultData())
  const [isSaving, setIsSaving] = useState(false)
  const [openSections, setOpenSections] = useState({
    valuation: true,
    financials: true,
    termSheet: true,
  })

  useEffect(() => {
    if (data) {
      setFormData(data)
    }
  }, [data])

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave({
        ...formData,
        lastUpdated: new Date().toISOString(),
      })
    } finally {
      setIsSaving(false)
    }
  }

  const addComparable = () => {
    setFormData((prev) => ({
      ...prev,
      valuation: {
        ...prev.valuation,
        comparableCompanies: [
          ...prev.valuation.comparableCompanies,
          { name: "", valuation: null, multiple: "", notes: "" },
        ],
      },
    }))
  }

  const removeComparable = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      valuation: {
        ...prev.valuation,
        comparableCompanies: prev.valuation.comparableCompanies.filter((_, i) => i !== index),
      },
    }))
  }

  const updateComparable = (index: number, field: keyof ComparableCompany, value: string | number | null) => {
    setFormData((prev) => ({
      ...prev,
      valuation: {
        ...prev.valuation,
        comparableCompanies: prev.valuation.comparableCompanies.map((comp, i) =>
          i === index ? { ...comp, [field]: value } : comp
        ),
      },
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Valuation & Terms</h2>
          <p className="text-muted-foreground">
            Track valuation analysis, financials, and term sheet details
          </p>
        </div>
        <div className="flex items-center gap-4">
          {formData.termSheet.termSheetStatus !== "Not Started" && (
            <Badge className={getStatusColor(formData.termSheet.termSheetStatus)}>
              Term Sheet: {formData.termSheet.termSheetStatus}
            </Badge>
          )}
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>

      {/* Valuation Section */}
      <Card className="p-6">
        <Collapsible open={openSections.valuation} onOpenChange={() => toggleSection("valuation")}>
          <CollapsibleTrigger className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold">Valuation</h3>
            </div>
            {openSections.valuation ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Asking Valuation</Label>
                <Input
                  placeholder="$0"
                  value={formData.valuation.askingValuation ? formatCurrency(formData.valuation.askingValuation) : ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      valuation: { ...prev.valuation, askingValuation: parseCurrency(e.target.value) },
                    }))
                  }
                />
              </div>
              <div>
                <Label>Our Offer</Label>
                <Input
                  placeholder="$0"
                  value={formData.valuation.ourOffer ? formatCurrency(formData.valuation.ourOffer) : ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      valuation: { ...prev.valuation, ourOffer: parseCurrency(e.target.value) },
                    }))
                  }
                />
              </div>
              <div>
                <Label>Proposed Pre-Money</Label>
                <Input
                  placeholder="$0"
                  value={formData.valuation.proposedPreMoney ? formatCurrency(formData.valuation.proposedPreMoney) : ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      valuation: { ...prev.valuation, proposedPreMoney: parseCurrency(e.target.value) },
                    }))
                  }
                />
              </div>
              <div>
                <Label>Proposed Post-Money</Label>
                <Input
                  placeholder="$0"
                  value={formData.valuation.proposedPostMoney ? formatCurrency(formData.valuation.proposedPostMoney) : ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      valuation: { ...prev.valuation, proposedPostMoney: parseCurrency(e.target.value) },
                    }))
                  }
                />
              </div>
            </div>

            {/* Comparable Companies */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <Label>Comparable Companies</Label>
                <Button variant="outline" size="sm" onClick={addComparable}>
                  <Plus className="h-4 w-4 mr-1" /> Add Comparable
                </Button>
              </div>
              {formData.valuation.comparableCompanies.length > 0 ? (
                <div className="space-y-2">
                  {formData.valuation.comparableCompanies.map((comp, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <Input
                        placeholder="Company name"
                        value={comp.name}
                        onChange={(e) => updateComparable(index, "name", e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="Valuation"
                        value={comp.valuation ? formatCurrency(comp.valuation) : ""}
                        onChange={(e) => updateComparable(index, "valuation", parseCurrency(e.target.value))}
                        className="w-32"
                      />
                      <Input
                        placeholder="Multiple (e.g. 10x ARR)"
                        value={comp.multiple}
                        onChange={(e) => updateComparable(index, "multiple", e.target.value)}
                        className="w-32"
                      />
                      <Input
                        placeholder="Notes"
                        value={comp.notes}
                        onChange={(e) => updateComparable(index, "notes", e.target.value)}
                        className="flex-1"
                      />
                      <Button variant="ghost" size="icon" onClick={() => removeComparable(index)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No comparable companies added yet.</p>
              )}
            </div>

            <div>
              <Label>Valuation Notes</Label>
              <Textarea
                placeholder="Notes on valuation methodology, comps analysis, etc."
                value={formData.valuation.valuationNotes}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    valuation: { ...prev.valuation, valuationNotes: e.target.value },
                  }))
                }
                rows={3}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Financials Section */}
      <Card className="p-6">
        <Collapsible open={openSections.financials} onOpenChange={() => toggleSection("financials")}>
          <CollapsibleTrigger className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Financials</h3>
            </div>
            {openSections.financials ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Current ARR</Label>
                <Input
                  placeholder="$0"
                  value={formData.financials.currentARR ? formatCurrency(formData.financials.currentARR) : ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      financials: { ...prev.financials, currentARR: parseCurrency(e.target.value) },
                    }))
                  }
                />
              </div>
              <div>
                <Label>Current MRR</Label>
                <Input
                  placeholder="$0"
                  value={formData.financials.currentMRR ? formatCurrency(formData.financials.currentMRR) : ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      financials: { ...prev.financials, currentMRR: parseCurrency(e.target.value) },
                    }))
                  }
                />
              </div>
              <div>
                <Label>Revenue Growth Rate (%)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.financials.revenueGrowthRate ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      financials: { ...prev.financials, revenueGrowthRate: e.target.value ? parseFloat(e.target.value) : null },
                    }))
                  }
                />
              </div>
              <div>
                <Label>Monthly Burn Rate</Label>
                <Input
                  placeholder="$0"
                  value={formData.financials.burnRate ? formatCurrency(formData.financials.burnRate) : ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      financials: { ...prev.financials, burnRate: parseCurrency(e.target.value) },
                    }))
                  }
                />
              </div>
              <div>
                <Label>Runway (months)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.financials.runway ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      financials: { ...prev.financials, runway: e.target.value ? parseInt(e.target.value) : null },
                    }))
                  }
                />
              </div>
              <div>
                <Label>Gross Margin (%)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.financials.grossMargin ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      financials: { ...prev.financials, grossMargin: e.target.value ? parseFloat(e.target.value) : null },
                    }))
                  }
                />
              </div>
              <div>
                <Label>Total Raised to Date</Label>
                <Input
                  placeholder="$0"
                  value={formData.financials.totalRaised ? formatCurrency(formData.financials.totalRaised) : ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      financials: { ...prev.financials, totalRaised: parseCurrency(e.target.value) },
                    }))
                  }
                />
              </div>
              <div>
                <Label>Last Round Valuation</Label>
                <Input
                  placeholder="$0"
                  value={formData.financials.lastRoundValuation ? formatCurrency(formData.financials.lastRoundValuation) : ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      financials: { ...prev.financials, lastRoundValuation: parseCurrency(e.target.value) },
                    }))
                  }
                />
              </div>
              <div>
                <Label>Last Round Date</Label>
                <Input
                  type="date"
                  value={formData.financials.lastRoundDate || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      financials: { ...prev.financials, lastRoundDate: e.target.value || null },
                    }))
                  }
                />
              </div>
            </div>

            <div>
              <Label>Financial Notes</Label>
              <Textarea
                placeholder="Additional notes on financials, cap table observations, etc."
                value={formData.financials.financialNotes}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    financials: { ...prev.financials, financialNotes: e.target.value },
                  }))
                }
                rows={3}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Term Sheet Section */}
      <Card className="p-6">
        <Collapsible open={openSections.termSheet} onOpenChange={() => toggleSection("termSheet")}>
          <CollapsibleTrigger className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold">Term Sheet</h3>
              {formData.termSheet.termSheetStatus !== "Not Started" && (
                <Badge className={getStatusColor(formData.termSheet.termSheetStatus)}>
                  {formData.termSheet.termSheetStatus}
                </Badge>
              )}
            </div>
            {openSections.termSheet ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-4">
            {/* Status */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label>Term Sheet Status</Label>
                <Select
                  value={formData.termSheet.termSheetStatus}
                  onValueChange={(value: TermSheetStatus) =>
                    setFormData((prev) => ({
                      ...prev,
                      termSheet: { ...prev.termSheet, termSheetStatus: value },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TERM_SHEET_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Round Size</Label>
                <Input
                  placeholder="$0"
                  value={formData.termSheet.roundSize ? formatCurrency(formData.termSheet.roundSize) : ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      termSheet: { ...prev.termSheet, roundSize: parseCurrency(e.target.value) },
                    }))
                  }
                />
              </div>
              <div>
                <Label>Our Allocation</Label>
                <Input
                  placeholder="$0"
                  value={formData.termSheet.ourAllocation ? formatCurrency(formData.termSheet.ourAllocation) : ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      termSheet: { ...prev.termSheet, ourAllocation: parseCurrency(e.target.value) },
                    }))
                  }
                />
              </div>
              <div>
                <Label>Target Ownership (%)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.termSheet.ownershipTarget ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      termSheet: { ...prev.termSheet, ownershipTarget: e.target.value ? parseFloat(e.target.value) : null },
                    }))
                  }
                />
              </div>
            </div>

            {/* Rights */}
            <div className="flex gap-6 py-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="proRata"
                  checked={formData.termSheet.proRataRights}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      termSheet: { ...prev.termSheet, proRataRights: !!checked },
                    }))
                  }
                />
                <label htmlFor="proRata" className="text-sm font-medium">Pro-Rata Rights</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="boardSeat"
                  checked={formData.termSheet.boardSeat}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      termSheet: { ...prev.termSheet, boardSeat: !!checked },
                    }))
                  }
                />
                <label htmlFor="boardSeat" className="text-sm font-medium">Board Seat</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="boardObserver"
                  checked={formData.termSheet.boardObserver}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      termSheet: { ...prev.termSheet, boardObserver: !!checked },
                    }))
                  }
                />
                <label htmlFor="boardObserver" className="text-sm font-medium">Board Observer</label>
              </div>
            </div>

            {/* Key Terms */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Liquidation Preference</Label>
                <Select
                  value={formData.termSheet.liquidationPreference}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      termSheet: { ...prev.termSheet, liquidationPreference: value },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LIQUIDATION_PREFERENCES.map((pref) => (
                      <SelectItem key={pref} value={pref}>
                        {pref}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Anti-Dilution</Label>
                <Select
                  value={formData.termSheet.antiDilution}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      termSheet: { ...prev.termSheet, antiDilution: value },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ANTI_DILUTION_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Dividends</Label>
                <Input
                  placeholder="e.g., 8% non-cumulative"
                  value={formData.termSheet.dividends}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      termSheet: { ...prev.termSheet, dividends: e.target.value },
                    }))
                  }
                />
              </div>
              <div>
                <Label>Voting Rights</Label>
                <Input
                  placeholder="e.g., 1 vote per share"
                  value={formData.termSheet.votingRights}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      termSheet: { ...prev.termSheet, votingRights: e.target.value },
                    }))
                  }
                />
              </div>
            </div>

            <div>
              <Label>Other Terms</Label>
              <Textarea
                placeholder="Any other important terms (protective provisions, drag-along, etc.)"
                value={formData.termSheet.otherTerms}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    termSheet: { ...prev.termSheet, otherTerms: e.target.value },
                  }))
                }
                rows={3}
              />
            </div>

            <div>
              <Label>Term Sheet Notes</Label>
              <Textarea
                placeholder="Notes on negotiation, red flags, comparisons to standard terms, etc."
                value={formData.termSheet.termSheetNotes}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    termSheet: { ...prev.termSheet, termSheetNotes: e.target.value },
                  }))
                }
                rows={3}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Last Updated */}
      {formData.lastUpdated && (
        <p className="text-xs text-muted-foreground text-right">
          Last updated: {new Date(formData.lastUpdated).toLocaleString()}
        </p>
      )}
    </div>
  )
}
