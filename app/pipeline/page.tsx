"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { KanbanBoard } from "@/components/kanban-board"
import { StartupDetailDrawer } from "@/components/startup-detail-drawer"
import { InvestmentMemoDialog } from "@/components/investment-memo-dialog"
import Image from "next/image"
import type { Startup, StartupFeedback, PipelineStage } from "@/lib/types"
import { dummyStartups } from "@/lib/dummy-data"
import { generateComprehensiveInvestmentMemo } from "@/lib/memo-generator"
import Link from "next/link"

export default function PipelinePage() {
  const [startups, setStartups] = useState<Startup[]>(dummyStartups)
  const [selectedStartup, setSelectedStartup] = useState<Startup | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [memoDialogOpen, setMemoDialogOpen] = useState(false)
  const [currentMemo, setCurrentMemo] = useState<string>("")
  const [memoCompanyName, setMemoCompanyName] = useState<string>("")
  const router = useRouter()

  const handleSelectStartup = (startup: Startup) => {
    router.push(`/company/${startup.id}`)
  }

  const handleMoveStartup = (startupId: string, newStage: PipelineStage) => {
    setStartups((prev) =>
      prev.map((startup) => (startup.id === startupId ? { ...startup, pipelineStage: newStage } : startup)),
    )

    if (selectedStartup?.id === startupId) {
      setSelectedStartup((prev) => (prev ? { ...prev, pipelineStage: newStage } : null))
    }
  }

  const handleAddFeedback = (
    startupId: string,
    scores: {
      team: number
      market: number
      product: number
      businessModel: number
      traction: number
      investmentReadiness: number
    },
    notes: string,
  ) => {
    const newFeedback: StartupFeedback = {
      id: crypto.randomUUID(),
      startupId,
      scores,
      notes,
      createdAt: new Date(),
    }

    setStartups((prev) =>
      prev.map((startup) => {
        if (startup.id === startupId) {
          return {
            ...startup,
            feedback: [...(startup.feedback || []), newFeedback],
          }
        }
        return startup
      }),
    )

    if (selectedStartup?.id === startupId) {
      setSelectedStartup((prev) =>
        prev
          ? {
              ...prev,
              feedback: [...(prev.feedback || []), newFeedback],
            }
          : null,
      )
    }
  }

  const handleUploadDocument = (startupId: string, docType: "transcript" | "pitchDeck", content: string) => {
    setStartups((prev) =>
      prev.map((startup) => {
        if (startup.id === startupId) {
          return {
            ...startup,
            documents: {
              ...startup.documents,
              [docType]: content,
            },
          }
        }
        return startup
      }),
    )

    if (selectedStartup?.id === startupId) {
      setSelectedStartup((prev) =>
        prev
          ? {
              ...prev,
              documents: {
                ...prev.documents,
                [docType]: content,
              },
            }
          : null,
      )
    }
  }

  const handleGenerateMemo = (startupId: string) => {
    const startup = startups.find((s) => s.id === startupId)
    if (!startup) return

    const memo = generateComprehensiveInvestmentMemo(startup)

    setStartups((prev) => prev.map((s) => (s.id === startupId ? { ...s, investmentMemo: memo } : s)))

    if (selectedStartup?.id === startupId) {
      setSelectedStartup((prev) => (prev ? { ...prev, investmentMemo: memo } : null))
    }

    // Show the memo in a dialog
    setCurrentMemo(memo)
    setMemoCompanyName(startup.name)
    setMemoDialogOpen(true)
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
              <Link href="/">
                <Button variant="outline">Dashboard View</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <KanbanBoard startups={startups} onSelectStartup={handleSelectStartup} onMoveStartup={handleMoveStartup} />
      </main>

      <StartupDetailDrawer
        startup={selectedStartup}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onAddFeedback={handleAddFeedback}
        onUploadDocument={handleUploadDocument}
        onGenerateMemo={handleGenerateMemo}
      />

      <InvestmentMemoDialog
        open={memoDialogOpen}
        onOpenChange={setMemoDialogOpen}
        companyName={memoCompanyName}
        memoContent={currentMemo}
      />
    </div>
  )
}
