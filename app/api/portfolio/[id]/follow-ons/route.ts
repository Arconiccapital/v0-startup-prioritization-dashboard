import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/portfolio/[id]/follow-ons - Get all follow-on investments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const followOns = await prisma.followOnInvestment.findMany({
      where: { portfolioInvestmentId: id },
      orderBy: { date: "desc" },
    })

    return NextResponse.json({ followOns })
  } catch (error) {
    console.error("[API] Error fetching follow-on investments:", error)
    return NextResponse.json({ error: "Failed to fetch follow-on investments" }, { status: 500 })
  }
}

// POST /api/portfolio/[id]/follow-ons - Create a new follow-on investment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const {
      date,
      amount,
      round,
      preMoneyValuation,
      postMoneyValuation,
      leadInvestor = false,
      notes,
    } = body

    if (!date || !amount) {
      return NextResponse.json({ error: "date and amount are required" }, { status: 400 })
    }

    // Verify investment exists
    const investment = await prisma.portfolioInvestment.findUnique({
      where: { id },
    })

    if (!investment) {
      return NextResponse.json({ error: "Investment not found" }, { status: 404 })
    }

    const followOn = await prisma.followOnInvestment.create({
      data: {
        portfolioInvestmentId: id,
        date: new Date(date),
        amount,
        round,
        preMoneyValuation,
        postMoneyValuation,
        leadInvestor,
        notes,
      },
    })

    // Update the main investment's current valuation if provided
    if (postMoneyValuation) {
      // Calculate new equity percentage after dilution
      // This is a simplified calculation - real dilution is more complex
      const existingFollowOns = await prisma.followOnInvestment.findMany({
        where: { portfolioInvestmentId: id },
      })

      const totalFollowOnInvested = existingFollowOns.reduce((sum, fo) => sum + fo.amount, 0)
      const totalInvested = investment.investmentAmount + totalFollowOnInvested

      // Simplified ownership calculation
      const newEquityPct = (totalInvested / postMoneyValuation) * 100

      await prisma.portfolioInvestment.update({
        where: { id },
        data: {
          currentValuation: postMoneyValuation,
          currentEquityPct: newEquityPct,
          lastValuationDate: new Date(date),
        },
      })
    }

    return NextResponse.json({ followOn }, { status: 201 })
  } catch (error) {
    console.error("[API] Error creating follow-on investment:", error)
    return NextResponse.json({ error: "Failed to create follow-on investment" }, { status: 500 })
  }
}

// PUT /api/portfolio/[id]/follow-ons - Update a follow-on (pass followOnId in query)
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const followOnId = searchParams.get("followOnId")
    const body = await request.json()

    if (!followOnId) {
      return NextResponse.json({ error: "followOnId is required" }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    const allowedFields = [
      "date",
      "amount",
      "round",
      "preMoneyValuation",
      "postMoneyValuation",
      "leadInvestor",
      "notes",
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

    const followOn = await prisma.followOnInvestment.update({
      where: { id: followOnId },
      data: updateData,
    })

    return NextResponse.json({ followOn })
  } catch (error) {
    console.error("[API] Error updating follow-on investment:", error)
    return NextResponse.json({ error: "Failed to update follow-on investment" }, { status: 500 })
  }
}

// DELETE /api/portfolio/[id]/follow-ons - Delete a follow-on (pass followOnId in query)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const followOnId = searchParams.get("followOnId")

    if (!followOnId) {
      return NextResponse.json({ error: "followOnId is required" }, { status: 400 })
    }

    await prisma.followOnInvestment.delete({
      where: { id: followOnId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Error deleting follow-on investment:", error)
    return NextResponse.json({ error: "Failed to delete follow-on investment" }, { status: 500 })
  }
}
