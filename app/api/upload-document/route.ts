import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import pdf from "pdf-parse"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const startupId = formData.get("startupId") as string
    const docType = formData.get("docType") as "transcript" | "pitchDeck"
    const file = formData.get("file") as File | null
    const textContent = formData.get("textContent") as string | null

    if (!startupId || !docType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get existing startup
    const startup = await prisma.startup.findUnique({
      where: { id: startupId },
      select: { documents: true },
    })

    if (!startup) {
      return NextResponse.json({ error: "Startup not found" }, { status: 404 })
    }

    let extractedText = textContent || ""

    // If a PDF file was uploaded, extract text from it
    if (file && file.type === "application/pdf") {
      console.log("[API] Processing PDF file:", file.name)

      try {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const data = await pdf(buffer)
        extractedText = data.text

        console.log("[API] Extracted text length:", extractedText.length, "characters")
      } catch (pdfError) {
        console.error("[API] PDF parsing error:", pdfError)
        return NextResponse.json(
          { error: `Failed to parse PDF: ${pdfError instanceof Error ? pdfError.message : "Unknown error"}` },
          { status: 500 }
        )
      }
    }

    // If we still don't have content, return error
    if (!extractedText) {
      return NextResponse.json(
        { error: "No content provided. Please upload a PDF file or provide text." },
        { status: 400 }
      )
    }

    // Update startup with document content
    const currentDocs = (startup.documents as { transcript?: string; pitchDeck?: string }) || {}
    const updatedDocs = {
      ...currentDocs,
      [docType]: extractedText,
    }

    const updatedStartup = await prisma.startup.update({
      where: { id: startupId },
      data: { documents: updatedDocs },
    })

    console.log("[API] Document uploaded successfully for startup:", startupId)

    return NextResponse.json({
      message: "Document uploaded successfully",
      contentLength: extractedText.length,
      docType,
    }, { status: 200 })
  } catch (error) {
    console.error("[API] Upload document error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: `Failed to upload document: ${errorMessage}` },
      { status: 500 }
    )
  }
}
