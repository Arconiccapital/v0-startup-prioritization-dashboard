"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  User,
  Mail,
  GraduationCap,
  Building2,
  FileQuestion,
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type {
  FounderCSVMapping,
  LLMAnalyzeResponse,
  LLMMappingSuggestion,
  EditableMappingState,
} from "@/lib/types"

// Founder category icons mapping
const FOUNDER_CATEGORY_ICONS: Record<string, React.ReactNode> = {
  personalInfo: <User className="h-4 w-4" />,
  contactInfo: <Mail className="h-4 w-4" />,
  background: <GraduationCap className="h-4 w-4" />,
  companyRole: <Building2 className="h-4 w-4" />,
  unmapped: <FileQuestion className="h-4 w-4" />,
}

// Founder category display names
const FOUNDER_CATEGORY_NAMES: Record<string, string> = {
  personalInfo: "Personal Info",
  contactInfo: "Contact Info",
  background: "Background",
  companyRole: "Company Role",
  unmapped: "Unmapped",
}

interface FounderCSVPreview {
  headers: string[]
  sampleRows: string[][]
  rowCount: number
}

interface FounderColumnMapperProps {
  preview: FounderCSVPreview
  suggestedMapping: Partial<FounderCSVMapping>
  onConfirm: (mapping: FounderCSVMapping, aiMappings?: LLMMappingSuggestion[]) => void
  onCancel: () => void
}

