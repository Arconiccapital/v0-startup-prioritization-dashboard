import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/startups - List all startups with pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const sector = searchParams.get("sector")
    const pipelineStage = searchParams.get("pipelineStage")
    const search = searchParams.get("search")

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (sector) {
      where.sector = sector
    }

    if (pipelineStage) {
      where.pipelineStage = pipelineStage
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    // Get total count for pagination
    const total = await prisma.startup.count({ where })

    // Get paginated results
    const startups = await prisma.startup.findMany({
      where,
      orderBy: { rank: "asc" },
      skip,
      take: limit,
      include: {
        thresholdIssues: true,
      },
    })

    return NextResponse.json({
      startups,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("[API] Error fetching startups:", error)
    return NextResponse.json({ error: "Failed to fetch startups" }, { status: 500 })
  }
}

// POST /api/startups - Create new startup(s)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Check if it's a bulk insert (array) or single insert
    if (Array.isArray(body)) {
      // Bulk insert - used for CSV upload
      const startups = await prisma.startup.createMany({
        data: body,
        skipDuplicates: true, // Skip if ID already exists
      })

      return NextResponse.json(
        {
          message: `Successfully created ${startups.count} startups`,
          count: startups.count,
        },
        { status: 201 },
      )
    }

    // Single insert
    const startup = await prisma.startup.create({
      data: body,
    })

    return NextResponse.json(startup, { status: 201 })
  } catch (error) {
    console.error("[API] Error creating startup(s):", error)
    return NextResponse.json({ error: "Failed to create startup(s)" }, { status: 500 })
  }
}
