import { prisma } from "@/lib/prisma"
import type { FounderDB, FounderDuplicateMatch } from "@/lib/types"

/**
 * Normalize a founder name for matching
 * Converts to lowercase, removes special characters, normalizes whitespace
 */
export function normalizeFounderName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z\s]/g, '') // Remove special chars, keep letters and spaces
    .replace(/\s+/g, ' ')     // Normalize multiple spaces to single space
    .trim()
}

/**
 * Extract LinkedIn profile ID from URL
 * Handles various LinkedIn URL formats
 */
export function normalizeLinkedInUrl(url: string): string {
  if (!url) return ''

  // Remove trailing slashes and query params
  const cleanUrl = url.toLowerCase().trim()

  // Extract profile ID from various formats
  // https://www.linkedin.com/in/johnsmith
  // https://linkedin.com/in/johnsmith/
  // linkedin.com/in/johnsmith?query=param
  const match = cleanUrl.match(/linkedin\.com\/in\/([^\/\?]+)/)
  return match ? match[1].toLowerCase() : cleanUrl
}

/**
 * Calculate name similarity score (0-100)
 * Uses Levenshtein distance normalized by string length
 */
export function calculateNameSimilarity(name1: string, name2: string): number {
  const normalized1 = normalizeFounderName(name1)
  const normalized2 = normalizeFounderName(name2)

  // Exact match
  if (normalized1 === normalized2) return 100

  // Calculate Levenshtein distance
  const distance = levenshteinDistance(normalized1, normalized2)
  const maxLength = Math.max(normalized1.length, normalized2.length)

  if (maxLength === 0) return 100

  // Convert distance to similarity percentage
  const similarity = ((maxLength - distance) / maxLength) * 100
  return Math.round(similarity)
}

/**
 * Levenshtein distance implementation
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length
  const n = str2.length

  // Create a matrix
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

  // Initialize first row and column
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  // Fill in the rest
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // deletion
          dp[i][j - 1] + 1,     // insertion
          dp[i - 1][j - 1] + 1  // substitution
        )
      }
    }
  }

  return dp[m][n]
}

/**
 * Find existing founder by LinkedIn URL (exact match)
 */
export async function findFounderByLinkedIn(linkedInUrl: string): Promise<FounderDB | null> {
  if (!linkedInUrl) return null

  const normalizedUrl = normalizeLinkedInUrl(linkedInUrl)
  if (!normalizedUrl) return null

  const founder = await prisma.founder.findFirst({
    where: {
      linkedIn: {
        contains: normalizedUrl,
        mode: 'insensitive'
      }
    }
  })

  return founder as FounderDB | null
}

/**
 * Find existing founder by email (exact match)
 */
export async function findFounderByEmail(email: string): Promise<FounderDB | null> {
  if (!email) return null

  const founder = await prisma.founder.findFirst({
    where: {
      email: {
        equals: email.toLowerCase().trim(),
        mode: 'insensitive'
      }
    }
  })

  return founder as FounderDB | null
}

/**
 * Find potential founder matches by name
 * Returns founders with similarity above threshold
 */
export async function findFoundersByName(
  name: string,
  threshold: number = 80
): Promise<Array<{ founder: FounderDB; similarity: number }>> {
  const normalizedName = normalizeFounderName(name)
  if (!normalizedName) return []

  // Get all founders (in production, you'd use a proper fuzzy search)
  const founders = await prisma.founder.findMany({
    where: {
      normalizedName: {
        contains: normalizedName.split(' ')[0], // Search by first name
        mode: 'insensitive'
      }
    }
  })

  // Calculate similarity for each
  const matches = founders
    .map(founder => ({
      founder: founder as FounderDB,
      similarity: calculateNameSimilarity(name, founder.name)
    }))
    .filter(match => match.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)

  return matches
}

/**
 * Find duplicate matches for a batch of founders being uploaded
 */
