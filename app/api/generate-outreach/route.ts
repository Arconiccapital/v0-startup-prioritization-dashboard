import { NextRequest, NextResponse } from "next/server"
import { generateOutreachMessages, type OutreachTone } from "@/lib/outreach-generator"
import type { Startup } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const { startup, tone }: { startup: Startup; tone: OutreachTone } = await request.json()

    if (!startup || !startup.id) {
      return NextResponse.json({ error: "Invalid startup data" }, { status: 400 })
    }

    if (!tone || !["formal", "friendly", "direct", "casual"].includes(tone)) {
      return NextResponse.json({ error: "Invalid tone. Must be: formal, friendly, direct, or casual" }, { status: 400 })
    }

    console.log("[API] Generating outreach messages for:", startup.name, "with tone:", tone)

    const messages = await generateOutreachMessages(startup, tone)

    console.log("[API] Outreach generation completed for:", startup.name)

    return NextResponse.json({ messages, generatedAt: new Date().toISOString() }, { status: 200 })
  } catch (error) {
    console.error("[API] Error generating outreach messages:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: `Failed to generate outreach messages: ${errorMessage}` }, { status: 500 })
  }
}
