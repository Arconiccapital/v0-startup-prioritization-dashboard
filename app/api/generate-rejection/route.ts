import { NextRequest, NextResponse } from "next/server"
import { generateRejectionMessages, type RejectionTone } from "@/lib/rejection-generator"
import type { Startup } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const { startup, tone }: { startup: Startup; tone: RejectionTone } = await request.json()

    if (!startup || !startup.id) {
      return NextResponse.json({ error: "Invalid startup data" }, { status: 400 })
    }

    if (!tone || !["encouraging", "constructive", "transparent", "formal"].includes(tone)) {
      return NextResponse.json({ error: "Invalid tone. Must be: encouraging, constructive, transparent, or formal" }, { status: 400 })
    }

    console.log("[API] Generating rejection messages for:", startup.name, "with tone:", tone)

    const messages = await generateRejectionMessages(startup, tone)

    console.log("[API] Rejection generation completed for:", startup.name)

    return NextResponse.json({ messages, generatedAt: new Date().toISOString() }, { status: 200 })
  } catch (error) {
    console.error("[API] Error generating rejection messages:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: `Failed to generate rejection messages: ${errorMessage}` }, { status: 500 })
  }
}
