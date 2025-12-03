import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/portfolio/[id]/milestones - Get all milestones for an investment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const milestones = await prisma.portfolioMilestone.findMany({
      where: { portfolioInvestmentId: id },
      orderBy: { date: "desc" },
    })

    return NextResponse.json({ milestones })
  } catch (error) {
    console.error("[API] Error fetching milestones:", error)
    return NextResponse.json({ error: "Failed to fetch milestones" }, { status: 500 })
  }
}

// POST /api/portfolio/[id]/milestones - Create a new milestone
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const { date, title, category, description, impact } = body

    if (!date || !title || !category) {
      return NextResponse.json(
        { error: "date, title, and category are required" },
        { status: 400 }
      )
    }

    // Verify investment exists
    const investment = await prisma.portfolioInvestment.findUnique({
      where: { id },
    })

    if (!investment) {
      return NextResponse.json({ error: "Investment not found" }, { status: 404 })
    }

    const milestone = await prisma.portfolioMilestone.create({
      data: {
        portfolioInvestmentId: id,
        date: new Date(date),
        title,
        category,
        description,
        impact,
      },
    })

    return NextResponse.json({ milestone }, { status: 201 })
  } catch (error) {
    console.error("[API] Error creating milestone:", error)
    return NextResponse.json({ error: "Failed to create milestone" }, { status: 500 })
  }
}

// DELETE /api/portfolio/[id]/milestones - Delete a milestone (pass milestoneId in query)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const milestoneId = searchParams.get("milestoneId")

    if (!milestoneId) {
      return NextResponse.json({ error: "milestoneId is required" }, { status: 400 })
    }

    await prisma.portfolioMilestone.delete({
      where: { id: milestoneId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Error deleting milestone:", error)
    return NextResponse.json({ error: "Failed to delete milestone" }, { status: 500 })
  }
}
