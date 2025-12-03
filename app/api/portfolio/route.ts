import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/portfolio - List all portfolio investments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") // "active" | "exited" | "written_off"
    const includeStartup = searchParams.get("includeStartup") === "true"

    const where: Record<string, unknown> = {}
    if (status) {
      where.status = status
    }

    const investments = await prisma.portfolioInvestment.findMany({
      where,
      include: {
        startup: includeStartup
          ? {
              select: {
                id: true,
                name: true,
                sector: true,
                country: true,
                description: true,
                companyInfo: true,
                aiScores: true,
              },
            }
          : false,
        followOnInvestments: true,
        _count: {
          select: {
            milestones: true,
            updates: true,
            boardMeetings: true,
            communications: true,
          },
        },
      },
      orderBy: {
        investmentDate: "desc",
      },
    })

    // Calculate total invested including follow-ons for each investment
    const investmentsWithTotals = investments.map((inv) => {
      const followOnTotal = inv.followOnInvestments.reduce((sum, fo) => sum + fo.amount, 0)
      const totalInvested = inv.investmentAmount + followOnTotal

      // Calculate current value based on ownership and current valuation
      const currentValue = inv.currentValuation && inv.currentEquityPct
        ? (inv.currentValuation * inv.currentEquityPct) / 100
        : null

      // Calculate MOIC
      const moic = currentValue ? currentValue / totalInvested : null

      return {
        ...inv,
        totalInvested,
        currentValue,
        moic,
        followOnCount: inv.followOnInvestments.length,
      }
    })

    return NextResponse.json({ investments: investmentsWithTotals })
  } catch (error) {
    console.error("[API] Error fetching portfolio:", error)
    return NextResponse.json({ error: "Failed to fetch portfolio" }, { status: 500 })
  }
}

// POST /api/portfolio - Create a new portfolio investment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      startupId,
      investmentDate,
      investmentAmount,
      investmentRound,
      investmentType = "equity",
      leadInvestor = false,
      boardSeat = false,
      boardObserver = false,
      preMoneyValuation,
      postMoneyValuation,
      equityPercentage,
      currentValuation,
      currentEquityPct,
      proRataRights = true,
      proRataAmount,
      investmentThesis,
      notes,
    } = body

    if (!startupId) {
      return NextResponse.json({ error: "startupId is required" }, { status: 400 })
    }

    if (!investmentDate) {
      return NextResponse.json({ error: "investmentDate is required" }, { status: 400 })
    }

    if (!investmentAmount || investmentAmount <= 0) {
      return NextResponse.json({ error: "Valid investmentAmount is required" }, { status: 400 })
    }

    // Check if startup exists
    const startup = await prisma.startup.findUnique({
      where: { id: startupId },
    })

    if (!startup) {
      return NextResponse.json({ error: "Startup not found" }, { status: 404 })
    }

    // Check if portfolio investment already exists for this startup
    const existing = await prisma.portfolioInvestment.findUnique({
      where: { startupId },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Portfolio investment already exists for this startup" },
        { status: 400 }
      )
    }

    // Create portfolio investment
    const investment = await prisma.portfolioInvestment.create({
      data: {
        startupId,
        investmentDate: new Date(investmentDate),
        investmentAmount,
        investmentRound,
        investmentType,
        leadInvestor,
        boardSeat,
        boardObserver,
        preMoneyValuation,
        postMoneyValuation,
        equityPercentage,
        currentValuation: currentValuation || postMoneyValuation,
        currentEquityPct: currentEquityPct || equityPercentage,
        lastValuationDate: new Date(investmentDate),
        proRataRights,
        proRataAmount,
        investmentThesis,
        notes,
        status: "active",
      },
      include: {
        startup: {
          select: {
            id: true,
            name: true,
            sector: true,
            country: true,
          },
        },
      },
    })

    // Update startup pipeline stage to "Closed"
    await prisma.startup.update({
      where: { id: startupId },
      data: { pipelineStage: "Closed" },
    })

    return NextResponse.json({ investment }, { status: 201 })
  } catch (error) {
    console.error("[API] Error creating portfolio investment:", error)
    return NextResponse.json({ error: "Failed to create portfolio investment" }, { status: 500 })
  }
}
