"use client"

import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Loader2 } from "lucide-react"
import { getStartupById } from "@/lib/startup-storage"
import { useState, useEffect } from "react"
import { generateMemoSections } from "@/lib/investment-memo-generator"
import type { Startup } from "@/lib/types"

interface MemoSection {
  id: string
  title: string
  content: string
  isGenerating: boolean
  error?: string
}

export default function InvestmentMemoPage() {
  const params = useParams()
  const router = useRouter()
  const companyId = params.id as string

  const [startup, setStartup] = useState<Startup | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  // Fetch startup data on mount
  useEffect(() => {
    async function loadStartup() {
      const data = await getStartupById(companyId)
      setStartup(data)
      setLoading(false)
    }
    loadStartup()
  }, [companyId])

  const [sections, setSections] = useState<MemoSection[]>([
    { id: "executive", title: "Executive Summary", content: "", isGenerating: true },
    { id: "thesis", title: "Investment Thesis", content: "", isGenerating: true },
    { id: "market", title: "Market Analysis", content: "", isGenerating: true },
    { id: "product", title: "Product & Technology Assessment", content: "", isGenerating: true },
    { id: "business", title: "Business Model & Economics", content: "", isGenerating: true },
    { id: "gtm", title: "Go-to-Market Strategy", content: "", isGenerating: true },
    { id: "team", title: "Team Assessment", content: "", isGenerating: true },
    { id: "competitive", title: "Competitive Landscape", content: "", isGenerating: true },
    { id: "risk", title: "Risk Analysis", content: "", isGenerating: true },
    { id: "recommendation", title: "Investment Recommendation", content: "", isGenerating: true },
  ])

  const [isGenerating, setIsGenerating] = useState(true)
  const [generalError, setGeneralError] = useState<string | null>(null)

  useEffect(() => {
    if (!startup || loading) return

    const generateAIMemo = async () => {
      setIsGenerating(true)
      setGeneralError(null)

      try {
        console.log("[v0] Starting AI memo generation for:", startup.name)
        const aiSections = await generateMemoSections(startup)

        // Update sections with AI-generated content
        setSections((prev) =>
          prev.map((section) => {
            const aiContent = aiSections[section.id]
            if (aiContent) {
              return { ...section, content: aiContent, isGenerating: false }
            } else {
              return {
                ...section,
                content: "Content generation failed. Please try again.",
                isGenerating: false,
                error: "Generation failed",
              }
            }
          }),
        )
        console.log("[v0] AI memo generation completed")
      } catch (err) {
        console.error("[v0] Error generating AI memo:", err)
        const errorMessage = err instanceof Error ? err.message : "Unknown error"

        // Check if it's a rate limit error
        if (errorMessage.includes("rate_limit") || errorMessage.includes("429")) {
          setGeneralError(
            "AI generation rate limit reached. The free tier has temporary restrictions. Please try again later or upgrade to continue using AI features.",
          )
        } else {
          setGeneralError("Failed to generate AI content. Please try again later.")
        }

        // Mark all sections as failed
        setSections((prev) =>
          prev.map((section) => ({
            ...section,
            content: "Content generation failed due to rate limits.",
            isGenerating: false,
            error: "Rate limit exceeded",
          })),
        )
      } finally {
        setIsGenerating(false)
      }
    }

    generateAIMemo()
  }, [startup, loading])

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mt-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading company data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!startup) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="mt-8 text-center">
            <p className="text-muted-foreground">Company not found</p>
          </div>
        </div>
      </div>
    )
  }

  const handleDownloadPDF = () => {
    window.print()
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          .print-content {
            max-width: 100% !important;
            padding: 0 !important;
          }
        }
      `}</style>

      <div
        className="min-h-screen bg-background"
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
        }}
      >
        {/* Header */}
        <div className="border-b bg-card sticky top-0 z-10 no-print">
          <div className="max-w-4xl mx-auto px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                {isGenerating && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating AI analysis...</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleDownloadPDF} variant="default" size="sm" disabled={isGenerating}>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Document Content */}
        <div className="max-w-4xl mx-auto px-8 py-12 print-content">
          {generalError && (
            <div className="mb-6 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 no-print">
              <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-2">Generation Error</p>
              <p className="text-sm text-red-700 dark:text-red-300">{generalError}</p>
            </div>
          )}

          <div className="space-y-12">
            {/* Document Header */}
            <div className="border-b pb-8 space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Investment Memorandum
                </p>
                <h1 className="text-4xl font-bold tracking-tight">{startup.name}</h1>
              </div>
              <div className="flex gap-6 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">Date:</span> {new Date().toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Stage:</span> {startup.pipelineStage}
                </div>
                <div>
                  <span className="font-medium">Sector:</span> {startup.sector}
                </div>
              </div>
              <div className="flex gap-4 pt-2">
                <div className="px-3 py-1 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                    LLM Score: {startup.aiScores?.llm || startup.score}/10
                  </span>
                </div>
                <div className="px-3 py-1 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
                  <span className="text-xs font-medium text-green-700 dark:text-green-300">
                    ML Score: {startup.aiScores?.ml || startup.score}/10
                  </span>
                </div>
              </div>
            </div>

            {/* Memo Sections */}
            {sections.map((section) => (
              <div key={section.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold tracking-tight border-b pb-2 flex-1">{section.title}</h2>
                  {section.isGenerating && (
                    <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full flex items-center gap-1 no-print">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Generating...
                    </span>
                  )}
                  {section.error && (
                    <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-full no-print">
                      Failed
                    </span>
                  )}
                </div>
                <div className="max-w-none leading-relaxed">
                  {section.isGenerating ? (
                    <div className="flex items-center gap-3 text-muted-foreground py-8">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm">Generating AI analysis for this section...</span>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-[15px] leading-7 text-foreground">
                      {section.content || "No content available."}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
