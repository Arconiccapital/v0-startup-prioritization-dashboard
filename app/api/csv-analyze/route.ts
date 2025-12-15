import { NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import type {
  LLMAnalyzeRequest,
  LLMAnalyzeResponse,
  LLMMappingSuggestion,
  PREDEFINED_CATEGORIES
} from "@/lib/types"

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
})

// Predefined categories with their fields for FOUNDERS
const FOUNDER_CATEGORY_DEFINITIONS = {
  personalInfo: {
    displayName: "Personal Info",
    fields: {
      name: "Founder full name (REQUIRED)",
      bio: "Short biography",
      location: "City/country location",
      photo: "Profile photo URL",
    },
  },
  contactInfo: {
    displayName: "Contact Info",
    fields: {
      email: "Email address",
      linkedIn: "LinkedIn profile URL",
      twitter: "Twitter/X handle or URL",
      github: "GitHub profile URL",
      website: "Personal website",
    },
  },
  background: {
    displayName: "Background",
    fields: {
      education: "Educational background",
      experience: "Prior work experience",
      skills: "Technical skills, expertise areas",
      title: "Current job title (CEO, CTO, etc.)",
    },
  },
  companyRole: {
    displayName: "Company Role",
    fields: {
      companyName: "Company name (for linking to existing company)",
      role: "Role at company (Founder, Co-Founder, etc.)",
    },
  },
}

// Predefined categories with their fields (matching Startup model structure)
const STARTUP_CATEGORY_DEFINITIONS = {
  companyInfo: {
    displayName: "Company Info",
    fields: {
      website: "Company website URL",
      urls: "Other URLs/links",
      linkedin: "LinkedIn company page",
      headquarters: "Company headquarters location",
      location: "Office location",
      founded: "Year founded",
      founders: "Founder names",
      employeeCount: "Number of employees",
      fundingRaised: "Total funding raised",
      area: "Business area/focus",
      ventureCapitalFirm: "Lead VC firms",
      investmentDate: "Investment date",
    },
  },
  teamInfo: {
    displayName: "Team Info",
    fields: {
      keyTeamMembers: "Key team members and roles",
      teamDepth: "Team depth assessment",
      foundersEducation: "Founders' educational background",
      foundersPriorExperience: "Founders' prior work experience",
      teamExecutionAssessment: "Team execution capability",
    },
  },
  marketInfo: {
    displayName: "Market Info",
    fields: {
      industry: "Industry category",
      subIndustry: "Sub-industry/vertical",
      marketSize: "Total addressable market size",
      aiDisruptionPropensity: "AI disruption likelihood",
      targetPersona: "Target customer persona",
      b2bOrB2c: "B2B, B2C, or B2B2C model",
      marketCompetitionAnalysis: "Market competition analysis",
    },
  },
  salesInfo: {
    displayName: "Sales Info",
    fields: {
      salesMotion: "Sales approach (PLG, enterprise, etc.)",
      salesCycleLength: "Typical sales cycle length",
      gtmStrategy: "Go-to-market strategy",
      channels: "Sales/distribution channels",
      salesComplexity: "Sales process complexity",
    },
  },
  productInfo: {
    displayName: "Product Info",
    fields: {
      productName: "Product name",
      problemSolved: "Problem the product solves",
      horizontalOrVertical: "Horizontal vs vertical solution",
      moat: "Competitive moat/defensibility",
    },
  },
  businessModel: {
    displayName: "Business Model",
    fields: {
      revenueModel: "Revenue model type",
      pricingStrategy: "Pricing approach",
      unitEconomics: "Unit economics metrics",
    },
  },
  competitiveInfo: {
    displayName: "Competitive Info",
    fields: {
      competitors: "Main competitors",
      industryMultiples: "Industry valuation multiples",
    },
  },
  riskOpportunity: {
    displayName: "Risk & Opportunity",
    fields: {
      regulatoryRisk: "Regulatory risk factors",
      exitPotential: "Exit potential/opportunities",
    },
  },
  metrics: {
    displayName: "Metrics",
    fields: {
      arr: "Annual Recurring Revenue",
      growth: "Growth rate",
      teamSize: "Team size number",
      fundingStage: "Current funding stage",
    },
  },
  aiScores: {
    displayName: "AI Scores",
    fields: {
      score: "Overall AI/LLM score",
      machineLearningScore: "ML model score",
      xgBoost: "XGBoost model score",
      lightGBM: "LightGBM model score",
      arconicLlmRules: "LLM rules assessment",
      investmentScoreOverview: "Investment score overview",
      keyStrengths: "Key strengths identified",
      areasOfConcern: "Areas of concern",
    },
  },
  core: {
    displayName: "Core Fields",
    fields: {
      name: "Company/startup name (REQUIRED)",
      description: "Company description",
      sector: "Business sector",
      stage: "Company stage",
      country: "Country of operation",
    },
  },
}

