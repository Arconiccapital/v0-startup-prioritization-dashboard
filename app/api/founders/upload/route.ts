import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { parseFoundersFromCSV, generateCSVPreview, suggestFounderMapping } from "@/lib/founder-csv-parser"
import {
  normalizeFounderName,
  findDuplicates,
  createOrUpdateFounder,
  linkFounderToCompany,
  findCompanyByName
} from "@/lib/founder-matcher"
import type { FounderCSVMapping, FounderUploadResult, FounderDuplicateMatch } from "@/lib/types"

// POST /api/founders/upload - Upload founders from CSV
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { csvText, mapping, action } = body as {
      csvText: string
      mapping?: FounderCSVMapping
      action?: 'preview' | 'check_duplicates' | 'import'
    }

    if (!csvText || typeof csvText !== 'string') {
      return NextResponse.json({ error: "CSV text is required" }, { status: 400 })
    }

    // Action: Preview - return headers and sample rows
    if (action === 'preview' || !action) {
      const preview = generateCSVPreview(csvText, 5)
      const suggestedMapping = suggestFounderMapping(preview.headers)

      return NextResponse.json({
        preview,
        suggestedMapping
      })
    }

    // Validate mapping for other actions
    if (!mapping || !mapping.name) {
      return NextResponse.json({ error: "Column mapping with 'name' field is required" }, { status: 400 })
    }

    // Parse founders from CSV
    const parsedFounders = parseFoundersFromCSV(csvText, mapping)

    if (parsedFounders.length === 0) {
      return NextResponse.json({ error: "No founders found in CSV" }, { status: 400 })
    }

    // Action: Check duplicates - find potential matches
    if (action === 'check_duplicates') {
      const duplicates = await findDuplicates(
        parsedFounders.map(f => ({
          name: f.name,
          email: f.email,
          linkedIn: f.linkedIn
        }))
      )

      return NextResponse.json({
        totalRows: parsedFounders.length,
        duplicatesFound: duplicates.length,
        duplicates
      })
    }

    // Action: Import - create founders and link to companies
    if (action === 'import') {
      const result: FounderUploadResult = {
        created: 0,
        duplicatesFound: 0,
        linked: 0,
        errors: []
      }

      // Get duplicate decisions if provided
      const duplicateDecisions = body.duplicateDecisions as Record<number, 'merge' | 'new' | 'skip'> | undefined

      // Process in batches for performance
      const BATCH_SIZE = 50

      for (let i = 0; i < parsedFounders.length; i += BATCH_SIZE) {
        const batch = parsedFounders.slice(i, i + BATCH_SIZE)

        for (let j = 0; j < batch.length; j++) {
          const founderData = batch[j]
          const globalIndex = i + j

          try {
            // Check for existing founder
            let existingFounderId: string | undefined

            // Check LinkedIn first
            if (founderData.linkedIn) {
              const byLinkedIn = await prisma.founder.findFirst({
                where: { linkedIn: { contains: founderData.linkedIn.toLowerCase(), mode: 'insensitive' } }
              })
              if (byLinkedIn) existingFounderId = byLinkedIn.id
            }

            // Check email
            if (!existingFounderId && founderData.email) {
              const byEmail = await prisma.founder.findFirst({
                where: { email: { equals: founderData.email.toLowerCase(), mode: 'insensitive' } }
              })
              if (byEmail) existingFounderId = byEmail.id
            }

            // Check name
            if (!existingFounderId) {
              const normalizedName = normalizeFounderName(founderData.name)
              const byName = await prisma.founder.findFirst({
                where: { normalizedName: { equals: normalizedName, mode: 'insensitive' } }
              })
              if (byName) existingFounderId = byName.id
            }

            // Handle duplicate based on decision
            if (existingFounderId) {
              const decision = duplicateDecisions?.[globalIndex] || 'merge'

              if (decision === 'skip') {
                result.duplicatesFound++
                continue
              }

              if (decision === 'new') {
                // Create as new founder (ignore duplicate)
                existingFounderId = undefined
              }
              // decision === 'merge' - update existing
            }

            // Create or update founder
            const founder = await createOrUpdateFounder({
              name: founderData.name,
              email: founderData.email,
              linkedIn: founderData.linkedIn,
              title: founderData.title,
              bio: founderData.bio,
              location: founderData.location,
              education: founderData.education ? { raw: founderData.education } : undefined,
              experience: founderData.experience ? { raw: founderData.experience } : undefined,
              twitter: founderData.twitter,
              github: founderData.github,
              website: founderData.website,
              skills: founderData.skills,
              source: 'csv_upload'
            }, existingFounderId)

            if (existingFounderId) {
              result.duplicatesFound++
            } else {
              result.created++
            }

            // Link to company if specified
            if (founderData.companyName) {
              const company = await findCompanyByName(founderData.companyName)
              if (company) {
                const linked = await linkFounderToCompany(
                  founder.id,
                  company.id,
                  founderData.role || 'Founder',
                  true
                )
                if (linked) result.linked++
              }
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            result.errors.push(`Row ${globalIndex + 1} (${founderData.name}): ${errorMessage}`)
          }
        }
      }

      return NextResponse.json(result)
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("[API] Error uploading founders:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: `Failed to upload founders: ${errorMessage}` }, { status: 500 })
  }
}
