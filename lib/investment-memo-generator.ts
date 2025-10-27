import type { Startup } from "./types"
import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
})

function prepareCompanyData(startup: Startup) {
  // Extract document text from both old format (string) and new format (object with text property)
  const extractDocText = (doc: any): string => {
    if (!doc) return ""
    if (typeof doc === "string") return doc
    if (typeof doc === "object" && doc.text) return doc.text
    return ""
  }

  const documents = startup.documents
    ? {
        transcript: extractDocText((startup.documents as any).transcript),
        pitchDeck: extractDocText((startup.documents as any).pitchDeck),
      }
    : undefined

  return {
    name: startup.name,
    description: startup.description,
    sector: startup.sector,
    country: startup.country,
    stage: startup.pipelineStage,
    scores: {
      llm: startup.aiScores?.llm || startup.score,
      ml: startup.aiScores?.ml || startup.score,
    },
    companyInfo: startup.companyInfo,
    marketInfo: startup.marketInfo,
    productInfo: startup.productInfo,
    businessModelInfo: startup.businessModelInfo,
    salesInfo: startup.salesInfo,
    teamInfo: startup.teamInfo,
    competitiveInfo: startup.competitiveInfo,
    riskInfo: startup.riskInfo,
    opportunityInfo: startup.opportunityInfo,
    rationale: startup.rationale,
    thresholdIssues: startup.thresholdIssues,
    initialAssessment: startup.initialAssessment,
    investmentScorecard: startup.investmentScorecard,
    documents: documents,
  }
}

