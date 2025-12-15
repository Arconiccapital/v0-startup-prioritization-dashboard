"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Building2,
  Users,
  TrendingUp,
  DollarSign,
  Package,
  PieChart,
  Target,
  AlertTriangle,
  BarChart2,
  Brain,
  FileQuestion,
  ExternalLink,
  Calendar,
  Hash,
  Type,
  ToggleLeft,
  ChevronDown,
  ChevronRight,
  Pencil,
  Check,
  X,
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { CustomSchema, CustomData, CustomFieldSchema } from "@/lib/types"

// Category icons mapping
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  companyInfo: <Building2 className="h-4 w-4" />,
  teamInfo: <Users className="h-4 w-4" />,
  marketInfo: <TrendingUp className="h-4 w-4" />,
  salesInfo: <DollarSign className="h-4 w-4" />,
  productInfo: <Package className="h-4 w-4" />,
  businessModel: <PieChart className="h-4 w-4" />,
  competitiveInfo: <Target className="h-4 w-4" />,
  riskOpportunity: <AlertTriangle className="h-4 w-4" />,
  metrics: <BarChart2 className="h-4 w-4" />,
  aiScores: <Brain className="h-4 w-4" />,
}

// Data type icons
const DATA_TYPE_ICONS: Record<string, React.ReactNode> = {
  text: <Type className="h-3 w-3" />,
  number: <Hash className="h-3 w-3" />,
  date: <Calendar className="h-3 w-3" />,
  url: <ExternalLink className="h-3 w-3" />,
  boolean: <ToggleLeft className="h-3 w-3" />,
}

interface DynamicDataSectionProps {
  data: CustomData | null
  schema: CustomSchema | null
  isEditing?: boolean
  onUpdate?: (newData: CustomData) => void
  className?: string
}

