import type { Founder, PipelineStage } from "./types"

interface StartupForFounders {
  id: string
  name: string
  sector: string
  country: string
  description: string | null
  rank: number | null
  pipelineStage: string
  companyInfo: Record<string, unknown> | null
  teamInfo: Record<string, unknown> | null
}

/**
 * Parse founders from a startup's JSON fields
 * Extracts founder names from companyInfo.founders and associates
 * education/experience data from teamInfo
 *
 * Supports formats:
 * - "Name: background; Name2: background2" (semicolon separated with backgrounds)
 * - "John Smith, Jane Doe" (comma separated)
 * - "John Smith & Jane Doe" (ampersand separated)
 */
export function parseFoundersFromStartup(startup: StartupForFounders): Founder[] {
  const companyInfo = startup.companyInfo as Record<string, string | undefined> | null
  const teamInfo = startup.teamInfo as Record<string, string | undefined> | null

  const foundersString = companyInfo?.founders
  if (!foundersString || typeof foundersString !== "string" || foundersString.trim() === "") {
    return []
  }

  // First check if it's in "Name: background; Name2: background2" format
  const hasSemicolonFormat = foundersString.includes(';') && foundersString.includes(':')

  let parsedFounders: Array<{ name: string; background: string | null }> = []

  if (hasSemicolonFormat) {
    // Split by semicolons, then extract name:background pairs
    const entries = foundersString.split(';').map(e => e.trim()).filter(e => e.length > 0)

    for (const entry of entries) {
      const colonIndex = entry.indexOf(':')
      if (colonIndex > 0) {
        const name = entry.slice(0, colonIndex).trim()
        const background = entry.slice(colonIndex + 1).trim()
        if (name) {
          parsedFounders.push({ name, background: background || null })
        }
      } else {
        // No colon, treat the whole thing as a name
        if (entry) {
          parsedFounders.push({ name: entry, background: null })
        }
      }
    }
  } else {
    // Simple comma/ampersand/and separated names
    const names = foundersString
      .split(/[,&]|\band\b/i)
      .map(name => name.trim())
      .filter(name => name.length > 0 && name.toLowerCase() !== "and")

    parsedFounders = names.map(name => ({ name, background: null }))
  }

  if (parsedFounders.length === 0) {
    return []
  }

  return parsedFounders.map((founder, index) => ({
    id: `${startup.id}-founder-${index}`,
    name: founder.name,
    role: "Founder",
    companyId: startup.id,
    companyName: startup.name,
    companySector: startup.sector,
    companyRank: startup.rank,
    education: teamInfo?.foundersEducation || null,
    priorExperience: founder.background || teamInfo?.foundersPriorExperience || null,
    linkedIn: companyInfo?.linkedin || null,
    companyWebsite: companyInfo?.website || null,
    companyDescription: startup.description,
    companyCountry: startup.country,
    pipelineStage: startup.pipelineStage as PipelineStage,
  }))
}

/**
 * Parse founders from multiple startups
 * Returns a flat array of all founders
 */
export function parseFoundersFromStartups(startups: StartupForFounders[]): Founder[] {
  return startups.flatMap(startup => parseFoundersFromStartup(startup))
}
