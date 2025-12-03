"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  Mail,
  User,
  GraduationCap,
  Briefcase,
  MapPin,
  Globe,
  Linkedin,
  Copy,
  Check,
  Loader2,
} from "lucide-react"
import type { Founder } from "@/lib/types"
import { parseFoundersFromStartup } from "@/lib/founder-parser"

export default function FounderProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)

  const [founder, setFounder] = useState<Founder | null>(null)
  const [startup, setStartup] = useState<Record<string, unknown> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Outreach message state
  const [outreachMessage, setOutreachMessage] = useState<string>("")
  const [isGeneratingOutreach, setIsGeneratingOutreach] = useState(false)
  const [copiedOutreach, setCopiedOutreach] = useState(false)

  useEffect(() => {
    async function loadFounder() {
      try {
        // Parse founder ID: format is "${startupId}-founder-${index}"
        const match = id.match(/^(.+)-founder-(\d+)$/)
        if (!match) {
          setError("Invalid founder ID format")
          setIsLoading(false)
          return
        }

        const [, startupId, indexStr] = match
        const founderIndex = parseInt(indexStr, 10)

        // Fetch the startup
        const response = await fetch(`/api/startups/${startupId}`)
        if (!response.ok) {
          setError("Failed to load founder data")
          setIsLoading(false)
          return
        }

        const startupData = await response.json()

        // Store startup for outreach generation
        setStartup(startupData)

        // Parse founders from the startup
        const founders = parseFoundersFromStartup({
          id: startupData.id,
          name: startupData.name,
          sector: startupData.sector,
          country: startupData.country,
          description: startupData.description,
          rank: startupData.rank,
          pipelineStage: startupData.pipelineStage,
          companyInfo: startupData.companyInfo,
          teamInfo: startupData.teamInfo,
        })

        if (founderIndex >= 0 && founderIndex < founders.length) {
          setFounder(founders[founderIndex])
        } else {
          setError("Founder not found")
        }
      } catch (err) {
        console.error("[Founder] Error loading founder:", err)
        setError("Failed to load founder")
      } finally {
        setIsLoading(false)
      }
    }

    loadFounder()
  }, [id])

  const handleGenerateOutreach = async () => {
    if (!founder || !startup) return

    setIsGeneratingOutreach(true)
    try {
      const response = await fetch("/api/generate-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startup: startup,
          tone: "friendly",
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // The API returns { messages: { email, linkedin, twitter }, generatedAt }
        const messages = data.messages
        if (messages?.email) {
          setOutreachMessage(messages.email)
        } else if (messages?.linkedin) {
          setOutreachMessage(messages.linkedin)
        } else {
          setOutreachMessage("Failed to generate message")
        }
      } else {
        const errorData = await response.json()
        console.error("Failed to generate outreach:", errorData.error)
      }
    } catch (err) {
      console.error("[Outreach] Error:", err)
    } finally {
      setIsGeneratingOutreach(false)
    }
  }

  const handleCopyOutreach = async () => {
    if (!outreachMessage) return
    await navigator.clipboard.writeText(outreachMessage)
    setCopiedOutreach(true)
    setTimeout(() => setCopiedOutreach(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading founder profile...</p>
        </div>
      </div>
    )
  }

  if (error || !founder) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Founder Not Found</h1>
          <p className="text-muted-foreground mb-4">{error || "The requested founder could not be found."}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-2xl font-semibold flex items-center gap-2">
                  <User className="w-6 h-6" />
                  {founder.name}
                </h1>
                <p className="text-sm text-muted-foreground">{founder.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {founder.linkedIn && (
                <Button variant="outline" size="sm" asChild>
                  <a href={founder.linkedIn} target="_blank" rel="noopener noreferrer">
                    <Linkedin className="w-4 h-4 mr-2" />
                    LinkedIn
                  </a>
                </Button>
              )}
              <Button variant="default" size="sm" onClick={handleGenerateOutreach} disabled={isGeneratingOutreach}>
                {isGeneratingOutreach ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4 mr-2" />
                )}
                Generate Outreach
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Founder Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{founder.name}</CardTitle>
                    <CardDescription>{founder.role}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {founder.linkedIn && (
                  <a
                    href={founder.linkedIn}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                  >
                    <Linkedin className="w-4 h-4" />
                    View LinkedIn Profile
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Company Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Company
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link
                  href={`/company/${founder.companyId}`}
                  className="block hover:bg-muted p-3 rounded-lg -m-3 transition-colors"
                >
                  <div className="font-medium text-blue-600 hover:underline flex items-center gap-1">
                    {founder.companyName}
                    <ExternalLink className="w-3 h-3" />
                  </div>
                  {founder.companyRank && (
                    <div className="text-sm text-muted-foreground mt-1">
                      Rank #{founder.companyRank}
                      {founder.companyRank === 1 && " 🏆"}
                      {founder.companyRank === 2 && " 🥈"}
                      {founder.companyRank === 3 && " 🥉"}
                    </div>
                  )}
                </Link>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="shrink-0">
                      {founder.companySector.length > 30
                        ? founder.companySector.slice(0, 30) + "..."
                        : founder.companySector}
                    </Badge>
                  </div>

                  {founder.companyCountry && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {founder.companyCountry}
                    </div>
                  )}

                  {founder.companyWebsite && (
                    <a
                      href={
                        founder.companyWebsite.startsWith("http")
                          ? founder.companyWebsite
                          : `https://${founder.companyWebsite}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:underline"
                    >
                      <Globe className="w-4 h-4" />
                      {founder.companyWebsite}
                    </a>
                  )}

                  <Badge variant="secondary" className="mt-2">
                    {founder.pipelineStage}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Background & Outreach */}
          <div className="lg:col-span-2 space-y-6">
            {/* Background Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Background</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Education */}
                <div>
                  <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
                    <GraduationCap className="w-4 h-4" />
                    Education
                  </h3>
                  {founder.education ? (
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">{founder.education}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No education information available</p>
                  )}
                </div>

                {/* Experience */}
                <div>
                  <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
                    <Briefcase className="w-4 h-4" />
                    Prior Experience
                  </h3>
                  {founder.priorExperience ? (
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">{founder.priorExperience}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No experience information available</p>
                  )}
                </div>

                {/* Company Description */}
                {founder.companyDescription && (
                  <div>
                    <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
                      <Building2 className="w-4 h-4" />
                      About {founder.companyName}
                    </h3>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg line-clamp-6">
                      {founder.companyDescription}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Outreach Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Outreach Message
                </CardTitle>
                <CardDescription>Generate a personalized outreach message for this founder</CardDescription>
              </CardHeader>
              <CardContent>
                {outreachMessage ? (
                  <div className="space-y-3">
                    <div className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap">{outreachMessage}</div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleCopyOutreach}>
                        {copiedOutreach ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy to Clipboard
                          </>
                        )}
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleGenerateOutreach} disabled={isGeneratingOutreach}>
                        {isGeneratingOutreach ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Mail className="w-4 h-4 mr-2" />
                        )}
                        Regenerate
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">
                      Generate a personalized outreach message to connect with {founder.name}
                    </p>
                    <Button onClick={handleGenerateOutreach} disabled={isGeneratingOutreach}>
                      {isGeneratingOutreach ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          Generate Outreach Message
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