export function DynamicDataSection({
  data,
  schema,
  isEditing = false,
  onUpdate,
  className = "",
}: DynamicDataSectionProps) {
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>("")
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // Don't render if no custom data
  if (!schema || !data || Object.keys(schema).length === 0) {
    return null
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

  // Start editing a field
  const startEditing = (categoryKey: string, fieldKey: string, currentValue: unknown) => {
    setEditingField(`${categoryKey}.${fieldKey}`)
    setEditValue(String(currentValue ?? ""))
  }

  // Save field edit
  const saveEdit = (categoryKey: string, fieldKey: string) => {
    if (!onUpdate || !data) return

    const newData = { ...data }
    if (!newData[categoryKey]) {
      newData[categoryKey] = {}
    }

    // Parse value based on data type
    const fieldSchema = schema[categoryKey]?.fields?.[fieldKey]
    let parsedValue: unknown = editValue

    if (fieldSchema?.dataType === "number") {
      parsedValue = parseFloat(editValue) || 0
    } else if (fieldSchema?.dataType === "boolean") {
      parsedValue = editValue.toLowerCase() === "true"
    }

    newData[categoryKey][fieldKey] = parsedValue
    onUpdate(newData)
    setEditingField(null)
  }

  // Cancel edit
  const cancelEdit = () => {
    setEditingField(null)
    setEditValue("")
  }

  // Format value for display
  const formatValue = (value: unknown, fieldSchema?: CustomFieldSchema): string => {
    if (value === null || value === undefined) return "—"

    if (fieldSchema?.dataType === "boolean") {
      return value ? "Yes" : "No"
    }

    if (fieldSchema?.dataType === "date" && typeof value === "string") {
      try {
        return new Date(value).toLocaleDateString()
      } catch {
        return String(value)
      }
    }

    if (fieldSchema?.dataType === "number" && typeof value === "number") {
      return value.toLocaleString()
    }

    return String(value)
  }

  // Render value (with URL handling)
  const renderValue = (value: unknown, fieldSchema?: CustomFieldSchema) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">—</span>
    }

    if (fieldSchema?.dataType === "url" && typeof value === "string") {
      return (
        <a
          href={value.startsWith("http") ? value : `https://${value}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline flex items-center gap-1"
        >
          {value}
          <ExternalLink className="h-3 w-3" />
        </a>
      )
    }

    return <span>{formatValue(value, fieldSchema)}</span>
  }

  // Sort categories by sortOrder
  const sortedCategories = Object.entries(schema).sort(
    ([, a], [, b]) => (a.sortOrder || 0) - (b.sortOrder || 0)
  )

  // Count fields with data in each category
  const getFieldCount = (categoryKey: string): number => {
    const categoryData = data[categoryKey]
    if (!categoryData) return 0
    return Object.values(categoryData).filter((v) => v !== null && v !== undefined && v !== "")
      .length
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="outline" className="text-xs">
          <FileQuestion className="h-3 w-3 mr-1" />
          Custom Data
        </Badge>
        <span className="text-xs text-muted-foreground">
          {sortedCategories.length} custom categories from CSV import
        </span>
      </div>

      {sortedCategories.map(([categoryKey, categorySchema]) => {
        const categoryData = data[categoryKey] || {}
        const fieldCount = getFieldCount(categoryKey)
        const isExpanded = expandedCategories.has(categoryKey)
        const icon = CATEGORY_ICONS[categoryKey] || <FileQuestion className="h-4 w-4" />

        return (
          <Card key={categoryKey} className="overflow-hidden">
            <Collapsible open={isExpanded} onOpenChange={() => toggleCategory(categoryKey)}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      {icon}
                      <span>{categorySchema.displayName}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {fieldCount} / {Object.keys(categorySchema.fields || {}).length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="grid gap-3">
                    {Object.entries(categorySchema.fields || {}).map(([fieldKey, fieldSchema]) => {
                      const value = categoryData[fieldKey]
                      const fieldId = `${categoryKey}.${fieldKey}`
                      const isEditingThis = editingField === fieldId

                      return (
                        <div
                          key={fieldKey}
                          className="flex items-start justify-between py-2 border-b border-muted last:border-0"
                        >
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {DATA_TYPE_ICONS[fieldSchema.dataType] || <Type className="h-3 w-3" />}
                              <Label className="text-xs font-medium text-muted-foreground">
                                {fieldSchema.displayName}
                              </Label>
                              {fieldSchema.originalCsvHeader && (
                                <span className="text-xs text-muted-foreground/60">
                                  ({fieldSchema.originalCsvHeader})
                                </span>
                              )}
                            </div>

                            {isEditingThis ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="h-8 text-sm"
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => saveEdit(categoryKey, fieldKey)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={cancelEdit}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="text-sm break-words">
                                {renderValue(value, fieldSchema)}
                              </div>
                            )}
                          </div>

                          {isEditing && !isEditingThis && onUpdate && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditing(categoryKey, fieldKey, value)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )
      })}
    </div>
  )
}

// Compact view for displaying custom data in tables/lists
export function DynamicDataBadges({
  data,
  schema,
  maxBadges = 3,
}: {
  data: CustomData | null
  schema: CustomSchema | null
  maxBadges?: number
}) {
  if (!schema || !data) return null

  // Collect all non-empty values with their labels
  const values: { label: string; value: string }[] = []

  Object.entries(schema).forEach(([categoryKey, categorySchema]) => {
    const categoryData = data[categoryKey]
    if (!categoryData) return

    Object.entries(categorySchema.fields || {}).forEach(([fieldKey, fieldSchema]) => {
      const value = categoryData[fieldKey]
      if (value !== null && value !== undefined && value !== "") {
        values.push({
          label: fieldSchema.displayName,
          value: String(value).slice(0, 50),
        })
      }
    })
  })

  if (values.length === 0) return null

  const displayValues = values.slice(0, maxBadges)
  const remainingCount = values.length - maxBadges

  return (
    <div className="flex flex-wrap gap-1">
      {displayValues.map((v, i) => (
        <Badge key={i} variant="outline" className="text-xs">
          {v.label}: {v.value}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge variant="secondary" className="text-xs">
          +{remainingCount} more
        </Badge>
      )}
    </div>
  )
}
