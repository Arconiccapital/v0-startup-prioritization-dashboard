import type { Startup } from "./types"
import { generateText } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
})

export type RejectionTone = "encouraging" | "constructive" | "transparent" | "formal"

export interface RejectionMessages {
  formalRejection: {
    subject: string
    body: string
  }
  constructiveFeedback: {
    subject: string
    body: string
  }
  futureOpportunity: {
    subject: string
    body: string
  }
  warmIntroduction: {
    subject: string
    body: string
  }
}

function getToneInstructions(tone: RejectionTone): string {
  switch (tone) {
    case "encouraging":
      return "Use a warm, encouraging tone. Emphasize the founder's strengths and potential. Be optimistic about their future while being clear about the pass decision. Make them feel valued and respected."
    case "constructive":
      return "Use a balanced, constructive tone. Provide actionable feedback where appropriate. Be honest but kind about concerns. Focus on helping them improve for future fundraising."
    case "transparent":
      return "Use a direct, transparent tone. Be honest about the specific reasons for passing. Avoid vague language - founders appreciate clarity. Still be respectful and professional."
    case "formal":
      return "Use a formal, professional tone. Keep the message polished and business-appropriate. Be respectful but brief. Avoid going into too much detail about reasons."
    default:
      return "Use a professional, respectful tone that maintains the relationship."
  }
}

function prepareRejectionContext(startup: Startup) {
  // Extract key concerns from various sources
  const areasOfConcern = startup.rationale?.areasOfConcern || []
  const keyStrengths = startup.rationale?.keyStrengths || []

  // Get threshold issues if available
  const thresholdIssues = startup.thresholdIssues || []
  const highRiskIssues = thresholdIssues
    .filter(issue => issue.riskRating === "High")
    .map(issue => issue.issue)

  // Get decision data if available
  const investmentDecision = startup.investmentDecision as {
    reasonsNotToInvest?: string[]
    reasonsToInvest?: string[]
    additionalContext?: string
  } | undefined

  return {
    companyName: startup.name,
    description: startup.description,
    sector: startup.sector,
    country: startup.country,
    founders: startup.companyInfo?.founders,
    website: startup.companyInfo?.website,
    founded: startup.companyInfo?.founded,
    problemSolved: startup.productInfo?.problemSolved,
    industry: startup.marketInfo?.industry,
    keyStrengths: Array.isArray(keyStrengths) ? keyStrengths.join(", ") : keyStrengths,
    areasOfConcern: Array.isArray(areasOfConcern) ? areasOfConcern.join(", ") : areasOfConcern,
    highRiskIssues: highRiskIssues.join(", "),
    reasonsNotToInvest: investmentDecision?.reasonsNotToInvest?.join(", ") || "",
    reasonsToInvest: investmentDecision?.reasonsToInvest?.join(", ") || "",
    additionalContext: investmentDecision?.additionalContext || "",
  }
}

