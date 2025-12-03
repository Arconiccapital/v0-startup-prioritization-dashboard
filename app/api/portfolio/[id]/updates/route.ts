import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/portfolio/[id]/updates - Get all updates for an investment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const updates = await prisma.portfolioUpdate.findMany({
      where: { portfolioInvestmentId: id },
      orderBy: { date: "desc" },
    })

    return NextResponse.json({ updates })
  } catch (error) {
    console.error("[API] Error fetching updates:", error)
    return NextResponse.json({ error: "Failed to fetch updates" }, { status: 500 })
  }
}

// POST /api/portfolio/[id]/updates - Create a new update
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const {
      date,
      period,
      metrics,
      highlights,
      challenges,
      askFromInvestors,
      nextMilestones,
      overallHealth,
      needsAttention = false,
      attachments,
    } = body

    if (!date || !period) {
      return NextResponse.json({ error: "date and period are required" }, { status: 400 })
    }

    // Verify investment exists
    const investment = await prisma.portfolioInvestment.findUnique({
      where: { id },
    })

    if (!investment) {
      return NextResponse.json({ error: "Investment not found" }, { status: 404 })
    }

    const update = await prisma.portfolioUpdate.create({
      data: {
        portfolioInvestmentId: id,
        date: new Date(date),
        period,
        metrics,
        highlights,
        challenges,
        askFromInvestors,
        nextMilestones,
        overallHealth,
        needsAttention,
        attachments,
      },
    })

    return NextResponse.json({ update }, { status: 201 })
  } catch (error) {
    console.error("[API] Error creating update:", error)
    return NextResponse.json({ error: "Failed to create update" }, { status: 500 })
  }
}

// PUT /api/portfolio/[id]/updates - Update an existing update (pass updateId in query)
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const updateId = searchParams.get("updateId")
    const body = await request.json()

    if (!updateId) {
      return NextResponse.json({ error: "updateId is required" }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    const allowedFields = [
      "date",
      "period",
      "metrics",
      "highlights",
      "challenges",
      "askFromInvestors",
      "nextMilestones",
      "overallHealth",
      "needsAttention",
      "attachments",
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === "date") {
          updateData[field] = new Date(body[field])
        } else {
          updateData[field] = body[field]
        }
      }
    }

    const update = await prisma.portfolioUpdate.update({
      where: { id: updateId },
      data: updateData,
    })

    return NextResponse.json({ update })
  } catch (error) {
    console.error("[API] Error updating update:", error)
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}

// DELETE /api/portfolio/[id]/updates - Delete an update (pass updateId in query)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const updateId = searchParams.get("updateId")

    if (!updateId) {
      return NextResponse.json({ error: "updateId is required" }, { status: 400 })
    }

    await prisma.portfolioUpdate.delete({
      where: { id: updateId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Error deleting update:", error)
    return NextResponse.json({ error: "Failed to delete update" }, { status: 500 })
  }
}
