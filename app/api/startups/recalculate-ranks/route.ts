import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST /api/startups/recalculate-ranks - Recalculate all ranks using optimized SQL
export async function POST() {
  try {
    console.log("[API] Starting optimized rank recalculation...")
    const startTime = Date.now()

    // Use raw SQL for much faster bulk update (single query instead of 12K updates)
    // This creates a CTE (Common Table Expression) that assigns row numbers based on score
    await prisma.$executeRaw`
      UPDATE "Startup"
      SET rank = ranked.new_rank
      FROM (
        SELECT
          id,
          ROW_NUMBER() OVER (ORDER BY score DESC, name ASC) as new_rank
        FROM "Startup"
      ) AS ranked
      WHERE "Startup".id = ranked.id
    `

    // Get total count for response
    const totalCount = await prisma.startup.count()

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`[API] ✓ Recalculated ranks for ${totalCount} startups in ${duration}s using optimized SQL`)

    return NextResponse.json({
      success: true,
      message: `Successfully recalculated ranks for ${totalCount} startups in ${duration}s`,
      count: totalCount,
      durationSeconds: parseFloat(duration),
    })
  } catch (error) {
    console.error("[API] Error recalculating ranks:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to recalculate ranks",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
