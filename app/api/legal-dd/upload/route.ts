import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const startupId = formData.get("startupId") as string
    const category = formData.get("category") as string
    const file = formData.get("file") as File | null

    if (!startupId || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Get existing startup
    const startup = await prisma.startup.findUnique({
      where: { id: startupId },
      select: { legalDiligence: true },
    })

    if (!startup) {
      return NextResponse.json({ error: "Startup not found" }, { status: 404 })
    }

    let extractedText = ""
    const fileName = file.name
    const fileType = file.type

    console.log("[Legal DD Upload] Processing file:", fileName, "Type:", fileType)

    // Extract text from PDF
    if (fileType === "application/pdf") {
      try {
        const pdfParse = require("pdf-parse-fork")
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const data = await pdfParse(buffer)
        extractedText = data.text
        console.log("[Legal DD Upload] Extracted", extractedText.length, "characters from PDF")
      } catch (pdfError) {
        console.error("[Legal DD Upload] PDF parsing error:", pdfError)
        return NextResponse.json(
          { error: `Failed to parse PDF: ${pdfError instanceof Error ? pdfError.message : "Unknown error"}` },
          { status: 500 }
        )
      }
    }
    // Handle Word documents (.docx)
    else if (fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      try {
        // For .docx, we'd need mammoth or similar - for now, inform user to use PDF
        return NextResponse.json(
          { error: "Please convert Word documents to PDF for text extraction" },
          { status: 400 }
        )
      } catch (docError) {
        console.error("[Legal DD Upload] Word doc parsing error:", docError)
      }
    }
    // Handle plain text
    else if (fileType === "text/plain") {
      const arrayBuffer = await file.arrayBuffer()
      extractedText = new TextDecoder().decode(arrayBuffer)
    }
    else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload PDF or TXT files." },
        { status: 400 }
      )
    }

    if (!extractedText) {
      return NextResponse.json(
        { error: "Could not extract text from the document" },
        { status: 400 }
      )
    }

    // Update legalDiligence with the uploaded document
    const currentData = (startup.legalDiligence as any) || {}
    const currentDocs = currentData.uploadedDocuments || {}

    const updatedDocs = {
      ...currentDocs,
      [category]: {
        fileName,
        fileType,
        text: extractedText,
        uploadedAt: new Date().toISOString(),
        characterCount: extractedText.length,
        wordCount: extractedText.split(/\s+/).length,
      },
    }

    const updatedLegalDiligence = {
      ...currentData,
      uploadedDocuments: updatedDocs,
    }

    await prisma.startup.update({
      where: { id: startupId },
      data: { legalDiligence: updatedLegalDiligence },
    })

    console.log("[Legal DD Upload] Document uploaded successfully:", fileName, "to category:", category)

    return NextResponse.json({
      message: "Document uploaded successfully",
      fileName,
      category,
      characterCount: extractedText.length,
      wordCount: extractedText.split(/\s+/).length,
    }, { status: 200 })
  } catch (error) {
    console.error("[Legal DD Upload] Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: `Failed to upload document: ${errorMessage}` },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve uploaded documents
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startupId = searchParams.get("startupId")
    const category = searchParams.get("category")

    if (!startupId) {
      return NextResponse.json({ error: "Missing startupId" }, { status: 400 })
    }

    const startup = await prisma.startup.findUnique({
      where: { id: startupId },
      select: { legalDiligence: true },
    })

    if (!startup) {
      return NextResponse.json({ error: "Startup not found" }, { status: 404 })
    }

    const legalDiligence = (startup.legalDiligence as any) || {}
    const uploadedDocuments = legalDiligence.uploadedDocuments || {}

    if (category) {
      return NextResponse.json({ document: uploadedDocuments[category] || null })
    }

    return NextResponse.json({ documents: uploadedDocuments })
  } catch (error) {
    console.error("[Legal DD Upload] GET Error:", error)
    return NextResponse.json({ error: "Failed to retrieve documents" }, { status: 500 })
  }
}

// DELETE endpoint to remove uploaded document
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startupId = searchParams.get("startupId")
    const category = searchParams.get("category")

    if (!startupId || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const startup = await prisma.startup.findUnique({
      where: { id: startupId },
      select: { legalDiligence: true },
    })

    if (!startup) {
      return NextResponse.json({ error: "Startup not found" }, { status: 404 })
    }

    const currentData = (startup.legalDiligence as any) || {}
    const currentDocs = { ...(currentData.uploadedDocuments || {}) }

    delete currentDocs[category]

    const updatedLegalDiligence = {
      ...currentData,
      uploadedDocuments: currentDocs,
    }

    await prisma.startup.update({
      where: { id: startupId },
      data: { legalDiligence: updatedLegalDiligence },
    })

    return NextResponse.json({ message: "Document deleted successfully" })
  } catch (error) {
    console.error("[Legal DD Upload] DELETE Error:", error)
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 })
  }
}