// Generate dynamic system prompt based on entity type
function getSystemPrompt(entityType: 'startup' | 'founder' = 'startup') {
  const categoryDefs = entityType === 'founder' ? FOUNDER_CATEGORY_DEFINITIONS : STARTUP_CATEGORY_DEFINITIONS
  const entityName = entityType === 'founder' ? 'founder/person' : 'startup/company'

  return `You are an AI assistant that analyzes CSV column headers and sample data to suggest intelligent mappings for a ${entityName} database.

Your task is to analyze the provided CSV headers and sample values, then suggest how each column should be mapped to our database categories and fields.

## Available Categories and Fields:

${Object.entries(categoryDefs)
  .map(
    ([key, { displayName, fields }]) =>
      `### ${displayName} (key: "${key}")\n${Object.entries(fields)
        .map(([fieldKey, description]) => `- ${fieldKey}: ${description}`)
        .join("\n")}`
  )
  .join("\n\n")}

## Rules:

1. **Prioritize existing categories**: Always try to map to predefined categories/fields first
2. **Analyze BOTH headers AND values**: Use sample values to understand the data type and content
3. **Create new categories only when necessary**: If data truly doesn't fit existing categories, suggest a new category
4. **Confidence scoring**:
   - 90-100: Exact or very close match (e.g., "Company Name" -> core.name)
   - 70-89: Strong match with minor variation (e.g., "Startup Website" -> companyInfo.website)
   - 50-69: Reasonable match but could be ambiguous (e.g., "URL" could be website or linkedin)
   - Below 50: Uncertain, provide alternatives
5. **Data types**: Infer data type from values (text, number, date, url, boolean)
6. **Skip recommendations**: Suggest skipping columns that are clearly not useful (e.g., row numbers, internal IDs)

## Response Format:

Return a JSON object with this exact structure:
{
  "mappings": [
    {
      "csvHeader": "Original Column Header",
      "suggestedCategory": "categoryKey",
      "suggestedField": "fieldKey",
      "categoryType": "existing" | "new",
      "confidence": 0-100,
      "reasoning": "Brief explanation",
      "alternativeCategories": ["other", "possible", "categories"],
      "sampleValue": "Example value from CSV"
    }
  ],
  "newCategorySuggestions": [
    {
      "name": "newCategoryKey",
      "displayName": "New Category Display Name",
      "fieldType": "text" | "number" | "date" | "url" | "boolean",
      "description": "What this category captures"
    }
  ],
  "analysisNotes": "Overall observations about this CSV structure",
  "confidence": 0-100
}

IMPORTANT: Respond ONLY with valid JSON. No markdown formatting, no explanation outside the JSON.`
}

