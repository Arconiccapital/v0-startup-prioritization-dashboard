import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { normalizeFounderName } from "@/lib/founder-matcher"

// GET /api/founders/[id] - Get a single founder
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const founder = await prisma.founder.findUnique({
      where: { id },
      include: {
        companies: {
          include: {
            startup: {
              select: {
                id: true,
                name: true,
                sector: true,
                country: true,
                description: true,
                rank: true,
                pipelineStage: true,
                companyInfo: true,
              }
            }
          }
        }
      }
    })

    if (!founder) {
      return NextResponse.json({ error: "Founder not found" }, { status: 404 })
    }

    return NextResponse.json(founder)
  } catch (error) {
    console.error("[API] Error fetching founder:", error)
    return NextResponse.json({ error: "Failed to fetch founder" }, { status: 500 })
  }
}

// PUT /api/founders/[id] - Update a founder
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check founder exists
    const existing = await prisma.founder.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Founder not found" }, { status: 404 })
    }

    const {
      name,
      email,
      linkedIn,
      title,
      bio,
      location,
      education,
      experience,
      twitter,
      github,
      website,
      skills,
      tags,
      notes,
      pipelineStage
    } = body

    // Validate name if provided
    if (name !== undefined && (!name || typeof name !== 'string' || !name.trim())) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 })
    }

    // Check for duplicate email (if changing)
    if (email && email !== existing.email) {
      const emailExists = await prisma.founder.findFirst({
        where: {
          email: { equals: email.toLowerCase(), mode: 'insensitive' },
          id: { not: id }
        }
      })
      if (emailExists) {
        return NextResponse.json(
          { error: "A founder with this email already exists" },
          { status: 409 }
        )
      }
    }

    // Check for duplicate LinkedIn (if changing)
    if (linkedIn && linkedIn !== existing.linkedIn) {
      const linkedInExists = await prisma.founder.findFirst({
        where: {
          linkedIn: { contains: linkedIn.toLowerCase(), mode: 'insensitive' },
          id: { not: id }
        }
      })
      if (linkedInExists) {
        return NextResponse.json(
          { error: "A founder with this LinkedIn profile already exists" },
          { status: 409 }
        )
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {}

    if (name !== undefined) {
      updateData.name = name.trim()
      updateData.normalizedName = normalizeFounderName(name)
    }
    if (email !== undefined) updateData.email = email || null
    if (linkedIn !== undefined) updateData.linkedIn = linkedIn || null
    if (title !== undefined) updateData.title = title || null
    if (bio !== undefined) updateData.bio = bio || null
    if (location !== undefined) updateData.location = location || null
    if (education !== undefined) {
      updateData.education = typeof education === 'string' ? { raw: education } : education
    }
    if (experience !== undefined) {
      updateData.experience = typeof experience === 'string' ? { raw: experience } : experience
    }
    if (twitter !== undefined) updateData.twitter = twitter || null
    if (github !== undefined) updateData.github = github || null
    if (website !== undefined) updateData.website = website || null
    if (skills !== undefined) updateData.skills = skills || []
    if (tags !== undefined) updateData.tags = tags || []
    if (notes !== undefined) updateData.notes = notes || null
    if (pipelineStage !== undefined) updateData.pipelineStage = pipelineStage

    const updated = await prisma.founder.update({
      where: { id },
      data: updateData,
      include: {
        companies: {
          include: {
            startup: {
              select: {
                id: true,
                name: true,
                sector: true,
                country: true,
                rank: true,
                pipelineStage: true,
              }
            }
          }
        }
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[API] Error updating founder:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: `Failed to update founder: ${errorMessage}` }, { status: 500 })
  }
}

// DELETE /api/founders/[id] - Delete a founder
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check founder exists
    const existing = await prisma.founder.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Founder not found" }, { status: 404 })
    }

    // Delete founder (cascade will delete company links)
    await prisma.founder.delete({ where: { id } })

    return NextResponse.json({ success: true, message: "Founder deleted" })
  } catch (error) {
    console.error("[API] Error deleting founder:", error)
    return NextResponse.json({ error: "Failed to delete founder" }, { status: 500 })
  }
}