export async function findDuplicates(
  uploadedFounders: Array<{
    name: string
    email?: string | null
    linkedIn?: string | null
  }>
): Promise<FounderDuplicateMatch[]> {
  const matches: FounderDuplicateMatch[] = []

  for (let i = 0; i < uploadedFounders.length; i++) {
    const uploaded = uploadedFounders[i]

    // 1. Check LinkedIn first (most reliable)
    if (uploaded.linkedIn) {
      const linkedInMatch = await findFounderByLinkedIn(uploaded.linkedIn)
      if (linkedInMatch) {
        matches.push({
          uploadIndex: i,
          uploadedName: uploaded.name,
          existingFounder: linkedInMatch,
          matchType: 'exact_linkedin',
          confidence: 100
        })
        continue // Found exact match, skip other checks
      }
    }

    // 2. Check email (also reliable)
    if (uploaded.email) {
      const emailMatch = await findFounderByEmail(uploaded.email)
      if (emailMatch) {
        matches.push({
          uploadIndex: i,
          uploadedName: uploaded.name,
          existingFounder: emailMatch,
          matchType: 'exact_email',
          confidence: 100
        })
        continue
      }
    }

    // 3. Check by name (fuzzy match)
    const nameMatches = await findFoundersByName(uploaded.name, 85)
    if (nameMatches.length > 0) {
      // Take the best match
      const bestMatch = nameMatches[0]
      matches.push({
        uploadIndex: i,
        uploadedName: uploaded.name,
        existingFounder: bestMatch.founder,
        matchType: 'name_match',
        confidence: bestMatch.similarity
      })
    }
  }

  return matches
}

/**
 * Create or update a founder based on deduplication
 */
export async function createOrUpdateFounder(
  data: {
    name: string
    email?: string | null
    linkedIn?: string | null
    title?: string | null
    bio?: string | null
    location?: string | null
    education?: unknown
    experience?: unknown
    twitter?: string | null
    github?: string | null
    website?: string | null
    skills?: string[]
    source?: string
    pipelineStage?: string
  },
  existingFounderId?: string
): Promise<FounderDB> {
  const normalizedName = normalizeFounderName(data.name)

  if (existingFounderId) {
    // Update existing founder
    const updated = await prisma.founder.update({
      where: { id: existingFounderId },
      data: {
        name: data.name,
        normalizedName,
        email: data.email || undefined,
        linkedIn: data.linkedIn || undefined,
        title: data.title || undefined,
        bio: data.bio || undefined,
        location: data.location || undefined,
        education: data.education as object || undefined,
        experience: data.experience as object || undefined,
        twitter: data.twitter || undefined,
        github: data.github || undefined,
        website: data.website || undefined,
        skills: data.skills || [],
        source: data.source || undefined,
        pipelineStage: data.pipelineStage || undefined,
      }
    })
    return updated as FounderDB
  } else {
    // Create new founder
    const created = await prisma.founder.create({
      data: {
        name: data.name,
        normalizedName,
        email: data.email || null,
        linkedIn: data.linkedIn || null,
        title: data.title || null,
        bio: data.bio || null,
        location: data.location || null,
        education: data.education as object || null,
        experience: data.experience as object || null,
        twitter: data.twitter || null,
        github: data.github || null,
        website: data.website || null,
        skills: data.skills || [],
        tags: [],
        source: data.source || 'csv_upload',
        pipelineStage: data.pipelineStage || 'Deal Flow',
      }
    })
    return created as FounderDB
  }
}

/**
 * Link a founder to a company
 */
export async function linkFounderToCompany(
  founderId: string,
  startupId: string,
  role: string = 'Founder',
  isPrimary: boolean = false
): Promise<boolean> {
  try {
    // Check if link already exists
    const existing = await prisma.founderCompany.findUnique({
      where: {
        founderId_startupId: { founderId, startupId }
      }
    })

    if (existing) {
      // Update existing link
      await prisma.founderCompany.update({
        where: { id: existing.id },
        data: { role, isPrimary }
      })
    } else {
      // Create new link
      await prisma.founderCompany.create({
        data: {
          founderId,
          startupId,
          role,
          isPrimary,
          isActive: true
        }
      })
    }
    return true
  } catch (error) {
    console.error('[FounderMatcher] Error linking founder to company:', error)
    return false
  }
}

/**
 * Find company by name for auto-linking
 */
export async function findCompanyByName(companyName: string): Promise<{ id: string; name: string } | null> {
  if (!companyName) return null

  const startup = await prisma.startup.findFirst({
    where: {
      name: {
        equals: companyName.trim(),
        mode: 'insensitive'
      }
    },
    select: {
      id: true,
      name: true
    }
  })

  return startup
}
