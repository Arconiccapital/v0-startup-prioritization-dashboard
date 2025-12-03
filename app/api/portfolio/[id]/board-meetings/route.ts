import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/portfolio/[id]/board-meetings - Get all board meetings for an investment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const upcoming = searchParams.get("upcoming") === "true"

    const where: Record<string, unknown> = { portfolioInvestmentId: id }
    if (upcoming) {
      where.date = { gte: new Date() }
    }

    const meetings = await prisma.boardMeeting.findMany({
      where,
      orderBy: { date: upcoming ? "asc" : "desc" },
    })

    return NextResponse.json({ meetings })
  } catch (error) {
    console.error("[API] Error fetching board meetings:", error)
    return NextResponse.json({ error: "Failed to fetch board meetings" }, { status: 500 })
  }
}

// POST /api/portfolio/[id]/board-meetings - Create a new board meeting
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const {
      date,
      type = "regular",
      location,
      agenda,
      notes,
      keyDecisions,
      actionItems,
      attendees,
      documents,
    } = body

    if (!date) {
      return NextResponse.json({ error: "date is required" }, { status: 400 })
    }

    // Verify investment exists
    const investment = await prisma.portfolioInvestment.findUnique({
      where: { id },
    })

    if (!investment) {
      return NextResponse.json({ error: "Investment not found" }, { status: 404 })
    }

    const meeting = await prisma.boardMeeting.create({
      data: {
        portfolioInvestmentId: id,
        date: new Date(date),
        type,
        location,
        agenda,
        notes,
        keyDecisions,
        actionItems,
        attendees,
        documents,
      },
    })

    return NextResponse.json({ meeting }, { status: 201 })
  } catch (error) {
    console.error("[API] Error creating board meeting:", error)
    return NextResponse.json({ error: "Failed to create board meeting" }, { status: 500 })
  }
}

// PUT /api/portfolio/[id]/board-meetings - Update a board meeting (pass meetingId in query)
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const meetingId = searchParams.get("meetingId")
    const body = await request.json()

    if (!meetingId) {
      return NextResponse.json({ error: "meetingId is required" }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    const allowedFields = [
      "date",
      "type",
      "location",
      "agenda",
      "notes",
      "keyDecisions",
      "actionItems",
      "attendees",
      "documents",
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

    const meeting = await prisma.boardMeeting.update({
      where: { id: meetingId },
      data: updateData,
    })

    return NextResponse.json({ meeting })
  } catch (error) {
    console.error("[API] Error updating board meeting:", error)
    return NextResponse.json({ error: "Failed to update board meeting" }, { status: 500 })
  }
}

// DELETE /api/portfolio/[id]/board-meetings - Delete a board meeting (pass meetingId in query)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const meetingId = searchParams.get("meetingId")

    if (!meetingId) {
      return NextResponse.json({ error: "meetingId is required" }, { status: 400 })
    }

    await prisma.boardMeeting.delete({
      where: { id: meetingId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Error deleting board meeting:", error)
    return NextResponse.json({ error: "Failed to delete board meeting" }, { status: 500 })
  }
}
