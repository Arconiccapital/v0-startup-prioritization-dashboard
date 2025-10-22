"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, FileText, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { parseCSVPreview, parseCSVWithMapping, suggestMapping } from "@/lib/csv-parser"
import type { Startup, CSVPreview, ColumnMapping } from "@/lib/types"
import { ColumnMapper } from "./column-mapper"

interface CsvUploadProps {
  onUploadComplete: (startups: Startup[]) => void
}

export function CsvUpload({ onUploadComplete }: CsvUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [csvText, setCsvText] = useState<string | null>(null)
  const [preview, setPreview] = useState<CSVPreview | null>(null)
  const [suggestedMapping, setSuggestedMapping] = useState<ColumnMapping | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setError(null)
    setFileName(file.name)

    if (!file.name.endsWith(".csv")) {
      setError("Please upload a CSV file")
      return
    }

    try {
      const text = await file.text()
      const csvPreview = parseCSVPreview(text)
      const mapping = suggestMapping(csvPreview.headers)

      setCsvText(text)
      setPreview(csvPreview)
      setSuggestedMapping(mapping)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse CSV file")
    }
  }

  const handleConfirmMapping = (mapping: ColumnMapping) => {
    if (!csvText) return

    try {
      const startups = parseCSVWithMapping(csvText, mapping)

      if (startups.length === 0) {
        setError("No valid startup data found in CSV")
        return
      }

      onUploadComplete(startups)
      // Reset state
      setPreview(null)
      setSuggestedMapping(null)
      setCsvText(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse CSV file")
    }
  }

  const handleCancelMapping = () => {
    setPreview(null)
    setSuggestedMapping(null)
    setCsvText(null)
    setFileName(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  if (preview && suggestedMapping) {
    return (
      <ColumnMapper
        preview={preview}
        suggestedMapping={suggestedMapping}
        onConfirm={handleConfirmMapping}
        onCancel={handleCancelMapping}
      />
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Startup Data</CardTitle>
        <CardDescription>
          Import a CSV file with startup information. You'll be able to map columns in the next step.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          }`}
        >
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileInput} className="hidden" />

          <div className="flex flex-col items-center gap-4">
            {fileName ? (
              <>
                <FileText className="h-12 w-12 text-primary" />
                <div>
                  <p className="font-medium text-foreground">{fileName}</p>
                  <p className="text-sm text-muted-foreground">Processing...</p>
                </div>
              </>
            ) : (
              <>
                <Upload className="h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Drop your CSV file here</p>
                  <p className="text-sm text-muted-foreground">or click to browse</p>
                </div>
              </>
            )}

            <Button onClick={() => fileInputRef.current?.click()} variant="outline">
              Select File
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mt-6 space-y-2">
          <p className="text-sm font-medium text-foreground">How it works:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>1. Upload any CSV file with startup data</li>
            <li>2. Map your columns to required fields (name, sector, stage, description)</li>
            <li>3. Optionally map existing score columns to skip AI scoring</li>
            <li>4. Import and start analyzing</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
