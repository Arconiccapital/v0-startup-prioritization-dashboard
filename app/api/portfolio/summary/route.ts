import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/portfolio/summary - Get portfolio-wide summary metrics
export async function GET() {
  try {
    // Fetch all portfolio investments with their startups and follow-ons
    const investments = await prisma.portfolioInvestment.findMany({
      include: {
        startup: {
          select: {
            sector: true,
          },
        },
        followOnInvestments: true,
      },
    })

    // Calculate summary metrics
    let totalInvested = 0
    let totalCurrentValue = 0
    let totalRealized = 0

    const byStatus = {
      active: 0,
      exited: 0,
      written_off: 0,
    }

    const bySector: Record<string, { count: number; invested: number; currentValue: number }> = {}
    const byYear: Record<string, { count: number; invested: number }> = {}

    for (const inv of investments) {
      // Calculate total invested for this investment (including follow-ons)
      const followOnTotal = inv.followOnInvestments.reduce((sum, fo) => sum + fo.amount, 0)
      const invested = inv.investmentAmount + followOnTotal
      totalInvested += invested

      // Track by status
      const status = inv.status as "active" | "exited" | "written_off"
      byStatus[status]++

      // Calculate current value or realized value
      if (inv.status === "exited" && inv.exitAmount) {
        totalRealized += inv.exitAmount
      } else if (inv.status === "active" && inv.currentValuation && inv.currentEquityPct) {
        const currentValue = (inv.currentValuation * inv.currentEquityPct) / 100
        totalCurrentValue += currentValue
      }
      // written_off contributes 0 to current value

      // Track by sector
      const sector = inv.startup?.sector || "Unknown"
      if (!bySector[sector]) {
        bySector[sector] = { count: 0, invested: 0, currentValue: 0 }
      }
      bySector[sector].count++
      bySector[sector].invested += invested
      if (inv.status === "active" && inv.currentValuation && inv.currentEquityPct) {
        bySector[sector].currentValue += (inv.currentValuation * inv.currentEquityPct) / 100
      } else if (inv.status === "exited" && inv.exitAmount) {
        bySector[sector].currentValue += inv.exitAmount
      }

      // Track by investment year
      const year = new Date(inv.investmentDate).getFullYear().toString()
      if (!byYear[year]) {
        byYear[year] = { count: 0, invested: 0 }
      }
      byYear[year].count++
      byYear[year].invested += invested
    }

    // Calculate gains and MOIC
    const unrealizedGain = totalCurrentValue - (totalInvested - totalRealized)
    const realizedGain = totalRealized - investments
      .filter(i => i.status === "exited")
      .reduce((sum, i) => {
        const followOnTotal = i.followOnInvestments.reduce((s, fo) => s + fo.amount, 0)
        return sum + i.investmentAmount + followOnTotal
      }, 0)

    const totalMOIC = totalInvested > 0
      ? (totalCurrentValue + totalRealized) / totalInvested
      : 0

    const summary = {
      totalInvested,
      totalCurrentValue,
      totalRealized,
      unrealizedGain,
      realizedGain,
      totalMOIC,

      activeInvestments: byStatus.active,
      exitedInvestments: byStatus.exited,
      writtenOff: byStatus.written_off,

      byStatus,
      bySector,
      byYear,

      // Additional useful metrics
      portfolioCount: investments.length,
      averageInvestmentSize: investments.length > 0 ? totalInvested / investments.length : 0,
    }

    return NextResponse.json({ summary })
  } catch (error) {
    console.error("[API] Error fetching portfolio summary:", error)
    return NextResponse.json({ error: "Failed to fetch portfolio summary" }, { status: 500 })
  }
}
