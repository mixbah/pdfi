import type { ObjectId } from "mongodb"

export interface ProcessedDocument {
  _id?: ObjectId
  fileName: string
  fileType: string
  fileSize: number
  summary: string
  processedAt: Date
  processingTime: number
  userId?: string // For future user authentication
}

export interface DocumentHistory {
  documents: ProcessedDocument[]
  total: number
  page: number
  limit: number
}
