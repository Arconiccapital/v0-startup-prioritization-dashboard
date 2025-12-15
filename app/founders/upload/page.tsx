"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
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
} from "lucide-react"
import type { FounderCSVMapping, FounderUploadResult, LLMMappingSuggestion } from "@/lib/types"
import { FounderColumnMapper } from "@/components/founder-column-mapper"

// CSV Preview type
interface FounderCSVPreview {
  headers: string[]
  sampleRows: string[][]
  rowCount: number
}

// Step in the upload wizard - simplified to 3 steps with AI-powered mapping
type UploadStep = 'upload' | 'mapping' | 'complete'

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
  const [suggestedMapping, setSuggestedMapping] = useState<Partial<FounderCSVMapping>>({})
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
      setSuggestedMapping(data.suggestedMapping || {})
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

  // Handle confirm mapping from FounderColumnMapper
  const handleConfirmMapping = async (mapping: FounderCSVMapping, aiMappings?: LLMMappingSuggestion[]) => {
    if (!csvText || !mapping.name) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/founders/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvText,
          mapping,
          action: 'import',
          aiMappings, // Pass AI mappings for custom data storage
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

  // Cancel mapping and go back to upload
  const handleCancelMapping = () => {
    setStep('upload')
    setPreview(null)
    setSuggestedMapping({})
    setCsvText(null)
    setFileName(null)
    setError(null)
  }

  // Reset and start over
  const handleReset = () => {
    setStep('upload')
    setFileName(null)
    setCsvText(null)
    setPreview(null)
    setSuggestedMapping({})
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
        {/* Progress Steps - simplified 3-step flow */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {['upload', 'mapping', 'complete'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s
                    ? 'bg-primary text-primary-foreground'
                    : ['upload', 'mapping', 'complete'].indexOf(step) > i
                    ? 'bg-green-500 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {['upload', 'mapping', 'complete'].indexOf(step) > i ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  i + 1
                )}
              </div>
              <span className="text-sm hidden sm:inline capitalize">{s === 'mapping' ? 'AI Mapping' : s}</span>
              {i < 2 && <div className="w-8 h-px bg-border" />}
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

        {/* Step 2: AI-Powered Column Mapping */}
        {step === 'mapping' && preview && (
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10 rounded-lg">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Importing founders...</span>
                </div>
              </div>
            )}
            <FounderColumnMapper
              preview={preview}
              suggestedMapping={suggestedMapping}
              onConfirm={handleConfirmMapping}
              onCancel={handleCancelMapping}
            />
          </div>
        )}

        {/* Step 3: Complete */}
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
