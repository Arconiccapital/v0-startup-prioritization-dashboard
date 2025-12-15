import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/startups/[id] - Get single startup
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const startup = await prisma.startup.findUnique({
      where: { id },
      include: {
        thresholdIssues: true,
      },
    })

    if (!startup) {
      return NextResponse.json({ error: "Startup not found" }, { status: 404 })
    }

    return NextResponse.json(startup)
  } catch (error) {
    console.error("[API] Error fetching startup:", error)
    return NextResponse.json({ error: "Failed to fetch startup" }, { status: 500 })
  }
}

// PUT /api/startups/[id] - Update startup (full replacement)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const startup = await prisma.startup.update({
      where: { id },
      data: body,
      include: {
        thresholdIssues: true,
      },
    })

    return NextResponse.json(startup)
  } catch (error) {
    console.error("[API] Error updating startup:", error)
    return NextResponse.json({ error: "Failed to update startup" }, { status: 500 })
  }
}

// PATCH /api/startups/[id] - Partial update startup
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    // Only update fields that are provided
    const updateData: Record<string, unknown> = {}

    // List of allowed fields for partial update
    const allowedFields = [
      'name', 'description', 'sector', 'stage', 'country',
      'pipelineStage', 'score', 'aiScores', 'rationale',
      'companyInfo', 'marketInfo', 'productInfo', 'businessModelInfo',
      'salesInfo', 'teamInfo', 'competitiveInfo', 'riskInfo', 'opportunityInfo',
      'initialAssessment', 'investmentScorecard', 'investmentMemo', 'investmentDecision',
      'valuationData', 'legalDiligence',
      'documents', 'customData', 'customSchema'
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    const startup = await prisma.startup.update({
      where: { id },
      data: updateData,
      include: {
        thresholdIssues: true,
      },
    })

    return NextResponse.json(startup)
  } catch (error) {
    console.error("[API] Error patching startup:", error)
    return NextResponse.json({ error: "Failed to update startup" }, { status: 500 })
  }
}

// DELETE /api/startups/[id] - Delete startup
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id} = await params

    await prisma.startup.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Startup deleted successfully" })
  } catch (error) {
    console.error("[API] Error deleting startup:", error)
    return NextResponse.json({ error: "Failed to delete startup" }, { status: 500 })
  }
}
