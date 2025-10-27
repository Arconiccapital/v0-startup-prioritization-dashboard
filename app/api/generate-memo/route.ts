import { NextRequest, NextResponse } from "next/server"
import { generateMemoSections } from "@/lib/investment-memo-generator"
import type { Startup } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const startup: Startup = await request.json()

    if (!startup || !startup.id) {
      return NextResponse.json({ error: "Invalid startup data" }, { status: 400 })
    }

    console.log("[API] Generating memo for:", startup.name)

    const sections = await generateMemoSections(startup)

    console.log("[API] Memo generation completed for:", startup.name)

    return NextResponse.json({ sections }, { status: 200 })
  } catch (error) {
    console.error("[API] Error generating memo:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: `Failed to generate memo: ${errorMessage}` }, { status: 500 })
  }
}
