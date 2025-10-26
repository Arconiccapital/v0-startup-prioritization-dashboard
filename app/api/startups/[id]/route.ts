import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/startups/[id] - Get single startup
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const startup = await prisma.startup.findUnique({
      where: { id },
      include: {
        thresholdIssues: true,
      },
    })

    if (!startup) {
      return NextResponse.json({ error: "Startup not found" }, { status: 404 })
    }

    return NextResponse.json(startup)
  } catch (error) {
    console.error("[API] Error fetching startup:", error)
    return NextResponse.json({ error: "Failed to fetch startup" }, { status: 500 })
  }
}

// PUT /api/startups/[id] - Update startup
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const startup = await prisma.startup.update({
      where: { id },
      data: body,
      include: {
        thresholdIssues: true,
      },
    })

    return NextResponse.json(startup)
  } catch (error) {
    console.error("[API] Error updating startup:", error)
    return NextResponse.json({ error: "Failed to update startup" }, { status: 500 })
  }
}

// DELETE /api/startups/[id] - Delete startup
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id} = await params

    await prisma.startup.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Startup deleted successfully" })
  } catch (error) {
    console.error("[API] Error deleting startup:", error)
    return NextResponse.json({ error: "Failed to delete startup" }, { status: 500 })
  }
}
