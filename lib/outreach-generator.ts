import type { Startup } from "./types"
import { generateText } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
})

export type OutreachTone = "formal" | "friendly" | "direct" | "casual"

export interface OutreachMessages {
  coldEmail: {
    subject: string
    body: string
  }
  linkedin: {
    body: string
  }
  followUp: {
    subject: string
    body: string
  }
  meetingRequest: {
    subject: string
    body: string
  }
}

function getToneInstructions(tone: OutreachTone): string {
  switch (tone) {
    case "formal":
      return "Use a formal, professional tone. Be respectful, polished, and business-appropriate. Use proper salutations and sign-offs."
    case "friendly":
      return "Use a warm, approachable tone. Be personable and conversational while remaining professional. Show genuine interest and enthusiasm."
    case "direct":
      return "Use a direct, concise tone. Get to the point quickly. Be clear about your intentions and value proposition without unnecessary pleasantries."
    case "casual":
      return "Use a casual, relaxed tone. Be personable and natural, like reaching out to a colleague. Avoid overly formal language."
    default:
      return "Use a professional, engaging tone."
  }
}

function prepareOutreachContext(startup: Startup) {
  return {
    companyName: startup.name,
    description: startup.description,
    sector: startup.sector,
    country: startup.country,
    website: startup.companyInfo?.website,
    founders: startup.companyInfo?.founders,
    founded: startup.companyInfo?.founded,
    employeeCount: startup.companyInfo?.employeeCount,
    fundingRaised: startup.companyInfo?.fundingRaised,
    problemSolved: startup.productInfo?.problemSolved,
    moat: startup.productInfo?.moat,
    industry: startup.marketInfo?.industry,
    marketSize: startup.marketInfo?.marketSize,
    b2bOrB2c: startup.marketInfo?.b2bOrB2c,
    llmScore: startup.aiScores?.llm || startup.score,
    keyStrengths: startup.rationale?.keyStrengths,
    revenueModel: startup.businessModelInfo?.revenueModel,
  }
}

export async function generateOutreachMessages(
  startup: Startup,
  tone: OutreachTone
): Promise<OutreachMessages> {
  const context = prepareOutreachContext(startup)
  const toneInstructions = getToneInstructions(tone)

  const systemPrompt = `You are a venture capital investor reaching out to startup founders. You work at a reputable VC firm and are genuinely interested in learning more about promising companies.

${toneInstructions}

IMPORTANT FORMATTING RULES:
- Write in plain text without any markdown formatting
- Do not use asterisks, bold, or italic formatting
- Do not use bullet points or numbered lists in the message body
- Write naturally flowing paragraphs
- Keep messages concise and respectful of the founder's time
- Be genuine - avoid generic VC platitudes
- Reference specific aspects of their company to show you've done your research`

  const contextStr = `
Company: ${context.companyName}
Description: ${context.description || "N/A"}
Sector: ${context.sector || "N/A"}
Country: ${context.country || "N/A"}
Website: ${context.website || "N/A"}
Founders: ${context.founders || "N/A"}
Founded: ${context.founded || "N/A"}
Employees: ${context.employeeCount || "N/A"}
Funding Raised: ${context.fundingRaised || "N/A"}
Problem Solved: ${context.problemSolved || "N/A"}
Industry: ${context.industry || "N/A"}
Market Size: ${context.marketSize || "N/A"}
B2B/B2C: ${context.b2bOrB2c || "N/A"}
Key Strengths: ${context.keyStrengths || "N/A"}
Revenue Model: ${context.revenueModel || "N/A"}`

  const messagePrompts = {
    coldEmail: `Write a cold outreach email to the founder(s) of ${context.companyName}.

This is the FIRST contact - they don't know you yet. The goal is to introduce yourself, express genuine interest in their company, and open a conversation.

${contextStr}

RESPONSE FORMAT (exactly like this):
SUBJECT: [Write a compelling subject line that will get opened - not generic]
BODY:
[Write the email body - 3-4 short paragraphs max]`,

    linkedin: `Write a LinkedIn connection request message to the founder(s) of ${context.companyName}.

This must be SHORT (under 300 characters is ideal, max 500). LinkedIn messages should be brief and to the point.

${contextStr}

RESPONSE FORMAT (exactly like this):
BODY:
[Write a brief, compelling LinkedIn message - 2-3 sentences max]`,

    followUp: `Write a follow-up email to the founder(s) of ${context.companyName}.

Assume you've already sent an initial outreach but haven't heard back. Be respectful of their time, add value, and give them a reason to respond.

${contextStr}

RESPONSE FORMAT (exactly like this):
SUBJECT: [Write a follow-up subject line - can reference previous email]
BODY:
[Write the follow-up email - 2-3 short paragraphs]`,

    meetingRequest: `Write an email requesting a meeting/call with the founder(s) of ${context.companyName}.

The goal is to schedule a 30-minute introductory call. Be specific about what you'd like to discuss and offer flexible timing options.

${contextStr}

RESPONSE FORMAT (exactly like this):
SUBJECT: [Write a subject line focused on the meeting request]
BODY:
[Write the meeting request email - include specific topics you'd discuss and offer to work around their schedule]`,
  }

  console.log(`[Outreach] Starting parallel generation of 4 message types for ${startup.name}`)

  const messagePromises = Object.entries(messagePrompts).map(async ([messageType, prompt]) => {
    try {
      console.log(`[Outreach] Generating: ${messageType}`)

      const { text } = await generateText({
        model: anthropic("claude-sonnet-4-5-20250929"),
        system: systemPrompt,
        prompt,
      })

      console.log(`[Outreach] Completed: ${messageType}`)
      return [messageType, text] as [string, string]
    } catch (error) {
      console.error(`[Outreach] Error generating ${messageType}:`, error)
      return [
        messageType,
        `SUBJECT: Unable to generate\nBODY:\nError generating this message. Please try again.`,
      ] as [string, string]
    }
  })

  const results = await Promise.all(messagePromises)
  const rawMessages = Object.fromEntries(results)

  console.log(`[Outreach] Completed all message generation`)

  // Parse the responses into structured format
  return {
    coldEmail: parseEmailResponse(rawMessages.coldEmail),
    linkedin: { body: parseLinkedInResponse(rawMessages.linkedin) },
    followUp: parseEmailResponse(rawMessages.followUp),
    meetingRequest: parseEmailResponse(rawMessages.meetingRequest),
  }
}

function parseEmailResponse(response: string): { subject: string; body: string } {
  const subjectMatch = response.match(/SUBJECT:\s*(.+?)(?:\n|$)/i)
  const bodyMatch = response.match(/BODY:\s*([\s\S]+)/i)

  return {
    subject: subjectMatch?.[1]?.trim() || "Introduction",
    body: bodyMatch?.[1]?.trim() || response.trim(),
  }
}

function parseLinkedInResponse(response: string): string {
  const bodyMatch = response.match(/BODY:\s*([\s\S]+)/i)
  return bodyMatch?.[1]?.trim() || response.trim()
}
