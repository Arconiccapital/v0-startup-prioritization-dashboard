import type { FounderCSVMapping } from "@/lib/types"

/**
 * Parsed founder data from CSV row
 */
export interface ParsedFounder {
  name: string
  email: string | null
  linkedIn: string | null
  title: string | null
  education: string | null
  experience: string | null
  bio: string | null
  location: string | null
  twitter: string | null
  github: string | null
  website: string | null
  skills: string[]
  companyName: string | null  // For auto-linking
  role: string | null         // Role at company
}

/**
 * CSV Preview for mapping interface
 */
export interface FounderCSVPreview {
  headers: string[]
  sampleRows: string[][]
  rowCount: number
}

/**
 * Parse CSV text into rows
 * Handles quoted fields with commas and newlines
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"'
        i++
      } else {
        // Toggle quotes
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

/**
 * Parse CSV text into headers and rows
 */
export function parseCSVText(csvText: string): { headers: string[]; rows: string[][] } {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim())

  if (lines.length === 0) {
    return { headers: [], rows: [] }
  }

  const headers = parseCSVLine(lines[0])
  const rows = lines.slice(1).map(line => parseCSVLine(line))

  return { headers, rows }
}

/**
 * Generate preview from CSV text
 */
export function generateCSVPreview(csvText: string, sampleSize: number = 5): FounderCSVPreview {
  const { headers, rows } = parseCSVText(csvText)

  return {
    headers,
    sampleRows: rows.slice(0, sampleSize),
    rowCount: rows.length
  }
}

/**
 * Suggest column mapping based on header names
 */
export function suggestFounderMapping(headers: string[]): Partial<FounderCSVMapping> {
  const mapping: Partial<FounderCSVMapping> = {}
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim())

  // Name detection
  const namePatterns = ['name', 'founder', 'full name', 'founder name', 'person']
  for (let i = 0; i < normalizedHeaders.length; i++) {
    const h = normalizedHeaders[i]
    if (namePatterns.some(p => h.includes(p)) && !h.includes('company')) {
      mapping.name = headers[i]
      break
    }
  }

  // Email detection
  const emailPatterns = ['email', 'e-mail', 'mail']
  for (let i = 0; i < normalizedHeaders.length; i++) {
    const h = normalizedHeaders[i]
    if (emailPatterns.some(p => h.includes(p))) {
      mapping.email = headers[i]
      break
    }
  }

  // LinkedIn detection
  const linkedInPatterns = ['linkedin', 'linked in', 'linkedin url', 'linkedin profile']
  for (let i = 0; i < normalizedHeaders.length; i++) {
    const h = normalizedHeaders[i]
    if (linkedInPatterns.some(p => h.includes(p))) {
      mapping.linkedIn = headers[i]
      break
    }
  }

  // Title detection
  const titlePatterns = ['title', 'job title', 'position', 'designation']
  for (let i = 0; i < normalizedHeaders.length; i++) {
    const h = normalizedHeaders[i]
    if (titlePatterns.some(p => h === p || h.includes(p))) {
      mapping.title = headers[i]
      break
    }
  }

  // Education detection
  const educationPatterns = ['education', 'degree', 'school', 'university', 'college']
  for (let i = 0; i < normalizedHeaders.length; i++) {
    const h = normalizedHeaders[i]
    if (educationPatterns.some(p => h.includes(p))) {
      mapping.education = headers[i]
      break
    }
  }

  // Experience detection
  const experiencePatterns = ['experience', 'prior experience', 'background', 'work history', 'previous']
  for (let i = 0; i < normalizedHeaders.length; i++) {
    const h = normalizedHeaders[i]
    if (experiencePatterns.some(p => h.includes(p))) {
      mapping.experience = headers[i]
      break
    }
  }

  // Bio detection
  const bioPatterns = ['bio', 'about', 'summary', 'description']
  for (let i = 0; i < normalizedHeaders.length; i++) {
    const h = normalizedHeaders[i]
    if (bioPatterns.some(p => h === p || h.includes(p))) {
      mapping.bio = headers[i]
      break
    }
  }

  // Location detection
  const locationPatterns = ['location', 'city', 'country', 'address', 'based in']
  for (let i = 0; i < normalizedHeaders.length; i++) {
    const h = normalizedHeaders[i]
    if (locationPatterns.some(p => h.includes(p))) {
      mapping.location = headers[i]
      break
    }
  }

  // Twitter detection
  const twitterPatterns = ['twitter', 'x.com', 'twitter url']
  for (let i = 0; i < normalizedHeaders.length; i++) {
    const h = normalizedHeaders[i]
    if (twitterPatterns.some(p => h.includes(p))) {
      mapping.twitter = headers[i]
      break
    }
  }

  // GitHub detection
  const githubPatterns = ['github', 'git hub']
  for (let i = 0; i < normalizedHeaders.length; i++) {
    const h = normalizedHeaders[i]
    if (githubPatterns.some(p => h.includes(p))) {
      mapping.github = headers[i]
      break
    }
  }

  // Website detection
  const websitePatterns = ['website', 'personal website', 'personal site', 'url', 'web']
  for (let i = 0; i < normalizedHeaders.length; i++) {
    const h = normalizedHeaders[i]
    if (websitePatterns.some(p => h === p || h.startsWith(p)) && !h.includes('linkedin')) {
      mapping.website = headers[i]
      break
    }
  }

  // Skills detection
  const skillsPatterns = ['skills', 'expertise', 'specialties', 'tags']
  for (let i = 0; i < normalizedHeaders.length; i++) {
    const h = normalizedHeaders[i]
    if (skillsPatterns.some(p => h.includes(p))) {
      mapping.skills = headers[i]
      break
    }
  }

  // Company name detection (for linking)
  const companyPatterns = ['company', 'company name', 'startup', 'organization', 'firm']
  for (let i = 0; i < normalizedHeaders.length; i++) {
    const h = normalizedHeaders[i]
    if (companyPatterns.some(p => h.includes(p))) {
      mapping.companyName = headers[i]
      break
    }
  }

  // Role detection
  const rolePatterns = ['role', 'role at company', 'founder type', 'position type']
  for (let i = 0; i < normalizedHeaders.length; i++) {
    const h = normalizedHeaders[i]
    if (rolePatterns.some(p => h.includes(p)) && !h.includes('revenue')) {
      mapping.role = headers[i]
      break
    }
  }

  return mapping
}

