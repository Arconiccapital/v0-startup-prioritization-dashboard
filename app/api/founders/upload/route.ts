import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  parseFoundersFromCSV,
  parseFoundersWithAIMappings,
  generateCSVPreview,
  suggestFounderMapping
} from "@/lib/founder-csv-parser"
import {
  normalizeFounderName,
  findDuplicates,
  normalizeLinkedInUrl,
} from "@/lib/founder-matcher"
import type { FounderCSVMapping, FounderUploadResult, LLMMappingSuggestion } from "@/lib/types"
import { randomUUID } from "crypto"

// POST /api/founders/upload - Upload founders from CSV
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { csvText, mapping, action, aiMappings } = body as {
      csvText: string
      mapping?: FounderCSVMapping
      action?: 'preview' | 'check_duplicates' | 'import'
      aiMappings?: LLMMappingSuggestion[]
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

    // Action: Import - OPTIMIZED BATCH import
    if (action === 'import') {
      console.log(`[Founder Import] Starting batch import of ${parsedFounders.length} founders`)
      const startTime = Date.now()

      const result: FounderUploadResult = {
        created: 0,
        duplicatesFound: 0,
        linked: 0,
        errors: []
      }

      // Get duplicate decisions if provided
      const duplicateDecisions = body.duplicateDecisions as Record<number, 'merge' | 'new' | 'skip'> | undefined

      // Use enhanced parser if AI mappings provided
      const parsedWithCustomData = parseFoundersWithAIMappings(csvText, mapping, aiMappings)

      // OPTIMIZATION 1: Load all existing founders for dedup check in ONE query
      console.log('[Founder Import] Loading existing founders for dedup check...')
      const existingFounders = await prisma.founder.findMany({
        select: {
          id: true,
          linkedIn: true,
          email: true,
          normalizedName: true,
        }
      })

      // Build lookup maps for O(1) dedup checking
      const linkedInMap = new Map<string, string>()
      const emailMap = new Map<string, string>()
      const nameMap = new Map<string, string>()

      for (const f of existingFounders) {
        if (f.linkedIn) {
          const normalized = normalizeLinkedInUrl(f.linkedIn)
          if (normalized) linkedInMap.set(normalized, f.id)
        }
        if (f.email) emailMap.set(f.email.toLowerCase(), f.id)
        if (f.normalizedName) nameMap.set(f.normalizedName.toLowerCase(), f.id)
      }
      console.log(`[Founder Import] Loaded ${existingFounders.length} existing founders`)

      // OPTIMIZATION 2: Load all startups for company matching in ONE query
      console.log('[Founder Import] Loading startups for company matching...')
      const allStartups = await prisma.startup.findMany({
        select: { id: true, name: true }
      })
      const companyMap = new Map<string, string>()
      for (const s of allStartups) {
        companyMap.set(s.name.toLowerCase(), s.id)
      }
      console.log(`[Founder Import] Loaded ${allStartups.length} startups`)

      // OPTIMIZATION 3: Prepare batch data
      const newFounders: Array<{
        id: string
        name: string
        normalizedName: string
        email: string | null
        linkedIn: string | null
        title: string | null
        bio: string | null
        location: string | null
        education: object | null
        experience: object | null
        twitter: string | null
        github: string | null
        website: string | null
        skills: string[]
        tags: string[]
        source: string
        pipelineStage: string
        customData: object | null
        customSchema: object | null
      }> = []

      // Track company links: separate existing founders from new founders
      const existingFounderCompanyLinks: Array<{
        founderId: string
        startupId: string
        role: string
        isPrimary: boolean
        isActive: boolean
      }> = []

      // Links for new founders (will be processed after founders are inserted)
      const newFounderCompanyData: Array<{
        founderId: string
        companyName: string
        role: string
      }> = []

      // Track which IDs are new (not yet in DB)
      const newFounderIds = new Set<string>()

      // Process each founder
      for (let i = 0; i < parsedWithCustomData.length; i++) {
        const { founder: founderData, customData, customSchema } = parsedWithCustomData[i]

        try {
          // Check for duplicates using in-memory maps
          let existingFounderId: string | undefined
          let isExistingInDb = false

          if (founderData.linkedIn) {
            const normalized = normalizeLinkedInUrl(founderData.linkedIn)
            if (normalized && linkedInMap.has(normalized)) {
              existingFounderId = linkedInMap.get(normalized)
              // Check if this ID is from DB or from a new founder in this batch
              isExistingInDb = !newFounderIds.has(existingFounderId!)
            }
          }

          if (!existingFounderId && founderData.email) {
            const emailLower = founderData.email.toLowerCase()
            if (emailMap.has(emailLower)) {
              existingFounderId = emailMap.get(emailLower)
              isExistingInDb = !newFounderIds.has(existingFounderId!)
            }
          }

          if (!existingFounderId) {
            const normalizedName = normalizeFounderName(founderData.name)
            if (nameMap.has(normalizedName.toLowerCase())) {
              existingFounderId = nameMap.get(normalizedName.toLowerCase())
              isExistingInDb = !newFounderIds.has(existingFounderId!)
            }
          }

          // Handle duplicate
          if (existingFounderId) {
            const decision = duplicateDecisions?.[i] || 'merge'

            if (decision === 'skip') {
              result.duplicatesFound++
              continue
            }

            if (decision === 'merge') {
              // For merge, we skip creating new - just count as duplicate
              result.duplicatesFound++

              // Still link to company if needed
              if (founderData.companyName) {
                const companyId = companyMap.get(founderData.companyName.toLowerCase())
                if (companyId) {
                  if (isExistingInDb) {
                    // Founder exists in DB, can link immediately
                    existingFounderCompanyLinks.push({
                      founderId: existingFounderId,
                      startupId: companyId,
                      role: founderData.role || 'Founder',
                      isPrimary: true,
                      isActive: true
                    })
                  } else {
                    // Founder is new (from earlier in this batch), link after insert
                    newFounderCompanyData.push({
                      founderId: existingFounderId,
                      companyName: founderData.companyName,
                      role: founderData.role || 'Founder'
                    })
                  }
                }
              }
              continue
            }
            // decision === 'new' - create anyway
          }

          // Create new founder data
          const founderId = randomUUID()
          const normalizedName = normalizeFounderName(founderData.name)

          newFounders.push({
            id: founderId,
            name: founderData.name,
            normalizedName,
            email: founderData.email || null,
            linkedIn: founderData.linkedIn || null,
            title: founderData.title || null,
            bio: founderData.bio || null,
            location: founderData.location || null,
            education: founderData.education ? { raw: founderData.education } : null,
            experience: founderData.experience ? { raw: founderData.experience } : null,
            twitter: founderData.twitter || null,
            github: founderData.github || null,
            website: founderData.website || null,
            skills: founderData.skills || [],
            tags: [],
            source: 'csv_upload',
            pipelineStage: 'Screening',
            customData: Object.keys(customData).length > 0 ? customData : null,
            customSchema: Object.keys(customSchema).length > 0 ? customSchema : null,
          })

          // Track this as a new founder (not yet in DB)
          newFounderIds.add(founderId)

          // Add to dedup maps for subsequent rows
          if (founderData.linkedIn) {
            const normalized = normalizeLinkedInUrl(founderData.linkedIn)
            if (normalized) linkedInMap.set(normalized, founderId)
          }
          if (founderData.email) emailMap.set(founderData.email.toLowerCase(), founderId)
          nameMap.set(normalizedName.toLowerCase(), founderId)

          result.created++

          // Store company link data (will process after founders are inserted)
          if (founderData.companyName) {
            newFounderCompanyData.push({
              founderId,
              companyName: founderData.companyName,
              role: founderData.role || 'Founder'
            })
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          result.errors.push(`Row ${i + 1} (${founderData.name}): ${errorMessage}`)
        }
      }

      // OPTIMIZATION 4: Batch insert all new founders
      if (newFounders.length > 0) {
        console.log(`[Founder Import] Batch inserting ${newFounders.length} founders...`)
        const BATCH_SIZE = 500

        for (let i = 0; i < newFounders.length; i += BATCH_SIZE) {
          const batch = newFounders.slice(i, i + BATCH_SIZE)
          await prisma.founder.createMany({
            data: batch,
            skipDuplicates: true,
          })
          console.log(`[Founder Import] Inserted batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(newFounders.length/BATCH_SIZE)}`)
        }
      }

      // OPTIMIZATION 5: Batch insert company links
      // Now that all founders are inserted, we can create company links

      // First, get existing links to avoid duplicates
      const existingLinks = await prisma.founderCompany.findMany({
        select: { founderId: true, startupId: true }
      })
      const existingLinkSet = new Set(existingLinks.map(l => `${l.founderId}-${l.startupId}`))

      // Combine all company links: existing founder links + new founder links
      const allCompanyLinks: Array<{
        founderId: string
        startupId: string
        role: string
        isPrimary: boolean
        isActive: boolean
      }> = [...existingFounderCompanyLinks]

      // Process new founder company data - look up company IDs
      for (const linkData of newFounderCompanyData) {
        const companyId = companyMap.get(linkData.companyName.toLowerCase())
        if (companyId) {
          allCompanyLinks.push({
            founderId: linkData.founderId,
            startupId: companyId,
            role: linkData.role,
            isPrimary: true,
            isActive: true
          })
        }
      }

      if (allCompanyLinks.length > 0) {
        console.log(`[Founder Import] Creating ${allCompanyLinks.length} company links...`)

        // Filter out existing links
        const newLinks = allCompanyLinks.filter(
          l => !existingLinkSet.has(`${l.founderId}-${l.startupId}`)
        )

        if (newLinks.length > 0) {
          await prisma.founderCompany.createMany({
            data: newLinks,
            skipDuplicates: true,
          })
          result.linked = newLinks.length
        }
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      console.log(`[Founder Import] Completed in ${elapsed}s: ${result.created} created, ${result.duplicatesFound} duplicates, ${result.linked} linked`)

      return NextResponse.json(result)
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("[API] Error uploading founders:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: `Failed to upload founders: ${errorMessage}` }, { status: 500 })
  }
}
