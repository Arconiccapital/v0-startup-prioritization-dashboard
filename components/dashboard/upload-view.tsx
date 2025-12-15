"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { CsvUpload } from "@/components/csv-upload"
import type { Startup } from "@/lib/types"

interface UploadProgress {
  current: number
  total: number
  status?: string
}

interface UploadViewProps {
  uploadProgress: UploadProgress | null
  onUploadComplete: (startups: Startup[]) => void
  onBack: () => void
}

export function UploadView({ uploadProgress, onUploadComplete, onBack }: UploadViewProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Image src="/arconic-logo.png" alt="Arconic" width={120} height={30} className="h-7 w-auto" />
            </div>
            <h2 className="text-2xl font-semibold">Upload Your Data</h2>
            <p className="text-sm text-muted-foreground mt-1">Import a CSV file with your startup data</p>
          </div>
          <Button variant="ghost" onClick={onBack} disabled={!!uploadProgress}>
            Back to Pipeline
          </Button>
        </div>

        {uploadProgress && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {uploadProgress.status || "Uploading Companies..."}
                </span>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {uploadProgress.current} / {uploadProgress.total}
                </span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-2.5">
                <div
                  className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                />
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {uploadProgress.status === "Recalculating ranks..." ? (
                  "Finalizing... Please don't close this page"
                ) : (
                  <>
                    Batch {Math.floor(uploadProgress.current / 100) + 1} of {Math.ceil(uploadProgress.total / 100)} •
                    Please don&apos;t close this page
                  </>
                )}
              </p>
            </div>
          </div>
        )}

        <CsvUpload onUploadComplete={onUploadComplete} />
      </div>
    </div>
  )
}