export async function generateRejectionMessages(
  startup: Startup,
  tone: RejectionTone
): Promise<RejectionMessages> {
  const context = prepareRejectionContext(startup)
  const toneInstructions = getToneInstructions(tone)

  const systemPrompt = `You are a venture capital investor who needs to communicate a pass decision to a startup founder. Your goal is to:

1. Be respectful and appreciative of the founder's time and effort
2. Provide clear (but not harsh) reasoning for the decision when appropriate
3. Highlight the company's strengths before discussing any concerns
4. Maintain the relationship for potential future opportunities
5. Leave the door open where appropriate
6. Make the founder feel valued despite the rejection

${toneInstructions}

IMPORTANT FORMATTING RULES:
- Write in plain text without any markdown formatting
- Do not use asterisks, bold, or italic formatting
- Do not use bullet points or numbered lists in the message body
- Write naturally flowing paragraphs
- Be genuine and human - avoid generic VC platitudes
- Never be condescending or dismissive
- Keep the tone professional yet warm`

  const contextStr = `
Company: ${context.companyName}
Description: ${context.description || "N/A"}
Sector: ${context.sector || "N/A"}
Country: ${context.country || "N/A"}
Founders: ${context.founders || "The founding team"}
Website: ${context.website || "N/A"}
Founded: ${context.founded || "N/A"}
Problem Solved: ${context.problemSolved || "N/A"}
Industry: ${context.industry || "N/A"}

Key Strengths We Identified: ${context.keyStrengths || "Strong team and vision"}
Areas of Concern: ${context.areasOfConcern || "Timing and fit with our current portfolio focus"}
${context.highRiskIssues ? `Key Risk Issues: ${context.highRiskIssues}` : ""}
${context.reasonsNotToInvest ? `Specific Concerns: ${context.reasonsNotToInvest}` : ""}
${context.reasonsToInvest ? `Positive Factors: ${context.reasonsToInvest}` : ""}`

  const messagePrompts = {
    formalRejection: `Write a brief, professional rejection email to the founder(s) of ${context.companyName}.

Keep it to 3-4 short paragraphs:
1. Thank them sincerely for their time and the opportunity to learn about their company
2. Inform them we've decided to pass at this time
3. Briefly mention it's not the right fit for our current portfolio focus (without going into specific criticisms)
4. Wish them well and leave the door open for future conversations

${contextStr}

RESPONSE FORMAT (exactly like this):
SUBJECT: [Write a respectful subject line - not something that sounds like spam]
BODY:
[Write the email body]`,

    constructiveFeedback: `Write a rejection email to the founder(s) of ${context.companyName} that provides constructive feedback.

Structure it as:
1. Thank them genuinely and acknowledge their strengths (be specific based on the context)
2. Explain the specific concerns that led to our pass (be kind but honest - use the concerns provided)
3. Offer actionable suggestions or perspective if appropriate
4. Encourage them and express genuine interest in seeing their progress

${contextStr}

RESPONSE FORMAT (exactly like this):
SUBJECT: [Write a subject line that hints at feedback being included]
BODY:
[Write the email body - can be slightly longer since you're providing value]`,

    futureOpportunity: `Write an encouraging rejection email to the founder(s) of ${context.companyName} focused on future potential.

Structure it as:
1. Express genuine appreciation for their vision and what they're building
2. Explain this isn't the right timing or fit for us specifically right now
3. Highlight what would need to change or develop for us to potentially reconsider (be constructive)
4. Warmly invite them to stay in touch and keep us updated on their progress

${contextStr}

RESPONSE FORMAT (exactly like this):
SUBJECT: [Write an encouraging subject line about staying connected]
BODY:
[Write the email body - make them feel this is a "not now" rather than "never"]`,

    warmIntroduction: `Write a rejection email to the founder(s) of ${context.companyName} offering to help with introductions to other investors.

Structure it as:
1. Thank them and be clear we're passing on this opportunity
2. Acknowledge their strengths and why another investor might be a great fit
3. Offer to make introductions to other investors or funds who might be better suited for their stage/sector/needs
4. Ask if they'd like us to make any specific intros or recommendations

${contextStr}

RESPONSE FORMAT (exactly like this):
SUBJECT: [Write a helpful subject line about introductions]
BODY:
[Write the email body - be genuinely helpful and show you want to support them even if you're not investing]`,
  }

  console.log(`[Rejection] Starting parallel generation of 4 message types for ${startup.name}`)

  const messagePromises = Object.entries(messagePrompts).map(async ([messageType, prompt]) => {
    try {
      console.log(`[Rejection] Generating: ${messageType}`)

      const { text } = await generateText({
        model: anthropic("claude-sonnet-4-5-20250929"),
        system: systemPrompt,
        prompt,
      })

      console.log(`[Rejection] Completed: ${messageType}`)
      return [messageType, text] as [string, string]
    } catch (error) {
      console.error(`[Rejection] Error generating ${messageType}:`, error)
      return [
        messageType,
        `SUBJECT: Unable to generate\nBODY:\nError generating this message. Please try again.`,
      ] as [string, string]
    }
  })

  const results = await Promise.all(messagePromises)
  const rawMessages = Object.fromEntries(results)

  console.log(`[Rejection] Completed all message generation`)

  // Parse the responses into structured format
  return {
    formalRejection: parseEmailResponse(rawMessages.formalRejection),
    constructiveFeedback: parseEmailResponse(rawMessages.constructiveFeedback),
    futureOpportunity: parseEmailResponse(rawMessages.futureOpportunity),
    warmIntroduction: parseEmailResponse(rawMessages.warmIntroduction),
  }
}

function parseEmailResponse(response: string): { subject: string; body: string } {
  const subjectMatch = response.match(/SUBJECT:\s*(.+?)(?:\n|$)/i)
  const bodyMatch = response.match(/BODY:\s*([\s\S]+)/i)

  return {
    subject: subjectMatch?.[1]?.trim() || "Following up on our conversation",
    body: bodyMatch?.[1]?.trim() || response.trim(),
  }
}
