"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Upload,
  FileText,
  AlertCircle,
  Download,
  CheckCircle2,
  Users,
  Loader2,
  X,
} from "lucide-react"
import type { FounderCSVMapping, FounderUploadResult } from "@/lib/types"

// CSV Preview type
interface FounderCSVPreview {
  headers: string[]
  sampleRows: string[][]
  rowCount: number
}

// Step in the upload wizard
type UploadStep = 'upload' | 'mapping' | 'preview' | 'complete'

// Mapping field definition
const MAPPING_FIELDS: Array<{
  key: keyof FounderCSVMapping
  label: string
  required: boolean
  description?: string
}> = [
  { key: 'name', label: 'Name', required: true, description: 'Founder full name' },
  { key: 'email', label: 'Email', required: false, description: 'Email address (for deduplication)' },
  { key: 'linkedIn', label: 'LinkedIn URL', required: false, description: 'LinkedIn profile (primary deduplication)' },
  { key: 'title', label: 'Title', required: false, description: 'Job title (CEO, CTO, etc.)' },
  { key: 'education', label: 'Education', required: false, description: 'Education background' },
  { key: 'experience', label: 'Experience', required: false, description: 'Prior work experience' },
  { key: 'bio', label: 'Bio', required: false, description: 'Short biography' },
  { key: 'location', label: 'Location', required: false, description: 'City/Country' },
  { key: 'skills', label: 'Skills', required: false, description: 'Comma-separated skills' },
  { key: 'companyName', label: 'Company Name', required: false, description: 'For linking to existing company' },
  { key: 'role', label: 'Role at Company', required: false, description: 'Founder, Co-Founder, etc.' },
]