function generateFallbackSection(sectionId: string, startup: Startup): string {
  const llmScore = startup.aiScores?.llm || startup.score
  const mlScore = startup.aiScores?.ml || startup.score
  const avgScore = (llmScore + mlScore) / 2

  switch (sectionId) {
    case "executive":
      const scoreAssessment =
        avgScore >= 8
          ? "strong investment candidate"
          : avgScore >= 6
            ? "promising opportunity"
            : avgScore >= 4
              ? "requires further evaluation"
              : "does not meet current investment criteria"
      return `${startup.name} is a ${startup.sector} company based in ${startup.country || "N/A"}, currently in the ${startup.pipelineStage || "evaluation"} stage. ${startup.description || "The company is developing innovative solutions in their sector."}\n\nOur AI-powered assessment indicates this is a ${scoreAssessment}, with an LLM Score of ${llmScore}/10 and ML Score of ${mlScore}/10. ${startup.companyInfo?.website ? `The company operates at ${startup.companyInfo.website}.` : ""} ${startup.companyInfo?.founded ? `Founded in ${startup.companyInfo.founded}, ` : ""}${startup.companyInfo?.employeeCount ? `the team has grown to ${startup.companyInfo.employeeCount} employees` : "the company is building its team"}.${startup.companyInfo?.fundingRaised ? ` To date, they have raised ${startup.companyInfo.fundingRaised} in funding.` : ""}\n\n${startup.marketInfo?.industry ? `Operating in the ${startup.marketInfo.industry} industry` : "The company operates in a dynamic market"}${startup.marketInfo?.marketSize ? ` with a total addressable market of ${startup.marketInfo.marketSize}` : ""}, ${startup.name} ${startup.productInfo?.problemSolved ? `addresses ${startup.productInfo.problemSolved.toLowerCase()}` : "is developing solutions for key market challenges"}.`

    case "thesis":
      const strengths =
        startup.rationale?.keyStrengths ||
        "Strong market positioning and innovative approach to solving customer problems. Experienced founding team with relevant domain expertise. Clear product-market fit signals and early traction indicators."
      const concerns =
        startup.rationale?.areasOfConcern ||
        "Competitive market landscape requires continued differentiation. Scaling challenges typical of early-stage companies. Capital efficiency and path to profitability need ongoing monitoring."
      return `Investment Thesis\n\nKey Strengths:\n${strengths}\n\nAreas of Concern:\n${concerns}\n\n${startup.opportunityInfo?.exitPotential ? `Exit Potential: ${startup.opportunityInfo.exitPotential}` : "The company demonstrates characteristics that could lead to attractive exit opportunities through strategic acquisition or public markets."}`

    case "market":
      const industry = startup.marketInfo?.industry || "their target sector"
      const subIndustry = startup.marketInfo?.subIndustry
      const marketSize = startup.marketInfo?.marketSize
      const b2bOrB2c = startup.marketInfo?.b2bOrB2c
      const targetPersona = startup.marketInfo?.targetPersona
      const aiDisruption = startup.marketInfo?.aiDisruptionPropensity
      const competition = startup.marketInfo?.marketCompetitionAnalysis

      return `Market Analysis\n\n${startup.name} operates in the ${industry}${subIndustry ? ` sector, specifically targeting the ${subIndustry} segment` : " sector"}.${marketSize ? ` The total addressable market is estimated at ${marketSize}, ` : " The market represents a significant opportunity, "}${b2bOrB2c ? `serving ${b2bOrB2c} customers` : "with substantial growth potential"}.${targetPersona ? ` The primary target customer is ${targetPersona}.` : ""}\n\n${aiDisruption ? `AI Disruption Propensity: ${aiDisruption}. This indicates ${aiDisruption.toLowerCase().includes("high") ? "significant opportunities for AI-driven innovation and market transformation" : aiDisruption.toLowerCase().includes("medium") ? "moderate potential for AI integration and competitive advantage" : "a more traditional market with selective AI application opportunities"}.` : ""}\n\nCompetitive Landscape:\n${competition || `The ${industry} market is characterized by evolving customer needs and opportunities for differentiation. ${startup.name}'s approach positions them to capture market share through innovation and execution.`}`

    case "product":
      const productName = startup.productInfo?.productName || startup.name
      const problemSolved = startup.productInfo?.problemSolved
      const moat = startup.productInfo?.moat
      const horizontal = startup.productInfo?.horizontalOrVertical

      return `Product & Technology\n\n${productName} ${problemSolved ? `addresses a critical market need: ${problemSolved}` : "provides innovative solutions to key customer challenges"}. ${horizontal ? `The product takes a ${horizontal.toLowerCase()} approach, ` : ""}${horizontal?.toLowerCase().includes("horizontal") ? "enabling broad market applicability across multiple use cases and customer segments" : horizontal?.toLowerCase().includes("vertical") ? "providing deep, specialized functionality for specific industry needs" : "balancing market breadth with solution depth"}.\n\nCompetitive Moat:\n${moat || "The company is building defensibility through product innovation, customer relationships, and market positioning. Continued investment in technology and customer success will strengthen competitive advantages over time."}\n\n${startup.productInfo?.productStage ? `Product Stage: ${startup.productInfo.productStage}` : ""}${startup.productInfo?.technologyStack ? `\nTechnology Stack: ${startup.productInfo.technologyStack}` : ""}${startup.productInfo?.intellectualProperty ? `\nIntellectual Property: ${startup.productInfo.intellectualProperty}` : ""}`

    case "business":
      const revenueModel = startup.businessModelInfo?.revenueModel
      const pricing = startup.businessModelInfo?.pricingStrategy
      const unitEcon = startup.businessModelInfo?.unitEconomics

      return `Business Model & Economics\n\n${startup.name} ${revenueModel ? `generates revenue through ${revenueModel.toLowerCase()}` : "has established a clear revenue model"}. ${pricing ? `The pricing strategy is ${pricing.toLowerCase()}, ` : ""}${pricing?.toLowerCase().includes("subscription") ? "providing predictable recurring revenue and strong customer lifetime value" : pricing?.toLowerCase().includes("usage") ? "aligning costs with customer value realization" : pricing?.toLowerCase().includes("transaction") ? "scaling revenue with customer activity" : "designed to capture value while enabling customer growth"}.\n\nUnit Economics:\n${unitEcon || "The company is focused on achieving strong unit economics through efficient customer acquisition and high retention rates. As the business scales, improving gross margins and reducing customer acquisition costs will be key priorities."}\n\n${startup.businessModelInfo?.customerAcquisitionCost ? `Customer Acquisition Cost: ${startup.businessModelInfo.customerAcquisitionCost}` : ""}${startup.businessModelInfo?.lifetimeValue ? `\nCustomer Lifetime Value: ${startup.businessModelInfo.lifetimeValue}` : ""}`

    case "gtm":
      const gtmStrategy = startup.salesInfo?.gtmStrategy
      const salesMotion = startup.salesInfo?.salesMotion
      const channels = startup.salesInfo?.channels
      const salesCycle = startup.salesInfo?.salesCycleLength
      const complexity = startup.salesInfo?.salesComplexity

      return `Go-to-Market Strategy\n\n${gtmStrategy || `${startup.name} is executing a focused go-to-market strategy designed to efficiently acquire and retain customers in their target market.`}\n\n${salesMotion ? `Sales Motion: ${salesMotion}. ` : ""}${salesMotion?.toLowerCase().includes("self-serve") ? "This approach enables rapid customer acquisition with low friction and efficient scaling." : salesMotion?.toLowerCase().includes("sales-led") ? "This model allows for higher deal values and stronger customer relationships through direct engagement." : salesMotion?.toLowerCase().includes("hybrid") ? "This balanced approach captures both high-velocity self-serve customers and high-value enterprise accounts." : ""}\n\n${channels ? `Distribution Channels: ${channels}` : ""}${salesCycle ? `\nSales Cycle Length: ${salesCycle}` : ""}${complexity ? `\nSales Complexity: ${complexity}` : ""}\n\n${startup.salesInfo?.currentCustomers ? `Current Customers: ${startup.salesInfo.currentCustomers}` : ""}${startup.salesInfo?.customerRetention ? `\nCustomer Retention: ${startup.salesInfo.customerRetention}` : ""}`

    case "team":
      const foundersEd = startup.teamInfo?.foundersEducation
      const foundersExp = startup.teamInfo?.foundersPriorExperience
      const keyMembers = startup.teamInfo?.keyTeamMembers
      const teamDepth = startup.teamInfo?.teamDepth
      const assessment = startup.teamInfo?.teamExecutionAssessment

      return `Team & Execution\n\nFounders' Background:\n${foundersEd ? `Education: ${foundersEd}\n` : ""}${foundersExp ? `Prior Experience: ${foundersExp}` : "The founding team brings relevant industry experience and domain expertise to the business."}\n\n${keyMembers ? `Key Team Members:\n${keyMembers}\n\n` : ""}${teamDepth ? `Team Depth: ${teamDepth}\n\n` : ""}Execution Assessment:\n${assessment || `The team has demonstrated the ability to execute against their roadmap and adapt to market feedback. ${startup.companyInfo?.employeeCount ? `With ${startup.companyInfo.employeeCount} employees, ` : ""}the company is building organizational capabilities to support growth. Continued focus on talent acquisition and retention will be critical as the business scales.`}`

    case "competitive":
      const competitors = startup.competitiveInfo?.competitors
      const multiples = startup.competitiveInfo?.industryMultiples

      return `Competitive Analysis\n\n${competitors ? `Key Competitors:\n${competitors}\n\n` : `${startup.name} operates in a competitive market with both established players and emerging startups. `}${startup.productInfo?.moat ? `Differentiation:\n${startup.productInfo.moat}\n\n` : "The company's differentiation comes from its unique approach to solving customer problems, technology innovation, and go-to-market execution.\n\n"}${multiples ? `Industry Benchmarks:\n${multiples}` : "Industry valuation multiples vary based on growth rates, profitability, and market positioning. Strong execution and market traction will support premium valuations."}`

    case "risk":
      const regRisk = startup.riskInfo?.regulatoryRisk
      const thresholdIssues = startup.thresholdIssues || []

      return `Risk Analysis\n\n${regRisk ? `Regulatory Risk: ${regRisk}\n\n` : ""}${thresholdIssues.length > 0 ? `Threshold Issues:\n${thresholdIssues.map((issue, i) => `${i + 1}. ${issue.category} (${issue.riskRating}): ${issue.issue}${issue.mitigation ? `\n   Mitigation: ${issue.mitigation}` : ""}`).join("\n\n")}` : "No critical threshold issues have been identified at this stage. Standard early-stage risks include market adoption, competitive dynamics, execution challenges, and capital requirements. Ongoing monitoring and risk mitigation strategies will be important as the company scales."}\n\n${startup.riskInfo?.marketRisk ? `Market Risk: ${startup.riskInfo.marketRisk}` : ""}${startup.riskInfo?.executionRisk ? `\nExecution Risk: ${startup.riskInfo.executionRisk}` : ""}`

    case "recommendation":
      const decision = avgScore >= 8 ? "Strong Yes" : avgScore >= 6 ? "Proceed with Further DD" : avgScore >= 4 ? "Monitor and Stay Warm" : "Pass"
      const decisionColor =
        avgScore >= 8 ? "strong" : avgScore >= 6 ? "positive" : avgScore >= 4 ? "cautious" : "negative"

      let rationale = ""
      if (avgScore >= 8) {
        rationale = `${startup.name} represents a compelling investment opportunity with strong fundamentals across team, market, product, and business model. The AI assessment scores (LLM: ${llmScore}/10, ML: ${mlScore}/10) indicate high potential for success. ${startup.rationale?.keyStrengths ? `Key strengths include ${startup.rationale.keyStrengths.toLowerCase().substring(0, 200)}...` : "The company demonstrates strong execution capability and market positioning."} We recommend proceeding to detailed due diligence immediately.`
      } else if (avgScore >= 6) {
        rationale = `${startup.name} shows promising characteristics as an investment opportunity. The AI assessment scores (LLM: ${llmScore}/10, ML: ${mlScore}/10) suggest solid potential with some areas requiring further evaluation. ${startup.rationale?.areasOfConcern ? `Areas to monitor include ${startup.rationale.areasOfConcern.toLowerCase().substring(0, 200)}...` : "Continued progress on key metrics and milestones will strengthen the investment case."} We recommend scheduling follow-up meetings and conducting preliminary due diligence.`
      } else if (avgScore >= 4) {
        rationale = `${startup.name} shows potential but requires significant progress before investment consideration. The AI assessment scores (LLM: ${llmScore}/10, ML: ${mlScore}/10) indicate mixed signals that warrant a "monitor and stay warm" approach. ${startup.rationale?.areasOfConcern ? `Key concerns include ${startup.rationale.areasOfConcern.toLowerCase().substring(0, 200)}...` : "Several factors need to improve before this becomes an attractive investment opportunity."} We recommend maintaining the relationship, tracking key milestones, and reassessing quarterly as the company progresses.`
      } else {
        rationale = `${startup.name} does not currently meet our investment criteria. The AI assessment scores (LLM: ${llmScore}/10, ML: ${mlScore}/10) suggest significant challenges that would need to be addressed. ${startup.rationale?.areasOfConcern ? `Primary concerns include ${startup.rationale.areasOfConcern.toLowerCase().substring(0, 200)}...` : "The company would need to demonstrate substantial progress across multiple dimensions before reconsidering."} We recommend no further action at this time.`
      }

      const nextSteps =
        avgScore >= 8
          ? "1. Conduct detailed due diligence on financials, technology, and market\n2. Schedule meetings with founders and key team members\n3. Perform reference checks with customers and industry experts\n4. Prepare term sheet and investment proposal"
          : avgScore >= 6
            ? "1. Schedule follow-up meeting with founders\n2. Request additional financial and operational data\n3. Conduct preliminary customer and market research\n4. Reassess in 30-60 days with updated information"
            : avgScore >= 4
              ? "1. Add to monitoring pipeline and track quarterly\n2. Stay in touch with founders through regular check-ins\n3. Monitor key milestones, metrics, and market developments\n4. Reassess investment opportunity when significant progress is made"
              : "1. Pass on investment opportunity\n2. Provide constructive feedback to founders if appropriate\n3. No further action required at this time"

      return `Investment Recommendation\n\nDecision: ${decision}\n\n${rationale}\n\nNext Steps:\n${nextSteps}`

    default:
      return "Content not available."
  }
}


