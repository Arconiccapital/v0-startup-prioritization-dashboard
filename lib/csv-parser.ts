import type { Startup, ColumnMapping, CSVPreview } from "./types"

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      // End of field
      result.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }

  // Add last field
  result.push(current.trim())
  return result
}

export function parseCSVPreview(csvText: string): CSVPreview {
  const lines = csvText.trim().split("\n")
  if (lines.length < 1) {
    throw new Error("CSV file is empty")
  }

  const headers = parseCSVLine(lines[0])
  const sampleRows: string[][] = []

  // Get up to 3 sample rows
  for (let i = 1; i < Math.min(4, lines.length); i++) {
    const values = parseCSVLine(lines[i])
    sampleRows.push(values)
  }

  return {
    headers,
    sampleRows,
    rowCount: lines.length - 1, // Exclude header row
  }
}

export function parseCSVWithMapping(csvText: string, mapping: ColumnMapping): Startup[] {
  const lines = csvText.trim().split("\n")
  if (lines.length < 2) {
    throw new Error("CSV must contain headers and at least one data row")
  }

  const headers = parseCSVLine(lines[0])
  const startups: Startup[] = []

  // Create index map for quick lookup
  const indexMap: Record<string, number> = {}
  headers.forEach((header, index) => {
    indexMap[header] = index
  })

  console.log("[v0] Column mapping:", mapping)
  console.log("[v0] Headers:", headers)
  console.log("[v0] Index map:", indexMap)
  console.log("[v0] Score column:", mapping.score)
  console.log("[v0] Score column index:", mapping.score ? indexMap[mapping.score] : "not mapped")

  if (lines.length > 1) {
    const firstRowValues = parseCSVLine(lines[1])
    console.log("[v0] First data row has", firstRowValues.length, "columns")
    console.log("[v0] Extracting from first row:")
    console.log(
      "  - Name column:",
      mapping.name,
      "→ index:",
      indexMap[mapping.name!],
      "→ value:",
      firstRowValues[indexMap[mapping.name!]],
    )
    console.log(
      "  - Sector column:",
      mapping.sector,
      "→ index:",
      indexMap[mapping.sector!],
      "→ value:",
      firstRowValues[indexMap[mapping.sector!]],
    )
    console.log(
      "  - Stage column:",
      mapping.stage,
      "→ index:",
      indexMap[mapping.stage!],
      "→ value:",
      firstRowValues[indexMap[mapping.stage!]],
    )
    console.log(
      "  - Description column:",
      mapping.description,
      "→ index:",
      indexMap[mapping.description!],
      "→ value:",
      firstRowValues[indexMap[mapping.description!]],
    )
    if (mapping.score) {
      console.log(
        "  - Score column:",
        mapping.score,
        "→ index:",
        indexMap[mapping.score],
        "→ value:",
        firstRowValues[indexMap[mapping.score]],
      )
    }
  }

  let rowsWithMissingScores = 0

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length === 0 || values.every((v) => !v)) continue

    const nameIndex = mapping.name ? indexMap[mapping.name] : -1
    const sectorIndex = mapping.sector ? indexMap[mapping.sector] : -1
    const stageIndex = mapping.stage ? indexMap[mapping.stage] : -1
    const descriptionIndex = mapping.description ? indexMap[mapping.description] : -1
    const scoreColumnIndex = mapping.score ? indexMap[mapping.score] : -1

    const nameValue = nameIndex >= 0 ? values[nameIndex] : ""
    const sectorValue = sectorIndex >= 0 ? values[sectorIndex] : ""
    const stageValue = stageIndex >= 0 ? values[stageIndex] : ""
    const descriptionValue = descriptionIndex >= 0 ? values[descriptionIndex] : ""
    const scoreRawValue = scoreColumnIndex >= 0 ? values[scoreColumnIndex] : undefined

    console.log(`[v0] Row ${i} extraction:`, {
      nameIndex,
      nameValue,
      sectorIndex,
      sectorValue,
      stageIndex,
      stageValue,
      descriptionIndex,
      descriptionValue,
      totalColumns: values.length,
    })

    let scoreValue = 0 // Default score
    if (scoreRawValue !== undefined && scoreRawValue !== null && scoreRawValue !== "") {
      const cleanedScore = String(scoreRawValue)
        .replace(/[%,$\s]/g, "")
        .trim()
      const parsedScore = Number.parseFloat(cleanedScore)
      if (!isNaN(parsedScore)) {
        scoreValue = parsedScore
      } else {
        rowsWithMissingScores++
        console.warn(`[v0] Row ${i}: using default score (0) - invalid value: "${scoreRawValue}"`)
      }
    } else {
      rowsWithMissingScores++
      console.warn(`[v0] Row ${i}: using default score (0) - no score provided`)
    }

    const startup: Startup = {
      id: `startup-${i}`,
      name: nameValue || "",
      sector: sectorValue || "",
      stage: stageValue || "",
      description: descriptionValue || "",
      team: mapping.team ? values[indexMap[mapping.team]] || "" : "",
      metrics: mapping.metrics ? values[indexMap[mapping.metrics]] || "" : "",
      score: scoreValue,
    }

    // Only add if required fields are present
    if (startup.name && startup.sector && startup.stage) {
      console.log(`[v0] ✓ Successfully parsed row ${i}:`, startup.name, `(score: ${startup.score})`)
      startups.push(startup)
    } else {
      console.warn(
        `[v0] Skipping row ${i}: missing required fields (name: ${!!startup.name}, sector: ${!!startup.sector}, stage: ${!!startup.stage})`,
      )
    }
  }

  console.log(`[v0] Successfully parsed ${startups.length} startups out of ${lines.length - 1} rows`)
  if (rowsWithMissingScores > 0) {
    console.warn(
      `[v0] Warning: ${rowsWithMissingScores} rows had missing or invalid scores and were assigned a default score of 0`,
    )
  }

  if (startups.length === 0) {
    console.error("[v0] ERROR: No startups were successfully parsed. Check that:")
    console.error("  1. The CSV has data rows (not just headers)")
    console.error("  2. The mapped columns exist in the CSV headers")
    console.error("  3. The data rows have values in the mapped columns")
  }

  return startups
}

export function suggestMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {}
  const lowerHeaders = headers.map((h) => h.toLowerCase())

  // Try to auto-detect common column names
  lowerHeaders.forEach((header, index) => {
    const originalHeader = headers[index]

    if (header.includes("name") || header === "startup" || header === "company") {
      mapping.name = originalHeader
    } else if (header.includes("sector") || header.includes("industry") || header.includes("vertical")) {
      mapping.sector = originalHeader
    } else if (header.includes("stage") || header.includes("round") || header.includes("funding")) {
      mapping.stage = originalHeader
    } else if (
      header.includes("description") ||
      header.includes("about") ||
      header.includes("summary") ||
      header.includes("overview")
    ) {
      mapping.description = originalHeader
    } else if (header.includes("team") || header.includes("founder") || header.includes("ceo")) {
      mapping.team = originalHeader
    } else if (
      header.includes("metric") ||
      header.includes("revenue") ||
      header.includes("user") ||
      header.includes("growth")
    ) {
      mapping.metrics = originalHeader
    } else if (header.includes("score") || header.includes("rating") || header.includes("rank")) {
      mapping.score = originalHeader
    }
  })

  return mapping
}