export default function FounderUploadPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // State
  const [step, setStep] = useState<UploadStep>('upload')
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [csvText, setCsvText] = useState<string | null>(null)
  const [preview, setPreview] = useState<FounderCSVPreview | null>(null)
  const [mapping, setMapping] = useState<Partial<FounderCSVMapping>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [uploadResult, setUploadResult] = useState<FounderUploadResult | null>(null)

  // Handle file selection
  const handleFile = async (file: File) => {
    setError(null)

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file')
      return
    }

    try {
      const text = await file.text()
      setFileName(file.name)
      setCsvText(text)

      // Get preview from API
      setIsLoading(true)
      const response = await fetch('/api/founders/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText: text, action: 'preview' })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to parse CSV')
      }

      const data = await response.json()
      setPreview(data.preview)
      setMapping(data.suggestedMapping)
      setStep('mapping')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file')
    } finally {
      setIsLoading(false)
    }
  }

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  // Download template
  const handleDownloadTemplate = () => {
    const headers = [
      'Name',
      'Email',
      'LinkedIn URL',
      'Title',
      'Education',
      'Experience',
      'Bio',
      'Location',
      'Skills',
      'Company Name',
      'Role'
    ]

    const sampleRow = [
      'John Smith',
      'john@example.com',
      'https://linkedin.com/in/johnsmith',
      'CEO',
      'Stanford MBA 2015',
      'Ex-Google PM, 5 years',
      'Serial entrepreneur',
      'San Francisco, CA',
      'AI, Strategy, Product',
      'TechCorp Inc',
      'Co-Founder'
    ]

    const csv = [
      headers.join(','),
      sampleRow.map(v => `"${v}"`).join(',')
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'founder_upload_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Update mapping
  const updateMapping = (key: keyof FounderCSVMapping, value: string) => {
    setMapping(prev => ({
      ...prev,
      [key]: value === '__none__' ? undefined : value
    }))
  }

  // Validate and proceed to preview
  const handleProceedToPreview = () => {
    if (!mapping.name) {
      setError('Name field mapping is required')
      return
    }
    setError(null)
    setStep('preview')
  }

  // Start import
  const handleStartImport = async () => {
    if (!csvText || !mapping.name) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/founders/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvText,
          mapping: mapping as FounderCSVMapping,
          action: 'import'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Import failed')
      }

      setUploadResult(data)
      setStep('complete')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Reset and start over
  const handleReset = () => {
    setStep('upload')
    setFileName(null)
    setCsvText(null)
    setPreview(null)
    setMapping({})
    setError(null)
    setUploadResult(null)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h1 className="text-xl font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Upload Founders
              </h1>
              <p className="text-sm text-muted-foreground">
                Import founders from a CSV file
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {['upload', 'mapping', 'preview', 'complete'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s
                    ? 'bg-primary text-primary-foreground'
                    : ['upload', 'mapping', 'preview', 'complete'].indexOf(step) > i
                    ? 'bg-green-500 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {['upload', 'mapping', 'preview', 'complete'].indexOf(step) > i ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  i + 1
                )}
              </div>
              <span className="text-sm hidden sm:inline capitalize">{s}</span>
              {i < 3 && <div className="w-8 h-px bg-border" />}
            </div>
          ))}
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Upload CSV File</CardTitle>
              <CardDescription>
                Upload a CSV file containing founder information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Drag and Drop Zone */}
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileInput}
                />
                <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">
                  Drop your CSV file here
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  or click to browse
                </p>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Select File
                    </>
                  )}
                </Button>
              </div>

              {/* Download Template */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Need a template?</p>
                  <p className="text-sm text-muted-foreground">
                    Download our CSV template with sample data
                  </p>
                </div>
                <Button variant="outline" onClick={handleDownloadTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Column Mapping */}
        {step === 'mapping' && preview && (
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Map CSV Columns</CardTitle>
              <CardDescription>
                Match your CSV columns to founder fields. Found {preview.rowCount} rows in {fileName}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mapping Fields */}
              <div className="grid gap-4">
                {MAPPING_FIELDS.map(field => (
                  <div key={field.key} className="grid grid-cols-3 gap-4 items-center">
                    <div>
                      <label className="text-sm font-medium">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {field.description && (
                        <p className="text-xs text-muted-foreground">{field.description}</p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <Select
                        value={mapping[field.key] || '__none__'}
                        onValueChange={(value) => updateMapping(field.key, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">-- Not mapped --</SelectItem>
                          {preview.headers.map(header => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sample Data Preview */}
              <div>
                <h3 className="text-sm font-medium mb-2">Sample Data Preview</h3>
                <div className="overflow-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {preview.headers.map(header => (
                          <TableHead key={header} className="whitespace-nowrap">
                            {header}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.sampleRows.slice(0, 3).map((row, i) => (
                        <TableRow key={i}>
                          {row.map((cell, j) => (
                            <TableCell key={j} className="whitespace-nowrap max-w-[200px] truncate">
                              {cell || '-'}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between">
                <Button variant="outline" onClick={handleReset}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleProceedToPreview} disabled={!mapping.name}>
                  Continue to Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Preview & Import */}
        {step === 'preview' && preview && (
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Review & Import</CardTitle>
              <CardDescription>
                Review your mapping before importing {preview.rowCount} founders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mapping Summary */}
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-medium mb-3">Column Mapping</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {MAPPING_FIELDS.filter(f => mapping[f.key]).map(field => (
                    <div key={field.key} className="flex items-center gap-2">
                      <Badge variant="outline">{field.label}</Badge>
                      <span className="text-muted-foreground">→</span>
                      <span>{mapping[field.key]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Import Summary */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Import Summary</h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• {preview.rowCount} founders will be processed</li>
                  <li>• Duplicates will be detected by name{mapping.linkedIn ? ' and LinkedIn' : ''}{mapping.email ? ' and email' : ''}</li>
                  {mapping.companyName && <li>• Founders will be linked to matching companies</li>}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('mapping')}>
                  Back to Mapping
                </Button>
                <Button onClick={handleStartImport} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Start Import
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Complete */}
        {step === 'complete' && uploadResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-6 h-6" />
                Import Complete
              </CardTitle>
              <CardDescription>
                Your founders have been successfully imported
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Results Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                  <div className="text-3xl font-bold text-green-600">{uploadResult.created}</div>
                  <div className="text-sm text-muted-foreground">Founders Created</div>
                </div>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
                  <div className="text-3xl font-bold text-yellow-600">{uploadResult.duplicatesFound}</div>
                  <div className="text-sm text-muted-foreground">Duplicates Merged</div>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                  <div className="text-3xl font-bold text-blue-600">{uploadResult.linked}</div>
                  <div className="text-sm text-muted-foreground">Linked to Companies</div>
                </div>
              </div>

              {/* Errors */}
              {uploadResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium mb-2">{uploadResult.errors.length} errors occurred:</p>
                    <ul className="text-sm list-disc list-inside max-h-32 overflow-auto">
                      {uploadResult.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Actions */}
              <div className="flex justify-between">
                <Button variant="outline" onClick={handleReset}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload More
                </Button>
                <Link href="/">
                  <Button>
                    <Users className="w-4 h-4 mr-2" />
                    View Founders
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
