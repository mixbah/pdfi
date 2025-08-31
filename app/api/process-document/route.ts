import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { getDatabase } from "@/lib/mongodb"
import type { ProcessedDocument } from "@/lib/models/document"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    console.log("[v0] API: Processing document request")

    console.log("[v0] API: Environment check - GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY)
    console.log("[v0] API: Environment check - GEMINI_API_KEY length:", process.env.GEMINI_API_KEY?.length || 0)

    if (!process.env.GEMINI_API_KEY) {
      console.error("[v0] API: Gemini API key not configured")
      return NextResponse.json(
        { error: "Gemini API key not configured. Please add GEMINI_API_KEY to your environment variables." },
        { status: 500 },
      )
    }

    console.log("[v0] API: Initializing Gemini AI with key")
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      console.error("[v0] API: No file provided")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("[v0] API: File received:", file.name, "Type:", file.type, "Size:", file.size)

    console.log("[v0] API: Initializing Gemini model")
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    let summary = ""

    if (file.type === "application/pdf") {
      console.log("[v0] API: Processing PDF file")
      // For PDF files, convert to base64 and process
      const bytes = await file.arrayBuffer()
      const base64 = Buffer.from(bytes).toString("base64")

      console.log("[v0] API: Sending PDF to Gemini, size:", base64.length)
      const result = await model.generateContent([
        {
          inlineData: {
            data: base64,
            mimeType: file.type,
          },
        },
        "Please provide a comprehensive summary of this PDF document. Include the main topics, key points, and important details. Make the summary clear and well-structured.",
      ])

      summary = result.response.text()
      console.log("[v0] API: PDF summary generated, length:", summary.length)
    } else if (file.type.startsWith("image/")) {
      console.log("[v0] API: Processing image file")
      // For image files
      const bytes = await file.arrayBuffer()
      const base64 = Buffer.from(bytes).toString("base64")

      console.log("[v0] API: Sending image to Gemini, size:", base64.length)
      const result = await model.generateContent([
        {
          inlineData: {
            data: base64,
            mimeType: file.type,
          },
        },
        "Please analyze this image and provide a detailed description. Include any text you can read, objects you can identify, and the overall context or purpose of the image.",
      ])

      summary = result.response.text()
      console.log("[v0] API: Image summary generated, length:", summary.length)
    } else {
      console.error("[v0] API: Unsupported file type:", file.type)
      return NextResponse.json({ error: "Unsupported file type. Please upload PDF or image files." }, { status: 400 })
    }

    try {
      console.log("[v0] API: Saving document to MongoDB")
      const db = await getDatabase()
      const collection = db.collection<ProcessedDocument>("processed_documents")

      const processingTime = Date.now() - startTime
      const document: ProcessedDocument = {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        summary,
        processedAt: new Date(),
        processingTime,
      }

      const result = await collection.insertOne(document)
      console.log("[v0] API: Document saved with ID:", result.insertedId)
    } catch (dbError) {
      console.error("[v0] API: Error saving to MongoDB:", dbError)
      // Continue with response even if DB save fails
    }

    console.log("[v0] API: Returning successful response")
    return NextResponse.json({ summary }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("[v0] API: Error processing document:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      { error: `Failed to process document: ${errorMessage}` },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    )
  }
}
