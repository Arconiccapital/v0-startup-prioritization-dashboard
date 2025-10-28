import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST /api/startups/recalculate-ranks - Recalculate all ranks
export async function POST() {
  try {
    // Get all startups sorted by score (descending)
    const allStartups = await prisma.startup.findMany({
      orderBy: [
        { score: "desc" }, // Primary sort by overall score
        { name: "asc" }, // Tie-breaker
      ],
    })

    // Update ranks
    for (let i = 0; i < allStartups.length; i++) {
      await prisma.startup.update({
        where: { id: allStartups[i].id },
        data: { rank: i + 1 },
      })
    }

    console.log(`[API] Recalculated ranks for ${allStartups.length} startups`)

    return NextResponse.json({
      message: `Successfully recalculated ranks for ${allStartups.length} startups`,
      count: allStartups.length,
    })
  } catch (error) {
    console.error("[API] Error recalculating ranks:", error)
    return NextResponse.json({ error: "Failed to recalculate ranks" }, { status: 500 })
  }
}