/**
 * Parse founders from CSV using provided mapping
 */
export function parseFoundersFromCSV(
  csvText: string,
  mapping: FounderCSVMapping
): ParsedFounder[] {
  const { headers, rows } = parseCSVText(csvText)

  // Create header index map
  const headerIndex: Record<string, number> = {}
  headers.forEach((h, i) => {
    headerIndex[h] = i
  })

  // Get column index for a mapping key
  const getIndex = (mappingKey: keyof FounderCSVMapping): number => {
    const columnName = mapping[mappingKey]
    return columnName ? headerIndex[columnName] ?? -1 : -1
  }

  // Parse each row
  const founders: ParsedFounder[] = []

  for (const row of rows) {
    // Name is required
    const nameIndex = getIndex('name')
    if (nameIndex === -1 || !row[nameIndex]?.trim()) {
      continue // Skip rows without names
    }

    const getValue = (index: number): string | null => {
      if (index === -1) return null
      const value = row[index]?.trim()
      return value || null
    }

    // Parse skills as array
    const skillsIndex = getIndex('skills')
    const skillsValue = getValue(skillsIndex)
    const skills = skillsValue
      ? skillsValue.split(/[,;]/).map(s => s.trim()).filter(s => s)
      : []

    const founder: ParsedFounder = {
      name: row[nameIndex].trim(),
      email: getValue(getIndex('email')),
      linkedIn: getValue(getIndex('linkedIn')),
      title: getValue(getIndex('title')),
      education: getValue(getIndex('education')),
      experience: getValue(getIndex('experience')),
      bio: getValue(getIndex('bio')),
      location: getValue(getIndex('location')),
      twitter: getValue(getIndex('twitter')),
      github: getValue(getIndex('github')),
      website: getValue(getIndex('website')),
      skills,
      companyName: getValue(getIndex('companyName')),
      role: getValue(getIndex('role'))
    }

    founders.push(founder)
  }

  return founders
}

/**
 * Generate CSV template for download
 */
export function generateFounderCSVTemplate(): string {
  const headers = [
    'Name',
    'Email',
    'LinkedIn URL',
    'Title',
    'Education',
    'Experience',
    'Bio',
    'Location',
    'Skills',
    'Company Name',
    'Role',
    'Twitter',
    'GitHub',
    'Website'
  ]

  const sampleRow = [
    'John Smith',
    'john@example.com',
    'https://linkedin.com/in/johnsmith',
    'CEO',
    'Stanford MBA 2015',
    'Ex-Google PM, 5 years',
    'Serial entrepreneur with 2 exits',
    'San Francisco, CA',
    'AI, Product Management, Strategy',
    'TechCorp Inc',
    'Co-Founder',
    'https://twitter.com/johnsmith',
    'https://github.com/johnsmith',
    'https://johnsmith.com'
  ]

  return [
    headers.join(','),
    sampleRow.map(v => `"${v}"`).join(',')
  ].join('\n')
}
