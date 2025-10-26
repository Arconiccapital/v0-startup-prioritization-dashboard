"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { KanbanBoard } from "@/components/kanban-board"
import { StageDetailView } from "@/components/stage-detail-view"
import { CsvUpload } from "@/components/csv-upload"
import type { Startup, PipelineStage } from "@/lib/types"
import Image from "next/image"
import { getAllStartups, addUploadedStartups } from "@/lib/startup-storage"

export default function Home() {
  const [startups, setStartups] = useState<Startup[]>([])
  const [showUpload, setShowUpload] = useState(false)
  const [viewingStage, setViewingStage] = useState<PipelineStage | null>(null)
  const router = useRouter()

  useEffect(() => {
    setStartups(getAllStartups())
  }, [])

  const handleUploadComplete = (uploadedStartups: Startup[]) => {
    const startupsWithStage = uploadedStartups.map((s) => ({
      ...s,
      pipelineStage: "Deal Flow" as PipelineStage,
    }))

    addUploadedStartups(startupsWithStage)

    setStartups((prev) => {
      const updated = [...prev]
      startupsWithStage.forEach((newStartup) => {
        const existingIndex = updated.findIndex(
          (s) => s.name.toLowerCase().trim() === newStartup.name.toLowerCase().trim(),
        )
        if (existingIndex >= 0) {
          updated[existingIndex] = {
            ...newStartup,
            id: updated[existingIndex].id,
            pipelineStage: updated[existingIndex].pipelineStage,
          }
          console.log(`[v0] Updated existing company: ${newStartup.name}`)
        } else {
          updated.push(newStartup)
          console.log(`[v0] Added new company: ${newStartup.name}`)
        }
      })
      return updated
    })
    setShowUpload(false)
  }

  const handleSelectStartup = (startup: Startup) => {
    router.push(`/company/${startup.id}`)
  }

  const handleMoveStartup = (startupId: string, newStage: PipelineStage) => {
    setStartups((prev) =>
      prev.map((startup) => (startup.id === startupId ? { ...startup, pipelineStage: newStage } : startup)),
    )
  }

  const handleViewStage = (stage: PipelineStage) => {
    setViewingStage(stage)
  }

  const handleBackToPipeline = () => {
    setViewingStage(null)
  }

  if (showUpload) {
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
            <Button variant="ghost" onClick={() => setShowUpload(false)}>
              Back to Pipeline
            </Button>
          </div>
          <CsvUpload onUploadComplete={handleUploadComplete} />
        </div>
      </div>
    )
  }

  if (viewingStage) {
    return (
      <StageDetailView
        stage={viewingStage}
        startups={startups}
        onBack={handleBackToPipeline}
        onSelectStartup={handleSelectStartup}
        onMoveStartup={handleMoveStartup}
      />
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="border-b border-border bg-card shrink-0">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-end gap-4 mb-2">
                <Image src="/arconic-logo.png" alt="Arconic" width={140} height={35} className="h-9 w-auto" />
                <h1 className="text-3xl font-semibold text-foreground">Lighthouse AI</h1>
              </div>
              <p className="text-sm text-muted-foreground mt-1">AI led workflow to prioritise startup research</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowUpload(true)}>
                Upload CSV
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <KanbanBoard
          startups={startups}
          onSelectStartup={handleSelectStartup}
          onMoveStartup={handleMoveStartup}
          onViewStage={handleViewStage}
        />
      </main>
    </div>
  )
}
