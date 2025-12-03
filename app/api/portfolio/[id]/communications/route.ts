import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/portfolio/[id]/communications - Get all communications for an investment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const followUpOnly = searchParams.get("followUpOnly") === "true"

    const where: Record<string, unknown> = { portfolioInvestmentId: id }
    if (type) {
      where.type = type
    }
    if (followUpOnly) {
      where.followUpRequired = true
    }

    const communications = await prisma.founderCommunication.findMany({
      where,
      orderBy: { date: "desc" },
    })

    return NextResponse.json({ communications })
  } catch (error) {
    console.error("[API] Error fetching communications:", error)
    return NextResponse.json({ error: "Failed to fetch communications" }, { status: 500 })
  }
}

// POST /api/portfolio/[id]/communications - Create a new communication log
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const {
      date,
      type,
      subject,
      summary,
      participants,
      followUpRequired = false,
      followUpDate,
      supportType,
      supportDetails,
    } = body

    if (!date || !type) {
      return NextResponse.json({ error: "date and type are required" }, { status: 400 })
    }

    // Verify investment exists
    const investment = await prisma.portfolioInvestment.findUnique({
      where: { id },
    })

    if (!investment) {
      return NextResponse.json({ error: "Investment not found" }, { status: 404 })
    }

    const communication = await prisma.founderCommunication.create({
      data: {
        portfolioInvestmentId: id,
        date: new Date(date),
        type,
        subject,
        summary,
        participants,
        followUpRequired,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        supportType,
        supportDetails,
      },
    })

    return NextResponse.json({ communication }, { status: 201 })
  } catch (error) {
    console.error("[API] Error creating communication:", error)
    return NextResponse.json({ error: "Failed to create communication" }, { status: 500 })
  }
}

// PUT /api/portfolio/[id]/communications - Update a communication (pass commId in query)
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const commId = searchParams.get("commId")
    const body = await request.json()

    if (!commId) {
      return NextResponse.json({ error: "commId is required" }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    const allowedFields = [
      "date",
      "type",
      "subject",
      "summary",
      "participants",
      "followUpRequired",
      "followUpDate",
      "supportType",
      "supportDetails",
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === "date" || field === "followUpDate") {
          updateData[field] = body[field] ? new Date(body[field]) : null
        } else {
          updateData[field] = body[field]
        }
      }
    }

    const communication = await prisma.founderCommunication.update({
      where: { id: commId },
      data: updateData,
    })

    return NextResponse.json({ communication })
  } catch (error) {
    console.error("[API] Error updating communication:", error)
    return NextResponse.json({ error: "Failed to update communication" }, { status: 500 })
  }
}

// DELETE /api/portfolio/[id]/communications - Delete a communication (pass commId in query)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const commId = searchParams.get("commId")

    if (!commId) {
      return NextResponse.json({ error: "commId is required" }, { status: 400 })
    }

    await prisma.founderCommunication.delete({
      where: { id: commId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Error deleting communication:", error)
    return NextResponse.json({ error: "Failed to delete communication" }, { status: 500 })
  }
}