export function FounderColumnMapper({ preview, suggestedMapping, onConfirm, onCancel }: FounderColumnMapperProps) {
  // State for AI analysis
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<LLMAnalyzeResponse | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [feedbackText, setFeedbackText] = useState("")
  const [showFeedback, setShowFeedback] = useState(false)

  // State for mapping
  const [mapping, setMapping] = useState<Partial<FounderCSVMapping>>(suggestedMapping)
  const [editableMappings, setEditableMappings] = useState<EditableMappingState[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["personalInfo", "unmapped"]))

  // View mode
  const [viewMode, setViewMode] = useState<"ai" | "manual">("ai")

  // Analyze CSV with AI
  const analyzeWithAI = useCallback(async (userFeedback?: string) => {
    setIsAnalyzing(true)
    setAiError(null)

    try {
      const response = await fetch("/api/csv-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headers: preview.headers,
          sampleRows: preview.sampleRows,
          existingCategories: Object.keys(FOUNDER_CATEGORY_NAMES),
          userContext: userFeedback,
          entityType: 'founder', // Key difference: use founder entity type
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Analysis failed")
      }

      const data: LLMAnalyzeResponse = await response.json()
      setAiSuggestions(data)

      // Convert AI suggestions to editable mappings
      const newEditableMappings: EditableMappingState[] = preview.headers.map((header) => {
        const suggestion = data.mappings.find((m) => m.csvHeader === header)
        if (suggestion) {
          return {
            csvHeader: header,
            category: suggestion.suggestedCategory,
            field: suggestion.suggestedField,
            isNewCategory: suggestion.categoryType === "new",
            isNewField: false,
            dataType: "text",
            skip: false,
            llmSuggestion: suggestion,
          }
        }
        return {
          csvHeader: header,
          category: "unmapped",
          field: "",
          isNewCategory: false,
          isNewField: false,
          dataType: "text",
          skip: false,
        }
      })
      setEditableMappings(newEditableMappings)

      // Update traditional mapping from AI suggestions
      updateMappingFromAI(data)

    } catch (error) {
      console.error("[Founder Column Mapper] AI analysis error:", error)
      setAiError(error instanceof Error ? error.message : "Analysis failed")
    } finally {
      setIsAnalyzing(false)
    }
  }, [preview.headers, preview.sampleRows])

  // Run AI analysis on mount
  useEffect(() => {
    analyzeWithAI()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Update traditional mapping from AI suggestions
  const updateMappingFromAI = (data: LLMAnalyzeResponse) => {
    const newMapping: Partial<FounderCSVMapping> = { ...suggestedMapping }

    // Map AI suggestions to founder fields
    const fieldMap: Record<string, keyof FounderCSVMapping> = {
      "personalInfo.name": "name",
      "personalInfo.bio": "bio",
      "personalInfo.location": "location",
      "contactInfo.email": "email",
      "contactInfo.linkedIn": "linkedIn",
      "contactInfo.twitter": "twitter",
      "contactInfo.github": "github",
      "contactInfo.website": "website",
      "background.education": "education",
      "background.experience": "experience",
      "background.skills": "skills",
      "background.title": "title",
      "companyRole.companyName": "companyName",
      "companyRole.role": "role",
    }

    data.mappings.forEach((suggestion) => {
      const mappingKey = `${suggestion.suggestedCategory}.${suggestion.suggestedField}`
      const field = fieldMap[mappingKey]
      if (field) {
        newMapping[field] = suggestion.csvHeader
      }
    })

    setMapping(newMapping)
  }

  // Handle re-analyze with feedback
  const handleReanalyze = () => {
    if (feedbackText.trim()) {
      analyzeWithAI(feedbackText)
      setFeedbackText("")
      setShowFeedback(false)
    }
  }

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }

  // Skip/unskip a column
  const toggleSkip = (csvHeader: string) => {
    setEditableMappings((prev) =>
      prev.map((m) => (m.csvHeader === csvHeader ? { ...m, skip: !m.skip } : m))
    )
  }

  // Legacy manual mapping update
  const updateMapping = (field: keyof FounderCSVMapping, value: string) => {
    setMapping((prev) => ({ ...prev, [field]: value === "__none__" ? undefined : value }))
  }

  // Confirm and import
  const handleConfirm = () => {
    console.log("[Founder Column Mapper] Confirming mapping:", mapping)
    // Pass AI suggestions along with the mapping so unmapped fields can be stored in customData
    const aiMappings = aiSuggestions?.mappings.filter(m =>
      !editableMappings.find(em => em.csvHeader === m.csvHeader && em.skip)
    )
    console.log("[Founder Column Mapper] AI mappings for custom data:", aiMappings?.length || 0)
    onConfirm(mapping as FounderCSVMapping, aiMappings)
  }

  // Group mappings by category
  const mappingsByCategory = editableMappings.reduce((acc, mapping) => {
    const category = mapping.category || "unmapped"
    if (!acc[category]) acc[category] = []
    acc[category].push(mapping)
    return acc
  }, {} as Record<string, EditableMappingState[]>)

  // Check if minimum required fields are mapped
  const isValid = mapping.name !== undefined

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "bg-green-500"
    if (confidence >= 60) return "bg-yellow-500"
    return "bg-red-500"
  }

  // Get confidence badge variant
  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return "default"
    if (confidence >= 60) return "secondary"
    return "destructive"
  }

  // Render AI-powered view
  const renderAIView = () => (
    <div className="space-y-4">
      {/* AI Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              <span className="text-sm text-muted-foreground">Analyzing columns with AI...</span>
            </>
          ) : aiSuggestions ? (
            <>
              <Sparkles className="h-4 w-4 text-yellow-500" />
              <span className="text-sm">
                AI organized {aiSuggestions.mappings.length} columns into{" "}
                {Object.keys(mappingsByCategory).length} categories
              </span>
              <Badge variant={getConfidenceBadge(aiSuggestions.confidence)}>
                {aiSuggestions.confidence}% confidence
              </Badge>
            </>
          ) : aiError ? (
            <>
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-500">{aiError}</span>
            </>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {!isAnalyzing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFeedback(!showFeedback)}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Re-analyze with AI
            </Button>
          )}
        </div>
      </div>

      {/* Feedback input for re-analysis */}
      {showFeedback && (
        <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
          <Label>Give AI guidance to improve suggestions</Label>
          <Textarea
            placeholder="E.g., 'The LinkedIn URL column should go under Contact Info' or 'Prior Company is their experience'"
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            rows={2}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleReanalyze} disabled={!feedbackText.trim()}>
              <Sparkles className="h-4 w-4 mr-1" />
              Re-analyze
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowFeedback(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Analysis notes */}
      {aiSuggestions?.analysisNotes && (
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertDescription>{aiSuggestions.analysisNotes}</AlertDescription>
        </Alert>
      )}

      {/* Categories with mappings */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {Object.entries(mappingsByCategory)
          .sort(([a], [b]) => {
            // Put personalInfo and unmapped at top
            if (a === "personalInfo") return -1
            if (b === "personalInfo") return 1
            if (a === "unmapped") return -1
            if (b === "unmapped") return 1
            return 0
          })
          .map(([category, mappings]) => (
            <Collapsible
              key={category}
              open={expandedCategories.has(category)}
              onOpenChange={() => toggleCategory(category)}
            >
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors">
                  <div className="flex items-center gap-2">
                    {expandedCategories.has(category) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    {FOUNDER_CATEGORY_ICONS[category] || <FileQuestion className="h-4 w-4" />}
                    <span className="font-medium">
                      {FOUNDER_CATEGORY_NAMES[category] || category}
                    </span>
                    <Badge variant="outline">{mappings.length}</Badge>
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 space-y-2 pl-4">
                  {mappings.map((m) => (
                    <div
                      key={m.csvHeader}
                      className={`flex items-center justify-between p-2 rounded-lg border ${
                        m.skip ? "bg-muted/30 opacity-60" : "bg-card"
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {/* Confidence indicator */}
                        {m.llmSuggestion && (
                          <div
                            className={`w-2 h-8 rounded-full ${getConfidenceColor(
                              m.llmSuggestion.confidence
                            )}`}
                            title={`${m.llmSuggestion.confidence}% confidence`}
                          />
                        )}

                        {/* CSV Header */}
                        <div className="min-w-[150px]">
                          <div className="font-medium text-sm">{m.csvHeader}</div>
                          {m.llmSuggestion?.sampleValue && (
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {m.llmSuggestion.sampleValue}
                            </div>
                          )}
                        </div>

                        {/* Arrow */}
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />

                        {/* Mapped field */}
                        <div>
                          <div className="text-sm">
                            {m.field || <span className="text-muted-foreground">Not mapped</span>}
                          </div>
                          {m.llmSuggestion?.reasoning && (
                            <div className="text-xs text-muted-foreground">
                              {m.llmSuggestion.reasoning}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Skip toggle */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSkip(m.csvHeader)}
                        title={m.skip ? "Include this column" : "Skip this column"}
                      >
                        {m.skip ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
      </div>
    </div>
  )

  // Legacy manual mapping field component
  const MappingField = ({
    id,
    label,
    required = false,
    value,
    onChange,
    description,
  }: {
    id: string
    label: string
    required?: boolean
    value?: string
    onChange: (value: string) => void
    description?: string
  }) => (
    <div className="grid grid-cols-3 gap-4 items-center">
      <div>
        <Label htmlFor={id} className="flex items-center gap-2">
          {label} {required && <span className="text-destructive">*</span>}
          {value && <CheckCircle2 className="h-4 w-4 text-green-500" />}
        </Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="col-span-2">
        <Select value={value || "__none__"} onValueChange={onChange}>
          <SelectTrigger id={id}>
            <SelectValue placeholder="Select column..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">-- Not mapped --</SelectItem>
            {preview.headers.map((header) => (
              <SelectItem key={header} value={header}>
                {header}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  // Render manual mapping view
  const renderManualView = () => (
    <div className="max-h-[400px] overflow-y-auto space-y-4 pr-2">
      {/* Required Fields */}
      <div className="space-y-4">
        <div className="mb-2">
          <h4 className="text-sm font-semibold text-foreground">Required Fields</h4>
          <p className="text-xs text-muted-foreground">
            Name is required to import founders
          </p>
        </div>

        <MappingField
          id="name-mapping"
          label="Name"
          required
          value={mapping.name}
          onChange={(v) => updateMapping("name", v)}
          description="Founder full name"
        />
      </div>

      {/* Contact Info */}
      <div className="space-y-4 pt-4 border-t">
        <h4 className="text-sm font-semibold">Contact Info</h4>
        <MappingField
          id="email-mapping"
          label="Email"
          value={mapping.email}
          onChange={(v) => updateMapping("email", v)}
          description="Email address (for deduplication)"
        />
        <MappingField
          id="linkedin-mapping"
          label="LinkedIn URL"
          value={mapping.linkedIn}
          onChange={(v) => updateMapping("linkedIn", v)}
          description="LinkedIn profile (primary deduplication)"
        />
        <MappingField
          id="twitter-mapping"
          label="Twitter"
          value={mapping.twitter}
          onChange={(v) => updateMapping("twitter", v)}
        />
        <MappingField
          id="github-mapping"
          label="GitHub"
          value={mapping.github}
          onChange={(v) => updateMapping("github", v)}
        />
        <MappingField
          id="website-mapping"
          label="Website"
          value={mapping.website}
          onChange={(v) => updateMapping("website", v)}
        />
      </div>

      {/* Background */}
      <div className="space-y-4 pt-4 border-t">
        <h4 className="text-sm font-semibold">Background</h4>
        <MappingField
          id="title-mapping"
          label="Title"
          value={mapping.title}
          onChange={(v) => updateMapping("title", v)}
          description="Job title (CEO, CTO, etc.)"
        />
        <MappingField
          id="education-mapping"
          label="Education"
          value={mapping.education}
          onChange={(v) => updateMapping("education", v)}
          description="Education background"
        />
        <MappingField
          id="experience-mapping"
          label="Experience"
          value={mapping.experience}
          onChange={(v) => updateMapping("experience", v)}
          description="Prior work experience"
        />
        <MappingField
          id="bio-mapping"
          label="Bio"
          value={mapping.bio}
          onChange={(v) => updateMapping("bio", v)}
          description="Short biography"
        />
        <MappingField
          id="location-mapping"
          label="Location"
          value={mapping.location}
          onChange={(v) => updateMapping("location", v)}
          description="City/Country"
        />
        <MappingField
          id="skills-mapping"
          label="Skills"
          value={mapping.skills}
          onChange={(v) => updateMapping("skills", v)}
          description="Comma-separated skills"
        />
      </div>

      {/* Company Role */}
      <div className="space-y-4 pt-4 border-t">
        <h4 className="text-sm font-semibold">Company Role</h4>
        <MappingField
          id="company-mapping"
          label="Company Name"
          value={mapping.companyName}
          onChange={(v) => updateMapping("companyName", v)}
          description="For linking to existing company"
        />
        <MappingField
          id="role-mapping"
          label="Role"
          value={mapping.role}
          onChange={(v) => updateMapping("role", v)}
          description="Founder, Co-Founder, etc."
        />
      </div>
    </div>
  )

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          Map CSV Columns
        </CardTitle>
        <CardDescription>
          AI has analyzed {preview.rowCount} rows and suggested intelligent mappings for founder data.
          Review and adjust as needed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preview Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  {preview.headers.slice(0, 6).map((header, i) => (
                    <th key={i} className="px-4 py-2 text-left font-medium">
                      {header}
                    </th>
                  ))}
                  {preview.headers.length > 6 && (
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                      +{preview.headers.length - 6} more
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {preview.sampleRows.slice(0, 2).map((row, i) => (
                  <tr key={i} className="border-t">
                    {row.slice(0, 6).map((cell, j) => (
                      <td key={j} className="px-4 py-2 text-muted-foreground">
                        {cell.length > 30 ? `${cell.substring(0, 30)}...` : cell}
                      </td>
                    ))}
                    {row.length > 6 && <td className="px-4 py-2">...</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* View mode tabs */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "ai" | "manual")}>
          <TabsList>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI Suggestions
            </TabsTrigger>
            <TabsTrigger value="manual">Manual Mapping</TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="mt-4">
            {renderAIView()}
          </TabsContent>

          <TabsContent value="manual" className="mt-4">
            {renderManualView()}
          </TabsContent>
        </Tabs>

        {/* Validation warning */}
        {!isValid && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please map at least the Name field to continue
            </AlertDescription>
          </Alert>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleConfirm}
            disabled={!isValid || isAnalyzing}
            className="flex-1"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Confirm Mapping & Import"
            )}
          </Button>
          <Button onClick={onCancel} variant="outline">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
