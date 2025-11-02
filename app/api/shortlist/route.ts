import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// GET /api/shortlist?startupId=xxx - Get who shortlisted a company
export async function GET(request: NextRequest) {
  try {
    const startupId = request.nextUrl.searchParams.get("startupId")

    if (!startupId) {
      return NextResponse.json({ error: "startupId is required" }, { status: 400 })
    }

    // Get all users who shortlisted this startup
    const shortlists = await prisma.userShortlist.findMany({
      where: { startupId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      count: shortlists.length,
      shortlistedBy: shortlists.map((s) => ({
        userId: s.user.id,
        userName: s.user.name || s.user.email,
        email: s.user.email,
        shortlistedAt: s.createdAt,
      })),
    })
  } catch (error) {
    console.error("[API] Error fetching shortlist:", error)
    return NextResponse.json({ error: "Failed to fetch shortlist" }, { status: 500 })
  }
}

// POST /api/shortlist - Toggle shortlist for current user
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { startupId, shortlisted } = await request.json()

    if (!startupId) {
      return NextResponse.json({ error: "startupId is required" }, { status: 400 })
    }

    if (shortlisted) {
      // Add to shortlist
      await prisma.userShortlist.upsert({
        where: {
          userId_startupId: {
            userId: session.user.id,
            startupId,
          },
        },
        create: {
          userId: session.user.id,
          startupId,
        },
        update: {}, // Already exists, do nothing
      })
    } else {
      // Remove from shortlist
      await prisma.userShortlist.deleteMany({
        where: {
          userId: session.user.id,
          startupId,
        },
      })
    }

    return NextResponse.json({ success: true, shortlisted })
  } catch (error) {
    console.error("[API] Error updating shortlist:", error)
    return NextResponse.json({ error: "Failed to update shortlist" }, { status: 500 })
  }
}
