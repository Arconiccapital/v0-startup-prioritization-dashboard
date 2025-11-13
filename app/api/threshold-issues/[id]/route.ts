import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// PUT /api/threshold-issues/[id] - Update a threshold issue
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { category, issue, riskRating, mitigation, status } = body

    if (!category || !issue || !riskRating || !mitigation) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const thresholdIssue = await prisma.thresholdIssue.update({
      where: { id },
      data: {
        category,
        issue,
        riskRating,
        mitigation,
        status: status || "Open",
      },
    })

    return NextResponse.json(thresholdIssue)
  } catch (error) {
    console.error("[API] Error updating threshold issue:", error)
    return NextResponse.json({ error: "Failed to update threshold issue" }, { status: 500 })
  }
}

// DELETE /api/threshold-issues/[id] - Delete a threshold issue
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    await prisma.thresholdIssue.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Threshold issue deleted successfully" })
  } catch (error) {
    console.error("[API] Error deleting threshold issue:", error)
    return NextResponse.json({ error: "Failed to delete threshold issue" }, { status: 500 })
  }
}
