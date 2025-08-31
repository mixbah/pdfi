import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import type { ProcessedDocument, DocumentHistory } from "@/lib/models/document"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] API: Fetching document history")

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    const db = await getDatabase()
    const collection = db.collection<ProcessedDocument>("processed_documents")

    // Get total count
    const total = await collection.countDocuments()

    // Get paginated documents, sorted by most recent first
    const rawDocuments = await collection.find({}).sort({ processedAt: -1 }).skip(skip).limit(limit).toArray()

    const documents = rawDocuments.map((doc: any) => ({
      _id: typeof doc._id === "string" ? doc._id : (doc._id?.toString?.() ?? String(doc._id)),
      fileName: doc.fileName,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      summary: doc.summary,
      processedAt:
        typeof doc.processedAt === "string"
          ? doc.processedAt
          : (doc.processedAt?.toISOString?.() ?? new Date(doc.processedAt).toISOString()),
      processingTime: doc.processingTime,
    }))

    const history: DocumentHistory = {
      documents,
      total,
      page,
      limit,
    }

    console.log("[v0] API: Retrieved", documents.length, "documents from history")
    return NextResponse.json(history, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("[v0] API: Error fetching history:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      { error: `Failed to fetch history: ${errorMessage}` },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get("id")

    if (!documentId) {
      return NextResponse.json({ error: "Document ID required" }, { status: 400 })
    }

    console.log("[v0] API: Deleting document:", documentId)

    const db = await getDatabase()
    const collection = db.collection<ProcessedDocument>("processed_documents")

    const result = await collection.deleteOne({ _id: new (await import("mongodb")).ObjectId(documentId) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    console.log("[v0] API: Document deleted successfully")
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("[v0] API: Error deleting document:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      { error: `Failed to delete document: ${errorMessage}` },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    )
  }
}