export function generateTemplateMemo(startup: Startup): Record<string, string> {
  return {
    executive: generateFallbackSection("executive", startup),
    thesis: generateFallbackSection("thesis", startup),
    market: generateFallbackSection("market", startup),
    product: generateFallbackSection("product", startup),
    business: generateFallbackSection("business", startup),
    gtm: generateFallbackSection("gtm", startup),
    team: generateFallbackSection("team", startup),
    competitive: generateFallbackSection("competitive", startup),
    risk: generateFallbackSection("risk", startup),
    recommendation: generateFallbackSection("recommendation", startup),
  }
}

export async function generateMemoSections(startup: Startup): Promise<Record<string, string>> {
  const companyData = prepareCompanyData(startup)

  const sectionPrompts = {
    executive: `Write a compelling 2-3 paragraph executive summary for ${startup.name}. Highlight the investment opportunity, key metrics (LLM Score: ${startup.aiScores?.llm || startup.score}/10, ML Score: ${startup.aiScores?.ml || startup.score}/10), market position, and overall assessment. Be concise and impactful.

IMPORTANT: Reference and incorporate insights from:
- Initial Assessment: ${companyData.initialAssessment ? JSON.stringify(companyData.initialAssessment) : "Not available"}
- Investment Scorecard: ${companyData.investmentScorecard ? JSON.stringify(companyData.investmentScorecard) : "Not available"}
- Meeting Transcript: ${companyData.documents?.transcript ? companyData.documents.transcript : "Not available"}
- Pitch Deck Notes: ${companyData.documents?.pitchDeck ? companyData.documents.pitchDeck : "Not available"}

Company Data: ${JSON.stringify(companyData, null, 2)}`,

    thesis: `Analyze the investment thesis for ${startup.name}. Provide:
1. Key Strengths (3-5 bullet points with specific examples)
2. Areas of Concern (2-4 bullet points with context)

IMPORTANT: Draw insights from:
- Initial Assessment: ${companyData.initialAssessment ? JSON.stringify(companyData.initialAssessment) : "Not available"}
- Investment Scorecard Results: ${companyData.investmentScorecard ? JSON.stringify(companyData.investmentScorecard) : "Not available"}
- Meeting Insights: ${companyData.documents?.transcript ? companyData.documents.transcript : "Not available"}

Use this data: ${JSON.stringify({ rationale: companyData.rationale, scores: companyData.scores }, null, 2)}`,

    market: `Provide a detailed market analysis for ${startup.name}. Cover:
- Market size and growth trends
- Industry dynamics
- Competitive positioning
- Market timing and macro drivers

Data: ${JSON.stringify(companyData.marketInfo, null, 2)}`,

    product: `Analyze ${startup.name}'s product and technology. Evaluate:
- Product innovation and differentiation
- Technology stack and IP
- Problem-solution fit
- Competitive advantages and moat

Data: ${JSON.stringify(companyData.productInfo, null, 2)}`,

    business: `Evaluate ${startup.name}'s business model and economics. Assess:
- Revenue model and pricing strategy
- Unit economics and scalability
- Capital efficiency
- Path to profitability

Data: ${JSON.stringify(companyData.businessModelInfo, null, 2)}`,

    gtm: `Analyze ${startup.name}'s go-to-market strategy. Cover:
- Customer acquisition approach
- Sales motion and channels
- Growth strategy
- Market penetration plan

Data: ${JSON.stringify(companyData.salesInfo, null, 2)}`,

    team: `Assess ${startup.name}'s team and execution capability. Evaluate:
- Founder backgrounds and expertise
- Team composition and depth
- Execution track record
- Leadership quality

IMPORTANT: Reference insights from:
- Initial Team Assessment: ${companyData.initialAssessment?.teamQuality ? companyData.initialAssessment.teamQuality : "Not available"}
- Meeting Transcript (founder interactions): ${companyData.documents?.transcript ? companyData.documents.transcript : "Not available"}
- Pitch Deck (team slides): ${companyData.documents?.pitchDeck ? companyData.documents.pitchDeck : "Not available"}

Data: ${JSON.stringify(companyData.teamInfo, null, 2)}`,

    competitive: `Analyze the competitive landscape for ${startup.name}. Cover:
- Key competitors and their positioning
- Market differentiation
- Competitive advantages
- Industry benchmarks

Data: ${JSON.stringify(companyData.competitiveInfo, null, 2)}`,

    risk: `Identify and evaluate key risks for ${startup.name}. Analyze:
- Market risks
- Execution risks
- Regulatory risks
- Competitive risks
- Threshold issues (CRITICAL: Review all documented threshold issues in detail)

IMPORTANT: Incorporate risk insights from:
- Documented Threshold Issues: ${companyData.thresholdIssues && companyData.thresholdIssues.length > 0 ? JSON.stringify(companyData.thresholdIssues) : "No threshold issues documented"}
- Initial Risk Assessment: ${companyData.initialAssessment ? JSON.stringify(companyData.initialAssessment) : "Not available"}
- Meeting Discussion Points: ${companyData.documents?.transcript ? companyData.documents.transcript : "Not available"}

CRITICAL: If threshold issues are documented, they MUST be prominently featured in this section with:
- Category and risk rating
- Detailed issue description
- Mitigation strategies
- Current status

Data: ${JSON.stringify({ riskInfo: companyData.riskInfo, thresholdIssues: companyData.thresholdIssues }, null, 2)}`,

    recommendation: `Provide a clear investment recommendation for ${startup.name}. Include:
- Decision: Strong Yes, Proceed with Further DD, Monitor and Stay Warm, or Pass
- Detailed rationale (2-3 paragraphs)
- Specific next steps

IMPORTANT: Base recommendation on comprehensive review of:
- AI Scores: LLM ${startup.aiScores?.llm || startup.score}/10, ML ${startup.aiScores?.ml || startup.score}/10
- Investment Scorecard Total Score: ${companyData.investmentScorecard?.totalScore ? companyData.investmentScorecard.totalScore : "Not calculated"}
- Initial Assessment Summary: ${companyData.initialAssessment ? JSON.stringify(companyData.initialAssessment) : "Not available"}
- Threshold Issues (if critical): ${companyData.thresholdIssues && companyData.thresholdIssues.length > 0 ? JSON.stringify(companyData.thresholdIssues) : "None documented"}
- Meeting Outcomes: ${companyData.documents?.transcript ? companyData.documents.transcript : "Not available"}

Data: ${JSON.stringify(companyData, null, 2)}`,
  }

  // Generate all sections in parallel for faster performance
  console.log(`[v0] Starting parallel generation of ${Object.keys(sectionPrompts).length} sections`)

  const sectionPromises = Object.entries(sectionPrompts).map(async ([sectionId, prompt]) => {
    try {
      console.log(`[v0] Generating section: ${sectionId}`)

      const { text } = await generateText({
        model: openai("gpt-5-2025-08-07"),
        prompt: `You are a senior venture capital analyst. ${prompt}

IMPORTANT: Write in plain text without any markdown formatting. Do not use asterisks for bold (**text**), do not use hashes for headers (## Header), do not use dashes or asterisks for bullet points. Write in clear, professional prose with proper paragraphs and natural formatting. Use line breaks to separate ideas but avoid markdown syntax entirely.

Write in a professional, data-driven style. Be thorough but concise. Use specific examples and metrics where available.`,
      })

      console.log(`[v0] Completed section: ${sectionId}`)
      return [sectionId, text] as [string, string]
    } catch (error) {
      console.error(`[v0] Error generating ${sectionId}:`, error)
      return [
        sectionId,
        `⚠️ Error generating this section. Please regenerate the memo or check your API connection.\n\nError details: ${error instanceof Error ? error.message : "Unknown error"}`,
      ] as [string, string]
    }
  })

  const results = await Promise.all(sectionPromises)
  const generatedSections = Object.fromEntries(results)

  console.log(`[v0] Completed parallel generation of all sections`)

  return generatedSections
}

export async function generateInvestmentMemo(startup: Startup): Promise<string> {
  const sections = await generateMemoSections(startup)
  return Object.entries(sections)
    .map(([_, content]) => content)
    .join("\n\n---\n\n")
}