export async function POST(request: NextRequest) {
  try {
    const body: LLMAnalyzeRequest & { entityType?: 'startup' | 'founder' } = await request.json()
    const { headers, sampleRows, existingCategories, userContext, preserveMappings, entityType = 'startup' } = body

    if (!headers || headers.length === 0) {
      return NextResponse.json(
        { error: "Headers are required" },
        { status: 400 }
      )
    }

    console.log("[CSV Analyze] Processing", headers.length, "columns")
    console.log("[CSV Analyze] Headers:", headers)

    // Build the user prompt with headers and sample data
    let userPrompt = `Analyze these CSV columns and suggest mappings:\n\n`
    userPrompt += `## Headers:\n${headers.map((h, i) => `${i + 1}. "${h}"`).join("\n")}\n\n`

    if (sampleRows && sampleRows.length > 0) {
      userPrompt += `## Sample Data (first ${sampleRows.length} rows):\n`
      sampleRows.forEach((row, rowIndex) => {
        userPrompt += `\nRow ${rowIndex + 1}:\n`
        headers.forEach((header, colIndex) => {
          const value = row[colIndex] || "(empty)"
          // Truncate long values for context efficiency
          const truncatedValue = value.length > 100 ? value.substring(0, 100) + "..." : value
          userPrompt += `- ${header}: ${truncatedValue}\n`
        })
      })
    }

    if (userContext) {
      userPrompt += `\n## User Feedback:\n${userContext}\n`
      userPrompt += `Please refine your suggestions based on this feedback.\n`
    }

    if (preserveMappings && Object.keys(preserveMappings).length > 0) {
      userPrompt += `\n## Preserve These User Mappings:\n`
      Object.entries(preserveMappings).forEach(([header, mapping]) => {
        userPrompt += `- "${header}" -> ${mapping.category}.${mapping.field} (user confirmed)\n`
      })
      userPrompt += `Do not change these mappings, keep them as specified.\n`
    }

    console.log("[CSV Analyze] Calling Claude for entity type:", entityType)

    const { text } = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
      system: getSystemPrompt(entityType),
      prompt: userPrompt,
      maxTokens: 4000,
    })

    console.log("[CSV Analyze] Raw response length:", text.length)

    // Parse the JSON response
    let response: LLMAnalyzeResponse
    try {
      // Clean the response in case it has markdown code blocks
      let cleanedText = text.trim()
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.slice(7)
      }
      if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.slice(3)
      }
      if (cleanedText.endsWith("```")) {
        cleanedText = cleanedText.slice(0, -3)
      }
      cleanedText = cleanedText.trim()

      response = JSON.parse(cleanedText) as LLMAnalyzeResponse

      // Validate and ensure all required fields
      if (!response.mappings || !Array.isArray(response.mappings)) {
        throw new Error("Invalid response: missing mappings array")
      }

      // Ensure all mappings have required fields (with entity-type-aware defaults)
      const defaultCategory = entityType === 'founder' ? 'personalInfo' : 'core'
      const defaultField = entityType === 'founder' ? 'bio' : 'description'
      response.mappings = response.mappings.map((mapping) => ({
        csvHeader: mapping.csvHeader || "",
        suggestedCategory: mapping.suggestedCategory || defaultCategory,
        suggestedField: mapping.suggestedField || defaultField,
        categoryType: mapping.categoryType || "existing",
        confidence: typeof mapping.confidence === "number" ? mapping.confidence : 50,
        reasoning: mapping.reasoning || "No reasoning provided",
        alternativeCategories: mapping.alternativeCategories || [],
        sampleValue: mapping.sampleValue,
      }))

      // Ensure overall confidence
      if (typeof response.confidence !== "number") {
        const avgConfidence =
          response.mappings.reduce((sum, m) => sum + m.confidence, 0) /
          response.mappings.length
        response.confidence = Math.round(avgConfidence)
      }

      console.log("[CSV Analyze] Parsed", response.mappings.length, "mappings")
      console.log("[CSV Analyze] Overall confidence:", response.confidence)

    } catch (parseError) {
      console.error("[CSV Analyze] Parse error:", parseError)
      console.error("[CSV Analyze] Raw text:", text.substring(0, 500))

      // Fallback: create basic mappings using rule-based approach
      return NextResponse.json(
        {
          error: "Failed to parse AI response, please try again",
          fallback: true
        },
        { status: 500 }
      )
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error("[CSV Analyze] Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: `Failed to analyze CSV: ${errorMessage}` },
      { status: 500 }
    )
  }
}
